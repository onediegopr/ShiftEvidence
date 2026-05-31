# HITO ADVISOR-3A - Static Methodology KB Registry

## 1. Objective

Implement the first ADVISOR-3 foundation: a static, curated, versioned Methodology KB registry for the Senior Migration Advisor.

This hito creates reusable methodology blocks, validation helpers, registry access helpers and deterministic retrieval lite. It does not connect the KB to live Advisor responses yet.

## 2. Context

Previous state:

- Senior Migration Advisor v1 is operational.
- Project Memory Vault is operational by assessment/workspace.
- Project Memory Auto-Extraction Lite is closed by user-attestation.
- ADVISOR-3-AUDIT-SPEC defined the target as "Senior Migration Advisor with Methodology Retrieval".

ADVISOR-3A implements the static registry recommended by the audit/spec:

- no DB;
- no embeddings;
- no vector store;
- no runtime prompt integration;
- no provider changes.

## 3. What was implemented

Implemented:

- TypeScript methodology type model.
- Static catalog of 12 curated methodology blocks.
- Registry validation.
- Registry access helpers.
- Deterministic retrieval lite by query, tags, domains and use cases.
- Unit tests for registry and retrieval behavior.
- Internal hito documentation.

No production behavior changed because the registry is not called by `sendSeniorAdvisorMessage`.

## 4. What was not implemented

Not implemented:

- RAG runtime integration.
- Embeddings.
- Vector DB.
- Prisma schema changes.
- Migrations.
- DB reads/writes.
- Endpoints.
- UI.
- Prompt integration in production.
- Provider strategy changes.
- Billing changes.
- Hostinger/deploy changes.
- Full public launch.

## 5. File structure

Created:

```text
src/server/advisor/methodology/methodologyTypes.ts
src/server/advisor/methodology/methodologyBlocks.ts
src/server/advisor/methodology/methodologyRegistry.ts
src/server/advisor/methodology/methodologyRetrieval.ts
src/server/advisor/methodology/methodologyValidation.ts
src/server/advisor/methodology/index.ts
tests/unit/methodologyRegistry.test.ts
tests/unit/methodologyRetrieval.test.ts
docs/hito-advisor-3a-static-methodology-kb-registry.md
```

No existing Advisor runtime files were modified.

## 6. Block catalog

Active blocks: 12.

Block IDs:

- `evidence_confidence`
- `readiness_scoring`
- `vm_risk_classification`
- `migration_waves`
- `storage_readiness`
- `ceph_suitability`
- `backup_readiness`
- `network_readiness`
- `business_continuity_risk`
- `no_go_validations`
- `pilot_selection`
- `advisor_boundaries`

Each block includes:

- stable ID;
- semver-like version;
- title;
- summary;
- structured content;
- domain;
- tags;
- keywords;
- exposure level;
- allowed use cases;
- not-allowed use notes;
- related block IDs;
- review date;
- source;
- status.

All initial blocks are `active`.

## 7. Type model

Core types:

- `MethodologyBlockId`
- `MethodologyExposureLevel`
- `MethodologyDomain`
- `MethodologyUseCase`
- `MethodologyBlockStatus`
- `MethodologyBlock`
- `MethodologyRegistryValidationResult`
- `MethodologyRetrievalInput`
- `MethodologyRetrievalResult`
- `MethodologyRetrievalReason`

Domains:

- evidence;
- scoring;
- vm_risk;
- migration_planning;
- storage;
- ceph;
- backup;
- network;
- business_continuity;
- governance;
- advisor_safety.

Use cases:

- explain_methodology;
- answer_advisor_question;
- interpret_assessment;
- generate_next_steps;
- identify_missing_evidence;
- plan_migration_waves;
- evaluate_no_go;
- select_pilot_candidates;
- caution_against_overclaiming.

## 8. Exposure levels

Supported exposure levels:

- `public`: safe to summarize directly to users.
- `advisor_internal`: safe to use for Advisor reasoning and controlled summaries, but not meant for verbatim dump.
- `restricted`: excluded by default; reserved for future policy if needed.

The initial active catalog uses:

- `public`
- `advisor_internal`

No active `restricted` block is included yet. Retrieval excludes `restricted` unless explicitly allowed.

## 9. Validation rules

`validateMethodologyRegistry(blocks)` checks:

- unique block IDs;
- known block IDs;
- semver-like versions;
- non-empty title, summary and content;
- valid domain;
- valid exposure level;
- valid status;
- non-empty tags;
- non-empty keywords;
- valid allowed use cases;
- related block IDs exist;
- secret-like banned content patterns.

Banned content patterns include:

- API key;
- `password=`;
- `secret=`;
- private key;
- `token=`;
- raw customer;
- client confidential;
- connection string;
- `DATABASE_URL`;
- `GEMINI_API_KEY`;
- `OPENCODE_API_KEY`.

The validator returns:

- `ok`;
- `errors`;
- `warnings`;
- `blockCount`;
- `activeBlockCount`.

## 10. Retrieval rules

`selectMethodologyBlocks(input)` implements deterministic retrieval lite.

Inputs:

- query;
- optional domains;
- optional tags;
- optional use cases;
- optional maxBlocks;
- optional allowed exposure levels;
- optional includeRestricted flag.

Defaults:

- `maxBlocks = 3`;
- hard cap `maxBlocks = 5`;
- allowed exposure levels: `public` + `advisor_internal`;
- active blocks only;
- restricted excluded unless explicitly allowed.

Scoring:

- tag match: 8 points;
- use case match: 6 points;
- domain match: 5 points;
- keyword match: 3 points.

Ordering:

- score descending;
- block ID ascending for deterministic tie-breaks.

No AI, embeddings, network calls, DB calls or filesystem reads are used.

## 11. Security/privacy

Security posture:

- no customer data in global KB;
- no raw uploaded evidence;
- no secrets;
- no credentials;
- no connection strings;
- no full internal prompt;
- no DB;
- no production data access;
- no cross-workspace or cross-assessment retrieval.

The registry is methodology-only and global. Project-specific facts remain the job of existing assessment context and Project Memory.

The registry intentionally does not use `needs_review` Project Memory. That remains excluded from Advisor prompt context until user-confirmed/active.

## 12. Tests

Added unit tests:

- `tests/unit/methodologyRegistry.test.ts`
- `tests/unit/methodologyRetrieval.test.ts`

Coverage:

- catalog baseline has 12 active blocks;
- IDs unique;
- registry validates;
- invalid versions/content fail validation;
- empty tags/keywords fail validation;
- missing related block IDs fail validation;
- banned secret-like patterns fail validation;
- access helpers work;
- restricted exposure is not returned by default;
- backup questions select `backup_readiness`;
- Ceph questions select `ceph_suitability`;
- wave planning selects `migration_waves`;
- no-downtime guarantee selects Advisor safety/business continuity blocks;
- missing evidence selects `evidence_confidence`;
- maxBlocks and hard cap work;
- deterministic ordering;
- nonsense query returns safe empty result.

Focused result:

```text
vitest run methodology
2 files passed / 18 tests passed
```

## 13. How this prepares ADVISOR-3B/3C

ADVISOR-3A creates the non-runtime foundation needed for:

- ADVISOR-3B deterministic retrieval and prompt preview;
- ADVISOR-3C prompt integration behind a flag;
- ADVISOR-3D evaluation harness;
- ADVISOR-3E controlled production smoke;
- optional ADVISOR-3F embeddings research if deterministic retrieval proves insufficient.

Future ADVISOR-3B can build on:

- stable block IDs;
- domains;
- tags;
- keywords;
- use cases;
- exposure levels;
- deterministic scoring;
- validation contract.

Future ADVISOR-3C should add usage metadata such as:

- methodology included;
- block IDs;
- block versions;
- retrieval status;
- context chars;
- feature flag status.

## 14. Risks pending

Pending:

- deeper retrieval evaluation;
- prompt preview harness;
- runtime prompt integration behind flag;
- golden question evaluation;
- production authenticated smoke;
- optional embeddings research;
- billing real;
- retention/export/delete;
- admin visibility avanzada;
- full public launch.

## 15. Rollback

Rollback is simple:

- revert the ADVISOR-3A commit;
- no DB rollback;
- no migration rollback;
- no env var rollback;
- no provider rollback;
- no runtime Advisor rollback, because live Advisor behavior was not changed.

## 16. Next recommended hito

Recommended next hito:

```text
ADVISOR-3B - Deterministic Retrieval + Prompt Preview
```

Suggested scope:

- keep runtime production Advisor disabled from KB injection;
- add prompt preview/composition helpers;
- add golden question fixtures;
- validate selected block IDs and token budgets;
- do not enable production prompt integration until ADVISOR-3C.
