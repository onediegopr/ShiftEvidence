# EVIDENCE-6 - Application Dependency Mapping

Date: 2026-06-02
Status: implemented locally in product code, validated with synthetic fixtures
Production impact: none
Deployment: not deployed by this hito
DB migration: no

## Executive Summary

EVIDENCE-6 adds the optional Application Dependency Mapping module for Shift Evidence. It lets customers provide reviewed application, owner, criticality, maintenance-window, dependency and migration-group evidence through Shift Evidence CSV or JSON templates.

The module is template/manual first. It does not perform network discovery, packet capture, endpoint scanning, CMDB API calls, ServiceNow integration, NetBox integration or agent-based discovery.

Application Dependency Mapping is optional for the base RVTools-first assessment. Missing dependency evidence does not block report generation, but it remains a critical limitation for future Migration Recommendation Plan work.

## Implemented

- Proprietary Shift Evidence CSV and JSON templates.
- Template README with safety and source guidance.
- Domain parser `application-dependency-parser-v1`.
- Schema `shift-evidence.application-dependencies.v1`.
- Application dependency readiness engine.
- RVTools VM matching by instance UUID, BIOS UUID and normalized VM name.
- VMware Enrichment hint support for tags/resource pools without converting hints into confirmed dependencies.
- Functional wave candidate and technical-only wave signals.
- User UI download/upload/status integration in the Evidence Expansion Center.
- Admin summary metrics for Application Dependencies.
- Synthetic fixtures for complete, partial, remediation, unsafe and no-RVTools cases.
- Unit tests for templates, parser, readiness engine and module status updates.

## Not Implemented

- No automatic dependency discovery.
- No network flow collector.
- No packet capture.
- No process or port scanner.
- No endpoint agent.
- No CMDB, IPAM, ServiceNow or NetBox API integration.
- No firewall log ingestion.
- No Migration Recommendation Plan generation.
- No PDF redesign.
- No billing, landing, Hostinger or deploy changes.
- No DB migration.

## Templates

Locations:

```text
public/templates/dependencies/shift-application-dependency-template.csv
public/templates/dependencies/shift-application-dependency-template.json
public/templates/dependencies/README.md
```

Supported formats:

- CSV
- JSON

XLSX is not implemented in this hito to avoid unnecessary complexity.

## CSV Fields

```text
recordType,applicationName,applicationId,componentName,vmName,vmInstanceUuid,vmBiosUuid,role,dependencyType,dependsOnVmName,dependsOnApplicationName,ownerName,ownerTeam,criticality,downtimeTolerance,maintenanceWindow,migrationGroup,waveCandidate,source,confidence,notes
```

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

## Parser

Parser key:

```text
application-dependency-parser-v1
```

Schema:

```text
shift-evidence.application-dependencies.v1
```

Supported input types:

- JSON
- CSV

Validations:

- JSON schema.
- CSV required columns.
- Supported record types.
- Recommended criticality values.
- Recommended downtime tolerance values.
- Recommended dependency types.
- Recommended confidence values.
- Recommended source values.
- Safety flags.
- Entities object.
- Expected entity arrays.
- Secret-like content.

If a minor vocabulary issue is found, the parser returns `parsed_with_warnings`. If the payload is structurally invalid or includes secret-like content, it returns `failed`.

## Secret Scanning

The parser rejects obvious secret-like content without storing raw secret values in summaries.

Patterns include:

- `password=`
- `passwd`
- `secret`
- `token`
- `api_key`
- `Authorization: Bearer`
- `BEGIN PRIVATE KEY`
- `connectionString`
- connection-string URLs
- URL-embedded credentials

Email addresses may appear in raw uploads, but summaries avoid needing full email values.

## Matching

Application Dependency VM evidence is matched to RVTools parsed VMs by:

1. `vmInstanceUuid`
2. `vmBiosUuid`
3. normalized `vmName`
4. unmatched fallback

If RVTools inventory is unavailable, the parser still succeeds with warning:

```text
Application Dependency evidence uploaded before RVTools inventory; VM matching is limited.
```

If VMware Enrichment exists, tags and resource pools are exposed as hints only. They do not become confirmed dependencies.

## Readiness Engine

File:

```text
src/server/evidence/engines/applicationDependencyReadinessEngine.ts
```

Readiness states:

- `dependency_validated`
- `dependency_partially_ready`
- `dependency_requires_remediation`
- `dependency_insufficient`
- `dependency_not_validated`

