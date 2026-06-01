# BILLING-8A - Stripe Live Dashboard Verification + Live Objects Prep

Date: 2026-06-01

## 1. Objective

Resolve the conditional items from BILLING-8 by verifying Stripe live dashboard readiness and preparing live billing objects for a future controlled activation.

This hito does not activate live payments in production.

## 2. Context

BILLING-8 ended as `PARCIAL / GO CONDICIONAL` because Stripe Dashboard did not render enough content in the embedded browser to verify account, products, payouts, tax and webhook readiness.

Baseline before this hito:

- Production checkout mode: test.
- Live payments: OFF.
- Test Stripe env vars active in Hostinger.
- No live env vars applied to the app.
- Stripe test checkout and webhook are operational.
- Admin billing, reconciliation, match and manual fulfillment are operational.
- No auto-grants.
- No auto-revokes.
- Lemon remains legacy/rejected/disabled.
- Wise remains manual invoice.

## 3. Git Baseline

- Branch: `main`.
- Base commit: `d974c42 docs: add Stripe live readiness gate`.
- `origin/main`: synced before changes.
- Working tree before docs: clean except preserved untracked logo PNGs:
  - `images/shift-evidence-logo-transparent-1024.png`
  - `images/shift-evidence-logo-transparent-512.png`

## 4. Stripe Account Readiness

Stripe Dashboard was accessed in live account scope with the owner session.

Observed:

- Payout settings page rendered successfully.
- A bank payout method is configured.
- Default settlement currency is configured.
- Payout schedule settings are available.
- No critical restricted-capability or compliance warning was visible on the payout page.

Not fully verified because some Stripe Dashboard pages rendered blank in the embedded browser:

- account/business profile completeness;
- full KYC/identity verification state;
- full card payments capability state;
- support email/URL/branding;
- Stripe Tax/accounting setup page.

Result: GO CONDITIONAL.

Owner confirmation still required before live activation:

- account active;
- identity/KYC complete;
- business profile complete;
- card payments enabled;
- payouts enabled;
- no compliance blockers;
- support email/URL correct;
- statement descriptor reviewed;
- tax/fiscal handling approved.

## 5. Live Products / Prices

Live products were created in Stripe Dashboard live scope. They were not connected to production env vars.

| Product | Price | Cadence | Status |
| --- | ---: | --- | --- |
| Starter Readiness | USD 490 | one-time | created |
| Professional Assessment | USD 1,500 | one-time | created |
| MSP Partner | USD 399 | monthly | created |
| Migration Blueprint | scoped/manual invoice | manual | no public card checkout |

Verification notes:

- Product list showed 3 active products after creation.
- Starter displayed USD 490.
- Professional displayed USD 1,500.
- MSP displayed USD 399 per month.
- Stripe tax code shown in dashboard product list: general electronic/digital services category.

Not completed in this hito:

- live Price IDs were not copied into docs;
- live Price IDs were not loaded into Hostinger;
- owner still needs to copy live Price IDs into a secure place for BILLING-9;
- `plan_id` metadata was not verified as set on the live objects;
- if metadata is required for future hardening, add it before live activation or rely on exact live Price ID env mapping during BILLING-9.

Result: GO CONDITIONAL.

## 6. Live Webhook Readiness

Target endpoint:

- `https://shiftevidence.com/api/webhooks/stripe`

Required events:

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Status:

- The application endpoint is already implemented and test-smoked.
- Invalid signature production smoke returns `401`.
- Stripe Dashboard webhook/workbench pages rendered blank in the embedded browser.
- No live webhook endpoint was created or changed in this hito.
- No live webhook signing secret was copied.
- No live webhook signing secret was loaded into Hostinger.

Result: GO CONDITIONAL.

Required before BILLING-9:

- create or verify the live webhook endpoint in Stripe;
- subscribe to the required events;
- copy live signing secret into owner-controlled secure storage;
- load it into Hostinger only during controlled live activation.

## 7. Hostinger Env Live Package

Future live variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_PROFESSIONAL_PRICE_ID`
- `STRIPE_MSP_PRICE_ID`
- `STRIPE_CHECKOUT_MODE=live`
- `NEXT_PUBLIC_APP_URL=https://shiftevidence.com`

This hito did not:

- change Hostinger env vars;
- load `sk_live_`;
- load live webhook secret;
- replace test Price IDs;
- set `STRIPE_CHECKOUT_MODE=live`.

Env package readiness: GO CONDITIONAL.

Pending:

- owner must store live secret key securely;
- owner must store live Price IDs securely;
- owner must create/store live webhook signing secret securely;
- BILLING-9 must apply the env switch in one controlled window with rollback.

## 8. Refund / Support / Legal / Fiscal

Public copy was regression-checked:

- `/pricing`
- `/support`
- `/billing/checkout/starter`
- `/billing/checkout/professional`
- `/billing/checkout/msp`

