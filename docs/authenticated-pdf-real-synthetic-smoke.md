# AUTHENTICATED-PDF-REAL-SYNTHETIC-SMOKE

## Objective
Validate that the PDF/report flow still works after branding, report quality, merge resolution and sample PDF regeneration, while keeping this milestone safe:

- no billing side effects
- no payments
- no DB-destructive actions
- no deploy
- no secrets exposed

## Environment
- Repo: `C:\Users\diego\OneDrive\PERSONAL\SHIFTEVIDENCE\infrashift`
- Branch: `feature/demo-funnel-2`
- HEAD: `5de57f282ebe4a744898af5646123712d0f05e75`
- Remote: `origin -> https://github.com/onediegopr/ShiftEvidence.git`
- Working tree: clean except preserved untracked assets already present before this milestone:
  - `images/shift-evidence-logo-transparent-1024.png`
  - `images/shift-evidence-logo-transparent-512.png`
  - `public/brand/_incoming/`

## Smoke Type
Partial milestone.

This run used:

- public HTTP smoke for demo/sample PDFs
- access-control smoke without session
- renderer-only synthetic PDF generation with a temporary local artifact

No authenticated browser/session was available in this environment, so the full UI-authenticated PDF download flow was not executed.

## Base Validation
All of these passed after rerunning sequentially:

- `npm run typecheck`
- `npm run lint`
- `npx vitest run tests/unit/reportPdfRenderer.test.ts tests/unit/demoWorkspace.test.ts tests/unit/billingPaymentOptions.test.ts`
- `npm run test:run`
- `npm run build`

Notes:

- An initial parallel run hit a Prisma file-lock / generated-client race.
- Re-running sequentially resolved it and the checks passed cleanly.

## Public PDF Baseline

### `GET /demo/reports/balanced-mid-market`
- HTTP status: `200`
- Content-Type: `application/pdf`
- Size: `14957` bytes
- Header: `%PDF`
- Page count: `7`

### `GET /sample-reports/proxmox-migration-readiness-sample-report.pdf`
- HTTP status: `200`
- Content-Type: `application/pdf`
- Size: `2685561` bytes
- Header: `%PDF`
- Page count: `23`

### `GET /sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf`
- HTTP status: `200`
- Content-Type: `application/pdf`
- Size: `2685561` bytes
- Header: `%PDF`
- Page count: `23`

## Access Control Without Session
Checked the main private surfaces without a session:

- `/dashboard` -> `307` redirect to `/sign-in`
- `/dashboard/assessments` -> `307` redirect to `/sign-in`
- `/dashboard/admin` -> `307` redirect to `/sign-in`
- `/dashboard/assessments/assessment-1/report` -> `307` redirect to `/sign-in`
- `POST /api/assessments/assessment-1/reports/generate` -> `303` redirect to `/sign-in`
- `GET /api/assessments/assessment-1/reports/report-1/download` -> `307` redirect to `/sign-in`

This confirms the private report surfaces do not become publicly downloadable without auth.

## Synthetic Renderer Smoke
A temporary local script generated a real PDF through `src/server/reports/reportPdfRenderer.ts` using fully synthetic data only.

Result:

- PDF header: `%PDF`
- Size: `37737` bytes
- Page count: `18`
- No customer data used

The temporary artifact was cleaned up after validation to keep the repo tidy.

## Section Coverage
The renderer and supporting tests cover the critical section families required by this milestone, including:

- Cover / branding
- Executive Summary
- Environment Overview
- Evidence Received / Evidence Overview
- Evidence Missing / Evidence Confidence
- Readiness Score
- Evidence Confidence Score
- VM Risk Matrix
- Storage Destination Readiness
- Licensing & Cost Exposure
- Business Continuity Risk
- Migration Recommendation Plan
- Pilot Candidates
- No-Go / Hold items
- Required Validations
- Assumptions
- Disclaimers
- CTA / Next Steps
- Page numbers

Important note:

- Binary PDF text extraction did not expose section titles reliably in this environment because the PDF content streams are compressed.
- So section presence here was validated by the renderer source path, the synthetic renderer run, and the existing unit coverage, not by visual PDF viewer QA.

## Security Scan
Searches were run for the usual red-flag terms.

Confirmed:

- no real `sk_live` or `whsec` secrets were printed
- only env-var names and synthetic placeholders appeared in code, docs, or tests
- `Lemon` is not active in the product UI; references are historical/removal docs or tests
- dangerous claims such as `zero downtime`, `guaranteed migration`, `guaranteed savings`, `automatic migration`, `no risk`, and `production safe` appear as negations, guardrails, or historical documentation, not as active product promises

## What Was Not Touched

- no DB schema changes
- no migrations
- no `db push`
- no billing behavior changes
- no payments
- no Stripe live activation
- no Wise activity
- no webhooks
- no env var edits
- no Hostinger or Vercel changes
- no deploy
- no force push
- no stash apply

## Risks Remaining

- Full authenticated browser/session PDF QA is still pending.
- Manual visual PDF QA is still pending.
- Stripe test-mode Price ID readiness remains a separate milestone.
- Authenticated admin billing smoke remains a separate milestone.

## Recommended Next Milestone
Proceed with the next authenticated browser-based PDF smoke when a controlled session is available, or continue with the Stripe test-mode smoke if that is the higher-priority blocker.

