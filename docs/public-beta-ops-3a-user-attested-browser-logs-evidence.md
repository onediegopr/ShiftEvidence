# PUBLIC-BETA-OPS-3A - User-Attested Browser QA + Hostinger Logs Evidence Import

Date: 2026-05-27.

## Objective

Import manual evidence for Hostinger logs, authenticated browser QA and product-flow replay. Codex does not have production cookies/session or full hPanel/logs access, so this hito separates:

- A. Validated by Codex.
- B. Validated by user in real browser.
- C. Validated by Claude/Antigravity.
- D. Not validated / pending.

## Context

Starting state:

- Branch: `main`.
- HEAD: `529ee52 docs: add functional operational manual v1.1`.
- origin/main: synchronized.
- Working tree: clean.
- Production launched: YES.
- Launch type: controlled production launch.
- Limited public beta: YES.
- Full public launch: NO.
- Current manual: v1.1.
- Password recovery: operational.
- Localhost: recovered in prior hito.

## Gate A - Local / Git / Build

Codex validated:

| Item | Result |
| --- | --- |
| Branch | `main` |
| HEAD | `529ee52c5417e97507a416fda6e24e676edee373` |
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
- No process was listening on port `3000`.
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

## Gate C - Hostinger Logs Evidence

Execution mode:

- Codex logs access: NO.
- User-attested logs: not provided in this hito.
- Claude-attested logs: not provided in this hito.

Manual checklist status:

| Log area | Imported evidence |
| --- | --- |
| Deployment logs | Not provided |
| Runtime logs | Not provided |
| Build logs | Not provided |
| Node process logs | Not provided |
| `500` errors | Not provided |
| `503/504` | Not provided |
| Prisma errors | Not provided |
| Auth/password errors | Not provided |
| Email/Resend errors | Not provided |
| Storage errors | Not provided |
| PDF/report errors | Not provided |
| Memory/timeouts | Not provided |
| Crash loops | Not provided |

Result:

- No critical route-level production errors were visible to Codex.
- Full Hostinger logs evidence remains pending.
- Full public launch remains blocked by logs evidence.

## Gate D - User-Attested Multi-Assessment QA

Execution mode:

- Codex production session/cookies: NO.
- User-attested browser checklist: not provided.
- Claude/Antigravity browser evidence: not provided for this hito.

Required checklist not imported:

- Login QA.
- Dashboard load.
- `/dashboard/assessments` load.
- Create `QA Public Beta Ops 3A - Browser QA - safe to delete`.
- Confirm list visibility.
- Open assessment.
- Save partial intake.
- Reopen and confirm persistence.
- Modify data.
- Create second assessment.
- Confirm both appear.
- Confirm lifecycle badges / Continue assessment.
- Confirm data isolation.
- Archive/soft-delete if available.

Result:

- Not validated in this hito.
- Prior multi-assessment evidence remains valid for limited beta.
- Full public launch remains blocked by missing fresh authenticated browser evidence.

## Gate E - User-Attested Product Flow

Execution mode:

- Codex authenticated product-flow replay: NO.
- User-attested product-flow checklist: not provided.
- Claude/Antigravity product-flow evidence: not provided for this hito.

Required checklist not imported:

- Create/use `QA Public Beta Ops 3A - Product Flow - safe to delete`.
- Complete prerequisites.
- Confirm upload gate enabled.
- Upload synthetic non-sensitive evidence.
- Confirm EvidenceFile visible.
- Confirm parser/status.
- Confirm inventory/risk no crash.
- Open report preview.
- Generate PDF preview.
- Download PDF.
- Confirm PDF valid/non-empty.
- Confirm report history.
- Confirm secure access.

Result:

- Not validated in this hito.
- Prior upload/parser/PDF evidence remains acceptable for limited beta.
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

Neutral response:

- `If an account exists, we'll send recovery instructions.`

Invalid token response:

- `This reset link is invalid or has expired.`

Result: PASS.

## Gate G - Admin / Entitlement Evidence

Execution mode:

- Codex admin session: NO.
- User-attested admin checklist: not provided in this hito.
- Evidence retained from previous hitos: YES.

