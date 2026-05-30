# HITO ADVISOR-2A - Project Memory Vault DB Models + Core Services

## Objective

Implement the technical foundation for Senior Migration Advisor Project Memory Vault.

This milestone adds local additive DB models, core TypeScript types, memory plan limits, sanitization, validation, lifecycle services, deterministic extraction placeholders, audit events and tests.

Out of scope for this milestone:

- No memory UI.
- No server actions for UI.
- No prompt integration.
- No AI extraction.
- No RAG, embeddings or Methodology KB.
- No billing/pricing changes.
- No provider changes.
- No production migration.
- No deploy.
- No full public launch.

## Models and Enums

Added Prisma enums:

- `AssessmentAdvisorMemoryItemType`
- `AssessmentAdvisorMemoryItemStatus`
- `AssessmentAdvisorMemorySourceType`
- `AssessmentAdvisorMemoryTruthStatus`

Added Prisma model:

- `AssessmentAdvisorMemoryItem`

The model stores structured project knowledge by `assessmentId` and `workspaceId`, with optional links to:

- `AssessmentAdvisorConversation`
- `AssessmentAdvisorMessage`
- `User`
- prior memory item via `supersedesId`

Indexes:

- `(assessmentId, status)`
- `(workspaceId, type)`
- `(assessmentId, type, status)`
- `sourceMessageId`
- `supersedesId`

## Migration

Local migration created:

- `prisma/migrations/20260530220000_advisor_2a_project_memory_vault/migration.sql`

Migration characteristics:

- Additive only.
- Creates enums and one new table.
- Adds indexes and foreign keys.
- No drops.
- No backfill.
- No required columns on existing tables.
- Not applied to production in this milestone.

## Core Services

Added:

- `src/server/advisor/advisorMemoryTypes.ts`
- `src/server/advisor/advisorMemoryPlanLimits.ts`
- `src/server/advisor/advisorMemorySecurity.ts`
- `src/server/advisor/advisorMemoryValidation.ts`
- `src/server/advisor/advisorMemoryService.ts`
- `src/server/advisor/advisorMemoryExtractionService.ts`

Implemented service capabilities:

- List memory items.
- Create memory item.
- Confirm memory item.
- Reject memory item.
- Resolve memory item.
- Archive memory item.
- Supersede memory item.
- Get memory counts.
- Build future prompt-ready memory context.
- Enforce plan limits.
- Enforce ownership and workspace isolation.
- Sanitize memory title, summary, tags and metadata before persistence.
- Create audit events for lifecycle changes.

## Plan Limits

Memory limits:

| Plan | Enabled | Max items | Open questions | Decisions | Next steps |
| --- | --- | ---: | ---: | ---: | ---: |
| Starter / Free | No | 0 | 0 | 0 | 0 |
| Professional / Readiness Report | Yes | 25 | 10 | 10 | 10 |
| Pro | Yes | 50 | 20 | 20 | 20 |
| Blueprint | Yes | 150 | 50 | 50 | 50 |
| Partner / MSP | Yes | 100 | 40 | 40 | 40 |
| Internal QA | Yes | 50 | 20 | 20 | 20 |

Plan resolution aligns with existing Senior Advisor plan aliases.

## Lifecycle

Supported lifecycle:

- `needs_review -> active`
- `needs_review -> rejected`
- `needs_review -> archived`
- `active -> resolved`
- `active -> superseded`
- `active -> archived`
- `resolved -> archived`
- `rejected -> archived`
- `superseded -> archived`

Archived is terminal for now.

Context builder includes active memory only. Rejected, superseded, archived and needs-review items are counted but excluded from future prompt context.

## Security and Privacy

Implemented controls:

- Ownership required through existing assessment ownership guard.
- Every query/mutation is scoped by assessment and workspace.
- Summaries are sanitized before persistence.
- Secrets, tokens, emails and private paths are redacted.
- Obvious raw file content patterns are rejected or redacted.
- Unsafe metadata keys are dropped.
- Audit metadata excludes raw summaries.
- Memory context labels `sourceType` and `truthStatus`.

Not implemented yet:

- Full retention/export/delete policy.
- Admin memory dashboard.
- Cross-assessment memory.

## Audit Events

Events:

- `advisor_memory_item_created`
- `advisor_memory_item_confirmed`
- `advisor_memory_item_rejected`
- `advisor_memory_item_resolved`
- `advisor_memory_item_superseded`
- `advisor_memory_item_archived`

Metadata includes safe identifiers and labels:

- memory item id;
- assessment id;
- workspace id;
- type;
- status;
- truth status;
- source type.

It does not include raw summaries or secrets.

## Deterministic Extraction Placeholder

Added non-AI helper functions:

- `buildDecisionMemoryItem`
- `buildOpenQuestionMemoryItem`
- `buildNextStepMemoryItem`
- `buildMemoryCandidateFromUserStatement`

These are not wired into chat in ADVISOR-2A. They are prepared and tested for later controlled integration.

## Tests

Added unit tests:

- `tests/unit/advisorMemoryPlanLimits.test.ts`
- `tests/unit/advisorMemorySecurity.test.ts`
- `tests/unit/advisorMemoryValidation.test.ts`
- `tests/unit/advisorMemoryExtractionService.test.ts`
- `tests/unit/advisorMemoryContext.test.ts`
- `tests/unit/advisorMemoryService.test.ts`

Coverage includes:

- Free plan memory disabled.
- Internal QA enabled with 50 max.
- Professional/Pro/Blueprint/Partner limits.
- Secret and path redaction.
- Raw file content rejection.
- Required title and summary.
- Confidence 0-100.
- Status transitions.
- Context excludes rejected/superseded/archived/needs-review.
- Context labels source/truth status.
- Cross-workspace create rejection.
- Plan limit enforcement.
- Safe audit metadata.

## Remaining Work

ADVISOR-2B - UI Memory Panel + Actions:

- Project Memory block in Senior Advisor panel.
- Review memory UI.
- Confirm/reject/resolve/archive/supersede actions.

ADVISOR-2C - Prompt Context Integration:

- Inject bounded active memory context into Advisor prompt.
- Add prompt labels and conflict rules.
- Token caps by plan.

ADVISOR-2D - Release/Smoke/Docs:

- Controlled migration apply.
- Production smoke.
- User-attested visual smoke.
- Closure documentation.

## Release Risk

Risk is low at code level because this milestone is additive and does not change chat v1 behavior, provider handling, prompt execution, UI, billing or deterministic engines.

Production risk remains pending because the migration was not applied to production.

Rollback strategy after future deploy:

- Leave memory tables unused.
- Disable memory UI/actions.
- Keep chat v1 active.
- Do not inject memory into prompts until ADVISOR-2C is validated.

## Final Status

ADVISOR-2A establishes the Project Memory Vault foundation but does not make memory user-facing yet.

Recommended next milestone: ADVISOR-2B - UI Memory Panel + Actions.
