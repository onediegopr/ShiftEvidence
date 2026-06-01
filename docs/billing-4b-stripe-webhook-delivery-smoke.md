# BILLING-4B - Stripe Webhook Delivery + BillingEvent Persistence Smoke

Date: 2026-06-01

## 1. Objective

Validate a controlled production smoke for Stripe test-mode checkout and webhook delivery.

This hito validates technical capture only:

- Stripe Checkout test payment can complete.
- Stripe sends a signed webhook to `/api/webhooks/stripe`.
- The app validates the signature.
- A technical `BillingEvent` is persisted.
- Duplicate replay does not duplicate rows.
- No automatic grant, revoke, fulfillment or live payment is triggered.

## 2. Executive Summary

Status: COMPLETO.

Verdict: Stripe test-mode checkout and signed webhook delivery are working in production. The webhook event was captured as a technical `BillingEvent`. No commercial ledger mapping, order/payment/subscription creation, grant or revoke automation was triggered.

## 3. Pre-Audit

Git baseline:

- Branch: `main`.
- HEAD before smoke: `95b349a docs: record Stripe test checkout smoke`.
- Working tree before smoke: clean except untracked logo PNGs.

Production/runtime status:

- Stripe configured in test mode.
- `STRIPE_CHECKOUT_MODE=test`.
- Live payments: OFF.
- `sk_live_`: not detected.
- Lemon Squeezy: legacy/rejected/disabled.
- Wise: manual invoice flow.
- Auto-grants: OFF.
- Auto-revokes: OFF.
- Admin UI exposed no secrets.

Route checks:

- `/pricing`: 200.
- `/billing/checkout/starter`: 200.
- `/billing/checkout/professional`: 200.
- `/billing/checkout/msp`: 200.
- `GET /api/webhooks/stripe`: 405.

## 4. DB Baseline Before

Read-only counts before completing the Stripe test checkout:

- `BillingEvent`: 1.
- `BillingOrder`: 2.
- `BillingPayment`: 0.
- `BillingSubscription`: 1.
- `BillingEntitlementGrant`: 1.
- `AssessmentEntitlement`: 136.
- `AuditEvent`: 366.

Recent Stripe `BillingEvent` records before smoke: none.

## 5. Checkout Test

Plan used:

- Starter Readiness.
- Amount: USD 490.
- Email: `stripe-4b-starter-smoke@example.invalid`.
- Payment method: official Stripe test card.
- Mode: Stripe test mode.

Result:

- Checkout opened on `checkout.stripe.com`.
- Product displayed: Starter Readiness.
- Amount displayed: USD 490.00.
- Stripe Checkout showed test-mode state.
- Payment completed successfully in test mode.
- Redirect returned to `/billing/checkout/starter?status=success`.

The success page kept the manual fulfillment boundary clear: no entitlement is granted automatically after payment.

No real card was used and no live payment was attempted.

## 6. Webhook Delivery

Stripe event received:

- Event ID: `evt_1TdX5A2ehRcYyaOrKHUby8yZ`.
- Event type: `checkout.session.completed`.
- Livemode: `false`.
- Resource type: `checkout.session`.
- Resource ID prefix: `cs_test_`.

App result:

- Valid signed Stripe webhook accepted.
- `BillingEvent` created.
- Initial persisted status: `processed`, meaning technically captured/persisted only.
- No business-level order, payment, subscription, grant or entitlement was processed by this hito.

Stripe event was also verified through Stripe test API metadata without exposing API keys.

## 7. Idempotency

Replay method:

- Same Stripe event ID replayed with a valid signature generated from the configured webhook secret.
- No secret value was printed or documented.

Replay result:

- HTTP status: 200.
- Outcome: `duplicate_ignored`.
- `BillingEvent` count remained unchanged.
- No duplicate row was created.

Observed implementation detail:

- The current idempotency behavior updates the existing event status to `ignored` on duplicate replay.
- This confirms no duplication, but preserving the original `processed` capture status while separately recording duplicate attempts is a recommended future hardening.

## 8. Invalid Signature Regression

Invalid-signature POST after the smoke:

- Status: 401.
- Error: `invalid_signature`.
- `BillingEvent` count before invalid test: 2.
- `BillingEvent` count after invalid test: 2.

Invalid signatures remain rejected and do not mutate billing event records.

## 9. DB After

Read-only counts after checkout, webhook delivery, idempotency replay and invalid-signature regression:

- `BillingEvent`: 2.
- `BillingOrder`: 2.
- `BillingPayment`: 0.
- `BillingSubscription`: 1.
- `BillingEntitlementGrant`: 1.
- `AssessmentEntitlement`: 136.
- `AuditEvent`: 366.

Delta:

- `BillingEvent`: +1.
- `BillingOrder`: +0.
- `BillingPayment`: +0.
- `BillingSubscription`: +0.
- `BillingEntitlementGrant`: +0.
- `AssessmentEntitlement`: +0.
- `AuditEvent`: +0.

No automatic fulfillment, grant or revoke occurred.

## 10. Admin Billing Post-Smoke

Admin page checked:

- `/dashboard/admin/billing`.

Observed:

- Stripe: configured test.
- Checkout mode: Test.
- Live payments: OFF.
- Webhooks: ON.
- Lemon Squeezy: legacy/rejected/disabled.
- Wise: manual invoice.
- Entitlements automaticos: OFF.
- Recent Stripe event visible.
- No secret values visible.

Because the idempotency replay marks the duplicate state on the existing row, the admin UI showed the Stripe event under ignored events after replay.

## 11. Security Confirmation

Confirmed:

- no live payments;
- no `sk_live_`;
- no real card;
- no real customer data;
- no Lemon checkout activation;
- no Wise API call;
- no automatic grant;
- no automatic revoke;
- no `AssessmentEntitlement` mutation;
- no `BillingEntitlementGrant` mutation;
- no secrets in docs, repo or admin UI;
- no DNS, mail or destructive data changes.

## 12. Validations

Local validation baseline executed after documentation:

- `npx prisma validate`.
- `npx prisma generate`.
- `npm run typecheck`.
- `npm run lint`.
- `npm run test:run`.
- `npm run build`.

## 13. Risks And Follow-Ups

Remaining risks:

- Stripe events are not yet mapped to `BillingOrder`, `BillingPayment` or `BillingSubscription`.
- Valid duplicate replay currently changes the existing event status to `ignored`; future hardening should preserve first-capture status and separately record duplicate attempts.
- Fulfillment remains manual.
- Live payments remain blocked behind a separate go-live gate.

## 14. Recommended Next Hito

Recommended:

- BILLING-5 - Stripe Event to Ledger Mapping + Manual Fulfillment.

If the duplicate-status behavior is considered too lossy before mapping:

- BILLING-4C - Stripe Webhook Idempotency Hardening.
