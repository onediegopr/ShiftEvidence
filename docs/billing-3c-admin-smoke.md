# BILLING-3C - Admin Billing Console Smoke

Date: 2026-05-31

Status: partial / blocked by missing authenticated admin session.

## 1. Scope

Smoke and readiness check for:

- `/dashboard/admin/billing`;
- admin-only protection;
- provider status visibility;
- BillingEvent ledger preview;
- secret exposure risk.

No code changes were made.

## 2. Git State

Branch:

- `main`;
- synchronized with `origin/main`.

Relevant commits present:

- `568fafd feat: add Lemon webhook event persistence`;
- `872ade3 feat: add admin billing provider console`.

Untracked non-billing files preserved:

- `images/shift-evidence-logo-transparent-1024.png`;
- `images/shift-evidence-logo-transparent-512.png`.

## 3. Production Route Protection

Production request:

```text
GET https://shiftevidence.com/dashboard/admin/billing
```

Observed:

- `307 Temporary Redirect`;
- `location: /sign-in`;
- no admin billing content rendered to unauthenticated request.

Verdict:

- route is protected for unauthenticated users;
- not public.

## 4. Authenticated Admin Smoke

Attempted with the in-app browser:

```text
https://shiftevidence.com/dashboard/admin/billing
```

Observed:

- browser ended at `/sign-in`;
- no admin session was available in the in-app browser.

Result:

- authenticated visual smoke not completed;
- cards could not be visually validated in production from Codex.

Pending user/admin validation:

- route loads for admin;
- Spanish labels visible;
- Lemon Squeezy, Wise, Stripe and Operaciones Billing cards visible;
- global badges visible;
- ledger empty state or recent events visible;
- `processed` appears as `Capturado`;
- clarification visible that `Capturado` is technical capture only;
- no grant/match/refund/Wise/Stripe action buttons.

## 5. Secret Exposure Check

Unauthenticated production response:

- showed sign-in page only;
- did not show admin content;
- did not match obvious secret patterns.

Checked patterns:

- Lemon/Stripe key prefixes;
- bearer-like strings;
- JWT-like strings.

Result:

- no secrets exposed in unauthenticated admin response.

## 6. Webhook Endpoint GET Check

Production request:

```text
GET https://shiftevidence.com/api/webhooks/lemon
```

Observed:

- `405 Method Not Allowed`;
- no sensitive body or headers surfaced.

Verdict:

- endpoint exists;
- GET is safely rejected;
- no POST smoke was attempted.

## 7. Smoke Not Performed

No production webhook POST was performed because:

- webhook secret presence could not be verified safely from admin console or Hostinger;
- Lemon dashboard was not authenticated in the in-app browser;
- current DB readiness check did not show BILLING-3A migration applied on the active local `DATABASE_URL` target.

## 8. Remaining Admin Smoke Checklist

When an admin session is available:

1. Open `/dashboard/admin/billing`.
2. Confirm route loads for admin.
3. Confirm Spanish UI.
4. Confirm Lemon Squeezy, Wise, Stripe and Operaciones Billing cards.
5. Confirm global badges.
6. Confirm only presence/absence env status, no secret values.
7. Confirm ledger preview.
8. Confirm `Capturado` wording and clarification.
9. Confirm no grant/match/refund/payment actions.
10. Search page DOM for secret patterns.

## 9. Next Step

Recommended:

- authenticated admin user-attested smoke for `/dashboard/admin/billing`;
- then controlled migration readiness/deploy if production DB still lacks BILLING-3A.
