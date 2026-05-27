# Account Support Password Recovery Runbook

## Purpose

This runbook defines how to operate password recovery during controlled production launch.

Production launched: SI, controlled launch.

Public launch: NO.

## User Flow

1. User opens `/sign-in`.
2. User clicks `Forgot password?`.
3. User submits email at `/forgot-password`.
4. App always responds with a neutral message.
5. If an account exists and email provider is configured, user receives a reset link.
6. User opens `/reset-password?token=...`.
7. User enters a new password.
8. Token is consumed once.
9. User signs in with new password.

## Security Rules

- Do not reveal whether an email exists.
- Do not log reset tokens.
- Do not paste reset links in public channels.
- Reset links expire after 60 minutes.
- Reset tokens are single-use.
- Old active reset requests are superseded when a new one is created.
- Sessions are revoked after successful reset.

## Email Provider Mode

Required env vars for Resend mode:

- `RESEND_API_KEY`.
- `EMAIL_FROM`.

If both are present, the application attempts to send recovery email through Resend.

Do not print env var values.

## Manual Fallback Mode

If no provider is configured:

- The app stores a `PasswordResetRequest` with `deliveryMode=manual`.
- The user sees the same neutral message.
- Support must verify the user manually.
- For controlled launch, support can coordinate account access directly.
- For public launch, this is not sufficient.

## Production Activation

Before production use:

1. Review migration `20260527190000_auth_password_recovery`.
2. Confirm production DB backup/rollback posture.
3. Execute `npm run prisma:deploy` only with explicit authorization.
4. Deploy the app only with explicit authorization.
5. Configure email provider if self-service recovery is required.
6. Smoke `/forgot-password` with a controlled test account.
7. Smoke `/reset-password` with a controlled test token.

## Smoke Checklist

- [ ] `/sign-in` shows `Forgot password?`.
- [ ] `/forgot-password` loads.
- [ ] Existing email returns neutral message.
- [ ] Non-existing email returns same neutral message.
- [ ] Valid reset token updates password.
- [ ] Old password fails.
- [ ] New password works.
- [ ] Used token fails.
- [ ] Expired token fails.
- [ ] Invalid token fails.
- [ ] No token is logged.

## Escalation

Escalate if:

- Password reset reveals whether an account exists.
- Token can be reused.
- Expired token works.
- Reset does not revoke sessions.
- Login breaks for existing users.
- Email provider errors cause visible user enumeration.

## Rollback

If the feature must be paused:

- Do not run `prisma migrate reset`.
- Disable UI entry if needed through a code rollback.
- Preserve `PasswordResetRequest` records for audit.
- Preserve auth/account/session data.
- Document the reason and affected users.
