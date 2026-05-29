# HITO CONTEXT-3 - Customer Context Intelligence Report / PDF Integration

## Objective

Integrate persisted `AssessmentClientContextAnalysis` into the report preview payload and professional PDF output as `Customer Context Intelligence`.

The report consumes a safe normalized representation of the analysis. It does not read, render or print `AssessmentClientContext.rawText`.

## Scope Implemented

- Added a report normalizer for Customer Context Intelligence.
- Extended report preview payload with `customerContextIntelligence`.
- Added report preview UI summary for customer context analysis.
- Added PDF section `Customer Context Intelligence`.
- Added coverage limitations for business context confidence, stale analysis and validation items.
- Added PDF appendix assumptions and disclaimers.
- Added unit tests for the normalizer and PDF renderer smoke coverage.

## Report Data Contract

The report section is built from:

- `AssessmentClientContextAnalysis`
- safe metadata from `AssessmentAdditionalEvidence` / `EvidenceFile`

The section includes:

- interpreted summary;
- business priorities;
- migration constraints;
- critical workloads mentioned;
- customer-reported risks;
- AI-extracted insights;
- contradictions and validation items;
- report impact;
- next questions;
- context completeness score;
- business context confidence;
- safety flags;
- additional evidence metadata;
- assumptions and disclaimers.

## Raw Text Safety

The report normalizer intentionally does not accept or read `AssessmentClientContext.rawText`.

The PDF includes only `interpretedSummary` and structured arrays persisted in `AssessmentClientContextAnalysis`.

The original free-text narrative remains assessment context in the database, but is not reproduced in report preview or PDF output.

## PDF Section

Section name:

`Customer Context Intelligence`

The section explains that customer-provided context is advisory and must be validated against technical evidence before migration decisions.

For completed analysis, the PDF renders:

- status and context confidence cards;
- `Context Provided - Interpreted Summary`;
- business priorities;
- migration constraints;
- critical workloads;
- customer-reported risks;
- contradictions / items to validate;
- impact on assessment;
- next questions;
- additional evidence summary;
- context handling notes;
- disclaimers.

For no analysis, failed analysis, stale analysis, AI disabled, budget blocked or plan restricted states, the renderer uses safe fallbacks and does not block PDF generation.

## Report Type Behavior

- `PDF Preview`: renders a short teaser only when Customer Context Intelligence exists.
- `Readiness Report`: renders the full section with assumptions and disclaimers.
- `Readiness Report Pro`: renders the full section.
- `Blueprint/custom report`: renders the full section.

## Disclaimers

Mandatory disclaimers are included:

- Customer-provided context is advisory and may contain assumptions, incomplete details or unverified claims.
- The section does not replace confirmed technical evidence from RVTools, backup exports, Proxmox target validation or other structured sources.
- The original free-text narrative is not reproduced in the report.
- Additional evidence file contents are not printed; only metadata is summarized.

## Exclusions

This hito does not implement:

- AI re-analysis during report generation;
- raw text rendering;
- OCR;
- PDF/DOCX extraction;
- deep file parsing;
- RVTools parser changes;
- Licensing & Cost changes;
- production deployment;
- production migrations.

## Tests

Added tests for:

- null analysis fallback;
- completed analysis normalization;
- raw text exclusion;
- malformed JSON fallback;
- array truncation;
- stale/failed analysis fallback;
- additional evidence metadata without file contents;
- PDF renderer smoke with Customer Context Intelligence.

## Rollback Points

- Remove `src/server/reports/reportCustomerContextIntelligenceSection.ts`.
- Remove `customerContextIntelligence` from `ReportPreviewData`.
- Remove the preview UI block.
- Remove the PDF section call and appendix entries.
- Remove the new tests.

No schema or migration changes were introduced in CONTEXT-3.

## Remaining Work

- Authenticated QA with a DB-backed assessment when a QA/local database is available.
- Prompt tuning with real customer narratives.
- Plan limit tuning with commercial policy.
- Future safe extraction for PDF/DOCX/TXT additional evidence.
- Visual polish if real generated PDFs show layout issues.
