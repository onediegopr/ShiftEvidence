# BILLING-3 - Webhooks, Ledger and Entitlements Specification

Date: 2026-05-31

Status: specification only. Not implemented.

## 1. Goal

BILLING-3 should convert Lemon Squeezy checkout from manual fulfillment into a
controlled billing automation layer.

The target state:

- receive Lemon webhook events;
- verify webhook signatures;
- persist orders/payments/subscriptions;
- reconcile checkout metadata to plans;
- grant/revoke entitlements safely;
- provide an admin billing ledger;
- preserve auditability and rollback.

## 2. Non-Goals

BILLING-3 should not:

- enable live payments without a separate launch gate;
- remove manual override;
- delete customer data on refund/cancellation;
- store card data;
- expose API keys;
- rely on frontend success URL as payment proof.

## 3. Proposed Data Model

Candidate models:

- `BillingCustomer`
- `BillingOrder`
- `BillingPayment`
- `BillingSubscription`
- `BillingEvent`
- `BillingEntitlementGrant`

Minimum fields:

`BillingEvent`

- id;
- provider;
- providerEventId;
- eventType;
- receivedAt;
- processedAt;
- processingStatus;
- idempotencyKey;
- rawPayloadHash;
- safePayloadJson;
- errorMessage;

`BillingOrder`

- id;
- provider;
- providerOrderId;
- providerCheckoutId;
- providerCustomerId;
- productId;
- variantId;
- planId;
- amountCents;
- currency;
- status;
- customerEmail;
- userId nullable;
- workspaceId nullable;
- assessmentId nullable;
- createdAt;
- paidAt;
- refundedAt nullable.

`BillingPayment`

- id;
- providerPaymentId;
- orderId;
- amountCents;
- currency;
- status;
- paidAt;
- refundedAt nullable.

`BillingSubscription`

- id;
- providerSubscriptionId;
- providerCustomerId;
- planId;
- productId;
- variantId;
- status;
- customerEmail;
- userId nullable;
- workspaceId nullable;
- currentPeriodStart;
- currentPeriodEnd;
- cancelledAt nullable.

`BillingEntitlementGrant`

- id;
- billingOrderId nullable;
- billingSubscriptionId nullable;
- assessmentId nullable;
- workspaceId nullable;
- entitlementKey;
- status;
- source;
- grantedAt;
- revokedAt nullable.

## 4. Webhook Events

Events to support first:

- `order_created`
- `order_refunded`
- `subscription_created`
- `subscription_updated`
- `subscription_cancelled`
- `subscription_payment_success`
- `subscription_payment_failed`

Event handling rules:

- verify signature before parsing as trusted;
- store event id and idempotency key;
- ignore duplicate events safely;
- never grant access from unverified payload;
- never fail silently;
- record processing errors for admin review.

## 5. Checkout Metadata Mapping

Checkout creation already includes custom metadata:

- `plan_id`
- `plan_slug`
- `source=shift_evidence_public_checkout`

BILLING-3 should add or derive matching fields:

- user id if authenticated;
- workspace id when known;
- assessment id when checkout starts from an assessment;
- requested entitlement type.

If checkout starts publicly without app context:

- create billing order as unmatched;
- require manual matching before entitlement grant.

## 6. Entitlement Automation

Initial entitlement mapping:

| Plan | Condition | Entitlements |
| --- | --- | --- |
| Starter Readiness | paid order | `full_report_unlocked` |
| Professional Assessment | paid order | `full_report_unlocked`, `pro_matrix_unlocked` |
| MSP Partner | active subscription | partner/workspace entitlement model to be defined |

Automation modes:

- `manual_review`: persist order, do not grant automatically;
- `auto_grant_matched`: grant only if user/workspace/assessment match is strong;
- `disabled`: ledger only.

Recommended first release:

- ledger on;
- webhook verification on;
- entitlement automation in `manual_review`;
- admin can fulfill from a verified billing record.

## 7. Idempotency

Idempotency keys:

- provider event id;
- provider order id + event type;
- provider subscription id + event type + period.

Rules:

- processing the same event twice must not duplicate orders/payments/grants;
- entitlement grant should use existing `assessmentId_entitlementKey` uniqueness;
- webhook retry should be safe.

## 8. Security

Requirements:

- Lemon webhook secret stored server-side only;
- raw payload handled only for signature verification;
- no API keys in logs;
- no card data stored;
- safe payload redaction for admin;
- least-privilege admin views;
- CSRF is not relevant to webhook endpoint, but signature verification is
  mandatory;
- rate limit suspicious webhook failures.

## 9. Admin Operations

Admin billing screen should show:

- recent orders;
- unmatched orders;
- subscription statuses;
- refund/cancellation events;
- entitlement grant status;
- failed webhook processing;
- manual match/fulfill actions.

Admin actions:

- match order to user/workspace/assessment;
- approve entitlement grant;
- revoke entitlement after refund/cancellation;
- mark exception;
- retry failed event processing.

## 10. Rollback

Rollback strategy:

- webhooks can be disabled in Lemon without deleting ledger records;
- entitlement automation can be disabled by env flag;
- manual fulfillment remains fallback;
- processed events remain immutable;
- admin can revoke mistakenly granted entitlements without deleting the order;
- deploy rollback must not require DB rollback for additive schema.

## 11. Testing Plan

Unit tests:

- signature verification;
- payload parsing;
- idempotency;
- plan mapping;
- entitlement mapping;
- refund/cancellation behavior.

Integration tests:

- simulated Lemon webhook payloads;
- duplicate event replay;
- unmatched order flow;
- matched order manual fulfillment;
- subscription update/cancel flow.

Production test-mode smoke:

- create test checkout;
- complete test payment with Lemon test card only;
- verify webhook received;
- verify ledger row;
- verify no live payment;
- verify entitlement mode behavior.

## 12. Release Gates

Before BILLING-3 production:

- migrations reviewed as additive;
- webhook endpoint tested locally;
- test-mode webhook configured in Lemon;
- admin ledger visible;
- entitlement automation disabled or manual-review by default;
- runbook updated;
- no live payment mode unless separately approved.

