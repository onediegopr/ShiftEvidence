# Production Runtime Hardening v1

## Node runtime
- Requiere Node.js 22 o superior.
- La app usa `next start`.
- No es una app static-only.

## Next.js
- Rutas dinamicas server-rendered:
  - dashboard;
  - assessments;
  - report;
  - admin.
- API routes:
  - Better Auth;
  - evidence download;
  - report PDF download.

## Filesystem
- Evidence y PDF usan storage privado.
- No se expone path absoluto al frontend.
- Download valida session y ownership.
- `HOSTINGER_STORAGE_ROOT` debe estar fuera de `.next`.

## Better Auth
- `BETTER_AUTH_URL` debe coincidir con dominio real.
- `trustedOrigins` debe incluir el dominio productivo.
- No dejar localhost como production URL.

## Admin
- `ADMIN_EMAILS` fail-closed.
- No wildcards.
- Acceso server-side.

## Known warnings
- El proyecto tuvo warnings de Turbopack/NFT por filesystem tracing en servicios de storage.
- Hito 9 agrega `turbopackIgnore` en `process.cwd()` de storage para reducir tracing amplio.

## Audit findings
- `npm audit` reporta `xlsx` sin fix disponible y `postcss` via Next con fix sugerido breaking.
- No se aplico `npm audit fix --force` para evitar downgrade/breaking change.
- Mitigacion actual de `xlsx`: uploads autenticados, privados, limite de tamano y parser server-side.
