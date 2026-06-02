# HITO EVIDENCE-1 - Common Evidence Framework

Date: 2026-06-01
Status: implemented locally
Scope: common optional evidence framework, parser registry, Evidence Expansion Center, admin visibility
Production impact: none until migration/deploy are applied

## Summary

EVIDENCE-1 adds the shared foundation for future optional evidence modules without replacing the RVTools-first assessment flow.

Implemented:

- Optional evidence module registry.
- Common module states.
- Additive Prisma persistence for module state, uploads and parse results.
- Parser registry with safe metadata-only placeholder parser.
- User-facing Evidence Expansion Center inside assessment detail.
- Admin visibility for advanced evidence module state.
- Completion/confidence integration point.
- Audit events for module initialization, uploads, parse lifecycle and skips.
- Unit tests for registry, parser registry and DB-service behavior.

Not implemented in this hito:

- VMware collector.
- Proxmox collector.
- Veeam collector.
- SAN/storage collector.
- Dependency collector.
- Domain-specific parsers.
- Migration Recommendation Plan.
- PDF print-friendly redesign.
- Landing/pricing/support/sample copy changes.

## New Prisma Entities

### `AssessmentEvidenceModule`

One row per assessment and optional evidence module.

Tracks:

- module key
- status
- source type
- confidence level
- completion percent
- last upload
- last parse result
- skipped/reviewed metadata

### `EvidenceUpload`

One row per optional evidence artifact associated with a module.

Tracks:

- assessment
- backing `EvidenceFile`
- module key
- upload kind
- original filename
- optional schema/collector metadata
- uploading user

### `EvidenceParseResult`

Generic parser output record.

Tracks:

- parser key/version
- parse status
- summary JSON
- warnings JSON
- errors JSON
- normalized entities JSON
- start/finish timestamps

## New Enums

- `EvidenceModuleKey`
- `EvidenceModuleStatus`
- `EvidenceModuleSourceType`
- `EvidenceModuleConfidenceLevel`
- `EvidenceUploadKind`
- `EvidenceParseResultStatus`

## Module Registry

Registry file:

```text
src/server/evidence/evidenceModuleRegistry.ts
```

Initial modules:

- `vmware_enrichment`
- `proxmox_target`
- `backup_evidence`
- `storage_san`
- `application_dependency`
- `migration_plan_readiness`

Each module defines:

- display name
- description
- purpose
- accepted input types
- confidence impact
- report impact
- visibility flags
- prepared/coming-next copy

## Parser Registry

Registry file:

```text
src/server/evidence/evidenceParserRegistry.ts
```

Implemented behavior:

- register parser
- list parsers
- resolve parser by module/input type
- return safe unsupported result
- convert thrown parser exceptions into failed parse results

Parsers after EVIDENCE-2:

- `vmware-enrichment-parser-v1`
- `evidence-metadata-only-v1`

The metadata-only parser intentionally records upload metadata and warning state only. It does not claim domain-specific Proxmox, Veeam, storage or dependency analysis.

## Evidence Expansion Service

Service file:

```text
src/server/evidence/evidenceExpansionService.ts
```

Main functions:

- `initializeEvidenceModulesForAssessment`
- `getEvidenceExpansionSummary`
- `associateEvidenceFileWithModule`
- `parseEvidenceUpload`
- `markEvidenceModuleSkipped`
- `getEvidenceCompletenessSummaryFromModuleRecords`

## User UI

Component:

```text
src/components/assessments/EvidenceExpansionCenter.tsx
```

Location:

- Assessment detail page
- `Evidence` tab
- Below the existing RVTools upload/history section

The UI shows:

- module name
- status
- completion
- confidence impact
- report impact
- latest upload
- parser warnings/errors
- upload evidence CTA
- template soon placeholder
- collector coming soon label
- mark as skipped CTA

Important UX rule:

- RVTools upload remains primary.
- Optional evidence does not block base report generation.

## Admin Visibility

Location:

```text
src/app/dashboard/admin/page.tsx
```

Admin console additions:

- advanced evidence summary column in recent assessments
- detailed advanced evidence table under evaluations

Admin can see:

- module key
- status
- confidence
- completion percent
- last upload
- parse status
- parser key/version
- warning count
- error count
- review indicator

