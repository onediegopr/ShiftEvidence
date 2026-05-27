# PUBLIC-BETA-OPS-3 - Authenticated Browser QA + Product Flow Replay + Hostinger Logs

Date: 2026-05-27.

## Objective

Capture the current operational evidence after the Antigravity post-landing UX/UI update and determine whether ShiftReadiness remains fit for limited public beta or can advance toward full public launch.

## Context

Starting state:

- Branch: `main`.
- Expected HEAD: `494d6e6 fix: stabilize Antigravity post-landing UX update`.
- origin/main: synchronized.
- Working tree: clean.
- Production launched: YES.
- Launch type: controlled production launch.
- Limited public beta: YES.
- Full public launch: NO.
- Password recovery: operational.
- Antigravity post-landing UX/UI: accepted and stabilized.

## Gate A - Local / Git / Build

| Item | Result |
| --- | --- |
| Branch | `main` |
| HEAD | `494d6e62a7e5425a19e741276f399e2c9cc9ba7a` |
| origin/main | synchronized at start |
| Working tree | clean at start |
| Local commits pending | none |
| Node | `v22.22.0` |
| npm | `10.9.4` |
| `npm run hostinger:diagnose` | OK |
| `npm run typecheck` | OK |
| `npm run lint` | OK |
| `npm run build` | OK |

Warning:

- Known Turbopack/NFT trace warning involving `src/server/reports/reportStorageService.ts`.

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

- `500`: absent on route smoke.
- `503/504`: absent.
- Hostinger 404: absent.
- `0.0.0.0` redirect: absent.

Result: PASS.

## Gate C - Hostinger Logs / Runtime Evidence

Execution mode:

- Codex logs access: NO.
- User-attested logs: not provided in this hito.

Result matrix:

| Area | Result |
| --- | --- |
| Deployment logs | Not available to Codex |
| Runtime logs | Not available to Codex |
| Build logs | Not available to Codex |
| Node process logs | Not available to Codex |
| `500` errors | Not visible in route smoke; logs not reviewed |
| `503/504` | Absent in route smoke |
| Prisma errors | Logs not reviewed |
| Auth/password errors | Logs not reviewed |
| Email/Resend errors | Logs not reviewed |
| Storage errors | Logs not reviewed |
| PDF/report errors | Logs not reviewed |
| Memory/timeouts | Logs not reviewed |
| Crash loops | Logs not reviewed |

Decision:

- Acceptable for limited public beta because public route smoke is healthy.
- Blocking for full public launch until Hostinger runtime/build/error logs are reviewed or explicitly accepted by the owner.

## Gate D - Authenticated Multi-Assessment Browser QA

Execution mode:

- Codex authenticated browser/session access: NO.
- User-attested browser QA for this hito: not provided.

Required scenario not executed by Codex:

- Login with QA user.
- Create `QA Public Beta Ops 3 - Draft - safe to delete`.
- Confirm list visibility.
- Complete partial intake.
- Save, leave dashboard, re-open.
- Confirm persistence.
- Modify data.
- Create `QA Public Beta Ops 3 - Second Assessment - safe to delete`.
- Confirm lifecycle badges and isolation.
- Test archive/soft-delete if safe.

Result:

- Not executable from Codex without production cookies/session.
- Previous code/build/route evidence remains healthy.
- Full public launch remains blocked until this is executed manually or via authenticated automation.

## Gate E - Product Flow Authenticated Smoke

Execution mode:

- Codex authenticated browser/session access: NO.
- User-attested upload/parser/report/PDF replay for this hito: not provided.

Required scenario not executed by Codex:

- Complete prerequisites.
- Upload synthetic non-sensitive evidence.
- Confirm EvidenceFile.
- Confirm upload gate.
- Confirm parser/status.
- Confirm inventory/risk does not crash.
- Open report preview.
- Generate PDF preview.
- Download PDF.
- Confirm PDF non-empty/valid.
- Confirm report history.
- Confirm secure download/no-session protection.

Result:

- Not executable from Codex without authenticated production session.
- Prior evidence remains positive, but post-Antigravity authenticated replay is still missing.
- Full public launch remains blocked.

## Gate F - Password Recovery Regression

Validated:

| Check | Result |
| --- | --- |
| `/forgot-password` | `200 OK` |
| `/reset-password` | `200 OK` |
| Non-existing email request | `200 OK`, neutral response |
| Invalid token confirm | `400`, controlled message via valid JSON request |
| Valid token smoke | Previously completed by user-attested mailbox validation in AUTH-1 |
| Sign-in route | `200 OK` |

Neutral message observed:

- `If an account exists, we'll send recovery instructions.`

Invalid token behavior:

- `400` with controlled message: `This reset link is invalid or has expired.`

Result: PASS.

## Gate G - Admin / Entitlement / Full Report

Execution mode:

- Codex admin session access: NO.
- User-attested admin replay for this hito: not provided.

Evidence retained from previous hitos:

- Admin route manually validated by user in production.
- Admin queue visible in previous manual validation.
- Entitlement/full report manually validated by user in production.
- Antigravity update introduced admin read access for assessment/report pages, while write actions remain ownership-scoped.

Current unauthenticated check:

- `/dashboard/admin/unlock-requests`: `307` to `/sign-in`.

Result:

- Acceptable for limited public beta with trained admin.
- Full public launch still needs either fresh admin replay or explicit acceptance of prior evidence.

## Gate H - Security / Access

