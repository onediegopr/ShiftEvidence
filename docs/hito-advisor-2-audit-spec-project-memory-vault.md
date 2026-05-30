# HITO ADVISOR-2-AUDIT-SPEC - Project Memory Vault Architecture & Implementation Specification

## 1. Objective

Define the architecture and implementation roadmap for ADVISOR-2 - Project Memory Vault.

This is an audit and specification milestone only. It does not implement code, does not create migrations, does not touch DB state, does not change env vars, does not deploy, does not introduce RAG or embeddings, and does not declare full public launch.

The purpose of ADVISOR-2 is to add structured, auditable, per-assessment project memory to the existing Senior Migration Advisor without confusing chat history with durable project knowledge.

Core principle:

- Chat log stores conversation.
- Project Memory Vault stores structured knowledge, decisions, questions, constraints, recommendations and summaries that can be reviewed, invalidated and safely injected into future Advisor prompts.

## 2. Advisor v1 Current State

Senior Migration Advisor v1 is operationally closed by user-attested validation.

Current v1 includes:

- `Senior Advisor` tab inside an assessment.
- Basic per-assessment chat.
- Persistent conversation and message history.
- Plan and entitlement gating.
- Internal QA entitlement path.
- Message limits and credit counter.
- Request more credits placeholder.
- Suggested prompts.
- Helper can-do and cannot-do guidance.
- Usage tracking through `AiUsageEvent.operationType=senior_advisor_message`.
- Audit events for message sent, blocked, failed and credit request actions.
- Compact UI with internal chat scroll and sticky composer.
- Gemini primary provider.
- OpenCode Go fallback.
- OpenAI not exposed as an operational provider.

Current readiness after v1 closure:

- Architecture: 70-80%.
- Implementation: 60-70%.
- UX: 80-88%.
- Token economy: 60-70%.
- Documentation: 75-85%.
- Production readiness Advisor v1: 82-90%.

## 3. Advisor v1 Audit Map

Existing models:

- `AssessmentAdvisorConversation`: one conversation per assessment via `assessmentId @unique`; includes `workspaceId`, `createdByUserId`, `messageCount`, `creditUsed`, `lastMessageAt`, `status`.
- `AssessmentAdvisorMessage`: per-message log with `conversationId`, `assessmentId`, `workspaceId`, `userId`, `role`, `content`, `sanitizedContent`, `status`, provider/model metadata, token/cost estimates, safety flags, and referenced context metadata.
- `AiUsageEvent`: generic AI usage tracking with operation type, provider, model, status, token estimates and metadata.
- `AuditEvent`: generic user/workspace/assessment audit trail.

Existing services and contracts:

- `src/server/advisor/seniorAdvisorService.ts`
  - Loads panel state.
  - Resolves plan limits and usage.
  - Ensures assessment ownership.
  - Creates conversation lazily.
  - Persists user/assistant exchanges.
  - Builds bounded prompt context.
  - Calls Gemini/OpenCode Go provider handling.
  - Records usage and audit events.
- `src/server/advisor/seniorAdvisorContextService.ts`
  - Builds the current assessment context payload from deterministic modules.
  - Pulls completion, inventory, risk findings, licensing, client context, storage/Ceph, evidence metadata and reports.
  - Excludes raw uploaded file contents.
- `src/server/advisor/seniorAdvisorPrompt.ts`
  - Builds the v1 prompt with current context and recent chat messages.
  - Requires labels for confirmed, inferred, customer-reported and missing evidence.
  - Forbids invention, production approval, engine override and raw free text reproduction.
- `src/server/advisor/seniorAdvisorSecurity.ts`
  - Redacts secrets, tokens, emails and private paths.
  - Detects prompt injection and secret-like input.
- `src/server/advisor/seniorAdvisorPlanLimits.ts`
  - Resolves `starter`, `internal_qa`, `readiness_report`, `pro`, `blueprint`, `partner`.
  - Enforces current chat limits.
