# HITO ACC-5 - PDF Assessment Coverage & Assumptions Section

## Objetivo

Agregar al PDF una seccion profesional de `Assessment Coverage & Assumptions` para declarar que evidencia, modulos optativos y supuestos fueron usados al generar el reporte.

## Avance

- Assessment Completion Center antes de ACC-5: 80-88%.
- Assessment Completion Center despues de ACC-5: 92-96%.
- Hito ACC-5: 100% local.

## Seccion agregada

Nombre:

- `Assessment Coverage & Assumptions`

Ubicacion:

- PDF generado, despues de `Evidence Overview`.
- Antes de `Migration Context Summary`.

Intro copy:

- `This section summarizes the evidence and optional context used to generate the report. Missing optional modules do not block report generation, but they may reduce precision in the affected areas.`

## Metricas incluidas

- Completion percent.
- Report confidence percent.
- Required modules: Complete / Incomplete.
- Report generation: Generated / status correspondiente.

## Tabla de modulos

La tabla incluye:

- Area.
- Status.
- Required / Optional.
- Impact.

Los modulos provienen del engine de ACC:

- RVTools Inventory.
- Infrastructure Risk Analysis.
- Migration Questions.
- Storage Analysis.
- Licensing & Cost Exposure.
- Manual Assumptions.
- AI Advisory.
- Report Generation.

## Limitations block

Si el engine genera limitations, el PDF las lista bajo `Report Limitations`.

Si no hay limitations:

- `No major coverage limitations were detected for this assessment.`

## USD note

La seccion incluye:

- `All licensing and subscription values are modeled in USD unless explicitly stated otherwise.`

## Report types afectados

- Preview: si genera PDF desde datos reales, incluye la seccion.
- Full report: incluye la misma seccion.
- Sample/public report: no tocado. El sample publico es una pagina estatica/marketing separada, no el renderer PDF real.

## Integracion con Completion Center

- Se reutiliza `computeAssessmentCompletionSummary`.
- No se duplican reglas de status.
- Se agrega un helper puro `buildAssessmentCoverageSection`.
- El renderer PDF consume datos preparados por `reportPreviewService`.
- Los modulos optativos faltantes reducen precision pero no bloquean el PDF.

## Tests / validaciones

Tests agregados:

- Titulo y metricas de la seccion.
- Tabla con status, required/optional e impact.
- Modulo skipped produce limitation/impact.
- Modulo not_applicable no genera limitation dura.
- Nota USD presente.

## Que no se toco

- DB schema.
- Prisma migrations.
- Parser RVTools.
- AI providers/prompts.
- Readiness score existente.
- Pricing/cost formulas.
- Auth.
- Rate limiting.
- CSP/headers.
- Storage file containment.
- Hostinger.
- Produccion.
- Sample report publico.

## Queda para ACC-6

- QA integral autenticada con generacion real de PDF desde UI.
- Validacion visual del PDF con un assessment real.
- Ajustes finos de texto si stakeholders piden otro tono.
- Opcional: mostrar esta misma seccion en la pagina preview antes de generar PDF.

## Riesgos pendientes

- PDF visual acceptance queda pendiente si no hay sesion/datos QA suficientes.
- Valores historicos pueden venir de versiones anteriores de assumptions, aunque el renderer declara la cobertura actual.
- El warning NFT/Turbopack sigue siendo deuda tecnica separada.

## Confirmaciones

- DB migration: NO.
- Push realizado: NO.
- Production deploy: NO.
- Production launched: NO.
