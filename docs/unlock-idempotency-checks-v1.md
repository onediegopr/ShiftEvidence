# Unlock Idempotency Checks v1

## Entitlements tested
- `full_report_unlocked`
- `pro_matrix_unlocked`
- `storage_readiness_unlocked`
- `review_call_unlocked`

## Duplicate prevention
`AssessmentEntitlement` tiene unique compuesto:

```prisma
@@unique([assessmentId, entitlementKey])
```

El grant usa `upsert`, por lo que no crea duplicados.

## No-op behavior
- Si una request ya esta `fulfilled`, `fulfillUnlockRequest` retorna la request sin volver a conceder entitlements.
- Si un entitlement existe como `locked` o `available`, el grant lo actualiza a `granted`.
- Si un entitlement ya esta `granted`, se mantiene granted y no duplica filas.

## Transition rules
- `pending -> approved`: permitido.
- `pending -> rejected`: permitido.
- `approved -> rejected`: permitido.
- `approved -> fulfilled`: permitido.
- `pending -> fulfilled`: permitido como shortcut admin manual documentado.
- `fulfilled -> fulfilled`: no-op idempotente.
- `rejected -> fulfilled`: bloqueado.
- `cancelled -> fulfilled`: bloqueado.
- `fulfilled -> rejected`: bloqueado.

## Smoke result
En smoke 8.1:
- `readiness_report` concedio `full_report_unlocked`.
- `readiness_report_pro` concedio `full_report_unlocked` y `pro_matrix_unlocked` sin duplicar `full_report_unlocked`.
- `storage_addon` concedio `storage_readiness_unlocked`.
- `technical_review` rechazado no concedio `review_call_unlocked`.

## Limitations
- No valida pagos reales.
- No registra facturacion.
- No implementa revoke operativo en UI.
