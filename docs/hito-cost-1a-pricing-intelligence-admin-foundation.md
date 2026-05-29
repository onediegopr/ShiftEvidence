# HITO COST-1A - Pricing Intelligence Admin Foundation

## 1. Objetivo

Crear la base administrativa y de datos para Pricing Intelligence, separada del assessment del cliente, para soportar futuros analisis VMware/Broadcom vs Proxmox.

El hito agrega:

- snapshots de pricing;
- items de snapshot;
- refresh runs;
- changelog;
- validaciones USD-only;
- workflow de aprobacion/rechazo;
- ruta admin en espanol;
- placeholder de Storage en desarrollo.

## 2. Alcance implementado

- Nuevos modelos Prisma independientes.
- Migracion no destructiva con tablas/enums nuevos.
- Servicio server-side `licensingPricingSnapshotService`.
- Helper de validacion `licensingPricingValidation`.
- Ruta protegida `/dashboard/admin/pricing`.
- Acciones admin para refresh manual, aprobar, rechazar y archivar.
- Audit trail mediante `recordAdminAuditEvent`.
- Tests unitarios para reglas criticas.

## 3. Por que no se toca assessment todavia

COST-1A es fundacional. Los snapshots son catalogo administrativo, no datos del assessment.

No se modifico:

- `Assessment`;
- `CostRiskAssumptions`;
- `AssessmentPreliminaryResult`;
- `AssessmentScore`;
- `costRiskService`;
- `SavingsCalculator`;
- flujo customer-facing del assessment.

Los calculos financieros por assessment quedan para COST-1B.

## 4. Por que no se toca PDF

El PDF no consume Pricing Intelligence en COST-1A. La seccion futura de Licensing & Cost Exposure debe esperar a que exista un motor de analisis por assessment con confidence, savings quality y riesgos contractuales.

No se modifico:

- `reportGenerationService`;
- `reportPreviewService`;
- `reportPdfRenderer`;
- `reportSections`;
- `reportCoverageSection`.

La integracion de reporte queda para COST-1C.

## 5. Modelos creados

### `LicensingPricingSnapshot`

Snapshot de pricing por vendor (`vmware` o `proxmox`), status, moneda USD, fuente, fechas de check/aprobacion/rechazo y metadata interna.

Estados:

- `draft`;
- `pending_review`;
- `approved`;
- `rejected`;
- `archived`.

### `LicensingPricingSnapshotItem`

Items del snapshot con producto, edicion, SKU opcional, metrica, precio unitario USD opcional, terminos y notas.

Metricas:

- `core`;
- `socket`;
- `host`;
- `node`;
- `year`;
- `subscription`;
- `manual`;
- `rule`.

### `LicensingPricingRefreshRun`

Historial de refresh manual controlado. No aprueba cambios automaticamente.

Estados:

- `running`;
- `completed`;
- `completed_with_warnings`;
- `failed`;
- `no_changes`.

### `LicensingPricingChangeLog`

Registro interno de cambios sobre snapshots, entidades y acciones.

## 6. Servicios creados

### `src/server/pricing/licensingPricingValidation.ts`

Incluye:

- validacion de vendors permitidos;
- validacion USD-only;
- validacion de status, source type y metricas;
- bloqueo explicito de licencias de terceros;
- rechazo de precios negativos;
- regla de que solo `approved` es usable para calculos futuros;
- bloqueo de calculos de storage en COST-1A.

### `src/server/pricing/licensingPricingSnapshotService.ts`

Incluye:

- resumen de Pricing Intelligence;
- listado por vendor/status;
- listado de approved/pending;
- creacion de draft/pending snapshots;
- aprobacion;
- rechazo;
- archivado;
- refresh run manual;
- changelog;
- audit events admin;
- feature flag informativo `pricing_intelligence.enabled`.

## 7. Ruta admin creada

Ruta:

`/dashboard/admin/pricing`

Nombre visible:

`Inteligencia de Precios`

La ruta usa el guard admin existente basado en Better Auth y `ADMIN_EMAILS`.

Secciones:

- Resumen;
- VMware/Broadcom;
- Proxmox;
- Snapshots pendientes;
- Historial;
- Storage - En desarrollo.

