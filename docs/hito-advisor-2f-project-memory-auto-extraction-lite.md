# HITO ADVISOR-2F - Project Memory Auto-Extraction Lite

Status: complete.

## Objective

ADVISOR-2F adds a conservative deterministic auto-extraction layer for Project Memory Vault.

The Senior Migration Advisor can now detect simple memory candidates from completed user messages and completed Advisor responses, then save them as `needs_review` items. Users still decide whether to confirm, reject, resolve or archive those items in the existing Project Memory Panel.

This hito does not implement RAG, embeddings, Methodology KB, proactive advisor, billing, pricing, provider changes, deploy, production migrations or public launch.

## Extraction Rules

Auto-Extraction Lite is deliberately narrow. It does not convert every message into memory.

Detected from user messages:

- explicit decisions;
- open questions;
- next steps;
- project constraints.

Detected from Advisor responses:

- missing evidence statements;
- next action / recommended action bullets.

Default status:

- `needs_review`.

Default truth labels:

- user-reported decisions, constraints and next steps: `customer_reported`;
- user open questions: `customer_reported` or `missing`;
- Advisor recommendations: `advisor_generated`;
- Advisor missing evidence: `missing`.

Default source labels:

- `user_message`;
- `advisor_message`.

Nothing is auto-created as `confirmed`.

## What It Ignores

The extractor skips:

- trivial messages such as `ok`, `dale`, `thanks`, `yes`, `no`;
- random short text;
- prompt-injection-like text;
- messages with secret signals;
- obvious raw file content;
- failed or blocked assistant messages;
- duplicated candidates;
- candidates that exceed plan memory limits.

## Lifecycle

Auto-created memory items enter the same lifecycle as manual memory:

- `needs_review`;
- `active`;
- `resolved`;
- `superseded`;
- `rejected`;
- `archived`.

Only user action can confirm an item into active memory. `needs_review` items do not enter Advisor prompt context.

## Deduplication

Deduplication is simple and deterministic:

- same type and same `sourceMessageId`;
- same normalized title;
- high token overlap in title or summary;
- existing items considered only when not archived/rejected.

No embeddings or semantic vector search are used.

## Limits

Auto-extraction is throttled:

- maximum 2 candidates per user message;
- maximum 3 candidates per Advisor response;
- maximum 4 total candidates per send;
- respects plan memory limits;
- disabled when Project Memory is disabled for the plan.

If a limit is reached, chat still succeeds and extraction reports safe metadata.

## Integration

The integration runs after the Advisor exchange is persisted.

Success path:

- extract from completed user message;
- extract from completed assistant response;
- create candidates as `needs_review`;
- record safe usage metadata.

Provider failure path:

- extract only from the completed user message;
- do not extract recommendations from failed generic fallback text;
- do not break chat.

If extraction itself fails, the Advisor response remains successful and the failure is logged safely.

## Security

Auto-extraction uses the same memory safety posture as the rest of Project Memory Vault:

- assessment/workspace scoped;
- ownership remains enforced by memory creation service;
- no raw file contents;
- no secrets;
- no cross-workspace memory;
- no cross-client learning;
- no full prompts persisted;
- audit events are safe and metadata-only.

Auto-created audit metadata marks `autoExtracted=true` when available and includes source message linkage without storing raw content.

## Usage Metadata

`AiUsageEvent` metadata now includes:

- `memoryCandidatesGenerated`;
- `memoryCandidatesSkipped`;
- `memoryExtractionStatus`.

Possible status values:

- `disabled`;
- `skipped_no_signal`;
- `created`;
- `limit_reached`;
- `failed`.

No titles, summaries, secrets or full prompts are included in usage metadata.

## UI Behavior

No major UI redesign was required.

The existing Project Memory Panel already shows:

- Needs Review group;
- status label;
- `truthStatus`;
- `sourceType`;
- confirm/reject/archive actions.

Auto-extracted items appear in the Needs Review group and remain user-controlled.

## Tests

Coverage added or updated for:

- ignores trivial messages;
- ignores random short text;
- extracts explicit decision;
- extracts project constraint;
- extracts next step;
- extracts open question;
- extracts missing evidence from Advisor response;
- extracts Advisor next actions;
- skips secrets;
- dedupes same source/message;
- respects max candidates per response;
- respects disabled plan;
- extraction failure does not throw;
- failed assistant message does not produce recommendations;
- auto-created items are `needs_review`;
- truth/source labels are correct.

## Remaining Work

Still future work:

- release/smoke for production runtime;
- richer extraction QA;
- admin review visibility;
- retention/export/delete;
- RAG;
- embeddings;
- Methodology KB;
- billing/credit ledger;
- full public launch.

Recommended next step:

- ADVISOR-2F-RELEASE/SMOKE if production rollout needs a separate verification hito;
- otherwise ADVISOR-3-AUDIT-SPEC for RAG / Methodology KB.
