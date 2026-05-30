# HITO STORAGE-3 — Ceph Suitability & Operations Readiness Engine

## Objetivo

Implementar el motor deterministico de evaluacion Ceph dentro de Storage Destination Readiness.

El objetivo no es recomendar Ceph por defecto, sino decidir de forma explicable si Ceph:

- applies;
- does not apply;
- applies conditionally;
- is overkill;
- is underdesigned;
- cannot be assessed due to missing evidence.

## Alcance Implementado

- Tipos dedicados para Ceph readiness.
- Extraccion de evidencia desde Storage Destination Readiness, Storage Context Intelligence, RVTools storage signals y metadata de Storage Evidence.
- Motor rule-based sin llamadas IA.
- Scoring de suitability, operations, evidence confidence, capacity, network, failure domains, backup y skills.
- Findings y remediations explicables.
- Persistencia en `AssessmentStorageAnalysis`.
- Acciones server-side para evaluar/re-evaluar Ceph.
- UI en la tab `Storage`.
- Completion Center actualizado.
- Tests unitarios.

## Arquitectura

### Archivos Nuevos

- `src/server/assessments/cephReadinessTypes.ts`
- `src/server/assessments/cephEvidenceService.ts`
- `src/server/assessments/cephReadinessScoringService.ts`
- `src/server/assessments/cephReadinessFindingsService.ts`
- `src/server/assessments/cephSuitabilityEngine.ts`

### Archivos Modificados

- `src/app/dashboard/assessments/[id]/storage/actions.ts`
- `src/components/assessments/StorageDestinationReadinessPanel.tsx`
- `src/server/assessments/assessmentCompletionService.ts`

## Persistencia

No se creo migracion nueva.

El resultado se persiste en `AssessmentStorageAnalysis` usando:

- `cephSuitabilityStatus`;
- `recommendationsJson.cephReadiness`;
- `missingEvidenceJson`;
- `generatedAt`;
- `analysisVersion` cuando aplica.

Esto mantiene compatibilidad con STORAGE-1/STORAGE-2 y evita alterar schema para un resultado que ya encaja en JSON estructurado.

## Evidencia Usada

El motor usa:

- `AssessmentStorageDestinationReadiness`;
- `AssessmentStorageContext` solo como estado/metadata, no como texto crudo impreso;
- `AssessmentStorageEvidence` como metadata segura;
- `AssessmentStorageAnalysis.recommendationsJson` para senales de Storage Context Intelligence;
- `ParsedDatastore`;
- `ParsedVM`;
- `ParsedSnapshot`;
- `ParsedInventorySummary`.

No usa contenido binario de archivos.
No usa OCR.
No modifica parser RVTools.
No llama IA.

## Estados Ceph

- `ceph_applies`: Ceph parece defendible con evidencia suficiente.
- `ceph_does_not_apply`: Ceph no aplica para el caso actual.
- `ceph_conditional`: Ceph puede aplicar si se remedia o valida evidencia faltante.
- `ceph_overkill`: Ceph parece excesivo para el perfil actual.
- `ceph_underdesigned`: Ceph esta subdisenado con las senales actuales.
- `not_enough_evidence`: falta evidencia critica para decidir.

## Scores

El motor calcula:

- Ceph Suitability Score.
- Ceph Operations Readiness Score.
- Ceph Evidence Confidence Score.
- Capacity Fit Score.
- Network Readiness Score.
- Failure Domain Readiness Score.
- Backup Readiness Score.
- Operational Skills Score.

Interpretacion general:

- 80-100: fuerte.
- 60-79: condicional / medio.
- 40-59: limitado / precaucion alta.
- 0-39: no listo.

## Reglas Principales

- Customer preference for Ceph is not enough.
- AI Ceph signals are advisory and not final.
- RVTools describes source storage, not target Ceph design.
- Missing node, OSD, network, backup or operations evidence lowers confidence.
- Fewer than three nodes pushes toward `ceph_underdesigned`.
- Small/simple environments can produce `ceph_overkill`.
- Strong evidence can produce `ceph_applies`, but still requires blueprint validation before production.

## UI

La tab `Storage` ahora incluye:

- `Ceph Suitability & Operations Readiness`;
- status badge;
- scores;
- findings;
- required remediations;
- missing evidence;
- decision rationale;
- recommended next step;
- disclaimers.

Texto clave:

- Ceph is not recommended by default.
- Ceph suitability depends on hardware, network, failure domains, backup and operational readiness.
- This assessment does not install or validate a live Ceph cluster.

## Completion Center

Storage sigue siendo opcional y no bloquea `canGenerateReport`.

Comportamiento:

- Storage Destination Readiness + Ceph no solicitado: puede completarse sin Ceph evaluation.
- Ceph solicitado + sin evaluacion Ceph: partial.
- Ceph evaluation completada: complete.
- `not_enough_evidence`: partial pero util.
- skipped: skipped.

## Seguridad

- No se imprime raw storage context.
- No se guarda raw text en audit metadata.
- No se envian archivos binarios a IA.
- No se ejecutan comandos Ceph.
- No se instala ni valida cluster real.
- No se prometen capacidad, performance ni cero downtime.

## Exclusiones Respetadas

- Sin PDF/report integration.
- Sin landing.
- Sin collector Proxmox/Ceph/PBS.
- Sin Ceph CLI ingestion.
- Sin deep file extraction.
- Sin OCR.
- Sin storage cost/TCO.
- Sin cambios RVTools parser.
- Sin cambios Licensing & Cost.
- Sin deploy.
- Sin migracion productiva.

## Tests

Tests agregados:

- `tests/unit/cephEvidenceService.test.ts`
- `tests/unit/cephReadinessScoringService.test.ts`
- `tests/unit/cephReadinessFindingsService.test.ts`
- `tests/unit/cephSuitabilityEngine.test.ts`

Tests actualizados:

- `tests/unit/storageLicensingContext.test.ts`

Casos cubiertos:

- Ceph no seleccionado.
- Ceph solicitado sin evidencia.
- Menos de tres nodos.
- Network unknown.
- Backup/PBS faltante.
- Skills faltantes.
- Evidencia fuerte.
- Small/simple overkill.
- Completion Center no bloquea report generation.
- Motor deterministico sin IA.

## Porcentajes

- Storage antes de STORAGE-3: 65-75%.
- Storage despues de STORAGE-3: 80-90%.
- ShiftReadiness total funcional: 99.8-99.9%.

## Pendiente

- STORAGE-4: Report/PDF + Landing Visibility.
- Proxmox/Ceph/PBS read-only collector futuro.
- Storage cost/TCO model futuro.
- Ajuste con evidencia Ceph real.
- Migraciones STORAGE-1/2 pendientes de aplicar en ambiente objetivo cuando se decida release futuro.

## Veredicto

STORAGE-3 convierte Ceph en una decision explicable, conservadora y evidence-based dentro de Storage Destination Readiness.

Ceph ya no queda solo como preferencia capturada o senal IA preliminar: queda evaluado por reglas deterministicas, con scores, findings, remediations y limites claros.
