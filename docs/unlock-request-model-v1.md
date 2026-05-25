# Unlock Request Model v1

## Model
`UnlockRequest`

## Campos
- `id`
- `assessmentId`
- `workspaceId`
- `userId`
- `requestedType`
- `status`
- `amountCents`
- `currency`
- `contactEmail`
- `notes`
- `adminNotes`
- `approvedAt`
- `rejectedAt`
- `fulfilledAt`
- `cancelledAt`
- `createdAt`
- `updatedAt`

## Enums
- `UnlockRequestStatus`: `pending`, `approved`, `rejected`, `fulfilled`, `cancelled`
- `UnlockRequestType`: `readiness_report`, `readiness_report_pro`, `storage_addon`, `technical_review`

## Lifecycle
- `pending`: request creada por el usuario.
- `approved`: admin revisa y acepta manualmente.
- `rejected`: admin la rechaza.
- `fulfilled`: admin concede el unlock y los entitlements.
- `cancelled`: admin o flujo interno la cancela.

## Relationships
- pertenece a `Assessment`
- pertenece a `Workspace`
- pertenece a `User`

## Notes
- Un pending igual no se duplica.
- Si el entitlement ya existe, el request se puede reutilizar como ya desbloqueado.
- No hay cobro automático ni checkout en este hito.
