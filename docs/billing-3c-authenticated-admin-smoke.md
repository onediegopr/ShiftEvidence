# BILLING-3C Authenticated Admin Billing Console Smoke

Date: 2026-06-01

## 1. Summary

Status: COMPLETE.

The authenticated production smoke for `/dashboard/admin/billing` was completed with an admin session in the in-app browser.

Validated:

- unauthenticated route protection;
- authenticated admin page load;
- provider status cards;
- Billing Operations status;
- `BillingEvent` ledger visibility;
- correct status label for the BILLING-3B replayed event;
- Capturado clarification text;
- no visible secrets;
- no dangerous billing actions.

No code, DB mutation, schema change, migration, Hostinger change, checkout, payment, grant, unlock, Wise call, or Stripe integration was performed.

## 2. Baseline

Git baseline:

- Branch: `main`.
- `main` synchronized with `origin/main`.
- Commit present: `72315e7 docs: close Lemon webhook test delivery smoke`.
- Working tree clean except existing untracked logo PNG files.

Unauthenticated production route:

- `GET https://shiftevidence.com/dashboard/admin/billing`
- Result: `307` to `/sign-in`.
- Admin content not public.

## 3. Authenticated Admin Session

Admin session:

- Authenticated admin session used: yes.
- No credentials or sensitive user data were documented.

Route:

- `https://shiftevidence.com/dashboard/admin/billing`

Result:

- Page loaded successfully.
- Redirect to sign-in: no.
- UI language: Spanish.
- Title/heading: Billing y proveedores.

## 4. Cards And Global Status

Cards verified:

- Lemon Squeezy.
- Wise.
- Stripe.
- Operaciones Billing.

Global/status signals verified:

- Checkout test-mode: OK.
- Live payments: OFF.
- Manual fulfillment: ON.
- Webhooks: ON.
- Ledger: ON.
- Entitlements automáticos: OFF.
- Reconciliación: Manual.
- Eventos fallidos: 0.

## 5. Provider Status

Lemon Squeezy:

- Store ID: present, value not shown.
- API key: present, value not shown.
- API key alias MCP: present, value not shown.
- Starter Variant ID: present, value not shown.
- Professional Variant ID: present, value not shown.
- MSP Variant ID: present, value not shown.
- Checkout mode: Test.
- Checkout enabled: yes.
- Webhook secret: present, value not shown.
- Endpoint webhook: available.
- Events received: 1.
- Failed events: 0.

Wise:

- Current use: manual bank transfer / invoice.
- Token: absent.
- API URL: not configured.
- Profile ID: absent.
- Automation: disabled.
- No Wise API call was made.

Stripe:

- Deferred / disabled.
- Publicly visible: no.
- Active checkout: no.
- Recommended action: do not configure yet.

Billing Operations:

- Read-only operations visibility.
- Manual fulfillment active.
- Ledger active.
- Automatic entitlements off.
- Orders/payments/subscriptions persistence marked future / not implemented.

## 6. Ledger Preview

Expected event:

- providerEventId: `evt_billing_3b_smoke_20260601081850`
- provider: Lemon Squeezy / `lemon_squeezy`
- eventType: `order_created`

Visible in admin ledger:

- Event count: 1.
- Failed events: 0.
- Pending events: 0.
- Ignored events: 1.
- providerEventId visible: yes.
- eventType visible: yes.
- status label visible: `IGNORADO`.
- error visible: `-`.
- processed timestamp visible: yes.

Clarification visible:

- Capturado means the event was verified and technically persisted.
- It does not mean an order, payment, subscription, or access was processed.

Payload safety:

- Full raw payload not visible.
- Full safePayloadJson not visible.
- Synthetic smoke email not visible.
- Synthetic custom data not visible.

## 7. Support Diagnostics

Support diagnostics visible:

- checkout returns `not_configured`;
- customer paid but does not have access;
- webhook does not arrive;
- failed event;
- refund or cancellation.

The page presents guidance without automating payments or access.

## 8. Security UI/DOM

Visible DOM scan found no matches for:

- Lemon API key prefixes;
- Stripe live key prefixes;
- Stripe test key prefixes;
- bearer token;
- JWT;
- database connection variable names;
- Postgres connection string;
- webhook secret assignment;
- raw 32+ hex secret.

No dangerous actions visible:

- no grant button;
- no manual match button;
- no refund button;
- no Wise transfer action;
- no Stripe action;
- no destructive delete/reset/drop/truncate action.

## 9. DB Cross-Check

Production DB read-only counts:

- `BillingEvent`: 1
- `BillingOrder`: 0
- `BillingPayment`: 0
- `BillingSubscription`: 0
- `BillingEntitlementGrant`: 0

No billing business rows were created by this smoke.

## 10. Remaining Risks

- Admin console is read-only; no manual match or remediation flow exists yet.
- Business processing remains intentionally unimplemented.
- Orders, payments, subscriptions, entitlement grants, refunds, and reconciliation require later approved milestones.
- A future UI smoke after real Lemon delivery is still useful.

## 11. Next Step

Recommended next hito:

- BILLING-3D event-to-order mapping spec, or
- BILLING-3D manual review and reconciliation workflow design.

Do not implement automated grants, order processing, payment persistence, subscription sync, or refund automation until separately approved.
