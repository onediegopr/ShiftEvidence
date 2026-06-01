# BILLING-8B - Live Readiness Fixes + Owner Stripe Confirmation

Date: 2026-06-01

## 1. Objective

Resolve the final `GO CONDITIONAL` items from BILLING-8A before deciding whether Shift Evidence can move to `BILLING-9-LIVE-ACTIVATION-CONTROLLED`.

This hito does not activate production live payments, does not change Hostinger env vars and does not execute a real payment.

Final result: PARCIAL / GO CONDITIONAL.

## 2. Context

BILLING-8A created the initial Stripe live objects and confirmed the application remained safely in test mode.

BILLING-8B focused on:

- confirming live products/prices;
- creating/verifying the live Stripe webhook destination;
- keeping production in test mode;
- documenting the remaining owner-side confirmations for account/KYC/capabilities/tax;
- preserving the live activation boundary for BILLING-9.

## 3. Git Baseline

- Branch: `main`.
- Base commit: `8543481 docs: verify Stripe live readiness prerequisites`.
- `origin/main`: synced before this hito.
- Working tree had unrelated changes before this hito:
  - `src/app/pricing/page.tsx`
  - `src/app/vmware-to-proxmox-readiness/page.tsx`
  - `src/index.css`
  - `src/views/LandingPage.tsx`
  - `docs/consulting-grade-positioning.md`
  - `tests/unit/consultingGradePositioning.test.ts`
  - untracked logo PNGs

Those unrelated files were preserved and were not included in this docs commit.

## 4. Stripe Account Readiness

Confirmed:

- Payout settings were previously visible and showed a payout method configured.
- No critical warning was visible in the payout screen.

Still pending owner-side confirmation:

- account active;
- business profile complete;
- support email configured;
- support URL configured;
- statement descriptor reviewed;
- identity/KYC verified;
- no pending verification blocker;
- card payments enabled;
- subscriptions/Billing usable;
- Stripe Tax/fiscal path accepted.

Reason for conditional status:

- Stripe account/settings pages still rendered with empty body in the embedded browser.
- No sensitive data was copied or documented.

Result: GO CONDITIONAL.

## 5. Live Products / Prices

Stripe live products/prices were verified in the live products list:

| Product | Price | Cadence | Status |
| --- | ---: | --- | --- |
| Starter Readiness | USD 490 | one-time | active / confirmed |
| Professional Assessment | USD 1,500 | one-time | active / confirmed |
| MSP Partner | USD 399 | monthly | active / confirmed |
| Migration Blueprint | scoped/manual invoice | manual | no public card checkout |

Confirmed signals:

- product list showed 3 active products;
- Starter displayed USD 490;
- Professional displayed USD 1,500;
- MSP displayed USD 399 per month.

Live Price IDs:

- not documented;
- not loaded into Hostinger;
- must be captured by owner in secure storage before BILLING-9.

Metadata:

- `plan_id` metadata was not verified.
- BILLING-9 can still map safely using exact live Price ID env vars once loaded.
- Recommended hardening: add/verify `plan_id` metadata before or during BILLING-9 if the Stripe UI allows it cleanly.

Result: GO CONDITIONAL.

## 6. Live Webhook

A live Stripe event destination was created from Stripe Workbench.

Endpoint:

- `https://shiftevidence.com/api/webhooks/stripe`

Scope:

- `Tu cuenta` / account events.

API version:

- `2026-04-22.dahlia`.

Events selected:

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Confirmed:

- destination active;
- endpoint URL visible;
- listening to 6 events;
- total deliveries 0;
- failed deliveries 0.

Signing secret:

- Stripe displayed the signing secret masked.
- Codex did not reveal, copy, store or document the secret.
- Owner must reveal/copy the live signing secret into secure owner storage before BILLING-9.
- The secret was not loaded into Hostinger.

Result: GO CONDITIONAL.

## 7. Hostinger Env Package

Live env variables needed for BILLING-9:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_PROFESSIONAL_PRICE_ID`
- `STRIPE_MSP_PRICE_ID`
- `STRIPE_CHECKOUT_MODE=live`
- `NEXT_PUBLIC_APP_URL=https://shiftevidence.com`

Confirmed:

- no Hostinger env vars were changed;
- live env package was not applied;
- production remains on test envs;
- `STRIPE_CHECKOUT_MODE=test` remains expected production state.

Pending:

- owner secure capture of live secret key;
- owner secure capture of live webhook secret;
- owner secure capture of live Price IDs.

Result: GO CONDITIONAL.

## 8. Policy / Refund / Legal / Fiscal

Current app copy remains safe for controlled test/live readiness:

