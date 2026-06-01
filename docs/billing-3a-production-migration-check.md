# BILLING-3A Production Migration Check / Apply

Date: 2026-06-01

## 1. Objective

Apply the already committed BILLING-3A ledger foundation migration to the verified production Neon branch, without touching Hostinger configuration, webhooks, checkout mode, payments, entitlements, or application code.

## 2. Target Confirmation

Production target was confirmed before applying the migration:

- Neon project: InfraShift.
- Neon project ID: icy-term-84598838.
- Production branch: production / br-raspy-morning-ap11hfm6.
- Database: neondb.
- Compute: read-write.
- Hostinger site: shiftevidence.com.
- Hostinger runtime variable checked: DATABASE_URL present.
- Hostinger DATABASE_URL fingerprint matched the local Prisma DATABASE_URL fingerprint.
- Neon compute host fingerprint matched the same target.

No DATABASE_URL value, password, API key, webhook secret, or raw secret was printed or committed.

## 3. Pre-Apply Status

Read-only production checks showed:

- Migration `20260531170000_billing_3a_ledger_foundation`: not present in `_prisma_migrations`.
- `BillingEvent`: absent.
- `BillingOrder`: absent.
- `BillingPayment`: absent.
- `BillingSubscription`: absent.
- `BillingEntitlementGrant`: absent.

## 4. Migration Safety Audit

Migration file:

- `prisma/migrations/20260531170000_billing_3a_ledger_foundation/migration.sql`

Safety result:

- Additive only.
- Uses `CREATE TYPE`.
- Uses `CREATE TABLE`.
- Uses `CREATE INDEX` / `CREATE UNIQUE INDEX`.
- Uses `ALTER TABLE ADD CONSTRAINT`.
- No `DROP`.
- No `RENAME`.
- No `DELETE`, `UPDATE`, `TRUNCATE`.
- No destructive alteration of existing tables.
- No data migration.

## 5. Apply

Command executed:

```bash
npx prisma migrate deploy
```

Result:

- Migration applied successfully.
- Applied migration: `20260531170000_billing_3a_ledger_foundation`.
- `finished_at`: `2026-06-01T07:45:55.176Z`.
- `rolled_back_at`: null.
- `logs`: null.
- `applied_steps_count`: 1.

## 6. Post-Apply Verification

Production tables present:

- `BillingEvent`
- `BillingOrder`
- `BillingPayment`
- `BillingSubscription`
- `BillingEntitlementGrant`

Billing enums present:

- `BillingProvider`
- `BillingEventStatus`
- `BillingOrderStatus`
- `BillingPaymentStatus`
- `BillingSubscriptionStatus`
- `BillingGrantStatus`

Initial row counts after migration:

- `BillingEvent`: 0
- `BillingOrder`: 0
- `BillingPayment`: 0
- `BillingSubscription`: 0
- `BillingEntitlementGrant`: 0

This confirms the migration created schema only. No billing event, order, payment, subscription, or grant was inserted.

## 7. Out of Scope

Not performed:

- No `prisma db push`.
- No `prisma migrate reset`.
- No `prisma migrate dev` against production.
- No data delete/update/truncate.
- No Hostinger env change.
- No Hostinger redeploy/restart.
- No Lemon webhook creation.
- No webhook smoke.
- No webhook POST.
- No live payments.
- No test payments.
- No card usage.
- No grants.
- No orders/payments/subscription processing.
- No Wise or Stripe integration.

## 8. Validations

Passed:

- `npx prisma validate`
- `npx prisma generate`
- `npm run typecheck`
- `npm run lint`
- `npm run test:run` — 73 files / 345 tests
- `npm run build`

Build note:

- The known Turbopack/NFT warning remains for `src/server/evidence/localStorageService.ts`.

## 9. Rollback

Rollback was not executed.

If rollback is ever required, do not run destructive commands ad hoc. Prepare and review an explicit rollback migration for the five BILLING-3A tables/enums and only apply it after confirming no production billing data exists or after exporting/handling any data according to a signed-off incident plan.

## 10. Final State

BILLING-3A production migration status: complete.

The production database now has the ledger foundation required by BILLING-3B/BILLING-3C runtime code, but billing business automation remains intentionally incomplete until later milestones.
