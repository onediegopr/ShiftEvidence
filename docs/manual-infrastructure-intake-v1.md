# Manual Infrastructure Intake v1

## Objetivo
Permitir cargar una primera evidencia manual de infraestructura antes de que exista el upload de RVTools.

## Campos
- VM count
- Host count
- Cluster count
- Socket count
- Core count
- Total RAM GB
- Storage footprint TB
- Used storage TB
- Snapshot count
- Critical workload count
- Large VM count
- Powered-off VM count
- Notes

## Validaciones
- Todos los numeros deben ser no negativos.
- `usedStorageTb` no puede ser mayor que `storageFootprintTb`.
- `criticalWorkloadCount` no puede ser mayor que `vmCount`.
- `largeVmCount` no puede ser mayor que `vmCount`.
- `poweredOffVmCount` no puede ser mayor que `vmCount`.

## Persistencia
- Se guarda en `AssessmentInfrastructureInput`.
- Relacion uno a uno con `Assessment`.

## Estados
- `missing`
- `partial`
- `complete`

## Uso
- Es la primera fuente de evidencia editable.
- Alimenta el preview preliminar.
- Permite calcular riesgo sin RVTools.

## Pendiente
- Importacion automatica de RVTools.
- Reglas de mapping desde XLSX o export real.
