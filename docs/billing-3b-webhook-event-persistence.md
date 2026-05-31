# BILLING-3B - Lemon Webhook Event Persistence

Date: 2026-05-31

Status: implemented locally. Not pushed. Not deployed.

## 1. Goal

BILLING-3B adds the first server-side Lemon Squeezy webhook receiver for Shift
Evidence.

Implemented:

- `POST /api/webhooks/lemon`;
- raw body capture with `request.text()`;
- Lemon `X-Signature` verification with HMAC SHA-256;
- server-side webhook secret lookup;
- `BillingEvent` persistence only;
- idempotent duplicate handling;
- failed technical capture state;
- unit tests.

Not implemented:

- `BillingOrder` creation;
- `BillingPayment` creation;
- `BillingSubscription` creation;
- `BillingEntitlementGrant` creation;
- unlocks;
- entitlement grants;
- refund automation;
- MSP automation;
- admin UI;
- live payment changes.

## 2. Endpoint

Endpoint:

```text
POST /api/webhooks/lemon
```

The endpoint:

1. reads the webhook secret from server-side environment only;
2. reads the raw request body using `request.text()`;
3. verifies `X-Signature` before trusting or parsing JSON;
4. parses the signed JSON payload;
5. extracts `data.id` as `providerEventId`;
6. extracts event name from `meta.event_name` or `X-Event-Name`;
7. persists a single `BillingEvent`;
8. returns a small JSON response.

## 3. Signature Verification

Supported env names:

- `LEMON_SQUEEZY_WEBHOOK_SECRET`;
- `LEMONSQUEEZY_WEBHOOK_SECRET`.

Verification:

- compute `HMAC-SHA256(rawBody, webhookSecret)` as hex;
- compare with `X-Signature`;
- use timing-safe comparison;
- reject missing or mismatched signatures.

If the secret is not configured:

- return `503`;
- do not parse the body;
- do not persist anything.

If the signature is invalid:

- return `401`;
- do not parse the body;
- do not persist anything.

## 4. Payload Handling

The route parses JSON only after signature verification.

Required fields:

- `data.id`;
- `meta.event_name` or `X-Event-Name`.

If JSON is invalid or `data.id` is missing:

- do not invent provider IDs;
- do not persist raw body;
- return a safe `invalid_payload` error.

Persisted safe metadata:

- provider;
- provider event id;
- event type;
- resource type;
- test mode flag if present;
- custom data if present.

Raw payload is not stored. Only `rawPayloadHash` is stored.

## 5. BillingEvent Semantics

`BillingEvent.status = processed` in BILLING-3B means:

```text
The webhook was signature-verified, parsed and persisted technically.
```

It does not mean:

- the Lemon order was processed as a business order;
- a payment was reconciled;
- a subscription was reconciled;
- an entitlement was granted;
- an unlock happened.

Business processing remains future scope.

## 6. Idempotency

Idempotency key:

```text
billing_event:lemon_squeezy:<providerEventId>
```

Duplicate behavior:

- do not create another row;
- update the existing `BillingEvent` to `ignored`;
- return OK.

This is intentionally limited to `BillingEvent`. No order, payment,
subscription or grant is created during duplicate handling.

## 7. Failure Handling

If persistence fails after signature verification and parsing:

- attempt to persist a `BillingEvent` with `status=failed`;
- include a short safe `errorMessage`;
- do not store raw payload;
- do not create business records.

If even failure persistence fails:

- return `event_persistence_failed`;
- do not attempt destructive recovery.

## 8. Security Boundary

The endpoint does not:

- use Lemon API keys;
- call Lemon APIs;
- expose webhook secrets;
- log raw payloads;
- store card data;
- trust unsigned JSON;
- create entitlements.

## 9. Tests

Added:

- `tests/unit/billingWebhookSignature.test.ts`;
- `tests/unit/billingWebhookPersistence.test.ts`;
- `tests/unit/billingWebhookIdempotency.test.ts`.

Coverage:

- valid signature;
- invalid signature;
- secret env aliases;
- invalid JSON;
- missing `data.id`;
- event persistence;
- duplicate idempotency;
- failed technical persistence.

## 10. Rollback

Before deployment:

- revert the code changes.

After deployment:

- remove the webhook URL in Lemon or keep the secret unset;
- endpoint returns safe non-processing responses without creating business records;
- no DB rollback is required because BILLING-3B adds no schema changes.

## 11. Next Milestone

Recommended next:

- BILLING-3C or BILLING-3B-SMOKE after configuring webhook secret and Lemon test-mode webhook.

Still not recommended yet:

- automatic grants;
- refunds automation;
- live payments;
- admin fulfillment automation.
