# HITO AUDIT-2 Integral Error, Inconsistency And Improvement Review

Date: 2026-05-28.

## Objective

Run a broad audit across the current ShiftReadiness codebase, public marketing pages, synthetic demo/report assets, docs, validation gates, local routes and production smoke checks.

Scope:

- public landing `/`;
- `/demo`;
- `/sample-report`;
- public synthetic PDF;
- `/vmware-to-proxmox-readiness`;
- auth/public route smoke;
- private route unauthenticated guards;
- report/PDF branding surface;
- docs consistency;
- static security/copy checks.

Out of scope:

- DB schema changes;
- Prisma reset;
- Hostinger config changes;
- OpenAI activation;
- full public launch declaration;
- destructive storage/data changes.

## Validation Results

- `npm run hostinger:diagnose`: OK. Local shell env is missing production vars, as expected; no secret values printed.
- `npm run ai:guardrails`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: initially failed on unused demo imports, fixed, then OK.
- `npm run build`: OK with known non-blocking Turbopack/NFT warning.
- `npx prisma validate`: OK after loading local `DATABASE_URL` into process without printing it.
- `npx prisma generate`: OK after stopping the local Next process that locked the Prisma query engine DLL, then restarting localhost.
- `npm run sample-report:generate`: OK.

Known warnings:

- Turbopack/NFT warning still traces `next.config.mjs -> reportStorageService -> report download route`. This is non-blocking but should be cleaned up in a future technical hardening pass.
- Prisma prints a major-version upgrade notice from `6.19.3` to `7.8.0`; not upgraded in this audit.

## Local Route Smoke

- `/`: 200.
- `/demo`: 200.
- `/sample-report`: 200.
- `/sample-reports/proxmox-migration-readiness-sample-report.pdf`: 200.
- `/vmware-to-proxmox-readiness`: 200.
- `/shiftreadiness`: 200.
- `/sign-in`: 200.
- `/dashboard`: 307 to `/sign-in`.
- `/dashboard/admin`: 307 to `/sign-in`.

## Production Smoke

Production routes responded without 500/503/504:

- `/`: 200, but clean URL remains HCDN cached with high age.
- `/demo?audit=bbb32a6`: 200.
- `/sample-report?audit=bbb32a6`: 200.
- `/sample-reports/proxmox-migration-readiness-sample-report.pdf?audit=bbb32a6`: 200.
- `/vmware-to-proxmox-readiness?audit=bbb32a6`: 200.
- `/shiftreadiness`: 200.
- `/sign-in`: 200.
- `/dashboard`: 307 to `/sign-in`.
- `/dashboard/admin`: 307 to `/sign-in`.

Cache note:

- HCDN still serves old clean-route HTML for some public paths until cache expiry or purge.
- Query-string smoke confirms fresh deploy content is available.

## Findings Fixed

### P1 - Lint Gate Broken

File:

- `src/components/demo/MigrationReadinessReplay.tsx`

Issue:

- Unused `Home` import and unused `demoDoesNotDo` import broke `npm run lint`.

Fix:

- Removed unused imports.

### P2 - Public Copy Risk Around Customer Claims

Files:

- `src/views/LandingPage.tsx`
- `docs/hito-industry-evaluations-landing-section.md`

Issue:

- `What our customers are saying` plus "reviews" could imply real customer testimonials, while the section is representative/anonymized-style and not a verified case study.

Fix:

- Changed title to `What private assessments reveal`.
- Replaced "reviews" language with conservative anonymized-style assessment wording.
- Updated disclaimer to explicitly exclude testimonials, verified customer reviews and public case studies.
- Replaced `Decrypt Case File` with `View evaluation` for enterprise-safe clarity.

### P2 - Obsolete CSS And Accessibility Gap

File:

- `src/index.css`

Issue:

- Old `.industry-evaluation-card` styles remained after the section was redesigned into `.case-dossier-card`.
- New dossier cards lacked a direct `:focus-visible` rule.
- Several `transition: all` declarations remained.

Fix:

- Removed obsolete `.industry-evaluation-card` style block.
- Added `.case-dossier-card:focus-visible`.
- Replaced `transition: all` with property-specific transitions.
- Updated mobile rule to target `.case-dossier-card`.

### P2 - Public Docs Stale About Sample PDF

Files:

- `README.md`
- `docs/launch-controlled-operating-pack.md`
- `docs/production-controlled-launch-decision.md`
- `docs/hito-demo-1-migration-readiness-replay.md`
- `docs/hito-sample-report-1-public-sample-report-foundation.md`

Issue:

- Several docs still described the public PDF as "coming soon" even though SAMPLE-REPORT-2 already made the PDF live.

Fix:

- Updated docs to state that the public synthetic PDF exists at `/sample-reports/proxmox-migration-readiness-sample-report.pdf`.

### P3 - Client Console Noise

File:

- `src/app/sign-up/page.tsx`

Issue:

- `console.error(err)` could expose noisy implementation detail in browser console for a handled sign-up/onboarding failure.

Fix:

- Removed console logging and kept the user-facing inline error.

## Static Security Checks

Searched code/docs/scripts/README for:

- `AIza`;
- `DATABASE_URL=`;
- `GEMINI_API_KEY=`;
- `OPENAI_API_KEY=`;
- `BETTER_AUTH_SECRET=`;
- `postgresql://`;
- `sk-`.

Result:

- No secret values found in modified files.
- Existing docs use placeholder env variable names only.
- No `.env` or `.env.local` changes.

## Copy And Claim Checks

Checked for:

- ACME references in active code;
- Spanish public copy in the industry section;
- old demo sound warning;
- `Sample PDF coming soon`;
- active dangerous claims.

Result:

- No active `ACME Manufacturing Group` references in `src`.
- `/demo` uses `Northbridge Industrial Group`.
- Public industry section copy is English and conservative.
- `/sample-report` uses real download CTA.
- Mentions of zero downtime / automation are negative boundary statements, not promises.

## Remaining Risks / Recommended Improvements

1. HCDN purge: clean public URLs may keep serving old cached HTML until cache expiry/purge.
2. Browser visual QA: Playwright automation timed out in this environment. Manual Chrome/browser review is still recommended for `/`, `/demo`, `/sample-report`, and the PDF.
3. Authenticated PDF logo QA: logo upload/white-label generation still needs a real signed-in assessment test with small PNG/JPG files.
4. Turbopack/NFT warning: isolate report storage filesystem tracing more cleanly in a later technical hardening pass.
5. Prisma major upgrade: plan separately; do not upgrade opportunistically during launch hardening.
6. Public/private positioning: keep the industry examples as representative/anonymized-style examples unless actual customer permission exists.

## Decision

- No P0 open.
- Lint gate restored.
- Localhost recovered and responding.
- Public route smoke OK.
- Private unauthenticated route guards OK.
- No secrets detected.
- Full public launch remains NO.