Admin cannot yet:

- manually review a module
- reparse from admin
- override parser results

Those workflows are intentionally left for later hitos.

## Completion / Confidence Integration

The completion service now includes an optional `advanced_evidence` module.

Design decision:

- Weight is `0` in this hito to avoid moving established base assessment percentages.
- Missing advanced evidence appears as a recommendation/confidence limiter.
- It does not block report generation.
- Future hitos can add weighted contributions after domain-specific parsers exist.

## Feature Flag

Flag:

```text
EVIDENCE_EXPANSION_ENABLED
```

Behavior:

- Missing/empty flag means enabled.
- `true`, `1`, `yes`, `on` enable it.
- Other values disable the visual Evidence Expansion Center.

Backend model remains additive and safe even if the UI is disabled.

## Security

Implemented safeguards:

- Uses existing private evidence storage.
- Uses existing upload ownership checks.
- Uses existing rate limits.
- Uses existing size limits.
- Adds `.json` only for optional non-RVTools evidence categories.
- Does not log raw file content.
- Does not print secrets.
- Does not store credentials.
- Parser result stores summaries/warnings/errors, not raw files.
- Metadata-only parser avoids false technical claims.

Future safeguards needed:

- JSON schema validation per collector output.
- Domain-specific row-count limits.
- Collector checksum/signature display.
- Optional content scanning for secret-like strings.
- Admin review workflow for suspicious uploads.

## Audit Events

Added event names:

- `evidence_module_initialized`
- `evidence_uploaded`
- `evidence_parse_started`
- `evidence_parse_completed`
- `evidence_parse_failed`
- `evidence_module_skipped`

Not yet implemented:

- `module_reviewed`

Reason:

- No admin review action exists yet in EVIDENCE-1.

## Rollback

DB rollback:

- Migration is additive.
- Logical rollback is to stop using the new tables.
- Technical rollback before production deployment is reverting the migration/code.

UI rollback:

- Set `EVIDENCE_EXPANSION_ENABLED=false`.
- Existing RVTools flow remains available.

Parser rollback:

- Registry returns unsupported/failed safely.
- RVTools parser remains separate.

Report rollback:

- Advanced evidence completion is optional and non-blocking.

## Files Added Or Modified

Added:

- `src/server/evidence/evidenceModuleRegistry.ts`
- `src/server/evidence/evidenceParserRegistry.ts`
- `src/server/evidence/evidenceExpansionService.ts`
- `src/components/assessments/EvidenceExpansionCenter.tsx`
- `tests/unit/evidenceModuleRegistry.test.ts`
- `tests/unit/evidenceParserRegistry.test.ts`
- `tests/unit/evidenceExpansionService.test.ts`
- `docs/evidence-1-common-evidence-framework.md`
- `prisma/migrations/20260601193000_evidence_1_common_framework/migration.sql`

Modified:

- `prisma/schema.prisma`
- `src/server/evidence/uploadValidation.ts`
- `src/server/assessments/assessmentService.ts`
- `src/server/assessments/assessmentCompletionService.ts`
- `src/components/assessments/assessmentCompletionPresentation.ts`
- `src/server/reports/reportCoverageSection.ts`
- `src/app/dashboard/assessments/[id]/evidence/actions.ts`
- `src/app/dashboard/assessments/[id]/page.tsx`
- `src/server/admin/adminConsoleService.ts`
- `src/app/dashboard/admin/page.tsx`

## Validation Checklist

Required:

- `npx prisma validate`
- `npx prisma generate`
- `npm run typecheck`
- `npm run lint`
- `npm run test:run`
- `npm run build`

Specific tests:

- `tests/unit/evidenceModuleRegistry.test.ts`
- `tests/unit/evidenceParserRegistry.test.ts`
- `tests/unit/evidenceExpansionService.test.ts`

## Next Recommended Hito

EVIDENCE-2 - VMware Enrichment Collector + Parser + Fixtures.

Recommended scope:

- Proprietary read-only PowerCLI collector.
- Collector output schema.
- VMware enrichment parser.
- VM matching against RVTools.
- Synthetic fixtures.
- Evidence Expansion Center module-specific copy and warnings.
- Admin review detail for VMware enrichment parser output.
