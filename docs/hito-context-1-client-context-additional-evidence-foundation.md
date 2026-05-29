# HITO CONTEXT-1 - Client Context & Additional Evidence Foundation

## Objetivo

Implementar la fundacion del modulo opcional **Client Context & Additional Evidence** para que un assessment pueda guardar contexto libre del cliente, clasificar evidencia adicional y dejar preparada la estructura de analisis futuro **Customer Context Intelligence**.

## Alcance implementado

- Modelos Prisma nuevos para contexto del cliente, analisis derivado futuro y evidencia adicional semantica.
- Migracion no destructiva con tablas y enums nuevos.
- Limites por plan para texto libre y archivos adicionales.
- Validadores server-side para texto, word count, file count y clasificaciones permitidas.
- Servicio interno de client context con audit trail.
- UI customer-facing en ingles dentro del assessment detail.
- Free-text editor con contador persistido, limites de plan y submit/skip.
- Upload/clasificacion inicial de additional evidence usando `EvidenceFile` como archivo fisico.
- Completion Center opcional como `client_context_intelligence`.
- Tests unitarios para limites, validacion y completion behavior.

## Modelos creados

### `AssessmentClientContext`

Guarda el raw free-text completo del cliente fuera de `Assessment` y fuera de `CostRiskAssumptions`.

Campos clave:

- `assessmentId`
- `rawText`
- `wordCount`
- `characterCount`
- `status`
- `sourceType`
- `planLimitWords`
- `planLimitFiles`
- `truncated`
- `submittedByUserId`
- `submittedAt`
- `lastEditedAt`

### `AssessmentClientContextAnalysis`

Prepara la persistencia del analisis derivado futuro. En CONTEXT-1 queda sin deep AI real.

Campos clave:

- `interpretedSummary`
- `businessPrioritiesJson`
- `migrationConstraintsJson`
- `criticalWorkloadsJson`
- `customerReportedRisksJson`
- `aiExtractedInsightsJson`
- `contradictionsJson`
- `validationItemsJson`
- `reportImpactJson`
- `nextQuestionsJson`
- `contextCompletenessScore`
- `businessContextConfidence`
- `analysisVersion`
- `promptVersion`
- `modelUsed`
- `safetyFlagsJson`

### `AssessmentAdditionalEvidence`

Agrega semantica de negocio sobre archivos ya almacenados en `EvidenceFile`.

Campos clave:

- `assessmentId`
- `evidenceFileId`
- `purpose`
- `classification`
- `analysisStatus`
- `aiSummary`
- `includedInContextAnalysis`
- `planRestricted`
- `notes`

## Por que no se usa `CostRiskAssumptions`

El texto libre puede ser largo, no es necesariamente financiero y no debe mezclarse con supuestos de costo/riesgo. `CostRiskAssumptions` sigue dedicado a inputs estructurados de costo, riesgo, storage y licensing context existentes.

## Por que no se mezcla con RVTools

RVTools es evidencia tecnica estructurada. Client context es narrativa proporcionada por el cliente. Se guarda y clasifica, pero no debe aumentar technical readiness como si fuera inventario confirmado.

## Raw text y reporte futuro

El raw text se guarda completo en `AssessmentClientContext.rawText`.

Regla de producto:

- El raw text completo no se imprime directamente en PDF o reportes.
- CONTEXT-3 debe renderizar una interpretacion profesional estructurada.
- La seccion futura del reporte sera `Customer Context Intelligence`, no una transcripcion.

## Plan limits

Archivo:

- `src/server/assessments/clientContextPlanLimits.ts`

Limites base:

- Starter: 5,000 words, 1 file.
- Readiness Report: 15,000 words, 3 files.
- Pro: 25,000 words, 8 files.
- Blueprint: 50,000 words, 20 files.
- Partner/MSP: 50,000 words, 25 files.

En CONTEXT-1 `deepAnalysisEnabled` y `pdfFullSectionEnabled` quedan en `false`.

## Additional Evidence

El archivo fisico sigue usando `EvidenceFile`.

La clasificacion semantica vive en `AssessmentAdditionalEvidence`.

Clasificaciones:

- Business context
- Technical evidence
- Financial evidence
- Architecture diagram
- Contract / renewal evidence
- Unknown / needs review

Estados:

- Received, not analyzed
- Queued
- Summarized
- Failed
- Excluded

Tipos aceptados para additional evidence:

- `.txt`
- `.csv`
- `.xlsx`
- `.xls`
- `.pdf`
- `.docx`
- `.png`
- `.jpg`
- `.jpeg`

PDF/DOCX/images quedan como received/classified. No hay extraccion profunda en CONTEXT-1.

## Audit events

Eventos agregados:

- `client_context_draft_saved`
- `client_context_submitted`
- `client_context_skipped`
- `client_context_cleared`
- `additional_evidence_uploaded`
- `additional_evidence_classified`
- `additional_evidence_excluded`

La metadata de auditoria no guarda raw text completo.

## Seguridad

- El texto del cliente se trata como contenido no confiable.
- La UI advierte no pegar passwords, secrets o credenciales.
- No se ejecutan macros ni se interpreta contenido de archivos.
- La validacion bloquea extensiones fuera de allowlist.
- El modulo es opcional y no bloquea report generation.
- Prompt injection hardening profundo queda para CONTEXT-2.

## Completion Center

Modulo agregado:

- `client_context_intelligence`

Comportamiento:

- Optional.
- No bloquea `canGenerateReport`.
- Draft = partial.
- Submitted/ready for future analysis = complete para la fundacion.
- Skipped = non-blocking.
- No cambia technical evidence confidence como evidencia tecnica confirmada.

## Fuera de alcance respetado

- No deep AI analysis.
- No llamadas a proveedores AI.
- No chunking real.
- No prompt-injection engine avanzado.
- No Customer Context Intelligence completo.
- No report preview integration.
- No nueva seccion PDF.
- No cambios al renderer PDF.
- No cambios al parser RVTools.
- No cambios al modulo licensing/cost.
- No deploy.
- No migracion productiva.

## Rollback points

1. Revertir commit de CONTEXT-1.
2. Revertir migracion `20260529235500_context_1_client_context_foundation` si no fue aplicada en ambientes compartidos.
3. Si ya fue aplicada, ejecutar rollback controlado eliminando primero tablas dependientes y luego enums, solo en ambiente seguro.

## Riesgos pendientes

- CONTEXT-2 debe implementar analisis IA con chunking y defensa contra prompt injection.
- CONTEXT-3 debe integrar report preview/PDF sin imprimir raw text.
- Los limites por plan pueden requerir ajuste comercial.
- PDF/DOCX extraction queda fuera hasta definir seguridad y costo IA.
- QA autenticada real depende de DB local/QA accesible.

## Proximos pasos

- CONTEXT-2 - AI Context Intelligence Engine.
- CONTEXT-3 - Report/PDF Integration.
- CONTEXT-QA-1 - QA end-to-end con usuario autenticado y archivos adicionales.

## Avance

- Client Context & Additional Evidence antes: 0% implementacion / 35% conceptual.
- Client Context & Additional Evidence despues: 50-55% implementado.
- ShiftReadiness total estimado despues: 99.5-99.7%.