Validated by Codex:

| Check | Result |
| --- | --- |
| Private routes without session | `307` to `/sign-in` |
| Dashboard without session | `307` to `/sign-in` |
| Admin route without session | `307` to `/sign-in` |
| Password reset non-existing email | Neutral response |
| Password reset invalid token | Controlled `400` |
| Direct file public access | Not directly tested; storage remains private by design/evidence from previous hitos |
| Report ownership | Not replayed with authenticated cross-user session |
| Evidence ownership | Not replayed with authenticated cross-user session |

Result:

- No unauthenticated leakage detected.
- Authenticated ownership replay remains pending for full public launch.

## Gate I - QA Data Inventory / Archive

Execution mode:

- Direct production DB/storage inventory from Codex: not performed.
- No QA data deleted.
- No storage touched.

Known QA/test patterns from documentation:

- `QA Production Smoke - safe to delete`
- `QA Production Smoke - 2026-05-27 - safe to delete - admin entitlement`
- `QA Lifecycle - ... - safe to delete`
- `QA Launch - ... - safe to delete`
- `QA Public Launch - ... - safe to delete`
- `QA Public Beta - ... - safe to delete`
- `QA Public Beta Ops - ... - safe to delete`
- `QA Public Beta Ops 2 - ... - safe to delete`
- `QA Public Beta Ops 3 - safe to delete` naming reserved for this hito, but no new data was created by Codex.

Result:

- Inventory policy remains documented.
- Real DB/storage inventory and archive/cleanup remain pending.
- Full public launch remains blocked until cleanup/archive is executed or formally accepted.

## Gate J - Admin UX Gap

Current state:

- Previous gap: admin queue showed requests from other users, and `Open report` could 404 due owner protection.
- Antigravity update changed assessment/report page loaders to allow admin read access by assessment id.
- Write actions still use ownership-scoped services.

Security impact:

- Admin read behavior is explicit and admin-only.
- No broad non-admin access was observed.

UX impact:

- Cross-owner 404 risk is reduced for admin-read report/detail pages.
- Admin-safe read-only report view is still the cleaner long-term solution.

Decision:

- Limited beta: acceptable.
- Full public launch: still should be resolved or formally accepted with admin training.

## Gate K - Support / SLA / Public Beta Ops

Current operating model:

- Support channel: manual operator/admin channel.
- Response expectation: best-effort same business day for selected beta users.
- User volume: low-volume controlled beta.
- Invitation-only: YES / preferred.
- Manual entitlement: YES.
- Payment/checkout: absent.
- Claims allowed: evidence-based readiness assessment, conservative risk scoring, report preview/full report by entitlement.
- Claims prohibited: automatic migration, guaranteed zero downtime, fully automated paid self-service, exhaustive diagnosis without evidence.

Result:

- Acceptable for limited public beta.
- Formal support/SLA remains required for full public launch.

## Gate L - Onboarding / Claims

Reviewed by route smoke and source grep:

- Landing: no new route failure detected.
- `/shiftreadiness`: no route failure detected.
- `/sign-up`: account creation remains real Better Auth signup.
- Dashboard: workspace/multi-assessment language exists in source/docs.
- Upload gate: server-side gate remains.
- Pricing/payment: no checkout route observed in build output.
- Manual entitlement: copy states manual/admin entitlement and no checkout.
- Wizard demo: documented as simulated; must not be represented as real full assessment.
- Overclaims: no critical full-public/self-service payment claim detected.

Result:

- Acceptable for limited beta.
- The signup diagnostic wizard remains a messaging risk if presented without "demo/preliminary" framing.

## Gate M - Final Decision

Controlled production launch: YES.

Limited public beta: YES, operational under controlled, low-volume, invitation-only conditions.

Full public launch: NO.

Launch type:

- Controlled production launch with limited public beta.

Accepted risks for limited beta:

- No Codex access to Hostinger logs.
- No Codex authenticated production browser session.
- QA data retained and not archived in this hito.
- Admin cross-owner UX improved but still requires explicit operating discipline.
- Manual support/SLA only.

Blocking risks for full public launch:

- Hostinger logs/runtime health review missing.
- Fresh authenticated browser QA missing.
- Authenticated upload/parser/report/PDF replay missing.
- Real QA data inventory/archive missing.
- Formal support/SLA missing.
- Payment/checkout absent if full launch is paid self-service.

Next hito:

- `PUBLIC-BETA-OPS-3A - User-Attested Browser QA and Hostinger Logs Evidence Import`.

## Documentation

Created:

- `docs/public-beta-ops-3-authenticated-browser-qa-evidence.md`

Updated:

- `docs/public-beta-ops-2-manual-logs-browser-qa-evidence.md`
- `docs/public-beta-ops-1-logs-qa-cleanup-browser-qa.md`
- `docs/limited-public-beta-operating-decision.md`
- `docs/public-launch-2-logs-qa-cleanup-browser-qa.md`
- `docs/public-launch-readiness-review.md`
- `docs/production-controlled-launch-decision.md`
- `docs/launch-controlled-operating-pack.md`
- `docs/shiftreadiness-operational-functional-manual-v1-0-production-launch-edition.md`
- `README.md`

## Out of Scope Respected

- No Prisma reset.
- No migration.
- No DB schema change.
- No Hostinger configuration change.
- No deploy.
- No DNS change.
- No payment/checkout implementation.
- No secrets printed.
- No full public launch declaration.
