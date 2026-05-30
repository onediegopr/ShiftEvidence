# HITO ADVISOR-2B - Project Memory Vault UI Panel + Actions

## Objective

Implement the visual and interaction layer for the Senior Migration Advisor Project Memory Vault.

This milestone adds server actions, a compact `Project Memory` panel inside the existing Advisor UI, grouped memory item cards, lifecycle buttons and tests.

Out of scope:

- No prompt integration.
- No RAG, embeddings or Methodology KB.
- No proactive advisor.
- No billing/pricing changes.
- No Gemini/OpenCode provider changes.
- No Storage/Ceph, Licensing or RVTools changes.
- No production migration.
- No deploy.
- No full public launch.

## Dirty Tree Handling

At the start of this milestone, `git status -sb` was clean.

The previous dirty changes in:

- `src/components/Hero.tsx`
- `src/index.css`

were no longer present as uncommitted changes. They had been preserved in commit:

- `8536b90 style: scale up landing animation, adjust Advisor terminal card position and shrink central logo`

No stash was required for ADVISOR-2B.

## Server Actions

Added:

- `src/app/dashboard/assessments/[id]/advisor/memory-actions.ts`

Actions:

- `listAdvisorMemoryItemsAction`
- `confirmAdvisorMemoryItemAction`
- `rejectAdvisorMemoryItemAction`
- `resolveAdvisorMemoryItemAction`
- `archiveAdvisorMemoryItemAction`
- `supersedeAdvisorMemoryItemAction`
- `createAdvisorMemoryItemAction`
- `saveAdvisorRecommendationAsMemoryAction`

Action behavior:

- Requires authenticated session.
- Reuses profile upsert pattern from Advisor chat actions.
- Uses ownership checks through memory service and assessment guard.
- Returns safe user-facing errors.
- Revalidates the assessment page after successful lifecycle actions.
- Does not call AI extraction.
- Does not integrate memory into prompt context.

## Panel State

Extended `SeniorAdvisorPanelState` with `memory`.

Memory panel state includes:

- enabled/available flags;
- locked reason;
- plan label;
- max items per assessment;
- counts;
- summary;
- preview items;
- full non-archived item list.

The Advisor panel loader catches memory-state failures and returns a safe unavailable memory state. This protects the v1 chat surface if an environment has not applied the memory migration yet.

## UI

Updated:

- `src/components/assessments/SeniorMigrationAdvisorPanel.tsx`
- `src/index.css`

The new `Project Memory` panel sits below the helper and above suggested prompts.

It includes:

- compact header;
- `Review project memory` toggle;
- count strip for decisions, open questions, next steps and needs review;
- locked/empty states;
- grouped memory lists:
  - Needs Review;
  - Decisions;
  - Open Questions;
  - Next Steps;
  - Other Memory;
- item cards with title, summary, type/status/source/truth labels, confidence and timestamp;
- lifecycle buttons:
  - Confirm;
  - Reject;
  - Resolve;
  - Archive;
  - Supersede;
- expanded manual `Add memory note` form.

## Plan Gating

If Project Memory is disabled for the resolved plan, the panel shows a compact locked note and disables memory actions.

Expected behavior:

- Starter/free: memory unavailable/locked.
- Internal QA: memory panel enabled.
- Professional/Pro/Blueprint/Partner: memory panel enabled according to ADVISOR-2A limits.

Server-side plan limits still enforce creation and item caps.

## Preserved Behavior

Unchanged:

- Advisor chat send flow.
- Gemini/OpenCode provider strategy.
- Prompt contract.
- Message persistence.
- Usage counter.
- Credit request placeholder.
- Storage/Ceph.
- Licensing.
- RVTools.
- Billing/pricing.

## Tests

Added:

- `tests/unit/advisorMemoryActions.test.ts`

Covered:

- memory actions require session flow;
- list action loads panel state;
- confirm/resolve call lifecycle service and revalidate;
- manual create scopes memory to assessment workspace;
- safe error returns.

Existing ADVISOR-2A memory tests continue to cover:

- plan limits;
- validation;
- sanitization;
- context exclusion;
- lifecycle service behavior;
- deterministic extraction helpers.

## Remaining Work

ADVISOR-2C - Prompt Context Integration:

- Inject bounded memory context into Advisor prompt.
- Add explicit memory labels to prompt payload.
- Enforce token budget for memory context.
- Exclude rejected/superseded/archived/needs-review items from prompt.

ADVISOR-2D - Release/Smoke/Docs:

- Controlled production migration apply.
- Authenticated Advisor memory smoke.
- User-attested visual smoke.
- Closure docs.

## Production Status

Production migration was not applied.

No deploy was performed.

The panel state includes fail-soft handling, but production should still apply the ADVISOR-2A migration before enabling this UI in a deployed environment.

## Risks Pending

- Production migration.
- Prompt memory context.
- Release and smoke.
- Retention/export/delete policy.
- RAG / Methodology KB.
- Billing/credit ledger.
- Full public launch.

## Final Status

ADVISOR-2B adds the Project Memory UI and server action layer without changing Advisor prompt behavior.

Recommended next milestone: ADVISOR-2C - Prompt Context Integration.
