# BILLING-3G - Production Migration Apply

Date: 2026-06-01

## Summary

The BILLING-3G production migration was applied with `npx prisma migrate deploy`.

Migration:

- `20260601111500_billing_3g_grant_unique_idempotency`

Purpose:

- add DB-level uniqueness for `BillingEntitlementGrant(billingOrderId, entitlementKey)`.

## Target

Target was confirmed through a safe database fingerprint without printing `DATABASE_URL` or secrets.

- database: `neondb`
- host fingerprint: `1541e2407c9d8694`
- SSL mode: `require`

This matches the production Neon target used by the app runtime for Prisma operations in this workspace.

## Precheck

Before applying:

- migration applied: no
- unique index exists: no
- pending local migrations: only `20260601111500_billing_3g_grant_unique_idempotency`
- duplicate groups by `billingOrderId + entitlementKey`: `0`
- `BillingEntitlementGrant` count: `1`
- `AssessmentEntitlement` count: `136`

If duplicates had existed, the migration would not have been applied.

## Migration SQL Audit

The SQL was reviewed before execution.

It contains only:

- `CREATE UNIQUE INDEX "BillingEntitlementGrant_billingOrderId_entitlementKey_key"`
- target table: `"BillingEntitlementGrant"`
- target columns: `"billingOrderId"`, `"entitlementKey"`

Confirmed absent:

- `DROP`
- `DELETE`
- `UPDATE`
- `TRUNCATE`
- data migration
- destructive database operations

## Apply

Command executed:

```bash
npx prisma migrate deploy
```

Result:

- migration applied successfully;
- no `prisma db push`;
- no `migrate reset`;
- no `migrate dev` against production.

## Post-Check

After applying:

- migration applied: yes
- `finished_at`: `2026-06-01T11:47:35.413Z`
- `rolled_back_at`: null
- `logs`: null
- unique index exists: yes
- unique index references `billingOrderId` and `entitlementKey`: yes
- duplicate groups by `billingOrderId + entitlementKey`: `0`
- `BillingEntitlementGrant` count: `1`
- `AssessmentEntitlement` count: `136`

Counts before and after remained equal:

| Table | Before | After |
| --- | ---: | ---: |
| `BillingEntitlementGrant` | 1 | 1 |
| `AssessmentEntitlement` | 136 | 136 |

No business data was altered.

## Validations

Completed after migration:

- `npx prisma validate`
- `npx prisma generate`
- `npm run typecheck`
- `npm run lint`
- `npm run test:run`
- `npm run build`

`npm run test:run` result:

- 86 files passed;
- 400 tests passed.

`npm run build` result:

- passed;
- existing Turbopack/NFT warning remains around `localStorageService.ts`.

Local build initially hit a Windows EPERM lock on a generated `.next/static` artifact. The resolved path was verified inside the workspace and only that generated artifact was removed before rerunning the build.

## Security and Scope

Not performed:

- no Hostinger changes;
- no env changes;
- no checkout;
- no provider API calls;
- no live payments;
- no grants;
- no revocation smoke;
- no data deletion;
- no assessment/report/user deletion.

Secrets were not printed or stored.

## Next Step

Recommended next hito:

- BILLING-3G-PROD-SMOKE-READONLY for admin UI readiness and read-only verification;
- then a separate controlled refund/cancel test-mode smoke before any live readiness decision.
