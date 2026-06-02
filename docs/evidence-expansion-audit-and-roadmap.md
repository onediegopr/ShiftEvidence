# HITO EVIDENCE-0 - Evidence Expansion Audit and Roadmap

Date: 2026-06-01
Status: audit/design complete, no product functionality changed
Scope: Evidence Expansion Layer, proprietary collectors, Migration Recommendation Plan, print-friendly PDFs, synthetic datasets
Production impact: none
Public launch decision: unchanged, no full public launch declaration

## A. Executive Summary

EVIDENCE-0 confirms that Shift Evidence / ShiftReadiness already has a strong base for VMware to Proxmox assessments: RVTools parsing, risk scoring, storage readiness, licensing and cost exposure, report preview/PDF generation, Senior Advisor, Project Memory, admin console, billing foundation and production deployment practices.

The new Evidence Expansion line should not be implemented as isolated upload buttons. It should be implemented as a common evidence framework that keeps the current RVTools-first assessment intact while allowing optional evidence modules to increase confidence, reduce assumptions and unlock a separate Migration Recommendation Plan.

Recommended product direction:

- Keep RVTools as the base required technical evidence.
- Add optional evidence modules with clear states: not provided, uploaded, parsed, failed, stale, skipped, reviewed.
- Treat missing evidence as a confidence and recommendation limiter, not as a basic-assessment blocker.
- Build proprietary, read-only Shift Evidence collectors and spreadsheet/JSON templates.
- Ingest collector outputs through a parser registry instead of per-feature one-off workflows.
- Persist structured parser results and module completeness in additive tables.
- Use deterministic scoring and rule engines for validation; use AI only for narrative synthesis and question generation.
- Convert report PDFs toward a light, print-friendly design system before adding the new premium report.
- Create a synthetic dataset library early, before collectors and parsers become difficult to test.

Current recommendation for the next hito:

- EVIDENCE-1 should add the common evidence framework with a small additive database migration.
- It should not yet build all collectors.
- It should define module state, parser registry, file validation, UI cards and report confidence integration.

Implementation update after EVIDENCE-3:

- EVIDENCE-1 is complete and introduced the common Evidence Expansion framework.
- EVIDENCE-2 is complete and introduced the proprietary VMware enrichment collector/parser.
- EVIDENCE-3 is complete in code and introduces the proprietary Proxmox Target Validation collector/parser/readiness engine without a DB migration.
- EVIDENCE-4 is complete in code and introduces the proprietary Veeam Backup Evidence collector/parser/readiness engine without a DB migration.
- The next recommended evidence hito is EVIDENCE-5: Storage/SAN Evidence Enrichment + Vendor-Neutral Templates + Storage Readiness Signals.

## B. Current State Audit

### Git and workspace

Observed local state during audit:

- Branch: main.
- Working tree had unrelated untracked logo PNG files under `images/`.
- A billing setup document had prior unrelated local changes.
- EVIDENCE-0 did not modify those existing changes.

### Existing evidence model

The Prisma schema already contains `EvidenceFile` and the `EvidenceType` enum:

- rvtools
- manual_csv
- veeam
- proxmox
- network
- cmdb
- other

This is a useful signal: the product was already directionally prepared for multi-source evidence, but the operational workflow is still RVTools-centric.

### Existing RVTools pipeline

Current RVTools flow:

- Upload evidence file through assessment evidence actions.
- Store file locally through evidence storage service.
- Create an `EvidenceFile` record.
- Parse only if `evidenceType` is `rvtools`.
- Replace parsed VM, host, datastore, snapshot and summary rows for that evidence file.
- Mark processing status and write audit events.

Strengths:

- Good owner checks.
- Processing status exists.
- Audit events exist.
- Parsed inventory is normalized into first-class tables.
- Parser has warnings and partial recognition behavior.

Gaps:

- Parser workflow is hard-coded to RVTools.
- No common parser registry.
- No generic parsed evidence result object.
- No module-level evidence completeness state.
- No collector version/schema metadata envelope.
- No user-facing Evidence Expansion Center.
- No admin reviewer queue for non-RVTools evidence.

### Existing optional modules

Storage Destination Readiness and Client Context are strong prototypes for optional evidence:

- They are additive.
- They support structured inputs and additional evidence.
- They can remain missing without blocking base report generation.
- They influence confidence and report narrative.

These patterns should be generalized into the Evidence Expansion Layer.

### Existing completion/confidence model

The assessment completion service already has module weights for:

- RVTools Inventory
- Infrastructure Risk Analysis
- Migration Questions
- Storage Destination Readiness
- Licensing and Cost Exposure
- Client Context and Additional Evidence
- Manual Assumptions
- AI Advisory
- Report Generation

This should evolve into a richer evidence completeness model rather than a separate competing system.

### Existing report preview/PDF architecture

Report preview is centralized and already builds:

- Executive summary
- Technical summary
- Evidence overview
- Coverage section
- Licensing section
- Customer context section
- Storage readiness section
- AI advisory
- Missing evidence
- Risk findings

PDF rendering exists through PDFKit. It is functional, but current PDF design still includes dark navy headers, dark cover blocks and dark sample-report sections. This is acceptable for screen/demo impact, but not ideal for print-friendly deliverables.

### Existing AI guardrails

The AI advisory sanitizer already redacts or removes sensitive content such as secrets, tokens, emails, raw file content keys and storage paths. Senior Advisor prompts already require separation between confirmed facts, inferred facts, customer-reported facts and missing evidence.

This is a strong foundation for future AI use, provided raw collector files are never sent directly to AI.

## C. External Technical Research

Sources reviewed:

- VMware PowerCLI Get-VM official reference: https://developer.broadcom.com/powercli/latest/vmware.vimautomation.core/commands/get-vm
- VMware PowerCLI Get-Snapshot official reference: https://developer.broadcom.com/powercli/latest/vmware.vimautomation.core/commands/get-snapshot
- VMware PowerCLI Get-TagAssignment official reference: https://developer.broadcom.com/powercli/latest/vmware.vimautomation.core/commands/get-tagassignment
- VMware PowerCLI Get-DrsClusterGroup official reference: https://developer.broadcom.com/powercli/latest/vmware.vimautomation.core/commands/get-drsclustergroup/
- Proxmox VE API wiki: https://pve.proxmox.com/wiki/Proxmox_VE_API
- Proxmox `pvesh` manual: https://pve.proxmox.com/pve-docs/pvesh.1.html
- Veeam PowerShell Get-VBRJob official reference: https://helpcenter.veeam.com/docs/backup/powershell/get-vbrjob.html
- AsBuiltReport VMware vSphere repository: https://github.com/AsBuiltReport/AsBuiltReport.VMware.vSphere
- Azure Migrate dependency analysis: https://learn.microsoft.com/en-us/azure/migrate/concepts-dependency-visualization
- AWS Application Discovery Service Agentless Collector: https://docs.aws.amazon.com/application-discovery/latest/userguide/agentless-collector.html
- NetApp ONTAP REST API performance metrics: https://docs.netapp.com/us-en/ontap-automation/rest/performance_metrics.html
- Dell PowerStore REST API overview: https://www.dell.com/support/manuals/en-us/powerstore-500t/pwrstr-apidevg/the-powerstore-rest-api

Research conclusions:

- VMware enrichment can be collected safely with PowerCLI read-only commands for VMs, snapshots, tags, folders, resource pools, DRS groups/rules, hosts, datastores, networks and distributed switches.
- Proxmox target validation can start with `pvesh` JSON exports and later add optional API token support.
- Veeam backup evidence can be collected with PowerShell read-only commands for jobs, sessions and restore points, but agent job APIs must be handled carefully because some older cmdlet patterns are deprecated.
- Community projects such as AsBuiltReport validate the feasibility of read-only infrastructure documentation, but Shift Evidence collectors should be proprietary and should not copy external code.
- Dependency mapping should not be overclaimed. Mature platforms use traffic/process evidence, polling windows and agent/agentless distinctions. Shift Evidence should start with optional templates and explicit confidence labels.
- Storage/SAN enrichment should begin vendor-neutral and metric-oriented, then add vendor-specific adapters only where read-only APIs and customer permissions are clear.

## D. Evidence Expansion Layer Design

Core principle: every evidence module is optional, versioned, auditable and confidence-affecting.

