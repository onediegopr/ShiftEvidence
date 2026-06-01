# BILLING-3 - Implementation Plan

Date: 2026-05-31

Status: planning only. Not implemented.

## 1. Strategy

BILLING-3 should be split into small, reversible milestones. The first version
should persist provider truth and preserve manual review before granting access.

Default policy:

- no live payments;
- no auto-grant;
- no destructive refund automation;
- no DB reset;
- no `prisma db push`;
- additive migrations only.

## 2. BILLING-3A - DB Models and Tests

Scope:

- add Prisma models/enums for billing ledger;
- add migrations;
- unit tests for model helpers and idempotency keys.

Models:

- `BillingEvent`;
- `BillingOrder`;
- `BillingPayment`;
- `BillingSubscription`;
- `BillingEntitlementGrant`.

No:

- webhook endpoint;
- provider calls;
- entitlement grants.

Exit criteria:

- migration reviewed as additive;
- `prisma migrate deploy` strategy documented;
- tests pass;
- no production mutation until approved.

## 3. BILLING-3B - Webhook Endpoint and Event Persistence

Scope:

- create Lemon webhook endpoint;
- verify signature;
- persist `BillingEvent`;
- dedupe duplicate events;
- store raw payload hash and safe redacted payload;
- no entitlement grants.

Exit criteria:

- invalid signature rejected;
- duplicate event id ignored safely;
- test-mode webhook event persists;
- admin can see failed processing count later.

## 4. BILLING-3C - Admin Billing Ledger and Manual Match

Scope:

- add `/dashboard/admin/billing`;
- show provider status in Spanish;
- show ledger events/orders/subscriptions;
- show unmatched orders;
- allow manual match to user/workspace/assessment.

No:

- automatic grants;
- live payments.

Exit criteria:

- admin-only access;
- no secrets displayed;
- unmatched order flow documented;
- manual match records audit event.

## 5. BILLING-3D - Manual Entitlement Grant from Verified Billing Order

Scope:

- admin can grant entitlement from a verified paid order;
- grant creates `BillingEntitlementGrant`;
- existing `AssessmentEntitlement` remains source of app access;
- audit event records billing order id and entitlement keys.

Mode:

- `manual_review`.

Exit criteria:

- Starter grants `full_report_unlocked`;
- Professional grants `full_report_unlocked` + `pro_matrix_unlocked`;
- MSP remains partner/workspace manual unless formal model exists;
- duplicate grant is idempotent.

Implementation note:

- Initial `BillingEntitlementGrant` idempotency is service-level because there is
  no DB unique constraint yet on `billingOrderId + entitlementKey`.
- Additive DB-level hardening for that unique guard is recommended after the
  manual fulfillment flow is validated.

## 6. BILLING-3E - Refund, Cancellation and Failed Payment Handling

Scope:

- persist refund/cancellation/failed payment events;
- mark orders/subscriptions at risk;
- add DB-level idempotency hardening for billing grants;
- admin decides revocation through an explicit action;
- no automatic deletion.

Rules:

- refund does not delete assessment data;
- cancellation does not automatically delete workspace;
- failed payment marks risk, no immediate revocation in v1.

Exit criteria:

- admin sees risk state;
- manual revoke action documented and audited;
- duplicate refund/cancel events safe.

Implementation notes:

- `BillingEntitlementGrant(billingOrderId, entitlementKey)` should be protected by an additive unique index.
- Production migration must be approved separately from code generation.
- Revocation may only target grants created by `manual_billing_fulfillment`.
- Webhook refund/cancel events never call revocation directly.

## 7. BILLING-3F - Production Test-Mode End-to-End Smoke

Scope:

- Lemon test checkout;
- test payment only;
- webhook received;
- event/order/payment persisted;
- admin ledger visible;
- manual entitlement grant from verified order.

No:

- live payment;
- real card;
- automatic grant unless explicitly testing disabled/manual mode.

Exit criteria:

- full trace from Lemon test order to admin ledger;
- no secrets exposed;
- no `0.0.0.0`;
- no unintended entitlements.

## 8. BILLING-3G - Live Readiness Gate

Scope:

- final review before live payment mode.

Required:

- webhook endpoint stable;
- ledger stable;
- refund/cancel process validated;
- admin console ready;
- support copy updated;
- runbook updated;
- live/test confusion controls;
- explicit owner approval.

Exit criteria:

- decision document says live approved or live blocked;
- no implicit public launch declaration.

## 9. Matching and Entitlement Decision Tree

Checkout from authenticated assessment:

- include user/workspace/assessment metadata;
- if payment succeeds, order can be matched strongly;
- first release still manual-review.

Public checkout without login:

- order becomes unmatched;
- admin matches by email or asks customer to create account.

Email matches one user:

- mark `candidate_match`;
- still require assessment/workspace confirmation.

Email matches multiple users/workspaces:

- mark `ambiguous`;
- no grant until admin selection.

Assessment missing:

- mark `awaiting_customer_setup`;
- send account/setup instructions.

MSP subscription:

- match to partner workspace/admin;
- record subscription;
- keep monthly reconciliation until automated subscription entitlement exists.

## 10. Refund and Cancellation Policy

Refund:

- persist refund event;
- mark related entitlement grant `review_required`;
- admin decides revoke/keep exception;
- never delete customer records.

Cancellation:

- persist cancellation;
- mark MSP/partner access `review_required`;
- no automatic revocation in v1.

Failed payment:

- persist event;
- notify admin;
- do not revoke immediately.

## 11. Security Checklist

Must cover:

- webhook spoofing;
- duplicate events;
- replay attacks;
- entitlement escalation;
- customer email mismatch;
- refund abuse;
- live/test confusion;
- secret leakage;
- over-permissioned admin actions.

Controls:

- signature verification;
- event id uniqueness;
- idempotent processors;
- mode labels in admin;
- safe payload redaction;
- admin audit events;
- manual-review default.

## 12. Commit Boundaries

Recommended commits:

1. `feat: add billing ledger schema`
2. `feat: persist Lemon webhook events`
3. `feat: add admin billing console`
4. `feat: support manual billing entitlement grants`
5. `feat: record billing refund and cancellation risk`
6. `docs: record billing test-mode webhook smoke`
7. `docs: record billing live readiness decision`
