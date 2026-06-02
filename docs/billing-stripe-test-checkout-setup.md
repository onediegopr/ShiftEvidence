# Stripe Test Checkout Setup

Status: local configuration guide for controlled test-mode checkout.

## Scope

Stripe is the only card checkout provider for public checkout routes:

- `/billing/checkout/starter`
- `/billing/checkout/professional`
- `/billing/checkout/msp`

The checkout service creates hosted Stripe Checkout sessions server-side only when the runtime configuration is complete. Missing configuration falls back to a safe not-configured state and does not create orders, payments, grants, unlocks, or entitlements.

## Required Runtime Keys

Use placeholders only. Do not store real secrets in docs or source control.

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_PROFESSIONAL_PRICE_ID`
- `STRIPE_MSP_PRICE_ID`
- `STRIPE_CHECKOUT_MODE`
- `STRIPE_LIVE_PAYMENTS_APPROVED`
- `STRIPE_CHECKOUT_ENABLED`
- `NEXT_PUBLIC_APP_URL`
- `BETTER_AUTH_URL`

## Test-Mode Gate

For test-mode checkout readiness:

- `STRIPE_CHECKOUT_MODE` is unset or `test`.
- `STRIPE_SECRET_KEY` uses a `sk_test_` key.
- The selected plan has its server-side Price ID.
- `STRIPE_CHECKOUT_ENABLED` is not `false`.

The build does not require these variables. If any required server-side value is missing, the route remains available but checkout is not started.

## Live Gate

Live checkout requires both:

- `STRIPE_CHECKOUT_MODE=live`
- `STRIPE_LIVE_PAYMENTS_APPROVED=true`

If either gate is missing, live checkout stays blocked. A test key, unknown key prefix, or restricted live key in the wrong mode blocks the request before any Stripe call.

## Plan Mapping

- Starter Readiness: one-time payment, `STRIPE_STARTER_PRICE_ID`, USD 490.
- Professional Assessment: one-time payment, `STRIPE_PROFESSIONAL_PRICE_ID`, USD 1,500.
- MSP Partner: subscription, `STRIPE_MSP_PRICE_ID`, from USD 399/month.

The server derives amount and mode from billing config, not from the client.

## Current Boundary

- No real payment is completed in this hito.
- No Stripe Dashboard changes are part of this hito.
- No production environment changes are part of this hito.
- No automatic fulfillment is active.
- Webhook handling can persist billing events when configured, but it does not grant assessment access.
