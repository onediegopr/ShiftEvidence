# BILLING-6 - Stripe Ledger Reconciliation + Admin Match + Manual Fulfillment Smoke

## 1. Objetivo

BILLING-6 valida el circuito operativo Stripe test-mode end to end: una orden Stripe pagada capturada por el ledger puede verse en admin, matchearse manualmente contra entidades internas y conceder acceso solo mediante accion explicita de admin.

Estado: COMPLETO.

## 2. Contexto

- BILLING-4 dejo Stripe como provider principal configurable.
- BILLING-4A valido Stripe Checkout test-mode en produccion.
- BILLING-4B valido webhook Stripe firmado real.
- BILLING-5 mapeo Stripe a `BillingEvent`, `BillingOrder` y `BillingPayment` sin grants automaticos.

Stripe permanece en test-mode. Live payments, auto-grants y auto-revokes siguen OFF. Lemon queda legacy/rejected/disabled. Wise queda manual.

## 3. Estado inicial

Branch: `main`.

Commit base observado: `679aae5 docs: record Billing 5 production smoke`.

Working tree inicial: limpio salvo PNGs de logo sin trackear.

DB baseline antes de match:

| Tabla | Count |
| --- | ---: |
| BillingEvent | 3 |
| BillingOrder | 3 |
| BillingPayment | 1 |
| BillingSubscription | 1 |
| BillingEntitlementGrant | 1 |
| AssessmentEntitlement | 136 |
| AuditEvent | 366 |

## 4. Orden Stripe usada

Se uso la orden test del smoke BILLING-5:

- Provider: Stripe.
- Plan: Starter Readiness.
- Email test: `stripe-5-starter-ledger-smoke@example.invalid`.
- Amount: USD 490.
- Status: `paid`.
- Provider checkout/session id: `cs_test_...jWM5ZK`.
- Provider payment id: `pi_3TdXm...0njKr`.
- Estado inicial: paid / unmatched / pending fulfillment.

## 5. Admin match flow

El match se ejecuto desde `/dashboard/admin/billing` con la sesion admin activa.

Target seguro usado:

- User: QA Production Smoke.
- Workspace: Default Readiness Workspace de QA.
- Assessment: `QA Production Smoke - 2026-05-27 - safe to delete - complete`.

Resultado:

- `BillingOrder.userId`, `workspaceId` y `assessmentId` quedaron completos.
- Match status: `Match completo`.
- `BillingEntitlementGrant`: sin cambio.
- `AssessmentEntitlement`: sin cambio.
- `AuditEvent`: +1 (`billing_order_matched`).

DB despues de match:

| Tabla | Count |
| --- | ---: |
| BillingEvent | 3 |
| BillingOrder | 3 |
| BillingPayment | 1 |
| BillingSubscription | 1 |
| BillingEntitlementGrant | 1 |
| AssessmentEntitlement | 136 |
| AuditEvent | 367 |

## 6. Manual fulfillment flow

El fulfillment se ejecuto desde la accion explicita de admin en `/dashboard/admin/billing`:

- Confirmacion manual requerida: OK.
- Warning visible: esta accion concede acceso real al assessment seleccionado.
- Plan Starter: concede `full_report_unlocked`.
- No se aceptaron entitlement keys desde cliente como autoridad.

Resultado:

- `BillingEntitlementGrant`: +1.
- `AssessmentEntitlement`: actualizado de `locked` a `granted`.
- `AssessmentEntitlement.source`: `billing_order:<billingOrderId>`.
- `AuditEvent`: +1 (`billing_order_fulfilled`).
- Webhook no intervino en grants.
- Checkout success URL no intervino en grants.

DB despues de fulfillment:

| Tabla | Count |
| --- | ---: |
| BillingEvent | 3 |
| BillingOrder | 3 |
| BillingPayment | 1 |
| BillingSubscription | 1 |
| BillingEntitlementGrant | 2 |
| AssessmentEntitlement | 136 |
| AuditEvent | 368 |

## 7. Idempotencia

La UI mostro la orden como `Ya concedido` y dejo deshabilitada la accion manual para evitar un replay accidental.

Se ejecuto una segunda llamada controlada al servicio `fulfillBillingOrderManually()` para validar idempotencia:

- Resultado: `already_granted`.
- `createdBillingEntitlementGrantIds`: `[]`.
- `BillingEntitlementGrant`: sin duplicacion.
- `AssessmentEntitlement`: sin fila duplicada.
- `AuditEvent`: +1 con mensaje de replay idempotente.

DB despues del replay:

| Tabla | Count |
| --- | ---: |
| BillingEvent | 3 |
| BillingOrder | 3 |
| BillingPayment | 1 |
| BillingSubscription | 1 |
| BillingEntitlementGrant | 2 |
| AssessmentEntitlement | 136 |
| AuditEvent | 369 |

Nota de hardening: el replay idempotente confirma que no se duplican grants ni filas de entitlement. Como mejora futura, el servicio podria evitar refrescar metadata temporal del `AssessmentEntitlement` cuando todos los grants esperados ya existen.

## 8. Admin UI

Validado:

- Stripe aparece configurado en test-mode.
- Live payments OFF.
- Lemon aparece legacy/rejected/disabled.
- Wise aparece manual invoice.
- Orden Stripe pagada visible.
- Pago Stripe visible.
- Match completo visible.
- Fulfillment status visible como `Ya concedido`.
- No secrets visibles.
- IDs de provider quedan enmascarados en UI admin.

## 9. Seguridad

Confirmado:

- No live payments.
- No tarjeta real.
- No Lemon checkout.
- No Wise API.
- No auto-grants.
- No auto-revokes.
- No grants desde webhook.
- No grants desde checkout success URL.
- No secrets en docs/UI.
- No schema ni migraciones.
- No DB destructive operations.

## 10. Rollback

No hubo migracion ni cambios destructivos.

Rollback operativo si fuera necesario:

1. Usar el flujo manual de revocation ya existente para revisar/revocar el grant `manual_billing_fulfillment`.
2. No borrar ledger historico.
3. Mantener `AuditEvent` como trazabilidad.
4. Si se revierte el cambio UI de masking, revertir el commit correspondiente sin tocar DB.

## 11. Proximos pasos

- BILLING-6-PROD-RECHECK si se quiere validar visualmente post-deploy el masking de provider IDs.
- BILLING-7 para reconciliation/reporting operativo o export de ledger.
- Hardening futuro: evitar refresh de metadata temporal en replay idempotente ya concedido.
