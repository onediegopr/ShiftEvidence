# BILLING-3I - Live Readiness Gate

Date: 2026-06-01

## BILLING-4 update

After BILLING-3I, Lemon Squeezy rejected the offering as services. The Lemon live path is decommissioned and replaced by a Stripe-first checkout foundation. This document is retained as historical readiness evidence only; it is not approval to enable Lemon live payments.

## Executive Summary

This hito audits readiness before enabling live payments in Lemon Squeezy.

Final verdict:

- **GO CONDICIONAL**

Live mode must not be enabled yet until the conditional items are confirmed:

- Lemon account KYC/payout/tax status must be verified inside Lemon dashboard.
- Hostinger hPanel env presence should be visually verified by name before live activation.
- Final owner approval is required to change checkout mode from `test` to `live`.

No live mode was activated. No env vars were changed. No checkout, payment, provider call, deployment or code change was performed.

## Git and Deployment Baseline

Branch:

- `main`
- synchronized with `origin/main`

Relevant commits present:

- `148252b feat: add manual billing fulfillment grants`
- `8549384 feat: harden billing grants and refund review`
- `bcb8660 docs: record Billing 3G production migration`
- `c553994 docs: record Billing 3H refund revoke smoke`

Working tree before this documentation commit:

- clean except untracked logo PNGs.

Production route checks:

| Route | Result |
| --- | --- |
| `/billing/checkout/starter` | `200` |
| `/billing/checkout/professional` | `200` |
| `/billing/checkout/msp` | `200` |
| `/dashboard/admin/billing` without session | `307` to `/sign-in` |
| `/api/webhooks/lemon` GET | `405` |
| `/pricing` | `200` |
| `/support` | `200` |

## Readiness Matrix

| Area | Status | Blocking / Action Required |
| --- | --- | --- |
| Lemon account | GO CONDICIONAL | Dashboard session was not available; verify store, KYC, payout and tax status before live. |
| Lemon checkout | GO | Production checkout routes load and runtime admin status shows Lemon configured in test mode. |
| Webhook | GO | Endpoint exists, GET returns 405, invalid signature returns 401 without creating a BillingEvent. |
| DB ledger | GO | Billing 3A and 3G migrations applied; unique index exists; duplicate count is 0. |
| Admin billing | GO | Admin route protected; console operational; test mode, ledger, fulfillment, refund/revoke state visible. |
| Manual match | GO | Implemented and documented; match does not grant access. |
| Manual fulfillment | GO | Production smoke completed; grants are explicit admin actions. |
| Refund/revoke | GO | Production smoke completed; refund did not auto-revoke; manual revoke locked entitlement and audited. |
| Wise/manual invoice | GO CONDICIONAL | Manual invoice process exists; Wise automation is disabled and not required for Lemon live. |
| Stripe deferred | GO | Stripe remains deferred/disabled; no active Stripe checkout. |
| Support operations | GO | Runbooks and boundary docs exist for payment, fulfillment, webhook, refund and manual invoice cases. |
| Security | GO | Secrets not exposed; webhook signature enforced; no auto-grant; no auto-revoke; admin-only billing route. |
| Commercial UX | GO CONDICIONAL | Pricing is correct and bank invoice copy exists; final live/support/terms copy should be reviewed before public live. |
| Live activation risk | GO CONDICIONAL | Technical path is ready, but KYC/payout/hPanel/env/live-owner approval must be confirmed first. |

## Lemon Account Status

Confirmed indirectly through production runtime/admin and public pricing:

- Lemon provider configured in production runtime: yes.
- Store ID presence: yes.
- API key presence: yes.
- Variant IDs present for Starter, Professional and MSP: yes.
- Checkout mode: `Test`.
- Webhook secret presence: yes.
- Webhook endpoint available: yes.
- Product pricing visible publicly:
  - Starter Readiness: USD 490 one-time.
  - Professional Assessment: USD 1,500 one-time.
  - MSP Partner: USD 399/month.
- Migration Blueprint remains invoice/scoped/manual.

Not confirmed because Lemon dashboard redirected to login in the embedded browser:

- Store dashboard details.
- KYC/identity verification.
- Payout/bank connection.
- Tax/fiscal setup.
- Lemon dashboard warnings.

Lemon readiness:

- **GO CONDICIONAL**

Required before live:

- sign into Lemon dashboard in embedded browser;
- confirm store `Shift Evidence`, Store ID `393386`, currency USD;
- confirm KYC/identity complete;
- confirm payout/bank connected;
- confirm tax/fiscal setup complete;
- confirm webhook URL and event list;
- confirm no Lemon account warning.

## Hostinger Runtime Env Status

Direct hPanel read was not performed in this hito. Runtime presence was verified from the production admin billing console without exposing values.

Confirmed from runtime/admin behavior:

- Lemon Store ID present.
- Lemon API key present.
- Lemon API key alias present.
- Starter Variant ID present.
- Professional Variant ID present.
- MSP Variant ID present.
- Checkout mode: `Test`.
- Webhook secret present.
- Webhook endpoint available.
- Better/Auth public origin behavior is production-safe: admin redirects to `https://shiftevidence.com/sign-in`.
- Production database is reachable and current.

Hostinger env readiness:

- **GO CONDICIONAL**

Required before live:

- visually verify hPanel env names/presence without values;
- confirm `LEMON_SQUEEZY_CHECKOUT_MODE` remains `test` until explicit live hito;
- confirm no stale deploy is serving old code before live activation.

## DB and Ledger Status

Production DB counts:

| Model | Count |
| --- | ---: |
| `BillingEvent` | 1 |
| `BillingOrder` | 2 |
| `BillingPayment` | 0 |
| `BillingSubscription` | 1 |
| `BillingEntitlementGrant` | 1 |
| `AssessmentEntitlement` | 136 |
| `AuditEvent` | 366 |

Migrations:

- `20260531170000_billing_3a_ledger_foundation`: applied, `rolled_back_at=null`.
- `20260601111500_billing_3g_grant_unique_idempotency`: applied, `rolled_back_at=null`.

Unique index:

- `BillingEntitlementGrant_billingOrderId_entitlementKey_key`: exists.
- Columns verified: `billingOrderId`, `entitlementKey`.

Duplicate grants:

- duplicate groups by `billingOrderId + entitlementKey`: `0`.

Smoke records:

- `billing_3e_smoke_order_20260601095612`: pending synthetic order.
- `billing_3f_smoke_order_20260601104237`: refunded synthetic order.
- Smoke grant: `revoked`.
- Smoke `AssessmentEntitlement`: `locked`.

DB readiness:

- **GO**

## Admin Billing Operations Status

Verified with embedded browser and admin session:

- admin route loads.
- UI in Spanish.
- test-mode visible.
- live payments OFF.
- Lemon card visible.
- Wise card visible.
- billing operations metrics visible.
- ledger/order/payment/subscription sections visible.
- unmatched section visible.
- fulfillment warning visible.
- revocation warning visible.
- no secrets visible in DOM text.

Admin billing readiness:

- **GO**

Minor observation:

- The automated text scan did not always catch every section label because of viewport/rendering behavior, but visible/admin text and prior smoke docs confirm the console is operational.

## Wise / Bank Transfer Status

Current design:

- Wise is not automated.
- Bank transfer invoice remains manual.
- Wise token/API is not required for Lemon live checkout.
- No recipient automation.
- No transfer automation.
- No payout automation.

Public/commercial copy:

- bank transfer invoices are available for business customers.
- Wise is not presented as the main public payment CTA.

Wise readiness:

- **GO CONDICIONAL**

Action before live:

- confirm operational owner has the manual invoice workflow ready for any non-card customer.

## Stripe Deferred Status

Current status:

- Stripe is deferred/disabled.
- no Stripe public checkout.
- no Stripe env required.
- no new Stripe integration.

Stripe readiness:

- **GO**

## Support / Operations Status

Relevant runbooks/docs present:

- `billing-manual-fulfillment-runbook.md`
- `billing-boundary-before-webhooks.md`
- `billing-3c-admin-billing-console.md`
- `billing-3f-production-fulfillment-smoke.md`
- `billing-3g-production-readonly-smoke.md`
- `billing-3h-refund-cancel-revoke-smoke.md`

Operational checklist exists for:

- paid customer without access;
- payment not appearing;
- webhook event failure;
- manual match;
- manual fulfillment;
- refund/cancel review;
- manual revocation;
- bank transfer invoice;
- MSP/manual partner handling.

Support readiness:

- **GO**

## Security Status

Confirmed:

- no secrets exposed in admin/pricing DOM text.
- webhook GET returns 405.
- invalid webhook signature returns 401.
- invalid signature did not create a new `BillingEvent`.
- webhook signature verification exists.
- admin billing route requires auth.
- no auto-grant from webhook.
- no auto-revoke from webhook/refund/subscription.
- manual fulfillment writes audit events.
- manual revocation writes audit events.
- DB-level idempotency unique index applied.
- live payments remain OFF.

Security readiness:

- **GO**

## Commercial UX Status

Public pricing:

- Starter Readiness: USD 490.
- Professional Assessment: USD 1,500.
- MSP Partner: USD 399/month.
- Migration Blueprint remains invoice/scoped/manual.
- card checkout visible for configured plans.
- bank transfer invoice visible.
- Stripe not visible as active.
- Wise not visible as primary CTA.

Commercial UX readiness:

- **GO CONDICIONAL**

Recommended before live:

- final review of payment success/support/refund copy;
- ensure copy does not imply instant automatic access where manual fulfillment still applies.

## Final Verdict

**GO CONDICIONAL**

Technical readiness is high:

- checkout test-mode works;
- webhook is protected;
- ledger exists;
- admin console exists;
- manual match/fulfillment/revoke exists;
- refund boundary was smoked;
- DB idempotency is applied.

Live activation should wait for:

1. Lemon dashboard KYC/payout/tax verification.
2. Hostinger hPanel env name/presence verification.
3. Final owner approval to change checkout mode to live.
4. Final commercial/support copy review.

## Explicit Non-Actions

Not performed:

- no live activation;
- no checkout;
- no payment;
- no card;
- no Lemon API call;
- no Wise API call;
- no Stripe integration;
- no Hostinger/env change;
- no deploy;
- no DB schema change;
- no migration;
- no data deletion;
- no PNG change.

## Next Hito

Recommended:

- `BILLING-3I-LEMON-HOSTINGER-KYC-ENV-ATTESTATION`

Then, only if complete:

- `BILLING-4A-LIVE-ACTIVATION-CONTROLLED`, with explicit owner approval and rollback plan.
