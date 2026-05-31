# Licensing and Storage Calculation Model

## 1. Resumen

Este documento define la fuente de verdad para los calculos de licenciamiento, pricing, moneda, FX, storage readiness y consistencia UI/PDF.

El modelo calcula estimaciones direccionales para comparar VMware/Broadcom contra Proxmox VE. No reemplaza una cotizacion oficial del vendor, reseller o procurement. No implementa billing real, checkout, TCO completo, storage cost modeling ni sizing definitivo de Ceph.

Superficies alineadas en este hito:

- Calculadora publica `SavingsCalculator`.
- Motor backend de Licensing Cost Exposure.
- Admin pricing snapshot seed.
- PDF cuando existe Licensing Cost Exposure.
- Tests de regresion.

Moneda interna normalizada: `USD`.

## 2. Implementacion

Fuente central de pricing:

```text
src/lib/licensing/pricingSource.ts
```

Motor central de calculo:

```text
src/lib/licensing/licensingCostModel.ts
```

Umbrales storage/Ceph:

```text
src/server/assessments/storageThresholds.ts
```

## 3. VMware

Formula por core:

```text
sockets = hostCount * socketsPerHost
rawCores = sockets * coresPerSocket
minimumBillableCores = sockets * 16
billableCores = max(rawCores, minimumBillableCores)
annualCost = billableCores * unitPriceUsd
monthlyCost = annualCost / 12
```

Regla obligatoria:

```text
VMware minimum 16 cores per socket
```

Ejemplo:

```text
hosts = 1
socketsPerHost = 2
coresPerSocket = 8
rawCores = 16
minimumBillableCores = 32
billableCores = 32
```

La regla tambien se aplica cuando el backend annualiza snapshots aprobados con metrica `core` para vendor `vmware`.

Precios centrales VMware:

| Tier | Producto | Metrica | Moneda | Precio |
| --- | --- | --- | --- | --- |
| standard | VMware vSphere Standard | core/year | USD | 50 |
| vvf | VMware vSphere Foundation | core/year | USD | 135 |
| vcf | VMware Cloud Foundation | core/year | USD | 350 |

Fuente: market-reference estimates para modelado direccional. No es quote oficial.

## 4. Proxmox

Formula por socket:

```text
sockets = hostCount * socketsPerHost
annualCost = sockets * normalizedUnitPriceUsd
monthlyCost = annualCost / 12
```

Tiers centrales Proxmox:

| Tier | Metrica | Precio original | FX | Precio normalizado |
| --- | --- | --- | --- | --- |
| community | socket/year | 120 EUR | 1.08 | 129.60 USD |
| basic | socket/year | 370 EUR | 1.08 | 399.60 USD |
| standard | socket/year | 550 EUR | 1.08 | 594.00 USD |
| premium | socket/year | 1100 EUR | 1.08 | 1188.00 USD |

Decision: `Basic` existe en todo el modelo central y queda disponible para UI publica, backend/snapshots, tests y documentacion.

## 5. Monedas y FX

Moneda base interna:

```text
USD
```

Moneda original Proxmox:

```text
EUR
```

FX central:

```text
EUR -> USD = 1.08
source = internal_static_assumption
sourceDate = 2026-05-31
effectiveDate = 2026-05-31
roundingMode = round_to_cents
```

Toda conversion devuelve:

- monto original;
- moneda original;
- monto normalizado;
- moneda normalizada;
- rate;
- fuente;
- fecha;
- rounding mode.

No hay conversion USD -> EUR configurada. Si una superficie intenta convertir sin rate configurado, el modelo lanza error.

## 6. Storage

La calculadora publica conserva el input de storage como contexto de readiness, pero no lo usa en costos de licenciamiento.

Copy visible:

```text
Workload metrics are for context only and do not affect licensing estimates.
```

Decision: mantener el campo porque ayuda a contextualizar el workload, pero dejar claro que no altera savings ni subscription delta.

Storage cost modeling sigue fuera de alcance.

## 7. Ceph

Ceph no se calcula como costo ni sizing definitivo.

El sistema evalua:

- suitability;
- readiness;
- evidence confidence;
- capacity signals;
- network/failure-domain/backup/operations signals.

Umbral central de datastore high usage:

```text
STORAGE_HIGH_USAGE_THRESHOLD_PERCENT = 80
```

Razon: 80% es un umbral prudente para alertar capacidad antes de que el estate quede demasiado cerca de saturacion.

Se usa en:

- `cephEvidenceService`;
- `storageContextAiAnalysisService`;
- `reportStorageDestinationReadinessSection`;
- tests de umbral.

## 8. PDF / UI consistency

La calculadora publica usa el motor central puro para:

- billable VMware cores;
- Proxmox socket cost;
- FX central;
- annual and 3-year deltas.

El backend autenticado conserva el flujo de snapshots aprobados, pero:

- los snapshots nuevos se seed-ean desde la fuente central;
- VMware core snapshots aplican minimo 16 cores/socket;
- Proxmox snapshots incluyen Basic/Standard/Premium/Community y metadata FX en source notes / snapshot metadata.

El PDF evita mostrar dos deltas financieros distintos cuando `Licensing Cost Exposure` esta incluido. En ese caso, los campos legacy de `costRiskPreview` en la tabla de readiness apuntan a la seccion:

```text
See Licensing & Cost Exposure section
```

`CostRisk` legacy se mantiene por compatibilidad cuando no existe Licensing Cost Exposure.

## 9. Como actualizar precios

1. Actualizar `src/lib/licensing/pricingSource.ts`.
2. Registrar o ajustar `sourceName`, `sourceDate`, `effectiveDate`, `sourceUrl` y `notes`.
3. Si cambia FX, actualizar `STATIC_EUR_USD_RATE` con rate, fuente y fecha.
4. Ejecutar tests:

```bash
npx vitest run tests/unit/licensingCostModel.test.ts tests/unit/licensingCostExposureEngine.test.ts
```

5. Ejecutar validaciones completas:

```bash
npm run typecheck
npm run lint
npm run test:run
npm run build
```

6. Revisar calculadora publica y PDF si el cambio impacta copy o snapshots.
7. Para snapshots admin, correr refresh solo en el flujo administrativo controlado, no con migraciones DB.

## 10. Tests asociados

- `tests/unit/licensingCostModel.test.ts`
- `tests/unit/licensingCostExposureEngine.test.ts`
- `tests/unit/storageThresholds.test.ts`
- `tests/unit/cephEvidenceService.test.ts`
- `tests/unit/reportStorageDestinationReadinessSection.test.ts`
- `tests/unit/reportPdfRenderer.test.ts`

Cobertura critica:

- VMware menos de 16 cores/socket;
- VMware exactamente 16 cores/socket;
- VMware mas de 16 cores/socket;
- multiples hosts/sockets;
- Proxmox Basic/Standard/Premium;
- EUR -> USD con metadata;
- no conversion sin rate;
- public/backend comparten motor;
- threshold storage/Ceph central;
- PDF no duplica cifras legacy cuando hay Licensing Cost Exposure.

## 11. Limitaciones

- No reemplaza quotes oficiales.
- Precios VMware son estimaciones de referencia.
- FX es estatico hasta implementar fuente dinamica.
- No hay billing real.
- No hay TCO completo.
- Storage no impacta costos de licensing.
- Ceph no tiene sizing definitivo ni calculo raw/usable completo.
- Snapshots existentes en DB no se migran automaticamente; los nuevos seeds administrativos salen de la fuente central.
