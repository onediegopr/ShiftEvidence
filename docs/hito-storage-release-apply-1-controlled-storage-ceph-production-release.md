# HITO STORAGE-RELEASE-APPLY-1 - Controlled Storage/Ceph Production Release

## Executive Summary

Estado: `BLOQUEADO`.

El hito se detuvo antes de ejecutar migraciones productivas, deploy, restart o cualquier mutacion de DB porque el entorno disponible localmente no valida como ambiente de release productivo:

- `deploy:check` con `NODE_ENV=production` fallo por URLs apuntando a localhost;
- `HOSTINGER_STORAGE_ROOT` disponible localmente es relativo, no un path absoluto/persistente validado de Hostinger;
- no hay `HOSTINGER_API_TOKEN` disponible en el entorno;
- no hay canal remoto shell/API para ejecutar `npm ci`, build/restart/logs en Hostinger;
- no se pudo validar storage root real ni logs/restart desde este entorno.

Se ejecutaron validaciones locales no destructivas y smoke publico. No se ejecuto `prisma migrate deploy`.

## Git / Release

- Fecha: 2026-05-30.
- Branch: `main`.
- Commit release esperado: `7727316 docs: add storage release readiness plan`.
- `origin/main`: sincronizado con `main`.
- Working tree inicial: limpio.
- Stash preservado: `stash@{0}: On main: park beta invite docs before functional readiness`.
- Force push: no.
- Deploy: no ejecutado.
- Migraciones productivas: no ejecutadas.
- DB mutation: no ejecutada.

## Prerequisitos Operacionales

Declarados por el usuario como autorizados:

- Backup/PITR DB.
- Env vars reales en Hostinger.
- Storage root real y escribible.
- Autorizacion para verificar `migrate status`.
- Acceso a logs/restart.
- Smoke autenticado Storage/Ceph.
- Autorizacion para aplicar migraciones.

Disponibilidad verificable desde este entorno:

| Prerequisito | Resultado |
| --- | --- |
| Backup/PITR | No verificable desde shell local. |
| Env vars Hostinger reales | No verificable desde shell local. |
| Storage root Hostinger real | No verificable; env local usa root relativo. |
| Migrate status objetivo | No ejecutado porque el entorno de release no esta validado. |
| Logs/restart Hostinger | No disponible; `HOSTINGER_API_TOKEN` ausente y no hay remote shell configurado. |
| Smoke autenticado | No disponible desde esta sesion sin credenciales/sesion real. |

## Validaciones Locales Pre-Release

Comandos ejecutados:

```bash
git status -sb
git log --oneline -n 30
git log --oneline origin/main..HEAD
git log --oneline HEAD..origin/main
git stash list
git fetch origin
git log --oneline --left-right --graph origin/main...HEAD
npm run test:run
npm run lint
npm run typecheck
npx prisma validate
npx prisma generate
npm run build
npm run hostinger:diagnose
npm run deploy:check
```

Resultados:

- Git: limpio, sincronizado con `origin/main`, sin ahead/behind.
- `npm run test:run`: OK, 35 archivos / 150 tests.
- `npm run lint`: OK.
- `npm run typecheck`: OK.
- `npx prisma validate`: OK con `DATABASE_URL` dummy/local seguro.
- `npx prisma generate`: OK.
- `npm run build`: OK.
- `npm run hostinger:diagnose`: OK como diagnostico local no destructivo.
- `npm run deploy:check` sin `NODE_ENV=production`: OK local, requiredPresent `7/7`.
- `npm run deploy:check` con `NODE_ENV=production`: FAIL, bloqueante.

Fallo bloqueante de production env check:

```text
ERROR: Production URLs must not point to localhost.
WARNING: Production HOSTINGER_STORAGE_ROOT should be an absolute persistent path.
```

Build:

- Build local OK.
- Warning conocido de Turbopack/NFT en `next.config.mjs`.
- No bloqueo de `.next` en esta ejecucion.

## Env Vars / Storage Root

Estado seguro observado, sin imprimir secretos:

| Variable | Estado local |
| --- | --- |
| `DATABASE_URL` | Presente, no-local. |
| `BETTER_AUTH_SECRET` | Presente. |
| `BETTER_AUTH_URL` | Presente, local. |
| `NEXT_PUBLIC_APP_URL` | Presente, local. |
| `HOSTINGER_STORAGE_ROOT` | Presente, relativo. |
| `MAX_UPLOAD_SIZE_MB` | Presente. |
| `ADMIN_EMAILS` | Presente. |
| `AI_ADVISORY_ENABLED` | Presente. |
| `AI_ADVISORY_PROVIDER` | Presente. |
| `GEMINI_API_KEY` | Presente. |
| `OPENAI_API_KEY` | Ausente. |
| `HOSTINGER_API_TOKEN` | Ausente. |

