# BILLING-8 - Stripe Live Readiness Gate + First Live Payment Plan

Date: 2026-06-01

## 1. Objective

Prepare the final readiness gate for Stripe live payments in Shift Evidence without activating live payments.

This hito is a readiness and planning checkpoint only. It does not switch production to live mode, does not load live secrets into runtime, does not create a real payment and does not declare public billing launch.

Final verdict: GO CONDITIONAL for a future controlled live activation hito.

## 2. Context

Billing baseline:

- BILLING-4: Stripe became the primary configurable provider; Lemon Squeezy became legacy/rejected/disabled; Wise/bank transfer remained manual.
- BILLING-4A: Stripe test checkout was configured and smoke-tested for Starter, Professional and MSP.
- BILLING-4B: a real signed Stripe test webhook was received and persisted.
- BILLING-5: Stripe events map to `BillingEvent`, `BillingOrder`, `BillingPayment` and `BillingSubscription`; no auto-grants or auto-revokes.
- BILLING-6: admin match and explicit manual fulfillment were validated.
- BILLING-7: admin operations, reconciliation, CSV export and go-live gate surface were implemented.
- BILLING-7-PROD-SMOKE: production serves BILLING-7 and remains safe.

Current production status:

- Stripe checkout mode: test.
- Live payments: OFF.
- Lemon: legacy/rejected/disabled.
- Wise: manual invoice.
- Stripe checkout test: operational.
- Stripe webhook test: operational.
- Stripe ledger: operational.
- Admin match: operational.
- Manual fulfillment: operational.
- Reconciliation: read-only operational.
- Export CSV: admin-only operational.
- Auto-grants: OFF.
- Auto-revokes: OFF.

## 3. Technical Pre-Audit

Git:

- Branch: `main`.
- Base commit at audit time: `3ea1d46 docs: record Billing 7 production smoke`.
- `origin/main`: synced with local `main`.
- Working tree before this doc: clean except preserved untracked logo PNGs:
  - `images/shift-evidence-logo-transparent-1024.png`
  - `images/shift-evidence-logo-transparent-512.png`

Public production route checks:

| Route | Result |
| --- | --- |
| `/` | 200 |
| `/pricing` | 200 |
| `/support` | 200 |
| `/billing/checkout/starter` | 200 |
| `/billing/checkout/professional` | 200 |
| `/billing/checkout/msp` | 200 |
| `/dashboard/admin/billing` without session | 307 to `/sign-in` |
| `/dashboard/admin/billing/export/reconciliation` without session | 307 to `/sign-in` |

Authenticated admin checks:

- Stripe configured test: confirmed.
- Live payments OFF: confirmed.
- Webhooks ON: confirmed.
- Manual fulfillment ON: confirmed.
- Auto-grants OFF: confirmed.
- Auto-revokes OFF: confirmed.
- Lemon legacy/rejected/disabled: confirmed.
- Wise manual invoice: confirmed.
- Reconciliation visible: confirmed.
- Export visible: confirmed.
- Secrets visible: no.
- Raw payload/card data visible: no.

DB read-only baseline before and after invalid-signature smoke:

| Table | Before | After |
| --- | ---: | ---: |
| BillingEvent | 3 | 3 |
| BillingOrder | 3 | 3 |
| BillingPayment | 1 | 1 |
| BillingSubscription | 1 | 1 |
| BillingEntitlementGrant | 2 | 2 |
| AssessmentEntitlement | 136 | 136 |
| AuditEvent | 369 | 369 |

Stripe invalid signature smoke:

- `POST /api/webhooks/stripe` with invalid signature returned `401`.
- Response: safe `invalid_signature`.
- DB counts stayed unchanged.

## 4. Stripe Account Review

Stripe Dashboard access was attempted from the embedded browser in read-only mode.

Observed:

- Dashboard routes opened and account-scoped URLs were reached.
- The embedded browser surface rendered a blank dashboard body with no readable text.
- No configuration was changed.
- No secrets were copied.
- No live mode was activated.

Because the dashboard content could not be inspected reliably from the embedded browser, these account-level items require owner verification directly in Stripe before live activation:

- account active;
- identity/KYC complete;
- business profile complete;
- card payments capability enabled;
- payouts/bank account configured;
- payout schedule reviewed;
- tax/fiscal settings reviewed;
- no compliance blockers or critical warnings;
- branding/support email/support URL configured;
- statement descriptor reasonable.

