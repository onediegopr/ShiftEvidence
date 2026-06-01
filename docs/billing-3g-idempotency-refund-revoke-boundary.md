# BILLING-3G - Idempotency Hardening and Manual Revoke Boundary

## Objective

BILLING-3G hardens manual billing fulfillment idempotency and adds a conservative refund/cancel revocation boundary.

This milestone introduces:

- local additive migration for DB-level uniqueness on `BillingEntitlementGrant(billingOrderId, entitlementKey)`;
- service-level duplicate conflict handling;
- admin-only refund/cancel review visibility;
- explicit manual revocation action for eligible grants;
- audit trail for revocation.

## Migration Boundary

Migration created locally:

`prisma/migrations/20260601111500_billing_3g_grant_unique_idempotency/migration.sql`

The migration only creates a unique index:

- `BillingEntitlementGrant(billingOrderId, entitlementKey)`.

It does not:

- drop tables or columns;
- rename anything;
- delete data;
- update data;
- truncate data;
- apply production changes.

Production migration is not applied in this milestone. It must be deployed later with an explicit production migration approval.

## Idempotency

BILLING-3F documented `BillingEntitlementGrant` idempotency as service-level. BILLING-3G adds a local DB-level hardening migration so concurrent double-submit races can be blocked by the database once the migration is deployed.

Until the migration is applied to production, runtime production behavior remains protected by:

- service-level lookup before create;
- P2002 duplicate conflict handling after create attempts;
- idempotent `AssessmentEntitlement` upsert through `grantAssessmentEntitlement()`.

## Refund / Cancel Boundary

Refunds and cancellations never revoke access automatically.

The system only marks billing grants for review when:

- the grant source is `manual_billing_fulfillment`;
- the related order is `refunded` or `cancelled`;
- the grant is still `granted`.

Subscription cancellation, expiration or failed payment is surfaced as review-only. It does not expose automatic or manual assessment revocation in this milestone.

## Manual Revocation

Revocation is admin-only and requires:

- explicit admin session;
- selected `BillingEntitlementGrant`;
- source exactly `manual_billing_fulfillment`;
- grant status `granted`;
- related order status `refunded` or `cancelled`;
- matched `userId`, `workspaceId`, `assessmentId` and `billingOrderId`;
- active `AssessmentEntitlement`;
- `AssessmentEntitlement.source` exactly `billing_order:<billingOrderId>`;
- explicit confirmation checkbox;
- mandatory sanitized internal note.

If another source may justify access, the service blocks revocation and requires manual review.

## Data Written

For an eligible manual revocation:

- `AssessmentEntitlement` is locked through `revokeAssessmentEntitlement()`;
- `BillingEntitlementGrant.status` is set to `revoked`;
- `BillingEntitlementGrant.revokedAt` is set;
- `BillingEntitlementGrant.reviewNotes` stores the sanitized note;
- `AuditEvent` records the admin actor, billing order, provider order, entitlement key, user, workspace, assessment and note.

No data is deleted.

## Admin UI

The admin billing console adds:

- section: `Riesgos y revocaciones`;
- list of granted billing entitlements;
- status labels for grant/review state;
- refunded/cancelled orders with grants shown as `Requiere revision`;
- strong warning: `Esta accion puede quitar acceso real al assessment.`;
- revocation form only when the grant is eligible.

No revocation controls are shown for:

- non-manual sources;
- already revoked grants;
- subscriptions;
- grants without complete match;
- non-refunded/non-cancelled orders.

## What It Does Not Do

BILLING-3G does not:

- auto-revoke from webhook;
- auto-revoke from refund event;
- auto-revoke from subscription cancel;
- auto-grant access;
- call Lemon, Wise or Stripe APIs;
- process live payments;
- change Hostinger or env vars;
- apply production migrations;
- delete assessments, reports, users, billing ledger or customer data;
- add MSP partner entitlement automation.

## Rollback

Code rollback:

- revert the BILLING-3G commit.

Migration rollback:

- because the migration is not applied to production in this milestone, no production DB rollback is needed.
- if applied later and rollback is required, drop only the added unique index after confirming no dependent operations require it.

Data rollback:

- do not delete billing records.
- if a revocation was made incorrectly, re-grant through the approved manual entitlement path and record a corrective audit event.

## Next Step

Recommended next milestone:

- BILLING-3G-AUDIT-PUSH for controlled commit/push;
- then production migration approval/deploy as a separate hito;
- then a refund/cancel production smoke with synthetic/test-mode records only.
