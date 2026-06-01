# BILLING-7 - Billing Operations, Reconciliation + Go-Live Gate

## 1. Objetivo

Preparar Billing para operacion real con clientes sin activar Stripe live payments. El hito consolida Stripe test-mode, ledger, admin match, manual fulfillment, soporte operativo y un gate explicito antes de live.

Estado: COMPLETO a nivel codigo/docs. Smoke productivo visual final queda sujeto a que produccion tome el commit de BILLING-7.

## 2. Contexto

- BILLING-4: Stripe paso a provider principal configurable; Lemon quedo legacy/rejected/disabled; Wise quedo manual.
- BILLING-4A: Stripe Checkout test-mode validado con productos/precios test.
- BILLING-4B: webhook Stripe firmado real recibido y persistido.
- BILLING-5: Stripe events mapean a `BillingEvent`, `BillingOrder`, `BillingPayment` y `BillingSubscription`, sin grants.
- BILLING-6: orden Stripe paid fue matcheada y fulfilled manualmente; `BillingEntitlementGrant` y `AssessmentEntitlement` se crearon solo por accion admin.

## 3. Estado inicial

Git baseline: `b298c9d feat: add Stripe admin fulfillment smoke flow`.

DB baseline read-only:

| Tabla | Count |
| --- | ---: |
| BillingEvent | 3 |
| BillingOrder | 3 |
| BillingPayment | 1 |
| BillingSubscription | 1 |
| BillingEntitlementGrant | 2 |
| AssessmentEntitlement | 136 |
| AuditEvent | 369 |

Produccion antes del deploy BILLING-7 todavia mostraba provider IDs completos en admin, lo que indica que el runtime aun no habia tomado el masking de `b298c9d`. BILLING-7 mantiene y refuerza el masking en el codigo.

## 4. Cambios admin

`/dashboard/admin/billing` ahora expone:

- resumen ejecutivo con acciones requeridas y ordenes fulfilled;
- estados de provider: Stripe test, Lemon legacy/rejected/disabled, Wise manual;
- tabla de ordenes con fulfillment status y accion sugerida;
- masking de provider event/order/payment/subscription IDs;
- seccion read-only de reconciliacion;
- export CSV admin-only de reconciliacion.

No se muestran secrets, env values ni payloads raw.

## 5. Reconciliation Logic

Servicio creado:

- `src/server/billing/admin/billingReconciliationService.ts`

Reglas implementadas:

- paid order without payment;
- payment linked to an order without complete match;
- paid order unmatched;
- paid order matched but not fulfilled;
- paid/matched/fulfilled order OK;
- active entitlement grant without paid order;
- subscription `payment_failed` / cancelled requiring review;
- failed webhook requiring action;
- ignored webhook requiring review;
- unknown plan.

La reconciliacion es read-only. No llama providers, no concede acceso y no revoca acceso.

## 6. Export / Reporting

Ruta creada:

- `/dashboard/admin/billing/export/reconciliation`

Alcance:

- admin-only via `requireAdminSession`;
- CSV con severity, category, provider, plan, customer email, internal ids, provider order id masked, title, detail y action;
- no secrets;
- no raw payloads;
- no card data;
- no provider ids completos.

## 7. Public / Support Copy

Revisado y ajustado:

- `/pricing`: aclara que card payments son procesados por Stripe y que el acceso puede requerir verificacion/fulfillment manual.
- `/support`: agrega runbook operativo para paid-but-no-access, wrong email, invoice, duplicate payment, refund, failed payment y MSP subscription questions.
- `/billing/checkout/[plan]`: agrega success/cancel boundary; no promete instant access; aclara invoice/bank transfer y refund/access manual review.

No se presenta Lemon como provider activo.

## 8. Go-Live Gate

Condiciones antes de activar Stripe live:

1. Stripe account fully verified.
2. Live products/prices creados y revisados.
3. Live Stripe secret key listo en secret manager, pero no configurado hasta aprobacion.
4. Live webhook endpoint configurado en Stripe.
5. Live webhook signing secret listo.
6. Refund/support policy revisada.
7. Terms/payment copy revisada.
8. Owner approval explicito.
9. Plan de switch test-to-live documentado.
10. Rollback plan: volver a test/disabled, deshabilitar checkout y usar invoice manual.
11. Monitoring: admin billing events, failed webhooks, paid unmatched orders, support inbox.
12. First live payment smoke: pago controlado, sin auto-grants, fulfillment manual.
13. No Lemon active.
14. No auto-revoke.
15. No auto-grants from webhook.

## 9. Replay Metadata Hardening

Se corrigio el replay idempotente de `fulfillBillingOrderManually()` para no refrescar metadata temporal de `AssessmentEntitlement` cuando todos los grants esperados ya existen o cuando la unique constraint devuelve un conflicto idempotente.

Resultado esperado:

- no duplicate `BillingEntitlementGrant`;
- no duplicate `AssessmentEntitlement`;
- no refresh innecesario de `AssessmentEntitlement.purchasedAt/source` en replay already-granted;
- `AuditEvent` de replay idempotente se mantiene como trazabilidad.

## 10. Smoke

Pre-auditoria productiva:

- `/dashboard/admin/billing`: accesible con sesion admin.
- Stripe test configured: visible.
- Live OFF: visible.
- Lemon legacy/rejected: visible.
- Wise manual: visible.
- Orden Stripe paid/fulfilled de BILLING-6: visible.
- DB read-only: OK.

Post-change local build/tests: OK. Smoke productivo visual de los cambios BILLING-7 debe repetirse despues de que Hostinger tome el commit.

## 11. Seguridad

Confirmado:

- no live payments;
- no real payment;
- no Lemon checkout activo;
- no Wise API calls;
- no auto-grants;
- no auto-revokes;
- no grants desde webhook;
- no grants desde success URL;
- no secrets en docs/UI/export;
- no schema;
- no migracion;
- no DB destructiva.

## 12. Rollback

No hubo migracion. Rollback de codigo:

1. Revertir commit BILLING-7.
2. Mantener DB intacta.
3. Si el export no se desea, retirar la ruta admin-only.
4. Volver a operar con runbook BILLING-6 manual.

Rollback operativo si hay incidente live futuro:

1. Cambiar checkout mode a test/disabled.
2. Deshabilitar checkout publico.
3. Usar invoice/manual support.
4. Revisar failed webhooks y paid unmatched orders.

## 13. Proximos pasos

- BILLING-7-PROD-SMOKE post-deploy: verificar masking, reconciliacion, CSV y copy en produccion.
- BILLING-8: live-readiness final y owner approval para configurar Stripe live secrets.
- Opcional: dashboard de aging para paid-unmatched y matched-not-fulfilled por antiguedad.
