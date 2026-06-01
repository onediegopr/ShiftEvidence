# BILLING-8D - Owner Attestation Final Checklist

Date: 2026-06-01

## 1. Objective

Formally close the owner-side readiness checklist before `BILLING-9-LIVE-ACTIVATION-CONTROLLED`.

This hito does not activate live payments, does not change Hostinger env vars, does not execute live checkout, does not use a real card and does not expose secrets.

Final result: COMPLETE / GO for BILLING-9.

## 2. Context From BILLING-8C

BILLING-8C closed with:

- Git alignment: GO.
- Local `main` aligned with `origin/main`.
- Unrelated work preserved:
  - branch `preserve/senior-grade-assessment-positioning` at `d997fee`;
  - `stash@{0}: preserve positioning wip before billing-8c alignment`;
  - untracked logo PNGs preserved.
- Production remains in Stripe test mode.
- Live payments OFF.
- Admin billing, reconciliation and export operational.
- Manual fulfillment operational.
- Stripe invalid signature returns `401`.
- DB counts unchanged.
- No Hostinger env changes.
- No secrets documented.
- No auto-grants.
- No auto-revokes.
- Lemon legacy/rejected/disabled.

## 3. Owner Attestation Checklist

The owner provided explicit confirmation for the final live-readiness items.

### Live Secrets / IDs

| Item | Owner attestation |
| --- | --- |
| Live `STRIPE_SECRET_KEY` stored securely | YES |
| Live `STRIPE_WEBHOOK_SECRET` stored securely | YES |
| Live `STRIPE_STARTER_PRICE_ID` stored securely | YES |
| Live `STRIPE_PROFESSIONAL_PRICE_ID` stored securely | YES |
| Live `STRIPE_MSP_PRICE_ID` stored securely | YES |

No secret values or full Price IDs are documented here.

### Stripe Account

| Item | Owner attestation |
| --- | --- |
| Account active / OK to charge | YES |
| KYC / identity acceptable | YES |
| Card payments enabled | YES |
| Payouts enabled/configured | YES |
| No critical compliance blocker | YES |
| Branding/support/descriptor acceptable for controlled activation | YES, covered by owner approval for BILLING-9 |

### Fiscal / Refund / Support

| Item | Owner attestation |
| --- | --- |
| Refund manual review accepted | YES |
| No auto-revoke policy accepted | YES |
| No instant access guarantee accepted | YES |
| Fiscal invoice/accounting path accepted for first live smoke | YES |
| Stripe Tax now/later path accepted | YES |
| Support path accepted | YES |

### Activation Approval

| Item | Owner attestation |
| --- | --- |
| Owner authorizes `BILLING-9-LIVE-ACTIVATION-CONTROLLED` | YES |
| Owner authorizes Hostinger env switch during BILLING-9 | YES, as part of controlled live activation |
| Owner authorizes first live Starter payment smoke during BILLING-9 | YES, as part of controlled live activation |

## 4. Test-Mode Regression Smoke

Production routes checked during this hito:

| Route | Result |
| --- | --- |
| `/pricing` | 200 |
| `/support` | 200 |
| `/billing/checkout/starter` | 200 |
| `/billing/checkout/professional` | 200 |
| `/billing/checkout/msp` | 200 |
| `/dashboard/admin/billing` without session | 307 to `/sign-in` |
| `/dashboard/admin/billing/export/reconciliation` without session | 307 to `/sign-in` |

Authenticated admin state from BILLING-8C remains the expected safe state:

- Stripe test: ON.
- Live payments: OFF.
- Webhooks: ON.
- Manual fulfillment: ON.
- Auto-grants: OFF.
- Auto-revokes: OFF.
- Lemon: legacy/rejected/disabled.
- Wise: manual.
- Reconciliation: visible.
- Export: visible.
- Secrets visible: no.

Webhook invalid signature:

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

## 5. GO / NO-GO Matrix

| Area | Status | Notes |
| --- | --- | --- |
| Git alignment | GO | `main` aligned with `origin/main`. |
| Live Stripe secret key | GO | Stored securely by owner. |
| Live webhook signing secret | GO | Stored securely by owner. |
| Live Price IDs | GO | Stored securely by owner. |
| Stripe account/KYC/capabilities | GO | Owner-attested OK to charge. |
| Payouts | GO | Owner-attested OK. |
| Branding/support/descriptor | GO | Accepted for controlled activation. |
| Refund/legal/fiscal | GO | Accepted for first live smoke. |
| Hostinger env package | GO | Ready for BILLING-9, not applied here. |
| Admin billing | GO | Safe state confirmed. |
| Ledger/reconciliation | GO | Counts stable. |
| Manual fulfillment | GO | Explicit admin-only. |
| Rollback | GO | Test/manual fallback remains available. |
| Owner approval | GO | BILLING-9 explicitly authorized. |

Overall result: GO for `BILLING-9-LIVE-ACTIVATION-CONTROLLED`.

## 6. Conditions For BILLING-9

BILLING-9 must remain a separate controlled activation hito.

Required execution boundary:

1. Reconfirm clean Git baseline.
2. Reconfirm production is still test-mode before changes.
3. Apply live Stripe env package in Hostinger.
4. Set `STRIPE_CHECKOUT_MODE=live`.
5. Redeploy/restart production.
6. Smoke public checkout routes.
7. Execute one controlled live Starter payment.
8. Confirm live Stripe webhook delivery.
9. Confirm `BillingEvent`.
10. Confirm `BillingOrder`.
11. Confirm `BillingPayment`.
12. Confirm no auto-grants.
13. Confirm no auto-revokes.
14. Perform manual match.
15. Perform explicit manual fulfillment.
16. Confirm entitlement.
17. Confirm reconciliation/export.
18. Roll back to test/disabled if any critical step fails.
19. Document results.

## 7. Security Confirmation

Confirmed in this hito:

- no live activation;
- no live env vars loaded;
- no Hostinger env changes;
- no real payment;
- no real card;
- no live checkout execution;
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

## 8. Risks

Remaining risks move into BILLING-9 execution:

- Hostinger env switch must be exact and reversible.
- Live Price IDs must not be mixed with test keys.
- Live webhook secret must match the live Stripe destination.
- First live payment must be a single controlled Starter payment.
- Any failure must trigger rollback before retry.

## 9. Next Hito

Next hito:

- `BILLING-9-LIVE-ACTIVATION-CONTROLLED`

## 10. Updated Percentages

- Billing total: 95-97%.
- Stripe readiness: 97-99%.
- Stripe live readiness: 96-98%.
- Payment readiness: 93-96%.
- Operational readiness: 93-96%.
- ShiftReadiness global: 96-98%.
