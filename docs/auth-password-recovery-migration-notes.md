# Auth Password Recovery Migration Notes

## Migration

`prisma/migrations/20260527190000_auth_password_recovery/migration.sql`

## Purpose

Adds `PasswordResetRequest` for secure password recovery.

## Safety

- Non-destructive migration.
- Adds a new table only.
- Does not alter existing auth tables.
- Does not change existing users, accounts or sessions.
- Does not change dashboard, parser, upload, reports or entitlements.

## Data Stored

- Normalized email.
- Email hash.
- Token hash.
- Expiration timestamp.
- Used timestamp.
- Status.
- Delivery mode.
- Optional hashed IP/user-agent metadata.

No reset token is stored in plaintext.

## Production Plan

Do not execute automatically.

Required controlled steps:

1. Confirm target database.
2. Confirm backup/rollback posture.
3. Run `npm run prisma:deploy` only with explicit authorization.
4. Deploy application only with explicit authorization.
5. Smoke password recovery with QA account.

## Rollback

If rollback is needed before production traffic uses the feature:

- Revert application commit.
- Drop `PasswordResetRequest` only after confirming no required audit records exist.
- Do not run `prisma migrate reset`.

If rollback is needed after production traffic uses the feature:

- Preserve records for audit unless explicitly approved.
- Disable UI/API by code rollback if needed.
- Do not delete user/account/session data.
