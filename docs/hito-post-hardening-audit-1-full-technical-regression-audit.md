# HITO POST-HARDENING-AUDIT-1 - Full Technical Regression Audit

## Objetivo

Auditar integralmente los 13 commits locales de hardening acumulados antes de decidir push, deploy o migracion de produccion.

Este hito fue de auditoria. No se hicieron cambios funcionales, no se hizo push, no se hizo deploy y no se aplico migracion en produccion.

## Estado Git

- Branch: `main`
- HEAD inicial: `b6ef266 docs: record localhost recovery after hardening batch`
- Origin: `origin/main` en `454d564`
- Ahead/behind: `main...origin/main [ahead 13]`
- Working tree inicial: limpio
- Stash: preservado, no aplicado
- Push realizado: NO
- Production deploy: NO
- Production migration applied: NO
- Production launched: NO

## Commits locales auditados

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

## Validaciones ejecutadas

- `npx prisma validate`: OK cargando `.env.local` solo dentro del proceso, sin imprimir valores.
- `npx prisma generate`: OK cargando `.env.local` solo dentro del proceso, sin imprimir valores.
- `npm run test:run`: OK, 6 archivos / 25 tests.
- `npm run lint`: OK con 10 warnings preexistentes de `<img>`.
- `npm run typecheck`: OK.
- `npm run build`: OK.
- `npm run hostinger:diagnose`: OK.
- `npm audit --audit-level=moderate`: encontro 4 vulnerabilidades, 3 moderadas y 1 alta. No se ejecuto `npm audit fix`.

Notas operativas:

- `npx prisma validate` directo falla si no se carga `.env.local` en el proceso porque `DATABASE_URL` no esta en el shell. Esto es un tema de workflow local, no una regresion de schema.
- `npx prisma generate` fallo una vez con `EPERM` por lock local de Windows/OneDrive mientras `next start` mantenia activo el motor Prisma. Se detuvo solo el proceso local de Next y la generacion paso correctamente.
- El build conserva el warning NFT conocido de Turbopack. No es bloqueante.

## Auditoria por area

### Config, headers y CSP

Revisado: `next.config.mjs`.

- `reactStrictMode: true`: presente.
- `turbopack.root`: preservado.
- `X-Frame-Options: DENY`: presente.
- `X-Content-Type-Options: nosniff`: presente.
- `Referrer-Policy: strict-origin-when-cross-origin`: presente.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`: presente.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`: presente.
- HSTS no usa `preload`.
- CSP agregada como `Content-Security-Policy-Report-Only`.
- No hay `Content-Security-Policy` bloqueante.
- La CSP mantiene `unsafe-inline`, `unsafe-eval` y `https:` como baseline observacional conservadora.

Resultado: OK para audit/report-only. CSP enforcement queda pendiente para un hito futuro.

### Auth, password reset y admin auth

Revisado:

- `src/app/api/account-support/password-reset/request/route.ts`
- `src/app/api/account-support/password-reset/confirm/route.ts`
- `src/server/admin/adminAuth.ts`

Hallazgos:

- Password reset request mantiene respuesta generica para evitar enumeracion.
- Password reset confirm revoca sesiones con `tx.session.deleteMany({ where: { userId } })` dentro del flujo transaccional.
- Token hasheado, TTL y one-time use se preservan.
- Admin auth normaliza `ADMIN_EMAILS` y email de sesion con `trim().toLowerCase()`.
- El comportamiento fail-closed se conserva.

Resultado: OK.

### Rate limiting

Revisado:

- `src/server/security/rateLimit.ts`
- rutas de password reset y endpoints criticos protegidos.
- `.env.example`
- documentacion del hito de rate limit.

Hallazgos:

- Upstash se crea de forma diferida.
- Si `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` no estan configuradas, el modo queda deshabilitado/fail-open.
- El fail-open esta documentado y evita romper produccion antes de configurar infraestructura.
- Emails/tokens usados en keys se hashean con SHA-256.
- No se imprimen secrets.
- `.env.example` incluye variables Upstash vacias, sin valores reales.

Resultado: OK como preparacion. Rate limiting efectivo requiere configurar Upstash antes de un deploy productivo que dependa de esta capa.

### Input validation

Revisado:

- `src/server/validation/inputLimits.ts`
- flujos de assessment, workspace, perfil, contexto, notas admin, branding de reportes y requests publicos relacionados.

Hallazgos:

