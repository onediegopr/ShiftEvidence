# HITO COST-1C - Licensing & Cost Exposure PDF / Report Integration

## Objetivo

Integrar el resultado persistido de `AssessmentLicensingAnalysis` al payload de report preview, la UI de preview del dashboard y el PDF profesional de ShiftReadiness.

## Alcance implementado

- Se agrego un normalizador de reporte para `AssessmentLicensingAnalysis`.
- Se extendio `ReportPreviewData` con `licensingCostExposure`.
- Se agrego bloque resumido en la pagina de report preview.
- Se agrego seccion PDF `Licensing & Cost Exposure Analysis`.
- Se actualizo el catalogo de secciones del reporte con el nuevo bloque.
- Se agregaron notas financieras a `Assessment Coverage & Assumptions` cuando el analisis esta incluido y tiene limitaciones financieras.
- Se agregaron tests unitarios y smoke PDF sintetico.

## Consumo de AssessmentLicensingAnalysis

El PDF no consulta `LicensingPricingSnapshot` ni recalcula precios. Consume exclusivamente el objeto normalizado a partir de:

- `status`
- `mode`
- `financialConfidenceScore`
- `financialConfidenceLabel`
- `savingsQuality`
- `pricingFreshnessStatus`
- `vmwareScenarioJson`
- `proxmoxScenarioJson`
- `comparisonJson`
- `costOfStayingJson`
- `contractTimingRiskJson`
- `licensingTrapsJson`
- `missingEvidenceJson`
- `assumptionsJson`
- `pricingSnapshotRefsJson`
- `executiveRecommendation`

El normalizador tolera JSON nulo, estructuras incompletas y strings JSON invalidos sin romper la generacion del reporte.

## Secciones agregadas al PDF

La seccion PDF incluye:

- estado del modulo;
- moneda USD;
- Financial Confidence Score;
- Savings Quality;
- Pricing Data Freshness;
- VMware/Broadcom exposure scenario;
- Proxmox scenario;
- tabla 1 / 3 / 5 year comparison;
- Cost of Staying;
- Contract Timing Risk;
- Cost Exposure Findings / Licensing Traps;
- Missing Financial Evidence;
- Assumptions;
- Pricing Snapshot Used;
- disclaimers.

## Comportamiento por report type

- `free_preview`: muestra una version resumida si el analisis esta incluido.
- `readiness_report`: muestra la seccion completa.
- `readiness_report_pro`: muestra la seccion completa.
- `blueprint`: muestra la seccion completa.

Si el assessment no tiene `AssessmentLicensingAnalysis`, el PDF sigue generandose normalmente. En reportes full se muestra una nota breve de no inclusion; en free preview se omite si no hay analisis.

## Disclaimers

La seccion declara que:

- no es una cotizacion de vendor;
- las estimaciones dependen de datos del cliente, snapshots aprobados y evidencia del assessment;
- el pricing final debe validarse con vendor, reseller o procurement;
- taxes, local fees, reseller discounts y third-party licensing no estan incluidos salvo que se provean explicitamente;
- storage cost modeling sigue en desarrollo y no esta incluido.

## Coverage & Assumptions

Cuando el analisis financiero esta incluido, `Assessment Coverage & Assumptions` puede agregar limitaciones financieras separadas de la confianza tecnica:

- financial confidence separada de technical evidence confidence;
- missing financial evidence;
- stale pricing;
- missing approved pricing snapshot references.

## Fallback behavior

Fallbacks implementados:

- no analysis: no rompe reporte;
- skipped/not included: nota breve;
- null JSON: se omite con defaults;
- malformed JSON string: warning/disclaimer;
- missing snapshots: disclaimer;
- missing amounts: `Not available`;
- long findings/missing evidence: se limitan listas y se usa wrapping del renderer;
- unknown mode/status: se renderiza como texto seguro.

## Que queda fuera

- No se implemento recalculo financiero.
- No se consultan snapshots desde el PDF.
- No se modifico `SavingsCalculator`.
- No se agrego licenciamiento de terceros.
- No se agregaron calculos de storage.
- No se aplicaron migraciones productivas.
- No se hizo deploy.

## QA realizado

- Test unitario del normalizador con null, skipped, completed, JSON malformado y disclaimers.
- Smoke PDF sintetico con analysis completo, listas largas de traps/missing evidence y snapshot refs.
- El buffer PDF empieza con `%PDF`.

## Riesgos pendientes

- Falta QA autenticada real con un assessment y datos financieros reales/sinteticos.
- Migraciones COST-1A/COST-1B deben aplicarse de forma controlada en el ambiente objetivo antes de usar el modulo con datos reales.
- No hay pricing real aprobado todavia.
- Broad scenarios siguen siendo direccionales y no deben usarse como business case final.
- Puede requerirse polish visual adicional tras revisar PDFs reales con datos largos.

## Proximos pasos

- Push controlado del commit COST-1C si las validaciones completas pasan.
- QA autenticada real con assessment que tenga `AssessmentLicensingAnalysis`.
- Aplicar migraciones en ambiente objetivo cuando corresponda.
- Validar pricing real approval flow.
- Evaluar COST-1D si se requiere hardening visual posterior.
