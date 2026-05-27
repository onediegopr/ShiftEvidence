# PUBLIC-BETA-OPS-4 - Manual Browser QA + Logs Final Evidence Closure

Date: 2026-05-27.

## Objective

Capture or import final real-world evidence for limited public beta operations:

- Hostinger logs.
- Authenticated browser QA.
- Multi-assessment workflow.
- Product flow replay.
- Password recovery regression.
- Admin/entitlement sanity.
- Security/access.
- QA data inventory/archive.

Important constraint:

- Codex does not have production cookies/session or hPanel/log access.
- No user-attested or Claude-attested evidence was provided in this hito.
- Codex must not simulate authenticated evidence.

## Starting Status

| Area | Before |
| --- | --- |
| Controlled production launch | 100% |
| Limited public beta | 96-97% |
| Full public launch | 88-91% |
| Total product operational/professional | 92-94% |

Because no new manual/log/browser evidence was provided, percentages are not increased.

| Area | After |
| --- | --- |
| Controlled production launch | 100% |
| Limited public beta | 96-97% |
| Full public launch | 88-91% |
| Total product operational/professional | 92-94% |

## Gate A - Local / Git / Build

Codex validated:

| Item | Result |
| --- | --- |
| Branch | `main` |
| HEAD | `0a2488e00cf99921f6542078e6c2365a02b60355` |
| origin/main | synchronized at start |
| Working tree | clean |
| Local commits pending | none |
| Node | `v22.22.0` |
| npm | `10.9.4` |
| `npm run hostinger:diagnose` | OK |
| `npm run typecheck` | OK |
| `npm run lint` | OK |
| `npm run build` | OK after clearing only `.next` |

Build note:

- First build attempt failed with Windows/OneDrive `.next` EPERM lock.
- Only `.next` was deleted.
- Rebuild passed.
- Known Turbopack/NFT warning remains in `reportStorageService.ts`.

Result: PASS.

## Gate B - Production Routes

Codex validated without session:

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

- `500`: absent in route smoke.
- `503/504`: absent.
- Hostinger 404: absent.
- `0.0.0.0` redirect: absent.

Result: PASS.

## Gate C - Hostinger Logs

Execution mode:

- Codex logs access: NO.
- User-attested logs: not provided.
- Claude-attested logs: not provided.

Checklist status:

| Area | Evidence |
| --- | --- |
| Deployment logs | Not provided |
| Runtime logs | Not provided |
| `500` errors | Not provided |
| `503/504` | Not provided |
| Prisma errors | Not provided |
| Auth/password errors | Not provided |
| Email errors | Not provided |
| Upload/storage errors | Not provided |
| PDF/report errors | Not provided |
| Memory/timeouts | Not provided |
| Crash loops | Not provided |

Result:

- No production route failures are visible to Codex.
- Hostinger logs evidence remains missing.
- Full public launch remains blocked.

## Gate D - Authenticated Multi-Assessment QA

Execution mode:

- Codex authenticated session: NO.
- User-attested browser evidence: not provided.
- Claude-attested browser evidence: not provided.

Required scenario not validated in this hito:

- Login QA.
- Dashboard load.
- `/dashboard/assessments` load.
- Create `QA Public Beta Ops 4 - Draft - safe to delete`.
- Save/reopen/modify.
- Create second assessment.
- Verify badges/continue/isolation.
- Archive/soft-delete if available.

Result:

- Not validated.
- Full public launch remains blocked.
- Limited beta remains supported by prior evidence and current public route/build health.

## Gate E - Product Flow Smoke

Execution mode:

- Codex authenticated session: NO.
- User-attested product-flow evidence: not provided.
- Claude-attested product-flow evidence: not provided.

Required scenario not validated in this hito:

- `QA Public Beta Ops 4 - Product Flow - safe to delete`.
- Assessment -> intake -> cost/risk -> upload -> parser -> report preview -> PDF -> history.
- Secure access / no-session download protection.

