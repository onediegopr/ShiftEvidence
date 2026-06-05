# Stripe Checkout Roadmap

Status: roadmap and boundary document. This is not a go-live approval.

## Current State

Stripe checkout routes and server-side session creation exist. Test-mode can be enabled by runtime configuration with test keys and Price IDs. Missing configuration falls back safely.

Webhook infrastructure exists behind signature verification. It can persist supported Stripe billing events, but it does not grant access automatically.

## Near-Term Test-Mode Work

- Test Price IDs in Stripe for Starter, Professional, and MSP are verified in Preview.
- Test-mode runtime values are configured in Vercel Preview outside source control.
- Public checkout routes and hosted Stripe Checkout test redirects are smoke-tested without completing payments.
- Confirm webhook event persistence in a test-only flow if explicitly approved.
- Keep fulfillment manual during all tests.

## Future Live Readiness Gate

Live mode requires a separate hito and both runtime gates:

- `STRIPE_CHECKOUT_MODE=live`
- `STRIPE_LIVE_PAYMENTS_APPROVED=true`

Before any live smoke, confirm:

- Price IDs match plan amount, currency, cadence, and active state.
- Public origin points to the approved production domain.
- Webhook endpoint is configured with a valid secret.
- Admin runbook for manual reconciliation is current.
- Rollback plan is documented.

## Out Of Scope

- No live checkout in this hito.
- No automatic grants.
- No automatic financial reconciliation.
- No bank transfer automation.
- No environment or dashboard changes in source control.

## STRIPE-2 Result

Date: 2026-06-02.

The first STRIPE-2 attempt completed local preflight and fallback smoke. Stripe connector access required authentication, so product and Price ID creation stayed pending.

Observed local fallback:

- Checkout pages load for Starter, Professional, and MSP.
- Checkout start routes redirect safely to the checkout page with `error=not_configured`.
- No Stripe hosted checkout URL is generated while server-side Stripe env is incomplete.
- Bank transfer invoice routes remain available.
- Admin billing remains non-public without an admin session.

Next Stripe-specific work:

- Authenticate to Stripe test mode through an approved method.
- Create or verify the three test-mode products and Price IDs.
- Configure test-mode runtime env outside source control.
- Redeploy only if the runtime requires it and the hito explicitly approves it.
- Repeat checkout smoke and stop at the hosted Stripe checkout page without completing payment.

## STRIPE-2A Result

Date: 2026-06-02.

The STRIPE-2A attempt stopped before any Stripe changes because authentication and test-mode status could not be confirmed:

- Stripe connector returned authentication required.
- In-app browser setup could not initialize in this Codex session.
- No product or price was created.
- No live resource was touched.
- No runtime env was configured.

Next required hito remains authentication-first: confirm Stripe test mode, then create or verify Starter, Professional, and MSP test Price IDs.

## STRIPE-2B Live Price IDs

Date: 2026-06-02.

The owner chose to proceed with production Stripe products/prices instead of test-mode prices. The following live Price IDs were captured from manual Stripe Dashboard work:

| Plan | Product ID | Price ID | Mode | Amount | Cadence | Payment Link |
| --- | --- | --- | --- | ---: | --- | --- |
| Starter Readiness | `prod_UclYxjpqT92sGY` | `price_1TdW1r2ehRcYyaOreX1g3zr3` | live | USD 490 | one-time | active |
| Professional Assessment | `prod_UclcUgR7N174OV` | `price_1TdW4x2ehRcYyaOrxvclbwhh` | live | USD 1,500 | one-time | active |
| MSP Partner | `prod_Uclds2EatL0OHr` | `price_1TdW6Q2ehRcYyaOruJVd7Lup` | live | USD 399/month | monthly recurring | active |

Important boundary:

- The live Payment Links are active outside the application.
- The application runtime has not been configured with these live Price IDs.
- No Hostinger env, redeploy, checkout smoke, payment, webhook smoke, grant, unlock, Wise action, or database change was performed.
- Live app checkout still requires a separate controlled runtime hito with explicit approval.

