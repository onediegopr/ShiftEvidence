# BILLING-2.9 - Boundary Before Webhooks

Date: 2026-05-31

Status: active boundary document.

## 1. Executive Summary

Shift Evidence can create Lemon Squeezy checkout sessions in production test
mode. Lemon can record checkout/order/payment/subscription state. The Shift
Evidence application does not yet receive or process Lemon events.

Therefore:

- a Lemon payment is not an automatic app entitlement;
- a Lemon subscription is not automatic partner access;
- a Lemon refund is not automatic revocation;
- app access remains a manual admin operation.

## 2. What Is Automated

Automated today:

- Plan configuration is centralized in `src/config/billing.ts`.
- Checkout eligibility is derived per plan.
- `/billing/checkout/<plan>` shows runtime readiness.
- POST `/billing/checkout/<plan>/start` creates a Lemon checkout session when
  env vars are present.
- Checkout mode defaults to test unless `LEMON_SQUEEZY_CHECKOUT_MODE=live`.
- Redirect origin is hardened and should not use `0.0.0.0`.
- Lemon checkout receives custom metadata:
  - `plan_id`;
  - `plan_slug`;
  - `source=shift_evidence_public_checkout`.

## 3. What Is Not Automated

Not automated today:

- no webhook endpoint;
- no Lemon signature verification;
- no local `Order` model;
- no local `Payment` model;
- no local `Subscription` model;
- no billing ledger;
- no idempotent event processing;
- no automatic entitlement grant;
- no automatic entitlement revocation;
- no automatic invoice reconciliation;
- no failed payment handling;
- no cancellation handling;
- no renewal sync;
- no customer email automation after payment.

## 4. Where Purchases Are Recorded

Current authoritative record:

- Lemon Squeezy dashboard/API.

Current app records:

- checkout session creation is not persisted;
- checkout success redirect is not persisted;
- payment/order/subscription state is not persisted;
- fulfillment may be represented by `UnlockRequest`, `AssessmentEntitlement`
  and `AuditEvent` after manual admin action.

## 5. What Evidence Exists

Evidence available in Lemon:

- order id;
- checkout id;
- product/variant;
- customer email;
- amount/currency;
- payment status;
- subscription status for MSP;
- refunds/disputes if any.

Evidence available in Shift Evidence only after manual action:

- unlock request status;
- entitlement keys granted;
- admin notes;
- audit events for approval/fulfillment/entitlement grant.

## 6. What Support Must Not Assume

Support must not assume:

- that a customer who paid has app access;
- that `status=success` in a URL proves payment;
- that a Lemon order belongs to a specific assessment without email/workspace
  matching;
- that MSP subscription renewal automatically extends access;
- that refund automatically revokes access;
- that paid status means evidence upload or report generation is complete.

## 7. Operational Risks

Current risks:

- paid customer not fulfilled if manual queue is missed;
- entitlement granted to wrong workspace/assessment;
- duplicate fulfillment after duplicate orders;
- refund processed but entitlement not revoked;
- subscription cancelled but partner access remains;
- support sees checkout success but no app-side order;
- manual notes may become inconsistent if not standardized;
- admin page copy may lag behind actual checkout configuration.

Controls:

- daily Lemon order review;
- daily unlock request review;
- weekly reconciliation;
- manual order id in admin notes;
- never grant from URL evidence alone;
- never revoke/delete data because of a refund without human review.

## 8. Admin Boundary

Manual admin actions are allowed:

- approve unlock request;
- fulfill unlock request;
- grant entitlement through existing admin flow;
- cancel/reject unlock request;
- record internal notes.

Manual admin actions require:

- verified Lemon order/subscription;
- matched user/workspace/assessment;
- plan/amount check;
- written internal note.

Manual admin actions must not:

- create fake payment evidence;
- grant higher tier access from lower tier payment;
- expose secrets in notes;
- delete customer evidence or reports.

## 9. Current Plan Mapping

| Lemon product | App plan | Expected manual entitlement |
| --- | --- | --- |
| Starter Readiness | `starter_readiness` | `full_report_unlocked` |
| Professional Assessment | `professional_assessment` | `full_report_unlocked`, `pro_matrix_unlocked` |
| MSP Partner | `msp_partner` | Manual partner/workspace access, not yet formalized as subscription entitlement |
| Migration Blueprint | invoice only | Manual scope and invoice flow |

## 10. Go / No-Go for Real Payments

Before live mode or broad paid launch:

- webhook receiver implemented;
- signature verification implemented;
- order/payment/subscription ledger implemented;
- idempotency implemented;
- entitlement automation implemented or explicitly disabled with admin queue;
- refund/cancellation handling defined;
- admin reconciliation view available;
- runbook tested with test-mode orders;
- support copy updated.

Until then, checkout should be operated as controlled/manual fulfillment.

