# BILLING-3F - Manual Fulfillment / Grants from Verified Billing Orders

## Objective

Implement an admin-only manual fulfillment flow that grants assessment access from a verified, matched `BillingOrder`.

This milestone starts touching real access, so it remains intentionally narrow:

- no webhook auto-grants;
- no match-triggered fulfillment;
- no subscription fulfillment;
- no Lemon, Wise or Stripe calls;
- no live-payment assumptions;
- no schema or migration changes.

## Boundary

BILLING-3F grants access only when an admin explicitly submits the fulfillment action from a billing order in `/dashboard/admin/billing`.

The system does not grant access from:

- webhook receipt;
- checkout success URL;
- manual match/reconciliation;
- `BillingSubscription`;
- `BillingEvent`;
- provider API calls.

## Eligible Orders

A `BillingOrder` is eligible only when all conditions are true:

- `userId` is present;
- `workspaceId` is present;
- `assessmentId` is present;
- plan is supported;
- status is `paid`;
- order is not refunded;
- order is not cancelled;
- assessment belongs to the matched workspace;
- user owns or belongs to the matched workspace;
- the admin confirms the action explicitly.

## Non-Eligible Orders

The following are ineligible:

- unmatched or partially matched order;
- `pending` order in production;
- `refunded` order;
- `cancelled` order;
- unknown plan;
- `msp_partner`;
- `migration_blueprint`;
- any order whose user/workspace/assessment relationship no longer validates.

The synthetic production order created in BILLING-3E remains `pending`; it is not eligible for production fulfillment.

## Plan Mapping

| Billing plan | Entitlements |
| --- | --- |
| `starter_readiness` | `full_report_unlocked` |
| `professional_assessment` | `full_report_unlocked`, `pro_matrix_unlocked` |
| `migration_blueprint` | Not supported in this flow |
| `msp_partner` | Not supported in this flow |

Entitlement keys are derived server-side. The UI never supplies entitlement keys as authority.

## Data Written

For an eligible fulfillment action:

- creates `BillingEntitlementGrant` rows as billing evidence;
- calls `grantAssessmentEntitlement()` to create/update `AssessmentEntitlement`;
- writes `AuditEvent` with billing order, provider order, plan, user, workspace, assessment, entitlement keys, admin actor and sanitized note.

`AssessmentEntitlement` remains the source of app access.

## Idempotency

`AssessmentEntitlement` is idempotent at DB level through the existing unique key:

- `assessmentId + entitlementKey`.

`BillingEntitlementGrant` idempotency in v1 is service-level, not DB-level. The service checks for an existing active grant for:

- `billingOrderId + entitlementKey`

before creating a new grant.

There is no unique constraint yet on `BillingEntitlementGrant(billingOrderId, entitlementKey)`. A future hardening milestone should add an additive unique constraint or equivalent DB-level guard to protect against concurrent double-submit races.

## Admin UI

The admin billing page shows a fulfillment preview for orders:

- plan;
- payment status;
- match status;
- entitlement keys to be granted;
- existing billing grants;
- eligibility or ineligibility reasons;
- strong warning: the action grants real assessment access;
- explicit confirmation checkbox.

The submit button is disabled when the order is not eligible or already granted.

Subscriptions do not expose fulfillment controls in this milestone.

## Audit Event

Fulfillment writes `billing_order_fulfilled`.

Metadata includes:

- admin actor email;
- `billingOrderId`;
- `providerOrderId`;
- `planId`;
- `userId`;
- `workspaceId`;
- `assessmentId`;
- entitlement keys;
- `BillingEntitlementGrant` IDs created;
- assessment entitlement keys touched;
- sanitized note;
- result.

No secrets, raw provider payloads, card data or payment method details are stored.

## What It Does Not Do

BILLING-3F does not:

- process webhooks into grants;
- activate auto-grant modes;
- grant from match;
- grant from subscriptions;
- grant MSP partner access;
- handle refunds or cancellation revocation;
- call Lemon, Wise or Stripe;
- change Hostinger or env vars;
- add migrations.

## Rollback

Code rollback:

- revert the BILLING-3F commit.

Data rollback if an access grant was made incorrectly:

- revoke the affected `AssessmentEntitlement` using the existing entitlement revoke pattern;
- mark related billing grant for review/revocation in a follow-up operation;
- record an audit event for the corrective action.

Do not delete billing ledger rows or assessment data.

## Next Milestone

Recommended next milestone:

- BILLING-3F-AUDIT-PUSH for controlled commit/push;
- then BILLING-3F-PROD-SMOKE with a paid test-mode order, never a live payment;
- later hardening: DB-level unique guard for `BillingEntitlementGrant(billingOrderId, entitlementKey)`.
