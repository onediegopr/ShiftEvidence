# Cost / Risk Assumptions v1

## Objetivo
Guardar los supuestos editables que alimentan el preview preliminar de costo y riesgo.

## Campos
- VMware license model
- Socket count
- Core count
- VM count
- Annual VMware cost
- Estimated Proxmox cost
- Currency
- Years
- Migration complexity
- Business criticality
- Risk tolerance

## Validaciones
- `Years` entre 1 y 10.
- Costos no negativos.
- Counts no negativos.

## Persistencia
- Se guarda en `CostRiskAssumptions`.
- Una fila por assessment.

## Limites
- Los costos son estimados y manuales.
- La moneda se mantiene en USD por defecto.
- No se trata de un calculo final de negocio.

## Recalculo
- Cada guardado dispara un recalculo preliminar.
- El resultado se almacena aparte en `AssessmentPreliminaryResult`.

## Copia desde intake
- VM count, socket count y core count pueden prellenarse desde el intake manual cuando existan.