- `src/app/dashboard/assessments/[id]/advisor/actions.ts`
  - Server actions for send message and request credits.
- `src/components/assessments/SeniorMigrationAdvisorPanel.tsx`
  - Compact chat UI, suggested prompts, helper, usage strip, scroll, auto-scroll and composer.

Existing tests:

- `tests/unit/seniorAdvisorService.test.ts`
  - Operation type contract.
  - Gemini/OpenCode Go response parsing and fallback handling.
  - OpenAI hidden from admin-selectable runtime modes.
  - Gemini primary + OpenCode Go fallback config.
- `tests/unit/seniorAdvisorPlanLimits.test.ts`
  - Free/starter lock.
  - Professional/Blueprint limits.
  - Internal QA enablement.
  - Entitlement/assessment/workspace alias normalization.
  - Exhausted usage state.

What can be reused:

- Ownership gate via `ensureAssessmentOwnership`.
- `workspaceId` + `assessmentId` isolation pattern.
- `AuditEvent` for memory lifecycle audit trail.
- Existing AI usage event pattern if memory extraction later uses AI.
- Sanitization helpers from `seniorAdvisorSecurity`.
- Current context builder as the deterministic base for prompt memory injection.
- Plan limit resolver as the place to add memory limits.
- Advisor panel as the UI home for a compact memory block.

What should not be touched for ADVISOR-2A:

- Provider fallback logic.
- Existing chat persistence semantics.
- Existing `AssessmentAdvisorMessage` content fields.
- Existing `Assessment` shape except new relation fields required by Prisma.
- Billing/pricing runtime.
- Report generation.
- Storage/Ceph, licensing, RVTools parser and deterministic scoring engines.

Best memory hook points:

- After a successful or blocked Advisor exchange is persisted, optionally create candidate memory items.
- When building `SeniorAdvisorContextPayload`, append a bounded memory context section built by a new memory service.
- In panel state loading, include a small memory summary/sidebar payload for UI.
- In server actions, add separate memory lifecycle actions so chat sending stays simple.

Main risks:

- Treating unconfirmed memory as technical truth.
- Over-injecting memory and increasing prompt cost.
- Duplicating deterministic assessment state in memory.
- Storing raw user/client text instead of structured sanitized summaries.
- Creating memory automatically without review, causing bad facts to persist.
- Cross-workspace leakage if memory queries do not include both `assessmentId` and `workspaceId`.

## 4. Related Model Audit

Relevant existing schema observations:

- `Assessment` already owns modules, evidence, scores, findings, reports, client context, storage, licensing and Advisor chat.
- `Workspace` owns assessments, evidence files, audit events, reports and Advisor messages.
- `EvidenceFile` stores file metadata and storage path, but ADVISOR-2 must not store or inject raw file contents.
- `AssessmentClientContext.rawText` may contain customer free text; Project Memory should store sanitized summaries and source references, not raw context.
- `AssessmentClientContextAnalysis`, `AssessmentStorageAnalysis`, and `AssessmentLicensingAnalysis` already store module-specific AI/deterministic analysis. Memory should reference or summarize conclusions, not duplicate full module JSON.
- `AiUsageEvent` is useful for tracking extraction if AI extraction is added later, but deterministic ADVISOR-2 extraction does not need new usage events.
- `AuditEvent` is the correct lightweight audit trail for memory lifecycle changes.

Design implications:

- Do not put memory inside `AssessmentAdvisorMessage`; chat log and memory have different lifecycles.
- Do not put memory in `Assessment`; avoid overloading the core assessment row.
- Keep memory per assessment and workspace.
- Use source references to messages/modules instead of copying large module payloads.
- Prefer additive tables and nullable references.

## 5. Proposed Data Models

### 5.1 Required Model - `AssessmentAdvisorMemoryItem`

Recommended Prisma model:

