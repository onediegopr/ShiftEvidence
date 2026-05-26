# HITO 12 - RVTools Parser P0 Hardening

## Objetivo
Corregir el bug P0 detectado en HITO 10.2.3: un workbook RVTools-like con 23 VMs generaba 150 `ParsedVM` porque hojas de detalle eran interpretadas como hojas VM independientes.

## Contexto
- Branch: `main`
- Base esperada: `5777b23 docs: map RVTools-like workbook coverage`
- Production launched: NO
- Hostinger pausado
- No se tocaron DB schema, Prisma migrations, Hostinger, deploy ni pagos.

## Bug P0 detectado
Workbook usado:

`qa-artifacts/hito-10-2-3-rvtools-mapping-review/evidence/rvtools-like-sample.xlsx`

Resultado before:

- Expected VM count: 23
- Observed `ParsedVM`: 150
- `ParsedHost`: 5
- `ParsedDatastore`: 6
- `ParsedSnapshot`: 5
- parser warnings: 173

## Causa raiz
El parser usaba inferencia por aliases de headers y nombres de hoja demasiado amplia. Hojas como `vCPU`, `vMemory`, `vDisks`, `vNetwork` y `vTools` recibian rol `vm` y cada fila se persistia como `ParsedVM`.

En RVTools multi-sheet, `vInfo` debe ser la fuente canonica de VMs. Las hojas de detalle deben enriquecer esas VMs, no crear nuevas.

## Cambios aplicados
Archivos principales:

- `src/server/rvtools/rvtoolsParserTypes.ts`
- `src/server/rvtools/rvtoolsColumnMapper.ts`
- `src/server/rvtools/rvtoolsParserService.ts`
- `src/server/rvtools/rvtoolsWorkbookReader.ts`
- `scripts/qa-rvtools-parser-p0.mjs`

## Sheet role mapping
Se agrego clasificacion explicita por nombre de hoja normalizado:

- `vInfo` -> `vm`
- `vCPU`, `vMemory`, `vDisks`, `vDisk`, `vNetwork`, `vTools` -> `vm_enrichment`
- `vHosts`, `vHost` -> `host`
- `vDatastore`, `vDatastores` -> `datastore`
- `vSnapshot`, `vSnapshots` -> `snapshot`
- `vHealth`, `vCluster`, `vPartitions`, `vPartition` -> `partial_or_future`
- otras hojas -> fallback por aliases o `unknown`

El fallback por aliases se mantiene para CSV/simple sheet.

## Canonical VM merge
Reglas implementadas:

- Si existe `vInfo`, se crea una VM canonica por fila valida.
- La clave logica es el VM name normalizado.
- Las hojas enrichment buscan la VM canonica por VM name.
- Si la VM existe, enriquecen campos existentes o metadata.
- Si no existe, se genera warning `orphan_enrichment_row` y no se crea VM.
- Duplicados en `vInfo` se mergean conservadoramente con warning `duplicate_vm_in_vInfo`.
- No hubo cambios de schema.

Campos enriquecidos cuando aplica:

- CPU
- memory
- disk count / disk metadata
- NIC count / network metadata
- tools status
- host/datastore/cluster si faltan en canonical

## Datastore normalization
Se corrigio normalizacion de usage:

- `Free %` -> `usagePercent = 100 - Free %`
- `capacity` + `free` -> `used = capacity - free`
- `capacity` + `used` -> `usagePercent = used / capacity * 100`
- si faltan datos, queda `null` sin inventar.

Resultado clave:

- `ds-low-free-space` normaliza a 95% usage y queda high risk.

## Parser warnings
Warnings no fatales agregados o preservados:

- `sheet_detected_partial_support`
- `missing_canonical_vm_sheet`
- `orphan_enrichment_row`
- `duplicate_vm_in_vInfo`
- `sheet_unrecognized`
- warnings existentes de missing sheets para CSV simple

Los warnings quedan en el result object y en `ParsedInventorySummary.parseWarningsJson`.

## Tests/QA script
Se agrego:

`scripts/qa-rvtools-parser-p0.mjs`

Valida:

- workbook RVTools-like con 23 VMs -> `ParsedVM=23`
- `ParsedHost=5`
- `ParsedDatastore=6`
- `ParsedSnapshot=5`
- `ds-low-free-space` usage -> 95%
- CSV simple -> `ParsedVM=3`
- CSV simple mantiene warnings no fatales de sheets faltantes

Comando:

```powershell
node scripts/qa-rvtools-parser-p0.mjs
```

## Before/after results
Before:

- `ParsedVM`: 150
- `ParsedHost`: 5
- `ParsedDatastore`: 6
- `ParsedSnapshot`: 5
- parser warnings: 173

After parser-only QA:

- `ParsedVM`: 23
- `ParsedHost`: 5
- `ParsedDatastore`: 6
- `ParsedSnapshot`: 5
- parser warnings: 8, todas de partial support

After servicios reales:

- assessment id: `cmpn6t08m0001iz5go3lejdde`
- evidence id: `cmpn6t62f000ciz5gqj7mxmtd`
- `ParsedVM`: 23
- `ParsedHost`: 5
- `ParsedDatastore`: 6
- `ParsedSnapshot`: 5
- `RiskFinding`: 22
- readiness: 23
- confidence: 55

## CSV regression
CSV simple validado por script:

- `ParsedVM`: 3
- `ParsedHost`: 0
- `ParsedDatastore`: 0
- `ParsedSnapshot`: 0
- parser no crashea
- missing host/datastore/snapshot warnings son no fatales

## Report/PDF regression
Con el workbook corregido y servicios reales:

- preview PDF: generado, 12 paginas estimadas, `%PDF-` valido
- full readiness report PDF: generado, 12 paginas estimadas, `%PDF-` valido
- VM inventory ya no se infla a 150
- VM matrix usa 23 VMs canonicas
- no hubo rediseño visual del PDF

## Remaining gaps
P1:

- network first-class model/signals;
- tools status first-class risk;
- disk risk deeper than aggregate metadata;
- parser coverage surfaced in UI/PDF;
- `vHealth` partial support.

P2:

- `vCluster` support;
- `vPartitions` support;
- performance sheets;
- PowerCLI custom export.

## Riesgos pendientes
- Los enrichment details quedan parcialmente en metadata porque no hay schema first-class para network/tools/disks.
- El PDF no muestra aun un resumen explicito de parser coverage/warnings.
- El QA usa workbook sintetico; sigue faltando export RVTools real anonimizado.

## Proximo paso recomendado
Ejecutar un hito P1 para surfacear parser coverage/warnings en UI/PDF y modelar network/tools/disk signals con mas precision, sin mezclarlo con deploy/Hostinger.
