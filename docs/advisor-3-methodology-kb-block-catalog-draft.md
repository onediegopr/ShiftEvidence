# Advisor 3 Methodology KB Block Catalog Draft

This catalog is a draft for ADVISOR-3A. It is not an implementation and should not be treated as runtime source yet.

## Block Shape

Suggested fields:

- `blockId`
- `version`
- `title`
- `summary`
- `content`
- `tags`
- `appliesTo`
- `exposureLevel`
- `allowedUserSummary`
- `doNotExposeRaw`

Exposure levels:

- `public`: safe to summarize directly to users.
- `advisor_internal`: safe to use for reasoning and summarize, but do not dump verbatim.
- `restricted`: not included in Advisor prompt unless a future explicit policy allows it.

## Draft Blocks

### evidence_confidence

- Exposure: `public`
- Tags: `evidence_confidence`, `missing_evidence`, `readiness_scoring`
- Purpose: Explain that confidence is about evidence quality and completeness, not simply risk severity.
- Include:
  - RVTools parsed status;
  - assumptions completeness;
  - parser warnings;
  - missing target/storage/backup data;
  - customer-reported versus confirmed evidence.
- Do not include:
  - real customer reports;
  - raw uploaded files.

### readiness_scoring

- Exposure: `advisor_internal`
- Tags: `readiness_scoring`, `risk`, `report`
- Purpose: Explain conceptual readiness scoring without presenting it as certification.
- Include:
  - readiness decreases with severe findings, missing assumptions, low confidence and storage gaps;
  - score is preliminary and evidence-based;
  - deterministic engines remain authoritative.
- Do not include:
  - hidden implementation-only scoring formulas if not product-approved for exposure.

### vm_risk_classification

- Exposure: `public`
- Tags: `vm_risk`, `inventory`, `migration_waves`
- Purpose: Explain how VM-level risk should influence prioritization.
- Include:
  - large VMs need extra validation;
  - snapshots and outdated tools increase caution;
  - missing OS/host/datastore placement lowers confidence;
  - critical workloads should not be early pilots without business evidence.

### migration_waves

- Exposure: `public`
- Tags: `migration_waves`, `pilot_selection`, `business_continuity`
- Purpose: Guide wave planning without inventing dependencies.
- Include:
  - pilot first;
  - low-risk/non-critical workloads before critical systems;
  - dependency-aware grouping;
  - rollback and validation gates;
  - owner and maintenance-window review.

### storage_readiness

- Exposure: `public`
- Tags: `storage_readiness`, `target_architecture`, `missing_evidence`
- Purpose: Explain storage target readiness and why storage is optional but high-value.
- Include:
  - current storage type;
  - target preference;
  - growth assumptions;
  - existing SAN/NAS/NFS/iSCSI/ZFS/Ceph/hybrid fit;
  - storage evidence confidence.
- Do not include:
  - final architecture promise;
  - benchmark claims.

### ceph_suitability

- Exposure: `public`
- Tags: `ceph`, `storage_readiness`, `network`, `backup`
- Purpose: Make Ceph advice conservative and evidence-based.
- Include:
  - Ceph is not default;
  - customer preference is not enough;
  - needs hardware, network, failure domains, backup and operations evidence;
  - fewer than three nodes is usually underdesigned;
  - deterministic Ceph engine is authoritative.
- Must not:
  - recommend Ceph regardless of missing evidence;
  - override `ceph_conditional`, `ceph_underdesigned` or `not_enough_evidence`.

### backup_readiness

- Exposure: `public`
- Tags: `backup`, `business_continuity`, `no_go`
- Purpose: Explain why backup evidence gates migration readiness.
- Include:
  - backup proof;
  - restore validation;
  - RPO/RTO;
  - PBS or equivalent target backup design;
  - rollback plan.
- Must not:
  - approve production movement without backup evidence for critical workloads.

### network_readiness

- Exposure: `public`
- Tags: `network`, `ceph`, `migration_waves`, `target_architecture`
- Purpose: Explain network validation needs.
- Include:
  - VLAN/port group mapping;
  - storage network redundancy;
  - throughput/latency sensitivity;
  - maintenance windows;
  - dependency discovery.

### business_continuity_risk

- Exposure: `public`
- Tags: `business_continuity`, `critical_workloads`, `no_go`
- Purpose: Separate technical migration feasibility from business risk.
- Include:
  - critical workloads require stronger evidence;
  - ERP/SQL/file services need owner, backup, dependency and rollback validation;
  - zero downtime cannot be guaranteed by the Advisor.

### no_go_validations

- Exposure: `advisor_internal`
- Tags: `no_go`, `conditional_go`, `validation`
- Purpose: Provide conservative decision framing.
- Include:
  - No-Go when critical evidence is missing for critical workloads;
  - Conditional Go when pilot is defensible but production is not yet approved;
  - Go only as "ready for next validation step", not as production approval.

### pilot_selection

- Exposure: `public`
- Tags: `pilot_selection`, `migration_waves`, `vm_risk`
- Purpose: Guide pilot selection.
- Include:
  - low dependency;
  - non-critical;
  - representative but reversible;
  - validated backup/rollback;
  - known owner.

### advisor_boundaries

- Exposure: `public`
- Tags: `advisor_boundaries`, `safety`, `prompt_injection`
- Purpose: Reinforce Advisor limits.
- Include:
  - advisory only;
  - no production approval;
  - no infrastructure changes;
  - no secrets;
  - no raw internal block dumps;
  - no system prompt disclosure;
  - no `needs_review` memory as fact.

## Initial Retrieval Map

- Ceph question: `ceph_suitability`, `storage_readiness`, `network_readiness`, `backup_readiness`.
- Migration first/waves: `migration_waves`, `pilot_selection`, `vm_risk_classification`.
- Missing evidence: `evidence_confidence`, `backup_readiness`, `storage_readiness`.
- Low confidence: `evidence_confidence`, `readiness_scoring`.
- No downtime guarantee: `advisor_boundaries`, `business_continuity_risk`.
- ERP / critical workload: `business_continuity_risk`, `backup_readiness`, `migration_waves`.
- Internal methodology request: `advisor_boundaries`.

## Catalog QA Rules

- Every block must have a stable `blockId`.
- Every block must have a version.
- Every block must have at least one tag.
- Restricted blocks must not be selected for user-visible dump.
- Blocks must not contain customer data.
- Blocks must not contain secrets.
- Blocks must not include raw uploaded file content.
- Blocks must not contradict deterministic engines.
