# Stripe Live Runtime Gate

Date: 2026-06-02.

## Scope

This record covers the first controlled runtime gate after the owner configured Stripe live environment variables outside source control.

Hard boundaries kept:

- No payment was completed.
- No card data was entered.
- No manual payment was created.
- No grant, unlock, auto-entitlement, or `AssessmentEntitlement` change was made.
- No Wise transfer, recipient, balance check, or automation was used.
- No database migration, `prisma db push`, reset, destructive query, or manual data write was performed.
- No Payment Link was touched.
- No Hostinger change was made by Codex in this gate.
- No Stripe secret key or webhook secret was printed or stored.

## Public Route Smoke

The following production routes loaded successfully:

| Route | Result |
| --- | --- |
| `/billing/checkout/starter` | 200 |
| `/billing/checkout/professional` | 200 |
| `/billing/checkout/msp` | 200 |
| `/billing/bank-transfer/professional` | 200 |
| `/pricing` | 200 |

Observed checks:

- No Lemon copy was present in the checked responses.
- No `0.0.0.0` origin was present.
- Wise/manual invoice copy remained available.

## Checkout Start Smoke

The production checkout start routes were tested with POST requests and stopped before any hosted payment form or payment attempt.

| Plan | Route | Result |
| --- | --- | --- |
| Starter Readiness | `/billing/checkout/starter/start` | 303 back to app with `error=stripe_price_invalid` |
| Professional Assessment | `/billing/checkout/professional/start` | 303 back to app with `error=stripe_price_invalid` |
| MSP Partner | `/billing/checkout/msp/start` | 303 back to app with `error=stripe_price_invalid` |

Result: live checkout did not reach Stripe hosted checkout. The failure is safe and occurs before payment.

## Interpretation

The app passed the earlier local gates for configured checkout well enough to call Stripe, but Stripe rejected the configured Price ID for every plan.

Most likely causes to check outside source control:

- Price IDs were copied with an extra character or wrong value.
- Runtime env is using live Price IDs from a different Stripe account than `STRIPE_SECRET_KEY`.
- Runtime env still has old or placeholder Price IDs.
- The live secret key belongs to a different account or restricted context that cannot access these prices.
- A redeploy/runtime refresh did not fully apply the intended variables.

The observed error is not a grant, payment, webhook, or database issue.

## Required Runtime Values To Recheck

Non-secret values expected:

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

Secret values required but not recorded here:

```text
STRIPE_SECRET_KEY=<runtime secret only>
STRIPE_WEBHOOK_SECRET=<runtime secret only>
```

## Safety Status

- Stripe hosted checkout reached: no.
- Payment completed: no.
- BillingPayment created by this smoke: no evidence; checkout did not reach hosted payment.
- BillingOrder paid by this smoke: no evidence; checkout did not reach hosted payment.
- Entitlement created: no.
- Wise touched: no.
- Lemon active: no.
- Secrets stored: no.

## Next Gate

Before retrying the smoke:

1. Verify in the runtime environment that each `STRIPE_*_PRICE_ID` value exactly matches the documented live `price_` ID.
2. Verify `STRIPE_SECRET_KEY` is a live secret key for the same Stripe account that owns the documented products/prices.
3. Confirm `STRIPE_WEBHOOK_SECRET` is configured if live payment collection is intended beyond a pre-payment smoke.
4. Redeploy or restart runtime if the platform requires it after env changes.
5. Retry only to Stripe hosted checkout and stop before payment.
