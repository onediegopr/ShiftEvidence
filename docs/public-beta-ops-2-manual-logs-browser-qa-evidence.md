# PUBLIC-BETA-OPS-2 - Manual Hostinger Logs + Browser QA Evidence Capture

Date: 2026-05-27.

## Objective

Capture operational evidence for limited public beta and reduce blockers for a future full public launch.

Scope:

- Hostinger logs / runtime evidence.
- Authenticated browser QA.
- Multi-assessment lifecycle.
- Product flow upload/parser/report/PDF.
- Password recovery regression.
- Admin/entitlement evidence.
- Security/access.
- QA data inventory/archive.
- Admin UX gap.
- Support/SLA.
- Public onboarding/claims.

## Context

Starting state:

- Branch: `main`.
- HEAD: `5a80240 docs: record public beta ops review`.
- origin/main: synchronized.
- Working tree: clean.
- Production launched: YES.
- Launch type: controlled production launch.
- Limited public beta: YES.
- Full public launch: NO.
- Password recovery: operational.

## Gate A - Local / Git / Build

| Item | Result |
| --- | --- |
| Branch | `main` |
| HEAD | `5a8024048a77cec6fb9365516097e4993c0ea68d` |
| origin/main | synchronized |
| Working tree | clean |
| Local commits pending | none |
| Node | `v22.22.0` |
| npm | `10.9.4` |
| `npm run hostinger:diagnose` | OK |
| `npm run typecheck` | OK |
| `npm run lint` | OK |
| `npm run build` | OK |

Warning:

- Known Turbopack/NFT trace warning in `reportStorageService.ts`.

Result: PASS.

## Gate B - Production Routes

Validated without session:

| Route | Result |
| --- | --- |
| `/` | `200 OK` |
| `/shiftreadiness` | `200 OK` |
| `/sign-in` | `200 OK` |
| `/sign-up` | `200 OK` |
| `/forgot-password` | `200 OK` |
| `/reset-password` | `200 OK` |
| `/dashboard` | `307` to `/sign-in` |
| `/dashboard/assessments` | `307` to `/sign-in` |
| `/dashboard/admin/unlock-requests` | `307` to `/sign-in` |

Observed:

- `500`: absent.
- `503/504`: absent.
- Hostinger 404: absent.
- `0.0.0.0` redirect: absent.

## Follow-up - HITO UX-AUDIT-1 Antigravity Post-Landing UX/UI Audit

Date: 2026-05-27.

Result:

- Antigravity post-landing UX/UI changes were audited after commit `4acbf42`.
- Local production-like server was recovered by starting `next start` on port `3000`.
- Local public routes returned `200 OK`.
- Local private routes returned `307` to `/sign-in`.
- Production smoke remained healthy.
- Typecheck/lint/build passed.
- No hotfix code change was required.

Decision:

- Antigravity UX/UI update accepted for limited public beta.
- Full public launch remains NO.

## Follow-up - PUBLIC-BETA-OPS-3

Date: 2026-05-27.

Result:

- Public production route smoke remains healthy.
- Password recovery regression passed for neutral non-existing email and invalid-token controlled response.
- Codex still has no authenticated production session/cookies.
- Codex still has no Hostinger/hPanel logs access.
- No QA data was created, archived or deleted.

Decision:

- Limited public beta remains operational.
- Full public launch remains NO.

Result: PASS.

## Gate C - Hostinger Logs / Runtime Evidence

Execution mode:

- Codex logs access: NO.
- User-attested logs: not provided in this hito.

Reviewed by Codex:

- HTTP route health.
- Dynamic private redirects.
- Hostinger/HCDN response headers.

Not reviewed:

- Deployment logs.
- Runtime logs.
- Build logs.
- Node process logs.
- Prisma errors.
- Auth/password reset errors.
- Email/Resend errors.
- Upload/storage errors.
- PDF/report errors.
- Memory/timeouts.
- Crash loops.

Result: PARTIAL.

Decision:

- No visible runtime failure from HTTP smoke.
- Logs remain a blocker for full public launch until hPanel/Hostinger evidence is captured.

## Gate D - Authenticated Multi-Assessment Browser QA

Execution mode:

- Codex browser/session access: NO.
- User-attested browser evidence: not provided in this hito.
- Prior evidence: HITO 13 code/service audit and prior dashboard validation.

Requested scenario not replayed in this hito:

- Create `QA Public Beta Ops 2 - Draft - safe to delete`.
- Persist partial intake.
- Modify in-progress data.
- Create `QA Public Beta Ops 2 - Second Assessment - safe to delete`.
- Confirm lifecycle badges and isolation.
- Archive/soft-delete disposable QA assessment.

Result: PARTIAL.

Decision:

- Limited public beta can continue by prior evidence and supervised usage.
- Full public launch remains blocked until browser QA evidence is captured with a real session.

## Gate E - Product Flow Authenticated Smoke

Execution mode:

- Codex authenticated session: NO.
- User-attested flow evidence: not provided in this hito.
- Prior evidence: upload gate, parser P0, PDF preview/full, admin entitlement/manual full report validation.

Requested scenario not replayed in this hito:

- Complete prerequisites.
- Upload synthetic evidence.
- Confirm EvidenceFile.
- Confirm parser/status.
- Open report preview.
- Generate/download PDF.
- Confirm report history.
- Confirm secure download and no-session protection on fresh report.

Result: PARTIAL.

Decision:

- Acceptable for limited beta using prior evidence.
- Full public launch remains blocked until authenticated product-flow replay is captured.

## Gate F - Password Recovery Regression

Validated:

- `/forgot-password`: `200`.
- `/reset-password`: `200`.
- Non-existing QA email: neutral response.
- Invalid token with valid JSON: controlled `400`.
- Valid token: previously closed in `AUTH-1-VALID-TOKEN-SMOKE`.
- `/sign-in`: `200`.

Result: PASS.

## Gate G - Admin / Entitlement / Full Report

Execution mode:

- Codex admin session: NO.
- User-attested admin evidence in this hito: not provided.
- Prior evidence: admin route, entitlement, full report and admin queue were validated manually by user in earlier launch review.

Current unauthenticated evidence:

- `/dashboard/admin/unlock-requests`: `307` to `/sign-in`.

Cross-owner UX gap:

- Still present by design/evidence.

Result: PASS for prior controlled evidence; PARTIAL for fresh full public launch evidence.

## Gate H - Security / Access

Validated:

- Private routes without session redirect to `/sign-in`.
- Dashboard redirect works.
- Admin route without session redirects to `/sign-in`.
- Password reset does not enumerate emails.
- Invalid reset token returns controlled error.

Prior evidence:

- Report/evidence ownership checks exist and were previously reviewed.
- Cross-owner report access fails closed.

Not replayed:

- Fresh report mismatch.
- Fresh evidence direct URL.
- Fresh no-session report download for newly generated report.

Result: PASS for limited beta; PARTIAL for full public launch.

## Gate I - QA Data Inventory / Archive

Inventory source:

- Documentation and prior hito reports.
- No DB query.
- No storage inspection.
- No production data mutation.

Known QA patterns:

- `QA Production Smoke - safe to delete`.
- `QA Public Beta - safe to delete`.
- `QA Public Beta Ops - safe to delete`.
- `QA Public Beta Ops 2 - safe to delete`.
- QA/test addresses and example domains used in smoke tests.

Known example:

- Prior smoke assessment: `cmpnwl8o8000d497rso02xypj`.

Cleanup/archive:

- Retained: all documented QA smoke data.
- Archived: none.
- Soft-deleted: none.
- Hard-deleted: none.
- Storage touched: NO.

Result: PARTIAL.

Decision:

- No unknown data was touched.
- Full public launch still requires real DB/storage inventory and archive/retention evidence.

## Gate J - Admin UX Gap

Gap:

- Admin queue can show requests for assessments owned by other users.
- `Open report` can route to owner-protected report page and return `404`.

Security impact:

- Fail-closed ownership behavior.
- No evidence of data leakage.

UX impact:

- Confusing for operators/admins.

Decision:

- Limited beta: accepted with trained admin/operator.
- Full public launch: remains a blocker or requires explicit acceptance.

Backlog:

- `ADMIN-UX-1 - Admin-safe read-only report view`.
- Or minimum copy/button adjustment.

Result: PARTIAL.

## Gate K - Support / SLA

Current limited beta model:

- Support channel: manual operator/admin channel.
- Response expectation: best-effort same business day for beta/pilot users.
- User volume: low-volume.
- Invitation-only: recommended.
- Manual entitlement: YES.
- Payment/checkout: absent.

Allowed claims:

- Evidence-based readiness assessment.
- Agentless initial assessment.
- Cost/risk/readiness analysis.
- Product does not change production infrastructure.

Prohibited claims:

- Automatic migration.
- Guaranteed zero downtime.
- Diagnosis without evidence.
- Paid self-service checkout.
- Automated entitlement/payment.

Result: PASS for limited beta; PARTIAL for full public launch.

## Gate L - Public Onboarding / Claims

Observed:

- Landing route loads.
- `/shiftreadiness` loads.
- `/sign-up` loads.
- Public pages do not claim automatic migration.
- No checkout/payment route was detected in route smoke/build output.

Risk:

- Public paid self-service is not implemented.
- Limited beta/manual entitlement expectations should remain clear to invited users.

Result: PASS for limited beta.

## Gate M - Final Decision

Decision:

- Controlled production launch: YES.
- Limited public beta: YES, operational under controlled/low-volume/invitation-only conditions.
- Full public launch: NO.
- Launch type: controlled production launch with limited public beta.

Accepted risks for limited beta:

- Hostinger logs not captured in Codex.
- QA data retained, not archived.
- Authenticated browser QA not replayed in this hito.
- Product-flow replay not captured in this hito.
- Admin cross-owner UX gap remains.
- Manual support/SLA remains lightweight.
- No checkout/payment self-service.

Blocking risks for full public launch:

- Manual Hostinger logs evidence missing.
- Browser QA evidence missing.
- Product flow evidence missing.
- QA data inventory/archive missing.
- Admin UX gap unresolved.
- Formal support/SLA missing.
- Checkout/payment absent if full launch is paid self-service.

Next hito:

- `PUBLIC-BETA-OPS-3 - User-Attested Browser QA + Hostinger Logs Evidence Import`.

Result: PARTIAL for full public launch; limited beta remains operational.

## Documentation Updates

Created:

- `docs/public-beta-ops-2-manual-logs-browser-qa-evidence.md`.

Updated:

- `docs/public-beta-ops-1-logs-qa-cleanup-browser-qa.md`.
- `docs/limited-public-beta-operating-decision.md`.
- `docs/public-launch-2-logs-qa-cleanup-browser-qa.md`.
- `docs/public-launch-readiness-review.md`.
- `docs/production-controlled-launch-decision.md`.
- `docs/launch-controlled-operating-pack.md`.
- `docs/shiftreadiness-operational-functional-manual-v1-0-production-launch-edition.md`.
- `README.md`.

## Out of Scope Respected

- No Prisma reset.
- No migrations.
- No DB schema changes.
- No Hostinger config changes.
- No deploy.
- No DNS changes.
- No storage deletion.
- No QA data deletion.
- No payment/checkout implementation.
- No secrets printed.