Confirmed:

- Stripe is referenced where relevant.
- Lemon is not active in public copy.
- No instant-access promise was found.
- Manual verification/support/invoice boundary is present.
- Checkout pages explain that entitlement/fulfillment remains manual.

Pending owner decisions:

- whether a dedicated Terms/Refund page is required before live;
- whether Stripe Tax will be used now or later;
- whether fiscal invoices are manual/accounting-led;
- final refund/support policy wording.

Result: GO CONDITIONAL.

## 9. Test-Mode Regression Smoke

Production routes:

| Route | Result |
| --- | --- |
| `/pricing` | 200 |
| `/support` | 200 |
| `/billing/checkout/starter` | 200 |
| `/billing/checkout/professional` | 200 |
| `/billing/checkout/msp` | 200 |
| `/dashboard/admin/billing` without session | 307 to `/sign-in` |
| `/dashboard/admin/billing/export/reconciliation` without session | 307 to `/sign-in` |

Stripe invalid signature:

- `POST /api/webhooks/stripe`
- Result: `401 invalid_signature`.

DB counts before and after invalid-signature smoke:

| Table | Before | After |
| --- | ---: | ---: |
| BillingEvent | 3 | 3 |
| BillingOrder | 3 | 3 |
| BillingPayment | 1 | 1 |
| BillingSubscription | 1 | 1 |
| BillingEntitlementGrant | 2 | 2 |
| AssessmentEntitlement | 136 | 136 |
| AuditEvent | 369 | 369 |

No DB mutation occurred.

## 10. GO / NO-GO Matrix

| Area | Status | Notes |
| --- | --- | --- |
| Stripe account/KYC | GO CONDITIONAL | Payout page OK; full account/KYC pages need owner confirmation. |
| Payouts | GO CONDITIONAL | Payout method visible/configured; no bank details documented. |
| Capabilities | GO CONDITIONAL | No visible payout warning; card capability needs owner confirmation. |
| Stripe Tax/fiscal | GO CONDITIONAL | Tax page not verified; fiscal handling remains owner/accounting decision. |
| Live products/prices | GO CONDITIONAL | Products/prices created; Price IDs and metadata readiness remain pending. |
| Live webhook | GO CONDITIONAL | App endpoint ready; Stripe live webhook page blank, endpoint not created here. |
| Hostinger env package | GO CONDITIONAL | Plan ready; live values not applied. |
| Admin billing | GO | Already operational. |
| Ledger/reconciliation | GO | Operational and stable. |
| Manual fulfillment | GO | Admin explicit only. |
| Public/support copy | GO CONDITIONAL | Safe boundary present; final legal/refund review pending. |
| Owner approval | NO-GO until explicit approval | Required for BILLING-9. |

Overall result: PARCIAL / GO CONDITIONAL.

## 11. Conditions For BILLING-9

BILLING-9 may proceed only after the owner confirms:

1. Stripe account/KYC/capabilities are live-ready.
2. Payouts are correct.
3. Tax/fiscal handling is accepted.
4. Live Price IDs are copied into secure owner storage.
5. Live webhook endpoint exists with required events.
6. Live webhook signing secret is copied into secure owner storage.
7. Refund/support/legal copy is approved.
8. Explicit activation approval is given.

## 12. Security

Confirmed:

- No `STRIPE_CHECKOUT_MODE=live`.
- No live env vars applied to production.
- No live payments.
- No real card.
- No live checkout execution.
- No live webhook event sent.
- No Hostinger changes.
- No secrets in docs.
- No bank details in docs.
- No auto-grants.
- No auto-revokes.
- No Lemon reactivation.
- No Wise API automation.
- No DB mutation.

## 13. Risks

- Stripe Dashboard webhooks/workbench page was blank in the embedded browser.
- Full Stripe account/KYC/capability status still requires owner-side confirmation.
- Live webhook endpoint still needs to be created or verified.
- Live Price IDs still need to be securely captured for BILLING-9.
- Product metadata `plan_id` was not verified.
- Tax/fiscal/refund policy still needs owner/accounting review.

## 14. Next Hito

Recommended next hito: `BILLING-8B-LIVE-READINESS-FIXES`.

Scope:

- owner confirms account/KYC/capabilities/tax;
- owner captures live Price IDs securely;
- owner creates/verifies live webhook endpoint;
- owner captures live webhook signing secret securely;
- final legal/refund/support approval.

After those are complete:

- `BILLING-9-LIVE-ACTIVATION-CONTROLLED`.

## 15. Percentages

- Billing total: 91-94%.
- Stripe readiness: 92-95% technical, still conditional on webhook/account confirmation.
- Payment readiness: 86-90%.
- Operational readiness: 89-93%.
- ShiftReadiness global: 95-97%.
