# BILLING-5 - Stripe Event To Ledger Mapping + Manual Fulfillment

Date: 2026-06-01

## 1. Objective

Map verified Stripe test-mode webhook events into the internal billing ledger while keeping fulfillment manual/admin-only.

This hito turns the BILLING-4/4A/4B Stripe technical capture foundation into operational billing visibility:

- `checkout.session.completed` can create/update `BillingOrder`.
- One-time Starter/Professional checkout can create/update `BillingPayment` when a stable `payment_intent` exists.
- MSP subscription events can create/update `BillingSubscription` when a stable subscription id exists.
- Admin billing can see Stripe orders/payments/subscriptions in the existing ledger views.
- Access remains manual through the existing admin fulfillment flow.

## 2. Context

BILLING-4 made Stripe the primary configurable checkout provider and kept Lemon Squeezy legacy/rejected/disabled.

BILLING-4A configured Stripe test products, test price IDs and Hostinger runtime env vars.

BILLING-4B completed a Starter test checkout and verified signed Stripe webhook delivery into `BillingEvent`.

Risk found in BILLING-4B:

- duplicate replay did not duplicate rows, but it changed the original event status from `processed` to `ignored`.

BILLING-5 hardens that behavior before mapping commercial ledger records.

## 3. Schema And Migrations

Migration: NO.

The existing schema supports this hito:

- `BillingEvent` stores technical capture and idempotency.
- `BillingOrder` stores Stripe checkout session/order visibility.
- `BillingPayment` stores one-time payments when a stable provider payment id and internal order are available.
- `BillingSubscription` stores MSP subscription state.
- `BillingEntitlementGrant` remains manual/admin-created only.
- `AssessmentEntitlement` remains manual/admin-created only.

Known schema boundary:

- `BillingPayment` requires `orderId`, so subscription invoice payments are skipped unless an internal order can be safely associated. No synthetic order is invented.

## 4. Idempotency Hardening

Previous behavior:

- First valid Stripe event created `BillingEvent` as `processed`.
- Duplicate replay returned `duplicate_ignored` but updated the existing row to `ignored`.

New behavior:

- First valid Stripe event creates `BillingEvent`.
- Duplicate replay returns `duplicate_ignored`.
- Duplicate replay does not create a row.
- Duplicate replay does not mutate `status`, `processedAt` or `errorMessage` on the original event.

The historical BILLING-4B event that was already changed to `ignored` was not repaired retroactively.

## 5. Event Normalization

New mapper:

- `src/server/billing/webhooks/stripeWebhookMapper.ts`

Supported Stripe business events:

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Normalized fields include, when present:

- provider event id;
- event type;
- livemode;
- resource type/id;
- checkout session id;
- payment intent id;
- invoice id;
- subscription id;
- customer id/email;
- plan id;
- Stripe price id;
- amount/currency;
- order/payment/subscription status;
- safe warnings.

No card data or secrets are stored.

## 6. Stripe To BillingOrder

`checkout.session.completed` creates or updates `BillingOrder` using stable Stripe checkout session identity:

- `provider`: `stripe`
- `providerOrderId`: checkout session id
- `providerCheckoutId`: checkout session id
- `providerCustomerId`: Stripe customer id if present
- `planId`: metadata `plan_id`, checkout slug metadata, or Stripe Price ID fallback
- `variantId`: Stripe Price ID if present
- `amountCents`
- `currency`
- `customerEmail`
- `status`: `paid` when Stripe reports completed/paid, otherwise `pending`

Unknown plan handling:

- no crash;
- warning is attached to `BillingEvent.errorMessage`;
- order remains visible with `stripe_unknown_plan` when there is enough stable data;
- fulfillment remains ineligible because entitlement mapping does not exist for unknown plans.

## 7. Stripe To BillingPayment

For one-time Starter/Professional checkout:

- `payment_intent` is used as `providerPaymentId` when present;
- payment is associated to the internal `BillingOrder`;
- duplicate events update the existing payment rather than creating duplicates.

For invoice/subscription payments:

- payment is only created if an internal order can be safely associated;
- otherwise the event records a warning and does not invent an order.

## 8. Stripe To BillingSubscription

MSP subscription events create/update `BillingSubscription` when a stable Stripe subscription id exists.

Status mapping:

- active/trialing-style states -> `active`
- canceled/deleted -> `cancelled`
- incomplete/past_due/unpaid/payment failure -> `payment_failed`
- expired/incomplete_expired -> `expired`

Subscription cancellation or payment failure does not revoke access automatically.

## 9. Manual Fulfillment Boundary

Manual fulfillment continues to use:

- `fulfillBillingOrderManually()`

Rules:

- Webhook does not call fulfillment.
- Match does not call fulfillment.
- Checkout success URL does not call fulfillment.
- Starter grants `full_report_unlocked` only after explicit admin action.
- Professional grants `full_report_unlocked` and `pro_matrix_unlocked` only after explicit admin action.
- MSP remains ineligible for assessment entitlement grants.
- Full match is required: user, workspace and assessment.

Payment received does not automatically grant access.

## 10. Refund / Cancel / Payment Failed Boundary

BILLING-5 does not implement automatic refund/revoke behavior.

Boundaries:

- `invoice.payment_failed` can mark subscription/payment risk.
- subscription cancellation can mark subscription state.
- no auto-revoke;
- no data deletion;
- manual revocation remains an explicit admin action.

## 11. Admin Behavior

The existing admin billing console already reads:

- recent orders;
- recent payments;
- recent subscriptions;
- unmatched records;
- manual fulfillment previews.

Stripe ledger records become visible through the same read-only admin ledger surfaces.

No secret values are rendered.

## 12. Security

Confirmed design constraints:

- no live payments;
- no `sk_live_`;
- no real card requirement;
- no Lemon activation;
- no Wise API calls;
- no auto-grants;
- no auto-revokes;
- no `BillingEntitlementGrant` writes from webhook;
- no `AssessmentEntitlement` writes from webhook;
- no secrets in docs/UI/logs.

## 13. Tests

Added/updated unit coverage:

- Stripe mapper coverage.
- Stripe business ledger order/payment/subscription mapping.
- Stripe duplicate idempotency hardening.
- Stripe no-auto-grant boundary.
- Stripe persistence integration.
- Stripe decommission boundary updated for BILLING-5.

## 14. Production Smoke

Production smoke is executed after deployment of the BILLING-5 commit.

Expected Starter test smoke:

- `BillingEvent +1`
- `BillingOrder +1`
- `BillingPayment +1` when Stripe sends stable `payment_intent`
- `BillingSubscription +0`
- `BillingEntitlementGrant +0`
- `AssessmentEntitlement +0`

Replay expectations:

- no duplicate `BillingEvent`;
- no duplicate `BillingOrder`;
- no duplicate `BillingPayment`;
- original event status is not degraded.

Final production smoke results are recorded in this document after deployment.

## 15. Rollback

Code rollback:

- revert `feat: map Stripe events to billing ledger`.

Operational rollback:

- keep Stripe checkout test mode only;
- disable Stripe checkout via env if needed;
- existing ledger records remain as audit evidence;
- no destructive DB action required.

## 16. Next Steps

If BILLING-5 smoke passes:

- BILLING-6 - Stripe ledger reconciliation and admin fulfillment smoke hardening.

If idempotency or mapping fails in production:

- BILLING-5A - Stripe ledger mapping hardening.
