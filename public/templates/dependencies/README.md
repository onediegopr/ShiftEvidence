# Shift Evidence Application Dependency Template

These are proprietary Shift Evidence templates for optional Application Dependency Mapping.

## Safety

- Do not include passwords.
- Do not include API tokens.
- Do not include secrets.
- Do not include credentials.
- Do not include CMDB, IPAM, ServiceNow or NetBox API keys.
- Do not include connection strings.
- Review the file locally before uploading it to Shift Evidence.
- This version does not perform network discovery, packet capture, endpoint scanning or agent-based discovery.

## Supported Formats

- `shift-application-dependency-template.csv`
- `shift-application-dependency-template.json`

XLSX can be added later if needed, but CSV and JSON are the supported formats for this hito.

## CSV Format

The CSV uses one row per evidence record and a required `recordType` column.

Supported `recordType` values:

- `application`
- `application_component`
- `vm_role`
- `dependency`
- `owner`
- `maintenance_window`
- `migration_group`
- `business_criticality`
- `constraint`

Expected columns:

```text
recordType,applicationName,applicationId,componentName,vmName,vmInstanceUuid,vmBiosUuid,role,dependencyType,dependsOnVmName,dependsOnApplicationName,ownerName,ownerTeam,criticality,downtimeTolerance,maintenanceWindow,migrationGroup,waveCandidate,source,confidence,notes
```

## Required Minimum

For a useful first pass, provide at least:

- One `application` row.
- `application_component` or `vm_role` rows that map applications to VMs.
- Owner information for critical applications.
- Maintenance windows for critical applications.
- Dependency rows when one workload depends on another.
- Migration groups only when they have been reviewed by the customer.

## Optional Evidence

- Business criticality.
- Downtime tolerance.
- RTO/RPO notes.
- Must-move-together constraints.
- External dependency notes.
- Owner teams and approval requirements.

## Source Guidance

You can populate this template from a CMDB, IPAM, NetBox, ServiceNow export, architecture spreadsheet, application inventory or manual workshop notes.

Automatic integrations with CMDB/IPAM/ServiceNow/NetBox are intentionally out of scope for this hito. Normalize the values into the Shift Evidence CSV/JSON format before upload.

## Technical Waves vs Functional Waves

This module helps distinguish:

- Technical-only waves: grouping based mainly on infrastructure or VM inventory.
- Functional wave candidates: application groups with customer-provided dependency, owner and maintenance-window evidence.
- Functional waves validated: only possible with strong customer-reviewed evidence and low warnings.

Manual templates should normally be treated as functional wave candidates, not automatic production-ready wave validation.

## Important

Application Dependency Mapping is optional. Missing dependency evidence does not block the base RVTools-first assessment, but it is a critical limitation for any future Migration Recommendation Plan.
