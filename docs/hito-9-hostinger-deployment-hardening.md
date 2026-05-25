# Hito 9 - Hostinger Deployment Hardening

## Objetivo
Preparar ShiftReadiness para correr de forma estable en Hostinger con Next.js App Router, Node.js runtime, Neon Postgres, Better Auth y storage persistente privado.

## Alcance
- Auditar scripts, versiones y runtime local.
- Agregar `engines.node >=22`.
- Agregar `prisma:deploy` para produccion.
- Agregar checks no destructivos de environment y storage.
- Documentar variables de entorno Hostinger.
- Documentar storage persistente fuera del build.
- Documentar estrategia Prisma/Neon para produccion.
- Documentar smoke tests y rollback.

## Avance
- Avance general antes del hito: 93%.
- Avance general despues del hito: 96%.
- Avance del hito: 100%.
- Justificacion: el proyecto queda deployment-ready con checks operativos, runbooks, build production-like y estrategia de rollback.

## Auditoria local
- Branch: `main`.
- Node: `v22.22.0`.
- npm: `10.9.4`.
- Next.js: `16.2.6`.
- Prisma CLI/Client: `6.19.3`.
- Storage services: evidence y reports usan `HOSTINGER_STORAGE_ROOT`.
- Download endpoints: autenticados y con ownership.
- Admin: protegido por `ADMIN_EMAILS`.

## Cambios operativos
- `package.json` incluye `engines.node`.
- `package.json` incluye `prisma:deploy`.
- `package.json` incluye `deploy:check`.
- `package.json` incluye `storage:check`.
- Storage services usan marca `turbopackIgnore` en `process.cwd()` para reducir tracing amplio.

## Validaciones
- `npm run deploy:check`: OK en local con `.env.local`.
- `NODE_ENV=production npm run deploy:check`: bloquea correctamente si URLs apuntan a localhost.
- `npm run storage:check`: OK.
- `npx prisma migrate status`: database schema up to date.
- `npm run build`: OK.

## Riesgos
- Hostinger debe soportar Node 22 o superior.
- `HOSTINGER_STORAGE_ROOT` debe ser path persistente absoluto.
- `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL` deben usar dominio real HTTPS.
- `DATABASE_URL` debe usar Neon con SSL.
- `ADMIN_EMAILS` debe configurarse sin wildcards.
- `npm audit` reporta vulnerabilidades conocidas en `xlsx` sin fix disponible y `postcss` via Next con fix sugerido breaking.

## Rollback
- Volver al build anterior en Hostinger.
- Restaurar variables previas si el runtime no levanta.
- No ejecutar `migrate reset`.
- Si una migracion productiva falla, restaurar Neon con point-in-time restore.
- Restaurar storage persistente desde backup si se pierde.

## Proximo hito
Recomendado: HITO 9.1 - Production smoke test on real Hostinger.
