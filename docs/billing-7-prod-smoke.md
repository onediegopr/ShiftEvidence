# BILLING-7-PROD-SMOKE - Operations, Reconciliation + Export

Date: 2026-06-01

## 1. Executive Summary

Production smoke for BILLING-7 was completed after commit `a928d61 feat: add billing operations reconciliation gate`.

Status: COMPLETE.

Verdict: production is serving the BILLING-7 admin operations, reconciliation and export surface. Public checkout copy remains safe, Stripe stays test-mode/configurable, Lemon remains legacy/disabled, Wise remains manual invoice, and no live payments or automated grants were activated.

## 2. Git Baseline

- Branch: `main`.
- Local HEAD: `a928d61 feat: add billing operations reconciliation gate`.
- `origin/main`: synced with local HEAD.
- Working tree before docs: clean except preserved untracked logo PNGs:
  - `images/shift-evidence-logo-transparent-1024.png`
  - `images/shift-evidence-logo-transparent-512.png`

## 3. Production Deploy Verification

Hostinger did not expose a commit hash during the smoke, so production readiness was inferred from runtime behavior.

Confirmed production signals for BILLING-7:

- `/dashboard/admin/billing` shows `ACCIONES REQUERIDAS`.
- `/dashboard/admin/billing` shows reconciliation as manual/read-only.
- `/dashboard/admin/billing` shows `Exportar CSV`.
- `/dashboard/admin/billing/export/reconciliation` exists and is protected.
- Admin UI masks provider identifiers such as `cs_test_...` and payment identifiers.
- Public routes contain BILLING-7 manual fulfillment boundary copy.

Redeploy/restart: not performed.

## 4. Public Routes

All public routes returned HTTP 200:

| Route | Status |
| --- | ---: |
| `/` | 200 |
| `/pricing` | 200 |
| `/support` | 200 |
| `/billing/checkout/starter` | 200 |
| `/billing/checkout/professional` | 200 |
| `/billing/checkout/msp` | 200 |
| `/billing/checkout/starter?status=success` | 200 |
| `/billing/checkout/starter?status=cancelled` | 200 |
| `/billing/checkout/starter?error=not_configured` | 200 |

Public copy scan:

- Lemon active CTA: not found.
- Instant-access promise: not found.
- Manual/support/invoice fallback copy: present.

## 5. Admin Protection

Without an authenticated session:

| Route | Status | Result |
| --- | ---: | --- |
| `/dashboard/admin/billing` | 307 | Redirects to `/sign-in` |
| `/dashboard/admin/billing/export/reconciliation` | 307 | Redirects to `/sign-in`; no public CSV |

Webhook GET checks:

| Route | Status |
| --- | ---: |
| `/api/webhooks/stripe` | 405 |
| `/api/webhooks/lemon` | 405 |

Stripe invalid signature smoke:

- `POST /api/webhooks/stripe` with invalid signature returned `401`.
- Response was safe: `invalid_signature`.
- No `BillingEvent` was created.

## 6. Authenticated Admin Smoke

With admin session active in the embedded browser, `/dashboard/admin/billing` showed:

- Stripe: configured test.
- Checkout mode: test.
- Live payments: OFF.
- Webhooks: ON.
- Manual fulfillment: ON.
- Automatic entitlements/grants: OFF.
- Lemon Squeezy: rejected / legacy / disabled.
- Wise: manual invoice.
- Reconciliation: manual/read-only.
- Actions required: visible.
- Orders fulfilled: visible.
- Provider IDs: masked.
- Export CSV: visible.
- Secrets/raw payloads/card data: not visible.

Layout smoke:

- Narrow viewport checked.
- No horizontal overflow detected.
- Action cards and provider status blocks remained readable.

## 7. Export CSV

Authenticated admin UI exposes `/dashboard/admin/billing/export/reconciliation` through `Exportar CSV`.

The embedded browser blocks file downloads, but attempting to open the route with the active admin session triggered the protected download path instead of the previous 404, confirming the route is deployed and session-accessible.

Route implementation was rechecked locally and returns:

- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="billing-reconciliation.csv"`
- `Cache-Control: no-store`

Expected columns:

- `severity`
- `category`
- `provider`
- `plan`
- `customerEmail`
- `billingOrderId`
- `providerOrderIdMasked`
- `title`
- `detail`
- `action`

Security boundary:

- Provider order IDs are masked.
- No secrets.
- No raw payloads.
- No card data.

## 8. DB Read-Only Counts

Counts before and after the invalid signature smoke remained unchanged:

| Table | Before | After |
| --- | ---: | ---: |
| BillingEvent | 3 | 3 |
| BillingOrder | 3 | 3 |
| BillingPayment | 1 | 1 |
| BillingSubscription | 1 | 1 |
| BillingEntitlementGrant | 2 | 2 |
| AssessmentEntitlement | 136 | 136 |
| AuditEvent | 369 | 369 |

No DB mutation was performed by this smoke.

## 9. Validations

Executed locally:

- `npx prisma validate`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run test:run`: OK, 96 files / 439 tests.
- `npm run build`: OK.

Build warning:

- Known Turbopack/NFT warning involving `src/server/evidence/localStorageService.ts`.

## 10. Security

Confirmed:

- No live payments.
- No live Stripe mode.
- No real cards.
- No new checkout purchases.
- No Lemon checkout reactivation.
- No Wise API calls.
- No provider API calls.
- No auto-grants.
- No auto-revokes.
- No secrets in admin UI.
- No raw payloads in admin UI.
- No card-like data in admin UI.
- No public CSV access.
- No Hostinger env changes.
- No DB destructive action.

## 11. Risks Pending

- Embedded browser cannot read the downloaded CSV bytes directly because downloads are unsupported in that surface; deployment and protection were verified by route behavior and code audit.
- Stripe must remain test-mode until a separate live approval hito.
- First live payment still requires a dedicated go-live runbook and manual fulfillment verification.
- Reconciliation remains advisory/read-only by design.

## 12. Next Recommended Hito

Recommended next step: `BILLING-8-LIVE-READINESS-GATE`.

Scope should include:

- final Stripe account verification review;
- live env readiness without exposing secrets;
- live price/product parity;
- first live payment dry-run plan;
- rollback plan;
- owner approval gate.

## 13. Updated Percentages

- Billing total: 88-92%.
- Stripe readiness: 88-92%.
- Payment readiness: 82-88%.
- Operational readiness: 86-91%.
- ShiftReadiness global: 95-97%.
