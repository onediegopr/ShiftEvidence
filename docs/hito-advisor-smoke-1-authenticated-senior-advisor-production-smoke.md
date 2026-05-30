# HITO ADVISOR-SMOKE-1 — Authenticated Senior Migration Advisor Production Smoke

## Objective

Validate the `Senior Migration Advisor` module in production after the Neon DB migration.

This hito does not implement code, does not mutate the database, does not apply migrations, does not deploy, does not change environment variables, does not touch pricing, does not declare full public launch, and does not start ADVISOR-2.

## Context

ADVISOR-RELEASE-APPLY-1 applied and verified the production Neon migration:

- `20260530193000_advisor_1_basic_chat`.

Production DB state previously verified:

- Project: `InfraShift`.
- Branch: `production`.
- Database: `neondb`.
- Tables present:
  - `AssessmentAdvisorConversation`;
  - `AssessmentAdvisorMessage`.
- Enums present:
  - `AssessmentAdvisorConversationStatus`;
  - `AssessmentAdvisorMessageRole`;
  - `AssessmentAdvisorMessageStatus`.
- `_prisma_migrations`: migration present with `finished_at`.
- `rolled_back_at`: `null`.
- `logs`: `null`.
- `failed_count`: `0`.

Runtime requirement:

- Runtime must include `b08a124 feat: add Senior Migration Advisor basic chat` or later.

## Git Preflight

Git state before this documentation:

- Branch: `main`.
- HEAD: `049ac46 docs: record Senior Advisor production migration`.
- `origin/main`: synchronized.
- Working tree: clean.
- Ahead/behind: none.
- Stash preserved: `stash@{0}: On main: park beta invite docs before functional readiness`.

## Deploy / Runtime

Runtime commit could not be confirmed from this environment.

Findings:

- Public HTTP routes are available and serving Next assets.
- No public commit/version marker was found during local inspection.
- Chrome authenticated automation did not respond in two connection attempts.
- No Hostinger deploy or redeploy was executed.
- No hPanel or Hostinger mutation was performed.

Runtime status:

- `b08a124` or later applied: not confirmed.
- Build status: not confirmed.
- Auto-deploy status: not confirmed.

Operational interpretation:

- The DB is ready for Advisor.
- The authenticated Advisor smoke remains pending until runtime and session access are confirmed.

## Public Smoke

Public smoke executed by HTTP.

| Route | Status | Next assets | Error signal |
| --- | ---: | --- | --- |
| `/` | 200 | yes | no |
| `/shiftreadiness` | 200 | yes | no |
| `/sign-in` | 200 | yes | no |
| `/sign-up` | 200 | yes | no |
| `/sample-report` | 200 | yes | no |

Result:

- Public routes OK.
- No Hostinger 404 detected.
- No 500 detected.
- No chunk error signal detected in this HTTP smoke.

## Auth Guard Smoke

Authenticated routes were checked without a session to confirm safe redirect behavior.

| Route | Status | Location |
| --- | ---: | --- |
| `/dashboard` | 307 | `/sign-in` |
| `/dashboard/assessments` | 307 | `/sign-in` |
| `/dashboard/admin` | 307 | `/sign-in` |

Result:

- Auth guard works for unauthenticated requests.
- No authenticated dashboard content was exposed without a session.

## Auth / Core Smoke

Authenticated core smoke was not executed.

Not validated in this hito:

- `/dashboard`;
- `/dashboard/assessments`;
- assessment detail;
- Completion Center;
- authenticated auth loop behavior;
- authenticated server errors.

Reason:

- No usable authenticated browser session was available.
- Chrome authenticated automation did not respond in two connection attempts.
- Credentials were not requested, stored, or handled.

## Advisor UI

Senior Advisor UI smoke was not executed.

Not validated:

- `Senior Advisor` tab visible or locked state visible.
- Helper copy.
- What it can/cannot do.
- Suggested prompts.
- Message/credit counter.
- Request more advisor credits placeholder.
- Input state.

Reason:

- Authenticated assessment access was not available in this context.

## Locked State

Locked state was not tested.

Pending validations:

- Advisor blocked for plans without entitlement.
- Clear upgrade/contact copy.
- No AI call when locked.
- No credit consumption when locked.
- No server error.

## Message Send

Message send was not executed.

QA prompt reserved for future smoke:

```text
What should I complete next in this assessment?
```

Pending validations:

- Send succeeds or safe fallback appears.
- Loading state appears.
- Response does not invent evidence.
- Response separates available evidence and missing evidence.
- Response does not promise guaranteed migration success.
- Response does not override Ceph, Licensing, or readiness engines.
- Provider errors degrade safely.
- AI disabled/budget blocked/credits exhausted states degrade safely.

## Persistence

Persistence was not tested.

Pending validations:

- User message persists after reload.
- Assistant response persists after reload.
- Counter updates.
- Conversation does not duplicate.
- No cross-assessment data appears.

## Usage Tracking / Logs

Usage tracking was not reviewed.

Pending validations:

- `AiUsageEvent` records `senior_advisor_message`.
- Audit event is emitted if configured.
- No full prompt stored in metadata.
- No raw file contents stored in metadata.
- No secrets in logs.
- No Prisma missing table errors.
- No provider uncaught errors.
- No cross-workspace leakage.

No DB read was performed in this hito.

## Admin / IA y Consumo

Admin Advisor usage visibility was not validated.

Pending:

- Confirm whether Advisor usage appears in `IA y Consumo`.
- Confirm no raw chat is visible in admin.
- If not visible, track as ADVISOR-5 / admin visibility future work.

## Security

Confirmed:

- No secrets were requested.
- No credentials were handled.
- No QA message was sent.
- No raw file contents were used.
- No database mutation was performed.
- No migrations were applied.
- No deploy was executed.
- No env vars were changed.
- No pricing was touched.
- Full public launch was not declared.

## Final Status

Status: `PARCIAL`.

What was validated:

- Git clean/synchronized.
- Public routes OK.
- Auth guard redirects unauthenticated dashboard/admin routes to `/sign-in`.
- Production DB was previously ready for Advisor after Neon migration.

What remains:

- Confirm deployed runtime includes `b08a124` or later.
- Run authenticated core smoke.
- Run `Senior Advisor` UI smoke.
- Validate locked state.
- Send QA message if entitlement allows.
- Validate history persistence.
- Validate `senior_advisor_message` usage tracking.
- Review logs for Advisor/provider/Prisma errors.

Final verdict:

- Advisor production DB is ready.
- Authenticated Advisor functional smoke is not closed yet.
- ADVISOR-2 should not start until the Advisor basic smoke is completed.

## Next Step

Run a follow-up authenticated smoke with a real admin/QA session available:

- `ADVISOR-SMOKE-1B — User-Attested Senior Advisor Authenticated Smoke Closure`.

If runtime is not yet on `b08a124` or later, first confirm deploy/runtime status before testing Advisor.
