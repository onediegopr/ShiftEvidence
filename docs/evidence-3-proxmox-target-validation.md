# EVIDENCE-3 - Proxmox Target Validation Collector and Parser

Date: 2026-06-01
Status: implemented locally in product code, validated with synthetic fixtures
Production impact: none
Deployment: not deployed by this hito
DB migration: no

## Objective

EVIDENCE-3 adds the Shift Evidence Proxmox Target Validation module. The module lets a customer download a proprietary read-only Bash collector, run it locally on a Proxmox VE node, review the generated JSON output and upload it to the optional Proxmox Target Validation card in the Evidence Expansion Center.

This evidence is optional. Missing target validation does not block RVTools upload, base assessment scoring, report preview or report generation.

## Implemented

- Proprietary Shift Evidence Proxmox Target Collector.
- Collector README and customer execution instructions.
- Domain parser `proxmox-target-parser-v1`.
- Schema `shift-evidence.proxmox-target.v1`.
- Proxmox target readiness engine.
- Parser registry integration before metadata fallback.
- User UI download/upload/status integration.
- Admin summary metrics for Proxmox target evidence.
- Synthetic fixtures for healthy, partial, constrained and unsafe payloads.
- Unit tests for collector static safety, parser behavior, readiness states and module status updates.

## Collector

Location:

```text
public/collectors/proxmox/shift-proxmox-target-collector.sh
```

Language:

```text
Bash with python3 JSON assembly
```

Basic execution:

```bash
chmod +x ./shift-proxmox-target-collector.sh
./shift-proxmox-target-collector.sh --output ./shift-proxmox-target-output.json
```

Optional flags:

```bash
--output <file>
--output-dir <dir>
--skip-ceph
--skip-ha
--skip-network
--include-raw false
--pretty
--help
```

## Data Collected

- Cluster status and Proxmox version.
- Nodes and node status.
- CPU, memory and uptime signals where available.
- Storage definitions.
- Per-node storage capacity and usage.
- Bridges and VLAN awareness signals.
- HA resources, groups and current status.
- Existing VM/CT resource load.
- Ceph status if available.
- PBS and backup-capable storage signals.
- Collector warnings/errors for partial output.

## What The Collector Does Not Do

- Does not modify infrastructure.
- Does not create or delete VMs or containers.
- Does not change storage, bridges, HA, Ceph, ZFS or PBS.
- Does not install packages.
- Does not restart services.
- Does not persist credentials.
- Does not upload data externally.
- Does not hide output from the customer.

## Output

The collector emits one local JSON file with:

```json
{
  "schema": "shift-evidence.proxmox-target.v1",
  "collector": {
    "name": "shift-proxmox-target-collector",
    "displayName": "Shift Evidence Proxmox Target Collector",
    "version": "0.1.0",
    "owner": "Shift Evidence",
    "mode": "read-only"
  },
  "safety": {
    "persistentCredentialsStored": false,
    "configurationChanged": false,
    "rawSecretsIncluded": false,
    "networkUploadPerformed": false,
    "packagesInstalled": false,
    "servicesRestarted": false
  }
}
```

## Parser

Parser key:

```text
proxmox-target-parser-v1
```

Schema:

```text
shift-evidence.proxmox-target.v1
```

Validations:

- JSON must parse.
- Schema must match.
- Collector name must be the Shift Evidence collector.
- Collector mode must be `read-only`.
- Safety flags must remain false.
- Entities object must exist.
- Expected array entities must be arrays when present.
- Collector warnings/errors are preserved as parser warnings.
- Secret-like content fails parsing without storing the raw value.

Secret patterns include obvious password, token, API key, bearer, Proxmox API token, ticket and connection-string markers.

## Readiness Engine

File:

```text
src/server/evidence/engines/proxmoxTargetReadinessEngine.ts
```

Target states:

- `target_validated`
- `target_partially_ready`
- `target_insufficient`
- `target_not_validated`
- `target_requires_remediation`

Initial rules:

- Parser failure, missing nodes or missing storage produce `target_not_validated`.
- Offline/no online nodes, no usable storage, no bridges or critical storage pressure produce `target_insufficient`.
- Elevated storage usage, unhealthy Ceph or partial cluster health produce `target_requires_remediation`.
- Valid nodes/storage/network with missing HA/PBS/sizing context prefers `target_partially_ready`.
- `target_validated` requires strong evidence: online nodes, storage, network, HA, PBS, low warnings and available sizing context.

The engine intentionally avoids overclaiming readiness. It treats sizing comparison as preliminary and does not make a final Migration Recommendation Plan decision in this hito.

## User UI

The Evidence Expansion Center now shows Proxmox Target Validation with:

- Collector download.
- Collector instructions.
- Read-only safety copy.
- JSON upload.
- Parser status.
- Target status and confidence.
- Node and online node counts.
- Storage usage.
- HA/PBS/Ceph signals.
- Top recommendations.
- Parser warnings and errors.

## Admin Visibility

Admin advanced evidence view includes:

- Module status.
- Last upload.
- Parser key/version.
- Warning/error counts.
- Proxmox target status.
- Confidence.
- Node and online node counts.
- Storage count and usage percent.
- HA configured.
- PBS detected.
- Ceph detected and Ceph health.

No admin review action was added in this hito.

## Fixtures

Synthetic fixtures:

- `proxmox-target-single-node-basic.json`
- `proxmox-target-three-node-healthy.json`
- `proxmox-target-storage-constrained.json`
- `proxmox-target-no-pbs.json`
- `proxmox-target-ha-disabled.json`
- `proxmox-target-ceph-healthy.json`
- `proxmox-target-ceph-unhealthy.json`
- `proxmox-target-network-limited.json`
- `proxmox-target-missing-schema.json`
- `proxmox-target-malformed.json`
- `proxmox-target-secret-leak-attempt.json`
- `proxmox-target-no-rvtools-yet.json`

All fixtures are synthetic.

## Tests

Added:

- `tests/unit/proxmoxTargetCollector.test.ts`
- `tests/unit/proxmoxTargetParser.test.ts`
- `tests/unit/proxmoxTargetReadinessEngine.test.ts`

Updated:

- `tests/unit/evidenceExpansionService.test.ts`

Coverage includes:

- Static collector safety.
- Parser success/warning/failure states.
- Secret-like payload blocking without value exposure.
- Registry resolution.
- Service status update to `parsed_with_warnings`.
- Readiness states.
- No hard PBS blocker.
- No Ceph overclaiming.
- No RVTools inventory graceful handling.

## Limitations

- Collector has not been executed against a real Proxmox VE cluster in this hito.
- Proxmox endpoint availability may vary by version, permission and cluster topology.
- Ceph and PBS detection is signal-based, not a full backup/storage audit.
- Sizing comparison against RVTools is preliminary.
- Secret scanning is basic and pattern-based.
- This does not implement the full Migration Recommendation Plan.
- This does not implement Veeam/Backup Evidence.

## Security

- Collector ownership is declared as Shift Evidence.
- Collector is read-only.
- Output can be reviewed before upload.
- Parser does not include raw secret-like values in summaries.
- No Hostinger config was touched.
- No DB schema was changed.
- No billing, landing or PDF redesign was touched.

## Next Hito

Recommended next hito:

```text
EVIDENCE-4 - Backup Evidence Analysis + Veeam Collector + Backup Readiness Gates
```