Previous evidence:

- Admin route loaded in real browser by user.
- Admin queue visible.
- Entitlement/full report manually validated.
- Non-admin fail-closed was previously validated/documented.

Current Codex unauthenticated route check:

- `/dashboard/admin/unlock-requests`: `307` to `/sign-in`.

Cross-owner gap:

- Antigravity introduced admin read behavior for assessment/report pages.
- Admin-safe read-only view remains recommended for full public launch.

Result:

- Acceptable for limited public beta by prior evidence.
- Fresh admin evidence still pending for full public launch.

## Gate H - QA Data Inventory / Archive

Execution mode:

- Codex DB/storage inventory: NO.
- User-attested QA inventory: not provided.
- Cleanup/archive executed: NO.
- Hard delete executed: NO.
- Storage touched: NO.

Result:

- QA data retention policy remains documented.
- Real QA inventory/archive remains pending.
- Full public launch remains blocked by cleanup/archive evidence.

## Gate I - Admin UX Gap

Security impact:

- Fail-closed behavior remains the safe default for non-admins.
- Admin read behavior now reduces previous cross-owner report 404 risk.

UX impact:

- Admin cross-owner flow can still be confusing without an explicit admin-safe read-only report view.

Decision:

- Limited beta accepted: YES, with trained admin.
- Full public launch blocker: YES, unless explicitly accepted or fixed.
- Recommended backlog: `ADMIN-UX-1 - Admin-safe report view`.

## Gate J - Support / SLA

Operating model:

- Support channel: manual operator/admin channel.
- Response expectation: best-effort same business day for selected beta users.
- User volume: low-volume.
- Invitation-only: YES / preferred.
- Manual entitlement: YES.
- Payment/checkout: absent.

Claims allowed:

- Evidence-based readiness assessment.
- Conservative scoring.
- Missing evidence surfaced as value.
- Manual entitlement/full report flow.

Claims prohibited:

- Automatic migration.
- Guaranteed zero downtime.
- Exhaustive diagnosis without evidence.
- Paid self-service checkout.

Result:

- Acceptable for limited public beta.
- Not sufficient for full public launch.

## Gate K - Final Decision

Controlled production launch: YES.

Limited public beta: YES.

Full public launch: NO.

Launch type:

- Controlled production launch with limited public beta.

Accepted risks for limited beta:

- Hostinger logs not imported.
- Fresh authenticated browser QA not imported.
- Product-flow replay not imported.
- QA cleanup/archive not executed.
- Admin UX gap accepted for trained admin.
- Manual support/SLA only.

Blocking risks for full public launch:

- Hostinger logs evidence missing.
- User-attested browser QA missing.
- Product-flow replay missing.
- QA data inventory/archive missing.
- Admin-safe report view missing.
- Formal public SLA missing.
- Checkout/payment missing if paid self-service is required.

Next hito:

- `PUBLIC-BETA-OPS-3B - Manual Evidence Intake` if the user/Claude can provide logs/browser QA checklist.
- Or `ADMIN-UX-1` / `OPS-1` depending on priority.

## Evidence Request For User / Claude

To close the full public launch blockers, provide a dated summary for:

1. Hostinger logs: deployment/runtime/build/500/503/Prisma/auth/storage/PDF/memory/crash loop status.
2. Browser QA: login, dashboard, create two assessments, save/reopen/modify, lifecycle badges, isolation.
3. Product flow: prerequisites, upload, parser, report preview, PDF generate/download/history, secure access.
4. Admin: queue, counters, entitlement/full report sanity.
5. QA data: inventory and archive/retention decision.

Do not include secrets, cookies, reset links or tokens.

## PUBLIC-BETA-OPS-4 Follow-up

Date: 2026-05-27.

Result:

- No new user-attested or Claude-attested evidence was provided.
- Codex route/build/password recovery checks remained healthy.
- Percentages were not increased.
- Full public launch remains NO.

Decision:

- Limited public beta remains operational at the prior confidence level.
- Do not rerun evidence closure again without new manual logs/browser/product-flow evidence.
