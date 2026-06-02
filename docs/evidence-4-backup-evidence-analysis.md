# EVIDENCE-4 - Backup Evidence Analysis and Veeam Collector

Date: 2026-06-02
Status: implemented locally in product code, validated with synthetic fixtures
Production impact: none
Deployment: not deployed by this hito
DB migration: no

## Objective

EVIDENCE-4 adds the Shift Evidence Backup Evidence module. The module lets a customer download a proprietary read-only Veeam Backup & Replication PowerShell collector, run it locally in their Veeam environment, review the generated JSON output and upload it to the optional Backup Evidence card in the Evidence Expansion Center.

Backup Evidence is optional for the base RVTools-first assessment. Missing backup evidence does not block report generation, but it is a critical limitation for any advanced Migration Recommendation Plan.

## Implemented

- Proprietary Shift Evidence Veeam Backup Evidence Collector.
- Collector README and customer execution instructions.
- Domain parser `backup-evidence-parser-v1`.
- Schema `shift-evidence.backup-evidence.v1`.
- Backup readiness engine.
- Parser registry integration before metadata fallback.
- User UI download/upload/status integration.
- Admin summary metrics for Backup Evidence.
- Synthetic fixtures for healthy, partial, failed, stale, pressure and unsafe payloads.
- Unit tests for collector static safety, parser behavior, readiness states and module status updates.

## Collector

Location:

```text
public/collectors/backup/shift-veeam-backup-collector.ps1
```

Language:

```text
PowerShell
```

Basic execution:

```powershell
.\shift-veeam-backup-collector.ps1 -OutputPath ".\shift-veeam-backup-output.json"
```

Optional flags:

```powershell
-SkipRestorePoints
-SkipRepositories
-SkipBackupCopy
-MaxRestorePointsPerObject 20
-IncludeCsvSummary
-NoPrompt
-OutputDirectory ".\out"
```

## Data Collected

- Veeam jobs and last result/state.
- Backup sessions.
- Protected objects where job object enumeration is available.
- Restore points, limited for safety in large environments.
- Repositories with sanitized path-like values.
- Backup copy job signals.
- Collector warnings/errors for unavailable cmdlets or partial output.

## What The Collector Does Not Do

- Does not start jobs.
- Does not stop jobs.
- Does not create, modify or delete jobs.
- Does not delete restore points.
- Does not perform restores or instant recovery.
- Does not change repositories, credentials or Veeam configuration.
- Does not install modules.
- Does not restart services.
- Does not upload data externally.
- Does not persist credentials.

## Output

The collector emits one local JSON file with:

```json
{
  "schema": "shift-evidence.backup-evidence.v1",
  "collector": {
    "name": "shift-veeam-backup-collector",
    "displayName": "Shift Evidence Veeam Backup Evidence Collector",
    "version": "0.1.0",
    "owner": "Shift Evidence",
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

## Parser

Parser key:

```text
backup-evidence-parser-v1
```

Schema:

```text
shift-evidence.backup-evidence.v1
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

Secret patterns include password, token, API key, bearer, VBR credentials, private key, connection strings and obvious UNC credential patterns.

## Matching

Protected backup objects are matched against parsed RVTools inventory using:

1. `instanceUuid`
2. `biosUuid`
3. normalized VM name
4. unmatched fallback

If RVTools inventory is unavailable, the parser still succeeds with warning:

```text
Backup evidence uploaded before RVTools inventory; protected/unprotected VM matching is limited.
```

## Backup Readiness Engine

File:

```text
src/server/evidence/engines/backupReadinessEngine.ts
```

Backup states:

- `backup_validated`
- `backup_partially_ready`
- `backup_requires_remediation`
- `backup_insufficient`
- `backup_not_validated`

Initial rules:

- Parser failure or missing jobs/protected objects produce `backup_not_validated`.
- No protected objects, no restore points or majority unprotected RVTools VMs produce `backup_insufficient`.
- Unprotected VMs, stale backups, failed jobs, repository pressure or missing restore points produce `backup_requires_remediation`.
- Coverage with missing restore-testing proof prefers `backup_partially_ready`.
- `backup_validated` requires strong coverage, restore points, no critical warnings, repository health and explicit restore-testing evidence.

The engine intentionally avoids claiming restore success. Backup presence does not prove restore success.

## User UI

The Evidence Expansion Center now shows Backup Evidence with:

- Collector download.
- Collector instructions.
- Read-only safety copy.
- JSON upload.
- Parser status.
- Backup readiness status and confidence.
- Job count.
- Protected object count.
- Matched VM count.
- Unprotected VM count.
- Stale backup count.
- Failed job count.
- Top recommendations.

## Admin Visibility

Admin advanced evidence view includes:

- Module status.
- Last upload.
- Parser key/version.
- Warning/error counts.
- Backup readiness status.
- Confidence.
- Job counts.
- Protected object count.
- Matched VM count.
- Unprotected VM count.
- Stale backup count.
- Failed/warning job count.
- Repository pressure count.
- Backup copy count.

No admin review action was added in this hito.

## Fixtures

Synthetic fixtures:

- `backup-evidence-healthy.json`
- `backup-evidence-partial-coverage.json`
- `backup-evidence-no-restore-points.json`
- `backup-evidence-stale-restore-points.json`
- `backup-evidence-failed-jobs.json`
- `backup-evidence-disabled-jobs.json`
- `backup-evidence-repository-pressure.json`
- `backup-evidence-with-backup-copy.json`
- `backup-evidence-unmatched-vms.json`
- `backup-evidence-missing-schema.json`
- `backup-evidence-malformed.json`
- `backup-evidence-secret-leak-attempt.json`
- `backup-evidence-no-rvtools-yet.json`

All fixtures are synthetic.

## Tests

Added:

- `tests/unit/backupEvidenceCollector.test.ts`
- `tests/unit/backupEvidenceParser.test.ts`
- `tests/unit/backupReadinessEngine.test.ts`

Updated:

- `tests/unit/evidenceExpansionService.test.ts`

Coverage includes:

- Static collector safety.
- Parser success/warning/failure states.
- Secret-like payload blocking without value exposure.
- Registry resolution.
- Service status update to `parsed_with_warnings`.
- Matching priority by UUID/name.
- No RVTools inventory graceful handling.
- Backup readiness states.
- No restore-success overclaiming.
- Unprotected VM, stale backup, failed job and repository pressure gates.

## Limitations

- Collector has not been executed against a real Veeam Backup & Replication server in this hito.
- Cmdlet availability varies by Veeam version and installed module.
- Restore point queries can be heavy in large environments; use `-SkipRestorePoints` when needed.
- Backup coverage depends on VM name/UUID matching quality.
- No restore testing evidence is collected yet.
- Secret scanning is basic and pattern-based.
- This does not implement the full Migration Recommendation Plan.

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
EVIDENCE-5 - Storage/SAN Evidence Enrichment + Vendor-Neutral Templates + Storage Readiness Signals
```
