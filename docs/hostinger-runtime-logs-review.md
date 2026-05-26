# Hostinger Runtime Logs Review

Date: 2026-05-26

## Status

Status: **PENDING**

Real Hostinger runtime logs were not available from this environment.

## Logs To Review

Check Hostinger panel or SSH-accessible logs for:

- application start errors;
- Next.js runtime crashes;
- Prisma connection errors;
- Neon connection pool errors;
- Better Auth URL/session errors;
- filesystem permission errors;
- storage path resolution errors;
- upload write failures;
- secure download 403/404 anomalies;
- RVTools parser exceptions;
- PDF generation errors;
- report storage errors;
- admin route authorization errors;
- memory/runtime limits;
- module not found errors;
- SSL/domain redirect issues.

## Known Non-Blocking Warning To Watch

Local build currently reports a Turbopack/NFT warning:

- traced filesystem usage through `reportStorageService.ts`;
- route involved: secure report PDF download endpoint.

This has not blocked local build/start, but it should be watched on Hostinger.

## Result Matrix

| Check | Result |
| --- | --- |
| Logs accessible | Pending |
| App start logs clean | Pending |
| Critical runtime errors | Pending |
| Prisma errors | Pending |
| Auth errors | Pending |
| Storage errors | Pending |
| PDF errors | Pending |
| Admin errors | Pending |

## Actions If Critical Errors Appear

1. Stop the app process if it is crash-looping.
2. Preserve logs.
3. Do not reset Neon.
4. Do not delete storage.
5. Fix only the smallest runtime/deploy issue.
6. Rebuild and restart.
7. Re-run production smoke.