```prisma
model AssessmentAdvisorMemoryItem {
  id                String                           @id @default(cuid())
  assessmentId      String
  workspaceId       String
  conversationId    String?
  sourceMessageId   String?
  createdByUserId   String?
  type              AssessmentAdvisorMemoryItemType
  status            AssessmentAdvisorMemoryItemStatus @default(needs_review)
  sourceType        AssessmentAdvisorMemorySourceType
  truthStatus       AssessmentAdvisorMemoryTruthStatus
  title             String
  summary           String                           @db.Text
  detailsJson       Json?
  tagsJson          Json?
  relatedEntityJson Json?
  confidence        Float?
  version           Int                              @default(1)
  supersedesId      String?
  resolvedAt        DateTime?
  createdAt         DateTime                         @default(now())
  updatedAt         DateTime                         @updatedAt

  assessment        Assessment                       @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  workspace         Workspace                        @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  conversation      AssessmentAdvisorConversation?   @relation(fields: [conversationId], references: [id], onDelete: SetNull)
  sourceMessage     AssessmentAdvisorMessage?        @relation(fields: [sourceMessageId], references: [id], onDelete: SetNull)
  createdByUser     User?                            @relation(fields: [createdByUserId], references: [id], onDelete: SetNull)
  supersedes        AssessmentAdvisorMemoryItem?     @relation("AdvisorMemorySupersession", fields: [supersedesId], references: [id], onDelete: SetNull)
  supersededBy      AssessmentAdvisorMemoryItem[]    @relation("AdvisorMemorySupersession")

  @@index([assessmentId, status])
  @@index([workspaceId, type])
  @@index([assessmentId, type, status])
  @@index([sourceMessageId])
  @@index([supersedesId])
  @@index([createdAt])
}
```

Enums:

```prisma
enum AssessmentAdvisorMemoryItemType {
  decision
  open_question
  resolved_question
  assumption
  risk_interpretation
  customer_preference
  evidence_note
  next_step
  advisor_recommendation
  constraint
  summary
}

enum AssessmentAdvisorMemoryItemStatus {
  active
  resolved
  superseded
  rejected
  needs_review
  archived
}

enum AssessmentAdvisorMemorySourceType {
  user_message
  advisor_message
  system_generated
  assessment_state
  client_context
  storage_analysis
  licensing_analysis
  manual_admin
}

enum AssessmentAdvisorMemoryTruthStatus {
  confirmed
  customer_reported
  inferred
  missing
  advisor_generated
  user_confirmed
}
```

Field rules:

- `title`: short scan label, max application-level target around 120 chars.
- `summary`: sanitized durable memory text, not raw chat or file text.
- `detailsJson`: small structured detail only, no raw context.
- `tagsJson`: string tags, bounded list.
- `relatedEntityJson`: references such as `{ "module": "storage", "evidenceType": "rvtools" }`.
- `confidence`: 0 to 1, nullable when not meaningful.
- `version`: increments when a memory item is edited or superseded.
- `supersedesId`: points to the prior item when replacing stale memory.

### 5.2 Optional Model - `AssessmentAdvisorMemorySnapshot`

Recommended for ADVISOR-2 only if prompt context or UI performance requires it. Otherwise defer to ADVISOR-3.

```prisma
model AssessmentAdvisorMemorySnapshot {
  id                     String     @id @default(cuid())
  assessmentId           String
  workspaceId            String
  summary                String     @db.Text
  openQuestionsJson      Json?
  decisionsJson          Json?
  risksJson              Json?
  nextStepsJson          Json?
  version                Int        @default(1)
  generatedFromMessageId String?
  createdAt              DateTime   @default(now())

  assessment             Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  workspace              Workspace  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([assessmentId, createdAt])
  @@index([workspaceId, createdAt])
}
```

Recommendation:

- Defer snapshot table unless UI or prompt assembly starts doing expensive aggregation.
- In ADVISOR-2A, compute a compact memory summary from active items at query time.
- Add snapshot in ADVISOR-2C or ADVISOR-3 if prompt memory grows.

