# HITO ADVISOR-2C - Project Memory Vault Prompt Context Integration

Status: complete.

## Objective

ADVISOR-2C integrates Project Memory Vault into the Senior Migration Advisor prompt context so answers can preserve assessment-specific continuity across decisions, open questions, next steps, constraints and risks.

This hito does not create migrations, apply production migrations, deploy, touch production data, change billing/pricing, implement RAG, add embeddings, change Storage/Ceph, Licensing, RVTools or AI providers, or declare public launch.

## Memory Context Flow

The prompt context is built through `buildSeniorAdvisorContextPayloadWithMemory`, which wraps the existing deterministic advisor context and safely attaches `projectMemory`.

Memory is scoped to the current assessment and workspace only. The prompt context includes active memory items only:

- decisions;
- open questions;
- next steps;
- constraints;
- risk interpretations;
- limited other memory.

Excluded from prompt context:

- rejected items;
- superseded items;
- archived items;
- needs-review items;
- raw uploaded file contents;
- raw file paths;
- detected secrets/tokens.

## Truth And Source Labels

Each included item preserves:

- `truthStatus`: `confirmed`, `customer_reported`, `inferred`, `missing`, `advisor_generated`, `user_confirmed`;
- `sourceType`: `user_message`, `advisor_message`, `system_generated`, `assessment_state`, `client_context`, `storage_analysis`, `licensing_analysis`, `manual_admin`.

The prompt tells the Advisor not to treat `customer_reported` or `inferred` memory as confirmed technical evidence.

## Limits

Memory prompt context is plan-aware and reuses Advisor Memory plan resolution.

Default prompt memory limits:

- Starter/free: disabled;
- Professional: smaller context, up to 4,000 chars;
- Pro: moderate context, up to 5,000 chars;
- Blueprint/internal QA: fuller context, up to 6,000 chars;
- Partner: moderate context, up to 5,000 chars.

When memory exceeds limits, the inclusion priority is:

1. active decisions;
2. open questions;
3. constraints;
4. unresolved risks;
5. next steps;
6. summary;
7. other memory.

## Prompt Rules

`seniorAdvisorPrompt.ts` now includes an explicit `Project Memory` contract.

The Advisor must:

- use Project Memory only for this assessment;
- keep deterministic assessment state above memory when conflicts exist;
- explain conflicts instead of hiding them;
- use open questions to suggest next actions;
- use decisions to maintain continuity;
- use constraints to avoid repeated advice;
- avoid inventing evidence from memory;
- avoid exposing hidden/system memory metadata.

Existing Advisor guardrails remain active: no migration guarantee, no production approval, no engine override, no secrets, no raw files and no provider changes.

## Fallbacks

If memory is disabled by plan, the context marks memory as `included=false` with `memory_disabled_for_plan`.

If there is no active memory, the context marks memory as `included=false` with `no_memory`.

If the memory service fails or the production database does not yet have the memory table, the Advisor still works. The context marks:

- `memoryIncluded=false`;
- `memoryFallbackReason=memory_unavailable`.

This prevents Chat V1 and assessment detail pages from depending on production migration timing.

## Usage Metadata

Senior Advisor AI usage metadata now records safe memory usage metadata:

- `memoryIncluded`;
- `memoryItemCount`;
- `memoryContextChars`;
- `memoryFallbackReason`.

It does not include memory titles, summaries, raw prompt text, secrets or raw uploaded file contents.

## Tests

Coverage added or updated for:

- active decisions in memory prompt context;
- open questions in memory prompt context;
- rejected, superseded, archived and needs-review items excluded by active-only queries;
- `truthStatus` and `sourceType` label preservation;
- context character limits;
- redaction of sensitive memory text;
- Project Memory prompt section;
- deterministic assessment priority instructions;
- unavailable memory fallback;
- safe memory usage metadata.

## Remaining Work For 2D

ADVISOR-2D should cover release readiness, controlled production migration, authenticated smoke and operational validation.

Still out of scope until a future hito:

- automatic memory extraction after each Advisor response;
- RAG;
- embeddings;
- retention/export/delete workflows;
- billing/pricing integration;
- full public launch.
