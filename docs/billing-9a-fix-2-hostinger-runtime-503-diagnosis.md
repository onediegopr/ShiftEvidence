# BILLING-9A-FIX-2 - Hostinger runtime 503 diagnosis before live checkout retry

## 1. Objective

Diagnose the Hostinger runtime 503 observed during BILLING-9A after Stripe live env correction, without completing a real payment and while keeping checkout disabled until the runtime path is healthy.

Status: PARTIAL.

The production rollback remains safe and Stripe live catalog sanity checks passed, but the exact Hostinger 503 root cause was not available from hPanel runtime logs.

## 2. Context

BILLING-9A corrected the initial Stripe live env mismatch:

- Production first used a test secret key while checkout mode was live.
- A restricted live key was then observed.
- A standard live secret key was configured afterward.
- Live Price IDs were corrected for Starter, Professional, and MSP.
- Checkout later produced Hostinger runtime 503.
- Rollback set `STRIPE_CHECKOUT_ENABLED=false`.

No payment, card entry, grant, entitlement, DB mutation, Lemon action, or Wise API action occurred.

## 3. Git baseline

- Branch: `main`.
- `HEAD`: `ac0270e`.
- `origin/main`: `ac0270e`.
- Relevant commits present:
  - `9639b99` live activation gate.
  - `2190392` approval flag normalization.
  - `b6cb208` checkout mode copy.
  - `5aa9f6f` key mode mismatch guard.
  - `c865790` live env detection hardening.
  - `2454be2` checkout session timeout.
  - `ac0270e` BILLING-9A documentation.
- Working tree: clean except preserved untracked logo PNGs.

## 4. Production post-rollback

Observed HTTP status:

- `/`: 200.
- `/pricing`: initially 503 on one pass, then 200 on immediate recheck.
- `/support`: 200.
- `/billing/checkout/starter`: 200.
- `/dashboard/admin/billing` without session: 307 to `/sign-in`.
- `POST /billing/checkout/starter/start`: 303 to `?error=checkout_disabled`.

The transient `/pricing` 503 suggests runtime instability after redeploy, but the public app recovered and checkout remained disabled.

## 5. Admin status

Authenticated admin billing showed:

- Stripe: configured/present.
- Checkout mode: live.
- Checkout enabled: no.
- Checkout active: no.
- Live payments: off.
- Webhooks: on.
- Manual fulfillment: on.
- Automatic entitlements: off.
- Mismatch warning: absent.
- Secrets visible: no.
- Lemon: legacy/disabled.
- Wise: manual.

## 6. Hostinger runtime logs

hPanel runtime logs were reviewed after reproducing 503 behavior.

Observed:

- Last deploy visible and completed.
- Runtime logs page showed 0 issues.
- Runtime logs page showed 0 errors.
- hPanel displayed no concrete stack trace or checkout error message.

Root cause: not conclusively found.

Most likely unresolved categories:

- Hostinger runtime instability after env edits/redeploy.
- Runtime route process issue not captured by hPanel logs.
- External Stripe session create path causing a route-level failure before app-level safe redirect was observable.

Checkout remains disabled until this is observable and reproducible with safe diagnostics.

## 7. Env sanity

Runtime/admin evidence confirms:

- Stripe secret key: present.
- Stripe webhook secret: present.
- Starter Price ID: present.
- Professional Price ID: present.
- MSP Price ID: present.
- Checkout mode: live.
- Live approval: present.
- Checkout enabled: false.
- Public app URL: production domain.

hPanel table is virtualized, so direct DOM extraction of all rows was unreliable. Visual review and admin runtime status were used without copying values.

No secrets or full Price IDs are documented here.

## 8. Stripe live catalog sanity

Stripe MCP checks confirmed the live catalog exists:

- Starter Readiness: USD 490 one-time price expected.
- Professional Assessment: USD 1,500 one-time price expected.
- MSP Partner: USD 399/month expected.

No full product IDs or Price IDs are documented here.

No Checkout Session, Customer, PaymentIntent, invoice, order, payment, subscription, or grant was created as part of these checks.

## 9. Checkout retry status

Live checkout was not re-enabled after rollback.

Because `STRIPE_CHECKOUT_ENABLED=false`, `POST /billing/checkout/starter/start` returns a safe 303 redirect to `?error=checkout_disabled`.

No hosted Stripe live checkout page was opened in FIX-2.
No card was entered.
No payment was completed.

## 10. Webhook invalid signature

Invalid Stripe signature smoke:

- Result: 401 Unauthorized.
- Safe response: `invalid_signature`.
- DB counts unchanged.

## 11. DB before/after

Read-only counts remained unchanged:

- `BillingEvent`: 3.
- `BillingOrder`: 3.
- `BillingPayment`: 1.
- `BillingSubscription`: 1.
- `BillingEntitlementGrant`: 2.
- `AssessmentEntitlement`: 136.
- `AuditEvent`: 369.

## 12. Safety

Confirmed:

- No real payment.
- No card data.
- No secrets exposed.
- No full Price IDs documented.
- No grants.
- No auto-grants.
- No auto-revokes.
- No Lemon activity.
- No Wise API activity.
- No DB mutation.
- No migration.
- Checkout remains disabled.

## 13. Result

BILLING-9A-FIX-2 is partial:

- Production is safe.
- Checkout is disabled.
- Stripe live catalog appears sane.
- Admin state is safe and consistent.
- Exact 503 root cause was not visible in Hostinger logs.
- Live checkout pre-payment retry was not performed.

## 14. Next step

Recommended next hito:

`BILLING-9A-FIX-3 - Safe Stripe checkout diagnostic endpoint and runtime observability`.

Suggested scope:

- Keep `STRIPE_CHECKOUT_ENABLED=false`.
- Add admin-only/server-only Stripe diagnostic that fetches configured Price IDs using production env and returns only booleans/masked status.
- Add safe structured error codes for Stripe session creation failures.
- Add temporary safe logging or admin diagnostic output without secrets.
- Re-enable checkout only after server-side diagnostics prove the production runtime can reach Stripe and validate live Prices.

