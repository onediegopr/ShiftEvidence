# EVIDENCE-5 - Storage/SAN Evidence Readiness

Date: 2026-06-02
Status: implemented locally in product code, validated with synthetic fixtures
Production impact: none
Deployment: not deployed by this hito
DB migration: no

## Objective

EVIDENCE-5 adds optional Storage/SAN evidence enrichment for Shift Evidence. The module lets customers provide vendor-neutral CSV or JSON evidence for arrays, pools, volumes, LUNs, datastore mappings, performance samples, replication, snapshot policies and target storage candidates.

Storage/SAN evidence is optional. Missing Storage/SAN evidence does not block the base RVTools-first assessment. It only limits confidence for storage capacity, performance, replication and target-storage readiness claims.

## Implemented

- Vendor-neutral CSV and JSON templates under `public/templates/storage/`.
- Customer-facing template README with safety and upload guidance.
- Domain parser `storage-san-parser-v1`.
- Schema `shift-evidence.storage-san.v1`.
- Storage/SAN readiness engine.
- Parser registry integration before metadata fallback.
- Matching against parsed RVTools datastores.
- Best-effort comparison against latest parsed Proxmox Target evidence.
- User UI download/upload/status integration in the Evidence Expansion Center.
- Admin summary metrics for Storage/SAN evidence.
- Synthetic fixtures for healthy, warning, critical and unsafe payloads.
- Unit tests for templates, parser behavior, readiness states and module status updates.

## Templates

Locations:

```text
public/templates/storage/shift-storage-san-template.csv
public/templates/storage/shift-storage-san-template.json
public/templates/storage/README.md
```

Supported formats:

- CSV
- JSON

XLSX templates are intentionally out of scope for this hito. They can be added later if customer demand justifies a spreadsheet-first workflow.

## Supported Record Types

- `array`
- `pool`
- `volume`
- `lun`
- `datastore_mapping`
- `performance_sample`
- `replication`
- `snapshot_policy`
- `target_storage_candidate`

## CSV Columns

```text
recordType,sourceSystem,vendor,model,arrayName,poolName,volumeName,lunName,datastoreName,protocol,totalGb,usedGb,freeGb,usagePercent,thinProvisioned,replicated,snapshotEnabled,iopsRead,iopsWrite,latencyMs,throughputMBps,sampleWindow,notes,criticality
```

## What This Module Does Not Do

- Does not connect to customer SAN/NAS APIs.
- Does not collect vendor credentials.
- Does not store passwords, API tokens or connection strings.
- Does not modify SAN/NAS configuration.
- Does not create, resize or delete volumes.
- Does not change replication or snapshot policies.
- Does not upload customer data to storage vendors.
- Does not claim performance readiness without a `sampleWindow`.
- Does not block the base RVTools assessment when absent.

## Parser

Parser key:

```text
storage-san-parser-v1
```

Schema:

```text
shift-evidence.storage-san.v1
```

Validations:

- JSON must parse when JSON is uploaded.
- CSV must include all required columns when CSV is uploaded.
- Schema must match for JSON payloads.
- Safety flags must remain false.
- Entities object must exist.
- Expected entity collections must be arrays when present.
- Secret-like content fails parsing without storing raw values in parser summaries.

Secret scanning includes password-like keys/values, API keys, bearer tokens, private keys, connection strings, URL-embedded credentials and obvious UNC credential patterns.

## Matching

Storage/SAN datastore names are matched against parsed RVTools datastores by normalized datastore name.

If RVTools datastore inventory is unavailable, the parser still succeeds with a warning:

```text
Storage/SAN evidence uploaded before RVTools inventory; datastore matching is limited.
```

If RVTools inventory exists and mappings are unmatched, the parser returns `parsed_with_warnings`.

## Proxmox Target Comparison

When latest parsed Proxmox Target evidence is available, the parser checks whether target storage comparison is available through target storage candidate evidence and parsed Proxmox storage summary.

If Proxmox Target evidence is missing, the parser still succeeds with a warning:

```text
Target storage comparison requires Proxmox Target evidence.
```

## Storage Readiness Engine

File:

```text
src/server/evidence/engines/storageSanReadinessEngine.ts
```

Storage states:

- `storage_validated`
- `storage_partially_ready`
- `storage_requires_remediation`
- `storage_insufficient`
- `storage_not_validated`

Initial rules:

- Parser failure or missing storage evidence produces `storage_not_validated`.
- Critical pool utilization, critically low free capacity, or missing datastore mappings when RVTools exists can produce `storage_insufficient`.
- High utilization, high latency, unhealthy replication, thin provisioning risk or unmatched datastore mappings produce `storage_requires_remediation`.
- Missing target comparison, performance evidence, replication evidence, snapshot evidence or sample windows can produce `storage_partially_ready`.
- `storage_validated` requires mapping, performance with sample window, replication evidence, snapshot evidence, target storage comparison, no unmatched datastores and no warnings.

Thresholds:

- Warning utilization: 80%.
- Critical utilization: 90%.
- Critical free capacity: below 10%.
- Warning latency: above 10 ms.
- Critical latency: above 20 ms.

Performance statements remain conservative unless a sample window is provided.

## User UI

The Evidence Expansion Center now shows Storage/SAN Evidence with:

- Customer-provided evidence safety guidance.
- CSV template download.
- JSON template download.
- Template instructions link.
- Parser status.
- Storage readiness status and confidence.
- Array, pool, volume/LUN and mapping counts.
- Target storage candidates.
- Capacity warning and critical counts.
- Performance, replication and snapshot evidence presence.
- Top recommendations.

## Admin Visibility

Admin advanced evidence view includes:

- Module status.
- Last upload.
- Parser key/version.
- Warning/error counts.
- Storage readiness status.
- Confidence.
- Array count.
- Pool count.
- Volume/LUN count.
- Datastore mapping count.
- High and critical usage counts.
- Target storage candidate count.

No admin review action was added in this hito.

## Fixtures

Synthetic fixtures:

- `storage-san-healthy.json`
- `storage-san-capacity-warning.json`
- `storage-san-critical-usage.json`
- `storage-san-performance-latency.json`
- `storage-san-no-performance-window.json`
- `storage-san-replication-failed.json`
- `storage-san-thin-provisioning-risk.json`
- `storage-san-unmapped-datastores.json`
- `storage-san-target-candidates.json`
- `storage-san-missing-schema.json`
- `storage-san-malformed.json`
- `storage-san-secret-leak-attempt.json`
- `storage-san-no-rvtools-yet.json`
- `storage-san-healthy.csv`
- `storage-san-critical-usage.csv`
- `storage-san-invalid-columns.csv`

Fixture coverage includes healthy evidence, capacity warning/critical, latency, missing sample window, replication failure, thin provisioning risk, unmatched datastores, target candidates, missing schema, malformed input, secret leak attempt and no-RVTools-yet behavior.

## Tests

Unit coverage:

- `tests/unit/storageSanTemplate.test.ts`
- `tests/unit/storageSanParser.test.ts`
- `tests/unit/storageSanReadinessEngine.test.ts`
- `tests/unit/evidenceExpansionService.test.ts`

## Security Notes

- No secrets are required for Storage/SAN templates.
- Customer data remains customer-provided and reviewable before upload.
- Parser summaries do not store raw secret-like values.
- Vendor-specific collectors remain out of scope until read-only API behavior and customer permissions are explicitly defined.

## Launch Decision

Storage/SAN Evidence is implemented as an optional evidence expansion module. It is suitable for controlled product use and synthetic fixture validation.

It does not change the public launch decision.

Full public launch remains out of scope for this hito.

## Next Recommended Hito

Recommended next hito: EVIDENCE-6 - Application Dependency Mapping and Migration Plan Readiness.

The next hito should remain conservative about dependency claims and should distinguish customer-provided metadata from observed traffic/process evidence.
