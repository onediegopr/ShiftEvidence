# Stripe And Wise Payment Model

Status: current billing model for card checkout and manual invoice requests.

## Providers

Stripe is the card checkout provider. Wise is used only as a manual bank transfer reference inside the invoice request workflow.

## Stripe Model

Stripe checkout is server-side and plan-driven:

- Starter and Professional use one-time Checkout sessions.
- MSP uses a subscription Checkout session.
- Metadata includes provider, plan id, plan slug, and public checkout source.
- Success and cancel URLs are built from a sanitized public origin.

Stripe checkout does not create internal paid orders, payments, unlocks, grants, or assessment entitlements at checkout creation time.

## Wise Model

Wise remains manual:

- Public path: `/billing/bank-transfer/[plan]`.
- The user submits a bank transfer invoice request.
- Admin reviews the request and can move it through manual states.
- No Wise transfers, recipients, balance reads, or financial automation are part of the active product.

## Fulfillment Model

Fulfillment is manual. Payment evidence and account matching must be reviewed by an admin before any access action is considered through the separate approved process.

## Safety Rules

- No live payments without an explicit separate approval gate.
- No auto-grants.
- No assessment entitlement writes from checkout creation.
- No sensitive bank details in public UI.
- No real secrets in source control or docs.

## STRIPE-2 Verification

Date: 2026-06-02.

Current outcome:

- Stripe test-mode products and Price IDs were not created or verified because Stripe connector access required authentication.
- Runtime env was not changed locally or in production.
- Local checkout fallback was verified for Starter, Professional, and MSP.
- Each checkout start route returned a safe `not_configured` redirect with incomplete Stripe env.
- Bank transfer routes for Starter, Professional, and MSP returned 200.
- Admin billing stayed protected with a 307 redirect when no admin session was present.

No payment, live mode, webhook smoke, Wise API action, grant, unlock, or assessment entitlement action was performed.
