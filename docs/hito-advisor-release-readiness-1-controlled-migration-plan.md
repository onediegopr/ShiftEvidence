# HITO ADVISOR-RELEASE-READINESS-1 — Senior Advisor Controlled Migration Plan

## 1. Objective

This document prepares the controlled release plan for applying the Senior Migration Advisor database migration in the target environment.

This hito is documentation and audit only. It does not apply production migrations, does not deploy, does not mutate the database, does not change environment variables, and does not declare full public launch.

## 2. Current Status

- ADVISOR-AUDIT-1: complete.
- ADVISOR-1: implemented and pushed.
- Current Advisor implementation commit: `b08a124 feat: add Senior Migration Advisor basic chat`.
- Advisor architecture: 55-65%.
- Advisor implementation: 35-45%.
- Advisor UX: 40-50%.
- Token economy: 45-55%.
- Documentation: 45-55%.
- Full public launch: not declared.

## 3. Git State

Preflight confirmed:

- Branch: `main`.
- `origin/main`: synchronized with local `main` at `b08a124` during this audit.
- Working tree before documentation: clean.
- Local ahead/behind before documentation: none.
- Stash preserved: `stash@{0}: On main: park beta invite docs before functional readiness`.

No divergence was detected during the preflight.

## 4. Non-Destructive Validations

The following validations were executed locally only. No production database mutation and no deployment were performed.

| Command | Result | Notes |
| --- | --- | --- |
| `npm run test:run` | OK | 43 files / 168 tests. |
| `npm run lint` | OK | No lint errors. |
| `npm run typecheck` | OK | TypeScript passed. |
| `npx prisma validate` | OK | Executed with a safe local dummy `DATABASE_URL`. |
| `npx prisma generate` | OK | Executed with a safe local dummy `DATABASE_URL`. |
| `npm run build` | OK | Build passed. Known Turbopack/NFT warning remains non-blocking. |
| `npm run hostinger:diagnose` | OK | Diagnostic only; no Hostinger mutation. Local environment variables were not treated as production validation. |

Limitations:

- `npx prisma migrate status` was not executed against the production database in this hito.
- Production drift cannot be ruled out by this local audit alone.
- Production backup/PITR, target environment variables, AI provider runtime settings, and authenticated smoke access must be confirmed before applying the migration.

## 5. Advisor Migration Inventory

Migration audited:

- `prisma/migrations/20260530193000_advisor_1_basic_chat/migration.sql`

The migration is additive and introduces the persistence layer for the Senior Migration Advisor basic chat.

### 5.1 Enums Created

- `AssessmentAdvisorConversationStatus`
  - `active`
  - `archived`
- `AssessmentAdvisorMessageRole`
  - `user`
  - `assistant`
  - `system`
- `AssessmentAdvisorMessageStatus`
  - `completed`
  - `failed`
  - `blocked`

### 5.2 Tables Created

#### `AssessmentAdvisorConversation`

Purpose:

- Stores one active advisor conversation per assessment for ADVISOR-1.

Key fields:

- `id`
- `assessmentId`
- `workspaceId`
- `status`
- `title`
- `createdByUserId`
- `messageCount`
- `creditUsed`
- `lastMessageAt`
- `createdAt`
- `updatedAt`

Indexes and constraints:

- Primary key on `id`.
- Unique constraint on `assessmentId`.
- Indexes on `assessmentId`, `workspaceId`, `status`, `createdByUserId`, and `lastMessageAt`.

Relationships:

- `assessmentId` references `Assessment(id)` with cascade delete.
- `workspaceId` references `Workspace(id)` with cascade delete.
- `createdByUserId` references `user(id)` with set null on delete.

#### `AssessmentAdvisorMessage`

Purpose:

- Stores user and assistant messages for the Senior Migration Advisor conversation.

Key fields:

- `id`
- `conversationId`
- `assessmentId`
- `workspaceId`
- `userId`
- `role`
- `content`
- `sanitizedContent`
- `status`
- `model`
- `provider`
- `estimatedInputTokens`
- `estimatedOutputTokens`
- `estimatedCostUsd`
- `creditCost`
- `safetyFlagsJson`
- `referencedContextJson`
- `createdAt`

Indexes and constraints:

- Primary key on `id`.
- Indexes on `conversationId`, `assessmentId`, `workspaceId`, `userId`, `role`, `status`, and `createdAt`.

Relationships:

- `conversationId` references `AssessmentAdvisorConversation(id)` with cascade delete.
- `assessmentId` references `Assessment(id)` with cascade delete.
- `workspaceId` references `Workspace(id)` with cascade delete.
- `userId` references `user(id)` with set null on delete.

### 5.3 Schema Impact

- Adds new Advisor models and enums.
- Adds Prisma relation fields to existing models, but does not add physical columns to existing production tables.
- Does not modify `AiUsageEvent`.
- Does not modify `AuditEvent`.
- Does not modify Storage/Ceph models.
- Does not modify Licensing models.
- Does not modify RVTools parsing tables.

### 5.4 Destructiveness

No destructive SQL was detected:

- No `DROP`.
- No `RENAME`.
- No `DELETE`.
- No backfill.
- No required new columns on existing tables.

### 5.5 Backfill

No backfill is required.

Existing assessments can operate without existing advisor conversations. Conversations are created lazily when the Advisor panel state or message flow requires them.

## 6. Prisma / DB Risk Audit

Risk classification: low to medium.

The migration is low risk because it is additive and creates isolated Advisor-specific tables. It is medium operational risk because the deployed ADVISOR-1 runtime expects these tables when the assessment detail page loads the `Senior Advisor` panel state.

### 6.1 Relationships

Relationships are scoped by both assessment and workspace:

- Advisor conversations belong to an assessment and workspace.
- Advisor messages belong to a conversation, assessment, workspace, and optionally a user.

This supports workspace isolation and avoids cross-assessment chat leakage when ownership guards are correctly enforced at the service/action layer.

### 6.2 Cascades

Cascade delete is used for assessment/workspace-owned advisor records:

- Deleting an assessment removes its advisor conversation and messages.
- Deleting a workspace removes its advisor conversation and messages.

User deletion uses `SET NULL`, preserving conversation history without retaining a hard user dependency.

### 6.3 Constraints

The unique constraint on `AssessmentAdvisorConversation.assessmentId` enforces one conversation per assessment in ADVISOR-1.

This is acceptable for the first release because ADVISOR-1 intentionally implements a basic persistent chat, not multiple named conversations or Project Memory Vault.

### 6.4 Forward Compatibility

If the migration is applied and the app must roll back to a previous runtime, the database remains forward-compatible because older runtimes ignore the new tables and enums.

### 6.5 New App Without Migration

If the ADVISOR-1 runtime runs before the migration is applied, the following can fail:

- Assessment detail page loading if it calls `getSeniorAdvisorPanelState`.
- `Senior Advisor` tab state.
- Advisor message listing.
- Advisor message sending.
- Credit counter and conversation persistence.

Because the Advisor tab is integrated into the assessment detail page, the release should apply the migration before or at the same time as deploying the ADVISOR-1 runtime.

## 7. Functional Dependencies

The ADVISOR-1 code depends on the migration in these areas:

- `src/app/dashboard/assessments/[id]/page.tsx`
- `src/app/dashboard/assessments/[id]/advisor/actions.ts`
- `src/components/assessments/SeniorMigrationAdvisorPanel.tsx`
- `src/server/advisor/seniorAdvisorService.ts`
- `src/server/advisor/seniorAdvisorContextService.ts`
- `src/server/advisor/seniorAdvisorPlanLimits.ts`
- `src/server/advisor/seniorAdvisorPrompt.ts`
- `src/server/advisor/seniorAdvisorSecurity.ts`
- `src/server/advisor/seniorAdvisorValidation.ts`
- `src/server/ai/aiUsageService.ts`

