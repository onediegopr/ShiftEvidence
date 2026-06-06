# REPORTS-UX-1

## Estado

Parcialmente completado con base técnica reusable, documentación y validaciones completas en local.

## Qué cambió

### Nuevos helpers / foundation

- `src/server/reports/reportDesignSystem.ts`
- `src/server/reports/reportNarrativeCopy.ts`
- `src/server/reports/reportNarrativeModel.ts`
- `src/server/reports/reportChartModels.ts`
- `src/server/reports/reportExecutiveCommandCenter.ts`

### Integraciones seguras realizadas

- `src/server/reports/reportPdfRenderer.ts`
  - agrega Executive Command Center reutilizable al PDF principal.
- `src/server/reports/migrationPlanPdfRenderer.ts`
  - agrega Executive Command Center reutilizable al PDF standalone de migration plan.

### Tests agregados

- `tests/unit/reportNarrativeModel.test.ts`

### Documentación agregada

- `docs/report-design-system-audit.md`
- `docs/report-design-system.md`
- `docs/migration-blueprint-report-upgrade-plan.md`
- `docs/report-design-system-hito-1.md`

## Qué reportes mejoran ahora

- Reporte PDF principal generado desde `reportPdfRenderer.ts`
- Standalone migration recommendation plan PDF

## Qué no se reescribió en este hito

- No se reversionó el sample PDF público estático.
- No se reemplazó el generador `scripts/generate-public-sample-report.mjs`.
- No se alteraron rutas autenticadas, descargas ni storage contracts.
- No se tocó infraestructura productiva.

## Report Inventory & Upgrade Sweep

Todas las superficies visibles o descargables de reportes deberán converger al mejor estándar visual y narrativo del nuevo Report Design System en `REPORTS-UX-2` y posteriores. Esta matriz deja inventariado lo conocido hasta ahora para no olvidar ningún asset, ruta o preview hardcodeado.

