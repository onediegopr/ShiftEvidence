# BILLING-3D Runtime Readiness Recovery

Date: 2026-06-01

## 1. Summary

BILLING-3D runtime readiness was rechecked before running any valid signed
production webhook payload.

No valid webhook payload was sent.
No database mutation was performed manually.
No Hostinger environment variable was changed.
No live payment, checkout, grant, unlock or manual match was executed.

## 2. Git Baseline

Local branch:

- `main`
- synchronized with `origin/main`
- latest commit present: `3faa94f feat: map Lemon events to billing ledger`

Working tree:

- clean for tracked code/docs;
- two logo PNG files remain untracked and preserved outside commits.

## 3. Production Runtime

Production now shows behavior consistent with the BILLING-3D runtime.

Checks:

- `GET https://shiftevidence.com/dashboard/admin/billing` without session:
  `307` to `/sign-in`;
- `GET https://shiftevidence.com/api/webhooks/lemon`:
  `405 Method Not Allowed`;
- `GET https://shiftevidence.com/billing/checkout/starter`:
  `200 OK`.

Earlier `503` on `GET /api/webhooks/lemon` was not reproduced during this
recovery pass.

Redeploy/restart:

- not performed;
- not required after runtime recheck showed the expected route behavior and
  admin UI readiness.

## 4. Admin Billing 3D UI Readiness

Authenticated admin UI was checked in the embedded browser.

Visible sections:

- `Billing y proveedores`;
- `Ledger comercial`;
- `Ordenes recientes`;
- `Pagos recientes`;
- `Suscripciones recientes`;
- `Registros sin match`;
- `Unmatched`;
- `Lemon Squeezy`.

This confirms production is serving the admin UI surface introduced by
BILLING-3D.

No grant, match, refund, Wise or Stripe action was executed.

## 5. DB Read-Only Readiness

Read-only Neon query succeeded against production:

- Project: InfraShift;
- branch: `br-raspy-morning-ap11hfm6`;
- database: `neondb`.

Counts at readiness check:

| Table | Count |
| --- | ---: |
| `BillingEvent` | 1 |
| `BillingOrder` | 0 |
| `BillingPayment` | 0 |
| `BillingSubscription` | 0 |
| `BillingEntitlementGrant` | 0 |
| `AssessmentEntitlement` | 136 |

No DB write was executed.

## 6. Webhook Secret Readiness

Production webhook verification appears configured:

- invalid POST signature returned `401 Unauthorized`;
- this indicates the webhook endpoint has a signing secret available at runtime
  and rejected the invalid signature safely.

Local signing readiness:

- `LEMON_SQUEEZY_WEBHOOK_SECRET` was not available in the local process;
- `LEMONSQUEEZY_WEBHOOK_SECRET` was not available in the local process;
- no secret value was printed, copied or stored.

The next signed production smoke still needs a secure way to compute signatures
without exposing the secret, such as a local environment variable provided
outside chat or another approved secret-manager workflow.

## 7. Next Step

Proceed to BILLING-3D-PROD-SMOKE only after signing readiness is available.

The next hito should:

- keep using synthetic `.invalid` emails;
- send valid signed payloads only after the signing secret is available through
  a safe channel;
- compare counts against the baseline above;
- confirm zero `BillingEntitlementGrant` and unchanged `AssessmentEntitlement`.

## 8. Risks

Remaining risks:

- valid signed production webhook smoke is not yet executed;
- local signing secret is not available to Codex;
- no production ledger business rows exist yet for BILLING-3D;
- manual match and entitlement fulfillment remain intentionally out of scope.
