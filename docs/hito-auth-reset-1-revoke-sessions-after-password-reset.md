# HITO AUTH-RESET-1 — Revoke Sessions After Password Reset

Date: 2026-05-29.

## Objective

Ensure that a successful password reset invalidates active sessions for the affected user in ShiftReadiness / InfraShift.

## Risk Corrected

If a password reset changes the credential password but leaves existing sessions active, a previously compromised browser/device session could remain usable after the account owner changes the password.

The route already deleted user sessions in the reset transaction. This hito confirms that behavior and hardens the reset confirmation so the token is claimed atomically inside the same transaction that updates the password and deletes sessions.

## Files Reviewed

- `src/app/api/account-support/password-reset/confirm/route.ts`
- `src/app/api/account-support/password-reset/request/route.ts`
- `prisma/schema.prisma`

## Files Modified

- `src/app/api/account-support/password-reset/confirm/route.ts`
- `docs/hito-auth-reset-1-revoke-sessions-after-password-reset.md`

## Session Model Identified

Prisma model:

- `Session`

Mapped database table:

- `@@map("session")`

User relation field:

- `userId String`

Relevant indexes:

- `@@index([userId])`
- `@@unique([token])`

## Session Revocation Method

The password reset confirmation transaction deletes active sessions for the reset user:

```ts
await tx.session.deleteMany({
  where: { userId },
});
```

This affects sessions only. It does not delete the user, accounts, assessments, evidence files, reports, audit events, entitlements or workspaces.

## Implementation Details

The confirmation route preserves:

- hashed reset token lookup;
- token format validation;
- token expiry validation;
- one-time token behavior;
- password length validation;
- credential account update/create behavior;
- safe invalid-token messaging;
- superseding other pending reset requests;
- audit event creation.

Additional hardening:

- The credential account lookup now happens inside the transaction.
- The reset token is marked used with a conditional `updateMany` inside the transaction:
  - matching reset request id;
  - matching user id;
  - matching token hash;
  - `usedAt: null`;
  - `expiresAt >= completedAt`;
  - status in the active reset states: `pending`, `email_sent`, `manual_pending`.
- If the conditional claim does not update exactly one row, the transaction throws a controlled invalid-token error and rolls back any password/account changes.
- Session deletion remains inside the same transaction, after token claim and before audit event completion.

## Validations

- `npm run hostinger:diagnose`: OK. The diagnostic does not print secret values and reported absent environment variables for the shell process.
- `npm run lint`: OK with existing `<img>` optimization warnings only.
- `npm run typecheck`: OK.
- `npm run build`: OK with the known Turbopack/NFT warning.
- Local invalid-token smoke:
  - malformed token: generic invalid reset-link message returned.
  - well-formed nonexistent token: generic invalid reset-link message returned.

Functional reset tests requiring a controlled account/token were not executed in this hito. A controlled QA account should be used before production deployment to confirm login with the new password, failure with the old password and removal of pre-existing sessions.

## Risks Pending

- Rate limiting is still pending as a separate hito.
- CSP is still pending as a separate hito.
- Authenticated end-to-end password reset tests should be run with a controlled QA account before production deployment.
- Existing Turbopack/NFT warning remains separate technical debt.

## Final State

- Production deploy: NO.
- Production launched: NO.
