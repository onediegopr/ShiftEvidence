# Stripe Live Readiness 1

Fecha: 2026-06-05

## 1. Objetivo

Preparar Stripe live readiness de forma controlada para `shiftevidence`, sin completar pagos reales, sin grants, sin entitlements reales, sin DNS/cutover y sin exponer secretos.

Alcance:

- Auditar gates de checkout live en codigo.
- Auditar rutas de checkout production en estado safe-off.
- Auditar Stripe Dashboard live de forma visual.
- Confirmar productos/precios live esperados.
- Confirmar webhook live readiness.
- Detectar account/Price ID mismatch antes de habilitar live.
- Documentar rollback y siguientes pasos.

Fuera de alcance:

- Completar pagos.
- Ingresar tarjeta.
- Activar fulfillment automatico.
- Grants reales.
- Entitlements reales.
- DNS.
- Hostinger.
- DB destructive.
- Migraciones.
- `db push`.
- `vercel env pull`.

## 2. Estado inicial

| Area | Estado inicial |
| --- | ---: |
| STRIPE-LIVE-READINESS-1 | 0% |
| Production/cutover readiness | 98% |
| Vercel readiness | 99% |
| DB readiness | 98% |
| Storage/R2 readiness | 100% |
| Upstash/rate limit readiness | 100% |
| Billing readiness | 99% |
| Stripe live readiness | 65% |
| Admin ops | 98% |
| General technical | 99% |

## 3. Auditoria local

Repositorio:

- Branch actual: `main`.
- HEAD inicial: `41748b214df2e5c93286808922b0035efaac1f8e`.
- `origin/main`: `41748b214df2e5c93286808922b0035efaac1f8e`.
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

## 4. Billing / Stripe code audit

Archivos auditados:

- `src/server/billing/billingConfiguration.ts`.
- `src/server/billing/stripeCheckout.ts`.
- `src/server/billing/stripeLiveDiagnostics.ts`.
- `src/app/billing/checkout/[plan]/start/route.ts`.
- `src/app/api/webhooks/stripe/route.ts`.
- `src/server/billing/webhooks/stripeWebhookSignature.ts`.
- `src/server/billing/webhooks/stripeWebhookPersistence.ts`.
- `src/server/billing/ledger/stripeBusinessLedgerService.ts`.
- `src/server/billing/webhooks/stripeWebhookMapper.ts`.
- `src/server/billing/admin/billingManualFulfillmentService.ts`.
- `src/config/billing.ts`.

Findings:

| Check | Resultado |
| --- | --- |
| Live requires `STRIPE_CHECKOUT_MODE=live` | OK |
| Live requires `STRIPE_LIVE_PAYMENTS_APPROVED=true` | OK |
| `STRIPE_CHECKOUT_ENABLED=false` blocks checkout before Stripe call | OK |
| Secret key mode mismatch blocks checkout | OK |
| Price ID format must start with `price_` | OK |
| Checkout session creation grants access | No |
| Checkout route redirects only to Stripe hosted checkout on success | OK |
| Webhook verifies Stripe signature | OK |
| Webhook persists events idempotently | OK |
| Webhook auto-grants entitlement | No |
| Live webhook business ledger skipped unless live approved | OK |
| Real access grant requires manual admin fulfillment | OK |
| Manual fulfillment requires paid order and explicit confirmation | OK |
| Wise automation active | No |
| Lemon active provider path | No |

## 5. Production safe-off smoke

Production routes:

| Route | Resultado |
| --- | --- |
| `/pricing` | `200` |
| `/billing/checkout/starter` | `200` |
| `/billing/checkout/professional` | `200` |
| `/billing/checkout/msp` | `200` |

Start routes:

| Route | Resultado |
| --- | --- |
| `/billing/checkout/starter/start` | `303` to `error=checkout_disabled` |
| `/billing/checkout/professional/start` | `303` to `error=checkout_disabled` |
| `/billing/checkout/msp/start` | `303` to `error=checkout_disabled` |

Interpretation:

- Production checkout remains safe-off.
- No Stripe hosted checkout was reached.
- No payment session was created from this smoke.

## 6. Stripe Dashboard live audit

Dashboard:

- Account visible: `Shiftevidence`.
- Dashboard account path observed: `acct_102Xur2ehRcYyaOr`.
- Live dashboard path observed without `/test/`.
- No KYC, tax, bank, 2FA, password or regulatory prompt was encountered during read-only audit.

Products visible in live catalog:

| Product | Amount/cadence visible | Status |
| --- | --- | --- |
| Starter Readiness | USD 490.00 | visible active product |
| Professional Assessment | USD 1,500.00 | visible active product |
| MSP Partner | USD 799.00 / month | visible active product |

Important note:

- Stripe catalog also shows duplicate/historical product entries.
- Product presence and amounts are visually confirmed, but exact current Price IDs need owner confirmation before env activation.

## 7. Account alignment check

Previously documented live Price IDs were checked visually in the same Stripe account dashboard.

Result:

| Plan | Price ID status in current dashboard account |
| --- | --- |
| Starter Readiness | not found |
| Professional Assessment | not found |
| MSP Partner | not found |

Conclusion:

- Account/Price ID alignment is not confirmed.
- This is a blocker.
- This likely explains the earlier production error `stripe_price_invalid`.

Decision:

- Do not load live env.
- Do not set `STRIPE_CHECKOUT_MODE=live`.
- Do not set `STRIPE_CHECKOUT_ENABLED=true`.
- Do not set `STRIPE_LIVE_PAYMENTS_APPROVED=true`.
- Do not redeploy for Stripe live.
- Do not attempt hosted checkout live.

## 8. Vercel Production env

Target:

- Project: `shiftevidence`.
- Environment: Production.