Next required hito: configure live runtime env under the existing double gate, validate provider status, and smoke only to the Stripe hosted checkout page without completing payment unless a separate payment hito approves it.

## STRIPE-LIVE-2 Runtime Gate Attempt

Date: 2026-06-02.

After the owner configured live runtime variables outside source control, production public routes loaded with 200 responses for checkout, pricing, and bank transfer pages. Checkout start POST requests for Starter, Professional, and MSP did not reach Stripe hosted checkout; each route redirected safely back to the app with `error=stripe_price_invalid`.

No payment was completed, no card data was entered, no grant or entitlement was created, no Wise action was performed, and no secret was stored. The likely next check is runtime Price ID and `STRIPE_SECRET_KEY` account alignment. See `docs/billing-stripe-live-runtime-gate.md`.

## STRIPE-LIVE-PRICE-ALIGNMENT-FIX-1 Result

Date: 2026-06-05.

Stripe Dashboard live account `Shiftevidence` was audited read-only. The Price IDs captured in `STRIPE-2B` are now considered stale/no aligned because they were not found in the current live account. Current aligned live Price IDs were identified visually from the active product tariff rows:

| Plan | Product | Price ID | Amount | Cadence | Status |
| --- | --- | --- | ---: | --- | --- |
| Starter Readiness | `prod_...hYNS` | `price_...dJwz` | USD 490 | one-time | active/default |
| Professional Assessment | `prod_...cuGY` | `price_...krvY` | USD 1,500 | one-time | active/default |
| MSP Partner | `prod_...Uzqw` | `price_...7iAr` | USD 399/month | monthly recurring | active/default |

No Vercel env was changed, no live checkout was enabled, no payment was attempted, no webhook event was sent, and no redeploy was performed. Production start routes remain safe-off with `checkout_disabled`.

Next required hito: load the aligned live Price IDs only under explicit approval, perform a controlled redeploy if needed, and smoke only to Stripe hosted checkout without completing payment.

## STRIPE-LIVE-HOSTED-CHECKOUT-SMOKE-1 Result

Date: 2026-06-05.

With explicit owner approval, Vercel Production for `shiftevidence` was temporarily configured with the aligned live Price IDs and the double live checkout gate, then redeployed from CLI for a controlled hosted-checkout-only smoke.

Result:

| Plan | Hosted checkout | Amount visible | Cadence |
| --- | --- | ---: | --- |
| Starter Readiness | OK | USD 490.00 | one-time |
| Professional Assessment | OK | USD 1,500.00 | one-time |
| MSP Partner | OK | USD 399.00 | monthly recurring |

No card data was entered, no payment was completed, no webhook was intentionally triggered, no grant or entitlement was created, and no DNS/Hostinger/custom domain change was made.

After the smoke, Production was restored to safe-off:

- `STRIPE_CHECKOUT_ENABLED=false`.
- `STRIPE_LIVE_PAYMENTS_APPROVED=false`.
- `STRIPE_CHECKOUT_MODE=test`.

The final production start routes returned `303` with `checkout_disabled` for Starter, Professional, and MSP. See `docs/stripe-live-hosted-checkout-smoke-1.md`.

## STRIPE-TESTMODE-PRICE-SMOKE Result

Date: 2026-06-05.

Stripe Dashboard test mode was confirmed and the three checkout-eligible products/prices were verified:

- Starter Readiness: USD 490 one-time.
- Professional Assessment: USD 1,500 one-time.
- MSP Partner: USD 399/month.

Vercel Preview branch `preview` was configured with test-mode checkout values outside source control, redeployed as Preview, and the stable Preview alias was pointed to the new Preview deployment. The three checkout pages returned 200 in test-ready state and the three start routes returned 303 redirects to Stripe hosted checkout test pages.

No payment was completed, no card details were entered, no webhook was configured or triggered, no paid state was created, no grant or entitlement was created, no Wise action was performed, no Production env was touched, and no secret was stored in git. See `docs/stripe-testmode-price-smoke-preview.md`.
