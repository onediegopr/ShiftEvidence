# BILLING-3B Test Delivery Closure

Date: 2026-06-01

## 1. Summary

Status: COMPLETE with DB-verified webhook persistence.

A controlled synthetic signed POST was sent to the production Lemon webhook endpoint to close the BILLING-3B delivery smoke that remained pending after the Lemon dashboard did not expose a visible test delivery action.

Validated:

- production webhook endpoint accepts a valid HMAC SHA-256 signature;
- exactly one `BillingEvent` is persisted;
- duplicate replay is idempotent and does not create a second row;
- invalid signature is rejected with `401`;
- no `BillingOrder`, `BillingPayment`, `BillingSubscription`, or `BillingEntitlementGrant` rows are created.

Not performed:

- no live payment;
- no checkout;
- no card;
- no Lemon order;
- no grants;
- no unlocks;
- no schema or migration;
- no Wise or Stripe action.

## 2. Baseline

Git baseline:

- Branch: `main`.
- `main` synchronized with `origin/main`.
- Commit present: `192f0e6 docs: record Lemon webhook production smoke`.
- Working tree clean except existing untracked logo PNG files.

Production DB baseline:

- `BillingEvent`: 0
- `BillingOrder`: 0
- `BillingPayment`: 0
- `BillingSubscription`: 0
- `BillingEntitlementGrant`: 0

## 3. Synthetic Payload

Payload type:

- Lemon-like synthetic JSON.
- `meta.event_name`: `order_created`.
- `meta.test_mode`: true.
- `data.type`: `orders`.
- `data.attributes.status`: `test_smoke`.
- `data.attributes.test_mode`: true.
- Email domain: `.invalid`.
- No card/payment method.
- No real customer data.
- No secrets.

Smoke identifiers:

- `smoke_id`: `billing-3b-test-delivery-20260601081850`
- `providerEventId`: `evt_billing_3b_smoke_20260601081850`

The full payload body was not committed.

## 4. Valid Signed POST

Endpoint:

- `POST https://shiftevidence.com/api/webhooks/lemon`

Headers used:

- `Content-Type: application/json`
- `X-Signature: <computed HMAC SHA-256 hex digest>`
- `X-Event-Name: order_created`

Result:

- Status: `200`
- Response: `ok=true`
- Outcome: `created`
- Billing event ID returned: yes

DB after valid POST:

- `BillingEvent`: 1
- `BillingOrder`: 0
- `BillingPayment`: 0
- `BillingSubscription`: 0
- `BillingEntitlementGrant`: 0

Safe `BillingEvent` fields after creation:

- provider: `lemon_squeezy`
- providerEventId: `evt_billing_3b_smoke_20260601081850`
- eventType: `order_created`
- status: `processed`
- receivedAt: `2026-06-01T08:18:52.289Z`
- processedAt: `2026-06-01T08:18:52.248Z`
- errorMessage: null
- rawPayloadHash present: yes

Important semantic note:

- `processed` means the event was technically verified/captured/persisted.
- It does not mean an order, payment, subscription, or entitlement was processed at business level.

## 5. Idempotency Replay

The exact same raw body and valid signature were sent a second time.

Result:

- Status: `200`
- Response: `ok=true`
- Outcome: `duplicate_ignored`

DB after replay:

- `BillingEvent`: 1
- `BillingOrder`: 0
- `BillingPayment`: 0
- `BillingSubscription`: 0
- `BillingEntitlementGrant`: 0

Safe event fields after replay:

- provider: `lemon_squeezy`
- providerEventId: `evt_billing_3b_smoke_20260601081850`
- eventType: `order_created`
- status: `ignored`
- receivedAt: `2026-06-01T08:18:52.289Z`
- processedAt: `2026-06-01T08:19:19.359Z`
- errorMessage: null
- rawPayloadHash present: yes

## 6. Invalid Signature

The same synthetic body was sent with an invalid signature.

Result:

- Status: `401`
- Response: `ok=false`
- Error: `invalid_signature`

DB after invalid signature:

- `BillingEvent`: 1
- `BillingOrder`: 0
- `BillingPayment`: 0
- `BillingSubscription`: 0
- `BillingEntitlementGrant`: 0

This confirms invalid signatures do not create billing events.

## 7. Admin Console Visibility

Unauthenticated admin check:

- `/dashboard/admin/billing` redirects to `/sign-in`.

Authenticated admin visibility:

- Pending.
- No admin session was available in the in-app browser.

DB verification is sufficient for BILLING-3B webhook persistence closure. Admin visual confirmation remains a follow-up smoke.

## 8. Secrets

The webhook secret was not written to files, docs, commits, or the final report.

During Lemon dashboard inspection, an intermediate webhook secret was exposed in transient tool output. It was immediately rotated and replaced in both Lemon and Hostinger before the production POST smoke. The final operational secret was not printed or saved.

Secret scan on this documentation found no secret patterns.

## 9. Final State

BILLING-3B delivery smoke is closed at DB persistence level:

- valid signed webhook: accepted;
- event persistence: confirmed;
- duplicate idempotency: confirmed;
- invalid signature rejection: confirmed;
- no business ledger rows created beyond `BillingEvent`.

## 10. Next Step

Recommended next hito:

- BILLING-3D manual review / event-to-order mapping spec, or
- BILLING-3C authenticated admin console smoke once an admin session is available.

Do not proceed to automated grants, orders, payments, subscriptions, refunds, or entitlements until the business processing hito is explicitly approved.