Recommended module catalog:

- VMware Evidence Enrichment
- Proxmox Target Validation
- Backup Evidence Analysis
- SAN / Storage Evidence Enrichment
- Application Dependency Mapping
- Migration Plan Readiness
- Evidence Completeness and Confidence

Recommended module states:

- not_provided
- template_downloaded
- collector_downloaded
- uploaded
- queued
- parsing
- parsed
- parsed_with_warnings
- failed
- stale
- skipped
- reviewed

Recommended persistence model:

- `AssessmentEvidenceModule`: one row per assessment and module.
- `EvidenceUpload`: one row per uploaded evidence artifact or collector result.
- `EvidenceParseResult`: normalized parser status, schema version, warnings, errors and extracted summary JSON.
- Existing `EvidenceFile` can remain as the physical file record.
- Existing RVTools normalized tables can remain first-class.
- New module parsed output can start as structured JSON and graduate to first-class tables when query/reporting needs are stable.

Recommended file envelope for collector outputs:

```json
{
  "schema": "shift-evidence.collector-output.v1",
  "collector": {
    "name": "shift-vmware-evidence-collector",
    "version": "0.1.0",
    "mode": "read-only"
  },
  "source": {
    "platform": "vmware-vsphere",
    "collectionStartedAt": "2026-06-01T00:00:00.000Z",
    "collectionEndedAt": "2026-06-01T00:00:00.000Z"
  },
  "safety": {
    "persistentCredentialsStored": false,
    "configurationChanged": false,
    "rawSecretsIncluded": false
  },
  "entities": {},
  "warnings": [],
  "errors": []
}
```

Parser rules:

- Validate schema version before parsing.
- Reject unexpected executable payloads.
- Limit file size and row count per plan.
- Never trust client-reported counts without parser validation.
- Capture parser warnings without failing the whole module when safe.
- Normalize VM names, UUIDs, instance IDs and hostnames consistently.
- Preserve source provenance for every recommendation.

## E. VMware Evidence Enrichment

Purpose:

- Fill gaps RVTools may not capture clearly enough for migration planning.
- Improve grouping, ownership, wave design and risk interpretation.

Collector approach:

- PowerShell/PowerCLI script.
- Read-only connection to vCenter.
- No persistent credentials.
- Output JSON and optional CSV summary.
- Customer runs locally and uploads output.

Candidate collected data:

- VM tags and categories.
- Folders and resource pools.
- Custom attributes and annotations.
- Snapshot details.
- VMware Tools status.
- Hardware version and guest OS.
- Affinity and anti-affinity rules.
- DRS groups/rules.
- HA/DRS cluster settings.
- Alarms summary.
- Distributed switches, port groups and backing networks.
- Datastore mapping and storage policies.
- Potential stale/orphan indicators.

Do not claim:

- Runtime application dependencies.
- Firewall readiness.
- Backup recoverability.
- Target Proxmox compatibility.

MVP parser output:

- `vmwareEnrichmentSummary`
- `vmAnnotations`
- `vmTags`
- `vmResourcePools`
- `vmSnapshotSignals`
- `vmNetworkBindings`
- `clusterPolicySignals`
- `warnings`

## F. Proxmox Target Validation

Purpose:

- Determine whether a planned or existing Proxmox target is validated, partially ready, insufficient, not validated or requires remediation.

Collector approach:

- Bash script using `pvesh` on a Proxmox node.
- Optional API token mode later.
- Read-only commands only.
- JSON output per endpoint plus combined envelope.

Candidate collected data:

- Cluster status.
- Nodes and versions.
- CPU and memory capacity.
- Storage definitions.
- Storage free/used capacity.
- Ceph status when available.
- ZFS/local-lvm/NFS/iSCSI indicators.
- Bridges and VLAN awareness.
- HA groups/resources.
- PBS presence or declared backup target.
- Existing VM/CT load.

MVP validation states:

- target_validated
- target_partially_ready
- target_insufficient
- target_not_validated
- target_requires_remediation

Key safeguards:

- Never recommend Ceph just because it exists.
- Require hardware, disk, network, failure-domain and operational evidence for strong Ceph confidence.
- Treat missing target export as a confidence limiter, not a base report blocker.