Result:

- Not validated.
- Full public launch remains blocked.

## Gate F - Password Recovery Regression

Codex validated:

| Check | Result |
| --- | --- |
| `/forgot-password` | `200 OK` |
| `/reset-password` | `200 OK` |
| Non-existing email request | `200 OK`, neutral response |
| Invalid token confirm | `400`, controlled message |
| Valid token | Previously validated by user-attested AUTH-1 mailbox smoke |
| Sign-in route | `200 OK` |

Result: PASS.

## Gate G - Admin / Entitlement

Execution mode:

- Codex admin session: NO.
- User-attested admin evidence: not provided in this hito.
- Prior user-attested admin/entitlement evidence: retained.

Current Codex unauthenticated route check:

- `/dashboard/admin/unlock-requests`: `307` to `/sign-in`.

Result:

- Acceptable for limited public beta by prior evidence.
- Fresh admin evidence remains pending for full public launch.

## Gate H - Security / Access

Codex validated:

- Private routes without session redirect to `/sign-in`.
- Password reset request does not enumerate email existence.
- Invalid reset token returns controlled `400`.

Not validated in this hito:

- Authenticated report ownership.
- Authenticated evidence ownership.
- Direct report/evidence mismatch with another user.

Result:

- No unauthenticated leakage observed.
- Authenticated ownership replay remains pending.

## Gate I - QA Data Inventory / Archive

Execution mode:

- Codex DB/storage access: NO.
- User/Claude QA inventory evidence: not provided.
- Cleanup/archive executed: NO.
- Hard delete: NO.
- Storage touched: NO.

Result:

- QA retention policy remains documented.
- Real inventory/archive remains pending.
- Full public launch remains blocked.

## Gate J - Admin UX Gap

Security impact:

- Fail-closed behavior remains safe.
- Admin read behavior reduces previous cross-owner report 404 risk.

UX impact:

- Admin-safe read-only report view is still recommended.

Decision:

- Limited beta: accepted with trained admin.
- Full public launch: still a blocker or explicit acceptance requirement.
- Backlog: `ADMIN-UX-1 - Admin-safe report view`.

## Gate K - Support / SLA

Current model:

- Manual support.
- Best-effort same business day.
- Low-volume.
- Invitation-only.
- Manual entitlement.
- No checkout self-service.

Allowed claims:

- Evidence-based readiness.
- Conservative risk scoring.
- Missing evidence surfaced.

Prohibited claims:

- Automatic migration.
- Guaranteed zero downtime.
- Exhaustive diagnosis without evidence.
- Paid self-service checkout.

Result:

- Acceptable for limited beta.
- Not enough for full public launch.

## Gate L - Final Decision

Controlled production launch: YES.

Limited public beta: YES.

Full public launch: NO.

Launch type:

- Controlled production launch with limited public beta.

Accepted risks:

- Logs not imported.
- Browser QA not imported.
- Product-flow replay not imported.
- QA cleanup/archive not executed.
- Admin UX gap remains managed by operator discipline.

Blocking risks:

- Hostinger logs evidence.
- Authenticated browser QA.
- Product flow replay.
- QA data inventory/archive.
- Admin-safe report view.
- Formal SLA/support.
- Payment/checkout if paid self-service is desired.

Next hito:

- Do not rerun OPS evidence closure without new manual evidence.
- Next useful hito is `PUBLIC-BETA-OPS-4A - Evidence Import From User/Claude` only after logs/browser/product-flow checklist is available.

## Required Evidence Package

To raise the confidence levels, provide:

1. Hostinger logs summary without secrets.
2. Browser QA checklist result with QA account.
3. Product-flow replay result with `QA Public Beta Ops 4 - safe to delete` data.
4. Admin/entitlement sanity result.
5. QA data inventory/archive result.

Do not provide secrets, cookies, reset links or tokens.
