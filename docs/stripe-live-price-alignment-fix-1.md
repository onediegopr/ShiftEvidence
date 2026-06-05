# Stripe Live Price Alignment Fix 1

Fecha: 2026-06-05

## 1. Objetivo

Corregir la alineacion de Price IDs live para Stripe en `shiftevidence`, sin activar checkout live, sin cargar envs live, sin pagos, sin webhooks live, sin redeploy y sin tocar DNS.

## 2. Estado inicial

| Area | Estado inicial |
| --- | ---: |
| STRIPE-LIVE-PRICE-ALIGNMENT-FIX-1 | 0% |
| Billing readiness | 99% |
| Stripe live readiness | 72% |
| Production/cutover readiness | 98% |
| General technical | 99% |

Bloqueo heredado:

- `STRIPE-LIVE-READINESS-1` quedo bloqueado porque los Price IDs live historicos no existian en la cuenta Stripe visible.
- Production checkout seguia safe-off.
- No live checkout, no payment, no grant, no entitlement.

## 3. Auditoria local

Repositorio:

- Branch actual: `main`.
- HEAD inicial: `f5d0f2aca55b6f6961b2ec58d0a9ec660ec4c282`.
- `origin/main`: `f5d0f2aca55b6f6961b2ec58d0a9ec660ec4c282`.
- `origin/preview`: `5c8b695eb3c20b709db30b00d7cddc6164cf2fed`.
- Repo limpio al iniciar.
- No habia commits locales sin pushear.
- No habia stashes.
- No habia untracked files visibles.
- `.env.local` no esta trackeado.
- `.env.r2-smoke.local` no esta trackeado.

Vercel hardening:

- `vercel.json` conserva `git.deploymentEnabled.main=false`.
- `vercel.json` conserva `git.deploymentEnabled.preview=true`.

## 4. Docs/config revisados

Revisado:

- `docs/stripe-live-readiness-1.md`.
- `docs/billing-stripe-checkout-roadmap.md`.
- `docs/billing-stripe-test-checkout-setup.md`.
- `docs/stripe-testmode-price-smoke-preview.md`.
- `docs/billing-stripe-live-runtime-gate.md`.
- `src/server/billing/billingConfiguration.ts`.
- `src/config/billing.ts`.

Resultado:

- Los Price IDs historicos de `STRIPE-2B` quedan marcados como stale/no alineados.
- No deben usarse como runtime source para el proximo hito.

## 5. Stripe Dashboard live audit

Cuenta auditada:

- Account visible: `Shiftevidence`.
- Account path: `acct_102Xur2ehRcYyaOr`.
- Dashboard live: confirmado visualmente por ruta live sin `/test/`.
- No se encontro prompt sensible durante esta auditoria read-only.

Productos actuales correctos:

| Plan | Product live current | Amount | Cadence | Status |
| --- | --- | ---: | --- | --- |
| Starter Readiness | `prod_...hYNS` | USD 490 | one-time | active |
| Professional Assessment | `prod_...cuGY` | USD 1,500 | one-time | active |
| MSP Partner | `prod_...Uzqw` | USD 399/month | monthly recurring | active |

Duplicados observados:

- Stripe live catalog muestra 6 productos activos.
- Existen duplicados/historicos de Starter/MSP.
- No se borro ni archivo ningun producto.

## 6. Price IDs live actuales

Confirmacion visual desde la fila `Tarifas` de cada producto actual:

| Plan | Product live | Price live current | Amount | Currency | Cadence | Status | Alignment |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| Starter Readiness | `prod_...hYNS` | `price_...dJwz` | 49000 cents | USD | one-time | active/default | aligned |
| Professional Assessment | `prod_...cuGY` | `price_...krvY` | 150000 cents | USD | one-time | active/default | aligned |
| MSP Partner | `prod_...Uzqw` | `price_...7iAr` | 39900 cents | USD | monthly recurring | active/default | aligned |

Verification method:

- Visual dashboard confirmation only.
- No live secret was used in terminal.
- No API lookup with a live secret was performed.

## 7. Historical Price IDs

