# Storage Destination Readiness Optional v1

## Objetivo
Mantener Storage Destination Readiness como opcion de valor agregado, no como requisito.

## Comportamiento
- El assessment base funciona sin storage.
- El usuario puede activarlo o desactivarlo en el detail page.
- El estado se refleja en Assessment, AssessmentModule y AssessmentEntitlement.

## Estados
- `not_selected`
- `selected`
- `completed`
- `locked`

## UX
- Si no esta seleccionado:
  - mostrar que el assessment core sigue funcionando
  - permitir activarlo si hace falta mas profundidad
- Si esta seleccionado:
  - mostrar que la capa de storage se expandira en un hito posterior

## Lo que no hace todavia
- No calcula una arquitectura storage final.
- No asume Ceph como default.
- No hace benchmark.
- No toca produccion.

## Proxima expansion
- Agregar inputs de SAN/NAS/NFS/iSCSI/ZFS/hybrid y reglas de compatibilidad mas profundas.
