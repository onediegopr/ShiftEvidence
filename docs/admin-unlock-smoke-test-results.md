# Admin Unlock Smoke Test Results

Fecha: 2026-05-25

## Environment
- `ADMIN_EMAILS` detectado en `.env.local` sin exponer valores.
- `adminEmailsCount`: 1.
- Datos usados: usuarios y assessment ficticios de smoke.

## No session
- Ruta: `/dashboard/admin/unlock-requests`.
- Resultado: 307 a `/sign-in`.
- Estado: OK.

## Non-admin
- Usuario autenticado no incluido en `ADMIN_EMAILS`.
- Ruta: `/dashboard/admin/unlock-requests`.
- Resultado: 404.
- Estado: OK.

## Admin
- Usuario autenticado incluido en `ADMIN_EMAILS`.
- Ruta: `/dashboard/admin/unlock-requests`.
- Resultado: 200.
- Contenido validado: "Manual unlock requests", "Admin-only", "Payment is not automated".
- Estado: OK.

## Approve
- Request: `readiness_report`.
- Transicion: `pending -> approved`.
- Estado: OK.

## Fulfill
- Request: `readiness_report`.
- Transicion: `approved -> fulfilled`.
- Entitlement: `full_report_unlocked`.
- Estado: OK.

## Idempotency
- Fulfill repetido sobre la misma request.
- Resultado: no-op; status sigue `fulfilled`.
- Entitlements por assessment se mantienen en una fila por key.
- Estado: OK.

## Pro
- Request: `readiness_report_pro`.
- Transicion: `pending -> fulfilled` como shortcut documentado.
- Entitlements: `full_report_unlocked`, `pro_matrix_unlocked`.
- Estado: OK.

## Storage add-on
- Request: `storage_addon`.
- Transicion: `pending -> fulfilled`.
- Entitlement: `storage_readiness_unlocked`.
- Estado: OK.

## Reject
- Request: `technical_review`.
- Transicion: `pending -> rejected`.
- Fulfill posterior: bloqueado.
- `review_call_unlocked`: no concedido.
- Estado: OK.

## Report/PDF
- Con `full_report_unlocked`, se genero PDF tipo `readiness_report`.
- Download antes de delete: disponible.
- Soft-delete: aplicado.
- Download despues de delete: no disponible.
- Estado: OK.

## Public/protected routes
- `/`: 200.
- `/shiftreadiness`: 200.
- `/sign-in`: 200.
- `/dashboard`: 200 con sesion admin.
- `/dashboard/assessments`: 200 con sesion admin.
- `/dashboard/assessments/[id]/report`: 200 con sesion admin.
- Estado: OK.

## Notas
- No se ejecuto cobro real.
- No se uso checkout.
- No se usaron datos reales.
