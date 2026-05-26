# Hostinger Post-Deploy Rollback Notes

Date: 2026-05-26

## Purpose

Provide rollback guidance for ShiftReadiness after a Hostinger production deploy or smoke test failure.

## ROLLBACK 0 — Stop

Stop the Hostinger Node process if it is crash-looping or serving broken routes.

## ROLLBACK 1 — Code

Re-deploy the last known good commit. Do not force-push from production.

## ROLLBACK 2 — Environment

Restore previous environment variables if a new production value caused auth, storage, or runtime failures.

## ROLLBACK 3 — Storage

Do not delete the private storage root. If smoke artifacts were created, delete them through app soft-delete flows when possible.

## ROLLBACK 4 — Database

Do not run:

- `prisma migrate reset`
- `prisma db push --force-reset`
- manual truncates
- manual table drops

Use Neon point-in-time restore only after explicit approval.

## ROLLBACK 5 — Prisma

If `migrate deploy` fails, preserve the exact error output. Do not switch to `migrate dev` in production.

## ROLLBACK 6 — Auth

If auth fails, first verify `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, HTTPS, cookies, and domain settings.

## ROLLBACK 7 — Upload/PDF

If upload or PDF fails, verify `HOSTINGER_STORAGE_ROOT` permissions and path location. Do not move storage into `public`, `.next`, or `node_modules`.

## ROLLBACK 8 — Admin

If admin unlock fails, verify `ADMIN_EMAILS`. Empty or mismatched values must fail closed.

## ROLLBACK 9 — Logs

Save logs before making changes. Production smoke failures should be reproducible from logs plus the route/function that failed.