- Existen limites centralizados: company name 216, assessment title 288, textos medios 3600, contexto manual 9000, email 320, URL 2048, currency 12.
- Validacion server-side aplicada en flujos claros de texto libre.
- Se usa `trim()` donde corresponde.
- Errores son seguros y no exponen internals.
- No se cambio schema Prisma.

Resultado: OK.

### Storage

Revisado:

- `src/server/evidence/localStorageService.ts`
- `src/server/reports/reportStorageService.ts`
- tests de path containment.

Hallazgos:

- `resolveInsideStorageRoot` usa `path.resolve`.
- Rechaza paths absolutos externos.
- Rechaza traversal con `..`.
- Evita falsos positivos de prefijo como `/storage` versus `/storage2`.
- Funciona con separador del sistema para Windows/local y Hostinger/Linux.
- No se cambio `HOSTINGER_STORAGE_ROOT`.

Resultado: OK.

### AI Advisory

Revisado:

- `src/server/ai/aiAdvisoryClient.ts`
- tests de AI JSON.

Hallazgos:

- Se reemplazo truncado ciego de JSON serializado por reduccion semantica previa a `JSON.stringify`.
- Payloads grandes siguen siendo JSON parseable.
- `parseJsonText()` devuelve `null` ante texto invalido.
- El caller conserva fallback ante respuesta invalida.
- No se loguea payload completo ni respuesta completa del proveedor.
- No se llamo proveedor AI real durante esta auditoria.

Resultado: OK.

### Admin APIs

Revisado:

- `src/app/api/admin/ai/usage/route.ts`
- `src/app/api/admin/audit/route.ts`
- `src/server/admin/adminPagination.ts`
- `src/server/admin/adminOpsService.ts`
- `src/server/ai/aiUsageService.ts`

Hallazgos:

- APIs objetivo usan paginacion server-side.
- Default limit: 50.
- Max limit: 100.
- Orden estable por fecha descendente.
- `audit` usa `limit + 1` para `hasMore`.
- No se agrego `count()` costoso innecesario.
- Rutas admin siguen protegidas.

Resultado: OK.

### DB y migracion

Revisado:

- `prisma/schema.prisma`
- `prisma/migrations/20260529120000_add_high_value_query_indexes/migration.sql`

Hallazgos:

- La migracion solo contiene `CREATE INDEX`.
- No hay `DROP TABLE`, `DROP COLUMN`, `ALTER COLUMN`, `DELETE`, `UPDATE` ni cambios destructivos.
- No se cambio nombre/tipo de campos.
- No se aplico migracion en produccion.

Indices agregados:

- `Assessment`: `workspaceId, archivedAt, updatedAt`
- `Assessment`: `archivedAt, updatedAt`
- `EvidenceFile`: `assessmentId, deletedAt, uploadedAt`
- `EvidenceFile`: `processingStatus, deletedAt`
- `AuditEvent`: `createdAt`
- `AiUsageEvent`: `userId, createdAt`
- `AiUsageEvent`: `assessmentId, createdAt`
- `AiUsageEvent`: `provider, createdAt`
- `AiUsageEvent`: `status, createdAt`
- `Report`: `assessmentId, deletedAt, createdAt`
- `Report`: `status, deletedAt`

Resultado: OK local. Produccion requiere `prisma migrate deploy` en hito controlado.

### Logging

Revisado:

- `src/server/logging/logger.ts`
- usos server-side de `console.*`.

Hallazgos:

- Logger central estructurado implementado.
- Usa `console` internamente como salida compatible con Next/Hostinger.
- Redacta keys sensibles por nombre.
- Serializa `Error` de forma segura.
- Limita profundidad, arrays, strings y circular references.
- No quedan `console.log/warn/error` dispersos en server-side fuera del logger central.
- No se cambian respuestas API.

Resultado: OK.

### Tests

Revisado:

- `vitest.config.ts`
- `tests/unit/*`
- scripts en `package.json`.

Hallazgos:

- Vitest configurado con entorno `node`.
- `npm run test:run` ejecuta 6 archivos / 25 tests.
- Tests no usan DB real.
- Tests no llaman proveedores AI reales.
- Tests no usan Upstash real.
- Tests no requieren secrets reales.
- `.env.local` no fue tocado.

Resultado: OK como baseline minima. Cobertura profunda queda pendiente.

### Dependencies

Revisado:

- `package.json`
- `package-lock.json`
- `npm audit --audit-level=moderate`

