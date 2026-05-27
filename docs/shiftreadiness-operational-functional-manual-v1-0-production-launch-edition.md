# ShiftReadiness — Operational & Functional Manual v1.0
## Production Launch Edition — Controlled Launch

## Índice

1. Executive Summary
2. Product Definition
3. Positioning and Boundaries
4. Launch Status
5. Architecture Overview
6. User Dashboard
7. Assessment Lifecycle
8. Manual Intake
9. Cost/Risk Assumptions
10. Evidence Upload
11. Upload Prerequisite Gate
12. RVTools Parser
13. Risk Engine
14. Report Preview
15. PDF Reports
16. Admin / Unlock / Entitlement
17. Security and Access
18. Production / Hostinger
19. Controlled Launch Operating Model
20. Daily Operations Runbook
21. Admin Operating Runbook
22. Pilot User Checklist
23. QA Data Cleanup / Retention
24. Password Recovery / Account Support
25. Hostinger Logs
26. Known Risks and Accepted Risks
27. Public Launch Blockers
28. Roadmap After Controlled Launch
29. Rollback Guide
30. Final Controlled Launch Checklist
31. Glossary

## 1. Executive Summary

ShiftReadiness is the first product module of Shift Evidence. It helps infrastructure teams, consultants and MSPs evaluate VMware to Proxmox readiness using evidence, manual context and conservative risk scoring.

Launch status:

- Production launched: SÍ.
- Launch type: controlled production launch.
- Public launch: NO.
- Manual version: v1.0 Production Launch Edition.

Audience:

- Product owner.
- Operators/admins.
- Developers resuming the project.
- Pilot users and partners who need to understand what is validated and what remains controlled.

What can be done today:

- Use the public website.
- Sign up/sign in.
- Use a private dashboard.
- Create multiple assessments.
- Continue assessments later.
- Complete manual intake and cost/risk assumptions.
- Upload evidence after prerequisites are met.
- Parse RVTools-like evidence.
- Review inventory, risk and report preview.
- Generate/download PDF reports.
- Use admin manual entitlement flow for controlled users.

What must not be treated as public-launch ready yet:

- Public launch decision without final public launch review.
- Public onboarding at scale.
- Automated checkout/payment.
- Fully polished admin cross-owner report UX.
- Formal QA data cleanup/retention process.
- Full production logs review from Hostinger.

## 2. Product Definition

Product: ShiftReadiness.

Tagline: Infrastructure readiness before you migrate.

First assessment:

- VMware → Proxmox Readiness Assessment.

Core included module:

- Cost / Risk Engine.

Optional module:

- Storage Destination Readiness.

Methodology:

- Evidence-based.
- Transparent.
- Conservative.
- Manual context plus parsed inventory.
- Missing evidence is part of the output, not hidden.

## 3. Positioning and Boundaries

ShiftReadiness does not promise magic.

It is not:

- An automatic migration tool.
- A zero-downtime guarantee.
- A replacement for a migration pilot.
- A complete diagnosis without required evidence.
- A backup readiness guarantee without backup evidence.
- A performance history engine without historical metrics.

It is:

- A structured readiness assessment.
- A way to make migration risks explicit.
- A way to combine RVTools-style evidence with manual context.
- A way to show what is known, what is inferred and what is missing.

## 4. Launch Status

| Area | Status |
| --- | --- |
| Public site | OK |
| Auth base | OK |
| Dashboard | OK |
| Multi-assessment workspace | OK |
| Upload/storage/parser | OK |
| PDF preview/full | OK |
| Admin/entitlement | OK by manual browser validation |
| Redirect `0.0.0.0` bug | Fixed |
| Password recovery | Operational in production by user-attested valid-token mailbox smoke |
| Hostinger logs | Pending / not reviewed from Codex |
| QA cleanup/retention | Pending |
| Controlled production launch | SÍ |
| Public launch | NO |

## 5. Architecture Overview

Main components:

- Next.js App Router.
- React.
- Better Auth.
- Prisma.
- Neon/Postgres.
- Hostinger Node runtime.
- Private storage outside public paths.
- `EvidenceFile` model.
- RVTools parser.
- Risk engine.
- PDF/report services.
- Manual unlock/entitlement/admin route.

Conceptual production env vars, without values:

- `DATABASE_URL`
- `DIRECT_URL` when applicable
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `HOSTINGER_STORAGE_ROOT`
- `MAX_UPLOAD_SIZE_MB`
- `ADMIN_EMAILS`

## 6. User Dashboard

The dashboard is a persistent private workspace, not a one-time form.

Capabilities:

- Multiple assessments per workspace.
- Assessment list.
- Lifecycle badges.
- Continue assessment action.
- Last updated signal.
- Work can be resumed later.
- In-progress assessments can be modified.
- Evidence and reports remain isolated by assessment.
- Archived assessments are excluded from the active list.

## 7. Assessment Lifecycle

Conceptual states:

| State | Type | Signals |
| --- | --- | --- |
| Draft | Derived/formal draft | Created, no major data |
| In progress | Derived | Intake or assumptions partially saved |
| Basics complete | Derived | Intake + cost/risk minimum signals |
| Evidence uploaded | Derived | Active `EvidenceFile` |
| Inventory ready | Derived | Parsed evidence/inventory |
| Report ready | Derived | Generated report or unlocked/full report |
| Full report unlocked | Formal entitlement signal | `full_report_unlocked` available/purchased/granted |
| Archived | Formal | `status=archived`, `archivedAt` |

`Completed` is not yet a formal product workflow. It can be inferred by full report generation/unlock, but should be formalized later if needed.

## 8. Manual Intake

Manual intake captures infrastructure context such as:

- VM count.
- Host count.
- Cluster count.
- CPU/socket/core context.
- RAM and storage footprint.
- Snapshots.
- Critical workload counts.
- Notes.

Purpose:

- Provide minimum context before evidence upload.
- Improve readiness and confidence scores.
- Make missing evidence explicit.
- Avoid interpreting RVTools files without basic assessment context.

## 9. Cost/Risk Assumptions

Cost/risk assumptions capture:

- VMware licensing context.
- Socket/core/VM counts.
- Annual VMware cost.
- Estimated Proxmox cost.
- Currency and timeframe.
- Migration complexity.
- Business criticality.
- Risk tolerance.

Limits:

- Cost output is preliminary.
- It depends on provided assumptions.
- It does not replace commercial procurement or architecture sizing.

## 10. Evidence Upload

Supported evidence types include:

- RVTools/XLSX/CSV-style input.
- Other evidence categories represented by the data model.

Key behavior:

- Evidence requires assessment prerequisites.
- Files are stored privately.
- Downloads are protected.
- Metadata includes filename, type, size and hash where applicable.
- Evidence status includes uploaded, queued/processing, parsed, failed or deleted.
- Deleted evidence remains represented in history for auditability, while physical cleanup may remove local file content depending on action.

## 11. Upload Prerequisite Gate

The upload gate exists in two layers:

- UI gate.
- Server-side gate.

Validated behavior:

- Incomplete assessment blocks upload.
- Clear message/checklist guides completion.
- Completed prerequisites enable upload.
- Browser multipart E2E was validated.
- Server-side guard rejects bypass attempts before storage/evidence/parser.

## 12. RVTools Parser

Parser supports:

- Simple CSV.
- XLSX.
- RVTools-like workbook.

Generated models:

- `ParsedVM`
- `ParsedHost`
- `ParsedDatastore`
- `ParsedSnapshot`
- `ParsedInventorySummary`

P0 hardening fixed:

- Problem: 23 real VMs could become 150 ParsedVM because enrichment sheets were treated as VM sheets.
- Fix: `vInfo` became canonical VM source.
- Enrichment sheets such as `vCPU`, `vMemory`, `vDisks`, `vNetwork`, `vTools` enrich canonical VMs.
- Datastore usage normalization improved.
- Warnings are non-fatal.

