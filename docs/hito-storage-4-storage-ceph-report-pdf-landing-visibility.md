# HITO STORAGE-4 - Storage/Ceph Report, PDF & Landing Visibility

## Objective

Make Storage Destination Readiness and Ceph Suitability & Operations Readiness visible in the customer-facing report preview, professional PDF and marketing pages without changing storage engines, RVTools parsing, Licensing & Cost logic, schema, migrations or production deployment.

## Scope Applied

- Added a safe report normalizer for Storage Destination Readiness and Ceph readiness.
- Added `storageDestinationReadiness` to the report preview payload.
- Added a compact Storage Destination Readiness block to the assessment report preview.
- Added a PDF section for Storage Destination Readiness.
- Added a PDF subsection for Ceph Suitability & Operations Readiness when Ceph is requested or evaluated.
- Added coverage limitations for storage evidence confidence, stale/failed storage analysis and Ceph missing evidence.
- Updated landing visibility for Storage & Ceph Readiness.
- Updated landing visibility for Licensing & Cost Exposure with vendor-quote disclaimers.
- Updated ShiftReadiness page copy for Ceph conditionality and storage plan messaging.
- Added tests for the normalizer, PDF smoke and landing copy.

## Report Normalizer

Created:

- `src/server/reports/reportStorageDestinationReadinessSection.ts`

The normalizer consumes persisted data from:

- `AssessmentStorageDestinationReadiness`
- `AssessmentStorageContext`
- `AssessmentStorageAnalysis`
- `AssessmentStorageEvidence`
- parsed datastore metadata already present in the assessment detail include

It returns a bounded report-safe payload:

- status
- current storage type
- target storage preference
- storage readiness score
- storage evidence confidence
- storage destination readiness
- storage migration risk
- interpreted storage summary
- source storage summary
- destination options
- storage constraints
- missing storage evidence
- contradictions/items to validate
- next storage questions
- Ceph status, scores, findings, remediations and missing evidence
- additional storage evidence metadata
- assumptions and disclaimers

## Safety Rules

- Raw storage free text is not included.
- Storage file contents are not included.
- Private storage paths are not included.
- Ceph is not presented as a default recommendation.
- Ceph output is consumed from persisted deterministic evaluation only.
- The PDF does not recalculate Ceph.
- The report does not promise installation, benchmarking, performance, capacity or zero downtime.

## Report Preview

Added:

- `storageDestinationReadiness` payload in `ReportPreviewData`.
- Storage/Ceph evidence received signals.
- Storage-specific coverage limitations.
- Storage Destination Readiness UI block in the report preview page.

Fallbacks:

- Not included.
- Submitted but not analyzed.
- Stale/failed/AI disabled/budget/plan restricted.
- Ceph requested but not evaluated.
- Ceph not enough evidence.
- Ceph not selected.

## PDF

Added section:

- `Storage Destination Readiness`

Includes:

- storage status and scores
- target preference
- source storage summary
- destination storage options
- storage constraints
- missing storage evidence
- contradictions/items to validate
- Ceph Suitability & Operations Readiness when applicable
- Ceph scores
- Ceph findings
- Ceph remediations
- Ceph missing evidence
- storage assumptions and disclaimers

Required disclaimers included:

- Ceph is not recommended by default.
- Ceph suitability depends on hardware, network, failure domains, backup and operational readiness.
- The report does not install, validate or benchmark a live Ceph cluster.
- Customer-provided storage context is advisory until validated with technical evidence.
- The original free-text storage narrative is not reproduced.

## Landing / Marketing Visibility

Updated public messaging for:

- Storage & Ceph Readiness
- Licensing & Cost Exposure

The public copy now emphasizes:

- evidence-based storage target evaluation
- ZFS local, existing NFS/SAN and Ceph as evaluated options
- Ceph is never a default recommendation
- approved pricing snapshots for licensing exposure
- not a vendor quote

## Plan Copy

Updated ShiftReadiness plan/add-on messaging:

- Storage Destination Readiness remains optional.
- Ceph Suitability & Operations Readiness appears when relevant.
- Missing storage evidence is part of the value.
- Ceph as a default recommendation is explicitly excluded.

## Exclusions Respected

- No schema changes.
- No migrations.
- No RVTools parser changes.
- No Licensing & Cost engine changes.
- No Client Context logic changes.
- No Ceph engine recalculation in PDF.
- No collector.
- No storage cost/TCO model.
- No deploy.
- No production migration.
- No full public launch declaration.

## Tests

Added/updated:

- `tests/unit/reportStorageDestinationReadinessSection.test.ts`
- `tests/unit/reportPdfRenderer.test.ts`
- `tests/unit/landingStorageVisibility.test.ts`

Covered:

- no storage fallback
- persisted storage/ceph output normalization
- not enough evidence Ceph output
- malformed JSON fallback
- raw storage text exclusion
- file path/content exclusion
- PDF smoke with Storage/Ceph section
- landing Storage/Ceph and Licensing visibility

## Remaining Risks

- PDF layout should still be visually reviewed with real customer Storage/Ceph data.
- Ceph scoring may need tuning with real cluster evidence.
- STORAGE-1 migration remains pending for the next controlled production release.
- Future collector work is still required for live Proxmox/Ceph/PBS evidence.
- Storage cost/TCO remains future scope.

## Percentages

- Storage module before STORAGE-4: 80-90%.
- Storage module after STORAGE-4: about 95%.
- Report/PDF readiness impact: +2-3 points.
- Landing/demo visibility impact: +2-3 points.
- ShiftReadiness total remains approximately 99.8-99.9%, with improved perceived value and communicability.

## Recommended Next Step

Push controlled commit after validation, then update master documentation or prepare a future controlled release plan for applying pending Storage migrations in the target environment.
