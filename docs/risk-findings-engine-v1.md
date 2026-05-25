# Risk Findings Engine v1

## Categories
- `vm`
- `host`
- `datastore`
- `snapshot`
- `evidence`
- `storage`
- `cost`
- `readiness`

## Severities
- `info`
- `low`
- `medium`
- `high`
- `critical`

## Sources
- `parser`
- `manual_input`
- `cost_risk`
- `system`

## Rules
- Very large VM: high above 2048 GB, medium above 512 GB.
- Powered off VM: low.
- VMware Tools unknown or outdated: medium.
- Missing guest OS: low.
- Missing host or datastore placement: medium.
- Datastore usage above 80%: medium.
- Datastore usage above 90%: high.
- Snapshot older than 7 days: medium.
- Snapshot older than 30 days: high.
- Large snapshot above 100 GB: high.
- Missing cost assumptions: medium.
- Storage footprint high without Storage Destination Readiness: medium.
- Manual vs parsed mismatch above 20%: medium.

## Regeneration strategy
- Generated findings are removed and recreated for the assessment.
- Manual future findings should be separated by source so they are not deleted accidentally.

## Limitations
- This is a preliminary signal engine.
- It does not produce a final migration plan.
- It does not perform dependency mapping or wave planning.
- It does not replace engineering validation.
