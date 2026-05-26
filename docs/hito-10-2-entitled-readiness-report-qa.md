# HITO 10.2 — Entitled Readiness Report QA + Manual Visual PDF Review

## Objetivo

Validate the local entitled `readiness_report` flow after HITO 10 PDF hardening and HITO 10.1 free-preview QA.

This hito focused on:

- confirming free-preview baseline still works;
- confirming full report remains locked without entitlement;
- granting a local QA entitlement;
- generating and downloading a full `readiness_report`;
- checking report history and secure download behavior;
- documenting manual visual review status.

## Contexto

- Branch: `main`
- Starting HEAD: `ac42bdc fix: stabilize post-push public UX UI`
- Hostinger: paused
- Production launched: NO
- No deploy was executed.
- No Prisma migration was executed.
- No DB schema change was made.

## Entorno local

- Node: `v22.22.0`
- npm: `10.9.4`
- `.env.local`: present
- Local server: `npm run start -- -p 3000`
- Technical validations before QA:
  - `npm run hostinger:diagnose`: OK, env vars reported absent by design because the diagnostic does not load `.env.local`.
  - `npm run typecheck`: OK
  - `npm run lint`: OK
  - `npm run build`: OK

Base route validation:

- `/`: `200`
- `/shiftreadiness`: `200`
- `/sign-in`: `200`
- `/sign-up`: `200`
- `/dashboard`: `307` to `/sign-in` without session
- `/dashboard/assessments`: `307` to `/sign-in` without session

## Assessments usados

### Assessment incompleto

- ID: `cmpmqm6vw0001iznkafru48ff`
- Title: `HITO 10.1 QA - Incomplete Evidence`
- Evidence files: `0`
- Parsed inventory: none
- Assessment score: none
- Entitlements: locked

Outcome:

- Generating from the report route produced `free_preview`.
- Download returned a valid PDF artifact.
- The PDF remained valid with sparse evidence and did not crash.

### Assessment con inventario parseado

- ID: `cmpmqm8jh000ciznkuq9rnn5t`
- Title: `HITO 10.1 QA - Parsed Inventory`
- Evidence files: `1`
- Parsed VMs: `4`
- Parsed hosts: `2`
- Parsed datastores: `2`
- Parsed snapshots: `2`
- Risk findings: `3`
- Score: readiness `72`, confidence `68`, risk `medium`

Outcome:

- Free-preview generation worked before entitlement.
- Local entitlement was granted.
- Full `readiness_report` generation worked after entitlement.

## Free-preview baseline

Validated on `cmpmqm8jh000ciznkuq9rnn5t` before granting entitlement:

- Report page loaded with session cookie.
- Commercial status showed Free Preview.
- Full Readiness Report was locked.
- Locked sections were visible.
- Generate action returned `303` to the report page.
- New report was created with `reportType = free_preview`.
- Download returned `200`.
- No-session download returned `307` to `/sign-in`.

Generated preview report:

- ID: `cmpmtjsx2000bizvw0dittlhv`
- Type: `free_preview`
- Status: `generated`
- Size: `34637` bytes
- Header: `%PDF-1.3`
- PDF EOF marker: present
- Page count marker: `33`

## Manual visual review preview PDF

Preview PDF path:

- `C:\Users\diego\AppData\Local\Temp\hito10-2-preview-cmpmtjsx2000bizvw0dittlhv.pdf`

Validation performed:

- File downloaded through authenticated route.
- File opened through the OS default PDF handler.
- PDF header and EOF marker were valid.
- Decoded PDF streams confirmed required content sections.

Validated sections by decoded PDF stream text:

- ShiftReadiness
- VMware to Proxmox Readiness Assessment
- Executive Summary
- Evidence Overview
- Evidence Received
- Evidence Missing
- Readiness
- Confidence
- Environment Summary
- Top Findings
- VM Risk Matrix
- Migration Wave Preview
- Required Validations
- Next Evidence to Collect
- Next Steps
- Confidential / evidence-based disclaimer

Limitation:

- The agent could open the desktop viewer, but could not reliably bring the PDF window to the foreground for a screenshot because another foreground app remained active.
- Edge headless screenshots of local PDFs rendered blank pages and were not used as visual evidence.
- A final human visual pass in the desktop viewer is still recommended before claiming strict manual visual QA completion.

## Locked state QA

Before entitlement:

- `full_report_unlocked`: `locked`
- `storage_readiness_unlocked`: `locked`
- `pro_matrix_unlocked`: `locked`
- `review_call_unlocked`: `locked`

Validated:

- Full report was not generated without entitlement.
- Generate route produced `free_preview`.
- UI showed locked sections.
- UI showed upgrade/manual unlock CTAs.
- No direct mechanism was found to force `readiness_report` without entitlement.
- No-session download redirected to `/sign-in`.

Additional sparse assessment check:

- Generating against `cmpmqm6vw0001iznkafru48ff` without entitlement produced `free_preview`, not `readiness_report`.

## Entitlement setup

Method used:

- Local DB QA operation using existing models and existing entitlement semantics.
- No schema change.
- No migration.
- No production data.

Created/updated:

- Unlock request ID: `cmpmtmse30001izh8sglt0ckm`
- Requested type: `readiness_report`
- Status: `fulfilled`
- Entitlement: `full_report_unlocked`
- Entitlement status: `granted`
- Source: `manual_unlock:readiness_report`

Audit events were created for:

- `unlock_request_created`
- `unlock_request_approved`
- `unlock_request_fulfilled`
- `entitlement_granted`

## Full readiness_report QA

After entitlement:

- Report page showed `Readiness Report: Unlocked`.
- Generate button changed to `Generate Readiness Report PDF`.
- Commercial status showed `Readiness Report unlocked`.
- Full report card showed `Unlocked`.
- Report history listed `Readiness Report`.

Generated full report:

- ID: `cmpmtz69a0007izm8zqurrb1t`
- Type: `readiness_report`
- Status: `generated`
- Filename: `ShiftReadiness_HITO_10.1_QA_-_Parsed_Inventory_Readiness_Report.pdf`
- Size: `34621` bytes
- Header: `%PDF-1.3`
- PDF EOF marker: present
- Page count marker: `33`

Download:

- Authenticated owner download: `200`
- No-session download: `307` to `/sign-in`
- Assessment/report mismatch: `404`

## Manual visual review full PDF

Full PDF path:

- `C:\Users\diego\AppData\Local\Temp\hito10-2-full-cmpmtz69a0007izm8zqurrb1t.pdf`

Validation performed:

- File downloaded through authenticated route.
- File opened through the OS default PDF handler.
- PDF header and EOF marker were valid.
- Decoded PDF streams confirmed required content sections.

Validated sections by decoded PDF stream text:

- ShiftReadiness
- VMware to Proxmox Readiness Assessment
- Executive Summary
- Evidence Overview
- Evidence Received
- Evidence Missing
- Readiness
- Confidence
- Environment Summary
- Top Findings
- VM Risk Matrix
- Migration Wave Preview
- Required Validations
- Next Evidence to Collect
- Next Steps
- Confidential / evidence-based disclaimer

Limitation:

- The agent could not independently inspect the foreground desktop PDF view because the PDF window could not be brought in front of the active browser window.
- Treat the visual quality check as structurally validated but not fully human-confirmed.

## Security/access QA

Validated:

- No session download redirects to `/sign-in`.
- Owner session can download generated reports.
- Invalid assessment/report pairing now returns `404`, not `500`.
- Full report generation requires `full_report_unlocked`.
- Sparse assessment without entitlement generates `free_preview`.
- Report history respects generated/deleted status and ownership-scoped download URLs.

## Bugs encontrados

### Secure download invalid ownership path returned 500

Symptom:

- Authenticated request with a mismatched assessment/report pair returned `500`.

Cause:

- `getReportForDownload` could throw before the route reached its existing file-read try/catch.

Fix:

- Wrapped report lookup in the download route.
- Return `404` for inaccessible or missing report lookup.

File:

- `src/app/api/assessments/[id]/reports/[reportId]/download/route.ts`

### Entitled UI still said full report was locked

Symptom:

- After `full_report_unlocked` was granted, generation correctly produced `readiness_report`, but report cards and hero copy still said full report was locked.

Cause:

- Some report preview UI state was hardcoded to locked instead of deriving from `commercialStatus.hasFullReportUnlocked`.

Fix:

- Added `fullReportStatus = unlocked | locked` to report preview data.
- Updated cards, hero copy and footer pill to reflect entitlement status.

Files:

- `src/server/reports/reportPreviewService.ts`
- `src/app/dashboard/assessments/[id]/report/page.tsx`

## Fixes aplicados

Files changed:

- `src/app/api/assessments/[id]/reports/[reportId]/download/route.ts`
- `src/app/dashboard/assessments/[id]/report/page.tsx`
- `src/server/reports/reportPreviewService.ts`

No Hostinger, deploy, Prisma migration, DB schema, parser, storage rewrite or checkout work was performed.

## Validaciones técnicas

Validated after fixes:

- `npm run typecheck`: OK
- `npm run lint`: OK
- `npm run build`: OK

Known warning:

- Turbopack/NFT warning remains for report storage tracing through `reportStorageService.ts`.
- This is the same known non-blocking warning from previous milestones.

## Riesgos pendientes

- Strict manual visual QA still needs a human foreground pass in a desktop PDF viewer.
- Preview and full PDFs currently share the same page count and mostly the same structure; entitlement controls report type and access, not a materially different PDF layout yet.
- Pro report, storage add-on and technical review entitlements remain locked and were not fully tested in this hito.
- Hostinger remains blocked by production env vars and storage configuration, especially `DATABASE_URL`.

## Decisión final

Functional entitlement QA is complete locally:

- locked state works;
- local entitlement grant works;
- full `readiness_report` generation works;
- full PDF download works;
- secure download is hardened;
- report history reflects generated full reports.

Strict manual visual review is partially complete:

- PDF files were opened and structurally inspected;
- a final human visual pass is still recommended before declaring manual visual QA fully closed.

## Próximo paso recomendado

Recommended:

- If strict visual sign-off is required: perform a human desktop PDF review of the downloaded preview and full PDFs.
- If functional QA is sufficient: proceed to the next local product QA hito.

Do not resume Hostinger until production env vars and storage path are ready.