Stripe account readiness result: GO CONDITIONAL.

Blocking condition for live activation: owner must confirm the above account, payout, tax and compliance items from Stripe Dashboard before switching production to live.

## 5. Live Products / Prices Readiness

Expected live product and price parity:

| Product | Expected live price | Cadence | Public card checkout |
| --- | ---: | --- | --- |
| Starter Readiness | USD 490 | one-time | yes, after activation |
| Professional Assessment | USD 1,500 | one-time | yes, after activation |
| MSP Partner | USD 399/month | recurring monthly | yes, after activation |
| Migration Blueprint | scoped/manual | invoice/manual | no public card checkout |

Required metadata/readiness:

- `plan_id=starter_readiness` for Starter.
- `plan_id=professional_assessment` for Professional.
- `plan_id=msp_partner` for MSP.
- Currency: USD.
- Starter/Professional: one-time.
- MSP: recurring monthly.
- Success URL compatible with `/billing/checkout/[plan]?status=success`.
- Cancel URL compatible with `/billing/checkout/[plan]?status=cancelled`.

Status:

- Test products/prices are already operational.
- Live products/prices could not be verified visually because Stripe Dashboard did not render readable content in the embedded browser.
- No live Price IDs were connected to production.
- No live products or prices were created during this hito.

Live products/prices result: GO CONDITIONAL.

Blocking condition for live activation: owner must confirm or create live products/prices and provide live Price IDs only during the live activation hito.

## 6. Live Webhook Readiness

Production endpoint:

- `https://shiftevidence.com/api/webhooks/stripe`

Required live events:

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Technical endpoint behavior:

- GET returns safe method boundary.
- Invalid signature POST returns `401`.
- Signed test webhook handling is already operational.
- Stripe events persist to `BillingEvent`.
- Business ledger mapping is operational for supported test events.
- No auto-grants.
- No auto-revokes.

Live webhook state:

- A live webhook endpoint was not created or changed during this hito.
- `STRIPE_WEBHOOK_SECRET` was not changed.
- The live webhook signing secret must be loaded only during a future controlled live activation.

Live webhook readiness result: GO CONDITIONAL.

Blocking condition for live activation: create/review live Stripe webhook endpoint, capture live signing secret securely, and load it only in the activation hito.

## 7. Hostinger Env Switch Plan

Current production env strategy:

- `STRIPE_SECRET_KEY`: test key.
- `STRIPE_WEBHOOK_SECRET`: test webhook secret.
- `STRIPE_STARTER_PRICE_ID`: test Price ID.
- `STRIPE_PROFESSIONAL_PRICE_ID`: test Price ID.
- `STRIPE_MSP_PRICE_ID`: test Price ID.
- `STRIPE_CHECKOUT_MODE=test`.
- `NEXT_PUBLIC_APP_URL=https://shiftevidence.com`.

Future live envs:

- `STRIPE_SECRET_KEY`: live secret key.
- `STRIPE_WEBHOOK_SECRET`: live webhook secret.
- `STRIPE_STARTER_PRICE_ID`: live Starter Price ID.
- `STRIPE_PROFESSIONAL_PRICE_ID`: live Professional Price ID.
- `STRIPE_MSP_PRICE_ID`: live MSP Price ID.
- `STRIPE_CHECKOUT_MODE=live`.

Rules for activation:

1. Do not mix test secret with live Price IDs.
2. Do not mix live secret with test Price IDs.
3. Do not set `STRIPE_CHECKOUT_MODE=live` until owner approval.
4. Do not expose env values in docs, logs or UI.
5. Prefer replacing envs in one controlled activation window.
6. Redeploy after env changes.
7. Smoke public checkout before any customer-facing announcement.

Switch plan:

1. Confirm owner approval for live activation.
2. Confirm Stripe account/KYC/payout/tax.
3. Confirm live products/prices.
4. Confirm live webhook endpoint.
5. Record current test env names as rollback baseline, without values.
6. Replace Stripe envs with live values in Hostinger.
7. Set `STRIPE_CHECKOUT_MODE=live`.
8. Redeploy.
9. Smoke `/pricing`, `/support` and checkout pages.
10. Start first live Starter payment only after owner confirms.
11. Confirm live webhook.
12. Confirm `BillingEvent`.
13. Confirm `BillingOrder`.
14. Confirm `BillingPayment`.
15. Confirm paid unmatched state.
16. Perform manual match.
17. Perform manual fulfillment.
18. Confirm entitlement.
19. Confirm reconciliation/export.
20. Document results.

