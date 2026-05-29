# HITO COST-1B - Assessment Licensing Analysis Engine

## 1. Objetivo

Implementar el motor funcional opcional `Licensing & Cost Exposure Analysis` dentro del assessment VMware -> Proxmox.

El hito conecta la fundacion de Pricing Intelligence de COST-1A con el assessment, sin tocar PDF ni report generation.

## 2. Alcance

Implementado:

- modelo persistente `AssessmentLicensingAnalysis`;
- engine de calculo financiero;
- data service para extraer evidencia del assessment;
- persistence service con audit events;
- server actions del assessment;
- panel customer-facing en ingles;
- uso exclusivo de snapshots aprobados;
- output y validaciones USD-only;
- tests unitarios del engine;
- documentacion interna.

Fuera de alcance:

- PDF;
- report renderer;
- storage cost model;
- licencias de terceros;
- scraping real;
- cambios al `SavingsCalculator`;
- cambios al pricing comercial de ShiftReadiness;
- deploy;
- migracion productiva.

## 3. Modelos creados

### `AssessmentLicensingAnalysis`

Relacion uno-a-uno con `Assessment`.

Campos principales:

- `assessmentId`;
- `status`;
- `mode`;
- `currency`;
- `financialConfidenceScore`;
- `financialConfidenceLabel`;
- `savingsQuality`;
- `pricingFreshnessStatus`;
- JSONs de escenarios, comparacion, cost of staying, timing risk, traps, missing evidence, assumptions y snapshot refs;
- `executiveRecommendation`;
- `generatedAt`.

Estados:

- `not_included`;
- `needs_input`;
- `ready`;
- `completed`;
- `blocked`;
- `stale_pricing`.

Modos:

- `actual_costs`;
- `estimated_from_environment`;
- `broad_scenarios`;
- `skipped`.

## 4. Reutilizacion de `CostRiskAssumptions`

COST-1B reutiliza `CostRiskAssumptions` para inputs del cliente:

- annual VMware/Broadcom cost USD;
- estimated Proxmox cost USD si ya existe;
- years;
- VM/socket/core counts;
- `assumptionsJson` para preferencias del modulo.

No se duplico `CostRiskAssumptions`.

No se guardan snapshots dentro de `CostRiskAssumptions.assumptionsJson`.

Las referencias de snapshots usados se guardan en `AssessmentLicensingAnalysis.pricingSnapshotRefsJson`.

## 5. Por que no se usa `SavingsCalculator`

`SavingsCalculator` es UI publica/comercial con valores propios y no es fuente oficial de pricing.

COST-1B usa:

- datos reales del cliente;
- evidencia del assessment;
- snapshots `approved` de Pricing Intelligence;
- supuestos explicitados.

## 6. Uso de snapshots aprobados

El engine recibe unicamente snapshots con:

- `status = approved`;
- `currency = USD`.

Snapshots `draft`, `pending_review`, `rejected` o `archived` no alimentan calculos.

Si faltan snapshots aprobados, el analisis no falla brutalmente: degrada a `needs_input`, baja confidence y genera missing evidence.

## 7. Modos del modulo

### Actual costs

Usa costo anual real o renewal quote del cliente como fuente principal.

No reemplaza datos contractuales del cliente por benchmark.

### Estimated from environment

Usa host/socket/core/VM counts y snapshots aprobados si existen.

Si faltan counts o snapshots, marca missing evidence.

### Broad scenarios

Permite una comparacion direccional de baja confianza.

No debe presentarse como business case final.

### Skipped

No calcula.

No bloquea report generation.

## 8. Financial Confidence Score

Calcula 0-100 con pesos:

- costo real del cliente;
- renewal quote;
- contrato;
- snapshots aprobados VMware/Broadcom;
- snapshots aprobados Proxmox;
- host/socket/core counts;
- renewal date;
- Proxmox target sizing;
- migration investment estimate.

Penaliza:

- pricing missing/stale;
- broad scenarios;
- estimation sin snapshot aprobado.

Labels:

- `High`;
- `Medium`;
- `Limited`;
- `Low`.

## 9. Savings Quality

Clasifica:

- `high`: costo/quote real + snapshots + target Proxmox + migration investment;
- `medium`: escenarios soportados con datos parciales;
- `low`: broad scenarios o faltan pricing/contrato/target;
- `unknown`: evidencia insuficiente.

## 10. Cost of Staying

Incluye:

- annual renewal USD;
- 3-year renewal USD;
- 5-year renewal USD;
- opportunity loss estimado si hay delta;
- notas de limitacion.

Si falta costo VMware/Broadcom, declara que no puede cuantificarse.

## 11. Contract Timing Risk

Usa renewal date si existe.

Clasificacion:

- Critical: menos de 90 dias;
- High: 90-180 dias;
- Medium: 180-365 dias;
- Low: mas de 365 dias;
- Unknown: sin renewal date.

## 12. Licensing Traps

Detecta potencial exposure, sin afirmar hechos no probados:

- contrato o renewal quote faltante;
- snapshots aprobados faltantes;
- comparacion Proxmox community-only;
- baja densidad VM/host;
- renewal window corto;
- migration investment faltante;
- broad scenarios only;
- stale pricing.

## 13. Missing Financial Evidence

Lista faltantes:

- VMware/Broadcom contract;
- renewal quote;
- renewal date;
- host/socket/core count;
- Proxmox support tier;
- migration investment;
- approved VMware/Broadcom pricing snapshot;
- approved Proxmox pricing snapshot.

## 14. Recomendaciones ejecutivas

Codigos:

- `collect_renewal_quote`;
- `run_pilot_first`;
- `negotiate_bridge_renewal`;
- `proceed_to_blueprint`;
- `do_not_use_savings_primary_driver`;
- `compare_supported_proxmox_scenario`;
- `ready_for_financial_review`.

La recomendacion se genera en ingles y se persiste como texto ejecutivo.

## 15. UI del assessment

Componente:

`src/components/assessments/LicensingCostExposurePanel.tsx`

Texto customer-facing en ingles.

Incluye:

- selector de modo;
- annual VMware/Broadcom cost USD;
- renewal date;
- contract/renewal quote flags;
- migration investment estimate USD;
- Proxmox support scenario;
- notas;
- pricing snapshot availability;
- result summary;
- disclaimer de no-cotizacion;
- nota de storage en desarrollo.

## 16. Completion Center

Se actualizo la deteccion del modulo `licensing_cost_exposure` para reconocer `AssessmentLicensingAnalysis`.

No bloquea report generation.

`canGenerateReport` sigue dependiendo de RVTools completo.

## 17. Risk Findings

No se crearon `RiskFinding` financieros en COST-1B.

Motivo:

- ya existe `cost_risk`;
- el engine persiste traps/missing evidence;
- crear findings podria duplicar o mezclar semantica.

Recomendacion:

- evaluar findings financieros derivados en COST-1D o despues de la seccion PDF COST-1C.

## 18. Por que PDF queda para COST-1C

El PDF debe consumir el resultado persistido del engine, no leer snapshots directamente.

COST-1C debe agregar seccion profesional con:

- confidence;
- savings quality;
- pricing freshness;
- snapshot refs;
- assumptions;
- limitations;
- not-a-quote disclaimer.

## 19. Riesgos

- La migracion nueva debe aplicarse controladamente en ambiente objetivo.
- Sin snapshots aprobados, el modulo se mostrara como missing pricing / baja confianza.
- Los datos de cliente en USD deben validarse antes de presentarse como caso financiero.
- Broad scenarios no deben usarse como decision primaria.
- Storage cost model sigue pendiente.

## 20. Confirmaciones

- PDF touched: NO.
- Report renderer touched: NO.
- SavingsCalculator used as pricing source: NO.
- Third-party licensing included: NO.
- Storage calculations: NO.
- Parser touched: NO.
- Production migration applied: NO.
- Production deploy: NO.
- Production launched: NO.
