# HITO RELEASE-PREP-1 - Controlled Push & Deployment Decision Plan

## Objetivo

Preparar una decision controlada para el batch local de hardening antes de ejecutar push, deploy o migracion de produccion.

Este hito no ejecuta release. Solo documenta estado, validaciones, riesgos, opciones y recomendacion.

## Estado Git actual

- Branch: `main`
- HEAD inicial: `a16bd6b fix: handle malformed password reset JSON`
- Ahead/behind inicial: `main...origin/main [ahead 16]`
- Working tree inicial: limpio
- Stash: preservado, no aplicado
- Push realizado: NO
- Production deploy: NO
- Production migration applied: NO
- Production launched: NO

## Commits locales pendientes

- `37dd85d` - `chore: add basic HTTP security headers`
- `248b062` - `fix: revoke sessions after password reset`
- `0ccc422` - `fix: normalize admin email authorization`
- `ea58c9b` - `fix: harden AI advisory JSON handling`
- `c42eae5` - `fix: add text input length guards`
- `70f5d42` - `fix: contain local storage paths`
- `66a283b` - `feat: add critical API rate limiting`
- `2bec15c` - `chore: add CSP report-only baseline`
- `209326d` - `fix: paginate admin list APIs`
- `adbaf2e` - `perf: add high-value database indexes`
- `82dbf5f` - `chore: add structured server logging baseline`
- `527f522` - `test: add minimal unit test baseline`
- `b6ef266` - `docs: record localhost recovery after hardening batch`
- `c03bafa` - `docs: audit post-hardening technical regression`
- `f5beca6` - `docs: audit post-hardening product QA`
- `a16bd6b` - `fix: handle malformed password reset JSON`

## Validaciones finales

- `npm run test:run`: OK, 7 archivos / 27 tests.
- `npm run lint`: OK, 0 errores, 10 warnings preexistentes de `<img>`.
- `npm run typecheck`: OK.
- `npm run build`: OK.
- `npm run hostinger:diagnose`: OK.
- `npx prisma validate`: OK cargando `.env.local` solo dentro del proceso, sin imprimir valores.
- `npx prisma generate`: OK despues de liberar el lock local del proceso `next start`.
- `npm audit --audit-level=moderate`: 4 vulnerabilidades, 3 moderadas y 1 alta. No se ejecuto `npm audit fix`.

Notas:

- Build conserva el warning NFT conocido de Turbopack.
- `prisma generate` puede fallar con `EPERM` en Windows/OneDrive si `next start` mantiene bloqueado el engine Prisma. Se resuelve deteniendo solo el proceso local de Next y regenerando.

## Estado localhost

Localhost fue levantado de nuevo despues de la validacion Prisma.

Rutas basicas:

- `/`: `200 OK`
- `/shiftreadiness`: `200 OK`
- `/sign-in`: `200 OK`
- `/sign-up`: `200 OK`
- `/dashboard`: `307` a `/sign-in`
- `/dashboard/assessments`: `307` a `/sign-in`

Resultado: OK.

## Estado Hostinger / deploy automatico

Evidencia local revisada:

- `package.json` tiene scripts de build/start/deploy check, pero no define CI/CD automatico.
- `docs/hostinger-deployment-runbook-v1.md` describe comandos manuales recomendados.
- `docs/hostinger-production-access-gate.md` y documentos historicos muestran que el estado de Hostinger ha dependido de acceso hPanel/Node runtime/logs y validaciones manuales.
- No se encontro configuracion local concluyente que pruebe si `git push origin main` dispara deploy automatico.

Decision:

- Auto-deploy Hostinger al push: NO confirmado.
- Riesgo: si `main` esta conectado a deploy automatico, un push podria desplegar el batch completo sin haber configurado Upstash, sin haber aplicado migracion de indices y sin QA autenticada nueva.

## Estado de migracion produccion

Migracion pendiente:

- `prisma/migrations/20260529120000_add_high_value_query_indexes/migration.sql`

Contenido:

- Solo contiene `CREATE INDEX`.
- No contiene `DROP TABLE`.
- No contiene `DROP COLUMN`.
- No contiene `ALTER COLUMN`.
- No contiene `DELETE`.
- No contiene `UPDATE`.

Decision:

- Tipo: no destructiva.
- Production migration applied: NO.
- Recomendacion: aplicar solo en hito/deploy controlado con `prisma migrate deploy`, nunca `migrate dev` ni reset.

## Estado de Upstash

- `.env.example` contiene `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` sin valores reales.
- No se configuro Upstash real en este hito.
- El helper de rate limit detecta ausencia de variables y queda en modo fail-open.
- El fail-open esta documentado en `docs/hito-rate-limit-1-critical-api-rate-limiting-upstash.md`.

Decision:

- Upstash real: NO confirmado/configurado desde este entorno.
- Rate limiting efectivo: NO si faltan variables.
- Recomendacion: configurar Upstash antes de depender de rate limiting en produccion.

## Riesgos pendientes

### Upstash

- Rate limiting queda fail-open si faltan variables.
- No rompe la app, pero no protege endpoints hasta configurar Upstash real.

### xlsx / npm audit

- `xlsx` presenta vulnerabilidades de Prototype Pollution y ReDoS sin fix disponible.
- `postcss` aparece como vulnerabilidad moderada via dependencias de `next`/`better-auth`.
- `npm audit fix --force` sugiere un cambio rompedor a una version vieja de Next. No debe ejecutarse automaticamente.

