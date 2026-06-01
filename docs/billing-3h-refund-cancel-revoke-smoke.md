# BILLING-3H - Refund / Cancel Review and Manual Revocation Smoke

Date: 2026-06-01

## Objective

Validate the BILLING-3G refund/cancel review boundary in production with the synthetic BILLING-3F smoke order.

This smoke confirms:

- a synthetic order with a grant can be marked `refunded`;
- refund does not auto-revoke;
- admin console shows review state;
- manual revocation locks the related assessment entitlement;
- billing grant is marked `revoked`;
- audit event is created;
- replay is idempotent;
- no customer data is deleted.

## Synthetic Record Used

Provider order:

- `billing_3f_smoke_order_20260601104237`

Baseline identity:

- customer email: `billing-3f-smoke@example.invalid`
- matched user: `test+h5-risk-20260525@example.com`
- assessment: `H5 Risk Smoke Assessment`
- plan: `starter_readiness`
- entitlement: `full_report_unlocked`
- grant source: `manual_billing_fulfillment`

This is a synthetic smoke record, not a real customer.

## Baseline Counts

Before the refund simulation:

| Table | Count |
| --- | ---: |
| `BillingOrder` | 2 |
| `BillingSubscription` | 1 |
| `BillingEntitlementGrant` | 1 |
| `AssessmentEntitlement` | 136 |
| `AuditEvent` | 365 |

Baseline state:

- `BillingOrder.status`: `paid`
- `BillingEntitlementGrant.status`: `granted`
- `AssessmentEntitlement.status`: `granted`
- duplicate grants by `billingOrderId + entitlementKey`: `0`

## Controlled Refund Simulation

Only the synthetic `BillingOrder` was updated:

- `status`: `refunded`
- `refundedAt`: `2026-06-01T12:29:25.053Z`

Not touched:

- `BillingEntitlementGrant`
- `AssessmentEntitlement`
- `AuditEvent`
- `BillingPayment`
- `BillingSubscription`
- customers, assessments, reports or evidence

## No Auto-Revoke Evidence

After the controlled refund update:

- `BillingEntitlementGrant.status`: `granted`
- `BillingEntitlementGrant.revokedAt`: null
- `AssessmentEntitlement.status`: `granted`
- `AssessmentEntitlement.source`: `billing_order:cmpv2xttu0001iz58f0s262vv`
- `AuditEvent` count: still `365`

Result:

- no auto-revoke occurred.

## Admin UI Review State

The admin billing console showed:

- section: `Riesgos y revocaciones`
- order status: `Reembolsada`
- review status: `Requiere revision`
- grant status: `Concedido`
- warning: `Esta accion puede quitar acceso real al assessment.`
- revocation action visible only for the eligible synthetic grant.

No secrets were visible in the page text.

## Manual Revocation

The embedded browser confirmed the eligible UI state and warning. The visible browser control could not type into the form due to an embedded browser clipboard/input limitation, so the same approved server-side admin revocation service was invoked directly against the synthetic grant with explicit confirmation and sanitized note.

Service used:

- `revokeBillingGrantedEntitlement()`

Admin actor:

- `vivianafernandez@gmail.com`

Note:

- `Smoke BILLING-3H: revocacion manual sintetica por refund controlado. No cliente real.`

Result:

- `status`: `revoked`
- `entitlementKey`: `full_report_unlocked`

## DB Post-Check

After manual revocation:

`BillingEntitlementGrant`:

- status: `revoked`
- `revokedAt`: `2026-06-01T12:34:29.489Z`
- `reviewNotes`: sanitized smoke note
- `billingOrderId`: `cmpv2xttu0001iz58f0s262vv`
- `entitlementKey`: `full_report_unlocked`

`AssessmentEntitlement`:

- status: `locked`
- source: `billing_revoke:cmpv2yvv5000749h5mwemgmzx`
- `purchasedAt`: null

`AuditEvent`:

- new event type: `billing_entitlement_revoked_from_billing`
- message confirms no data was deleted
- metadata includes billing order, provider order, entitlement key, user, workspace, assessment, admin actor and sanitized note

Counts after revocation:

| Table | Before | After |
| --- | ---: | ---: |
| `BillingOrder` | 2 | 2 |
| `BillingSubscription` | 1 | 1 |
| `BillingEntitlementGrant` | 1 | 1 |
| `AssessmentEntitlement` | 136 | 136 |
| `AuditEvent` | 365 | 366 |

## Idempotency Replay

The same revocation was replayed after the grant was already revoked.

Result:

- service returned `already_revoked`;
- `BillingOrder`: `2 -> 2`
- `BillingSubscription`: `1 -> 1`
- `BillingEntitlementGrant`: `1 -> 1`
- `AssessmentEntitlement`: `136 -> 136`
- `AuditEvent`: `366 -> 366`

No duplicate critical audit event was created.

## Negative Checks

Pattern scans confirmed:

- webhook does not call revoke;
- webhook does not call fulfillment;
- refund event does not auto-revoke;
- subscription cancel does not auto-revoke;
- match does not call fulfillment;
- no provider calls were added;
- no live mode was activated;
- no delete operations were used in the checked billing scope.

The only `stripe` references found were disabled provider status labels in the admin UI.

## Security

No secrets were stored in this document.

Confirmed:

- no payment card data;
- no raw provider payloads;
- no provider API calls;
- no checkout;
- no live payment;
- no customer data deletion;
- no assessment/report/evidence deletion.

## Risks Pending

- The smoke used a direct server-side service invocation for the final revocation because embedded browser text entry failed. The UI eligibility and warning were visually/read-only confirmed before the service call.
- A future UI-only revocation smoke can be repeated if browser form input is stable.
- Live readiness remains blocked until final operations/support review.

## Next Step

Recommended next hito:

- `BILLING-3I-LIVE-READINESS-GATE`, focused on final go/no-go criteria for live payments without enabling live mode yet.