| Report / route / asset | Type | Static or dynamic | Renderer/source | Public/authenticated/internal | Current REPORTS-UX-1 status | Upgrade required in REPORTS-UX-2 | Risk level | Proposed action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/sample-report` | Public sample experience | Dynamic page | `src/app/sample-report/page.tsx` -> `src/components/sample-report/SampleReportPage.tsx` | Public | Preserved and visually separate from PDF generation | Align copy, CTA framing and embedded report preview language to new premium decision-pack standard | Medium | Keep as public commercial proof page and align module naming with upgraded PDFs |
| `src/components/sample-report/SampleReportPage.tsx` | Public sample report UI | Dynamic component | React component + CSS | Public | Preserved; not part of PDF engine | Ensure UI labels, section titles and proof cards mirror upgraded PDF sections | Medium | Sweep after PDF vocabulary stabilizes |
| `public/sample-reports/proxmox-migration-readiness-sample-report.pdf` | Public downloadable PDF | Static asset | `scripts/generate-public-sample-report.mjs` | Public | Preserved intentionally; not reversioned in this hito | Version explicitly and differentiate from premium sample if needed | High | Create a versioned successor instead of overwriting blindly |
| `public/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf` | Premium synthetic sample PDF | Static asset | `scripts/generate-public-sample-report.mjs` | Public | Preserved intentionally; foundation documented only | Upgrade to use new narrative/visual standards and clear versioning | High | Publish new versioned premium sample after visual QA |
| `scripts/generate-public-sample-report.mjs` | Static sample PDF generator | Dynamic generator for static assets | Standalone `PDFKit` script | Internal/build-time | Preserved; not replaced | Fold in new command-center, conclusion-based titles and visual helpers safely | High | Upgrade in a controlled versioned pass, not in-place blind overwrite |
| `/demo/reports/[scenario]` | Synthetic demo PDF route | Dynamic | `src/app/demo/reports/[scenario]/route.ts` | Public | Active and preserved | Align tone, section ordering and visuals with premium standard | Medium | Upgrade route output after shared helpers are proven |
| `src/app/demo/reports/[scenario]/route.ts` | Synthetic demo PDF renderer route | Dynamic | Local `PDFKit` route renderer | Public | Untouched in REPORTS-UX-1 | Reuse narrative/data helpers where safe | Medium | Introduce shared decision-pack abstractions without refactoring route contract |
| `/api/assessments/[id]/reports/generate` | Authenticated report generation route | Dynamic | `src/app/api/assessments/[id]/reports/generate/route.ts` -> `reportGenerationService` / `migrationPlanService` | Authenticated | Preserved and untouched contractually | No route refactor unless needed; focus on downstream renderer quality | Low | Keep route stable and upgrade renderers only |
| `/api/assessments/[id]/reports/[reportId]/download` | Authenticated report download route | Dynamic | `src/app/api/assessments/[id]/reports/[reportId]/download/route.ts` -> storage service | Authenticated | Preserved and untouched contractually | No visual work in route; only ensure new PDFs remain compatible | Low | Keep download/storage contract stable |
| `/dashboard/assessments/[id]/report` | Authenticated report preview | Dynamic page | `src/app/dashboard/assessments/[id]/report/page.tsx` + `reportPreviewService` | Authenticated | Preserved; not upgraded in this hito | Align preview language, locked-section labels and migration-plan framing with premium output | Medium | Sweep after PDF terminology is finalized |
| `src/server/reports/reportPdfRenderer.ts` | Main readiness PDF renderer | Dynamic | Shared `PDFKit` renderer | Internal/authenticated | Upgraded in REPORTS-UX-1 with Executive Command Center foundation | Add richer visuals, conclusion-led section titles and chart rendering where safe | Medium | Continue from current shared renderer rather than replacing engine |
| `src/server/reports/migrationPlanPdfRenderer.ts` | Standalone migration plan PDF renderer | Dynamic | Shared `PDFKit` renderer | Internal/authenticated | Upgraded in REPORTS-UX-1 with shared command-center narrative | Expand into a truer Blueprint-grade planning pack | Medium | Use this as the spine for Blueprint evolution |
| Migration Recommendation Plan PDFs | Standalone planning deliverable | Dynamic | `migrationPlanService` + `migrationPlanPdfRenderer.ts` | Authenticated/internal | Foundation improved, still visually lighter than target blueprint state | Add blueprint visuals, runbook structure and rollback framing | Medium | Elevate to premium blueprint format in REPORTS-UX-2/3 |
| `src/app/vmware-to-proxmox-readiness/page.tsx` | Blueprint / offer surface with report links | Dynamic page | Public commercial page | Public | Preserved | Audit outbound report/sample links and ensure messaging matches upgraded deliverables | Low | Keep route stable, sweep links/copy after sample assets are versioned |
| `src/components/demo/DemoWorkspacePage.tsx` | Hardcoded report preview example | Dynamic component | Demo workspace UI | Public | Preserved; contains `Migration Recommendation Plan` preview language | Align embedded report preview blocks to new report architecture | Medium | Sweep demo previews after PDF sections settle |
| `src/components/demo/MigrationReadinessReplay.tsx` | Hardcoded premium sample PDF link | Dynamic component | Demo replay UI | Public | Preserved; links premium sample asset directly | Repoint to versioned asset and align CTA naming | Medium | Update when premium sample vNext is published |
| `src/components/demo/DemoHubPage.tsx` | Hardcoded sample report / assessment CTAs | Dynamic component | Demo hub UI | Public | Preserved | Ensure sample/demo CTA taxonomy matches report families | Low | Sweep CTA labels during REPORTS-UX-2 |
| `src/views/LandingPage.tsx` | Landing links to sample/report proof | Dynamic page | Marketing UI | Public | Preserved outside this commit | Reconcile any report claims/labels with final premium report naming | Low | Audit only after sample versioning is done |
| `src/app/pricing/page.tsx` | Pricing links to sample report / technical review | Dynamic page | Marketing UI | Public | Preserved outside this commit and intentionally excluded | Update package descriptions once report families and blueprint depth are finalized | Medium | Keep out of REPORTS-UX-1 commit, revisit in commercial sweep |

### Sweep rule for future milestones

No visible or downloadable report should remain permanently below the best premium standard once `REPORTS-UX-2` and `REPORTS-UX-3` close. That includes:

- static downloadable PDFs
- public sample reports
- premium sample reports
- hardcoded demo/report examples
- synthetic demo PDFs
- authenticated generated reports
- migration plan / blueprint PDFs
- sample, demo, landing, pricing, dashboard and support entry points that describe or link to those deliverables

## Mejoras visuales / narrativas introducidas

### Executive Command Center

La primera página ejecutiva ahora puede alimentarse desde un modelo tipado reusable y expone:

- Migration Readiness Score
- Evidence Confidence Score
- Decision recommendation
- Total VMs analyzed
- Main blocker
- Best next action
- Evidence status summary
- Risk distribution summary

### Narrative engine

Se agregaron helpers premium para:

- Executive summary interpretation
- Missing evidence interpretation
- Backup missing interpretation
- Proxmox target missing / partial interpretation
- Dependency missing interpretation
- Performance history missing interpretation
- Combined readiness + confidence interpretation
- Pilot-first recommendation
- Remediation-first recommendation

### Chart / visual data foundation

Se agregaron data transforms reutilizables para:

- Migration Readiness Radar
- Risk Heatmap
- Evidence Coverage Matrix
- Wave Timeline

En este hito la prioridad fue el layer de datos y narrativa, no forzar dibujo PDF riesgoso de charts complejos.

## Riesgos controlados

- No se rompieron rutas públicas actuales.
- No se sobreescribieron assets sample públicos.
- No se cambió el motor PDF.
- No se alteró el storage/download pipeline.

## Validaciones ejecutadas

- `npm run typecheck` -> OK
- `npm run lint` -> OK
- `npm run test:run` -> OK (`124` files, `636` tests)
- `npx vitest run tests/unit/reportNarrativeModel.test.ts tests/unit/reportPdfRenderer.test.ts tests/unit/migrationRecommendationPlan.test.ts` -> OK
- `npm run build` -> OK
- Route smoke local -> OK
  - `/sample-report` -> `200`
  - `/pricing` -> `200`
  - `/demo/reports/balanced-mid-market` -> `200`
  - `/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf` -> `200`

## Próximo hito recomendado

### REPORTS-UX-2

1. Aplicar el design system a sample/static public assets con versionado explícito.
2. Incorporar chart rendering visual real donde PDFKit lo permita sin fragilidad.
3. Reescribir títulos de secciones hacia lenguaje más conclusion-based.
4. Elevar Professional y Blueprint hacia layouts más diferenciados.
5. Diseñar componentes blueprint-only:
   - Proxmox Target Blueprint Diagram
   - Validation Matrix
   - Runbook Timeline
   - Rollback Decision Tree