Rollback plan:

1. Set `STRIPE_CHECKOUT_MODE=test` or disable checkout.
2. Restore test Stripe envs if replaced.
3. Redeploy.
4. Confirm checkout is test/fallback.
5. Use manual invoice/support while investigating.
6. Review paid/unmatched orders and failed webhooks.
7. Do not repeat live payment until root cause is known.

Hostinger env readiness result: GO, with activation still pending owner approval.

## 8. Public / Support / Refund Copy Review

Reviewed surfaces:

- `/pricing`
- `/support`
- `/billing/checkout/starter`
- `/billing/checkout/professional`
- `/billing/checkout/msp`
- success state
- cancelled state
- not configured/error state

Confirmed:

- Stripe is identified as secure card checkout provider where relevant.
- Lemon is not presented as an active public checkout provider.
- No instant access promise was found.
- Manual verification/fulfillment boundary is present.
- Invoice/support path is present.
- Error and cancel states route users to safe retry/support behavior.

Commercial/support copy readiness result: GO CONDITIONAL.

Pending before live:

- final owner review of refund/support promise;
- legal/accounting review for tax/invoice obligations;
- optional dedicated Terms/Refund policy page or section if owner wants a more formal public policy.

## 9. Support / Operations Runbook

Before live activation, support should operate with these rules:

1. Customer paid but has no access:
   - check admin billing orders;
   - confirm paid status;
   - confirm match state;
   - match user/workspace/assessment manually;
   - run manual fulfillment only after review.

2. Customer used wrong email:
   - verify Stripe customer email;
   - find correct Shift Evidence user;
   - match manually only if ownership is clear;
   - do not grant access to an unrelated workspace.

3. Duplicate payment:
   - check Stripe Dashboard;
   - check `BillingOrder` and `BillingPayment`;
   - do not duplicate fulfillment;
   - escalate refund decision to owner.

4. Failed payment:
   - check admin events and payment status;
   - do not grant access;
   - ask customer to retry or request invoice.

5. Failed webhook:
   - check admin failed events;
   - review Stripe event delivery;
   - do not manually mutate ledger unless a separate recovery hito approves it.

6. Paid unmatched order:
   - treat as action required;
   - search customer email;
   - match manually only with confidence.

7. Matched but not fulfilled:
   - review plan eligibility;
   - run explicit manual fulfillment.

8. Refund request:
   - review Stripe, order, grants and entitlements;
   - do not auto-revoke;
   - use manual revocation only if policy and ownership are clear.

9. Chargeback/dispute:
   - treat as high priority;
   - preserve audit trail;
   - do not delete reports, users, assessments or billing rows.

10. MSP subscription failed/cancelled:
    - do not auto-revoke;
    - review subscription state and contract manually.

11. Invoice/manual bank transfer:
    - keep out of Stripe automation unless separately approved;
    - record support/admin notes.

12. Manual revoke:
    - require explicit admin action;
    - require note;
    - use approved revocation service only.

13. Checkout rollback:
    - switch to test/disabled;
    - route customers to support/invoice;
    - document incident.

## 10. GO / NO-GO Matrix

| Area | Status | Notes |
| --- | --- | --- |
| Stripe account/KYC | GO CONDITIONAL | Requires owner visual confirmation in Stripe Dashboard. |
| Stripe products/prices live | GO CONDITIONAL | Expected parity documented; live objects not verified/created here. |
| Stripe webhook live | GO CONDITIONAL | Endpoint ready; live webhook/secret not created or loaded here. |
| Hostinger env plan | GO | Switch and rollback plan documented; no envs changed. |
| Admin billing | GO | Admin status, ledger, reconciliation and export are operational. |
| Ledger/reconciliation | GO | Read-only counts stable; reconciliation visible. |
| Manual fulfillment | GO | Explicit admin-only fulfillment already validated in prior hito. |
| Support/refund copy | GO CONDITIONAL | Operational copy safe; legal/accounting/refund policy should be owner-reviewed. |
| Legal/fiscal | GO CONDITIONAL | Stripe Tax/accounting/invoice handling needs owner/accounting confirmation. |
| Monitoring | GO CONDITIONAL | Admin surfaces exist; alerting is still manual. |
| Rollback | GO | Plan documented. |
| Owner approval | NO-GO until explicit approval | Live activation requires a separate explicit hito. |

