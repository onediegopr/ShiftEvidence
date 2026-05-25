# Entitlements Unlock Flow v1

## Mapping
- `readiness_report` -> `full_report_unlocked`
- `readiness_report_pro` -> `full_report_unlocked`, `pro_matrix_unlocked`
- `storage_addon` -> `storage_readiness_unlocked`
- `technical_review` -> `review_call_unlocked`

## Granting
- Se hace al fulfilled manual.
- Es idempotente.
- No duplica filas.
- Usa `AssessmentEntitlement`.
- Usa unique compuesto `assessmentId + entitlementKey`.
- Si ya existe una fila `locked` o `available`, se actualiza a `granted`.
- Si ya esta `granted`, el grant no falla.

## UI behavior
- Free preview sigue visible.
- Si hay entitlement, se desbloquean secciones relevantes.
- El PDF readiness report puede generarse cuando el full report esta unlocked.
- `full_report_unlocked` habilita Readiness Report.
- `pro_matrix_unlocked` habilita Pro.
- `storage_readiness_unlocked` habilita Storage Add-on.
- `review_call_unlocked` habilita Technical Review como placeholder operativo.

## Hito 8.1 smoke
- Fulfill repetido no duplico entitlements.
- `readiness_report_pro` no duplico `full_report_unlocked` cuando ya existia.
- Request rechazada de `technical_review` no concedio `review_call_unlocked`.

## Limitations
- No checkout.
- No pago real.
- No billing state.
- No automatizacion de cobro.