Actions:

- No env values were pulled.
- No env values were printed.
- No live env was loaded or changed in this hito.

Observed runtime behavior:

- Checkout remains disabled in production.
- Start routes return `checkout_disabled`.

Final safe-off status:

| Setting category | Estado final |
| --- | --- |
| Checkout enabled | false by runtime behavior |
| Live payment approval | not enabled |
| Checkout mode live | not activated |
| Live secret loaded/changed in this hito | no |
| Live Price IDs loaded/changed in this hito | no |
| Webhook secret loaded/changed in this hito | no |

## 9. Webhook live readiness

Stripe Dashboard live webhook:

- Endpoint name: `energetic-triumph`.
- Endpoint URL: `https://shiftevidence.com/api/webhooks/stripe`.
- Status: active.
- Listening events: 6.

Events configured:

- `checkout.session.completed`.
- `customer.subscription.created`.
- `customer.subscription.deleted`.
- `customer.subscription.updated`.
- `invoice.paid`.
- `invoice.payment_failed`.

Code readiness:

- Signature verification exists.
- Persistence exists.
- Idempotency exists.
- Business ledger processing exists.
- Entitlement grant remains manual, not automatic.

Webhook smoke:

- Deferred.
- No live webhook events were sent in this hito.

## 10. Redeploy / hosted checkout smoke

Redeploy:

- No.

Reason:

- Account/Price ID alignment failed.
- Owner approval for live env/redeploy was not requested because the blocker was found first.

Hosted checkout live smoke:

- Not attempted.

Reason:

- Safe-off remained active.
- Live env was not loaded.
- Price alignment blocker must be resolved first.

## 11. Admin / DB safety

No DB writes were made by Codex in this hito.

Expected safety state:

- No paid orders from this hito.
- No grants.
- No entitlements.
- No mark paid.
- No invoice sent state.
- No refunds/cancellations.
- No webhook live fulfillment.

## 12. Logs

Vercel logs reviewed for the current deployment:

- Error logs: none.
- 500 logs: none.

No observed:

- Stripe errors in logs during this hito.
- Origin errors.
- Live payment completed.
- Secret leakage.

## 13. Rollback

Current state:

- No rollback needed because live checkout was not enabled.

If a future hito enables live checkout and smoke fails:

- Set `STRIPE_CHECKOUT_ENABLED=false`.
- Set `STRIPE_LIVE_PAYMENTS_APPROVED=false`.
- Redeploy production controlled only if env changes require runtime refresh.
- Do not promote.
- Do not touch DNS.
- Do not modify custom domains.

## 14. Security review

Confirmed:

- No payment.
- No card entered.
- No live payment confirmation.
- No grants.
- No entitlements reales.
- No mark paid.
- No DNS.
- No Hostinger.
- No DB destructive.
- No migrations.
- No `db push`.
- No `vercel env pull`.
- No secrets in docs.
- No secrets in git.
- No webhook signing secret revealed.

## 15. Estado final

| Area | Estado final |
| --- | ---: |
| STRIPE-LIVE-READINESS-1 | 72% |
| Billing readiness | 99% |
| Stripe live readiness | 72% |
| Production/cutover readiness | 98% |
| General technical | 99% |

Status:

- Blocked safely by Price ID/account alignment.

## 16. Follow-up: STRIPE-LIVE-PRICE-ALIGNMENT-FIX-1

Fecha: 2026-06-05

El bloqueo de Price ID/account alignment fue corregido a nivel de discovery visual en Stripe Dashboard.

Resultado:

- Cuenta live auditada: `Shiftevidence`.
- Account path visible: `acct_102Xur2ehRcYyaOr`.
- Starter Readiness current Price ID: `price_...dJwz`.
- Professional Assessment current Price ID: `price_...krvY`.
- MSP Partner current Price ID: `price_...7iAr`.
- Montos/currency/cadencia: OK.
- Los Price IDs historicos de `STRIPE-2B` quedan stale/no alineados.
- Vercel env: unchanged.
- Checkout live: not enabled.
- Production safe-off: preserved.

Documento de cierre:

- `docs/stripe-live-price-alignment-fix-1.md`.

## 17. Next hito

Recommended:

- `STRIPE-LIVE-HOSTED-CHECKOUT-SMOKE-1`.

Then:

- `DNS-HOSTINGER-CUTOVER-PREP-1`.
- `PRODUCTION-CUTOVER-CONTROLLED`.

## 18. Follow-up: STRIPE-LIVE-HOSTED-CHECKOUT-SMOKE-1

Fecha: 2026-06-05

El hito de hosted checkout live fue ejecutado con aprobacion explicita del owner y quedo completo.

Resultado:

- Vercel Production `shiftevidence` fue configurado temporalmente con los Price IDs live alineados y gates live.
- Redeploy productivo controlado: `dpl_AnX2qEidHNGToMszj6dtCPUii3s1`.
- Starter redirigio a Stripe hosted checkout live y mostro USD 490.00.
- Professional redirigio a Stripe hosted checkout live y mostro USD 1,500.00.
- MSP redirigio a Stripe hosted checkout live y mostro USD 799.00 mensual.
- No se ingreso tarjeta.
- No se completo pago.
- No se disparo webhook intencional.
- No se creo grant ni entitlement.
- Safe-off fue restaurado inmediatamente y redeployado: `dpl_6qMf4WZ3nC7s6GpwWQgbbreUyfQG`.
- Start routes finales vuelven a `checkout_disabled`.

Documento de cierre:

- `docs/stripe-live-hosted-checkout-smoke-1.md`.

Nuevo proximo hito recomendado:

- `STRIPE-LIVE-PAYMENT-FINAL-GATE-1`.

