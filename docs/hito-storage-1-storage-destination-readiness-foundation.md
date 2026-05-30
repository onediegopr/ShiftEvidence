# HITO STORAGE-1 — Storage Destination Readiness Foundation

## Objetivo

Implementar la fundación del módulo opcional **Storage Destination Readiness** para capturar contexto estructurado, contexto libre y evidencia adicional específica de storage sin recomendar todavía Ceph, sin IA profunda y sin integrar al PDF.

## Alcance Implementado

- Modelos dedicados para storage destino, contexto libre, evidencia semántica y placeholder de análisis futuro.
- Migración Prisma local, aditiva y no destructiva.
- Límites por plan para contexto libre y cantidad de archivos storage.
- Validadores para tipos de storage, preferencias destino, crecimiento, booleanos, contexto libre, clasificaciones y límites de archivos.
- Servicio dedicado `storageDestinationReadinessService`.
- Server actions bajo la ruta del assessment para guardar, enviar, omitir, clasificar evidencia y subir archivos storage.
- Nueva tab customer-facing `Storage`.
- Componente `StorageDestinationReadinessPanel`.
- Completion Center actualizado para apuntar al módulo como opcional y no bloqueante.
- Audit events sin raw text.
- Tests unitarios de límites, validación y Completion Center.

## Modelos Creados

### AssessmentStorageDestinationReadiness

Estado principal del módulo. Guarda:

- estado del módulo;
- modo agnóstico o preferencia inferida;
- storage origen;
- preferencia destino;
- HA/shared storage/PBS/target Proxmox;
- señales iniciales de interés Ceph;
- crecimiento esperado;
- tolerancia a downtime;
- notas RPO/RTO;
- constraints estructuradas.

### AssessmentStorageContext

Campo libre específico de storage. Guarda:

- raw text completo;
- word count;
- character count;
- status;
- límites aplicados por plan;
- submit/edit timestamps.

El raw text se guarda para análisis futuro, pero no debe imprimirse directamente en reportes ni PDF.

### AssessmentStorageEvidence

Capa semántica sobre `EvidenceFile`. Permite clasificar evidencia como:

- source storage export;
- target storage design;
- hardware BOM;
- network diagram;
- Ceph status;
- Ceph OSD tree;
- Ceph DF;
- PBS backup info;
- vSAN summary;
- SAN/NAS export;
- architecture diagram;
- quote or bill of materials;
- unknown / needs review.

### AssessmentStorageAnalysis

Placeholder seguro para STORAGE-2/STORAGE-3. En STORAGE-1 queda en `not_started` o `stale`; no ejecuta IA ni engine Ceph.

## Por Qué No Se Usa CostRiskAssumptions Como Modelo Principal

`CostRiskAssumptions.assumptionsJson.storageContext` queda como legacy/contexto liviano. No se amplía porque mezclar storage destino, Ceph readiness y evidencia semántica dentro de Cost/Risk haría difícil auditar, versionar y controlar el módulo.

El nuevo módulo usa tablas dedicadas para separar:

- contexto storage;
- evidencia storage;
- análisis futuro;
- costos/licensing;
- contexto general del cliente.

## Relación Con StorageReadinessInput Legacy

`StorageReadinessInput` no se borra ni se reemplaza en este hito. Puede convivir con el nuevo módulo mientras la UI y los servicios migran gradualmente hacia `AssessmentStorageDestinationReadiness`.

La nueva tab `Storage` es la base operativa del módulo nuevo. El contexto legacy de Basics queda como fallback y compatibilidad histórica.

## Uso De RVTools Evidence Base

STORAGE-1 no toca el parser RVTools. El módulo puede mostrar y contabilizar señales ya disponibles:

- datastores;
- capacidad;
- uso;
- free space;
- usage percent;
- VM provisioned/used;
- snapshots;
- host/cluster relationship.

RVTools ayuda a entender storage origen, pero no alcanza para recomendar Ceph.

## Storage Free Context

El usuario puede describir:

- arquitectura storage actual;
- hardware disponible;
- red;
- expectativas Ceph;
- skills;
- crecimiento;
- downtime;
- backup/PBS;
- constraints.

Reglas:

- se aplica límite por plan;
- se calcula word/character count;
- no se envía a IA en STORAGE-1;
- no se imprime en PDF;
- se trata como advisory hasta validación técnica.

## Storage Evidence Classification

Los archivos storage se suben como `EvidenceFile` de tipo `other`, con una capa semántica `AssessmentStorageEvidence`.

En STORAGE-1:

- se guarda metadata;
- se clasifica;
- se permite incluir/excluir para análisis futuro;
- no hay OCR;
- no hay extracción PDF/DOCX;
- no hay procesamiento binario profundo;
- no hay collector Ceph/Proxmox/PBS.

## Plan Limits

| Plan | Palabras storage | Archivos storage | Ceph deep dive | AI storage |
| --- | ---: | ---: | --- | --- |
| Starter | 1,500 | 1 | No | No |
| Readiness Report | 8,000 | 3 | No | No |
| Readiness Report Pro | 12,000 | 5 | No | No |
| Blueprint | 40,000 | 15 | Futuro | No en STORAGE-1 |
| Partner / MSP | 50,000 | 25 | Futuro | No en STORAGE-1 |

## Completion Center

El módulo sigue siendo opcional.

Mapeo:

- not started: sin datos storage nuevos;
- partial: draft, evidencia storage o contexto parcial;
- complete: inputs/context enviados;
- skipped: módulo omitido explícitamente.

`canGenerateReport` no queda bloqueado por storage.

## Seguridad

- Raw storage text no se guarda en `Assessment`.
- Raw storage text no se pone en audit metadata.
- Audit events sólo guardan metadata segura.
- Archivos se tratan como no confiables.
- No se ejecutan macros.
- No se procesa contenido binario.
- No se llama IA.
- No se recomienda Ceph automáticamente.

## Qué Queda Para STORAGE-2

- Storage Context Intelligence.
- Sanitización/chunking específico.
- Prompt contract.
- Structured JSON output.
- Storage completeness score.
- Storage context confidence.
- AI usage events.
- Fallbacks AI disabled / budget / plan.

## Qué Queda Para STORAGE-3

- Ceph Suitability & Operations Readiness Engine.
- Scoring determinístico.
- Criterios por nodos, OSDs, red, failure domains, raw/usable, workload, skills y PBS.
- Salidas `applies`, `does_not_apply`, `conditional`, `overkill`, `underdesigned`, `not_enough_evidence`.

## Qué Queda Para STORAGE-4

- Report preview payload dedicado.
- PDF section `Storage Destination Readiness`.
- Landing/sample report visibility.
- Fallbacks de reporte.
- Disclaimers de Ceph.

## Riesgos

- El repo todavía conserva storage legacy en Basics.
- La UI nueva y la legacy conviven hasta que se haga limpieza controlada.
- Ceph aún no tiene engine, por lo tanto toda preferencia Ceph es sólo input.
- Storage cost model sigue fuera de alcance.
- La extracción profunda de archivos queda futura.

## Porcentajes

- Storage antes de STORAGE-1: 20–25%.
- Diseño conceptual tras STORAGE-AUDIT-1: 35%.
- Storage después de STORAGE-1: 45–55%.
- ShiftReadiness funcional general: 99.8–99.9%.

## Exclusiones Respetadas

- Sin deep AI.
- Sin Ceph final engine.
- Sin PDF/report integration.
- Sin RVTools parser changes.
- Sin Licensing & Cost changes.
- Sin collector.
- Sin storage TCO.
- Sin deploy.
- Sin migración productiva.