## G. Backup Evidence Analysis

Purpose:

- Validate whether protected workloads have adequate backup evidence before recommending production migration waves.

Collector approach:

- PowerShell script for Veeam Backup and Replication.
- Read-only commands for jobs, sessions, protected objects and restore points.
- Optional generic CSV/XLSX template for non-Veeam platforms.

Candidate collected data:

- Jobs.
- Protected VMs.
- Unprotected VMs.
- Last backup status.
- Last successful restore point.
- Restore point count.
- Frequency and retention.
- Repositories.
- Backup copy jobs.
- Failed/warning jobs.
- Approximate RPO/RTO indicators when customer provides policy context.

Recommendation rules:

- If no backup evidence exists, mark backup recoverability as unvalidated.
- If backups are stale or failed, block advanced wave recommendation for affected VMs.
- If VMs are missing from backup jobs, flag as remediation before migration.
- Do not infer successful restore testing unless explicit evidence exists.

## H. SAN / Storage Evidence Enrichment

Purpose:

- Improve confidence around capacity, performance and target storage suitability.

MVP approach:

- Vendor-neutral CSV/XLSX/JSON template first.
- Optional NetApp ONTAP and Dell PowerStore read-only adapters later.

Candidate collected data:

- Datastores/volumes/LUNs.
- Capacity, used, free and growth trend if available.
- IOPS, latency and throughput windows.
- Protocol: NFS, iSCSI, FC, NVMe, local, Ceph, ZFS.
- Snapshot/replication status.
- Oversubscription and thin provisioning.
- Multipath/redundancy indicators.
- Storage-network details when available.

Key safeguards:

- Treat performance data without time window as limited.
- Treat vendor export with unknown mappings as partial.
- Do not assert target performance without target storage evidence.

## I. Application Dependency Mapping

Purpose:

- Help group VMs into safer migration waves and identify dependency gaps.

MVP approach:

- Manual/template-driven first.
- Accept CSV/XLSX/JSON mapping of application, VM, owner, criticality, dependency type, port/protocol, upstream/downstream and migration group.
- Later optional collectors can ingest CMDB/IPAM/NetBox exports or agentless connection summaries.

Confidence model:

- dependency_not_provided
- dependency_customer_reported
- dependency_export_uploaded
- dependency_observed_windowed
- dependency_reviewed

Rules:

- Do not claim complete application dependency coverage from RVTools alone.
- Do not infer firewall or routing requirements without evidence.
- Use missing dependency evidence as a warning and wave-planning limiter.

## J. Collectors and Templates

Collector principles:

- Shift Evidence proprietary implementation.
- Read-only by design.
- No persistent credentials.
- No infrastructure changes.
- No install requirement for base product.
- Output local file only.
- Clear version and schema metadata.
- Dry-run or preview mode where useful.
- Customer can inspect output before upload.

Collector package candidates:

- `shift-vmware-evidence-collector.ps1`
- `shift-proxmox-target-collector.sh`
- `shift-veeam-backup-collector.ps1`
- `shift-storage-template.xlsx`
- `shift-dependency-template.xlsx`
- `shift-evidence-schema.json`

Download UX:

- Add an Evidence Expansion Center in assessment detail.
- Show collector cards by module.
- Show requirements, OS, permissions, safety summary and expected output.
- Provide templates for customers who cannot run scripts.
- Provide checksum/version for each downloadable collector.

Security UX:

- State that collectors are read-only.
- State that credentials are not stored.
- State that output should be reviewed before upload.
- State that secrets/tokens should not be included.
- Provide a "what this collector reads" disclosure.

## K. UI, Admin and IA

User dashboard changes:

- Add Evidence Expansion Center under assessment evidence.
- Keep RVTools upload prominent and unchanged.
- Add optional module cards with status, confidence impact and next action.
- Add upload/parse/reparse actions per module.
- Add collector/template download actions.
- Add parser warnings visible to the user.
- Add "what is missing for higher confidence" explanations.

Admin console changes:

- Evidence module overview by assessment.
- Parse status and failed parser queue.
- Collector version/checksum visibility.
- Uploads needing review.
- Suspicious/invalid file warnings.
- Cross-assessment stale module list.
- Ability to mark evidence reviewed/skipped without deleting source files.

