# HITO ADVISOR-SMOKE-1B — User-Attested Senior Advisor Authenticated Smoke

## Executive Summary

The authenticated Senior Migration Advisor production smoke was manually validated by the user after the Neon production migration was applied.

Status: `PARCIAL`.

Verdict:

- The production app authenticates correctly.
- Dashboard, assessments, assessment detail and Completion Center load correctly.
- The `Senior Advisor` tab is visible in production.
- The Advisor locked state is visible and does not produce a visible error.
- Real message sending, response quality, persistence and usage tracking remain pending because the current user/workspace is blocked by plan/entitlement.

Full public launch remains not declared.

ADVISOR-2 should not start yet. The next operational step should be enabling Advisor for a QA user/workspace or creating a dedicated entitlement hito to test real message send and persistence.

## Context

ADVISOR-RELEASE-APPLY-1 applied the production Neon migration:

- `20260530193000_advisor_1_basic_chat`.

Previously verified in Neon production:

- `AssessmentAdvisorConversation` table present.
- `AssessmentAdvisorMessage` table present.
- `AssessmentAdvisorConversationStatus` enum present.
- `AssessmentAdvisorMessageRole` enum present.
- `AssessmentAdvisorMessageStatus` enum present.
- `_prisma_migrations` includes the Advisor migration with `finished_at`.
- `failed_count`: `0`.

ADVISOR-SMOKE-1 remained partial because the authenticated browser smoke could not be completed from the Codex environment.

## User-Attested Runtime / Deploy

Manual result:

- Commit deployed: not visually confirmed.
- Includes `b08a124` or later: not directly confirmed.
- Runtime evidence: the `Senior Advisor` tab is visible in production.
- Build status: not reviewed.

Interpretation:

- Runtime likely includes the Advisor UI because the tab is visible.
- Exact deployed commit still remains unconfirmed.

## Public Smoke

Public routes were already validated in ADVISOR-SMOKE-1 and accepted for this closure:

- `/`: OK.
- `/shiftreadiness`: OK.
- `/sign-in`: OK.
- `/sign-up`: OK.
- `/sample-report`: OK.

No new public failure was reported by the user.

## Auth / Core Smoke

Manual authenticated validation:

- Login: OK.
- `/dashboard`: OK.
- `/dashboard/assessments`: OK.
- Assessment detail: OK.
- Completion Center: OK.

Result:

- Core authenticated experience is operational.
- No auth loop reported.
- No visible server error reported.

## Senior Advisor UI

Manual validation:

- Tab `Senior Advisor`: visible.
- Helper copy: visible or partially visible.
- What it can/cannot do: not confirmed in detail.
- Suggested prompts: not confirmed.
- Credits/messages: not confirmed.
- Request more advisor credits: not confirmed.
- Input: not available because the module is blocked by plan/entitlement.

Result:

- The Advisor surface is visible in production.
- The full enabled Advisor UI was not validated because entitlement blocks chat access.

## Locked State

Manual validation:

- Locked state tested: yes.
- Result: `Senior Advisor` appears, but chat access is blocked by plan/entitlement.
- Visible error: none reported.
- Interpretation: locked state appears correct.

Result:

- Advisor can be present without breaking the assessment page.
- Plan/entitlement gating is working at least visually.

## Message Send

Manual validation:

- Executed: no.
- Message used: not applicable.
- Response/fallback: not tested.
- Quality: not evaluated.
- Errors: none observed.

Reason:

- The current plan/entitlement blocks chat access.

Pending QA prompt for future enabled smoke:

```text
What should I complete next in this assessment?
```

## Persistence

Manual validation:

- History persistence: not tested.
- Counter update: not tested.
- Cross-assessment leakage: not observed.

Reason:

- No message could be sent due to locked plan/entitlement.

## Usage / Logs

Manual validation:

- `senior_advisor_message`: not tested / not reviewed.
- Provider errors: not reviewed.
- Prisma errors: no visible Prisma error reported.
- Secrets visible: no.

Result:

- No visible secret leakage.
- Usage tracking remains pending until a real Advisor message can be sent.

## Final Status

Advisor smoke status: `PARCIAL`.

Confirmed:

- Production login works.
- Dashboard works.
- Assessment list works.
- Assessment detail works.
- Completion Center works.
- `Senior Advisor` tab is visible.
- Locked state appears to work and does not show visible errors.
- No secrets visible.
- Full public launch not declared.

Not confirmed:

- Exact deployed commit.
- Build status.
- Full Advisor helper/details.
- Suggested prompts.
- Credit counter.
- Request credits placeholder.
- Message send.
- AI response or fallback.
- Chat history persistence.
- `AiUsageEvent` operation `senior_advisor_message`.
- Provider/log telemetry.

## ADVISOR-2 Readiness

ADVISOR-2 should not start yet.

Reason:

- The Advisor basic chat has not been validated end-to-end with an enabled plan/entitlement.
- Message send, persistence and usage tracking remain untested.

Recommended prerequisite:

- Enable Advisor for a QA user/workspace or run a dedicated entitlement hito before ADVISOR-2.

## Security

- No DB mutation performed in this hito.
- No migration applied in this hito.
- No deploy performed in this hito.
- No env vars changed.
- No pricing touched.
- No secrets requested or recorded.
- No sensitive Advisor QA message sent.
- Full public launch not declared.

## Next Step

Recommended next hito:

- `ADVISOR-ENTITLEMENT-QA-1 — Enable Senior Advisor for QA Workspace`.

Then rerun enabled smoke:

- message send;
- response/fallback quality;
- persistence;
- usage tracking;
- logs.
