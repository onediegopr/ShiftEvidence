# Hito 9.1 — Production Smoke Test on Real Hostinger

Date: 2026-05-26

## Objective

Validate ShiftReadiness on a real Hostinger Node.js runtime with a production domain, production environment variables, persistent private storage, Neon migrations, Better Auth redirects, secure upload/download, PDF generation, report preview, and manual admin unlock flow.

## Scope

This hito is operational only:

- no product features;
- no checkout;
- no payment provider;
- no UI redesign;
- no database reset;
- no destructive migration.

## Current Status

Status: **PARCIAL**

Reason: real Hostinger access, production domain, app root, panel/SSH access, runtime logs, and restart controls were not available from this environment. Local pre-deploy checks passed, but real production smoke was not executed.

Follow-up: Hito 9.2 was attempted and stopped during initial audit for the same access gap plus an uncleared documentation working tree. Complete `docs/hostinger-production-access-gate.md` before reattempting a real Hostinger deployment smoke.

## Local Pre-Deploy Results

- Git branch: `main`
- HEAD: `8d06058`
- Working tree: clean before documentation updates
- `npm run lint`: OK
- `npm run typecheck`: OK
- `npm run build`: OK
- `npx prisma validate`: OK after loading `.env.local` into the process without printing values
- `npx prisma generate`: OK
- `npx prisma migrate status`: OK, database schema up to date
- `npm run deploy:check`: OK for local env
- `npm run storage:check`: OK for local configured storage
- `npm run start -- -p 3000`: OK locally
- Local `/`: 200
- Local `/shiftreadiness`: 200
- Local `/sign-in`: 200

Known build warning:

- Turbopack/NFT tracing warning from `reportStorageService.ts` through the secure report download route. This is documented as non-blocking and should be watched before production hardening is considered complete.

## Hostinger Execution Pending

The following must be executed on real Hostinger:

1. Configure production environment variables.
2. Create persistent storage outside the deployed app folder.
3. Run `npm ci` or `npm install`.
4. Run `npx prisma generate`.
5. Run `npx prisma migrate deploy`.
6. Run `npx prisma migrate status`.
7. Run `npm run build`.
8. Start the app with Hostinger Node runtime.
9. Verify HTTPS domain responses.
10. Execute the full functional smoke checklist.
11. Review Hostinger logs.

## Required Production Inputs

- Production domain.
- Hostinger app root.
- Hostinger persistent storage root.
- Node.js runtime version.
- App process start/restart method.
- Runtime log access.
- Admin email for `ADMIN_EMAILS`.
- Test user credentials or ability to create a test user.

## Rollback

If production smoke fails:

1. Stop the Hostinger Node app.
2. Revert the deployed code to the last known good commit.
3. Restore previous environment variables if changed.
4. Do not run `prisma migrate reset`.
5. Do not truncate Neon tables.
6. Preserve storage files unless a specific smoke-test artifact must be soft-deleted through the app.
7. Use Neon point-in-time restore only if an approved DB recovery is required.

## Next Hito

If real Hostinger smoke passes: move to `HITO 10 — Stripe / MercadoPago Checkout` or `HITO 10 — PDF Visual Hardening + Report Quality`.

If Hostinger smoke cannot be completed or fails: move to `HITO 9.2 — Production deployment fixes` or `HITO 9.2 — Hostinger storage/auth fix`.
