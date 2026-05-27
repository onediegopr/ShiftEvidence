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
