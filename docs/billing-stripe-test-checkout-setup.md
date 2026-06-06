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

## Preview Test-Mode Smoke

Date: 2026-06-05.

Status: completed in Vercel Preview.

- Stripe Dashboard test mode was confirmed.
- Starter, Professional, and MSP products/prices were verified active in test mode.
- Vercel Preview branch `preview` was configured with test-mode checkout values outside source control.
- Preview was redeployed and the stable Preview alias was pointed to the updated Preview deployment.
- `/billing/checkout/starter`, `/billing/checkout/professional`, and `/billing/checkout/msp` returned 200 in test-ready state.
- `/billing/checkout/starter/start`, `/billing/checkout/professional/start`, and `/billing/checkout/msp/start` redirected to Stripe hosted checkout test pages.
- No payment was completed.
- No webhook was configured or triggered.
- No order paid state, grant, unlock, or entitlement was created.
- No Production env was touched.

Detailed smoke record: `docs/stripe-testmode-price-smoke-preview.md`.

## Live Gate

Live checkout requires both:

- `STRIPE_CHECKOUT_MODE=live`
- `STRIPE_LIVE_PAYMENTS_APPROVED=true`

If either gate is missing, live checkout stays blocked. A test key, unknown key prefix, or restricted live key in the wrong mode blocks the request before any Stripe call.

## Plan Mapping

- Starter Readiness: one-time payment, `STRIPE_STARTER_PRICE_ID`, USD 490.
- Professional Assessment: one-time payment, `STRIPE_PROFESSIONAL_PRICE_ID`, USD 1,500.
- MSP Partner: subscription, `STRIPE_MSP_PRICE_ID`, from USD 799/month.

The server derives amount and mode from billing config, not from the client.

## STRIPE-2 Test-Mode Setup Attempt

Date: 2026-06-02.

Preflight:

- HEAD and `origin/main` were both `afcbd25`.
- Working tree was clean except the two untracked logo PNGs.
- Local `.env` had `NEXT_PUBLIC_APP_URL=http://localhost:3000` and `BETTER_AUTH_URL=http://localhost:3000`.
- Local runtime did not have `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, or the three Stripe Price IDs.

Stripe access:

- Stripe connector access required authentication.
- Stripe Dashboard was not used.
- No Stripe product was created or modified.
- No Stripe Price ID was obtained.
- No live mode resource was touched.

Required test-mode products and prices remain:

| Plan | Product | Price | Cadence | Runtime env |
| --- | --- | ---: | --- | --- |
| Starter Readiness | Starter Readiness | USD 490 | one-time | `STRIPE_STARTER_PRICE_ID` |
| Professional Assessment | Professional Assessment | USD 1,500 | one-time | `STRIPE_PROFESSIONAL_PRICE_ID` |
| MSP Partner | MSP Partner | USD 799/month | monthly | `STRIPE_MSP_PRICE_ID` |

Local fallback smoke:

- `/billing/checkout/starter`: 200.
- `/billing/checkout/professional`: 200.
- `/billing/checkout/msp`: 200.
- `/billing/checkout/starter/start`: 303 to `?error=not_configured`.
- `/billing/checkout/professional/start`: 303 to `?error=not_configured`.
- `/billing/checkout/msp/start`: 303 to `?error=not_configured`.

Result: fallback safe. No Stripe hosted checkout redirect was created because runtime config was incomplete.

## STRIPE-2A Authentication Attempt

Date: 2026-06-02.

Objective: authenticate to Stripe test mode, create or verify the three required products and Price IDs, and document non-secret IDs.

Result:

- Stripe connector search required authentication.
- In-app browser setup was attempted, but the local browser runtime could not initialize.
- Stripe Dashboard authentication could not be confirmed.
- Stripe test mode could not be confirmed.
- No Stripe product was created or modified.
- No Stripe Price ID was created, verified, captured, or documented.
- No live product, live price, payment, webhook, Hostinger env, runtime env, grant, unlock, or entitlement was touched.

Manual next step:

1. Open Stripe Dashboard using an approved authenticated session.
2. Confirm the dashboard is in test mode before any product or price action.
3. Create or verify the three products and prices listed below.
4. Capture only non-secret `prod_` and `price_` IDs.
5. Do not configure runtime env until the separate runtime env hito approves it.

Pending test-mode products and prices:

| Plan | Stripe Product | Product ID | Price ID | Mode | Amount | Cadence |
| --- | --- | --- | --- | --- | ---: | --- |
| Starter Readiness | Starter Readiness | pending | pending | test | USD 490 | one-time |
| Professional Assessment | Professional Assessment | pending | pending | test | USD 1,500 | one-time |
| MSP Partner | MSP Partner | pending | pending | test | USD 799/month | monthly |

Runtime env values pending after Price ID capture:

```text
STRIPE_STARTER_PRICE_ID=<price id>
STRIPE_PROFESSIONAL_PRICE_ID=<price id>
STRIPE_MSP_PRICE_ID=<price id>
STRIPE_CHECKOUT_MODE=test
STRIPE_LIVE_PAYMENTS_APPROVED=false
STRIPE_CHECKOUT_ENABLED=true
NEXT_PUBLIC_APP_URL=https://shiftevidence.com
BETTER_AUTH_URL=https://shiftevidence.com
```

`STRIPE_SECRET_KEY` must be loaded as a secret runtime value, never stored in docs or source control. `STRIPE_WEBHOOK_SECRET` remains pending for a separate webhook smoke.

## STRIPE-2B Live Price IDs Captured

Date: 2026-06-02.

Operator note: Stripe products and Payment Links were created manually in production mode. Payment Links were intentionally left active by owner decision. The application runtime was not configured in this hito, so the Shift Evidence app still does not create live Stripe Checkout sessions until the separate runtime gate is approved and deployed.

Live products and prices:

| Plan | Stripe Product | Product ID | Price ID | Mode | Amount | Cadence | Payment Link |
| --- | --- | --- | --- | --- | ---: | --- | --- |
| Starter Readiness | Starter Readiness | `prod_UclYxjpqT92sGY` | `price_1TdW1r2ehRcYyaOreX1g3zr3` | live | USD 490 | one-time | active |
| Professional Assessment | Professional Assessment | `prod_UclcUgR7N174OV` | `price_1TdW4x2ehRcYyaOrxvclbwhh` | live | USD 1,500 | one-time | active |
| MSP Partner | MSP Partner | `prod_Uclds2EatL0OHr` | `price_1TdW6Q2ehRcYyaOruJVd7Lup` | live | USD 799/month | monthly recurring | active |

Runtime env values for the next hito:

```text
STRIPE_STARTER_PRICE_ID=price_1TdW1r2ehRcYyaOreX1g3zr3
STRIPE_PROFESSIONAL_PRICE_ID=price_1TdW4x2ehRcYyaOrxvclbwhh
STRIPE_MSP_PRICE_ID=price_1TdW6Q2ehRcYyaOruJVd7Lup
STRIPE_CHECKOUT_MODE=live
STRIPE_LIVE_PAYMENTS_APPROVED=true
STRIPE_CHECKOUT_ENABLED=true
NEXT_PUBLIC_APP_URL=https://shiftevidence.com
BETTER_AUTH_URL=https://shiftevidence.com
```

`STRIPE_SECRET_KEY` must be loaded only as a runtime secret, never stored in docs or source control. `STRIPE_WEBHOOK_SECRET` remains pending for a separate webhook smoke. No Hostinger env, redeploy, checkout smoke, payment, grant, unlock, Wise action, or database change was performed in this documentation step.

## Current Boundary

- No real payment is completed in this hito.
- No Stripe Dashboard changes are part of this hito.
- No production environment changes are part of this hito.
- No automatic fulfillment is active.
- Webhook handling can persist billing events when configured, but it does not grant assessment access.

## STRIPE-LIVE-PRICE-ALIGNMENT-FIX-1

Date: 2026-06-05.

The live Price IDs captured in `STRIPE-2B` are now marked stale/no aligned for the current Stripe live account. The current live products and masked Price IDs were identified visually in Stripe Dashboard:

| Plan | Current Price ID | Amount | Cadence |
| --- | --- | ---: | --- |
| Starter Readiness | `price_...dJwz` | USD 490 | one-time |
| Professional Assessment | `price_...krvY` | USD 1,500 | one-time |
| MSP Partner | `price_...7iAr` | USD 799/month | monthly recurring |

No runtime env was changed in this hito. Production remains safe-off.

## STRIPE-LIVE-2 Runtime Gate Attempt

Date: 2026-06-02.

The owner configured live runtime variables outside source control and a controlled production smoke was attempted without payment. Public checkout and pricing routes returned 200, but checkout start POST requests for Starter, Professional, and MSP returned safe 303 redirects back to the app with `error=stripe_price_invalid`.

No Stripe hosted checkout page was reached, no payment was completed, no secret was stored, no grant or entitlement was created, and no Wise action was performed. Recheck exact runtime Price IDs and confirm the live secret key belongs to the same Stripe account as the documented live products/prices before retrying.