Information architecture:

- Base assessment remains simple.
- Advanced evidence is progressive.
- Premium Migration Recommendation Plan is separate from the standard readiness report.
- Public landing and sample content should be expanded later, not reduced.

## L. Migration Recommendation Plan

This should be a premium separate deliverable, not just another section inside the current readiness report.

Purpose:

- Convert evidence into a defensible migration recommendation and phased plan.

Recommended sections:

- Executive decision summary.
- Evidence coverage and confidence.
- Migration readiness gates.
- Recommended target pattern.
- Workload grouping and wave strategy.
- Backup and rollback readiness.
- Storage and target capacity validation.
- Network/dependency validation.
- Risks and remediations.
- Pilot recommendation.
- No-go items.
- Open evidence requests.
- Next 30/60/90 day plan.

Recommendation levels:

- migration_recommended_for_pilot
- migration_recommended_with_remediation
- migration_not_recommended_yet
- migration_blocked_by_evidence_gap
- migration_blocked_by_target_gap

Strict gates:

- No backup evidence: no strong production migration recommendation.
- No Proxmox target evidence: no strong target readiness claim.
- No dependency evidence: wave plan must be labeled preliminary.
- No storage evidence: storage recommendation remains conditional.
- AI narrative cannot override deterministic gates.

## M. Print-Friendly PDF Direction

Current state:

- Existing PDFs and sample reports are functional.
- They use dark navy headers/cover sections in multiple places.
- This works visually on screen but is not ideal for print, low-ink delivery or client board packs.

Recommended design system:

- Light background by default.
- High contrast dark text.
- Use accent color only for section labels, badges and rules.
- Avoid large dark rectangles except optional cover variants.
- Tables must use light fills and strong borders.
- Risk severity should not depend only on color.
- Every chart/table should remain legible in grayscale.
- Footer should include assessment title, generated date and page number.
- Cover page should have a print-safe variant.

Implementation recommendation:

- First create a shared report theme abstraction.
- Then convert existing readiness report and public sample report.
- Then build Migration Recommendation Plan on top of the same theme.

## N. Synthetic Dataset Strategy

Why this must happen early:

- New parsers will be hard to trust without repeatable fixtures.
- Collectors cannot be tested against customer data.
- Demos need realistic but safe examples.
- AI guardrails need adversarial fixtures.

Dataset families:

- Small clean environment.
- Medium mixed-risk environment.
- Large enterprise environment.
- Snapshot-heavy environment.
- Multi-cluster VMware environment.
- Storage-constrained environment.
- No-backup evidence environment.
- Partial Proxmox target environment.
- Valid Proxmox target environment.
- Dependency-heavy application environment.
- Bad/malformed uploads.
- Secret-leak attempt uploads.

Fixture outputs:

- RVTools-like workbooks.
- VMware enrichment JSON.
- Proxmox target JSON.
- Veeam backup JSON.
- Storage template XLSX/CSV.
- Dependency map XLSX/CSV.
- Expected parser summaries.
- Expected confidence outcomes.
- Expected report warnings.

## O. Roadmap: 9 Large Hitos

### Hito 1: EVIDENCE-0, audit and roadmap

Status: complete with this document.

Deliverables:

- Architecture audit.
- External research.
- Evidence framework design.
- Collector strategy.
- PDF print-friendly direction.
- Dataset strategy.
- Implementation roadmap.

### Hito 2: EVIDENCE-1, common evidence framework

Status: implemented locally on 2026-06-01.

Recommended DB impact: yes, additive only.

Deliverables:

- Additive Prisma migration for evidence modules and parser results.
- Parser registry.
- Module status service.
- Evidence upload orchestration.
- UI cards for optional modules.
- Admin visibility for parse status.
- Confidence integration.
- Tests and docs.

### Hito 3: EVIDENCE-2, VMware enrichment collector and parser

Status: implemented locally on 2026-06-01.

Deliverables:

- Proprietary PowerCLI collector.
- JSON schema.
- Parser and validation.
- VM matching against RVTools.
- UI upload/download.
- Report confidence updates.
- Synthetic fixtures.

### Hito 4: EVIDENCE-3, Proxmox target validation

