# Brand assets cleanup and favicon

Date: 2026-06-02

Scope:

- Public brand assets used by favicon and report/PDF surfaces.
- PDF/report generator branding.
- Static public sample PDF regeneration through reproducible scripts only.

Rules:

- Do not use incoming temporary files directly in production code.
- Do not use files named `ChatGPT Image...` as app/runtime assets.
- Do not use `Logo Favicon.png` as report/PDF logo because it includes a visible checkerboard-style background.
- Do not use favicon as an embedded PDF logo except for tiny browser/favicon slots.
- Use stable files under `public/brand/`.

Stable PDF-capable assets:

- `/brand/shift-evidence-icon-light-transparent.png`
- `/brand/shift-evidence-icon-dark-transparent.png`
- `/brand/shift-evidence-icon-outline-transparent.png`

## PDF/report branding

Reviewed generators and routes:

- `src/server/reports/reportPdfRenderer.ts`
- `src/server/reports/migrationPlanPdfRenderer.ts`
- `src/server/reports/reportGenerationService.ts`
- `src/server/reports/migrationPlanService.ts`
- `scripts/generate-public-sample-report.mjs`
- `scripts/generate-full-synthetic-gemini-report.mjs`
- `src/app/demo/reports/[scenario]/route.ts`
- `src/app/dashboard/assessments/[id]/report/actions.ts`
- `src/app/api/assessments/[id]/reports/generate/route.ts`
- Public static sample PDFs under `public/sample-reports/`

Assets now used:

- Dynamic readiness report PDFs use `/brand/shift-evidence-icon-light-transparent.png` on light report covers and headers.
- Dynamic readiness report PDFs can use `/brand/shift-evidence-icon-dark-transparent.png` where a dark brand surface is requested.
- Migration Recommendation Plan PDFs use `/brand/shift-evidence-icon-light-transparent.png`.
- Demo Workspace report PDFs at `/demo/reports/[scenario]` use `/brand/shift-evidence-icon-light-transparent.png`.
- Public sample report generator uses `/brand/shift-evidence-icon-light-transparent.png`.
- Text wordmarks in PDFs remain native PDF text for sharp print output.
- Vector-drawn mark remains only as a runtime fallback if the PNG asset is missing or cannot be embedded.

Static PDFs regenerated:

- `public/sample-reports/proxmox-migration-readiness-sample-report.pdf`
- `public/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf`

Static PDFs pending:

- None identified that lack a reproducible generation path in this hito.

Tests/report validations:

- `tests/unit/pdfBrandingAssets.test.ts` validates stable PDF brand assets and rejects `_incoming`, `ChatGPT Image...`, `Logo Favicon` and favicon references in active PDF generators.
- `tests/unit/reportPdfRenderer.test.ts` covers dynamic readiness report PDF rendering.
- `tests/unit/migrationRecommendationPlan.test.ts` covers standalone Migration Recommendation Plan PDF rendering.
- `tests/unit/premiumSampleReportContent.test.ts` covers public sample PDF artifacts and generator alignment.
- `npm run sample-report:generate` regenerates public static sample PDFs from source.

Risks / visual notes:

- PDF generation and parsing smoke validate that files open structurally as PDFs and page counts remain stable.
- Real visual PDF inspection in a PDF viewer is still recommended before a public launch or design sign-off.
- No glow-heavy or checkerboard-backed assets are used in the PDF generator paths.
