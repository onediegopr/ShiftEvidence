# BILLING-3B - Webhook Runtime Readiness

Date: 2026-05-31

Status: partial / blocked before real webhook smoke.

## 1. Scope

Runtime readiness check for:

- Lemon webhook endpoint;
- webhook secret readiness;
- Lemon dashboard webhook configuration;
- BillingEvent DB readiness;
- safe smoke boundary.

No code changes were made.

## 2. Endpoint Availability

Production request:

```text
GET https://shiftevidence.com/api/webhooks/lemon
```

Observed:

- `405 Method Not Allowed`.

Interpretation:

- route exists in production;
- GET is rejected safely;
- endpoint is intended for signed POST only.

No production POST was sent in this hito.

## 3. Webhook Secret Status

Webhook secret names expected:

- `LEMON_SQUEEZY_WEBHOOK_SECRET`;
- or `LEMONSQUEEZY_WEBHOOK_SECRET`.

Status:

- not verified.

Reason:

- authenticated admin console was unavailable in the in-app browser;
- Hostinger/hPanel was not accessed;
- no secret values were requested or printed.

## 4. Lemon Dashboard Webhook Status

Attempted with the in-app browser:

```text
https://app.lemonsqueezy.com/settings/webhooks
```

Observed:

- redirected to Lemon sign-in;
- no Lemon session available in the in-app browser.

Result:

- webhook URL configuration could not be verified;
- no webhook was created;
- no signing secret was copied;
- no Lemon settings were changed.

Target webhook URL:

```text
https://shiftevidence.com/api/webhooks/lemon
```

Recommended event set:

- `order_created`;
- `order_refunded`;
- `subscription_created`;
- `subscription_updated`;
- `subscription_cancelled`;
- `subscription_payment_success`;
- `subscription_payment_failed`.

## 5. DB Migration Readiness

Read-only Prisma check was executed against the active local `DATABASE_URL`
target.

Checked:

- `_prisma_migrations` for `20260531170000_billing_3a_ledger_foundation`;
- `public."BillingEvent"` table presence.

Observed:

- migration applied: no;
- `BillingEvent` table present: no.

Implication:

- do not run a real webhook POST against that DB target;
- webhook persistence would not be ready until BILLING-3A migration is applied.

Important:

- no migration was applied;
- no `db push`;
- no reset.

## 6. Smoke Decision

Webhook smoke was blocked.

Reasons:

- webhook secret presence not verified;
- Lemon webhook configuration not verified;
- active DB target did not show BILLING-3A migration/table;
- no approval to apply migration or configure secrets in this hito.

## 7. Safe Next Steps

Recommended sequence:

1. Confirm intended production DB branch/URL.
2. Run controlled BILLING-3A production migration deploy if not applied.
3. Verify `BillingEvent` exists.
4. Configure `LEMON_SQUEEZY_WEBHOOK_SECRET` in Hostinger without printing it.
5. Redeploy/restart if Hostinger requires it.
6. Configure Lemon webhook URL and event set.
7. Run Lemon test webhook or signed synthetic smoke.
8. Verify `BillingEvent` appears in `/dashboard/admin/billing`.

## 8. Boundaries Preserved

Not performed:

- live payments;
- real payment;
- real card;
- webhook creation;
- secret creation;
- Hostinger env changes;
- DB migration;
- orders/payments/subscriptions persistence;
- grants;
- manual match;
- Wise or Stripe automation.
