# Account Support / Password Recovery Gap

## Current State

Password recovery is not implemented.

There is no self-service forgot password flow.

## Controlled Launch Mitigation

Controlled launch can proceed because:

- Users are limited.
- Access is supervised.
- Account support can be manual.
- Admin/product owner can coordinate with pilot users directly.

## Public Launch Impact

Public launch should not proceed without password recovery.

Required for public launch:

- Forgot password entry point.
- Secure reset token.
- Email delivery provider.
- Rate limiting.
- No user enumeration.
- Audit trail.
- Expiration and one-time token semantics.

## Recommended Hito

`HITO AUTH-1 — Password Recovery + Account Support`.

## Risk

If a pilot user loses access during controlled launch, support must be manual.

Do not claim self-service account recovery exists until implemented and validated.

## AUTH-1 Update

`HITO AUTH-1` implemented the application-side password recovery flow:

- `/sign-in` includes `Forgot password?`.
- `/forgot-password` returns a neutral response.
- `/reset-password?token=...` supports setting a new password.
- Reset tokens are stored as hashes in `PasswordResetRequest`.
- Tokens expire and are single-use.
- Resend email delivery is supported when `RESEND_API_KEY` and `EMAIL_FROM` are configured.
- Manual fallback remains available for controlled launch when no email provider is configured.

Production activation still requires:

- controlled Prisma deploy for migration `20260527190000_auth_password_recovery`;
- controlled app deploy;
- provider configuration for real self-service recovery.

Public launch remains NO until production recovery is migrated, deployed and smoke-tested with real email delivery or an explicitly accepted support policy.
