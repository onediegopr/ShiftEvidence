# AUTH-1-PROD - Controlled Password Recovery Migration + Deploy Decision

## Objetivo

Resolver de forma segura como aplicar la migracion productiva y desplegar password recovery sin romper produccion.

## Contexto

- Production launched: SI.
- Launch type: controlled production launch.
- Public launch: NO.
- HEAD local al inicio: `124947d feat: add password recovery account support`.
- `origin/main`: `5b559b9 docs: add production launch operating pack v1.0`.
- Working tree inicial: limpio.
- Password recovery esta implementado en codigo, pero no operativo en produccion.

## Gate A - Local / Git / Build

- Branch: `main`.
- HEAD: `124947d`.
- Working tree: limpio.
- Local commits pending: `124947d feat: add password recovery account support`.
- Node: `v22.22.0`.
- npm: `10.9.4`.
- `npm run hostinger:diagnose`: OK, sin imprimir secretos.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK.
- Warning: NFT/Turbopack conocido en `reportStorageService`.

Resultado: OK.

## Gate B - Migration Audit

Migration:

- `prisma/migrations/20260527190000_auth_password_recovery/migration.sql`.

La migracion:

- Crea tabla `PasswordResetRequest`.
- Agrega columnas `emailNormalized`, `emailHash`, `tokenHash`, `status`, `deliveryMode`, `expiresAt`, `usedAt`, `requestedIpHash`, `userAgentHash`.
- Crea unique index sobre `tokenHash`.
- Crea indices sobre `userId`, `emailHash`, `status`, `expiresAt`.
- Agrega FK opcional a `"user"("id")` con `ON DELETE SET NULL`.

Cambios destructivos:

- No `DROP TABLE`.
- No `DROP COLUMN`.
- No alteracion destructiva de tablas Better Auth existentes.
- No cambios destructivos en `user`, `account`, `session` o `verification`.

`npx prisma validate`:

- No pudo completarse porque `DATABASE_URL` no esta cargado en este entorno.
- No se imprimio ningun secreto.

Resultado: migracion no destructiva, apta para deploy controlado cuando el target DB este confirmado.

## Gate C - Migration Path Detection

Resultado de deteccion local:

- `DATABASE_URL`: ausente.
- `DIRECT_URL`: ausente.
- `BETTER_AUTH_SECRET`: ausente.
- `BETTER_AUTH_URL`: ausente.
- `NEXT_PUBLIC_APP_URL`: ausente.
- `HOSTINGER_STORAGE_ROOT`: ausente.
- `ADMIN_EMAILS`: ausente.
- `RESEND_API_KEY`: ausente.
- `EMAIL_FROM`: ausente.
- `npm run prisma:deploy`: presente.

Hostinger shell/app console:

- No disponible desde este entorno.

Auto-deploy on push:

- No confirmado desde este entorno.

Recommended path:

- PATH 3 - Blocked desde Codex.
- No migrar.
- No pushear `124947d`.
- Ejecutar migracion desde entorno productivo confirmado o cargar `DATABASE_URL` de forma segura antes de autorizar.

## Gate D - Migration Execution

- Authorization: no solicitada para ejecucion porque no hay target DB confirmado.
- Command: no ejecutado.
- Migration applied: NO.
- Errors: no hubo intento de migracion.

## Gate E - Push / Deploy

- Push performed: NO.
- Reason: el codigo de `124947d` depende de la tabla `PasswordResetRequest`; pushear antes de migrar puede dejar rutas de recovery fallando en produccion.
- Deploy performed: NO.

## Gate F - Route Smoke

No ejecutado post-deploy porque no hubo deploy.

## Gate G - Password Recovery Smoke

No ejecutado en produccion porque:

- migracion no aplicada;
- codigo no pusheado/desplegado;
- provider email no configurado/verificable desde Codex.

## Gate H - Auth Regression

No ejecutado post-deploy porque no hubo deploy.

La regresion local previa de AUTH-1 paso:

- typecheck OK;
- lint OK;
- build OK;
- rutas locales `/sign-in`, `/forgot-password`, `/reset-password` respondieron 200 en `next start`.

## Decision

Estado general: BLOQUEADO.

Motivo:

- No hay `DATABASE_URL` disponible en este entorno.
- No hay acceso Hostinger shell/app console desde Codex.
- No hay target DB productivo confirmado.
- No se debe pushear codigo que depende de una tabla no migrada.

Password recovery production operational: NO.

Controlled launch remains active: SI.

Public launch ready: NO.

## Next Action Required

Elegir una ruta:

1. Ejecutar en Hostinger, con target productivo confirmado:
   - `npm run prisma:deploy`
   - luego push/deploy controlado de `124947d`
   - smoke productivo.

2. Cargar `DATABASE_URL` productivo de forma segura en este entorno, sin imprimirlo, y autorizar:
   - `npm run prisma:deploy`
   - `npx prisma migrate status`
   - push/deploy controlado.

3. Mantener bloqueado:
   - no migrar;
   - no pushear `124947d`;
   - controlled launch sigue con soporte manual.

## Riesgos pendientes

- Password recovery no esta operativo en produccion.
- Public launch sigue bloqueado.
- Email provider real no esta configurado/verificable.
- Fallback manual sigue siendo el modo operativo para cuentas durante controlled launch.