Los Price IDs historicos documentados en `STRIPE-2B` fueron revisados en la misma cuenta Stripe visible.

Resultado:

| Plan | Historical status |
| --- | --- |
| Starter Readiness | not found in current account |
| Professional Assessment | not found in current account |
| MSP Partner | not found in current account |

Decision:

- Treat historical live Price IDs as stale/no aligned.
- Do not use them for runtime env.
- Use the current aligned Price IDs from this hito in the next controlled live checkout hito.

## 8. Vercel env

No se cargo ni cambio:

- `STRIPE_SECRET_KEY`.
- `STRIPE_WEBHOOK_SECRET`.
- `STRIPE_STARTER_PRICE_ID`.
- `STRIPE_PROFESSIONAL_PRICE_ID`.
- `STRIPE_MSP_PRICE_ID`.
- `STRIPE_CHECKOUT_ENABLED`.
- `STRIPE_CHECKOUT_MODE`.
- `STRIPE_LIVE_PAYMENTS_APPROVED`.

No se ejecuto:

- `vercel env pull`.
- Redeploy.
- Deploy.

## 9. Safe-off final

Production start routes siguen safe-off:

| Route | Resultado |
| --- | --- |
| `/billing/checkout/starter/start` | `303` to `checkout_disabled` |
| `/billing/checkout/professional/start` | `303` to `checkout_disabled` |
| `/billing/checkout/msp/start` | `303` to `checkout_disabled` |

## 10. Webhook readiness recheck

Sin cambios respecto a `STRIPE-LIVE-READINESS-1`:

- Endpoint live: `https://shiftevidence.com/api/webhooks/stripe`.
- Status: active.
- Events:
  - `checkout.session.completed`.
  - `customer.subscription.created`.
  - `customer.subscription.updated`.
  - `customer.subscription.deleted`.
  - `invoice.paid`.
  - `invoice.payment_failed`.

No se envio evento.
No se cargo signing secret.

## 11. What was not touched

- No checkout live.
- No hosted checkout live.
- No payment.
- No card.
- No webhook live event.
- No grants.
- No entitlements.
- No mark paid.
- No DNS.
- No Hostinger.
- No deploy.
- No redeploy.
- No DB destructive.
- No migrations.
- No `db push`.
- No env changes.
- No product changes.
- No price changes.

## 12. Riesgos

- Hay productos duplicados en Stripe live catalog.
- Algunos productos actuales tienen descripcion heredada que menciona test mode, aunque estan en el dashboard live. Recomendado corregir copy en Stripe Dashboard en un hito manual separado si se considera necesario.
- Para el proximo hito, cargar los Price IDs actuales requiere cuidado operativo para no reutilizar los stale IDs.
- Hasta el proximo hito, production debe permanecer safe-off.

## 13. Estado final

| Area | Estado final |
| --- | ---: |
| STRIPE-LIVE-PRICE-ALIGNMENT-FIX-1 | 100% |
| Billing readiness | 99% |
| Stripe live readiness | 86% |
| Production/cutover readiness | 98% |
| General technical | 99% |

Status:

- Complete for Price ID alignment discovery.
- Live checkout remains intentionally disabled.

## 14. Proximo hito

- `STRIPE-LIVE-HOSTED-CHECKOUT-SMOKE-1`.
- `DNS-HOSTINGER-CUTOVER-PREP-1`.
- `PRODUCTION-CUTOVER-CONTROLLED`.

## 15. Follow-up: hosted checkout smoke

Fecha: 2026-06-05

Los Price IDs alineados de este hito fueron usados en `STRIPE-LIVE-HOSTED-CHECKOUT-SMOKE-1` con Vercel Production bajo aprobacion explicita del owner.

Resultado:

| Plan | Price ID | Hosted checkout | Amount visible | Cadence |
| --- | --- | --- | ---: | --- |
| Starter Readiness | `price_...dJwz` | OK | USD 490.00 | one-time |
| Professional Assessment | `price_...krvY` | OK | USD 1,500.00 | one-time |
| MSP Partner | `price_...7iAr` | OK | USD 399.00 | monthly |

No payment was completed. Safe-off was restored after the smoke.
