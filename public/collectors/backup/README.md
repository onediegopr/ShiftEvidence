# Shift Evidence Veeam Backup Evidence Collector

`shift-veeam-backup-collector.ps1` is proprietary Shift Evidence tooling for optional Backup Evidence analysis.

## Safety

- Read-only collection only.
- Does not start or stop jobs.
- Does not create, modify or delete jobs.
- Does not delete restore points.
- Does not perform restores or instant recovery.
- Does not modify repositories, proxies, credentials or Veeam configuration.
- Does not install modules or restart services.
- Does not upload data to Shift Evidence or any external service.
- Writes one local JSON file that the customer can review before upload.

## Requirements

- Run on a Windows server or admin workstation with Veeam Backup & Replication PowerShell available.
- PowerShell 5.1+.
- Read permissions sufficient to list jobs, sessions, repositories and restore points.

## Basic Usage

```powershell
.\shift-veeam-backup-collector.ps1 -OutputPath ".\shift-veeam-backup-output.json"
```

Then review `shift-veeam-backup-output.json` locally and upload it to the Backup Evidence module in Shift Evidence.

## Optional Flags

```powershell
.\shift-veeam-backup-collector.ps1 -OutputDirectory ".\out" -NoPrompt
.\shift-veeam-backup-collector.ps1 -SkipRestorePoints
.\shift-veeam-backup-collector.ps1 -SkipRepositories
.\shift-veeam-backup-collector.ps1 -SkipBackupCopy
.\shift-veeam-backup-collector.ps1 -MaxRestorePointsPerObject 20
.\shift-veeam-backup-collector.ps1 -IncludeCsvSummary
```

## Output Schema

The collector emits:

```json
{
  "schema": "shift-evidence.backup-evidence.v1",
  "collector": {
    "name": "shift-veeam-backup-collector",
    "mode": "read-only"
  },
  "safety": {
    "persistentCredentialsStored": false,
    "configurationChanged": false,
    "rawSecretsIncluded": false,
    "networkUploadPerformed": false,
    "jobsStarted": false,
    "jobsStopped": false,
    "restorePerformed": false,
    "restorePointsDeleted": false
  }
}
```

## Collected Signals

- Jobs and last result/state.
- Backup sessions.
- Protected objects where job object enumeration is available.
- Restore points, limited for safety in large environments.
- Repositories with sanitized path-like values.
- Backup copy job signals.
- Warnings/errors for unavailable commands or partial output.

## Troubleshooting

- If the Veeam PowerShell module is unavailable, run on a Veeam Backup & Replication server or install/admin workstation that already has the module.
- If restore point queries are heavy, rerun with `-SkipRestorePoints`.
- If repository data is restricted, the collector continues and records warnings.
- Missing Backup Evidence never blocks the base RVTools-first assessment, but it limits claims about migration safety.