Wave planning modes:

- `technical_only`
- `functional_candidate`
- `functional_validated`

Initial rules:

- Parser failure or no dependency evidence produces `dependency_not_validated`.
- No application groups, critical workloads without owners, missing critical maintenance windows or majority unmapped RVTools VMs can produce `dependency_insufficient`.
- Circular dependencies, low-confidence dependencies, inferred dependencies, external dependencies without notes, inconsistent migration groups or unmatched VMs can produce `dependency_requires_remediation`.
- Useful but incomplete owner/dependency/window/migration-group evidence produces `dependency_partially_ready`.
- `dependency_validated` requires strong coverage, owners, maintenance windows, coherent dependencies, functional validated groups and non-customer-provided-only evidence.

Manual templates normally produce functional wave candidates, not validated functional waves.

## Technical Waves vs Functional Waves

The module separates:

- Technical-only waves: infrastructure grouping without enough dependency context.
- Functional wave candidates: application groups with customer-provided owner, dependency and maintenance-window evidence.
- Functional waves validated: only when evidence is strong and not merely manual/customer-reported.

This prevents overclaiming functional migration readiness from manual templates alone.

## User UI

The Evidence Expansion Center now shows Application Dependencies with:

- CSV template download.
- JSON template download.
- Template instructions link.
- Safety copy.
- Upload evidence action.
- Parser result.
- Dependency readiness status.
- Confidence.
- Wave planning mode.
- Application count.
- Dependency count.
- Critical app/VM counts.
- Missing owner count.
- Missing maintenance-window count.
- Migration group count.
- Functional wave candidate count.
- Technical-only wave count.
- Matched/unmatched VM counts.
- Top recommendations.

## Admin Visibility

Admin advanced evidence view includes:

- Module status.
- Last upload.
- Parser key/version.
- Warning/error counts.
- Dependency readiness status.
- Confidence.
- Wave planning mode.
- Application count.
- Dependency count.
- Critical application/VM counts.
- Owner counts and missing-owner signals.
- Maintenance-window counts and missing-window signals.
- Migration group count.
- Technical-only wave count.
- Functional wave candidate count.
- Matched/unmatched VM counts.
- Unmapped RVTools VM count.

No admin review action was added in this hito.

## Fixtures

Synthetic JSON fixtures:

- `application-dependencies-complete.json`
- `application-dependencies-partial.json`
- `application-dependencies-critical-no-owner.json`
- `application-dependencies-no-maintenance-window.json`
- `application-dependencies-circular.json`
- `application-dependencies-functional-wave-candidates.json`
- `application-dependencies-technical-only.json`
- `application-dependencies-unmatched-vms.json`
- `application-dependencies-missing-schema.json`
- `application-dependencies-malformed.json`
- `application-dependencies-secret-leak-attempt.json`
- `application-dependencies-no-rvtools-yet.json`

Synthetic CSV fixtures:

- `application-dependencies-complete.csv`
- `application-dependencies-partial.csv`
- `application-dependencies-invalid-columns.csv`

## Tests

Unit coverage:

- `tests/unit/applicationDependencyTemplate.test.ts`
- `tests/unit/applicationDependencyParser.test.ts`
- `tests/unit/applicationDependencyReadinessEngine.test.ts`
- `tests/unit/evidenceExpansionService.test.ts`

The full test suite also protects existing RVTools, VMware Enrichment, Proxmox Target, Backup Evidence and Storage/SAN behavior.

## Security Notes

- No credentials are required.
- No API keys are required.
- No external upload is performed by the template workflow.
- No network discovery is performed.
- No agent is installed.
- Parser summaries avoid storing raw secret-like values.
- Customer-provided evidence must be reviewed locally before upload.

## Rollback

Rollback is code-level only:

- Remove the Application Dependency parser registration.
- Remove template links from the Evidence Expansion Center.
- Leave uploaded evidence records untouched if any exist.

No DB rollback is needed because no migration was added.

## Launch Decision

Application Dependency Mapping is implemented as an optional evidence expansion module. It is suitable for controlled product use and synthetic fixture validation.

It does not declare public launch and does not deploy production changes.

## Next Recommended Hito

Recommended next hito:

```text
EVIDENCE-7 - Migration Recommendation Plan + Evidence Gates + Premium Report
```

EVIDENCE-7 should consume the evidence gates created across EVIDENCE-1 through EVIDENCE-6 and keep missing dependency mapping as a visible limitation rather than a hidden assumption.