The Advisor also depends on existing platform capabilities:

- Assessment ownership guards.
- AI budget guard.
- Runtime AI provider configuration.
- Existing `AiUsageEvent` persistence.
- Existing audit event infrastructure.
- Existing assessment detail routing and module tabs.

Fallback behavior:

- Plan disabled: locked state.
- Credits exhausted: blocked state with request credits placeholder.
- AI disabled: safe fallback.
- Budget blocked: safe fallback.
- Provider error: safe failure.

Important caveat:

- These fallbacks protect the Advisor experience, but they do not eliminate the need for the Advisor tables once the ADVISOR-1 runtime is deployed.

## 8. Future Release Order For ADVISOR-RELEASE-APPLY-1

Recommended controlled release sequence:

1. Confirm database backup/PITR or restore path with timestamp.
2. Confirm exact Git commit to release.
3. Confirm target environment variables without printing secrets.
4. Confirm AI provider settings and fallback mode.
5. Confirm access to logs and restart/deploy channel.
6. Confirm authenticated smoke user and test assessment.
7. Run `npx prisma migrate status` against the target database.
8. Stop if drift, failed migrations, or unexpected pending migrations are detected.
9. Run production build in the release environment.
10. Stop if tests, typecheck, Prisma generate, or build fail.
11. Apply `npx prisma migrate deploy`.
12. Run `npx prisma migrate status` again.
13. Confirm the database schema is up to date.
14. Restart or deploy the app if needed by the hosting flow.
15. Smoke public routes.
16. Smoke authenticated dashboard and assessment detail.
17. Smoke `Senior Advisor` tab.
18. Smoke locked state by plan.
19. Smoke message sending in a QA assessment if entitlement allows.
20. Smoke AI disabled, budget blocked, credits exhausted, and provider error fallbacks where possible.
21. Verify `AiUsageEvent` records `senior_advisor_message` without storing full prompts or secrets.
22. Review logs for Prisma, Advisor, AI provider, auth, and ownership errors.
23. Document final release result.

## 9. Advisor Post-Release Smoke Plan

### 9.1 Public Smoke

Validate:

- `/`
- `/shiftreadiness`
- `/sign-in`
- `/sign-up`
- `/sample-report`

Expected:

- Public routes respond normally.
- No 500 errors.
- No Hostinger 404.
- No chunk errors.

### 9.2 Authenticated User Smoke

Validate:

- Login.
- `/dashboard`.
- `/dashboard/assessments`.
- Assessment detail page.
- Existing tabs still load.
- Completion Center still loads.
- No auth loop.
- No server error.

### 9.3 Senior Advisor Tab Smoke

Validate:

- `Senior Advisor` tab is visible where expected.
- Helper copy is visible.
- Suggested prompts are visible.
- Credit/message counter is visible.
- Request credits placeholder is visible.
- Locked state appears for plans without Advisor access.
- Enabled state appears for entitled plans.
- Input respects max length.
- Send button handles loading and disabled states.

### 9.4 Message Persistence Smoke

On a QA assessment with Advisor entitlement:

- Send a non-sensitive test question.
- Validate assistant response.
- Reload the assessment.
- Confirm chat history persists.
- Confirm message count/credits update.
- Confirm no raw file contents are displayed.
- Confirm no private storage paths are displayed.

### 9.5 Advisor Answer Safety Smoke

Ask questions that touch deterministic modules:

- “Explain the Ceph result.”
- “Can I generate the report now?”
- “Is the migration guaranteed?”
- “Is the licensing estimate a quote?”

Expected:

- Advisor does not guarantee migration success.
- Advisor does not approve production migration.
- Advisor does not override Ceph status.
- Advisor does not override Licensing confidence.
- Advisor labels missing evidence.
- Advisor separates confirmed, inferred, customer-reported, and missing information.

### 9.6 AI Fallback Smoke

Validate where possible:

- AI disabled.
- Budget blocked.
- Credits exhausted.
- Provider error.

Expected:

- Advisor returns safe blocked/fallback messages.
- Core assessment remains usable.
- No global app failure.

### 9.7 Admin / Logs Smoke

Validate:

- `AiUsageEvent` records `senior_advisor_message`.
- Audit events are emitted for Advisor message sent/failed/limit reached where applicable.
- Logs do not contain secrets.
- Logs do not contain full prompts.
- Logs do not contain raw file contents.
- No cross-workspace access is observed.

If Advisor usage is not visible in admin yet, document it as a planned ADVISOR-5 enhancement.

## 10. Rollback Plan

### 10.1 If Migration Is Not Applied

- Do not deploy the ADVISOR-1 runtime.
- Or keep the Advisor feature hidden/locked until migration can be applied.

### 10.2 If Migration Applies And App Fails

- Roll back the application runtime to the previous stable commit.
- Keep the database forward with the new additive Advisor tables.
- Do not drop Advisor tables as a first response.

### 10.3 If Advisor Fails But Core App Works

- Hide or lock the Advisor tab through a hotfix or feature gate.
- Keep dashboard, assessments, Storage/Ceph, Licensing, and reports operational.
- Use provider/budget fallback if the failure is AI-specific.

### 10.4 If AI Provider Fails

- Keep Advisor blocked or fallback.
- Do not impact core assessment workflows.
- Do not retry in a way that bypasses budget guard.

### 10.5 Database Restore

Database restore should be reserved for severe data damage only.

The audited migration is additive, so a forward fix or app rollback is preferred over database restore.

### 10.6 Conversation Data

Do not delete advisor conversations unless a future retention/delete policy explicitly authorizes it.

## 11. GO / NO-GO

### 11.1 GO Técnico Preliminar

Technical GO for a future ADVISOR-RELEASE-APPLY-1 is reasonable if the target environment confirms:

- Migration is still the only pending Advisor migration.
- No drift.
- No failed migrations.
- Backup/PITR confirmed.
- Build passes in the release environment.
- AI provider or AI-disabled fallback is configured.
- Smoke user and assessment are available.
- Logs/restart/deploy channel is available.

Rationale:

- Migration is additive.
- No destructive SQL was found.
- No backfill is required.
- Existing app rollback is forward-compatible with the new tables.
- Local tests, lint, typecheck, Prisma validation, Prisma generation, and build passed.

### 11.2 NO-GO Operativo Until Prerequisites Are Confirmed

Do not apply the Advisor migration until these are confirmed in the target environment:

- Backup/PITR or restore path.
- Target `DATABASE_URL` through a safe release channel.
- `npx prisma migrate status` against the target database.
- No drift or failed migrations.
- Required app environment variables.
- AI provider settings or safe disabled fallback.
- Authenticated smoke access.
- Logs and restart/deploy channel.

If any of these fail, the release should remain blocked.

## 12. What Was Not Executed

This hito did not execute:

- Production deploy.
- Production migration.
- `npx prisma migrate deploy`.
- `prisma db push`.
- `prisma migrate reset`.
- Production database mutation.
- Hostinger mutation.
- Environment variable changes.
- Full public launch declaration.

## 13. Remaining Risks

- ADVISOR-1 production migration remains pending.
- ADVISOR-2 Project Memory Vault remains pending.
- ADVISOR-3 RAG / Methodology KB remains pending.
- Real billing and deep credit ledger remain pending.
- Retention/export/delete policy remains pending.
- Full admin visibility for Advisor remains pending.
- Proactive Advisor remains pending.
- Authenticated production smoke for Advisor remains pending.
- Full public launch remains not declared.

## 14. Recommended Next Step

Proceed to a controlled push of this readiness document if needed.

Then run `ADVISOR-RELEASE-APPLY-1` only with explicit approval and only after target backup/PITR, `migrate status`, AI runtime settings, logs/restart channel, and authenticated smoke access are confirmed.
