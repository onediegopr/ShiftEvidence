# BILLING-8C - Owner Final Live Readiness Closure + Git Alignment

Date: 2026-06-01

## 1. Objective

Close the final BILLING-8B readiness items before authorizing `BILLING-9-LIVE-ACTIVATION-CONTROLLED`.

This hito does not activate live payments, does not change Hostinger env vars, does not execute live checkout and does not process a real payment.

Final result: PARCIAL / GO CONDITIONAL.

## 2. Context

BILLING-8B completed these technical readiness items:

- production remained in Stripe test mode;
- no live payments;
- no Hostinger/env changes;
- live Stripe products/prices confirmed;
- live Stripe webhook destination created;
- public copy remained safe;
- admin billing remained operational;
- no auto-grants;
- no auto-revokes;
- no Lemon checkout.

Remaining owner-side items:

- secure capture of live Price IDs;
- secure capture of live webhook signing secret;
- account/KYC/capabilities/tax/branding confirmation;
- refund/legal/fiscal approval;
- explicit approval for BILLING-9.

## 3. Git Alignment

Initial state before alignment:

- local `main`: ahead 1 / behind 1.
- local-only commit: `d997fee feat: add senior-grade assessment positioning`.
- remote-only commit: `84ad438 docs: close Stripe live readiness prerequisites`.
- uncommitted unrelated changes:
  - `src/index.css`
  - `src/views/LandingPage.tsx`
- untracked logo PNGs:
  - `images/shift-evidence-logo-transparent-1024.png`
  - `images/shift-evidence-logo-transparent-512.png`

Safe alignment actions:

- created preservation branch:
  - `preserve/senior-grade-assessment-positioning` at `d997fee`.
- stashed tracked unrelated WIP:
  - `stash@{0}: On main: preserve positioning wip before billing-8c alignment`.
- reset local `main` to `origin/main`.

Final aligned state:

- local `main`: aligned with `origin/main`.
- HEAD: `84ad438 docs: close Stripe live readiness prerequisites`.
- working tree clean except the two untracked logo PNGs.
- unrelated positioning work preserved in branch and stash.

Git alignment result: GO.

## 4. Owner Stripe Account Confirmation

Owner-side confirmations were not provided in this hito.

Status remains:

| Area | Status | Notes |
| --- | --- | --- |
| Account active | GO CONDITIONAL | Requires owner confirmation. |
| Identity/KYC complete | GO CONDITIONAL | Requires owner confirmation. |
| Business profile complete | GO CONDITIONAL | Requires owner confirmation. |
| No compliance blocker | GO CONDITIONAL | Requires owner confirmation. |
| Card payments enabled | GO CONDITIONAL | Requires owner confirmation. |
| Payouts enabled | GO CONDITIONAL | Payout method was previously visible; final owner confirmation still required. |
| Subscriptions/Billing usable | GO CONDITIONAL | Requires owner confirmation. |
| Business name/support/statement descriptor | GO CONDITIONAL | Requires owner confirmation. |
| Tax/fiscal path | GO CONDITIONAL | Requires owner/accounting decision. |

Stripe account readiness: GO CONDITIONAL.

## 5. Live Price IDs Readiness

Live products/prices from BILLING-8B:

| Product | Price | Cadence | Status |
| --- | ---: | --- | --- |
| Starter Readiness | USD 490 | one-time | confirmed live product |
| Professional Assessment | USD 1,500 | one-time | confirmed live product |
| MSP Partner | USD 399 | monthly | confirmed live product |
| Migration Blueprint | scoped/manual invoice | manual | no public card checkout |

Owner secure capture status:

- live `STRIPE_STARTER_PRICE_ID`: not attested in this hito.
- live `STRIPE_PROFESSIONAL_PRICE_ID`: not attested in this hito.
- live `STRIPE_MSP_PRICE_ID`: not attested in this hito.

Metadata:

- `plan_id` metadata remains not verified.
- Mapping by exact env Price ID remains acceptable for BILLING-9 if owner securely captures the live Price IDs.

Live prices readiness: GO CONDITIONAL.

## 6. Live Webhook Readiness

Live webhook from BILLING-8B:

- Endpoint: `https://shiftevidence.com/api/webhooks/stripe`.
- Scope: account events.
- Events:
  - `checkout.session.completed`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Deliveries at creation: 0 total / 0 failed.

Owner secure capture status:

- live webhook signing secret: not attested in this hito.
- secret loaded in Hostinger: no.
- secret documented: no.

