# Hotfix Local Routing / Runtime Recovery

## Contexto

The local ShiftReadiness app was reported as not working after several Hostinger deployment diagnostics. Production remains out of scope for this hotfix.

Current local baseline checked:

- Branch: `main`
- HEAD at start: `59de6c0 chore: add Hostinger build diagnostics`
- Node: `v22.22.0`
- npm: `10.9.4`

## Sintoma

The reported symptom was that the local web app did not load.

Initial local runtime check found no process listening on port `3000`.

This means `http://localhost:3000/`, `http://localhost:3000/shiftreadiness`, `http://localhost:3000/sign-in`, and `http://localhost:3000/dashboard` could not work until the local Next.js server was started.

## Causa raiz

No product routing defect was reproduced.

Root cause identified for this hotfix:

- The local Next.js runtime was not running on port `3000`.
- Build, routing, and production-like start work after starting the app normally.

Related known local issue:

- Windows/OneDrive can lock `.next` build artifacts and produce `EPERM unlink` errors. That issue was previously cleared by stopping local Node processes and deleting generated `.next` cache. It was not reproduced during this hotfix build.

## Archivos revisados

- `package.json`
- `next.config.mjs`
- `src/app/page.tsx`
- `src/views/LandingPage.tsx`
- `src/app/shiftreadiness/page.tsx`
- `src/views/ShiftReadinessPage.tsx`
- `src/app/sign-in/page.tsx`
- `src/app/dashboard/page.tsx`

## Archivos modificados

- `docs/hotfix-local-routing-runtime-recovery.md`

No product code was modified.

## Cambio aplicado

No application code change was required.

Operational recovery:

- Confirmed no stale process was listening on `3000`.
- Ran diagnostics, typecheck, lint, and build.
- Started the app with `npm run start -- -p 3000`.
- Validated local public and protected routes.

## Validaciones ejecutadas

- `npm run hostinger:diagnose`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK.
- `npm run start -- -p 3000`: OK.

Known warning:

- `next build` still emits a non-blocking Turbopack/NFT warning from `reportStorageService.ts` through the report download route.

## Resultado rutas locales

Production-like local server:

- `http://localhost:3000/`: `200 OK`.
- `http://localhost:3000/shiftreadiness`: `200 OK`.
- `http://localhost:3000/sign-in`: `200 OK`.
- `http://localhost:3000/dashboard`: `307 Temporary Redirect` to `/sign-in`, expected for a protected route without session.

HTML checks:

- Home contains `ShiftReadiness`.
- Home contains `Explore ShiftReadiness`.
- Home contains `href="/shiftreadiness"`.
- `/shiftreadiness` contains `ShiftReadiness`.
- `/shiftreadiness` contains `Infrastructure readiness before you migrate`.
- `/sign-in` contains sign-in/workspace content.

## Warnings conocidos

- Turbopack/NFT warning related to broad tracing from `reportStorageService.ts`.
- Windows/OneDrive may lock `.next` files if a dev/start process or browser profile keeps handles open.

## Que no se toco

- Hostinger.
- Deployment.
- Prisma migrations.
- Database schema.
- Auth internals.
- Storage logic.
- Parser logic.
- PDF/report logic.
- Admin/unlock logic.
- Checkout/payment features.
- Landing design or public copy.

## Riesgos pendientes

- Production still does not serve the real Next.js app until Hostinger Node runtime/domain association is corrected.
- If local fails again, first check whether a Next process is listening on `3000`.
- If build fails with `EPERM unlink` under `.next`, stop local Node processes and clear generated `.next` cache.

## Relacion con Hostinger

This hotfix is local only.

It does not resolve:

- Hostinger static HTML mismatch.
- Hostinger `Build failed`.
- Hostinger Node.js App configuration.
- Domain association for `https://shiftevidence.com`.

## Proximo paso recomendado

Keep local stable, then continue Hostinger diagnostics using the committed `npm run hostinger:diagnose` script from the real Hostinger Application Root.