### 5.3 Optional Model - `AssessmentAdvisorRecommendation`

Recommendation:

- Do not create a separate recommendation table in ADVISOR-2.
- Use `AssessmentAdvisorMemoryItem.type=advisor_recommendation`.
- Store status using `active`, `resolved`, `rejected`, `archived` and details in `detailsJson`.

Reason:

- Recommendations need the same source, truth, lifecycle and prompt rules as memory.
- A separate model would increase UI/action complexity before there is enough product evidence.

## 6. Memory Lifecycle

Recommended lifecycle:

1. Extract candidate memory.
2. Classify item type.
3. Assign source type.
4. Assign truth status.
5. Sanitize and bound text.
6. Store as `needs_review` or `active`.
7. Show in the Advisor Project Memory panel.
8. User can confirm, reject, resolve, archive or supersede.
9. Advisor prompt uses only allowed active memory with labels.
10. Resolved/superseded/rejected memory remains auditable but does not dominate prompts.
11. Memory summary updates when relevant active items change.

Recommended ADVISOR-2 behavior:

- Semi-automatic memory.
- Create candidate memory from user messages, assistant responses and deterministic assessment state.
- Avoid AI extraction in the first implementation unless explicitly approved later.
- Use deterministic/lightweight extraction for obvious patterns:
  - User says "we decided", "decision", "we will", "client prefers" -> decision or preference candidate.
  - User asks a concrete unanswered question -> open question candidate.
  - Advisor lists next steps -> next step candidate, `advisor_generated`, `needs_review`.
  - Deterministic context has missing RVTools/client context/storage/licensing -> missing/evidence_note candidate.
- Items that are inferred or advisor-generated should default to `needs_review`.
- Explicit user statements can become `active/customer_reported`, but still visibly labelled.
- Any technical fact from modules should reference `assessment_state`, `storage_analysis`, `licensing_analysis` or `client_context`.

Approval policy:

- User approval required for inferred technical assumptions, advisor recommendations and risk interpretations.
- User confirmation recommended for decisions and preferences.
- Auto-active allowed only for simple customer-reported facts from the user's own message and deterministic missing-evidence notes.

Status semantics:

- `needs_review`: candidate visible but not treated as durable fact.
- `active`: included in UI and eligible for prompt injection.
- `resolved`: closed but retained for audit and history.
- `superseded`: replaced by a newer item.
- `rejected`: user/admin rejected; excluded from prompt.
- `archived`: retained but quiet.

Truth semantics:

- `confirmed`: derived from deterministic assessment evidence or directly verified state.
- `customer_reported`: stated by the user/customer, not independently proven.
- `inferred`: derived by Advisor/service logic; must be treated cautiously.
- `missing`: known gap.
- `advisor_generated`: recommendation or interpretation produced by Advisor.
- `user_confirmed`: reviewed and confirmed by a user.

## 7. Prompt Integration

ADVISOR-2 prompt should receive a compact project memory context in addition to current assessment state.

Memory allowed into prompt:

- Active decisions.
- Active constraints.
- Open questions.
- Unresolved risk interpretations.
- Recent next steps.
- Customer preferences.
- Latest memory summary if implemented.

Memory excluded from prompt by default:

- Rejected items.
- Archived items.
- Superseded items.
- Resolved items except recent resolved questions when relevant.
- Needs-review items unless the prompt explicitly labels them as "unreviewed candidates" and only for review tasks.

Required labels:

- `confirmed`
- `customer_reported`
- `inferred`
- `missing`
- `advisor_generated`
- `user_confirmed`

Prompt rule additions:

- "Based on current assessment evidence and project memory..."
- "Treat customer-reported memory as context, not technical proof."
- "Treat inferred or advisor-generated memory as unconfirmed unless user_confirmed."
- "Do not use memory to invent missing evidence."
- "If memory conflicts with deterministic assessment state, prefer deterministic assessment state and call out the conflict."

Token strategy:

- Do not inject all memory items.
- Build a bounded memory context with top N active items.
- Suggested top N:
  - 5 open questions.
  - 5 active decisions.
  - 5 constraints/preferences.
  - 5 unresolved risks.
  - 5 next steps.
  - 1 compact summary under 1,200 chars.
- Hard cap recommended for initial memory context: 4,000 to 6,000 chars depending on plan.
- Fit memory after deterministic assessment context priority, not before it.

Recommended context builder:

```ts
buildMemoryContextForAdvisor({
  assessmentId,
  workspaceId,
  planLimits,
  maxChars,
})
```

Return shape:

```ts
type SeniorAdvisorMemoryContext = {
  version: "advisor-memory-context-v1";
  summary: string | null;
  decisions: MemoryContextItem[];
  openQuestions: MemoryContextItem[];
  constraints: MemoryContextItem[];
  risks: MemoryContextItem[];
  nextSteps: MemoryContextItem[];
  excludedCounts: {
    needsReview: number;
    rejected: number;
    superseded: number;
    archived: number;
  };
};
```

## 8. UI Specification

Recommended ADVISOR-2 UI:

- Keep current compact chat.
- Add a collapsible `Project Memory` block inside the Senior Advisor panel.
- Do not build a full split-pane or admin-grade memory console yet.

Project Memory block should show:

- Memory summary.
- Up to 3 active decisions.
- Up to 3 open questions.
- Up to 3 next steps.
- Small count badges for needs review, resolved and archived.
- Link/button: `Review project memory`.

Memory review surface:

- Can be a compact expandable section in the same panel for ADVISOR-2B.
- Later can become secondary tabs: `Chat`, `Memory`, `Decisions`, `Questions`.

Per-item controls:

- Confirm.
- Reject.
- Resolve.
- Archive.
- Mark as no longer relevant.
- Supersede with new note.

UX guardrails:

- Show truth status visibly.
- Show source type visibly.
- Use concise summaries, not full raw message bodies.
- Keep needs-review items visually distinct.
- Do not let memory panel push chat off-screen.
- Locked/free plan should show memory unavailable or upgrade-gated, with no write actions.

Recommended first-screen layout:

```text
Senior Advisor
|-- Header + Usage Strip
|-- Collapsible Project Memory
|   |-- Summary
|   |-- Decisions (3)
|   |-- Open Questions (3)
|   |-- Next Steps (3)
|   `-- Review project memory
|-- Suggested Prompt Chips
|-- Chat Window
`-- Sticky Composer
```

## 9. Services and Actions

Recommended new service:

`src/server/advisor/advisorMemoryService.ts`

Functions:

- `listMemoryItems`
- `listMemoryOverview`
- `createMemoryItem`
- `updateMemoryItemStatus`
- `confirmMemoryItem`
- `resolveMemoryItem`
- `rejectMemoryItem`
- `archiveMemoryItem`
- `supersedeMemoryItem`
- `buildMemoryContextForAdvisor`
- `maybeExtractMemoryCandidates`

Recommended extraction service:

`src/server/advisor/advisorMemoryExtractionService.ts`

Initial strategy:

- Deterministic/simple extraction first.
- No new AI extraction in ADVISOR-2A.
- AI extraction can be introduced later after cost, quality and safety controls are proven.

Recommended server actions:

- `listAdvisorMemoryAction`
- `confirmAdvisorMemoryItemAction`
- `rejectAdvisorMemoryItemAction`
- `resolveAdvisorMemoryItemAction`
- `archiveAdvisorMemoryItemAction`
- `supersedeAdvisorMemoryItemAction`
- `saveAdvisorRecommendationAsMemoryAction`

Integration with existing chat action:

- `sendSeniorAdvisorMessage` should remain the core chat operation.
- After persistence, call `maybeExtractMemoryCandidates` in a fail-soft manner.
- Memory extraction failure must not fail chat.
- Memory actions should revalidate the assessment page.

Audit events:

- `advisor_memory_item_created`
- `advisor_memory_item_confirmed`
- `advisor_memory_item_rejected`
- `advisor_memory_item_resolved`
- `advisor_memory_item_superseded`
- `advisor_memory_item_archived`
- `advisor_memory_summary_updated`

## 10. Admin Visibility

ADVISOR-2 should not implement a full admin Advisor dashboard.

Future admin metrics:

- Assessments with memory items.
- Open questions count.
- Unresolved advisor recommendations.
- Decisions captured.
- Memory items needing review.
- Advisor memory growth.
- High-activity assessments.

ADVISOR-2 recommendation:

- No full admin tab.
- At most, expose simple counts in existing admin assessment visibility if very cheap.
- Defer full Advisor memory admin visibility to ADVISOR-5.

## 11. Security and Privacy

Required controls:

- Always query memory by both `assessmentId` and `workspaceId`.
- Always call ownership checks before listing or mutating memory.
- Never store raw file contents.
- Never store secrets, tokens, passwords or private paths.
- Sanitize summaries and details before persistence.
- Redact memory item content on create/update.
- User can reject/archive memory items.
- Future retention/export/delete policy must include memory tables.
- No cross-client learning.
- No multi-assessment memory in ADVISOR-2.

Source requirements:

- Every memory item must have `sourceType`.
- If created from chat, include `conversationId` and `sourceMessageId` where possible.
- If created from deterministic state, include related module/entity in `relatedEntityJson`.
- Every item must have `truthStatus`.
- Every item should have `confidence` unless not meaningful.

Prompt safety:

- Memory cannot override deterministic readiness, Licensing or Ceph engines.
- Memory cannot be used as proof of missing technical evidence.
- Customer-reported memory must be labelled.
- Inferred memory must be labelled and reviewed.

## 12. Plan Limits and Token Economy

Recommended memory limits:

| Plan | Memory items per assessment | Open questions | Decisions | Summary | Extraction |
| --- | ---: | ---: | ---: | --- | --- |
| Starter / Free | 0 | 0 | 0 | No | No |
| Professional / Readiness Report | 25 | 10 | 10 | Basic | Deterministic only |
| Pro | 50 | 20 | 20 | Basic/full | Deterministic only |
| Blueprint | 150 | 50 | 50 | Full | Deterministic, AI later limited |
| Partner / MSP | 100 per assessment or pooled | 40 | 40 | Full | Deterministic, AI later limited |
| Internal QA | 50 | 20 | 20 | Basic/full | Deterministic only |

Recommended additions to plan limits:

- `memoryEnabled`
- `memoryItemLimit`
- `openQuestionLimit`
- `decisionLimit`
- `memorySummaryEnabled`
- `memoryPromptMaxChars`
- `memoryExtractionMode`: `none | deterministic | ai_limited`

Token economy:

- Memory context should be bounded separately from assessment context.
- Assessment deterministic context remains primary.
- Memory injection should prefer summary + high-signal active items.
- Needs-review/rejected/superseded items should not consume prompt budget.
- Extraction should be deterministic at first to avoid new AI cost.

## 13. Migration and Release Risk

ADVISOR-2 will require an additive migration.

Migration characteristics:

- New table `AssessmentAdvisorMemoryItem`.
- New enums for memory type, status, source type and truth status.
- Optional future table `AssessmentAdvisorMemorySnapshot`.
- No drops.
- No destructive changes.
- No required new columns on existing tables.
- No backfill required.
- Existing chat v1 continues working if memory UI is hidden or disabled.

Release order:

1. ADVISOR-2A: Add DB models, migration, service and tests behind no-risk service APIs.
2. Apply migration in controlled release.
3. Deploy app code that can read/write memory but does not require existing memory.
4. Enable UI memory panel.
5. Integrate bounded prompt memory context.
6. Smoke with one Internal QA assessment.

Rollback app strategy:

