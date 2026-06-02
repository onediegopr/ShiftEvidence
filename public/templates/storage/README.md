# Shift Evidence Storage/SAN Evidence Template

These are proprietary Shift Evidence vendor-neutral templates for optional Storage / SAN Evidence.

## Safety

- Do not include storage credentials.
- Do not include API tokens.
- Do not include passwords.
- Do not include raw configuration secrets.
- Do not include connection strings.
- No vendor API key is required.
- No SAN/NAS credential is required.
- Review the file locally before uploading it to Shift Evidence.

## Supported Formats

- `shift-storage-san-template.csv`
- `shift-storage-san-template.json`

XLSX vendor-neutral templates can be added later if needed, but CSV and JSON are the supported formats for this hito.

## CSV Format

The CSV uses one row per evidence record and a required `recordType` column.

Supported `recordType` values:

- `array`
- `pool`
- `volume`
- `lun`
- `datastore_mapping`
- `performance_sample`
- `replication`
- `snapshot_policy`
- `target_storage_candidate`

Expected columns:

```text
recordType,sourceSystem,vendor,model,arrayName,poolName,volumeName,lunName,datastoreName,protocol,totalGb,usedGb,freeGb,usagePercent,thinProvisioned,replicated,snapshotEnabled,iopsRead,iopsWrite,latencyMs,throughputMBps,sampleWindow,notes,criticality
```

## Required Minimum

For a useful first pass, provide at least:

- One `array` or `pool` row.
- Capacity values for pools or volumes.
- `datastore_mapping` rows if you want matching against RVTools datastores.
- `performance_sample` rows only when you have a real sample window.

## Optional Evidence

- Replication status.
- Snapshot policy status.
- Target storage candidates for planned Proxmox storage.
- Performance samples with `sampleWindow`.
- Criticality labels.

## Manual Export Guidance

You can export information manually from vendor consoles, storage reports, SAN/NAS inventory files or architecture spreadsheets. Normalize the values into the Shift Evidence CSV/JSON format before upload.

Vendor-specific API collectors for NetApp, Dell PowerStore, Pure, HPE, Synology/QNAP and others are intentionally out of scope for this hito.

## Important

This module is optional. Missing Storage/SAN evidence does not block the base RVTools-first assessment, but it limits confidence for storage capacity, performance, replication and target-storage claims.
