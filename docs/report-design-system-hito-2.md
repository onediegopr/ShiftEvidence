# REPORTS-UX-2

## Estado

REPORTS-UX-2 deja el sistema de reportes en un punto bastante mas premium y consistente. La base narrativa de `REPORTS-UX-1` ahora se extiende a una capa Blueprint reutilizable, el migration plan se siente mas cerca de un planning pack real, y el funnel publico ya apunta a un asset premium versionado.

## Cambios principales

### Nuevos helpers y modelos

- `src/server/reports/reportBlueprintModels.ts`
- `src/server/reports/reportBlueprintSections.ts`
- `src/server/reports/reportBlueprintVisuals.ts`

### Renderers mejorados

- `src/server/reports/migrationPlanPdfRenderer.ts`
  - agrega Blueprint Decision Summary
  - agrega Proxmox Target Blueprint
  - agrega Validation Matrix
  - agrega Migration Runbook Timeline
  - agrega Rollback Decision Tree
  - agrega Client Action Plan
- `src/server/reports/reportPdfRenderer.ts`
  - agrega un resumen Blueprint limitado
  - mantiene readiness y evidence confidence como senales separadas
- `src/app/demo/reports/[scenario]/route.ts`
  - conserva el contrato `application/pdf`
  - alinea el lenguaje del demo con decision pack, evidence gaps y blueprint posture

### Sample/public alignment

- `scripts/generate-public-sample-report.mjs`
  - genera el sample publico de compatibilidad
  - versiona el asset premium `v3`
- `public/sample-reports/proxmox-migration-readiness-premium-sample-report-v3.pdf`
  - nuevo asset premium versionado
- `public/sample-reports/proxmox-migration-readiness-sample-report.pdf`
  - se preserva como URL de compatibilidad
  - se regenera desde el mismo script sintetico
- `src/components/sample-report/SampleReportPage.tsx`
- `src/components/demo/MigrationReadinessReplay.tsx`
- `src/components/demo/DemoHubPage.tsx`
- `src/components/demo/DemoWorkspacePage.tsx`
- `src/app/sample-report/page.tsx`
- `src/app/vmware-to-proxmox-readiness/page.tsx`
- `src/views/LandingPage.tsx`

### Documentacion agregada o actualizada

- `docs/report-surface-upgrade-inventory.md`
- `docs/report-design-system.md`
- `docs/migration-blueprint-report-upgrade-plan.md`
- `docs/report-design-system-hito-2.md`

### Tests agregados o actualizados

- `tests/unit/reportBlueprintSections.test.ts`
- `tests/unit/premiumSampleReportContent.test.ts`

## Superficies mejoradas

### Upgrade realizado ahora

- `/sample-report`
- `/demo/reports/[scenario]`
- `/demo/replay`
- `/demo/workspace`
- `/vmware-to-proxmox-readiness`
- `reportPdfRenderer.ts`
- `migrationPlanPdfRenderer.ts`
- sample publico sintetico
- premium sample `v3`

### Upgrade parcial pero alineado

- `/`
- `/pricing`
- authenticated preview/download/generate pipeline

### Preservado de forma intencional

- `public/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf`
- `public/sample-reports/proxmox-migration-readiness-sample-report.pdf` como URL de compatibilidad

## QA visual y validaciones

### Validaciones tecnicas

- `git diff --check`
- `npm run sample-report:generate`
- `npm run typecheck`
- `npm run lint`
- `npx vitest run tests/unit/reportBlueprintSections.test.ts tests/unit/premiumSampleReportContent.test.ts tests/unit/reportNarrativeModel.test.ts tests/unit/reportPdfRenderer.test.ts tests/unit/migrationRecommendationPlan.test.ts`
- `npm run test:run`
- `npm run build`

### Smoke local

- `/sample-report` -> `200`
- `/pricing` -> `200`
- `/demo` -> `200`
- `/demo/replay` -> `200`
- `/demo/workspace` -> `200`
- `/demo/reports/balanced-mid-market` -> `200 application/pdf %PDF`
- `/vmware-to-proxmox-readiness` -> `200`
- `/sample-reports/proxmox-migration-readiness-premium-sample-report-v3.pdf` -> `200 application/pdf %PDF`

### Visual QA notes

- No se uso un segundo engine PDF.
- Los nuevos bloques visuales se apoyan en layouts deterministas y de baja fragilidad.
- Todavia conviene hacer una QA visual humana final del `v3` premium sample y del migration plan PDF antes de cualquier push/deploy.

## Rollback plan

Si hubiera que revertir este hito:

1. Volver a apuntar los CTAs publicos al asset premium anterior.
2. Revertir los helpers Blueprint y las integraciones en renderers.
3. Conservar `v3` como asset historico sin activarlo en el funnel.

No hay cambios de DB, pagos, storage contract ni infraestructura que hagan el rollback riesgoso.

## Lo que no cambio

- No se reemplazo PDFKit.
- No se tocaron contratos de storage/download.
- No se tocaron rutas autenticadas sensibles fuera de los renderers.
- No se tocaron pagos, Stripe, Wise, DNS ni deploy.
- No se agregaron claims de guaranteed migration, zero downtime ni automated migration execution.

## Proximo hito recomendado

### REPORTS-UX-3

1. Diferenciar aun mas el paquete Blueprint-only con visuales mas ricos.
2. Elevar el premium sample con charts mas pulidos si el relato comercial lo requiere.
3. Mantener la logica conservadora de evidencia y confidence.
4. Reforzar QA visual manual de PDFs antes de cualquier publicacion mayor.