Dependencias agregadas:

- `@upstash/redis`
- `@upstash/ratelimit`
- `vitest`

Resultado de `npm audit`:

- 4 vulnerabilidades: 3 moderadas, 1 alta.
- `xlsx`: alta, Prototype Pollution y ReDoS, sin fix disponible.
- `postcss`: moderada via cadena con `next`/`better-auth`.
- `npm audit fix --force` sugiere un downgrade/cambio inseguro a una version vieja de Next; no se ejecuto.

Resultado: requiere decision separada. No bloquea build, pero no conviene ignorarlo antes de deploy amplio.

### Localhost/runtime

Estado:

- `localhost:3000` activo.
- Proceso local Next activo despues de la recuperacion.
- No hubo conflicto de puerto.

Rutas:

- `/`: `200 OK`
- `/shiftreadiness`: `200 OK`
- `/sign-in`: `200 OK`
- `/sign-up`: `200 OK`
- `/dashboard`: `307` a `/sign-in`
- `/dashboard/assessments`: `307` a `/sign-in`

Headers en `/`:

- `x-frame-options`: presente.
- `x-content-type-options`: presente.
- `referrer-policy`: presente.
- `permissions-policy`: presente.
- `strict-transport-security`: presente.
- `content-security-policy-report-only`: presente.

Resultado: OK.

## Hallazgos

### Criticos

- Ninguno detectado.

### Altos

- `xlsx` presenta vulnerabilidades de Prototype Pollution y ReDoS sin fix disponible. Es relevante porque el producto procesa archivos XLSX/RVTools. Requiere hito separado para mitigacion o reemplazo controlado.

### Medios

- Rate limiting queda fail-open mientras Upstash no este configurado. Es intencional para no romper deploy, pero debe configurarse antes de depender de esta capa en produccion.
- La migracion de indices esta lista y es no destructiva, pero aun no fue aplicada en produccion.
- `postcss` aparece en `npm audit` via cadena de dependencias con `next`/`better-auth`. El fix automatico recomendado por npm es inseguro para este proyecto y no debe aplicarse sin analisis.

### Bajos

- Prisma CLI directo requiere cargar `.env.local` en el proceso local; si no, `DATABASE_URL` falta.
- `prisma generate` puede fallar con `EPERM` si `next start` mantiene locks en Windows/OneDrive.
- `npm run lint` conserva 10 warnings preexistentes de `<img>`.
- Build conserva warning NFT conocido de Turbopack.

### Informativos

- CSP esta en modo report-only, no enforcement.
- Tests son baseline minima, no suite completa.
- El batch local acumula muchos cambios: 13 commits antes de esta auditoria. Push/deploy deben ser controlados.

## Recomendacion sobre push

Veredicto: apto para push con condiciones.

Condiciones:

- Revisar y aceptar explicitamente que se subiran 13 commits tecnicos acumulados mas esta auditoria documental.
- No hacer deploy automatico sin plan si el repositorio dispara deploy al push.
- Si el push dispara deploy automatico, primero definir estrategia para migracion DB, Upstash y smoke tests.

## Recomendacion sobre deploy

Veredicto: no recomendado todavia como accion automatica sin plan controlado.

Condiciones minimas antes de deploy:

- Definir si el push dispara deploy en Hostinger.
- Configurar Upstash si se espera rate limiting efectivo.
- Planificar `prisma migrate deploy` para indices.
- Decidir mitigacion de `xlsx` o aceptar riesgo temporal documentado.
- Ejecutar smoke de produccion post-deploy.

## Recomendacion sobre migracion produccion

Veredicto: migracion tecnicamente apta, pero solo en ventana/control de deploy.

Condiciones:

- Ejecutar `prisma migrate deploy`, no `migrate dev`.
- Confirmar backup/rollback operativo de Neon.
- Verificar despues APIs admin, evidence listados y reportes.

## Riesgos pendientes

- Upstash real no configurado.
- Migracion DB de indices no aplicada en produccion.
- Vulnerabilidad `xlsx` sin fix disponible.
- Advisory `postcss` via dependencia transitoria.
- CSP enforcement futuro pendiente.
- Tests profundos de parser, scoring, reportes, PDF y flujos auth pendientes.
- Auditoria funcional completa pendiente.
- Warning NFT de Turbopack pendiente.

## Confirmaciones finales

- Push realizado: NO.
- Production deploy: NO.
- Production migration applied: NO.
- Production launched: NO.
