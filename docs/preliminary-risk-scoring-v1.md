# Preliminary Risk Scoring v1

## Objetivo
Calcular una primera senal de costo, ahorro y riesgo basada en supuestos manuales y, cuando exista, inventario parseado.

## Formula de costo
- `annualSubscriptionDelta = annualVmwareCost - estimatedProxmoxCost`
- `threeYearSubscriptionDelta = annualSubscriptionDelta * years`
- `savingsPercent = annualSubscriptionDelta / annualVmwareCost * 100`

## Risk scoring
- Base score 0.
- +20 si `vmCount > 200`
- +10 si `vmCount > 50`
- +15 si `storageFootprintTb > 100`
- +10 si `storageFootprintTb > 20`
- +15 si `criticalWorkloadCount > 20`
- +10 si `snapshotCount > 25`
- +10 si `hostCount > 10`
- +10 si storage no esta seleccionado y `storageFootprintTb > 50`

## Inventory-driven source
- `manual`: solo supuestos manuales.
- `parsed_inventory`: el inventario parseado aporta las cuentas.
- `mixed`: inventario parseado + supuestos manuales.

## Readiness and confidence
- El readiness score preliminar se ajusta por severidad de findings.
- El confidence score ya considera evidencia RVTools, inventario parseado y completitud de supuestos.
- Ninguno de los dos es un reporte final.

## Niveles
- `low`: 0-29
- `medium`: 30-59
- `high`: 60+

## Readiness labels
- `low`: Early signal looks manageable
- `medium`: Needs technical review
- `high`: High-risk migration candidate

## Recommendations
- Add cost assumptions if faltan costos.
- Add Storage Destination Readiness if el footprint es alto y el storage no esta seleccionado.
- Review snapshot cleanup if hay demasiados snapshots.
- Prioritize dependency mapping if hay workloads criticos.
- Segment workloads into migration waves if el entorno es grande.

## Limitaciones
- Es una senal preliminar.
- No reemplaza validacion tecnica final.
- No es un reporte definitivo.
- Ahora puede enriquecerse con findings derivados del inventario.
