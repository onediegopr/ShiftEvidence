# BILLING-3D - Business Ledger Mapping

Date: 2026-06-01

## 1. Executive Summary

BILLING-3D maps verified Lemon Squeezy webhook events into the internal
commercial billing ledger.

Implemented scope:

- Lemon event mapper;
- BillingOrder persistence;
- BillingPayment persistence only when a stable provider payment id exists;
- BillingSubscription persistence;
- idempotent upsert behavior;
- read-only admin visibility for orders, payments, subscriptions and unmatched
  records.

This milestone does not grant access.

## 2. No Migration

BILLING-3D uses the existing BILLING-3A schema.

No Prisma schema change was required.
No migration was created.

Existing models used:

- `BillingEvent`;
- `BillingOrder`;
- `BillingPayment`;
- `BillingSubscription`.

Models intentionally not used for writes:

- `BillingEntitlementGrant`;
- `AssessmentEntitlement`.

## 3. Supported Lemon Events

The supported events are:

- `order_created`;
- `order_refunded`;
- `subscription_created`;
- `subscription_updated`;
- `subscription_cancelled`;
- `subscription_payment_success`;
- `subscription_payment_failed`.

Unsupported Lemon events remain captured as `BillingEvent` when the webhook
signature and payload identity are valid, but they do not create commercial
ledger entities.

## 4. Mapping Rules

### BillingOrder

Created or updated only when a stable `providerOrderId` exists.

Mapped fields include:

- provider order id;
- checkout id when present;
- customer id when present;
- product id;
- variant id;
- plan id;
- amount in cents;
- currency;
- customer email;
- paid/refunded/cancelled/provider-created dates.

If `plan_id` is missing, the mapper attempts to resolve the plan from the
trusted runtime variant id mapping. If no plan can be resolved, it does not
invent one.

If amount is missing for a new order, the order is skipped and a safe warning is
stored on the event.

### BillingPayment

Created or updated only when:

- a stable `providerPaymentId` exists; and
- an internal `BillingOrder` can be associated.

If Lemon does not provide a stable payment identity, no payment row is created.
No timestamp or synthetic id is used as provider payment id.

### BillingSubscription

Created or updated only when a stable `providerSubscriptionId` exists.

Mapped fields include:

- provider subscription id;
- customer id;
- plan id;
- product id;
- variant id;
- status;
- customer email;
- current period start/end;
- cancelled/expired/payment-failed/provider-created dates.

## 5. Idempotency

The webhook remains idempotent at the `BillingEvent` layer through provider
event id and idempotency key.

Business ledger idempotency uses existing unique constraints:

- `BillingOrder`: provider + providerOrderId;
- `BillingPayment`: provider + providerPaymentId;
- `BillingSubscription`: provider + providerSubscriptionId.

If a webhook replay is marked `ignored`, the business ledger processor skips it
and does not create duplicate orders, payments or subscriptions.

## 6. Admin Ledger

The admin billing page now shows:

- recent orders;
- recent payments;
- recent subscriptions;
- unmatched orders;
- unmatched subscriptions.

The UI is read-only.

There are no buttons for:

- manual match;
- grants;
- refunds;
- Wise transfers;
- Stripe actions.

Unmatched records show the operational boundary:

> Requires manual review. Does not grant access automatically.

## 7. What This Does Not Do

BILLING-3D does not:

- enable live payments;
- change checkout mode;
- call Lemon APIs;
- call Wise APIs;
- integrate Stripe;
- create `BillingEntitlementGrant`;
- touch `AssessmentEntitlement`;
- grant or revoke access;
- implement manual match;
- perform destructive refund automation;
- change Hostinger env vars;
- mutate schema or run a DB migration.

## 8. Risks

Known risks:

- Lemon payloads may omit a stable provider payment id, so payments can be
  skipped while orders/subscriptions are still captured.
- Public checkout records can remain unmatched until a future manual match
  milestone.
- Subscription payment events may not always include an order association; the
  system skips payment rows rather than inventing unsafe links.
- This is still ledger-only. Support must not treat a ledger row as automatic
  access.

## 9. Rollback

Rollback is code-only because there is no migration.

Reverting the BILLING-3D commit would remove:

- the Lemon business mapper;
- the business ledger processor;
- admin read-only commercial ledger tables;
- Billing 3D tests and docs.

Existing billing rows should not be deleted during rollback.

## 10. Next Step

Recommended next milestone:

- BILLING-3E manual match design, or
- BILLING-3F controlled manual fulfillment from verified billing records.

Access remains manual until a separately approved entitlement milestone.
