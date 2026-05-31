# BILLING-3A - Billing Ledger Foundation

Date: 2026-05-31

Status: implemented locally. Not pushed. Not deployed.

## 1. Executive Summary

BILLING-3A creates the persistent foundation for a future billing ledger.

Implemented:

- Prisma enums for provider and ledger statuses;
- additive ledger models;
- additive migration;
- server-side ledger helpers;
- unit tests for model assumptions, status transitions and idempotency.

Not implemented:

- webhook endpoint;
- Lemon event processing;
- provider API calls;
- entitlement grants;
- refund automation;
- admin billing console UI;
- live payments.

## 2. Models

### BillingEvent

Purpose:

- stores provider event identity;
- stores event processing status;
- stores idempotency key;
- stores raw payload hash;
- stores redacted/safe payload metadata only.

Important fields:

- `provider`;
- `providerEventId`;
- `eventType`;
- `status`;
- `idempotencyKey`;
- `rawPayloadHash`;
- `safePayloadJson`;
- `receivedAt`;
- `processedAt`.

### BillingOrder

Purpose:

- represents a provider order or manual billing order;
- can be matched later to a user, workspace or assessment;
- does not grant access by itself.

Important fields:

- `provider`;
- `providerOrderId`;
- `providerCheckoutId`;
- `providerCustomerId`;
- `planId`;
- `amountCents`;
- `currency`;
- `status`;
- `customerEmail`;
- optional `userId`;
- optional `workspaceId`;
- optional `assessmentId`;
- `paidAt`;
- `refundedAt`;
- `cancelledAt`.

### BillingPayment

Purpose:

- represents a payment event connected to a `BillingOrder`;
- supports paid, refunded and failed states.

Important fields:

- `provider`;
- `providerPaymentId`;
- `orderId`;
- `amountCents`;
- `currency`;
- `status`;
- `paidAt`;
- `refundedAt`;
- `failedAt`.

### BillingSubscription

Purpose:

- represents recurring subscriptions such as MSP Partner;
- can be matched later to user/workspace context;
- does not create partner entitlements automatically.

Important fields:

- `provider`;
- `providerSubscriptionId`;
- `providerCustomerId`;
- `planId`;
- `productId`;
- `variantId`;
- `status`;
- `customerEmail`;
- optional `userId`;
- optional `workspaceId`;
- `currentPeriodStart`;
- `currentPeriodEnd`;
- `cancelledAt`;
- `expiredAt`;
- `paymentFailedAt`.

### BillingEntitlementGrant

Purpose:

- records a proposed or reviewed entitlement grant from billing evidence;
- remains separate from `AssessmentEntitlement`;
- starts in `pending_review`;
- does not unlock product access in BILLING-3A.

Important fields:

- optional `billingOrderId`;
- optional `billingSubscriptionId`;
- optional `userId`;
- optional `workspaceId`;
- optional `assessmentId`;
- `entitlementKey`;
- `status`;
- `source`;
- `reviewNotes`;
- `grantedAt`;
- `revokedAt`;
- `rejectedAt`.

## 3. Enums

Created:

- `BillingProvider`: `lemon_squeezy`, `wise`, `stripe`;
- `BillingEventStatus`: `pending`, `processed`, `failed`, `ignored`;
- `BillingOrderStatus`: `pending`, `paid`, `refunded`, `cancelled`;
- `BillingPaymentStatus`: `pending`, `paid`, `refunded`, `failed`;
- `BillingSubscriptionStatus`: `active`, `cancelled`, `expired`, `payment_failed`;
- `BillingGrantStatus`: `pending_review`, `granted`, `revoked`, `rejected`.

## 4. Indexes and Idempotency

`BillingEvent`:

- unique `idempotencyKey`;
- unique `[provider, providerEventId]`;
- lookup indexes for provider, event type, status and received time.

`BillingOrder`:

- unique `[provider, providerOrderId]`;
- lookup indexes for checkout id, customer id, email, user, workspace, assessment, status and created time.

`BillingPayment`:

- unique `[provider, providerPaymentId]`;
- lookup indexes for order, provider, status and paid time.

`BillingSubscription`:

- unique `[provider, providerSubscriptionId]`;
- lookup indexes for customer id, email, user, workspace, status and period end.

`BillingEntitlementGrant`:

- lookup indexes for order, subscription, user, workspace, assessment, entitlement key, status and created time.

Idempotency helper strategy:

- provider event id: `billing_event:<provider>:<event_id>`;
- order event: `billing_order_event:<provider>:<order_id>:<event_type>`;
- subscription period: `billing_subscription_period:<provider>:<subscription_id>:<event_type>:<period_start>:<period_end>`;
- manual records: `billing_manual:<provider>:<scope>:<external_id>`.

## 5. Relationships

Added optional relationships:

- `BillingOrder` to `User`, `Workspace`, `Assessment`;
- `BillingPayment` to `BillingOrder`;
- `BillingSubscription` to `User`, `Workspace`;
- `BillingEntitlementGrant` to `BillingOrder`, `BillingSubscription`, `User`, `Workspace`, `Assessment`.

No relationship was added from `BillingEntitlementGrant` to `AssessmentEntitlement`.

## 6. Services and Helpers

Created:

- `src/server/billing/ledger/billingLedgerTypes.ts`;
- `src/server/billing/ledger/billingLedgerStatus.ts`;
- `src/server/billing/ledger/billingIdempotency.ts`;
- `src/server/billing/ledger/billingLedgerService.ts`.

The helpers:

- normalize customer email;
- create stable idempotency keys;
- hash raw payloads;
- build pending ledger create data;
- keep entitlement grants in `pending_review`.

They do not:

- call Lemon;
- create webhooks;
- grant access;
- mutate `AssessmentEntitlement`;
- expose secrets.

## 7. Risks

Operational risks:

- payments can still happen in Lemon without automatic app access;
- manual reconciliation remains required until BILLING-3C/BILLING-3D;
- provider IDs must be captured consistently by future webhook processing;
- public checkout orders may remain unmatched if no user/workspace/assessment metadata exists.

Technical risks:

- nullable provider IDs allow future manual/provider records, but webhook processing must avoid creating records without stable provider identities;
- `BillingEntitlementGrant` is not product access and must not be treated as unlock state by UI or reports;
- refunds/cancellations are ledger states only until a future admin review flow exists.

## 8. Rollback

Before production migration:

- revert the code commit;
- remove the local additive migration if it has not been applied anywhere.

After production migration:

- do not use `db push`;
- do not use `migrate reset`;
- do not drop ledger tables as an emergency fix;
- disable future webhook wiring if needed;
- leave additive ledger tables unused until a forward migration is approved.

## 9. Next Milestones

Recommended next:

- BILLING-3B: webhook endpoint and event persistence only.

Still future:

- admin billing console;
- manual match;
- manual entitlement grant from verified order;
- refund/cancellation review;
- live payments gate.