Remaining parser roadmap:

- Broader P1/P2 coverage.
- More network/tool/disk risk signals.
- More anonymized real RVTools QA.

## 13. Risk Engine

Risk engine includes:

- `RiskFinding`.
- `AssessmentScore`.
- Readiness score.
- Confidence score.
- Inventory score.
- Cost/risk score.
- VM matrix.
- Evidence missing indicators.
- Source indicators: manual, parsed or mixed.

Principle:

- Do not overclaim.
- If evidence is missing, say so.

## 14. Report Preview

Report route:

- `/dashboard/assessments/[id]/report`

Preview includes:

- Executive summary.
- Evidence received.
- Missing evidence.
- Scores.
- Findings.
- Locked/full-report sections.
- Source indicators.
- Upgrade/unlock intent.

## 15. PDF Reports

PDF capabilities:

- Preview PDF.
- Full `readiness_report` when entitlement allows it.
- Secure download.
- Private report storage.
- Report history.
- Soft-delete support.

Validated:

- Visual hardening completed.
- Functional generation/download completed.
- Full report flow validated manually in production by user with real admin.

Limitations:

- Public-launch grade monitoring/log review remains pending.

## 16. Admin / Unlock / Entitlement

Flow:

1. User requests full report/unlock.
2. Request appears in admin queue.
3. Admin reviews manually.
4. Admin fulfills.
5. Entitlement is granted.
6. Commercial status becomes unlocked/full-report capable.
7. Full readiness report can be generated/downloaded.

Validated:

- Admin route loads for real admin by manual user validation.
- Entitlement/full report worked by manual browser validation.
- Admin queue showed fulfilled requests and entitlement granted state.

Known admin UX gap:

- Admin queue can list requests for another user.
- `Open report` can point to owner-protected user route and return 404.
- This is secure but confusing.

## 17. Security and Access

Security controls:

- Private routes redirect without session.
- Assessment ownership enforced by workspace membership.
- Report route uses ownership protection.
- Evidence download uses ownership protection.
- Report download uses ownership protection.
- Admin route fail-closed.
- Storage is not public.
- Old cross-owner assessment 404 is expected ownership behavior.

## 18. Production / Hostinger

Production state:

- Hostinger serves real Next.js app.
- Public routes OK.
- Private unauthenticated redirects OK.
- Dynamic route 503/504 incident recovered.
- Redirect `0.0.0.0` bug fixed.
- Controlled launch active.

Logs:

- Hostinger logs were not reviewed from Codex.
- Logs should be reviewed manually if accessible.

## 19. Controlled Launch Operating Model

Controlled launch means:

- Limited users.
- Pilot customers or supervised demos.
- Manual admin entitlement.
- Manual account support.
- No public onboarding at scale.
- No large paid ads until public-launch blockers are resolved.
- Data used should be synthetic or explicitly approved.

## 20. Daily Operations Runbook

Daily checks:

- Open public site.
- Open `/shiftreadiness`.
- Open `/sign-in`.
- Confirm private `/dashboard` redirects without session.
- Sign in with QA/admin if needed.
- Review dashboard.
- Review admin queue.
- Review pending unlock requests.
- Generate/download a test PDF only when needed.
- Check visible runtime errors.

If localhost does not start:

- Check port 3000.
- Check Node version.
- Check `.next` lock issues on Windows/OneDrive.
- Rebuild only after local cache issue is resolved.

If Hostinger returns 503/504:

- Recheck public routes.
- Recheck private redirects.
- Review runtime logs if available.
- Do not change env/redeploy without authorization.

If PDF fails:

- Check report storage root.
- Check secure download route.
- Preserve error logs.

If upload fails:

- Confirm prerequisites.
- Confirm file type/size.
- Confirm storage path permissions.

If admin cannot enter:

- Confirm user exists.
- Confirm `ADMIN_EMAILS` includes the admin conceptually, without printing values.
- Use password recovery for account support; keep manual support available as fallback.

## 21. Admin Operating Runbook

Steps:

1. Sign in as admin.
2. Open `/dashboard/admin/unlock-requests`.
3. Review pending requests.
4. Confirm assessment/user context.
5. Add internal notes if needed.
6. Fulfill only requests approved for controlled launch.
7. Confirm entitlement granted.
8. Confirm full report availability.
9. Ask user to generate/download report or validate in supervised session.
10. Do not delete QA data without recording it.

## 22. Pilot User Checklist

Pilot user should:

- Create account.
- Sign in.
- Create assessment.
- Complete manual intake.
- Complete cost/risk assumptions.
- Upload RVTools/evidence.
- Review inventory/risk/preview.
- Request full report.
- Download PDF after entitlement.
- Report issues with screenshots and assessment ID.

## 23. QA Data Cleanup / Retention

Policy initial state:

- QA data should be named `QA Production Smoke — safe to delete`.
- Keep QA data temporarily for traceability.
- Do not hard-delete storage without recording what was removed.
- Cleanup should include user, assessment, evidence, report, unlock and entitlement IDs where visible.
- Cleanup remains pending after controlled launch.

## 24. Password Recovery / Account Support

Current state:

- Forgot password/password recovery is migrated and deployed.
- Production activation completed for the Prisma migration and app deploy.
- AUTH-1-PROD-EXEC confirmed neutral request behavior and invalid-token handling.
- Resend provider is configured by user report.
- Valid-token mailbox smoke passed by user-attested validation.

Controlled launch mitigation:

- Manual account support remains the fallback.
- Limited users.
- Admin-supervised access.

Public launch decision:

- Password recovery no longer blocks public launch readiness; final public launch decision remains separate.

Recommended hito:

- `PUBLIC-LAUNCH-READINESS-REVIEW - Final public launch blockers and go/no-go`.

## 25. Hostinger Logs

Logs were not reviewed from Codex.

If Hostinger access is available, review:

- Runtime logs.
- Error logs.
- Build logs.
- Auth/admin errors.
- Prisma errors.
- Storage permission errors.
- PDF errors.
- Upload errors.
- 500/503/504 events.

Risk:

- Accepted for controlled launch.
- Not acceptable as long-term public-launch operating posture.

## 26. Known Risks and Accepted Risks

| Risk | Controlled launch | Public launch |
| --- | --- | --- |
| Password recovery operational | Accepted | Not blocking |
| Hostinger logs pending | Accepted with manual monitoring | Blocking until reviewed |
| QA cleanup pending | Accepted short-term | Blocking before scale |
| Admin UX gap cross-owner | Accepted for trained admins | Must improve |
| Browser multi-assessment replay not automated by Codex | Accepted | Needs formal QA |
| Payment/checkout absent | Accepted for manual model | Required only if self-service paid launch |

## 27. Public Launch Blockers

Before public launch:

- Review production logs/monitoring.
- Define QA cleanup/retention.
- Improve admin cross-owner report UX.
- Run authenticated multi-assessment browser QA.
- Decide support channels/SLA.
- Decide pricing/payment if self-service commercial launch is desired.

## 28. Roadmap After Controlled Launch

Priority:

1. `PUBLIC-LAUNCH-READINESS-REVIEW - Final public launch blockers and go/no-go`.
2. `OPS-1 — QA Data Cleanup / Retention`.
3. `ADMIN-UX-1 — Admin-safe report view`.
4. `13.1 — Authenticated Multi-Assessment Browser QA`.
5. `DOC-3 — Public Launch Manual / SOP`.
6. Payment/checkout if applicable.
7. Sample report / lead magnet.
8. Marketing/Google Ads readiness.

## 29. Rollback Guide

Rollback principles:

