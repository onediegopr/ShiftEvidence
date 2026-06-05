# Stripe Live Hosted Checkout Smoke 1

Fecha: 2026-06-05

## 1. Objetivo

Validar Stripe live hosted checkout para `shiftevidence` hasta la pagina hosted de Stripe, sin completar pagos, sin ingresar tarjeta, sin webhooks live intencionales, sin grants, sin entitlements, sin DNS/cutover y sin exponer secretos.

## 2. Aprobaciones del owner

El owner aprobo explicitamente:

- Cargar Stripe live env para smoke hasta hosted checkout sin completar pagos.
- Ejecutar redeploy productivo Stripe live readiness sin completar pagos.

Limites vigentes:

- No completar pagos.
- No ingresar tarjeta.
- No tocar DNS.
- No Hostinger.
- No Stripe live payment completion.
- No webhooks intencionales.
- No grants.
- No entitlements.
- No migrations.
- No `db push`.
- No `vercel env pull`.
- No imprimir secretos.

## 3. Estado inicial

Repositorio:

- Branch: `main`.
- HEAD inicial del hito: `dcf870a628c8c01be7b47fa0ff3aaf739aa8ea48`.
- Repo limpio al iniciar.
- `main` sincronizado con `origin/main`.
- `.env.local` no trackeado.
- `.env.r2-smoke.local` no trackeado.

Vercel hardening:

- `vercel.json` conserva `git.deploymentEnabled.main=false`.
- `vercel.json` conserva `git.deploymentEnabled.preview=true`.

Production safe-off inicial:

| Route | Resultado |
| --- | --- |
| `/billing/checkout/starter/start` | `303` to `checkout_disabled` |
| `/billing/checkout/professional/start` | `303` to `checkout_disabled` |
| `/billing/checkout/msp/start` | `303` to `checkout_disabled` |

## 4. Vercel Production env

Target:

- Project: `shiftevidence`.
- Environment: Production.

Env cargados/actualizados temporalmente:

- `STRIPE_STARTER_PRICE_ID`.
- `STRIPE_PROFESSIONAL_PRICE_ID`.
- `STRIPE_MSP_PRICE_ID`.
- `STRIPE_CHECKOUT_MODE=live`.
- `STRIPE_CHECKOUT_ENABLED=true`.
- `STRIPE_LIVE_PAYMENTS_APPROVED=true`.

Confirmaciones:

- No se imprimieron valores.
- No se uso `vercel env pull`.
- No se modifico `STRIPE_SECRET_KEY`.
- No se modifico `STRIPE_WEBHOOK_SECRET`.
- No se guardaron secretos en archivos del repo.

Price IDs usados:

| Plan | Price ID | Amount | Cadence |
| --- | --- | ---: | --- |
| Starter Readiness | `price_...dJwz` | USD 490 | one-time |
| Professional Assessment | `price_...krvY` | USD 1,500 | one-time |
| MSP Partner | `price_...7iAr` | USD 399 | monthly recurring |

## 5. Redeploy live-readiness

Redeploy productivo controlado:

- Deployment URL: `shiftevidence-f17uuj7fo-shift-evidence.vercel.app`.
- Deployment ID: `dpl_AnX2qEidHNGToMszj6dtCPUii3s1`.
- Source: CLI.
- Target: Production.
- Alias production: `www.shiftevidence.com`.

No se toco:

- DNS.
- Hostinger.
- Custom domains.
- Database schema.
- Migrations.
- Stripe Dashboard products/prices.

## 6. Hosted checkout smoke

Start routes despues del redeploy live-readiness:

| Plan | Resultado |
| --- | --- |
| Starter | `303` to Stripe hosted checkout |
| Professional | `303` to Stripe hosted checkout |
| MSP | `303` to Stripe hosted checkout |

Smoke visual en Stripe hosted checkout:

| Plan | Host | Producto visible | Monto visible | Cadence visible | Resultado |
| --- | --- | --- | ---: | --- | --- |
| Starter | `checkout.stripe.com` | Starter Readiness | USD 490.00 | one-time | OK |
| Professional | `checkout.stripe.com` | Professional Assessment | USD 1,500.00 | one-time | OK |
| MSP | `checkout.stripe.com` | MSP Partner | USD 399.00 | monthly | OK |

Confirmaciones:

- No se ingreso email.
- No se ingreso tarjeta.
- No se presiono pagar.
- No se completo pago.
- No se genero fulfillment.
- No se creo grant.
- No se creo entitlement.
- No se expuso URL completa de Stripe Checkout.

Observacion:

- Stripe hosted checkout mostro copy de descripcion heredada en algunos productos que menciona `test mode only`, aunque el smoke fue en dashboard/live runtime. Recomendado corregir copy de producto en Stripe Dashboard en un hito manual separado.

## 7. Safe-off restore

Inmediatamente despues del smoke se restauro safe-off en Vercel Production:

- `STRIPE_CHECKOUT_ENABLED=false`.
- `STRIPE_LIVE_PAYMENTS_APPROVED=false`.
- `STRIPE_CHECKOUT_MODE=test`.

Redeploy productivo controlado de cierre:

- Deployment URL: `shiftevidence-4yyufzm6l-shift-evidence.vercel.app`.
- Deployment ID: `dpl_6qMf4WZ3nC7s6GpwWQgbbreUyfQG`.
- Source: CLI.
- Target: Production.
- Alias production: `www.shiftevidence.com`.

Production safe-off final:

| Route | Resultado |
| --- | --- |
| `/billing/checkout/starter/start` | `303` to `checkout_disabled` |
| `/billing/checkout/professional/start` | `303` to `checkout_disabled` |
| `/billing/checkout/msp/start` | `303` to `checkout_disabled` |

## 8. Logs

Vercel runtime logs revisados en la ventana del hito:

| Check | Resultado |
| --- | --- |
| 500 logs en deployment live-readiness | none found |
| 500 logs en deployment safe-off restore | none found |
| `checkout.session.completed` | none found |
| `stripe_checkout_failure` | none found |

## 9. Seguridad

Confirmado:

- No secrets impresos.
- No secrets guardados en git.
- No `vercel env pull`.
- No URLs completas de Stripe Checkout documentadas.
- No payment.
- No card data.
- No webhook live intencional.
- No grants.
- No entitlements.
- No mark paid.
- No customer data.
- No DNS.
- No Hostinger.
- No DB destructive.
- No migrations.
- No `db push`.

## 10. Estado final

| Area | Estado final |
| --- | ---: |
| STRIPE-LIVE-HOSTED-CHECKOUT-SMOKE-1 | 100% |
| Production/cutover readiness | 99% |
| Vercel readiness | 99% |
| DB readiness | 98% |
| Storage/R2 readiness | 100% |
| Upstash/rate limit readiness | 100% |
| Billing readiness | 99% |
| Stripe live readiness | 94% |
| Admin ops | 98% |
| General technical | 99% |

Status:

- Complete.
- Live hosted checkout smoke OK.
- Production restored to safe-off.

## 11. Rollback

Rollback aplicado:

- Safe-off restored.
- Production redeployed with safe-off envs.
- Start routes confirmed as `checkout_disabled`.

If future live payment smoke is approved:

- Re-enable only under explicit owner approval.
- Smoke must stop before payment completion unless a separate payment hito approves otherwise.
- Keep manual fulfillment until an explicit entitlement automation hito is approved.

## 12. Proximo hito

Recommended:

- `STRIPE-LIVE-PAYMENT-FINAL-GATE-1`.

Then:

- `DNS-HOSTINGER-CUTOVER-PREP-1`.
- `PRODUCTION-CUTOVER-CONTROLLED`.
