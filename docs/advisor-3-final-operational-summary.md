# Advisor-3 Final Operational Summary — Methodology Retrieval

## 1. Executive summary

Advisor-3 is the Senior Advisor Methodology Retrieval module for ShiftReadiness. It adds curated, versioned migration methodology guidance to Senior Advisor responses through a deterministic retrieval and prompt-preview pipeline.

Final status: COMPLETE operationally.

It solves a specific problem: Senior Advisor can answer with consistent migration methodology, evidence caution, missing-evidence handling and anti-overclaiming guardrails without using free-form RAG, embeddings or a vector database.

Advisor-3 is not a customer-document retrieval system, not a generic RAG layer, not an autonomous migration approver, and not a production launch declaration.

## 2. Final status

* Status: COMPLETE operationally.
* Feature flag: `ADVISOR_METHODOLOGY_CONTEXT_ENABLED`.
* Default: false.
* Enabled only by exact value `true`.
* The user loaded the flag in Hostinger.
* Production flag-on smoke: closed by user-attestation.
* Admin visibility smoke: closed by user-attestation.
* Full public launch: NO.

User-attested validations are recorded as manual validations, not as Codex-controlled browser or DB observations.

## 3. Architecture overview

Advisor-3 is composed of:

* Static Methodology KB Registry: 12 curated methodology blocks with stable IDs, versions and validators.
* Deterministic Retrieval: tags, keywords, use cases, domains and explicit hints select relevant blocks.
* Prompt Preview: pure builder that composes assessment context, confirmed memory, methodology guidance and guardrails under token budgets.
* Feature Flag Integration: runtime injection behind `ADVISOR_METHODOLOGY_CONTEXT_ENABLED`.
* Evaluation Harness: golden questions, expected blocks, guardrail phrases, forbidden phrases and restricted-content checks.
* Production Observation/Admin Visibility: internal admin card/tab for runtime flag status, KB health and usage stats.
* Curation Hardening: block versions `1.1.0`, safe patterns, unsafe claims, evidence requirements, anti-overclaiming and coverage tests.

## 4. Runtime behavior

Flag OFF:

* Senior Advisor behaves without Methodology Guidance Context.
* Metadata records methodology context as disabled when usage metadata is persisted.
* No methodology prompt section is injected.

Flag ON:

* Senior Advisor builds Methodology Guidance Context from the current assessment, confirmed project memory and the user question.
* The prompt receives a `METHODOLOGY GUIDANCE CONTEXT` section.
* The Advisor is instructed to use methodology as advisory context, not as customer evidence.
* If preview building fails, Advisor continues with safe fallback behavior and records a safe error code.

Metadata:

* Records safe fields such as enabled/status/block IDs/block versions/block count/token estimate/warning count/blocked reason count/error code.
* Does not persist full prompts, full previews, raw responses or block content.

## 5. Feature flag

Flag name: `ADVISOR_METHODOLOGY_CONTEXT_ENABLED`.

Behavior:

* default false;
* exact `true` enables;
* any other value is treated as disabled;
* raw flag value is not exposed by admin status.

The user loaded the flag in Hostinger. Codex did not modify Hostinger env vars.

Rollback:

1. Set `ADVISOR_METHODOLOGY_CONTEXT_ENABLED` to false or remove it in the runtime environment.
2. Restart/redeploy through the normal production process if the platform requires it.
3. Verify Senior Advisor still responds without `METHODOLOGY GUIDANCE CONTEXT`.
4. Verify admin visibility reports disabled/default-off status.

Do not use Prisma migrations, DB changes or provider changes for rollback.

## 6. Methodology KB

The KB has 12 stable block IDs:

* `evidence_confidence`
* `readiness_scoring`
* `vm_risk_classification`
* `migration_waves`
* `storage_readiness`
* `ceph_suitability`
* `backup_readiness`
* `network_readiness`
* `business_continuity_risk`
* `no_go_validations`
* `pilot_selection`
* `advisor_boundaries`

Current version: `1.1.0` for all active blocks.

Fields include:

* `safeResponsePatterns`;
* `unsafeClaims`;
* `evidenceRequired`.

Exposure levels:

* `public`;
* `advisor_internal`;
* `restricted`.

Restricted blocks are excluded from normal retrieval by default.

The KB includes methodology guidance, evidence requirements, safe response patterns and claims to avoid. It does not include customer raw data, secrets, raw uploaded file contents, provider credentials or hidden prompts.

## 7. Retrieval strategy

Retrieval is deterministic.

Selection inputs:

* tags;
* keywords;
* use cases;
* domains;
* explicit retrieval hints;
* normalized user question;
* assessment missing evidence and risk text.

Limits:

* default max blocks: 3;
* hard max blocks: 5;
* restricted excluded unless explicitly allowed by code path.

There are no embeddings, no vector database, no network retrieval and no customer document retrieval in Advisor-3.

## 8. Prompt composition

The prompt preview composes:

* assessment context;
* confirmed project memory only;
* selected methodology guidance;
* Advisor guardrails.

It applies:

* token budgets;
* truncation;
* secret-like text redaction;
* prompt-injection-like text neutralization;
* raw-file-content exclusion;
* needs_review memory exclusion.

Full prompts and full previews are not persisted as operational data.

## 9. Evaluation harness

The harness contains 20 golden questions after ADVISOR-3G.

Coverage includes:

* backup missing;
* zero downtime guarantee refusal;
* Ceph caution;
* migration waves;
* low confidence;
* ERP validation;
* missing Proxmox target;
* network unknowns;
* needs_review exclusion;
* prompt injection;
* internal methodology dump;
* business continuity;
* domain controllers;
* old snapshots;
* RVTools-only assessments;
* no dependency map;
* unknown target storage;
* MSP-safe language;
* financial impact without data;
* missing performance metrics.

Anti-overclaiming:

* global forbidden phrases are checked;
* each block is covered by at least one golden question;
* each active block must have curation-hardening metadata;
* restricted blocks are not selected by default.

## 10. Admin visibility

The internal admin console includes `Advisor Metodologia`.

It shows:

* runtime flag status;
* activation mode;
* default-enabled state;
* KB health;
* block counts;
* safe block summaries;
* usage stats derived from sanitized `AiUsageEvent` metadata;
* top methodology block IDs when available.

It does not show:

* prompts;
* raw responses;
* full preview text;
* full block content;
* secrets;
* cookies/localStorage;
* raw customer files;
* restricted content.

Admin visibility was manually validated by the user and closed by user-attestation.

## 11. Security and privacy

Advisor-3 guarantees safety boundaries at the module level:

* no secrets;
* no raw customer data in methodology KB;
* no full prompt persistence;
* no previewText persistence;
* no full block content in admin metadata;
* no needs_review as fact;
* no restricted blocks in default retrieval;
* no cross-workspace or cross-client learning;
* no DB schema changes;
* no migrations;
* no embeddings.

Methodology guidance is advisory context. It is not customer evidence and must not override deterministic assessment data.

## 12. What Advisor-3 does not do

Advisor-3 does not implement:

* free-form RAG;
* vector DB;
* embeddings;
* customer document retrieval;
* automatic truth from needs_review memory;
* migration guarantee;
* zero downtime guarantee;
* invented financial impact;
* production launch declaration;
* billing;
* retention/export/delete;
* admin-editable methodology KB.

## 13. Operational runbook

Verify flag:

1. Open internal admin console.
2. Go to `Advisor Metodologia`.
3. Confirm flag name `ADVISOR_METHODOLOGY_CONTEXT_ENABLED`.
4. Confirm enabled/disabled state and default false behavior.

Verify admin visibility:

1. Confirm admin console loads in Spanish.
2. Confirm `Advisor Metodologia` tab is visible.
3. Confirm KB health loads.
4. Confirm usage stats show aggregated values or safe empty state.
5. Confirm no prompts, raw responses, previewText, secrets or block content are shown.

Inspect safe stats:

* use admin usage cards/tables only;
* inspect counts, statuses, block IDs and versions;
* do not print raw metadata;
* do not inspect cookies/localStorage.

Rollback to OFF:

1. Change the runtime flag to disabled through the normal secure environment process.
2. Restart/redeploy only if the platform requires it.
3. Confirm Senior Advisor continues to work without methodology context.
4. Confirm admin flag status reports disabled.
5. Confirm no error spike in AI usage/admin health.

What not to touch:

* Prisma schema;
* migrations;
* DB data;
* provider settings;
* Hostinger unless explicitly doing a controlled env operation;
* billing;
* public landing;
* Hero/index styling;
* stashes.

## 14. Validation history

ADVISOR-3-AUDIT-SPEC:

* architecture specified;
* Methodology Retrieval chosen instead of free-form RAG.

ADVISOR-3A:

* static KB registry;
* 12 blocks;
* validators;
* deterministic retrieval base.

ADVISOR-3B:

* prompt preview;
* token budgets;
* sanitization;
* initial tests.

ADVISOR-3C:

* feature flag integration;
* exact-true enablement;
* fallback-safe runtime path;
* safe metadata.

ADVISOR-3D:

* deterministic evaluation harness;
* golden questions;
* guardrail and forbidden-phrase tests.

ADVISOR-3E:

* production flag-on smoke closed by user-attestation;
* flag loaded by user in Hostinger;
* full public launch remains NO.

ADVISOR-3F:

* admin visibility implemented;
* authenticated admin smoke closed by user-attestation after Codex Chrome/native-host limitation.

ADVISOR-3G:

* 12 blocks hardened to version `1.1.0`;
* 20 golden questions;
* anti-overclaiming global;
* full suite and build reported OK in hito closure.

## 15. Known limitations

* Some production smokes were user-attested due to Chrome/native host limitations.
* DB metadata was not always technically observed by Codex.
* Admin smoke was technically blocked for Codex and manually validated by the user.
* Long-term production observation remains pending.
* Billing, retention/export/delete and advanced admin operations are pending.
* RAG/embeddings remain future optional architecture, not current implementation.

## 16. Current risks

* Productive observation over time.
* Future deeper KB curation.
* Optional embeddings/RAG audit.
* Billing real.
* Retention/export/delete.
* Full public launch.

## 17. Recommended next steps

Option A: freeze Advisor-3 and move to another product area.

Option B: run a production observation hito focused on live usage metrics and admin health.

Option C: create a future RAG/embeddings audit spec only, with no implementation until explicitly approved.

Option D: prepare a final Word manual for Advisor-3 if requested.

## 18. Final verdict

Advisor-3 is closed operationally.

Methodology Retrieval is active behind a feature flag, curated, evaluated, observable in admin and manually smoke-validated by the user.

Full public launch remains NO.
