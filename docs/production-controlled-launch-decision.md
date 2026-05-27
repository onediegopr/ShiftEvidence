# Production Controlled Launch Decision

Date: 2026-05-27.

## Decision

Production launched: SÍ, controlled launch.

Public launch: NO.

## Scope

This decision authorizes a controlled production launch of ShiftReadiness for limited/manual usage, not a public mass-market launch.

## Evidence

Validated by Codex:

- Git/local/build clean.
- `npm run hostinger:diagnose`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK.
- Public production routes return `200`.
- Private unauthenticated routes redirect to `/sign-in`.
- `/_next` assets detected.
- Hostinger 404 absent.
- `503/504` absent during launch review.

Validated by previous milestones:

- Authenticated dashboard base.
- Assessment CRUD.
- Intake/assumptions.
- Upload gate UI/server/browser multipart.
- Evidence upload/storage/parser.
- PDF preview/full flow.
- Redirect `0.0.0.0` bug fixed.
- Multi-assessment lifecycle hardening.

Validated manually by user:

- Productive admin can access `/dashboard/admin/unlock-requests`.
- Admin queue loads.
- Entitlement flow/full report worked in real browser.
- Dashboard works correctly.

## Accepted Controlled-Launch Risks

- Password recovery was implemented in code during `HITO AUTH-1`, but production still requires controlled migration/deploy and email provider validation before it can be considered active self-service recovery.
- Hostinger logs were not reviewed from Codex.
- QA data cleanup/retention is pending.
- Admin queue cross-owner report link can return `404` by ownership protection.
- Browser QA multi-assessment was not replayed by Codex with authenticated cookies.

## Public Launch Blockers

- Password recovery production migration/deploy and real provider smoke.
- QA data cleanup/retention policy.
- Hostinger logs review.
- Admin-safe read-only report view or adjusted admin UX.
- Full authenticated browser QA pass for multi-assessment lifecycle.

## Operating Conditions

- Use limited/pilot users only.
- Use synthetic or controlled customer data only until operational policies are finalized.
- Provide manual account support.
- Keep QA data marked `safe to delete`.
- Monitor production manually during initial usage.

## Next Steps

1. Create Manual v1.0 Production Launch Edition.
2. Implement password recovery.
3. Define QA data cleanup/retention.
4. Add admin-safe report view or adjust admin queue UX.
5. Run authenticated multi-assessment browser QA.
