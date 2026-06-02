# HITO DEMO-WORKSPACE-1B - Visual QA, PDF Smoke and Controlled Push

Date: 2026-06-02

## Objective

Close the Demo Workspace QA cycle for the local commit:

- `a934e6b feat: add read-only synthetic demo workspace`

The goal was to validate the read-only synthetic Demo Workspace, confirm public CTAs and demo PDF downloads, preserve unrelated billing/Prisma work, and push only Demo Workspace changes to `origin/main` if all acceptance checks passed.

## Git Preflight

Initial state:

- Branch: `main`
- Local status: ahead of `origin/main` by 1 commit
- Pending commit: `a934e6b feat: add read-only synthetic demo workspace`
- Remote behind: none detected before QA
- Push before QA: no

Unrelated changes were present before continuing:

- `prisma/schema.prisma`
- billing config and pricing files
- billing admin files
- retired billing-provider webhook and service deletions
- bank-transfer billing route work
- `prisma/migrations/20260602133000_billing_invoice_requests/`

Untracked logos were preserved outside the hito:

- `images/shift-evidence-logo-transparent-1024.png`
- `images/shift-evidence-logo-transparent-512.png`

## Billing/Prisma Work Preserved

The unrelated billing/Prisma work was parked in safe stashes so it would not be mixed with Demo Workspace:

- `stash@{0}: On main: park billing invoice migration before demo workspace push`
- `stash@{1}: On main: park remaining billing-prisma tracked changes before demo workspace push`
- `stash@{2}: On main: park billing-prisma build retry changes before demo workspace push`
- `stash@{3}: On main: park remaining billing UI changes before demo workspace push`
- `stash@{4}: On main: park billing-prisma changes before demo workspace push`

Notes:

- No billing/Prisma changes were deleted.
- No billing/Prisma changes were pushed.
- No DB, migrations, production environment, payment provider, or webhook was touched.
- The final Demo Workspace push scope was verified against `origin/main..HEAD`.

## Validations

Executed successfully after the billing/Prisma work was parked:

- `npx prisma validate`: passed
- `npx prisma generate`: passed
- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run test:run`: passed, 121 files / 603 tests
- `npm run build`: passed
- `npm run hostinger:diagnose`: passed safely

Known non-blocking warning:

- Turbopack/NFT warning involving `src/server/evidence/localStorageService.ts` and the file download route. This is the same historical warning and was not introduced by the Demo Workspace hito.

## Local Server Smoke

Local server:

- Command: `npm run start -- -p 3000`
- Port: `3000`

Routes validated by HTTP HEAD:

- `/demo`: 200
- `/`: 200
- `/shiftreadiness`: 200
- `/pricing`: 200
- `/sample-report`: 200
- `/vmware-to-proxmox-readiness`: 200

## Demo Workspace QA

The in-app browser and Chrome connector were attempted, but neither browser surface was available in this session. QA was therefore completed with rendered HTML checks, route checks, source checks, and PDF binary smoke.

Confirmed in `/demo` rendered HTML:

- Demo Workspace copy present
- read-only copy present
- synthetic data copy present
- not-real-company disclaimer present
- customer-data safety copy present
- Evidence received/missing sections present
- Top risks and recommendations present
- Migration waves present
- Senior AI Advisor demo transcript present
- Live chat disabled copy present
- No dangerous claims detected:
  - no zero downtime guarantee
  - no migration execution claim
  - no real AI advisor claim in demo
  - no free real infrastructure analysis claim

## Datasets Validated

The following 8 datasets were validated by fixture tests, rendered HTML, and PDF route smoke:

1. `balanced-mid-market`
2. `storage-risk-heavy`
3. `backup-evidence-missing`
4. `critical-sql-erp`
5. `proxmox-target-partial`
6. `msp-client-sample`
7. `low-evidence-low-confidence`
8. `enterprise-multisite`

Confirmed coverage:

- readable scenario name and description
- badges
- VM count
- readiness score
- confidence score
- evidence received/missing
- top risks
- recommendations
- migration waves
- synthetic Advisor transcript
- public demo PDF link
- synthetic/not-real-company disclaimer

## Demo PDF Smoke

All 8 demo report routes returned `200` and `application/pdf`:

| Scenario | Status | Content type | Size | Magic |
| --- | --- | --- | ---: | --- |
| `balanced-mid-market` | 200 | `application/pdf` | 4135 | `%PDF` |
| `storage-risk-heavy` | 200 | `application/pdf` | 4005 | `%PDF` |
| `backup-evidence-missing` | 200 | `application/pdf` | 3912 | `%PDF` |
| `critical-sql-erp` | 200 | `application/pdf` | 3995 | `%PDF` |
| `proxmox-target-partial` | 200 | `application/pdf` | 3816 | `%PDF` |
| `msp-client-sample` | 200 | `application/pdf` | 3808 | `%PDF` |
| `low-evidence-low-confidence` | 200 | `application/pdf` | 3890 | `%PDF` |
| `enterprise-multisite` | 200 | `application/pdf` | 4048 | `%PDF` |

Confirmed:

- No route returned HTML.
- No route returned 500.
- No Helvetica AFM error appeared after the standalone PDFKit import.
- PDF generator source includes:
  - `Shift Evidence Demo Workspace`
  - `Synthetic Demo Report`
  - `Generated from synthetic sample data. Not based on a real company or real infrastructure.`
  - `Synthetic transcript only. No Gemini/OpenAI provider call was made.`
  - `Demo Workspace is read-only. Uploads, edits, billing, admin and live AI Advisor are disabled.`

Text extraction limitation:

- Local PDF text extraction libraries were not available in this runtime.
- The PDFs are compressed, so text was verified through generator source plus PDF binary route validation.

## Public CTA QA

Confirmed `Explore a Sample Assessment` appears and links to `/demo` in:

- `/`
- `/shiftreadiness`
- `/pricing`
- `/sample-report`
- `/vmware-to-proxmox-readiness`

Confirmed:

- CTA points to `/demo`.
- CTA does not promise a real free trial.
- CTA supports the commercial flow instead of replacing the paid assessment path.

## Guardrails and Security

Confirmed by code-level checks and unit tests:

- Demo mode uses server-side fixtures.
- Demo user email is reserved: `demo@shiftevidence.com`.
- Demo assessment IDs are recognized by central guard helpers.
- Demo mode blocks assessment creation.
- Demo mode blocks edit mutations.
- Demo mode blocks evidence upload.
- Demo mode blocks live Advisor.
- Demo mode blocks admin access for the demo email.
- Demo mode does not read real assessments.
- Demo mode does not read private storage paths.
- Demo mode does not use real `Report` or `EvidenceFile` records.
- Demo mode does not create real `AiUsageEvent` records.
- Demo mode does not call Gemini.
- Demo mode does not call OpenAI.
- Demo mode does not print secrets.

Guard messages remain commercial and non-technical:

- `Demo mode is read-only. This action is available in paid assessments.`
- `Demo mode is read-only. To upload your own RVTools export, start a paid assessment.`
- `This action is intentionally disabled in the Demo Workspace. Nothing is broken.`
- `Live Advisor is disabled in the Demo Workspace. Start a paid assessment to use real AI guidance.`

## Incidents and Corrections

1. Billing/Prisma contamination in working tree
   - Resolution: parked in safe stashes.
   - Result: Demo Workspace diff isolated.

2. Build failed once while billing/Prisma changes were still present
   - Cause: billing config mismatch unrelated to Demo Workspace.
   - Resolution: remaining billing changes were parked; build passed from clean Demo Workspace state.

3. Browser QA limitation
   - In-app browser reported no available route.
   - Chrome connector was not available.
   - Resolution: performed functional QA using local production server, HTTP routes, rendered HTML checks, source checks, and PDF binary smoke.

4. PDFKit AFM issue from earlier local smoke
   - Resolution already included in `a934e6b` using `pdfkit/js/pdfkit.standalone.js`.
   - Result: all 8 PDF routes returned valid `%PDF` responses.

## Push Status

Controlled push result:

- Demo Workspace commit pushed: `a934e6b feat: add read-only synthetic demo workspace`
- QA documentation commit pushed: `6976ec7 docs: record demo workspace visual QA`
- Push target: `origin/main`
- Force push: no
- Manual deploy: no

## Post-Push Public Smoke

Read-only public checks were run after the push without touching Hostinger/Vercel.

An initial check was attempted while auto-deploy was still settling and showed old `/demo` replay copy plus a PDF `404`. The check was repeated after the deploy completed.

Final post-deploy result:

- `https://shiftevidence.com/demo`: 200
- new Demo Workspace copy present: yes
- scenario PDF links present: yes
- old replay copy present: no
- read-only copy present: yes
- synthetic data copy present: yes

Public PDF smoke after deploy:

| Scenario | Status | Content type | Size |
| --- | --- | --- | ---: |
| `balanced-mid-market` | 200 | `application/pdf` | 4135 |
| `storage-risk-heavy` | 200 | `application/pdf` | 4005 |
| `backup-evidence-missing` | 200 | `application/pdf` | 3912 |
| `critical-sql-erp` | 200 | `application/pdf` | 3995 |
| `proxmox-target-partial` | 200 | `application/pdf` | 3816 |
| `msp-client-sample` | 200 | `application/pdf` | 3808 |
| `low-evidence-low-confidence` | 200 | `application/pdf` | 3890 |
| `enterprise-multisite` | 200 | `application/pdf` | 4048 |

No manual deploy was executed.

## Risks Remaining

- Browser screenshot QA should be repeated once the in-app browser or Chrome connector is available.
- Post-deploy public smoke should confirm `/demo` and at least one PDF route after hosting auto-deploy completes.
- Billing/Prisma work remains parked in stashes and should be resumed deliberately in a separate hito.
- Demo Workspace is ready for controlled exposure, but this is not a full public launch decision.

## Percentages

After successful local QA:

- Shift Evidence / ShiftReadiness general: 99.2-99.4%
- Tema Demo Workspace: 92-96%
- DEMO-WORKSPACE-1B: 100% pending final push confirmation
- Demo Workspace readiness: 92-96%
- Public conversion readiness: 88-92%
- Full public launch: NO

## Next Steps

1. Repeat browser screenshot QA once the in-app browser or Chrome connector is available.
2. Resume billing/Prisma stashes in a separate controlled hito.
3. Continue controlled commercial/demo QA without declaring full public launch.
