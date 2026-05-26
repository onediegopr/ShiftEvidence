# Hostinger Auth Domain Validation

Date: 2026-05-26

## Status

Status: **PENDING REAL HOSTINGER EXECUTION**

Local environment variables are configured for localhost. Production domain validation requires the real Hostinger HTTPS domain.

## Required Production Variables

```text
BETTER_AUTH_URL=https://<production-domain>
NEXT_PUBLIC_APP_URL=https://<production-domain>
```

Rules:

- no localhost in production;
- both values should use HTTPS;
- both values should normally match;
- update any OAuth provider callback URLs if Google/GitHub OAuth is enabled later.

## Live Validation Steps

1. Open `/sign-up`.
2. Create a fictitious test user.
3. Confirm redirect/session.
4. Sign out.
5. Open `/sign-in`.
6. Sign in again.
7. Confirm `/dashboard` loads.
8. Confirm unauthenticated `/dashboard` redirects or denies safely.
9. Confirm admin route fails closed for non-admin.
10. Confirm admin route opens only for an email in `ADMIN_EMAILS`.

## Local Baseline

Local values are localhost-oriented and are valid only for local development.

Local route smoke:

- `/`: 200
- `/shiftreadiness`: 200
- `/sign-in`: 200

## Common Failure Modes

- `BETTER_AUTH_URL` still points to localhost.
- `NEXT_PUBLIC_APP_URL` still points to localhost.
- HTTPS/domain mismatch.
- Cookies not set due wrong domain or protocol.
- Admin route locked because `ADMIN_EMAILS` is missing or mismatched.
