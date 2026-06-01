# BILLING-3B/3C Webhook Secret + Production Smoke

Date: 2026-06-01

## 1. Executive Summary

Status: PARTIAL.

The Lemon Squeezy webhook was configured in test mode and the server-side webhook secret was added to Hostinger. Hostinger applied the env change and restarted/redeployed the application successfully.

The final delivery smoke is still pending because the Lemon dashboard did not expose a visible "Send test event" / "Test webhook" action in the available UI, and this hito explicitly disallowed sending a synthetic signed POST directly to production when Lemon test delivery is not available.

No live payment, checkout, card, webhook business processing, order, payment, subscription, entitlement grant, refund automation, Wise action, Stripe action, schema change, or migration was performed.

## 2. Git And Production Baseline

Git baseline:

- Branch: `main`.
- `main` was synchronized with `origin/main` before operational changes.
- Working tree was clean except for the existing untracked logo PNG files.

Production route checks:

- `GET https://shiftevidence.com/api/webhooks/lemon`: `405 Method Not Allowed`.
- `GET https://shiftevidence.com/dashboard/admin/billing` without session: `307` to `/sign-in`.

## 3. Production Ledger Status

Neon production target:

- Project: InfraShift.
- Branch: `production / br-raspy-morning-ap11hfm6`.
- Database: `neondb`.

BILLING-3A migration:

- `20260531170000_billing_3a_ledger_foundation`: applied.
- `finished_at`: `2026-06-01T07:45:55.176Z`.
- `rolled_back_at`: null.
- `logs`: null.

Billing row counts before webhook smoke:

- `BillingEvent`: 0
- `BillingOrder`: 0
- `BillingPayment`: 0
- `BillingSubscription`: 0
- `BillingEntitlementGrant`: 0

Billing row counts after this hito:

- `BillingEvent`: 0
- `BillingOrder`: 0
- `BillingPayment`: 0
- `BillingSubscription`: 0
- `BillingEntitlementGrant`: 0

No event was inserted because no Lemon test delivery was sent.

## 4. Hostinger Env Readiness

Verified by name only, without copying or printing secret values:

- `LEMON_SQUEEZY_STORE_ID`: present.
- `LEMON_SQUEEZY_API_KEY`: present.
- `LEMONSQUEEZY_API_KEY`: present.
- `LEMON_STARTER_VARIANT_ID`: present.
- `LEMON_PROFESSIONAL_VARIANT_ID`: present.
- `LEMON_MSP_VARIANT_ID`: present.
- `LEMON_SQUEEZY_CHECKOUT_MODE`: present.
- `NEXT_PUBLIC_APP_URL`: present.
- `BETTER_AUTH_URL`: present.
- `DATABASE_URL`: present.
- `LEMON_SQUEEZY_WEBHOOK_SECRET`: present after this hito.

Hostinger result:

- Env changes applied.
- Application restart/redeploy triggered by Hostinger.
- Deployment completed.
- No secret value was documented.

## 5. Lemon Webhook Configuration

Webhook URL:

- `https://shiftevidence.com/api/webhooks/lemon`

Mode:

- Lemon dashboard displayed test mode for webhooks.
- Live mode was not enabled.

Configured events:

- `order_created`
- `order_refunded`
- `subscription_created`
- `subscription_updated`
- `subscription_cancelled`
- `subscription_payment_success`
- `subscription_payment_failed`

Signing secret:

- Configured in Lemon.
- Configured in Hostinger as `LEMON_SQUEEZY_WEBHOOK_SECRET`.
- Secret value was not saved in docs or git.
- The final operational secret was rotated during setup and then re-applied to both Lemon and Hostinger.

## 6. Test Delivery

Result: pending / blocked.

Reason:

- No visible Lemon "Send test event" / "Test webhook" action was available in the dashboard UI inspected during this hito.
- The hito rules explicitly said not to send a synthetic signed POST to production if Lemon test delivery was not available.

Therefore:

- No test event was sent.
- No checkout was started.
- No purchase was completed.
- No card was used.
- No manual BillingEvent was inserted.

## 7. Admin Billing Console

Unauthenticated production behavior:

- `/dashboard/admin/billing` redirects to `/sign-in`.

Authenticated admin smoke:

- Pending.
- No admin session was available in the in-app browser.

Expected after a real Lemon test delivery:

- Lemon provider card should show webhook secret present.
- Ledger preview should show the recent `BillingEvent`.
- `processed` should render as `Capturado`.
- UI should continue clarifying that `Capturado` means technically captured/persisted only, not payment processed, order created, or access granted.

## 8. Security

Confirmed:

- No live payments.
- No checkout payment.
- No card usage.
- No DB mutation except Hostinger runtime env configuration outside the DB.
- No manual billing rows.
- No schema change.
- No migration.
- No Lemon API key printed.
- No webhook secret committed.
- No raw payload persisted.
- No raw file content touched.
- No orders/payments/subscriptions/grants created.
- Logo PNG files remained untracked and out of scope.

## 9. Remaining Risks

- Lemon test delivery is still pending.
- `BillingEvent` persistence through real Lemon delivery is not yet proven in production.
- Admin console visibility of a recent webhook event is pending.
- Webhook retry/error visibility should be checked once a delivery exists.
- Orders, payments, subscriptions, grants, refunds, and reconciliation remain intentionally out of scope until later BILLING-3 milestones.

## 10. Next Step

Recommended next hito:

- BILLING-3B-TEST-DELIVERY-CLOSURE: use a Lemon dashboard test delivery if/when available, or explicitly authorize a controlled synthetic signed production POST if the product owner accepts that route.

Do not proceed to BillingOrder/BillingPayment/BillingSubscription/BillingEntitlementGrant processing until BillingEvent delivery is proven end-to-end.
