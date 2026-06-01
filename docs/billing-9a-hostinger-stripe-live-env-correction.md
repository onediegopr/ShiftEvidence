# BILLING-9A - Hostinger Stripe live env correction

## 1. Objective

BILLING-9A attempted to unblock the controlled Stripe live activation by correcting the production Hostinger Stripe environment and validating that Starter checkout can open a real hosted Stripe live checkout session before any payment is completed.

Status: PARTIAL / BLOCKED FOR LIVE CHECKOUT.

The environment was reviewed and corrected, but the live pre-payment checkout smoke could not be completed because production returned runtime 503 for checkout routes after live env changes. A safe rollback was applied by disabling checkout.

## 2. Context

BILLING-9 was previously blocked because production had `STRIPE_CHECKOUT_MODE=live` while the effective Stripe secret key did not match the expected live secret key mode.

Security commits already present before this hito:

- `9639b99` - gate Stripe live checkout activation.
- `2190392` - normalize Stripe live approval flag.
- `b6cb208` - align Stripe checkout mode copy.
- `5aa9f6f` - block Stripe live checkout on key mode mismatch.
- `c865790` - harden Stripe live env detection.
- `2454be2` - timeout Stripe checkout session creation.

## 3. Git baseline

- Branch: `main`.
- `HEAD` and `origin/main`: synchronized.
- Initial relevant HEAD during this hito: `5aa9f6f`.
- Final relevant HEAD after hotfixes: `2454be2`.
- Working tree after code pushes: clean except the preserved untracked logo PNGs.

No schema changes, no migrations, no DB push, no destructive DB action.

## 4. Production DB baseline

Read-only counts before and after remained unchanged:

- `BillingEvent`: 3.
- `BillingOrder`: 3.
- `BillingPayment`: 1.
- `BillingSubscription`: 1.
- `BillingEntitlementGrant`: 2.
- `AssessmentEntitlement`: 136.
- `AuditEvent`: 369.

No payment was completed. No order, payment, subscription, grant, entitlement, or audit row was created by this hito.

## 5. Hostinger env correction

Variables reviewed by name and mode only:

- `STRIPE_SECRET_KEY`: initially test-mode, later corrected away from test-mode; a restricted live key was observed and then replaced by a standard live secret key.
- `STRIPE_WEBHOOK_SECRET`: present.
- `STRIPE_STARTER_PRICE_ID`: corrected to the live Starter price for USD 490.
- `STRIPE_PROFESSIONAL_PRICE_ID`: corrected to the live Professional price for USD 1,500.
- `STRIPE_MSP_PRICE_ID`: corrected to the live MSP monthly price for USD 399/month.
- `STRIPE_CHECKOUT_MODE`: live.
- `STRIPE_LIVE_PAYMENTS_APPROVED`: true.
- `NEXT_PUBLIC_APP_URL`: `https://shiftevidence.com`.

No secret values or full Price IDs are documented here.

## 6. Admin status

After the live secret correction, the admin console showed:

- Stripe live approved: yes.
- Checkout mode: live.
- Checkout active: yes.
- Live payments: on.
- Webhooks: on.
- Manual fulfillment: on.
- Automatic entitlements: off.
- No secrets visible.

After later production 503 behavior, rollback was applied by setting `STRIPE_CHECKOUT_ENABLED=false`. The public start route then returned `checkout_disabled`, confirming checkout is safely off.

## 7. Starter checkout pre-payment smoke

Public Starter checkout page reached the expected live-ready state before the runtime issue:

- Plan: Starter Readiness.
- Amount: USD 490.
- Runtime copy: live mode.
- Provider: Stripe.
- Secrets: not visible.
- Entitlements: manual only.

When creating a hosted checkout session:

- Initial attempt exposed that production was still using test mode.
- Subsequent attempts after env correction returned Stripe API/runtime failure instead of a hosted live checkout page.
- After hardening and env correction, `/billing/checkout/starter/start` returned 503 from Hostinger runtime.
- No live hosted Stripe checkout page was successfully verified.
- No card data was entered.
- No payment was completed.

## 8. Webhook readiness

Invalid Stripe webhook signature smoke:

- Result: 401 Unauthorized.
- Response: safe `invalid_signature`.
- No `BillingEvent` was created.
- DB counts remained unchanged.

No live webhook event was sent deliberately in this hito.

## 9. Rollback

Rollback was required because production routes returned 503 after live env correction.

Rollback action:

- Added `STRIPE_CHECKOUT_ENABLED=false` in Hostinger.
- Saved and redeployed.

Post-rollback status:

- `/`: 200.
- `/pricing`: 200.
- `/billing/checkout/starter`: 200.
- `/dashboard/admin/billing` without session: 307 to `/sign-in`.
- `POST /billing/checkout/starter/start`: 303 to `?error=checkout_disabled`.
- DB counts unchanged.
- Invalid signature still 401.

## 10. Safety

Confirmed:

- No payment.
- No card data.
- No secrets printed or documented.
- No full Price IDs documented.
- No grants.
- No auto-grants.
- No auto-revokes.
- No Lemon activity.
- No Wise API activity.
- No DB mutation.
- No migration.

## 11. Validation

During this hito, the following validation gates passed for the hotfixes:

- `npx prisma validate`.
- `npx prisma generate`.
- `npm run typecheck`.
- `npm run lint`.
- `npm run test:run`.
- `npm run build`.

Latest full test count after hardening: 450 tests passed.

Build still has the known Turbopack/NFT warning involving `localStorageService.ts`.

## 12. Result

BILLING-9A did not reach a successful live hosted checkout pre-payment page.

Final operational state is safe:

- Stripe checkout disabled by env rollback.
- Public app routes restored.
- No money movement.
- No data mutation.

## 13. Next step

Recommended next hito:

`BILLING-9A-FIX-2 - Hostinger runtime 503 diagnosis before live checkout retry`.

Scope should be:

- Diagnose Hostinger runtime 503 on dynamic checkout start routes.
- Review runtime logs with an actual failing request.
- Keep checkout disabled until the runtime issue is understood.
- Do not attempt payment.
- Re-enable live checkout only after `/billing/checkout/starter/start` returns a hosted `checkout.stripe.com` live session reliably.

