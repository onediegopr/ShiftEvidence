# HITO ADVISOR-ENTITLEMENT-QA-1 — Enable Senior Advisor Input for QA Smoke

## Objective

Diagnose why the `Senior Advisor` tab was visible in production but the message input was unavailable, and enable Advisor input in a controlled way for a QA target only.

This hito does not implement ADVISOR-2, does not add Project Memory Vault, does not add RAG, does not add billing, does not change pricing, does not create migrations, does not apply migrations, does not use `db push`, does not use `migrate reset`, does not deploy, does not change environment variables, and does not declare full public launch.

## Status

Status: `PARCIAL`.

Reason:

- The blocker was diagnosed.
- A temporary QA entitlement was created for the target QA user.
- The repo remains functionally unchanged.
- Enabled authenticated message send, persistence and usage tracking still require a real QA smoke.

## Root Cause

The `SeniorMigrationAdvisorPanel` disables input when `usage.enabled` is false or credits are exhausted.

Exact UI conditions:

- Textarea disabled when `!usage.enabled || usage.exhausted || isPending`.
- Suggested prompts disabled when `!usage.enabled || usage.exhausted || isPending`.
- Submit button disabled when `usage.enabled` is false, credits are exhausted, the message is empty, or the action is pending.

Files:

- `src/components/assessments/SeniorMigrationAdvisorPanel.tsx`.
- `src/server/advisor/seniorAdvisorPlanLimits.ts`.
- `src/server/advisor/seniorAdvisorService.ts`.

Server-side source:

- `getSeniorAdvisorPanelState` calls `getAdvisorUsageState`.
- `getAdvisorUsageState` calls `getEffectiveUserEntitlement`.
- `resolveSeniorAdvisorPlanLimits` resolves the Advisor plan from:
  - `UserEntitlement.planKey`;
  - `Assessment.planLevel`;
  - `Workspace.plan`;
  - fallback `starter`.

Observed production state:

- QA user exists.
- QA workspaces are on `free`.
- No active `UserEntitlement` existed for the QA user before this hito.
- Therefore Advisor plan resolved to `starter`.
- `starter` has `enabled=false` and `messageLimit=0`.

Conclusion:

- The input was blocked by plan/entitlement, not by missing tables, not by the UI tab itself, and not by a detected Prisma table error.

## Target QA

Target QA user:

- `vivianafernandez@gmail.com`.

Resolved user:

- User found in production.
- Workspace role: owner.
- Existing workspaces inspected: `free` plan.

Assessment target:

- Not assessment-specific in this hito.
- The current entitlement model is user-scoped, not assessment-scoped.
- The QA enablement applies only to this QA user until expiry.

## Enablement Method

Method used:

- Existing `UserEntitlement` mechanism.

Why this method:

- It avoids code changes.
- It avoids global unlock.
- It avoids pricing/billing changes.
- It is reversible.
- It uses the same plan resolution path already used by the Advisor service.

Entitlement created:

- `id`: `advisor-qa-20260530-viviana`.
- `planKey`: `internal_qa`.
- `status`: `manual`.
- `source`: `advisor_entitlement_qa_1`.
- `aiEnabled`: `true`.
- `fullReportEnabled`: `false`.
- `expiresAt`: `2026-06-06T23:59:59.000Z`.

Audit event created:

- `eventType`: `advisor_qa_entitlement_granted`.
- Message: `Acceso QA temporal para Senior Advisor habilitado para smoke controlado.`

Expected behavior:

- `internal_qa` normalizes to the Advisor `partner` limit bucket.
- Advisor should show an enabled input for this QA user after session refresh/reload.
- AI operational controls still apply.
- Budget controls still apply.
- Credits still apply.
- Ownership guards still apply.

## What Was Not Opened

Not opened:

- No global Advisor enablement.
- No plan mapping change.
- No billing change.
- No pricing change.
- No workspace plan change.
- No assessment plan change.
- No code hardcoding of email.
- No cross-workspace bypass.
- No ownership bypass.
- No migration.
- No deploy.

## Reversal

Preferred reversal:

- Let the entitlement expire automatically on `2026-06-06T23:59:59.000Z`.

Manual reversal if needed:

```sql
UPDATE "UserEntitlement"
SET status = 'revoked',
    "updatedAt" = NOW(),
    "notesInternal" = concat(coalesce("notesInternal", ''), ' Revoked after ADVISOR-ENTITLEMENT-QA-1 smoke.')
WHERE id = 'advisor-qa-20260530-viviana';
```

Do not delete advisor conversations created during smoke unless a future retention/delete policy explicitly allows it.

## Validation

Non-destructive local validations:

- `npx prisma validate`: OK with safe local dummy `DATABASE_URL`.
- `npx prisma generate`: OK with safe local dummy `DATABASE_URL`.
- `npm run test:run`: OK, 43 files / 168 tests.
- `npm run lint`: OK.
- `npm run typecheck`: OK.
- `npm run build`: OK.
- `npm run hostinger:diagnose`: OK.

Build note:

- Existing Turbopack/NFT warning remains known and non-blocking.

Hostinger diagnose note:

- The script does not print secrets.
- The script does not connect to the DB.
- The script does not mutate Hostinger.
- Local env values were absent and were not treated as production validation.

## Remaining Smoke

Next smoke must validate:

- Input visible/enabled for QA user.
- Suggested prompts enabled.
- Message send with:

```text
What should I complete next in this assessment?
```

- Response or controlled fallback.
- No 500.
- No provider crash.
- No invented evidence.
- No migration guarantee.
- Available evidence vs missing evidence separation.
- History persists after reload.
- Counter updates.
- No cross-assessment leakage.
- `AiUsageEvent.operationType = senior_advisor_message`.
- Logs contain no secrets or raw file contents.

## Final Verdict

`ADVISOR-ENTITLEMENT-QA-1` is `PARCIAL`.

The input blocker was caused by missing Advisor entitlement for a free-plan QA user. A temporary, user-scoped QA entitlement was created using the existing entitlement mechanism. The next hito must validate the enabled Advisor flow end-to-end.

## Next Step

Run:

- `ADVISOR-SMOKE-1C — Enabled Senior Advisor Message, Persistence & Usage Tracking Smoke`.

Do not start ADVISOR-2 until enabled smoke is complete.