Live webhook readiness: GO CONDITIONAL.

## 7. Hostinger Env Package

Required package for BILLING-9:

- live `STRIPE_SECRET_KEY`;
- live `STRIPE_WEBHOOK_SECRET`;
- live `STRIPE_STARTER_PRICE_ID`;
- live `STRIPE_PROFESSIONAL_PRICE_ID`;
- live `STRIPE_MSP_PRICE_ID`;
- `STRIPE_CHECKOUT_MODE=live`;
- `NEXT_PUBLIC_APP_URL=https://shiftevidence.com`.

Current status:

- no Hostinger env vars changed;
- production remains expected test mode;
- no live values applied;
- rollback baseline documented by variable names only.

Hostinger env package readiness: GO CONDITIONAL.

## 8. Policy / Refund / Legal / Fiscal

Owner decisions not provided in this hito:

- refunds manual review;
- no auto-revoke policy;
- support contact path;
- no instant access guarantee;
- manual fulfillment boundary;
- fiscal invoice manual/accounting-led;
- Stripe Tax now/later;
- controlled live smoke approval;
- broad public sales approval.

Policy readiness: GO CONDITIONAL.

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

- Stripe test: confirmed.
- Live OFF: confirmed.
- Webhooks ON: confirmed.
- Manual fulfillment ON: confirmed.
- Auto-grants OFF: confirmed.
- Auto-revokes OFF: confirmed.
- Lemon legacy: confirmed.
- Wise manual: confirmed.
- Reconciliation visible: confirmed.
- Export visible: confirmed.
- Secrets visible: no.

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

## 10. Final GO / NO-GO Matrix

| Area | Status | Notes |
| --- | --- | --- |
| Git alignment | GO | `main` aligned with `origin/main`; unrelated work preserved. |
| Stripe account/KYC | GO CONDITIONAL | Requires owner confirmation. |
| Stripe capabilities | GO CONDITIONAL | Requires owner confirmation. |
| Payouts | GO CONDITIONAL | Payout method visible previously; final owner confirmation required. |
| Live Price IDs | GO CONDITIONAL | Products/prices exist; secure ID capture not attested. |
| Live webhook | GO CONDITIONAL | Endpoint exists; secure signing secret capture not attested. |
| Hostinger env package | GO CONDITIONAL | Package documented; live values not applied. |
| Refund/legal/fiscal | GO CONDITIONAL | Owner decision pending. |
| Admin billing | GO | Regression OK. |
| Ledger/reconciliation | GO | Counts stable. |
| Manual fulfillment | GO | Explicit admin-only boundary remains. |
| Rollback | GO | Test-mode rollback path remains available. |
| Owner approval | NO-GO | Explicit BILLING-9 approval not provided. |

Overall result: PARCIAL / GO CONDITIONAL.

## 11. Conditions For BILLING-9

BILLING-9 can start only if all required owner-side items are explicitly confirmed:

1. live Price IDs are stored securely by owner;
2. live webhook signing secret is stored securely by owner;
3. live Stripe secret key is stored securely by owner;
4. account/KYC/capabilities are acceptable for live;
5. payout settings are acceptable;
6. tax/fiscal/refund path is accepted for first live smoke;
7. owner explicitly authorizes Hostinger env switch;
8. owner explicitly authorizes first live payment smoke.

## 12. Security

Confirmed:

- no live activation;
- no real payment;
- no real card;
- no Hostinger env changes;
- no secrets documented;
- no full Price IDs documented;
- no bank details documented;
- no auto-grants;
- no auto-revokes;
- no Lemon checkout;
- no Wise API;
- no DNS changes;
- no email changes;
- no historical data deletion.

## 13. Risks

- Owner-side secret/Price ID storage is not attested.
- Owner-side KYC/capability/tax confirmation is not attested.
- Public legal/refund/fiscal readiness is not finalized.
- `plan_id` metadata remains unverified.
- BILLING-9 must not begin until owner gives explicit live activation approval.

## 14. Next Hito

Recommended next hito: `BILLING-8D-OWNER-ATTESTATION` if owner needs to provide final confirmations.

Proceed to `BILLING-9-LIVE-ACTIVATION-CONTROLLED` only after owner explicitly confirms all items in section 11.

## 15. Percentages

- Billing total: 92-95%.
- Stripe readiness: 94-96%.
- Stripe live readiness: 84-89%.
- Payment readiness: 88-91%.
- Operational readiness: 91-94%.
- ShiftReadiness global: 95-97%.
