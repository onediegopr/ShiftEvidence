# BILLING-9A-FIX-3 - Safe Stripe Live Diagnostics

## 1. Objetivo

Agregar observabilidad segura para diagnosticar runtime Stripe live en Hostinger antes de reintentar checkout live pre-payment.

Este hito no activa checkout publico, no crea pagos, no usa tarjeta, no crea objetos Stripe, no muta DB y no otorga grants.

## 2. Contexto

BILLING-9A-FIX-2 dejo produccion en modo seguro:

- `STRIPE_CHECKOUT_ENABLED=false`.
- Checkout publico responde con fallback `checkout_disabled`.
- Admin billing muestra Stripe configurado en modo live pero checkout deshabilitado.
- Webhook Stripe con firma invalida responde 401.
- DB sin cambios frente al baseline operativo.

## 3. Diagnostic service

Se agrego un servicio server-only que valida:

- presencia de secret key, webhook secret y Price IDs;
- modo de key (`live`, `test`, `restricted_live`, `unknown`, `missing`);
- modo checkout y aprobacion live;
- reachability de Stripe Account;
- sanity de prices Starter, Professional y MSP.

Las lecturas a Stripe son solo `GET` y no crean Checkout Session, PaymentIntent, Customer, Subscription ni BillingEvent.

## 4. Endpoint/admin protection

Ruta:

- `/api/admin/billing/diagnostics/stripe-live`

Protecciones:

- requiere sesion admin;
- `Cache-Control: no-store`;
- no devuelve secrets;
- no devuelve Price IDs completos;
- no devuelve raw Stripe objects.

## 5. Admin UI

La consola `/dashboard/admin/billing` muestra una seccion “Diagnostico Stripe Live” con:

- modo de secret key;
- webhook secret presente/ausente;
- checkout mode;
- checkout habilitado;
- live aprobado;
- API Stripe reachable;
- sanity de Starter, Professional y MSP;
- blockers y warnings.

## 6. Checkout error hardening

El start route de checkout captura errores y redirige con codigos seguros:

- `checkout_disabled`;
- `stripe_auth_error`;
- `stripe_price_invalid`;
- `stripe_timeout`;
- `stripe_runtime_error`;
- `stripe_key_mode_mismatch`.

Los logs estructurados no incluyen secrets, Price IDs completos ni errores raw de Stripe.

## 7. Production diagnostic smoke

Resultado esperado post-deploy:

- endpoint sin sesion protegido;
- endpoint con admin devuelve JSON seguro;
- secret key mode `live`;
- webhook secret presente;
- checkout mode `live`;
- live approved `true`;
- checkout enabled `false`;
- Stripe API reachable;
- prices sane para Starter, Professional y MSP;
- `readyForLiveCheckoutPrepaymentSmoke=true` con warning de checkout disabled.

No se ejecuta checkout live ni pago en este hito.

## 8. DB before/after

Baseline esperado sin cambios:

- BillingEvent;
- BillingOrder;
- BillingPayment;
- BillingSubscription;
- BillingEntitlementGrant;
- AssessmentEntitlement;
- AuditEvent.

El diagnostico no escribe en DB.

## 9. Webhook invalid signature

El smoke de firma invalida debe seguir devolviendo 401 `invalid_signature` y no crear BillingEvent.

## 10. Seguridad

- No real payment.
- No card data.
- No public diagnostics.
- No secrets in UI/docs/logs.
- No full Price IDs in docs.
- No grants.
- No Lemon reactivation.
- No Wise API.
- No Hostinger/env changes in this commit.

## 11. Riesgos

- Hostinger puede seguir devolviendo 503 antes de entrar al codigo app si el runtime falla fuera de Next.js.
- Stripe API puede estar reachable pero checkout live seguir fallando por policy/configuracion externa.
- El checkout permanece deshabilitado hasta un hito posterior con autorizacion explicita.

## 12. Proximo hito

- `BILLING-9B-FIRST-LIVE-PAYMENT-SMOKE` si diagnostics y pre-payment retry quedan autorizados.
- `BILLING-9A-FIX-4` si diagnostics muestran un blocker runtime o Stripe.