### QA autenticada

- QA sin sesion paso correctamente.
- QA autenticada completa quedo limitada por falta de cuenta/sesion QA local en el hito anterior.
- Antes de deploy productivo conviene repetir usuario/admin/report/evidence con sesion real.

### CSP

- CSP esta en `Content-Security-Policy-Report-Only`.
- No bloquea recursos.
- Enforcement queda para un hito futuro.

### NFT / Turbopack

- Build pasa, pero conserva warning NFT conocido relacionado con trazado de `localStorageService`.

### EPERM local

- En Windows/OneDrive, `prisma generate` puede fallar si `next start` bloquea el engine Prisma.
- Mitigacion local: detener solo el proceso local de Next antes de generar Prisma.

## Opciones evaluadas

### Opcion A - Push only, no deploy manual

Ventajas:

- Sube el batch de hardening y deja Git remoto actualizado.
- No requiere aplicar migracion manual si no hay deploy.

Riesgos:

- No sirve si Hostinger despliega automaticamente desde `main`.
- Si auto-deploy existe, se convierte de hecho en deploy productivo no controlado.

Decision:

- Apta solo si se confirma primero que `push main` NO dispara deploy automatico.

### Opcion B - Configurar Upstash primero, luego push

Ventajas:

- Evita que rate limiting quede fail-open tras deploy.
- Reduce riesgo de abuso en endpoints sensibles.

Riesgos:

- Requiere acceso seguro a Hostinger/env vars.
- No resuelve por si solo migracion de indices ni QA autenticada.

Decision:

- Recomendada si el push puede disparar deploy o si se va a desplegar poco despues.

### Opcion C - Push + deploy controlado + migrate deploy

Ventajas:

- Lleva hardening completo a produccion.
- Aplica indices no destructivos.
- Permite smoke real post-deploy.

Riesgos:

- Requiere ventana/control de release.
- Requiere confirmar env vars, storage, logs, rollback y acceso admin/QA.
- Debe incluir `prisma migrate deploy` y smoke posterior.

Decision:

- Apta solo como hito separado de release controlado.

### Opcion D - No push todavia, resolver dependency risk primero

Ventajas:

- Evita avanzar con el riesgo `xlsx` pendiente.
- Permite decidir mitigacion antes de tocar remoto.

Riesgos:

- Retrasa hardening ya validado localmente.
- `xlsx` ya era riesgo de dependencia y no necesariamente fue introducido por este batch.

Decision:

- Recomendable si el owner decide que la vulnerabilidad `xlsx` bloquea cualquier avance.

## Recomendacion final

Camino recomendado: no ejecutar push todavia hasta confirmar explicitamente el comportamiento de Hostinger frente a `main`.

Secuencia recomendada:

1. Confirmar si `git push origin main` dispara auto-deploy en Hostinger.
2. Si NO dispara auto-deploy: ejecutar Opcion A en hito separado, con smoke local/remoto de Git solamente.
3. Si SI dispara auto-deploy: ejecutar Opcion B y luego Opcion C como release controlado.
4. Abrir hito `DEPENDENCY-RISK-1` para decidir mitigacion de `xlsx` antes de ampliar uso o habilitar trafico masivo.

Que NO hacer todavia:

- No hacer push a ciegas.
- No ejecutar deploy manual.
- No ejecutar `prisma migrate deploy`.
- No ejecutar `npm audit fix`.
- No configurar secrets desde este entorno sin proceso seguro.
- No declarar full public launch.

## Plan de rollback si se pushea y algo falla

Si se hace push y no hay deploy:

- Verificar `origin/main`.
- Verificar estado Git local/remoto.
- No tocar produccion.

Si se dispara deploy:

- Guardar logs antes de cambiar nada.
- Confirmar rutas publicas.
- Confirmar rutas privadas sin sesion.
- Confirmar auth.
- Confirmar dashboard.
- Confirmar admin sin sesion.
- Confirmar upload/download/report si hay cuenta QA.
- Si hay fallo de runtime, volver al ultimo commit estable mediante redeploy/rollback documentado.
- No ejecutar reset DB.
- No borrar storage.

Rollback recomendado:

- Codigo: redeploy del ultimo commit estable anterior al batch.
- Env vars: restaurar valores previos si el fallo fue de config.
- DB: no hacer reset; usar Neon PITR/snapshot solo con aprobacion explicita.
- Storage: no borrar; preservar logs y evidencia.

## Smoke tests recomendados post push/deploy

Publicos:

- `/`
- `/shiftreadiness`
- `/sign-in`
- `/sign-up`
- `/demo`
- `/sample-report`
- `/vmware-to-proxmox-readiness`

Privados sin sesion:

- `/dashboard`
- `/dashboard/assessments`
- `/dashboard/admin`

API/auth:

- Password reset request con email ficticio.
- Password reset confirm con token invalido.
- Password reset confirm con JSON malformado.

Autenticados:

- Login/logout usuario QA.
- Dashboard.
- Crear assessment.
- Context intake.
- Upload evidencia sintetica.
- Report preview.
- PDF generation/download.
- Admin dashboard.
- Admin audit.
- AI usage.

Infra:

- Headers security.
- CSP report-only.
- Logs runtime.
- Storage write/read/delete.
- Prisma migration status.
- HCDN/cache si aplica.

## Confirmaciones finales

- Push realizado: NO.
- Production deploy: NO.
- Production migration applied: NO.
- Production launched: NO.
