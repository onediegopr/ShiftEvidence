# BILLING-3G - Production Read-Only Smoke

Date: 2026-06-01

## Objective

Validate in production, read-only, that BILLING-3G is deployed and operational after the idempotency migration.

No revocation, grant, checkout, payment, provider call or database mutation was executed.

## Git Baseline

Local branch:

- `main`
- synchronized with `origin/main`

Relevant commits present:

- `8549384 feat: harden billing grants and refund review`
- `bcb8660 docs: record Billing 3G production migration`

Working tree before the docs commit contained only the untracked logo PNGs and this read-only smoke documentation.

## Admin Route Protection

Unauthenticated request:

- URL: `https://shiftevidence.com/dashboard/admin/billing`
- status: `307`
- redirect: `https://shiftevidence.com/sign-in`

Result:

- admin route protected: yes
- no admin content exposed publicly: yes
- no secrets exposed: yes

## Admin UI Smoke

Using the embedded Codex browser with an existing admin session:

- URL opened: `https://shiftevidence.com/dashboard/admin/billing`
- page loaded: yes
- UI in Spanish: yes
- `Billing y proveedores` visible: yes
- `Riesgos y revocaciones` visible: yes
- existing grant visible: yes
- `full_report_unlocked` visible: yes
- smoke order reference visible: yes
- warning visible: `Esta accion puede quitar acceso real al assessment.`
- secrets visible: no

The visible grant is tied to a paid Starter smoke order, so the UI shows no critical revocation action. No revocation button was executed.

## DB Read-Only Verification

Target was verified through the existing safe fingerprint pattern:

- database: `neondb`
- host fingerprint: `1541e2407c9d8694`
- SSL mode: `require`

Migration:

- `20260601111500_billing_3g_grant_unique_idempotency`
- applied: yes
- `finished_at`: `2026-06-01T11:47:35.413Z`
- `rolled_back_at`: null
- `logs`: null

Unique index:

- `BillingEntitlementGrant_billingOrderId_entitlementKey_key`
- exists: yes
- columns verified: `billingOrderId`, `entitlementKey`

## Counts

Counts before and after the read-only UI smoke stayed equal:

| Table | Before | After |
| --- | ---: | ---: |
| `BillingEntitlementGrant` | 1 | 1 |
| `AssessmentEntitlement` | 136 | 136 |
| `BillingOrder` | 2 | 2 |
| `BillingSubscription` | 1 | 1 |
| `AuditEvent` | 365 | 365 |

Duplicate check:

- duplicate groups by `billingOrderId + entitlementKey`: `0`

## Review State

Current production billing grant sample:

- source: `manual_billing_fulfillment`
- status: `granted`
- entitlement: `full_report_unlocked`
- related order status: `paid`
- plan: `starter_readiness`

Interpretation:

- `granted + paid` means no critical revocation action is required.
- no refunded/cancelled grant exists in current production data.
- subscription status is currently `active`.
- no forced refunded/cancelled data was created.

Expected boundary remains:

- `granted + refunded/cancelled` should require review.
- `revoked` should display as revoked.
- subscription cancelled/payment failed should be review-only and must not auto-revoke.

## Negative Safety Verification

Pattern scans confirmed:

- webhook code does not call revoke;
- webhook code does not call fulfillment;
- refund event does not call automatic revoke;
- subscription cancel does not call automatic revoke;
- match does not call fulfillment;
- no provider API calls were added;
- no live mode was activated.

The only `stripe` text found in the checked scope is the disabled provider status label in the admin UI.

## Security

No secrets were printed or stored.

Verified absent from the new documentation:

- Lemon secret key prefixes;
- live/test secret key prefixes;
- real bearer tokens
- real JWTs
- `DATABASE_URL` values
- webhook secret values
- API key values
- card-like data

## Out of Scope Confirmed

Not performed:

- no revocation;
- no grants;
- no orders;
- no payments;
- no subscriptions;
- no checkout;
- no live payments;
- no provider calls;
- no Hostinger/env changes;
- no schema change;
- no migration;
- no `db push`;
- no data deletion;
- no PNG changes.

## Risks Pending

- Refund/cancel smoke still needs a controlled synthetic/test-mode scenario.
- Live readiness remains blocked until refund/cancel operations and support runbook are validated.
- No live payment mode should be enabled from this hito.

## Next Hito

Recommended next hito:

- `BILLING-3H-REFUND-CANCEL-SMOKE-SAFE`, using only synthetic/test-mode data and no live payments.