- If UI/actions fail, hide memory panel and keep chat v1 active.
- If prompt integration causes issues, disable memory context injection while preserving stored items.
- DB rollback should not be needed because migration is additive.

Smoke plan:

- Free/starter: memory hidden or disabled.
- Internal QA: create memory item, confirm, reject, resolve, supersede.
- Send chat after memory exists and confirm prompt still responds.
- Verify rejected/superseded items do not appear in memory context.
- Verify no raw file contents or secrets appear in memory.

## 14. Test Plan

Unit tests:

- Create memory item with valid ownership.
- Reject cross-workspace access.
- Enforce plan memory limits.
- Free plan blocked.
- Internal QA allowed.
- Sanitize secrets and private paths before persistence.
- Classify deterministic memory candidates.
- Supersede item increments version and links `supersedesId`.
- Memory context excludes rejected/superseded/archived.
- Memory context labels `truthStatus`.
- Memory context obeys max char limit.

Integration tests:

- List only memory for active assessment/workspace.
- Confirm memory item.
- Reject memory item.
- Resolve open question.
- Archive item.
- Create audit events for lifecycle changes.
- Chat send remains successful if memory extraction fails.
- Prompt builder includes labelled memory context and current assessment state.

UI tests:

- Renders collapsed Project Memory block.
- Shows summary, decisions, open questions and next steps.
- Shows needs-review count.
- Confirm/reject/resolve buttons disabled for locked plans.
- Open question can be resolved.
- Long memory summaries do not expand the page uncontrollably.

Security tests:

- No raw file contents in memory context.
- No tokens/secrets in stored summary.
- Customer-reported memory is not labelled confirmed.
- Inferred memory defaults to needs review.

## 15. Implementation Roadmap

Recommended phased implementation, not one large hito.

### ADVISOR-2A - DB Models + Services

Scope:

- Add Prisma enums and `AssessmentAdvisorMemoryItem`.
- Add migration.
- Add memory service.
- Add deterministic extraction service.
- Add plan memory limit definitions.
- Add unit/integration tests.

Rollback point:

- Memory tables can exist unused.
- Chat v1 remains unchanged.

### ADVISOR-2B - UI Memory Panel + Actions

Scope:

- Add panel state payload for memory overview.
- Add Project Memory collapsible block.
- Add memory review actions.
- Confirm/reject/resolve/archive/supersede controls.
- Add UI tests.

Rollback point:

- Hide memory panel if needed.

### ADVISOR-2C - Prompt Context Integration

Scope:

- Add `buildMemoryContextForAdvisor`.
- Inject bounded memory context into prompt.
- Add prompt rules for memory labels.
- Add token caps by plan.
- Add tests proving excluded items do not enter prompt.

Rollback point:

- Disable memory context injection while keeping memory UI.

### ADVISOR-2D - Smoke + Docs

Scope:

- Release readiness.
- Controlled migration apply.
- Internal QA smoke.
- User-attested visual smoke.
- Documentation closure.

Recommendation:

- Do not implement ADVISOR-2 as one large hito. The phased path provides clean rollback points and protects Advisor v1 stability.

## 16. Out of Scope

Not included in ADVISOR-2:

- RAG / embeddings.
- Methodology KB retrieval.
- Vector DB.
- Proactive scans.
- Real billing.
- Real credit purchase.
- Human consultant handoff.
- Full admin Advisor dashboard.
- Full retention/export/delete implementation.
- Multi-assessment memory.
- Cross-client learning.
- Email notifications.
- WhatsApp or Slack.
- Full public launch.

## 17. Final Recommendation

Proceed with ADVISOR-2A first: DB Models + Services.

The Project Memory Vault should be built as a separate, structured memory layer linked to assessment/workspace/conversation/message sources. It should not be folded into chat history, not stored on `Assessment`, and not treated as deterministic proof unless the source and truth status justify it.

The safest implementation is semi-automatic, deterministic-first, reviewable, labelled, token-bounded and auditable.

ADVISOR-2A should start only after this specification is committed and pushed.
