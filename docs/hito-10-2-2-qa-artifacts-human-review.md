# HITO 10.2.2 — QA Artifacts Export for Human Review

## Objetivo

Preparar una carpeta local revisable por humano con los artefactos QA principales de ShiftReadiness:

- evidence sample;
- PDF preview/free;
- full readiness_report;
- README de revision;
- notas de mapping entre evidence y reporte.

Este hito no modifica producto, no toca Hostinger, no hace deploy y no ejecuta migraciones.

## Contexto

HITO 10 quedo cerrado localmente con PDF preview y full readiness_report validados funcional y visualmente. HITO 11 quedo cerrado con QA local integral del producto.

Estado inicial:

- branch: `main`
- HEAD inicial: `a605a5c fix: harden assessment QA flow`
- origin/main: sincronizado
- working tree inicial: limpio
- local estable: si
- Production launched: NO
- Hostinger: pausado por env vars/storage productivos

## Assessments usados

Assessment incompleto:

- id: `cmpmqm6vw0001iznkafru48ff`
- nombre: `HITO 10.1 QA - Incomplete Evidence`
- estado: `draft`
- report usado: `cmpn0b7nm0005izjkc4v8o7nl`
- report type: `free_preview`

Assessment con inventario:

- id: `cmpmqm8jh000ciznkuq9rnn5t`
- nombre: `HITO 10.1 QA - Parsed Inventory`
- estado: `draft`
- evidence metadata id: `cmpmqma6u000riznkby9jpmt6`
- parsed VMs: `4`
- parsed hosts: `2`
- parsed datastores: `2`
- parsed snapshots: `2`
- readiness score: `72`
- confidence score: `68`
- report usado: `cmpn0b7op0007izjkq9faypm6`
- report type: `readiness_report`

## Evidence exportado

Archivo final:

- `qa-artifacts/hito-10-2-2-human-review/evidence/sample-rvtools-evidence.csv`

Decision:

- El evidence metadata original era sintetico: `hito-10-1-synthetic-rvtools.csv`.
- La ruta fisica original no existe en storage local.
- Se creo un CSV sintetico equivalente derivado de los ParsedVM/hosts/datastores del assessment QA.
- No contiene datos sensibles ni datos reales de cliente.

Columnas:

- `VM`
- `Powerstate`
- `CPUs`
- `MemoryGB`
- `ProvisionedGB`
- `UsedGB`
- `Host`
- `Cluster`
- `Datastore`
- `DatastoreType`
- `Network`
- `OS`
- `Snapshots`
- `ToolsStatus`
- `RiskLevel`
- `Recommendation`

## PDFs exportados

Preview/free PDF:

- report id: `cmpn0b7nm0005izjkc4v8o7nl`
- source: local storage
- copied path: `qa-artifacts/hito-10-2-2-human-review/pdf/shiftreadiness-preview-report.pdf`
- size: `21591` bytes
- signature: `%PDF-`

Full readiness_report:

- report id: `cmpn0b7op0007izjkq9faypm6`
- source: local storage
- copied path: `qa-artifacts/hito-10-2-2-human-review/pdf/shiftreadiness-full-readiness-report.pdf`
- size: `23608` bytes
- signature: `%PDF-`

## Ubicación de artefactos

Carpeta local:

```text
qa-artifacts/hito-10-2-2-human-review/
  README.md
  evidence/
    sample-rvtools-evidence.csv
  pdf/
    shiftreadiness-preview-report.pdf
    shiftreadiness-full-readiness-report.pdf
  screenshots/
  notes/
    data-mapping.md
    export-metadata.json
```

## Sensibilidad de datos

- Datos reales/sinteticos: sinteticos.
- Secretos: no.
- Binarios commiteados: no.
- `qa-artifacts/` agregado a `.gitignore`.

## Validación básica

Validado:

- carpeta de artefactos existe;
- evidence CSV existe y no esta vacio;
- preview PDF existe y tiene firma `%PDF-`;
- full PDF existe y tiene firma `%PDF-`;
- README existe;
- metadata de export existe;
- PDFs fueron generados por rutas reales de la app antes de copiarlos.

Nota:

- No se hizo revision visual nueva en este hito. La finalidad es dejar artefactos listos para que el usuario los abra manualmente.

## Qué debe revisar el usuario

En el evidence:

- verificar que hay 4 VMs y senales de riesgo plausibles;
- revisar `qa-db-01`, `qa-ds-legacy` y snapshots;
- comparar CPU/RAM/storage con el environment summary del full report.

En el preview PDF:

- portada;
- executive summary;
- evidence received/missing;
- readiness/confidence;
- next steps;
- page numbers;
- ausencia de promesas absolutas.

En el full readiness_report:

- secciones desbloqueadas;
- VM matrix;
- top findings;
- migration waves;
- required validations;
- calidad visual/comercial;
- ausencia de texto cortado o tablas rotas.

## Riesgos pendientes

- El evidence original de HITO 10 era metadata sintetica sin archivo fisico local.
- Este hito exporta un sample equivalente no sensible, no un RVTools real de cliente.
- Hostinger sigue pausado por env vars/storage productivos.

## Próximo paso recomendado

Revisión humana por el usuario:

1. Abrir `qa-artifacts/hito-10-2-2-human-review/README.md`.
2. Abrir `evidence/sample-rvtools-evidence.csv`.
3. Abrir `pdf/shiftreadiness-preview-report.pdf`.
4. Abrir `pdf/shiftreadiness-full-readiness-report.pdf`.
5. Marcar observaciones visuales o de contenido antes de continuar.
