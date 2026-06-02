# Stripe Checkout Roadmap

Status: roadmap and boundary document. This is not a go-live approval.

## Current State

Stripe checkout routes and server-side session creation exist. Test-mode can be enabled by runtime configuration with test keys and Price IDs. Missing configuration falls back safely.

Webhook infrastructure exists behind signature verification. It can persist supported Stripe billing events, but it does not grant access automatically.

## Near-Term Test-Mode Work

- Create test Price IDs in Stripe for Starter, Professional, and MSP.
- Configure test-mode runtime placeholders outside source control.
- Smoke public checkout routes without completing real payments.
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