Overall result: GO CONDITIONAL.

The product is not approved for live activation until owner confirms Stripe account, live prices, live webhook, fiscal/refund policy and gives explicit activation approval.

## 11. First Live Payment Plan

Do not execute this plan until `BILLING-9-LIVE-ACTIVATION-CONTROLLED`.

Recommended first live payment:

1. Plan: Starter Readiness.
2. Amount: USD 490.
3. Email: owner-controlled real email.
4. Card: real card only after explicit owner approval.
5. Confirm hosted checkout is Stripe live.
6. Complete payment once.
7. Confirm live webhook delivery.
8. Confirm `BillingEvent`.
9. Confirm `BillingOrder`.
10. Confirm `BillingPayment`.
11. Confirm no `BillingEntitlementGrant` from webhook.
12. Confirm no `AssessmentEntitlement` from webhook.
13. Confirm paid/unmatched or matched/not fulfilled state.
14. Match manually.
15. Fulfill manually.
16. Confirm entitlement.
17. Confirm reconciliation/export.
18. Document result.

If anything fails:

- do not repeat payment blindly;
- switch checkout back to test/disabled;
- use support/invoice manually;
- inspect Stripe Dashboard and app ledger;
- document incident before retrying.

## 12. Monitoring

During first live activation window, monitor:

- `/dashboard/admin/billing`;
- failed Stripe events;
- ignored/duplicate events;
- paid unmatched orders;
- matched/not fulfilled orders;
- payment records without order association;
- subscription payment failures;
- support inbox;
- Stripe Dashboard payments/events;
- reconciliation CSV.

## 13. Rollback

Rollback triggers:

- live checkout creates an incorrect price;
- webhook fails;
- ledger does not record payment;
- admin cannot match/fulfill;
- secret/env mismatch;
- customer-facing copy is misleading;
- unexpected live mode behavior.

Rollback action:

1. Disable live checkout or set mode back to test.
2. Redeploy.
3. Verify public checkout no longer creates live sessions.
4. Use invoice/manual support.
5. Keep all billing ledger data.
6. Do not delete historical rows.
7. Document incident.

## 14. Security

Confirmed in this hito:

- No live activation.
- No `STRIPE_CHECKOUT_MODE=live`.
- No live secrets loaded.
- No real payment.
- No real card.
- No Lemon reactivation.
- No Wise automation.
- No auto-grants.
- No auto-revokes.
- No webhook-based fulfillment.
- No checkout-success fulfillment.
- No DB mutation beyond invalid-signature read-only smoke.
- No secrets exposed.

## 15. Validations

Required local validations for this docs-only hito:

- `npx prisma validate`
- `npm run typecheck`
- `npm run lint`
- `npm run test:run`
- `npm run build`

## 16. Risks

- Stripe Dashboard could not be visually inspected through the embedded browser because the dashboard body rendered blank.
- Live products/prices are not confirmed inside this hito.
- Live webhook endpoint/secret is not confirmed inside this hito.
- Stripe Tax/fiscal obligations require owner/accounting review.
- Support/refund policy should be owner-reviewed before live launch.
- Alerting remains manual through admin and Stripe Dashboard.

## 17. Next Hito

Recommended next hito: `BILLING-8A-LIVE-READINESS-FIXES` if owner needs to create/confirm Stripe live products, webhook, account/KYC/tax and final policy.

After all conditional items are resolved, proceed to:

- `BILLING-9-LIVE-ACTIVATION-CONTROLLED`

That hito must include explicit owner approval, env switch, redeploy, first live payment, webhook verification, ledger verification, manual match and manual fulfillment.

## 18. Percentages

- Billing total: 90-93%.
- Stripe readiness: 90-93% technical, conditional on account/live dashboard verification.
- Payment readiness: 84-89%.
- Operational readiness: 88-92%.
- ShiftReadiness global: 95-97%.
