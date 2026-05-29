# HITO SECURITY-HEADERS-1 — Basic HTTP Security Headers

Date: 2026-05-29.

## Objective

Add conservative baseline HTTP security headers to the Next.js configuration for ShiftReadiness / InfraShift, without touching product logic, auth, dashboard, parser, PDF generation, AI Advisory, middleware, Hostinger configuration or UI.

## Files Modified

- `next.config.mjs`
- `docs/hito-security-headers-1-basic-http-security-headers.md`
- `src/components/Navbar.tsx` (lint-only internal navigation update from `<a>` to `next/link`; no label, class or visual change)
- `src/views/ShiftReadinessPage.tsx` (lint-only internal navigation update from `<a>` to `next/link`; no label, class or visual change)

## Headers Added

Applied globally through `next.config.mjs` `headers()`:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

## Conservative Decisions

- `Content-Security-Policy` was not added in this hito because the application uses Next.js assets, inline runtime behavior, auth flows, PDF/report routes and possible future analytics or integrations. CSP should be introduced separately with report-only testing first.
- HSTS `preload` was not added. Preload is intentionally delayed until domain/subdomain readiness and rollback implications are reviewed.
- HSTS was reduced to the requested conservative value: one year with `includeSubDomains`, without preload.

## Areas Not Touched

- No DB schema changes.
- No Prisma reset.
- No Hostinger configuration changes.
- No auth changes.
- No middleware changes.
- No dashboard/admin changes.
- No parser, PDF, AI Advisory or product logic changes.
- No UI/copy/design changes.
- No visual navigation changes; internal links were migrated to `next/link` only to satisfy the Next.js lint gate.
- No deploy.

## Validations

- `npm run hostinger:diagnose`: OK. Diagnostic does not print secret values and reported absent local environment variables as expected for the shell process.
- `npm run lint`: OK with existing `<img>` optimization warnings only.
- `npm run typecheck`: OK.
- `npm run build`: OK with the known Turbopack/NFT warning.
- Local route smoke:
  - `/`: 200
  - `/shiftreadiness`: 200
  - `/sign-in`: 200
  - `/sign-up`: 200
  - `/dashboard`: 307 to `/sign-in`
- Local header check with `curl -I http://localhost:3000/`: all configured headers present, including `Strict-Transport-Security: max-age=31536000; includeSubDomains`.

## Risks Pending

- CSP remains pending as a separate hardening hito.
- Rate limiting remains a separate security hito.
- The existing Turbopack/NFT warning is separate technical debt and is not addressed here.

## Final State

- Production deploy: NO.
- Production launched: NO.
