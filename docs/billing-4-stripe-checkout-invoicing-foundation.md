# BILLING-4 - Stripe Checkout + Invoicing Foundation + Lemon Decommission

Date: 2026-06-01

## 1. Executive Summary

BILLING-4 moves the public checkout foundation from Lemon Squeezy to Stripe while keeping fulfillment manual and keeping historical Lemon ledger data intact.

Status: COMPLETO at code/documentation level after local validation.

Decision applied:

- Stripe is the primary configurable card checkout provider.
- Wise/bank transfer remains manual invoice/reference only.
- Lemon Squeezy is legacy-disabled after provider rejection of the offering as services.
- Paddle, FastSpring and 2Checkout are not used.

No live payments were enabled. No Hostinger/env changes were made. No production deploy was performed. No schema or migration was added.

## 2. Provider Boundary

Stripe:

- public checkout routes use Stripe Checkout when server-side config is complete;
- `STRIPE_CHECKOUT_MODE=live` is intentionally blocked by the app in this hito;
- missing or incomplete env vars degrade to invoice/support fallback;
- webhook endpoint captures verified Stripe events as `BillingEvent` only.

Wise/bank transfer:

- remains manual invoice/reference;
- no Wise API calls;
- no transfers.

Lemon Squeezy:

- no longer creates new checkout sessions;
- historical webhook/ledger code remains for past records and audit continuity;
- historical Lemon data is not deleted.

## 3. Env Strategy

Stripe placeholders are optional for build:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_PROFESSIONAL_PRICE_ID`
- `STRIPE_MSP_PRICE_ID`
- `STRIPE_CHECKOUT_MODE`
- `NEXT_PUBLIC_APP_URL`

No env values are documented or committed. Live mode must remain unavailable until a separate owner-approved go-live hito.

## 4. Checkout Behavior

Routes:

- `/billing/checkout/starter`
- `/billing/checkout/professional`
- `/billing/checkout/msp`

POST start routes call the Stripe checkout service only. If Stripe is incomplete, disabled, invalid, or set to live mode, the route redirects back to the checkout page with a safe error and creates no order, payment, webhook, grant, or entitlement.

## 5. Stripe Webhook Foundation

Endpoint:

- `/api/webhooks/stripe`

Behavior:

- reads raw body with `request.text()`;
- verifies `stripe-signature` using HMAC SHA-256 and `STRIPE_WEBHOOK_SECRET`;
- rejects invalid signatures before parsing payload;
- rejects invalid JSON or missing event identity without persisting raw body;
- persists only `BillingEvent`.

`BillingEvent.status=processed` means the event was technically captured/persisted. It does not mean an order, payment, subscription or entitlement was processed at business level.

Out of scope:

- no `BillingOrder` creation;
- no `BillingPayment` creation;
- no `BillingSubscription` creation;
- no `BillingEntitlementGrant` creation;
- no auto-grants;
- no auto-revokes.

## 6. Admin Visibility

The admin billing console now treats Stripe as the primary configurable provider and shows only presence/absence diagnostics for server-side settings.

It also keeps Lemon Squeezy visible as legacy/rejected/disabled so historical ledger records remain understandable.

## 7. Security

- no secrets in UI;
- no secrets in docs;
- no raw webhook body in logs;
- no provider API calls except Stripe Checkout creation when explicitly configured in test mode;
- no Lemon API calls for new checkout;
- no Wise API calls;
- no Stripe live activation;
- no DB mutation from webhook beyond `BillingEvent`;
- no entitlement automation.

## 8. Rollback

Code rollback:

- revert the BILLING-4 commit.

Operational rollback:

- keep Stripe env vars absent/disabled;
- public checkout pages degrade to invoice/support;
- historical Lemon records remain untouched.

## 9. Next Step

Recommended next hito:

- BILLING-4-PROD-SMOKE after deployment, using Stripe test mode only;
- then Stripe event-to-ledger mapping in a separate hito if needed.
