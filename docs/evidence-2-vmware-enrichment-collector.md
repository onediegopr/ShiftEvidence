# HITO EVIDENCE-2 - VMware Enrichment Collector + Parser

Date: 2026-06-01
Status: implemented locally
Scope: proprietary VMware enrichment collector, parser, fixtures, UI/admin integration
DB migration: no
Production impact: none until code is deployed

## Objective

EVIDENCE-2 implements the first real optional evidence collector for Shift Evidence:

```text
Shift Evidence VMware Enrichment Collector
```

The collector is a proprietary PowerCLI script that customers can download, review, run locally against vCenter, inspect locally, and upload into the VMware Enrichment module in the Evidence Expansion Center.

## Collector

Location:

```text
public/collectors/vmware/shift-vmware-evidence-collector.ps1
```

Instructions:

```text
public/collectors/vmware/README.md
```

Language:

- PowerShell / VMware PowerCLI.

Example:

```powershell
.\shift-vmware-evidence-collector.ps1 `
  -Server "vcenter.example.local" `
  -OutputPath ".\shift-vmware-evidence-output.json"
```

Optional switches:

- `-SkipTags`
- `-SkipSnapshots`
- `-SkipDrs`
- `-IncludeCsvSummary`
- `-NoPrompt`
- `-OutputDirectory`

## What It Collects

MVP read-only data:

- VMs.
- Snapshots.
- Tags.
- Folders.
- Resource pools.
- Hosts.
- Clusters.
- Datastores.
- Networks.
- DRS rules when available.

VM data includes, where available:

- name
- id
- instance UUID
- BIOS UUID
- power state
- guest identifiers
- CPU and memory
- folder
- resource pool
- host
- cluster
- datastores
- networks
- VMware Tools status
- hardware version
- annotations/notes
- tags
- custom attributes
- snapshot counts and snapshot age signals

## What It Does Not Do

The collector does not:

- modify vCenter configuration;
- create resources;
- delete resources;
- modify VMs;
- modify hosts;
- modify clusters;
- modify datastores;
- modify tags;
- create or delete snapshots;
- persist credentials;
- upload data externally;
- send data to Shift Evidence automatically.

The customer reviews the JSON output before upload.

## Output Schema

Schema:

```text
shift-evidence.vmware-enrichment.v1
```

Collector metadata:

```json
{
  "name": "shift-vmware-evidence-collector",
  "displayName": "Shift Evidence VMware Enrichment Collector",
  "version": "0.1.0",
  "owner": "Shift Evidence",
  "mode": "read-only"
}
```

Safety metadata:

```json
{
  "persistentCredentialsStored": false,
  "configurationChanged": false,
  "rawSecretsIncluded": false,
  "networkUploadPerformed": false
}
```

## Parser

Parser key:

```text
vmware-enrichment-parser-v1
```

Parser version:

```text
1.0.0
```

Files:

- `src/server/evidence/parsers/vmwareEnrichmentParser.ts`
- `src/server/evidence/schemas/vmwareEnrichmentSchema.ts`

The parser is registered before the metadata-only fallback, so VMware Enrichment JSON resolves to the domain-specific parser.

## Parser Validation

The parser validates:

- JSON format.
- schema.
- collector name.
- collector mode.
- collector version.
- safety flags.
- entities object.
- expected arrays.
- summary shape.
- basic secret-like patterns.

Failure cases:

- missing/unsupported schema;
- missing entities;
- invalid JSON;
- collector not recognized;
- mode not read-only;
- safety flags not false;
- obvious secret-like content.

## Secret Scanning

The parser checks textual content and keys for patterns such as:

- `password=`
- `passwd`
- `secret`
- `token`
- `api_key`
- `BEGIN PRIVATE KEY`
- `Authorization: Bearer`
- obvious connection strings

If detected:

- parser fails;
- raw value is not included in parser summary;
- error says secret-like content was detected;
- no secret value is printed.

## Matching Against RVTools

Matching priority:

1. instance UUID.
2. BIOS UUID.
3. normalized VM name.
4. unmatched.

If RVTools inventory is not available:

- parser still parses the VMware enrichment output;
- status becomes `parsed_with_warnings`;
- warning says matching is deferred/limited.

If RVTools exists but collector VMs are unmatched:

- parser records unmatched count;
- status becomes `parsed_with_warnings`;
- base report remains available.

## Parser Summary

The parser writes safe structured output into `EvidenceParseResult.summaryJson`.

Summary includes:

- VM count.
- matched VM count.
- unmatched VM count.
- snapshot VM count.
- old snapshot count.
- tagged VM count.
- untagged VM count.
- resource pool count.
- DRS rule count.
- network binding count.
- datastore mapping count.
- host/cluster/datastore/tag assignment counts.
- matching counts by method.
- capped signals for snapshots, tags, resource pools, networks and cluster policies.

Detailed normalized entities are written to `normalizedEntitiesJson`.

No domain-specific Prisma tables were added in this hito.

## UI Integration

Location:

- Assessment detail.
- Evidence tab.
- Evidence Expansion Center.
- VMware Enrichment card.

User can:

- download the collector;
- open collector instructions;
- upload JSON output;
- see latest upload;
- see parser warnings/errors;
- see matched/unmatched VM counts;
- see old snapshot count;
- see tag and DRS signals.

Safety copy is visible in the card.

## Admin Visibility

Admin console shows:

- module state;
- parser status;
- parser key/version;
- last upload;
- warning count;
- error count;
- VM count;
- matched/unmatched count;
- old snapshot count;
- tag assignment count;
- DRS rule count.

No admin review action was added yet.

## Fixtures

Fixture folder:

```text
tests/fixtures/evidence/vmware-enrichment
```

Fixtures:

- `vmware-enrichment-small-clean.json`
- `vmware-enrichment-medium-mixed.json`
- `vmware-enrichment-snapshot-heavy.json`
- `vmware-enrichment-tags-resourcepools.json`
- `vmware-enrichment-drs-rules.json`
- `vmware-enrichment-unmatched-vms.json`
- `vmware-enrichment-missing-schema.json`
- `vmware-enrichment-malformed.json`
- `vmware-enrichment-secret-leak-attempt.json`
- `vmware-enrichment-no-rvtools-yet.json`

All data is synthetic.

## Tests

Specific test files:

- `tests/unit/vmwareEnrichmentCollector.test.ts`
- `tests/unit/vmwareEnrichmentParser.test.ts`

Coverage:

- collector file exists;
- collector has Shift Evidence ownership;
- collector declares read-only behavior;
- collector contains expected schema and safety metadata;
- collector does not contain obvious infrastructure write commands;
- parser parses clean fixture;
- parser handles mixed warnings;
- parser detects snapshot risk signals;
- parser parses tags/resource pools;
- parser handles DRS rules;
- parser reports unmatched VMs;
- parser fails missing schema;
- parser fails malformed JSON;
- parser detects secret leak attempts without exposing values;
- parser handles no RVTools inventory;
- matching priority is instance UUID, BIOS UUID, name;
- parser registry resolves VMware parser before fallback.

## Limitations

- PowerCLI/vCenter permissions vary by customer.
- Tags and DRS may be unavailable depending on permissions or version.
- Matching depends on RVTools UUID availability; name matching is a fallback only.
- Secret scanning is basic and not a full DLP engine.
- Collector has not been executed by Codex against a real vCenter.
- No admin manual review action exists yet.
- No production deploy was performed in this hito.

## Next Hito

Recommended:

```text
EVIDENCE-3 - Proxmox Target Validation Collector + Parser + Readiness Engine
```
