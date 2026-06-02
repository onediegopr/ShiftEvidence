# Shift Evidence Proxmox Target Collector

`shift-proxmox-target-collector.sh` is proprietary Shift Evidence tooling for optional Proxmox Target Validation evidence.

## Version and Integrity

- Version: `0.1.0`.
- Mode: read-only.
- Output schema: `shift-evidence.proxmox-target.v1`.
- Manifest: `/evidence-artifacts/manifest.json`.
- Checksum file: `/collectors/proxmox/shift-proxmox-target-collector.sh.sha256`.

## Safety

- Read-only collection only.
- Uses local Proxmox read endpoints through `pvesh get`.
- Does not create, modify or delete VMs, containers, storage, bridges, HA resources, Ceph, ZFS or PBS.
- Does not install packages.
- Does not restart services.
- Does not upload data to Shift Evidence or any external service.
- Does not persist credentials.
- Writes one local JSON file that the customer can review before upload.

## Requirements

- Run from a Proxmox VE node or a controlled environment where `pvesh` can read the local cluster.
- `bash`
- `python3` for safe JSON assembly.
- A user/session with enough read permissions for cluster, node, storage, network and HA endpoints.

## Basic Usage

```bash
chmod +x ./shift-proxmox-target-collector.sh
./shift-proxmox-target-collector.sh --output ./shift-proxmox-target-output.json
```

Then review `shift-proxmox-target-output.json` locally and upload it to the Proxmox Target Validation module in Shift Evidence.

## Optional Flags

```bash
./shift-proxmox-target-collector.sh --output-dir ./out --skip-ceph --pretty
./shift-proxmox-target-collector.sh --skip-ha
./shift-proxmox-target-collector.sh --skip-network
```

`--include-raw false` is the safe default. This version does not embed raw command streams beyond normalized endpoint payloads.

## Output Schema

The collector emits:

```json
{
  "schema": "shift-evidence.proxmox-target.v1",
  "collector": {
    "name": "shift-proxmox-target-collector",
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

## Collected Signals

- Cluster status and version.
- Nodes and node status.
- Storage definitions and per-node storage visibility.
- Bridges/networks.
- HA resources, groups and status when available.
- VM/CT inventory load from cluster resources.
- Ceph signals when available.
- PBS and backup-capable storage signals.
- Warnings/errors for unavailable endpoints or partial output.

## Troubleshooting

- If `pvesh` is missing, run the collector on a Proxmox VE node.
- If an endpoint fails, the collector continues and records a warning.
- If Ceph/PBS/HA is not present, the collector records an informational warning rather than failing.
- If permissions are insufficient, use a read-only operational account with access to the required Proxmox endpoints.