La UI esta en espanol y no se expone publicamente.

## 8. Refresh manual

El boton `Actualizar ahora`:

- requiere admin auth;
- crea un refresh run;
- no hace scraping fragil;
- si no hay snapshots, crea placeholders `pending_review` para VMware/Broadcom y Proxmox;
- si ya hay snapshots, registra `no_changes`;
- nunca aprueba automaticamente;
- registra audit event.

Mensaje operativo:

El refresh manual deja preparado el flujo de actualizacion y revision. Las fuentes deben ser validadas antes de aprobar snapshots.

## 9. Approval/rejection workflow

### Aprobar

Requiere:

- moneda USD;
- fuente distinta de `placeholder`;
- al menos un item;
- al menos un precio unitario USD;
- sin licencias de terceros.

Solo snapshots `approved` quedan marcados como usables para futuros calculos.

### Rechazar

Requiere motivo.

Guarda:

- `rejectedAt`;
- `rejectedByUserId`;
- `rejectionReason`;
- changelog;
- audit event.

### Archivar

Marca status `archived`, registra changelog y audit event.

## 10. Audit events

Eventos agregados:

- `pricing_snapshot_refreshed`;
- `pricing_snapshot_created`;
- `pricing_snapshot_approved`;
- `pricing_snapshot_rejected`;
- `pricing_snapshot_archived`.

Metadata segura:

- snapshot ID;
- vendor;
- status;
- item count;
- currency;
- source name;
- last checked date.

No se guardan secretos, tokens, prompts ni connection strings.

## 11. USD-only

Todo valor financiero nuevo se valida y muestra en USD.

La validacion rechaza monedas distintas de USD y precios negativos.

## 12. Exclusion de terceros

El hito bloquea textos de licenciamiento de terceros como Microsoft, SQL Server, Veeam, antivirus, monitoreo externo, Oracle y similares.

El alcance se mantiene en VMware/Broadcom y Proxmox.

## 13. Storage en desarrollo

La seccion Storage existe solo como placeholder:

- no tiene formularios funcionales;
- no crea modelos storage;
- no calcula nada;
- no afecta assessment;
- no afecta reportes;
- no afecta recomendaciones.

## 14. Migracion

Migracion creada:

`prisma/migrations/20260529210000_cost_1a_pricing_intelligence_foundation/migration.sql`

Caracteristicas:

- solo agrega enums;
- solo agrega tablas nuevas;
- solo agrega indices;
- no borra columnas;
- no renombra modelos;
- no altera modelos existentes;
- no aplica migracion de produccion.

## 15. Riesgos

- La migracion debe aplicarse de forma controlada en el ambiente objetivo antes de usar la ruta admin contra esa base.
- Placeholders no deben aprobarse hasta cargar fuente validada.
- COST-1B debe evitar duplicar `CostRiskAssumptions`.
- COST-1C debe reutilizar el resultado del motor financiero, no leer snapshots directamente desde el PDF.
- El pricing real debe tener fuente, fecha de check y aprobacion admin.

## 16. Rollback points

- Revertir migracion COST-1A si aun no fue aplicada.
- Revertir ruta `/dashboard/admin/pricing`.
- Revertir servicios bajo `src/server/pricing`.
- Revertir link agregado al admin principal.
- Revertir tests/documentacion si se decide posponer Pricing Intelligence.

## 17. Proximos pasos

### COST-1B - Assessment Licensing Analysis Engine

- usar solo snapshots `approved`;
- calcular Financial Confidence Score;
- calcular Savings Quality;
- Cost of Staying;
- Contract Timing Risk;
- Licensing Traps;
- mantener USD;
- no tocar terceros.

### COST-1C - PDF/Report Integration

- agregar seccion profesional al PDF;
- declarar fuentes y fecha de check;
- declarar assumptions y limitations;
- no duplicar logica del motor financiero.

## 18. Confirmaciones

- Assessment calculations touched: NO.
- PDF touched: NO.
- Storage calculations: NO.
- Third-party licensing included: NO.
- SavingsCalculator used as pricing source: NO.
- Production migration applied: NO.
- Push realizado: NO.
- Production deploy: NO.
- Production launched: NO.
