# BILLING-3C - Admin Billing Console

Date: 2026-05-31

Status: implemented locally. Not pushed. Not deployed.

## 1. Goal

BILLING-3C adds a read-only internal admin console for billing operations.

Route:

```text
/dashboard/admin/billing
```

The route is protected by the existing admin guard and uses Spanish labels.

## 2. Implemented

- Lemon Squeezy provider status;
- Wise provider status;
- Stripe deferred status;
- Billing Operations status;
- BillingEvent ledger preview;
- failed, pending and ignored event counts;
- support diagnostic guidance;
- tests for provider status, ledger read-only behavior and Spanish labels.

## 3. Not Implemented

- orders;
- payments;
- subscriptions;
- grants;
- manual match;
- refund automation;
- Wise API calls;
- Stripe integration;
- live payments;
- Hostinger changes;
- env changes;
- schema or migration changes.

## 4. Lemon Squeezy Card

Shows:

- status;
- Store ID presence;
- API key presence;
- API key alias presence;
- Starter Variant ID presence;
- Professional Variant ID presence;
- MSP Variant ID presence;
- checkout mode;
- checkout enabled;
- webhook secret presence;
- webhook endpoint availability;
- events received;
- failed events;
- last event;
- recommended action;
- risk level.

Only boolean presence is shown. No secret values are rendered.

## 5. Wise Card

Shows:

- manual/default status;
- token presence;
- API URL mode;
- profile ID presence;
- current use;
- automation disabled;
- last verification state;
- recommendation.

Wise remains manual. The console does not call Wise APIs, create recipients or
create transfers.

## 6. Stripe Card

Shows:

- deferred/disabled status;
- not publicly visible;
- checkout inactive;
- future optional provider reason;
- recommendation not to configure yet.

No Stripe integration is active.

## 7. Billing Operations

Shows:

- checkout test-mode;
- live payments;
- manual fulfillment;
- webhooks;
- ledger;
- automatic entitlements;
- reconciliation mode;
- persisted order/payment/subscription status as future/not implemented.

Manual fulfillment remains the operating boundary.

## 8. Ledger Preview

The ledger preview reads only `BillingEvent`.

Columns:

- date;
- provider;
- event;
- status;
- provider event id;
- error;
- processed timestamp.

Status labels:

- `pending` -> `Pendiente`;
- `processed` -> `Capturado`;
- `failed` -> `Fallido`;
- `ignored` -> `Ignorado`.

Important meaning:

`Capturado` means the event was verified and persisted technically. It does not
mean payment processing, order creation, subscription reconciliation or access
granting.

The UI does not show raw payloads or complete `safePayloadJson`.

## 9. Support Diagnostics

The page includes quick triage for:

- checkout `not_configured`;
- customer paid but no access;
- webhook not arriving;
- failed event;
- refund/cancel.

All actions point back to manual verification and runbook-based operation.

## 10. Security

The implementation:

- does not expose API keys;
- does not expose webhook secrets;
- does not show raw webhook bodies;
- does not mutate database records;
- does not create billing business entities;
- does not grant entitlements.

## 11. Rollback

Before deploy:

- revert the BILLING-3C commit.

After deploy:

- remove or hide the admin route by reverting the commit;
- no DB rollback is required;
- no env rollback is required.

## 12. Next Step

Recommended next:

- BILLING-3C-SMOKE for admin authenticated UI verification; or
- BILLING-3D planning for manual match/grant boundaries, without automation.
