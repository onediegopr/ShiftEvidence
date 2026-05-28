# HITO SYNTHETIC-CONSISTENCY-1 — Demo, dataset and report branding

## Objetivo

Unificar el dataset sintético público bajo `Northbridge Industrial Group`, mejorar la demo `/demo` y agregar branding seguro a los PDFs generados sin tocar backend crítico, DB schema ni Hostinger.

## Cambios aplicados

- `/demo` vuelve a montar la navegación y footer de la plataforma.
- La empresa ficticia pública pasa de ACME a `Northbridge Industrial Group`.
- La botonera del replay se movió a la parte superior, junto a `Interactive replay`.
- El sonido sutil queda disponible pero apagado por defecto.
- Se eliminaron los textos que indicaban que el toggle de sonido era sólo visual.
- Se agregaron luces/estados visuales para pasos activos, completados, warning y critical.
- Los PDFs generados incluyen marca `Shift Evidence` y footer `Powered by Shift Evidence`.
- La página de report preview permite generar PDFs con logos opcionales de empresa/partner y cliente final.

## Branding de reportes

La personalización de logos se implementó sin migración de base de datos:

- La configuración se envía al generar el PDF.
- Los logos se embeben en ese PDF específico.
- No se guarda una preferencia permanente en DB.
- Se aceptan PNG/JPG de hasta 1 MB por logo.
- Para integradores/MSPs se puede seleccionar `For my client` y adjuntar logo de partner + cliente.
- Los reportes white-label conservan la leyenda `Powered by Shift Evidence`.

Esta decisión evita una migración de schema y reduce riesgo operativo. Un hito posterior puede persistir branding por assessment/workspace si se decide agregar DB schema.

## Archivos principales

- `src/components/demo/MigrationReadinessReplay.tsx`
- `src/components/demo/ReplayControls.tsx`
- `src/components/demo/ReplayScene.tsx`
- `src/components/demo/replayData.ts`
- `src/components/sample-report/SampleReportPage.tsx`
- `src/app/api/assessments/[id]/reports/generate/route.ts`
- `src/app/dashboard/assessments/[id]/report/page.tsx`
- `src/server/reports/reportGenerationService.ts`
- `src/server/reports/reportPdfRenderer.ts`
- `scripts/generate-public-sample-report.mjs`
- `scripts/generate-full-synthetic-gemini-report.mjs`
- `src/index.css`

## Límites

- No se agregó backend nuevo separado.
- No se modificó DB schema.
- No se ejecutó Prisma reset.
- No se tocó Hostinger config.
- No se activó OpenAI.
- No se declaró full public launch.
- No se usaron datos reales.

## Pendientes recomendados

- Persistir branding por workspace/assessment sólo si se aprueba una migración de DB.
- Agregar preview visual de logos antes de generar PDF.
- Validar visualmente PDFs con logos reales de prueba en QA.