Conclusion:

- El entorno local no debe tratarse como ambiente de release productivo.
- No se debe aplicar migracion productiva desde este entorno hasta cargar/validar el entorno correcto o ejecutar desde Hostinger/CI seguro.

## Migraciones

Migraciones esperadas para Storage/Ceph:

- `20260530120000_storage_1_destination_readiness_foundation`;
- `20260530133000_storage_2_analysis_fallback_statuses`.

Estado en este hito:

- `npx prisma migrate status`: no ejecutado contra ambiente objetivo.
- `npx prisma migrate deploy`: no ejecutado.
- Migraciones aplicadas: ninguna.
- Drift/errors: no evaluado contra DB objetivo porque el release se detuvo antes de conectar.

Motivo:

- El entorno disponible no valida como release environment real.
- No hay canal Hostinger/restart/logs verificable.

## Smoke Publico

Smoke publico no destructivo ejecutado contra `https://shiftevidence.com`:

| Ruta | Status | Assets Next | Storage/Ceph copy | Licensing copy |
| --- | ---: | --- | --- | --- |
| `/` | 200 | Si | Si | Si |
| `/shiftreadiness` | 200 | Si | Si | Si |
| `/sign-in` | 200 | Si | No | No |
| `/sign-up` | 200 | Si | No | No |
| `/sample-report` | 200 | Si | Si | No |

Resultado:

- Runtime publico responde 200.
- Assets `/_next/*` detectados.
- Landing publica ya muestra Storage/Ceph y Licensing en rutas relevantes.

## Smoke Autenticado / Storage / Ceph / PDF

No ejecutado.

Motivos:

- No se aplicaron migraciones.
- No se ejecuto release/restart.
- No hay sesion autenticada/credenciales provistas en esta sesion.
- No hay canal Hostinger/logs/restart disponible.

Pendiente para `STORAGE-RELEASE-APPLY-1` cuando exista entorno operativo real:

- login;
- dashboard;
- assessments;
- Completion Center;
- tab `Storage`;
- Storage Context Intelligence;
- Ceph Suitability evaluation;
- report preview;
- PDF;
- admin dashboard/pricing;
- logs.

## Logs / Monitoring

No revisado.

Motivo:

- No hay canal remoto Hostinger/API/shell disponible desde esta sesion.
- `HOSTINGER_API_TOKEN` ausente.

## Hallazgos

Clasificacion:

- P0: ninguno detectado en publico.
- P1: ninguno detectado en publico.
- P2: release bloqueado por entorno operativo incompleto.
- P3: no evaluado.

Hallazgo bloqueante:

- El entorno local no es apto para ejecutar release productivo: URLs locales y storage root relativo en production check.

## Rollback

Rollback usado: no.

Motivo:

- No se ejecuto migracion.
- No se hizo deploy.
- No hubo mutacion DB.
- No hubo restart.

Rollback plan sigue siendo:

- app rollback si runtime falla despues de un release real;
- DB forward preferido porque migraciones son aditivas;
- restore DB solo ante dano severo;
- hotfix/fallback si Storage/PDF falla;
- no borrar storage ni evidence.

## Estado Final

- Estado del hito: `BLOQUEADO`.
- Production status final: sin cambios.
- Storage production readiness: sin cambio, permanece pendiente de migracion objetivo.
- Storage release confidence: validaciones locales OK, pero release operativo bloqueado hasta entorno real.
- Full public launch: no declarado.

## Proximo Paso Recomendado

Antes de reintentar `STORAGE-RELEASE-APPLY-1`, ejecutar desde un entorno real de release o proveer un canal verificable:

1. Hostinger shell/panel/API/restart disponible.
2. Env vars productivas reales cargadas en ese entorno.
3. `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL` apuntando al dominio real.
4. `HOSTINGER_STORAGE_ROOT` absoluto y persistente.
5. `npx prisma migrate status` contra DB objetivo.
6. Backup/PITR confirmado con timestamp.
7. Smoke autenticado/admin disponible.

Solo despues de eso aplicar:

```bash
npx prisma migrate deploy
```

No se debe usar `db push` ni `migrate reset`.
