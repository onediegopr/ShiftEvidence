# BILLING-4A - Stripe Test Env Configuration + Checkout Smoke

Date: 2026-06-01

## 1. Executive Summary

BILLING-4A configured Stripe test-mode runtime settings in Hostinger and verified production checkout smoke for the three supported card checkout plans.

Status: COMPLETO.

Verdict: Stripe test checkout is operational in production test mode. Live payments remain disabled and no real payment was attempted.

## 2. Scope Completed

- Stripe test products/prices created for the supported checkout plans.
- Stripe webhook endpoint created for the production webhook URL.
- Hostinger runtime env vars configured for Stripe test mode.
- Controlled redeploy verified on Hostinger.
- Public checkout routes smoke-tested in production.
- Stripe invalid-signature webhook smoke-tested.
- Admin billing console verified for provider status and safe diagnostics.

No schema, migration, DB push, live payment, real card, auto-grant, auto-revoke, Lemon activation, Wise call or Stripe live mode was performed.

## 3. Stripe Test Products

Configured products/prices:

- Starter Readiness: USD 490, one-time.
- Professional Assessment: USD 1,500, one-time.
- MSP Partner: USD 399/month, recurring monthly.

All Stripe product and price configuration was created in Stripe test mode.

## 4. Hostinger Runtime Env

Verified by name/presence only, without exposing values:

- `STRIPE_SECRET_KEY`: present, test key.
- `STRIPE_WEBHOOK_SECRET`: present.
- `STRIPE_STARTER_PRICE_ID`: present.
- `STRIPE_PROFESSIONAL_PRICE_ID`: present.
- `STRIPE_MSP_PRICE_ID`: present.
- `STRIPE_CHECKOUT_MODE`: `test`.
- `NEXT_PUBLIC_APP_URL`: present.

Safety checks:

- `sk_live_`: not present.
- `STRIPE_CHECKOUT_MODE=live`: not present.
- Secrets were not documented.

## 5. Production Deploy

Hostinger production deployment was verified on branch `main` with commit:

- `f85debf feat: add Stripe billing foundation and decommission Lemon checkout`

Deployment status: completed.

Redeploy/restart: performed through Hostinger after env configuration and observed as completed.

## 6. Public Route Smoke

Production GET checks:

- `/`: 200.
- `/pricing`: 200.
- `/support`: 200.
- `/billing/checkout/starter`: 200.
- `/billing/checkout/professional`: 200.
- `/billing/checkout/msp`: 200.

No public Lemon checkout CTA was detected on `/pricing` or `/support`.

## 7. Checkout Start Smoke

Production POST checks:

- `/billing/checkout/starter/start`: 303 to `checkout.stripe.com`.
- `/billing/checkout/professional/start`: 303 to `checkout.stripe.com`.
- `/billing/checkout/msp/start`: 303 to `checkout.stripe.com`.

Stripe Checkout visual smoke:

- Starter Readiness: Stripe Checkout test mode, USD 490.00.
- Professional Assessment: Stripe Checkout test mode, USD 1,500.00.
- MSP Partner: Stripe Checkout test mode, USD 399.00/month.

No card was entered and no payment was completed.

## 8. Webhook Smoke

Endpoint:

- `/api/webhooks/stripe`

Invalid-signature smoke:

- Result: 401.
- Error: `invalid_signature`.
- Expected behavior: invalid payload rejected before processing.

No valid signed production webhook payload was submitted in this hito. Business ledger mapping, payment persistence and entitlement changes remain out of scope.

## 9. Admin Billing Console

Admin console verified at:

- `/dashboard/admin/billing`

Observed safe status:

- Stripe: configured test.
- Stripe secret key: presence only.
- Stripe webhook secret: presence only.
- Stripe price IDs: presence only.
- Checkout mode: Test.
- Checkout enabled/active: yes.
- Live payments: OFF.
- Webhooks: ON.
- Ledger: ON.
- Entitlements automaticos: OFF.
- Lemon: legacy/rejected/disabled.
- Wise: manual invoice.

No secret values were visible in the admin UI.

## 10. Stripe MCP Status

No Stripe MCP/plugin/tool was available in the current Codex session, and no installable Stripe plugin was listed by the available tool discovery flow.

Operational workaround used:

- Stripe dashboard/browser session for account operations.
- Stripe test API calls only for setup, using the test secret in-memory and never writing it to files or docs.

Follow-up: add a Stripe MCP/connector later if one becomes available for this Codex environment.

## 11. Security Boundary

Confirmed:

- no live payments;
- no `sk_live_`;
- no real card;
- no completed checkout;
- no auto-grants;
- no auto-revokes;
- no Lemon checkout activation;
- no Wise API calls;
- no Stripe secrets in repository/docs/UI;
- no Hostinger unrelated env changes intentionally made.

## 12. Remaining Risks

- Stripe valid webhook delivery from Stripe dashboard was not sent in this hito.
- Stripe event-to-business-ledger mapping remains future work.
- Orders/payments/subscriptions persistence for Stripe remains future work.
- Entitlements remain manual/admin controlled.
- Live mode requires a separate go-live gate.

## 13. Next Step

Recommended next hito:

- BILLING-4B - Stripe webhook delivery smoke and event persistence, test mode only.

Alternative:

- BILLING-4C - Stripe event-to-ledger mapping, without auto-grants.