- no Lemon public checkout;
- no instant-access promise;
- manual verification/fulfillment boundary remains visible;
- support/invoice path remains visible.

Owner decisions still pending:

- refund policy for first live phase;
- fiscal invoice path;
- whether Stripe Tax is used now or later;
- whether broad public sales require a formal Terms/Refund page;
- legal/accounting review before public launch.

Result: GO CONDITIONAL.

## 9. Test-Mode Regression

Production route checks:

| Route | Result |
| --- | --- |
| `/pricing` | 200 |
| `/support` | 200 |
| `/billing/checkout/starter` | 200 |
| `/billing/checkout/professional` | 200 |
| `/billing/checkout/msp` | 200 |
| `/dashboard/admin/billing` without session | 307 to `/sign-in` |
| `/dashboard/admin/billing/export/reconciliation` without session | 307 to `/sign-in` |

Admin authenticated checks:

- Stripe configured test: confirmed.
- Live OFF: confirmed.
- Webhooks ON: confirmed.
- Manual fulfillment ON: confirmed.
- Auto-grants OFF: confirmed.
- Auto-revokes OFF: confirmed.
- Lemon legacy/rejected/disabled: confirmed.
- Wise manual: confirmed.
- Reconciliation visible: confirmed.
- Export visible: confirmed.
- No secrets visible: confirmed.

Stripe invalid signature:

- `POST /api/webhooks/stripe`
- Result: `401 invalid_signature`.

DB read-only counts before and after invalid signature smoke:

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
| Stripe account/KYC | GO CONDITIONAL | Owner-side confirmation still required. |
| Capabilities | GO CONDITIONAL | Card payments/Billing usability must be owner-confirmed. |
| Payouts | GO CONDITIONAL | Payout method visible; final owner confirmation still required. |
| Tax/fiscal | GO CONDITIONAL | Owner/accounting decision still required. |
| Live products/prices | GO CONDITIONAL | Products/prices confirmed; live Price IDs must be securely captured. |
| Product metadata | GO CONDITIONAL | `plan_id` not verified; exact Price ID mapping remains acceptable. |
| Live webhook endpoint | GO CONDITIONAL | Endpoint created with 6 events; secret must be securely captured by owner. |
| Hostinger env package | GO CONDITIONAL | Prepared by names; not applied. |
| Admin billing | GO | Safe operational state confirmed. |
| Ledger/reconciliation | GO | Stable and read-only. |
| Manual fulfillment | GO | Explicit admin-only. |
| Public/support copy | GO CONDITIONAL | Safe for controlled live; legal/refund final wording pending. |
| Owner approval | NO-GO until explicit approval | Required before BILLING-9 activation. |

Overall result: PARCIAL / GO CONDITIONAL.

## 11. Conditions For BILLING-9

BILLING-9 can proceed only after:

1. Owner confirms account/KYC/capabilities are live-ready.
2. Owner confirms payout schedule and bank destination.
3. Owner confirms tax/fiscal/refund path.
4. Owner securely stores live `STRIPE_SECRET_KEY`.
5. Owner securely stores live `STRIPE_WEBHOOK_SECRET`.
6. Owner securely stores live Price IDs for Starter, Professional and MSP.
7. Owner confirms the webhook destination remains active with the required 6 events.
8. Owner gives explicit approval to switch Hostinger env vars and set `STRIPE_CHECKOUT_MODE=live`.

## 12. Security

Confirmed:

- No live activation.
- No live payments.
- No real card.
- No Hostinger env changes.
- No live secrets documented.
- No Price IDs documented.
- No bank details documented.
- No auto-grants.
- No auto-revokes.
- No Lemon checkout.
- No Wise API.
- No DNS or email changes.
- No historical data deletion.

## 13. Risks

- Live signing secret is not captured by Codex and must be stored securely by owner.
- Live Price IDs are not captured by Codex and must be stored securely by owner.
- Account/KYC/capability/tax confirmation remains owner-side.
- Product metadata `plan_id` was not verified.
- Broad public launch still requires final legal/refund/fiscal review.

## 14. Next Hito

Recommended next hito: `BILLING-9-LIVE-ACTIVATION-CONTROLLED` only if the owner supplies explicit confirmations and has all live secrets/Price IDs in secure storage.

If any owner-side item remains unresolved, use `BILLING-8C-LIVE-READINESS-FIXES`.

## 15. Percentages

- Billing total: 92-95%.
- Stripe readiness: 94-96%.
- Stripe live readiness: 82-88%.
- Payment readiness: 88-91%.
- Operational readiness: 90-94%.
- ShiftReadiness global: 95-97%.
