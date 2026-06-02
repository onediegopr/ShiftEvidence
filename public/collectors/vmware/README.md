# Shift Evidence VMware Enrichment Collector

This folder contains the proprietary Shift Evidence VMware Enrichment Collector.

## Purpose

The collector gathers read-only VMware vCenter metadata that can improve a Shift Evidence migration readiness assessment beyond the base RVTools inventory.

## Safety

The collector:

- reads vCenter inventory metadata only;
- does not modify infrastructure;
- does not create resources;
- does not change VM, host, datastore, tag, network or cluster configuration;
- does not create or delete snapshots;
- does not persist credentials;
- does not upload data to Shift Evidence or any external endpoint;
- writes a local JSON file that you can inspect before upload.

## Requirements

- Windows PowerShell or PowerShell 7.
- VMware PowerCLI installed.
- A vCenter account with read-only inventory permissions.
- Optional permission to read tags, snapshots and DRS rules for richer output.

## Example

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
- `-OutputDirectory ".\out"`

## Output

The main output is JSON with schema:

```text
shift-evidence.vmware-enrichment.v1
```

Upload that JSON to the VMware Enrichment module in the Evidence Expansion Center.

## Review Before Upload

Review the JSON locally before uploading. If your environment or custom attributes include sensitive values, remove them before upload. Shift Evidence also performs basic secret-like pattern detection during parsing.
