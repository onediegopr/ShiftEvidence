# HITO ADMIN-AUTH-1 — Normalize Admin Email Authorization

Date: 2026-05-29.

## Objective

Ensure admin email authorization is case-insensitive and robust against accidental whitespace while preserving the existing fail-closed behavior.

## Problem Corrected

The admin authorization path depends on comparing `ADMIN_EMAILS` with `session.user.email`. If either side is normalized differently, a legitimate admin could be denied when the session email contains uppercase characters or accidental surrounding whitespace.

The current implementation already normalized both sides inline. This hito centralizes that behavior in a single helper to make the intent explicit and reduce regression risk.

## Files Reviewed

- `src/server/admin/adminAuth.ts`

## Files Modified

- `src/server/admin/adminAuth.ts`
- `docs/hito-admin-auth-1-normalize-admin-email-authorization.md`

## Normalization Applied

Admin email normalization is now centralized in:

```ts
function normalizeEmailForAdmin(email: string) {
  return email.trim().toLowerCase();
}
```

The same function is used for:

- emails parsed from `ADMIN_EMAILS`;
- email received from the active Better Auth session.

## Fail-Closed Behavior Preserved

- Missing session remains non-admin and redirects or blocks according to the existing caller.
- Missing email returns `false`.
- Empty `ADMIN_EMAILS` returns no authorized admins.
- Empty entries are filtered out.
- Wildcard-like entries containing `*` continue to be filtered out.
- No database email normalization was performed.

## Constraints Confirmed

- `.env.local` was not touched.
- No environment variable values were printed.
- No DB migration was performed.
- Better Auth configuration was not changed.
- Dashboard, parser, PDF, AI Advisory, scoring, landing and middleware were not changed.
- Production deploy: NO.
- Production launched: NO.

## Validations

- `npm run hostinger:diagnose`: OK. The diagnostic does not print secret values and reported absent local environment variables for this shell process.
- `npm run lint`: OK with existing `<img>` optimization warnings only.
- `npm run typecheck`: OK.
- `npm run build`: OK with the known Turbopack/NFT warning.
- Manual logic review:
  - `ADMIN_EMAILS` entries are normalized with `trim().toLowerCase()`.
  - Session email is normalized with the same helper before comparison.
  - Empty email returns `false`.
  - Empty admin email set returns `false`.
  - Wildcard-like entries containing `*` remain filtered out.

## Risks Pending

- No unit test infrastructure was introduced in this hito.
- Rate limiting remains pending.
- CSP remains pending.
- Production verification requires deployment and is out of scope for this hito.
