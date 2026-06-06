# Report Design System Audit

## Scope

Audit executed for `REPORTS-UX-1` inside the local repository only. No production infrastructure, billing, Vercel, Stripe, Wise, storage or secrets were modified.

## Current Report Architecture

The current report stack is a custom PDF pipeline built around `PDFKit`, deterministic section builders and storage/download services.

### Public sample / demo surfaces

- `src/app/sample-report/page.tsx`
  Public marketing page for the sample deliverable.
- `src/components/sample-report/SampleReportPage.tsx`
  Public sample-report experience and CTA layer.
- `public/sample-reports/proxmox-migration-readiness-sample-report.pdf`
  Static public sample PDF asset.
- `public/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf`
  Static premium sample PDF asset.
- `scripts/generate-public-sample-report.mjs`
  Generator for the static synthetic public sample assets.
- `src/app/demo/reports/[scenario]/route.ts`
  Public dynamic synthetic report route for demo scenarios.

### Private / authenticated report generation

- `src/app/api/assessments/[id]/reports/generate/route.ts`
  Authenticated report generation trigger.
- `src/app/api/assessments/[id]/reports/[reportId]/download/route.ts`
  Authenticated report download endpoint.
- `src/app/dashboard/assessments/[id]/report/page.tsx`
  Authenticated report preview surface.

### Core report data / rendering services

- `src/server/reports/reportPreviewService.ts`
  Main adapter that converts `AssessmentDetail` into `ReportPreviewData`.
- `src/server/reports/reportGenerationService.ts`
  Coordinates preview generation and PDF output.
- `src/server/reports/reportPdfRenderer.ts`
  Main multi-section readiness PDF renderer using `PDFKit`.
- `src/server/reports/migrationPlanService.ts`
  Standalone migration recommendation plan builder.
- `src/server/reports/migrationPlanPdfRenderer.ts`
  Standalone migration plan PDF renderer.
- `src/server/reports/reportStorageService.ts`
  Report persistence and download-safe storage path handling.

### Supporting report section builders

- `src/server/reports/reportCoverageSection.ts`
- `src/server/reports/reportLicensingCostExposureSection.ts`
- `src/server/reports/reportCustomerContextIntelligenceSection.ts`
- `src/server/reports/reportStorageDestinationReadinessSection.ts`
- `src/server/reports/reportSections.ts`
- `src/server/reports/reportTheme.ts`
- `src/server/reports/migrationPlanNarrativeService.ts`
- `src/server/reports/migrationRecommendationEngine.ts`

## Rendering Stack Findings

- Rendering stack in use: `PDFKit` custom drawing.
- No evidence of React PDF as the main report pipeline.
- No HTML-to-PDF as the main report pipeline.
- Static public sample PDFs exist and are generated from script output.
- Dynamic demo route also uses custom PDF generation.
- Brand logo embedding is handled through `src/server/brand/brandAssetService.ts`.

## Existing Test Coverage Found

- `tests/unit/reportPdfRenderer.test.ts`
- `tests/unit/reportCoverageSection.test.ts`
- `tests/unit/reportCustomerContextIntelligenceSection.test.ts`
- `tests/unit/reportLicensingCostExposureSection.test.ts`
- `tests/unit/reportStorageDestinationReadinessSection.test.ts`
- `tests/unit/premiumSampleReportContent.test.ts`
- `tests/unit/pdfBrandingAssets.test.ts`
- `tests/unit/migrationRecommendationPlan.test.ts`

## Current Visual / Narrative Limitations

1. Executive layer exists, but reads more like a technical export than a premium decision pack.
2. Readiness and confidence are present, but not consistently elevated as a dual-score decision model.
3. Conclusion-based section language is limited; some sections still lead with generic technical headings.
4. Missing evidence is represented, but not always framed as a decision-quality signal.
5. No central typed narrative model existed before this milestone, which made reuse across renderers harder.
6. Chart concepts were implicit in copy and tables, not formalized as reusable data transforms.
7. The standalone migration plan PDF was especially lightweight and narratively shallow.

## Safe Intervention Points

These areas were assessed as safe for `REPORTS-UX-1`:

- Add typed narrative adapters without replacing existing `ReportPreviewData`.
- Add reusable narrative copy helpers.
- Add reusable chart/data helpers without forcing risky PDF chart drawing in the same milestone.
- Improve executive-summary logic inside shared PDF renderers while keeping section order stable.
- Improve standalone migration plan PDF narrative using shared helpers.
- Add documentation and unit tests around the new abstractions.

## Risky Areas Left Conservative

These were intentionally treated as higher risk:

- Replacing the full public sample PDF generator blindly.
- Rewriting the entire `reportPdfRenderer.ts` layout system.
- Refactoring authenticated routes or storage/download flow.
- Changing commercial entitlements or section access logic.
- Introducing HTML rendering or a second PDF engine.
- Overwriting current public sample paths without versioning strategy.

## Rollback Plan

If `REPORTS-UX-1` introduced regressions, rollback is straightforward:

1. Revert new report-design-system helper files under `src/server/reports/`.
2. Revert targeted `reportPdfRenderer.ts` and `migrationPlanPdfRenderer.ts` edits.
3. Revert the new unit tests and docs.
4. Re-run `npm run typecheck`, `npm run lint` and targeted report tests.

Because this milestone does not alter storage schema, route contracts or public asset paths, rollback risk is low.