Deliverables:

- Proprietary `pvesh` collector.
- Proxmox target parser.
- Target readiness engine.
- Ceph/ZFS/NFS/local-lvm conditional logic.
- UI/report/admin integration.

### Hito 5: EVIDENCE-4, backup evidence analysis

Deliverables:

- Veeam read-only collector.
- Generic backup template.
- Protected/unprotected VM analysis.
- RPO/restore-point signals.
- Backup readiness gates.
- Report/advisor integration.

### Hito 6: EVIDENCE-5, storage/SAN enrichment

Deliverables:

- Vendor-neutral storage template.
- Optional NetApp/Dell collector adapters only after safety review.
- Capacity/performance summary.
- Storage target confidence updates.
- Print-ready storage section.

### Hito 7: EVIDENCE-6, dependency mapping

Deliverables:

- Dependency template.
- CMDB/IPAM import shape.
- Application grouping/wave evidence.
- Dependency confidence model.
- Missing dependency warnings.

### Hito 8: EVIDENCE-7, Migration Recommendation Plan

Deliverables:

- Premium separate report model.
- Deterministic recommendation gates.
- AI narrative layer with evidence labels.
- PDF generator using print-friendly theme.
- Admin/user preview workflow.

### Hito 9: EVIDENCE-8, public/demo/docs expansion

Deliverables:

- Landing copy additions.
- Pricing/support/sample updates.
- Demo with synthetic multi-evidence scenario.
- Collector documentation.
- Sales/demo sample reports.
- No deletion of existing useful content unless explicitly approved.

## P. Estimates and Completion Percentages

Before EVIDENCE-0:

- Base platform: 94-96%.
- Evidence Expansion implemented: 0-5%.
- Evidence Expansion conceptually designed: 25-35%.
- Collectors implemented: 0-5%.
- Migration Recommendation Plan: 0-10%.
- PDF print-friendly global: pending.
- Synthetic dataset library: pending.

After EVIDENCE-0:

- Base platform: unchanged, about 94-96%.
- Evidence Expansion implemented: unchanged, about 0-5%.
- Evidence Expansion designed: about 70-75%.
- Collectors implemented: unchanged, about 0-5%.
- Collectors designed: about 45-55%.
- Migration Recommendation Plan designed: about 55-65%.
- PDF print-friendly direction: about 35-45%.
- Synthetic dataset strategy: about 40-50%.
- EVIDENCE-0 hito completion: 100% if this document is accepted.

## Q. Risk Register

Primary risks:

- Schema overgrowth if every evidence source becomes first-class too early.
- Collector support burden if customer environments vary widely.
- Overclaiming readiness from partial evidence.
- AI narrative accidentally sounding more certain than evidence allows.
- PDF refactor touching too much at once.
- File uploads containing secrets, raw configs or sensitive customer data.
- Customer confusion if optional modules feel required.

Mitigations:

- Start with generic module/result persistence plus JSON summaries.
- Version collector outputs.
- Use deterministic gates before AI.
- Keep missing evidence visible.
- Add fixtures before broad parser expansion.
- Keep base RVTools report path unchanged.
- Use additive UI and documentation.

## R. Recommended Acceptance Criteria for EVIDENCE-1

EVIDENCE-1 should be accepted only if:

- Existing RVTools assessment still works.
- Existing report generation still works.
- Optional modules can be listed and tracked.
- Uploads can be associated with a module.
- Parser registry can route by evidence type/module.
- Parse result warnings/errors are persisted.
- Completion/confidence summary includes optional module states.
- Admin can see evidence module status.
- No raw secrets are stored in docs or committed files.
- No landing/billing/production behavior is changed.

## S. Final Recommendation

Proceed with EVIDENCE-1 as an additive technical foundation hito.

Do not start with all collectors at once. The correct order is:

- Common evidence framework.
- VMware enrichment.
- Proxmox target validation.
- Backup evidence.
- Storage/SAN evidence.
- Dependency mapping.
- Migration Recommendation Plan.
- Print-friendly PDF rollout.
- Public/demo/pricing expansion.

This sequence protects the current product, keeps the base report working, and turns new evidence into a confidence-driven premium layer rather than a risky rewrite.
