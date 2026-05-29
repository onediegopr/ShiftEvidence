# HITO ACC-1 - Assessment Modules Engine + Completion Model

## Objetivo

Crear la arquitectura funcional central del Assessment Completion Center para que cada assessment pueda exponer modulos, estados, pesos, porcentaje de completion y porcentaje de report confidence sin obligar al usuario a completar un wizard largo.

RVTools sigue siendo la evidencia base obligatoria. Los modulos de contexto, storage, licensing, manual assumptions y AI Advisory son optativos o recomendados y no bloquean la generacion del reporte.

## Problema de producto resuelto

El producto habia crecido desde un flujo simple de RVTools + informe hacia varios modulos complementarios. Faltaba un modelo central que explicara:

- que modulos existen;
- cuales estan completos;
- cuales estan pendientes, parciales, omitidos o bloqueados;
- que afecta la confianza del reporte;
- que bloquea o no bloquea la generacion.

ACC-1 agrega esa logica como engine reutilizable para dashboard y PDF futuros, sin redisenar UI ni cambiar el flujo actual.

## Modulos definidos

- `rvtools_inventory`: RVTools Inventory, required, weight 35.
- `infrastructure_risk`: Infrastructure Risk Analysis, required/system-required, weight 15.
- `migration_questions`: Migration Questions, optional, weight 10.
- `storage_analysis`: Storage Analysis, optional, weight 15.
- `licensing_cost_exposure`: Licensing & Cost Exposure, optional, weight 15.
- `manual_assumptions`: Manual Assumptions, optional, weight 5.
- `ai_advisory`: AI Advisory, optional, weight 3.
- `report_generation`: Report Generation, required, weight 2.

Total de pesos: 100.

## Required vs optional

- Required: RVTools Inventory, Infrastructure Risk Analysis, Report Generation.
- Optional/recommended: Migration Questions, Storage Analysis, Licensing & Cost Exposure, Manual Assumptions, AI Advisory.
- `canGenerateReport` depende de RVTools Inventory completo.
- Los modulos optativos incompletos no bloquean `canGenerateReport`.
- Report Generation puede estar pendiente aunque `canGenerateReport` sea `true`.

## Estados posibles

Se definio el tipo `AssessmentModuleStatus`:

- `not_started`
- `in_progress`
- `partial`
- `complete`
- `skipped`
- `not_applicable`
- `blocked`
- `failed`
- `unknown`

## Pesos de confidence

La contribucion de confidence usa el peso de cada modulo:

- `complete`: 100% del peso.
- `not_applicable`: 100% del peso.
- `partial`: 50% del peso.
- `in_progress`: 35% del peso.
- `skipped`: 0% del peso.
- `not_started`, `blocked`, `failed`, `unknown`: 0% del peso.

`skipped` no bloquea, pero reduce confidence y agrega limitation.

## Completion percent vs report confidence percent

`completionPercent` mide progreso operativo sobre los modulos del assessment. Un modulo `skipped` cuenta como decision tomada para completion.

`reportConfidencePercent` mide solidez del informe. Un modulo `skipped` no aporta confidence porque deja una limitacion explicita.

Estas metricas no modifican el readiness score tecnico existente ni las formulas de costo/riesgo.

## Reglas de canGenerateReport

- `canGenerateReport = true` solo cuando `rvtools_inventory` esta `complete`.
- Si RVTools esta `not_started`, `in_progress`, `partial`, `failed` o `blocked`, `canGenerateReport = false`.
- Modulos optativos incompletos aparecen en `missingRecommended` y `limitations`, pero no bloquean.

## Deteccion por modulo

- RVTools Inventory: usa evidence activo RVTools, processing status y parsed inventory snapshot.
- Infrastructure Risk Analysis: usa risk findings o assessment score; queda parcial si hay inventario pero no findings.
- Migration Questions: usa migration context existente y su coverage ponderado.
- Storage Analysis: usa storage readiness input y datastores parseados; `not_selected`/disabled se interpreta como `skipped`.
- Licensing & Cost Exposure: usa `getCostRiskStatus` y assumptions actuales.
- Manual Assumptions: usa inputs manuales de infrastructure/cost risk assumptions.
- AI Advisory: usa `aiUsageEvents` si estan presentes en el payload; si no, detecta best-effort desde report generado como parcial.
- Report Generation: usa report history/previews existentes.

## Tests agregados

Archivo:

- `tests/unit/assessmentCompletion.test.ts`

Casos cubiertos:

- assessment vacio;
- RVTools completo habilita `canGenerateReport`;
- RVTools + risk + questions + storage + licensing + manual assumptions + AI + report produce confidence alto;
- modulos optativos faltantes no bloquean;
- storage `skipped` no bloquea pero reduce confidence;
- porcentajes siempre quedan entre 0 y 100.

## Archivos modificados

- `src/server/assessments/assessmentCompletionService.ts`
- `tests/unit/assessmentCompletion.test.ts`
- `docs/hito-acc-1-assessment-modules-engine-completion-model.md`

## Que queda para ACC-2

- UI del Assessment Completion Center en dashboard.
- Acciones/CTAs por modulo en pantalla.
- Persistencia explicita de `skipped`/`not_applicable` por modulo, si se decide.
- Integracion visual con PDF/report sections.
- QA autenticada completa del flujo con datos reales de prueba.

## Riesgos pendientes

- `aiUsageEvents` no esta incluido hoy en el `AssessmentDetail` principal; la deteccion de AI queda best-effort si no se integra ese include en un hito posterior.
- `skipped`/`not_applicable` solo se infiere donde ya existe dato actual, principalmente storage readiness.
- Los pesos son una baseline de producto; pueden ajustarse despues de QA con usuarios.

## Validaciones

- `npm run test:run -- tests/unit/assessmentCompletion.test.ts`: OK, 6 tests.
- `npm run test:run`: OK, 8 archivos / 33 tests.
- `npm run lint`: OK, 0 errores, 10 warnings preexistentes de `<img>`.
- `npm run typecheck`: OK.
- `npm run build`: OK, con warning NFT/Turbopack conocido no bloqueante.
- `npm run hostinger:diagnose`: OK, diagnostico seguro sin imprimir secretos.
- `npx prisma validate`: OK cargando `.env.local` solo dentro del proceso.
- `npx prisma generate`: OK cargando `.env.local` solo dentro del proceso.

## Confirmaciones

- DB migration: NO.
- Push realizado: NO.
- Production deploy: NO.
- Production launched: NO.
