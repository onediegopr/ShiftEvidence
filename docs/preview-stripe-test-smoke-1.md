# Preview Stripe Test Smoke

## Status
- Preview URL validated: `https://infrashift-r2-recovery-qwf85ubml-shift-evidence.vercel.app`
- Preview Protection remains active for unauthenticated access.
- Authenticated Vercel browser session could open the preview and inspect billing routes.

## Variables confirmed in Preview scope
- `STRIPE_CHECKOUT_ENABLED`
- `STRIPE_CHECKOUT_MODE`
- `STRIPE_LIVE_PAYMENTS_APPROVED`
- `STRIPE_SECRET_KEY`
- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_PROFESSIONAL_PRICE_ID`
- `STRIPE_MSP_PRICE_ID`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `PREVIEW_TRUSTED_ORIGINS`
- `ADMIN_EMAILS`

## Variables not observed in the Preview env list
- `STRIPE_WEBHOOK_SECRET`

## Checkout state
- Safe-off.
- Billing checkout pages render a non-live guard state and do not create a payment session.
- No live payments were enabled or exercised.

## Routes probed
### Checkout
- `/billing/checkout/starter`
- `/billing/checkout/professional`
- `/billing/checkout/msp`

### Bank transfer
- `/billing/bank-transfer/starter`
- `/billing/bank-transfer/professional`
- `/billing/bank-transfer/msp`

### Admin billing
- `/dashboard/admin/billing`

## Results
- Checkout routes returned a safe guard state with `Stripe checkout not configured`.
- Bank transfer routes rendered the manual invoice flow.
- Admin billing redirected to `/sign-in` without exposing a 500.
- No live payment flow was triggered.
- No order was created.
- No entitlements were changed.

## What remains pending
- If a real Stripe test checkout flow is desired, the Preview needs an explicit test-mode configuration update and a separate smoke pass.
- If admin billing should be exercised past auth, an authenticated admin session is needed.

## Safety notes
- No production deploy.
- No DNS.
- No live payments.
- No production database changes.
- No secrets were printed.
- No real customer data was used.
