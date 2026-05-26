# HITO 10.2.3 - Realistic RVTools Sample Workbook + Report Mapping Review

## Objetivo
Crear un workbook XLSX sintetico, no sensible y mas cercano a un export RVTools real que el CSV minimo anterior, procesarlo localmente y mapear que datos llegan al parser, inventory, risk engine, report preview y PDFs.

## Contexto
- HITO 10 quedo cerrado localmente con PDF preview y full readiness report validados.
- HITO 11 quedo cerrado con QA local integral.
- HITO 10.2.2 exporto artefactos para revision humana, pero el evidence era un CSV sintetico minimo.
- Este hito no busca reescribir el parser; busca medir cobertura real y gaps con evidencia trazable.
- Hostinger sigue pausado por env vars/storage productivos.
- Production launched: NO.

## Workbook creado
Archivo local no commiteado:

`qa-artifacts/hito-10-2-3-rvtools-mapping-review/evidence/rvtools-like-sample.xlsx`

Caracteristicas:

- tipo: workbook XLSX sintetico RVTools-like;
- sensibilidad: no sensible, sin datos de cliente;
- VMs intencionales: 23;
- hosts: 5;
- datastores: 6;
- snapshots: 5;
- tamano: 93,768 bytes.

## Hojas incluidas
- `vInfo`
- `vCPU`
- `vMemory`
- `vDisks`
- `vPartitions`
- `vHosts`
- `vDatastore`
- `vNetwork`
- `vSnapshot`
- `vTools`
- `vHealth`
- `vCluster`

## Dataset sintetico
Incluye:

- clusters: `Cluster-Prod`, `Cluster-DB`, `Cluster-Legacy`;
- hosts: `esxi-01`, `esxi-02`, `esxi-03`, `esxi-04`, `esxi-legacy-01`;
- datastores: `ds-prod-01`, `ds-prod-02`, `ds-db-01`, `ds-legacy-01`, `ds-backup-staging`, `ds-low-free-space`;
- workloads tipo web, API, SQL, ERP, DC, file server, backup proxy, VDI, legacy y archive.

Senales de riesgo incluidas:

- snapshots antiguos;
- VMware Tools desactualizado;
- discos grandes mayores a 2TB;
- datastores por encima de 85% de uso;
- VMs multi-NIC;
- workloads SQL/ERP/DC-like;
- VMs apagadas;
- OS legacy;
- datastores con poco espacio libre;
- VMs con CPU/RAM altas.

## Upload/evidence
El upload UI completo no se automatizo desde navegador. Para mantener el hito local y no introducir tooling nuevo, se uso la ruta de servicios del producto equivalente al flujo normal:

- `writeUploadedFile`;
- `createEvidenceFileRecord`;
- `importRvtoolsEvidence`.

Assessment QA creado:

- assessment id: `cmpn63i6g0001iz8ki0knrj9w`;
- evidence id: `cmpn63nvo000ciz8knwpqfb3d`;
- status: `parsed`;
- SHA-256 prefix: `8e621644508e0091`;
- storage local: `storage/users/.../uploads/rvtools/...xlsx`.

## Parser coverage
Resultado observado:

- sheets detected: 12;
- ParsedVM: 150;
- ParsedHost: 5;
- ParsedDatastore: 6;
- ParsedSnapshot: 5;
- ParsedInventorySummary: 1;
- parser warnings: 173.

Deteccion por hoja:

| Sheet | Rol detectado | Resultado |
| --- | --- | --- |
| `vInfo` | `vm` | 23 VM rows correctas como base |
| `vCPU` | `vm` | 23 VM rows duplicadas/parciales |
| `vMemory` | `vm` | 23 VM rows duplicadas/parciales |
| `vDisks` | `vm` | 32 VM rows duplicadas/parciales |
| `vPartitions` | `datastore` | filas descartadas por missing datastore name |
| `vHosts` | `host` | 5 hosts correctos |
| `vDatastore` | `datastore` | 6 datastores, pero usage incompleto |
| `vNetwork` | `vm` | 26 VM rows duplicadas/parciales |
| `vSnapshot` | `snapshot` | 5 snapshots correctos |
| `vTools` | `vm` | 23 VM rows duplicadas/parciales |
| `vHealth` | `datastore` | sin modelo util persistido |
| `vCluster` | `vm` | sin filas VM persistidas utiles |

Warnings por codigo:

- `vm_missing_provisioned`: 127;
- `datastore_missing_name`: 37;
- `datastore_missing_usage`: 6;
- `vm_missing_name`: 3.

## Inventory results
El parser logro poblar modelos first-class para la base de inventario:

- `ParsedHost`: OK.
- `ParsedDatastore`: parcial.
- `ParsedSnapshot`: OK.
- `ParsedVM`: funcional pero contaminado por filas duplicadas de hojas de detalle.

Hallazgo principal:

El parser actual usa inferencia por aliases de headers y no prioriza explicitamente el nombre de hoja RVTools. Por eso `vCPU`, `vMemory`, `vDisks`, `vNetwork` y `vTools` son tratadas como hojas VM independientes. Esto infla la matriz VM y reduce confianza.

## Risk/score results
Risk engine ejecutado correctamente:

- RiskFinding count: 35;
- readiness score: 39;
- confidence score: 55;
- risk level: high;
- source: mixed;
- VM matrix total: 150;
- snapshot high findings: detectados para snapshots antiguos;
- backup evidence gap: detectado;
- datastore findings: generados, pero con limitacion por usage null.

Top findings observados:

- snapshots antiguos para `sql-prod-01` y `old-snapshot-vm`;
- placement data incomplete en varias VMs;
- VMware Tools need review en varias VMs.

## Report/PDF results
Reportes generados desde el assessment QA:

- preview report id: `cmpn64dis0073iz8kpur67gw9`;
- full readiness report id: `cmpn64gs3007biz8kcuy8uxd9`;
- entitlement local: granted via manual unlock QA;
- commercial status: `Readiness Report unlocked`.

PDFs copiados a artefactos:

- `qa-artifacts/hito-10-2-3-rvtools-mapping-review/pdf/shiftreadiness-preview-from-rvtools-like.pdf`
- `qa-artifacts/hito-10-2-3-rvtools-mapping-review/pdf/shiftreadiness-full-from-rvtools-like.pdf`

Validacion basica:

- preview PDF: `%PDF-`, 26,557 bytes, 12 paginas estimadas;
- full PDF: `%PDF-`, 26,534 bytes, 12 paginas estimadas.

## Mapping review
Archivo local no commiteado:

`qa-artifacts/hito-10-2-3-rvtools-mapping-review/notes/mapping-review.md`

Incluye:

- tabla Sheet/Field/Parser/DB/UI/Finding/PDF/Gap/Priority;
- cobertura actual;
- gaps del parser;
- gaps del reporte;
- backlog P0/P1/P2/P3.

## Gaps detectados
P0:

- hacer que la deteccion de roles sea sheet-name aware para RVTools;
- usar `vInfo` como inventario canonico de VM;
- mergear `vCPU`, `vMemory`, `vDisks`, `vNetwork` y `vTools` por VM name;
- evitar que hojas de detalle creen `ParsedVM` duplicados;
- corregir mapping de `Free %` / capacity/free para datastores;
- agregar tests con este workbook sintetico.

P1:

- network complexity first-class: multi-NIC, VLAN, portgroup, switch;
- tools status first-class sin duplicar VMs;
- agregacion de discos por VM y risk de discos grandes;
- resumen de warnings/cobertura parser en report preview/PDF.

P2:

- `vHealth` severity;
- `vCluster` HA/DRS/capacity;
- partition-level free-space hints.

## Backlog recomendado
1. HITO parser hardening P0: canonical VM merge para RVTools multi-sheet.
2. HITO datastore normalization: usage/free percent robusto.
3. HITO report evidence transparency: parser warnings y unsupported sheets en PDF.
4. HITO parser tests: fixture XLSX sintetico no sensible.

## Artefactos generados
Carpeta local ignorada por Git:

`qa-artifacts/hito-10-2-3-rvtools-mapping-review/`

Incluye:

- README;
- workbook XLSX;
- PDFs preview/full;
- runtime results JSON;
- parser detections JSON;
- mapping review Markdown.

## Sensibilidad de datos
- Datos reales de cliente: NO.
- Secretos: NO.
- Binarios commiteados: NO.
- `qa-artifacts/` ignorado por Git: SI.

## Validaciones tecnicas
Previas:

- `npm run hostinger:diagnose`: OK, con env productivas ausentes esperadas porque no carga `.env.local`.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK, con warning conocido de Turbopack/NFT sobre tracing de `next.config.mjs` por report storage.

Finales: ver reporte final del hito.

## Riesgos pendientes
- El parser sobrecuenta VM rows con workbooks multi-sheet.
- La VM matrix puede verse mas grande que el inventario canonico.
- Algunos riesgos estan presentes pero no suficientemente precisos por falta de merge canonical.
- Este workbook es sintetico y no reemplaza QA con exports reales anonimizados.

## Proximo paso recomendado
Ejecutar un hito especifico de parser hardening P0 antes de usar RVTools reales como base comercial fuerte:

- sheet role mapping explicito;
- canonical VM merge;
- datastore usage normalization;
- fixture test con el workbook sintetico.