- Do not run `prisma migrate reset`.
- Preserve storage.
- Preserve logs.
- Revert documentation/status commit if launch must be paused.
- Review env vars conceptually; do not print secrets.
- Review redirects and public URL helpers if auth/download redirects regress.
- Document reason for pause.

## 30. Final Controlled Launch Checklist

- [x] Public site.
- [x] Auth base.
- [x] Dashboard.
- [x] Multi-assessment workspace.
- [x] Upload gate.
- [x] Parser P0.
- [x] PDF preview/full.
- [x] Admin manual validation.
- [x] Controlled launch decision.
- [ ] Public launch.
- [x] Password recovery active in production.
- [ ] QA cleanup.
- [ ] Logs reviewed.

## 32. Public Launch Readiness Review

Date: 2026-05-27.

Decision:

- Public launch: NO.
- Controlled production launch remains active: YES.
- Limited public beta / limited public access: allowed only under controlled operating conditions.

Evidence:

- Public routes are healthy.
- Private routes redirect to `/sign-in` without session.
- Password recovery is operational in production by user-attested valid-token smoke and Codex route/API regression.
- Product flows remain supported by prior milestone evidence.

Remaining blockers for full public launch:

- Hostinger logs/runtime health review.
- QA data cleanup/retention execution.
- Fresh authenticated browser QA for multi-assessment, upload, report and PDF.
- Admin cross-owner report UX gap.
- Public support/SLA and entitlement/commercial operating model.
- Payment/checkout only if the intended public launch is paid self-service.

Next hito:

- `PUBLIC-LAUNCH-2 - Logs, QA Cleanup, Authenticated Browser QA + Public Beta Operating Decision`.

## 33. Limited Public Beta Operating Decision

Date: 2026-05-27.

Decision:

- Controlled production launch: YES.
- Limited public beta: YES.
- Full public launch: NO.

Limited public beta conditions:

- Selected users only.
- Low-volume supervised usage.
- Manual support.
- Manual entitlement.
- No automated checkout/payment claims.
- No automatic migration claims.
- QA data must remain marked `safe to delete`.

Full public launch remains blocked by:

- Hostinger logs/runtime health review.
- QA data cleanup/archive.
- Authenticated browser QA replay.
- Admin cross-owner UX gap.
- Formal public support/SLA.
- Payment/checkout if paid self-service is required.

## 34. Public Beta Ops Review

Date: 2026-05-27.

Result:

- Controlled production launch remains active.
- Limited public beta remains operational.
- Full public launch remains NO.

Validated:

- Local build/typecheck/lint.
- Public route health.
- Private unauthenticated redirects.
- Password recovery regression.

Still pending for full public launch:

- Hostinger logs/runtime review.
- Real QA data inventory/archive.
- Authenticated browser QA.
- Authenticated upload/parser/report/PDF replay.
- Admin cross-owner UX improvement.
- Formal support/SLA.

## 35. Public Beta Ops 2 Evidence Capture

Date: 2026-05-27.

Result:

- Limited public beta remains operational.
- Full public launch remains NO.

Validated by Codex:

- Local build/typecheck/lint.
- Public production routes.
- Private unauthenticated redirects.
- Password recovery neutral response.
- Invalid reset token controlled failure.

Still required for full public launch:

- Hostinger logs evidence.
- Authenticated browser QA evidence.
- Authenticated upload/parser/report/PDF evidence.
- QA data inventory/archive.
- Admin cross-owner UX resolution or explicit acceptance.

## 31. Glossary

- Assessment: one readiness job/work item.
- Workspace: private container for assessments and access.
- EvidenceFile: uploaded evidence record.
- RVTools: VMware inventory export family used as evidence.
- ParsedVM: parsed virtual machine record.
- RiskFinding: structured risk item.
- AssessmentScore: readiness/confidence scoring record.
- readiness_report: full report type unlocked by entitlement.
- UnlockRequest: request for manual/full report access.
- Entitlement: granted capability for an assessment.
- Controlled launch: limited supervised production use.
- Public launch: broad public/self-service availability.
