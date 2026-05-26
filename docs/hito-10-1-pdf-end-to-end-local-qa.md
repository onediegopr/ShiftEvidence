# HITO 10.1 - PDF End-to-End Local QA

## Objetivo

Validate the real local dashboard flow for ShiftReadiness PDF generation, download, report history and secure access after the HITO 10 PDF visual hardening work.

Hostinger remains paused. No production deploy, DNS, hPanel, Prisma migration or DB schema work was performed.

## Contexto

HITO 10 hardened the PDF renderer and report structure, but the remaining gap was authenticated UI QA:

- generate PDF from `/dashboard/assessments/[id]/report`;
- download PDF through the secure API route;
- confirm report history updates;
- confirm sparse and populated assessments do not crash;
- validate locked/free-preview behavior;
- document any blockers or fixes.

## Entorno local

- Branch: `main`
- Initial HEAD: `91faa9b fix: clean up public UX UI polish`
- Local runtime: `npm run start -- -p 3000`
- Node: `v22.22.0`
- npm: `10.9.4`
- `.env.local`: present
- Local DB: available
- Hostinger: not touched
- Production launched: NO

`npm run hostinger:diagnose` remains useful as a structural diagnostic, but it intentionally does not load `.env.local`; it reported required env vars as absent even though the local runtime loaded them for build/start.

## Assessments usados

### Assessment incompleto

- ID: `cmpmqm6vw0001iznkafru48ff`
- Title: `HITO 10.1 QA - Incomplete Evidence`
- Evidence files: `0`
- Parsed VMs: `0`
- Risk findings: `0`
- Score: not available
- Expected behavior: PDF must generate without crashing and show conservative fallbacks / missing evidence.

### Assessment con inventario parseado

- ID: `cmpmqm8jh000ciznkuq9rnn5t`
- Title: `HITO 10.1 QA - Parsed Inventory`
- Evidence files: `1`
- Parsed VMs: `4`
- Parsed hosts: `2`
- Parsed datastores: `2`
- Parsed snapshots: `2`
- Risk findings: `3`
- Assessment score: readiness `72`, confidence `68`, risk `medium`
- Expected behavior: report preview must show inventory summary, findings, VM matrix and source/confidence signals.

## Report preview QA

Validated routes:

- `/dashboard/assessments/cmpmqm6vw0001iznkafru48ff/report`
- `/dashboard/assessments/cmpmqm8jh000ciznkuq9rnn5t/report`

Results:

- Authenticated report route loaded.
- Unowned assessment access returned `404`, confirming ownership boundaries.
- Incomplete assessment preview loaded with missing-evidence fallback.
- Parsed inventory assessment preview loaded with environment summary, findings and VM matrix.
- Locked sections remained visible as locked.
- Free preview commercial status remained active.
- No `[object Object]` output was found in the parsed inventory report HTML.

## PDF generation QA

Initial UI generation exposed two local production-like runtime issues:

1. The `Generate PDF Preview` form used a Server Action that failed under `next start` with `Failed to find Server Action`.
2. After routing generation through an API endpoint, PDFKit failed in the bundled runtime with `ENOENT: no such file or directory, open 'C:\ROOT\node_modules\pdfkit\js\data\Helvetica.afm'`.

Fixes applied:

- Replaced the PDF generation form submission with an authenticated POST route at `/api/assessments/[id]/reports/generate`.
- Switched the PDF renderer import to `pdfkit/js/pdfkit.standalone.js` so standard font data is bundled reliably.
- Added a minimal module declaration for the standalone PDFKit build.

Post-fix results:

- Incomplete assessment generation redirected to `?generated=1`.
- Parsed inventory assessment generation redirected to `?generated=1`.
- Report records were created with `status=generated`.
- Audit/report records were stored without schema changes.

## Download QA

Validated generated reports:

- Incomplete assessment report ID: `cmpmr3bv70007izmg2ffu6krx`
- Parsed inventory report ID: `cmpmr74am000tizmgxx66qyhz`

Results:

- Download API returned `200 OK` with `Content-Type: application/pdf`.
- Incomplete PDF size: `32592` bytes.
- Parsed inventory PDF size: `34637` bytes.
- Both files started with `%PDF-1.3`.
- Both files included a PDF catalog, xref table and EOF marker.
- Unauthenticated download request returned `307` to `/sign-in`.

## Visual review

Automated headless Chrome could not produce a useful screenshot of the local PDF file; the PDF viewer rendered a blank/dark screenshot in headless mode.

Structural and content validation still confirmed:

- PDF file opens as a valid PDF artifact based on header/catalog/xref/EOF checks.
- PDFKit generated a 33-page document for both sparse and parsed assessments.
- Decoded content streams include the expected professional report structure:
  - cover content with `SHIFTREADINESS`;
  - `Executive Summary`;
  - `Evidence Overview`;
  - environment summary;
  - readiness/confidence scoring;
  - findings;
  - VM risk matrix;
  - migration guidance;
  - required validations;
  - next evidence / next steps.

Manual visual review in a desktop PDF viewer is still recommended before using the report externally, because the automated environment could not visually inspect rendered pages.

## Report history

Validated:

- Generated report appears in the `Generated Reports` section.
- `Download PDF` appears for generated reports.
- Failed report attempts remain visible with failure status until deleted.
- Soft-delete was stabilized with an authenticated POST route at `/api/assessments/[id]/reports/[reportId]/delete`.
- A failed report was soft-deleted successfully and marked `status=deleted` with `deletedAt` populated.

## Locked/unlocked

Validated:

- Free preview generation is allowed without entitlement.
- Full readiness report remains locked without entitlement.
- Locked sections are visible as locked.
- Generated report type is `free_preview`.
- No full-report entitlement was granted during this QA.
- Full unlocked `readiness_report` PDF was not tested because no local entitlement flow was executed in this hito.

## Bugs encontrados

### Server Action generation failure

Symptom:

- UI click reached the server but failed with `Failed to find Server Action`.

Fix:

- Added authenticated Route Handler for PDF generation and changed the form to POST to that route.

### PDFKit standard font path failure

Symptom:

- PDF generation failed with `C:\ROOT\node_modules\pdfkit\js\data\Helvetica.afm`.

Fix:

- Switched to `pdfkit/js/pdfkit.standalone.js`.
- Added `src/types/pdfkit-standalone.d.ts`.

### Server Action delete risk

Symptom:

- Report history delete used the same Server Action pattern.

Fix:

- Added authenticated Route Handler for report soft-delete and changed the delete form to POST to that route.

## Fixes aplicados

Files changed:

- `src/app/dashboard/assessments/[id]/report/page.tsx`
- `src/app/api/assessments/[id]/reports/generate/route.ts`
- `src/app/api/assessments/[id]/reports/[reportId]/delete/route.ts`
- `src/server/reports/reportPdfRenderer.ts`
- `src/types/pdfkit-standalone.d.ts`

No DB schema, Prisma migrations, Hostinger config, parser rewrite, storage rewrite or checkout work was performed.

## Validaciones tecnicas

Validated during the hito:

- `npm run typecheck`: OK
- `npm run lint`: OK
- `npm run build`: OK
- `npm run start -- -p 3000`: OK
- `/`: `200`
- `/shiftreadiness`: `200`
- `/sign-in`: `200`
- `/sign-up`: `200`
- `/dashboard`: `307` to `/sign-in` without session

Known warning:

- Turbopack/NFT warning remains for the report storage trace. It is non-blocking and already known from earlier milestones.

## Riesgos pendientes

- Manual visual PDF review should still be performed in a desktop PDF viewer.
- Full unlocked `readiness_report` generation should be tested once a local entitlement is deliberately granted.
- Existing failed report records from pre-fix attempts may remain in local QA data unless manually deleted.
- Hostinger remains blocked by production env vars and storage configuration, especially `DATABASE_URL`.

## Decisión final

HITO 10.1 is complete for local free-preview PDF QA:

- real authenticated UI generation works;
- download works;
- secure access redirects without session;
- report history works;
- soft-delete works;
- sparse assessment works;
- parsed inventory assessment works;
- PDF artifact is valid.

HITO 10 can be considered functionally closed locally for the free-preview PDF path. Full entitled report QA remains a follow-up when local entitlement is intentionally enabled.

## Próximo paso recomendado

Recommended next hito:

- `HITO 10.2 - Entitled Readiness Report QA`

Alternative if returning to production:

- `HITO 9.2 - Hostinger env vars + storage gate completion`

## HITO 10.2 QA outcome

Follow-up HITO 10.2 executed the entitled local report path.

Validated:

- Free-preview generation remained stable.
- Sparse assessment without entitlement generated `free_preview`, not `readiness_report`.
- Parsed assessment with local entitlement generated `readiness_report`.
- Full report download worked with owner session.
- No-session download redirected to `/sign-in`.
- Invalid assessment/report pairing returned `404`.
- Report history showed both preview and readiness report entries.

Bugfixes applied in HITO 10.2:

- Secure report download now catches ownership/report lookup failures and returns `404`.
- Report preview UI now shows `Full report: Unlocked` when `full_report_unlocked` is granted.

Remaining note:

- A strict manual visual pass in a foreground desktop PDF viewer remains recommended. PDF files opened and decoded content was verified, but screenshot capture could not confirm visual layout because the PDF window did not become the active foreground window.
