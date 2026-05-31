# BILLING-3-AUDIT-SPEC - Webhooks, Ledger, Entitlements and Admin Billing Console

Date: 2026-05-31

Status: FINAL AUDIT SPEC. Documentation only. Not implemented.

## 1. Executive Summary

Shift Evidence currently has Lemon Squeezy checkout working in production
test-mode for:

- Starter Readiness - USD 490;
- Professional Assessment - USD 1,500;
- MSP Partner - USD 399/month.

The app can create server-side Lemon checkout sessions and redirect users to the
hosted Lemon checkout. The app does not yet receive webhook events, persist a
billing ledger, reconcile subscriptions, or grant entitlements automatically.

Recommended BILLING-3 direction:

- implement webhook/ledger first;
- keep entitlement automation in `manual_review` for the first release;
- add a Spanish admin billing console before any live payments;
- defer auto-grant until matching is strong and audited.

## 2. Current State Audit

What exists:

- centralized billing config in `src/config/billing.ts`;
- safe checkout route state in `src/server/billing/billingConfiguration.ts`;
- hardened checkout origin logic;
- Lemon checkout creation service;
- POST start routes for `starter`, `professional`, and `msp`;
- production Hostinger env vars for Lemon test-mode checkout;
- manual unlock request and entitlement services;
- audit events for manual unlock approval/fulfillment;
- docs for manual fulfillment and pre-webhook boundary;
- unit tests for checkout config, runtime readiness, disabled checkout, and
  Lemon checkout payload construction.

What works:

- checkout pages load in production;
- POST start routes create Lemon checkout sessions;
- Lemon checkouts show test mode;
- prices are correct in hosted checkout;
- redirects no longer use `0.0.0.0`;
- secrets are server-side and not exposed in public checkout HTML.

What remains manual:

- verifying successful orders in Lemon;
- matching customer email to app user/workspace/assessment;
- approving and fulfilling unlock requests;
- granting entitlements;
- reconciling MSP subscriptions;
- handling refunds, cancellations, and failed payments;
- recording billing evidence in admin notes.

What is missing:

- webhook endpoint;
- Lemon signature verification;
- local order/payment/subscription ledger;
- idempotent event processing;
- admin billing ledger;
- provider status model beyond basic config visibility;
- automatic entitlement grant/revoke;
- subscription renewal/cancellation sync;
- refund/dispute workflow;
- failed webhook retry queue.

## 3. What Happens If Live Is Enabled Today

If live payments were enabled before BILLING-3:

1. Lemon could charge a real customer.
2. Lemon would record the order/payment/subscription.
3. Shift Evidence would not persist that payment.
4. Shift Evidence would not grant access automatically.
5. Diego would need to verify and fulfill manually.
6. Refunds/cancellations would not update app access.

Live activation today is operationally possible but not automation-ready.

## 4. Critical Risks If Live Is Enabled Today

Critical risks:

- paid customer not fulfilled;
- wrong workspace or assessment receives access;
- refund does not revoke access;
- subscription cancellation does not suspend partner access;
- support treats URL `status=success` as proof of payment;
- duplicate orders lead to duplicate manual work;
- no reliable internal billing audit trail;
- no automated recovery if webhook-like work is missed because webhooks do not
  exist yet.

Recommended decision:

- keep `LEMON_SQUEEZY_CHECKOUT_MODE=test` until BILLING-3F/3G gates pass;
- use the manual fulfillment runbook for any controlled test-mode or
  owner-approved real-payment experiment.

## 5. Current Data Boundary

Authoritative payment state:

- Lemon Squeezy.

Current app state:

- `UnlockRequest`;
- `AssessmentEntitlement`;
- `AuditEvent`;
- admin notes.

Current app state does not include:

- `BillingOrder`;
- `BillingPayment`;
- `BillingSubscription`;
- `BillingEvent`;
- `BillingEntitlementGrant`.

## 6. BILLING-3 Recommended Architecture

Layers:

1. Provider status model:
   - Lemon;
   - Wise;
   - Stripe disabled.
2. Webhook ingestion:
   - Lemon webhook endpoint;
   - signature verification;
   - event idempotency.
3. Billing ledger:
   - orders;
   - payments;
   - subscriptions;
   - event processing state.
4. Matching:
   - checkout metadata;
   - email match;
   - user/workspace/assessment match;
   - admin review for ambiguous cases.
5. Entitlement workflow:
   - manual-review first;
   - optional future auto-grant for strong matches.
6. Admin billing console:
   - provider status;
   - ledger visibility;
   - unmatched orders;
   - failed events;
   - manual grant actions.

## 7. Decisions Recommended

Recommended:

- build admin provider status in Spanish before webhooks;
- add DB models in an additive migration;
- persist webhook events before doing any grants;
- make event processing idempotent from day one;
- keep entitlement automation disabled or `manual_review` by default;
- add manual matching screens before auto-grant;
- treat MSP subscriptions as workspace/partner access until a formal partner
  entitlement model exists.

Not recommended yet:

- live mode;
- automatic entitlement grant from public checkout;
- refund-driven destructive deletion;
- Stripe setup;
- Wise automation beyond manual invoice visibility.

## 8. Existing Test Coverage

Current tests cover:

- centralized plan pricing/payment options;
- checkout eligibility and route mapping;
- runtime readiness based on env vars;
- explicit checkout disable flag;
- Lemon checkout payload and test-mode default.

Missing tests for BILLING-3:

- webhook signature verification;
- duplicate webhook event replay;
- event persistence;
- order/payment/subscription mapping;
- matching outcomes;
- entitlement manual-review state;
- refund/cancellation behavior;
- admin provider status rendering.

## 9. No-Go Items

Do not implement in this audit hito:

- code;
- migrations;
- webhook endpoints;
- DB changes;
- Hostinger env changes;
- Lemon webhook creation;
- live payment mode;
- automatic entitlements;
- billing ledger tables.

