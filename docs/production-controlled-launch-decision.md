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

- Password recovery was migrated and deployed during `AUTH-1-PROD-EXEC`. Production routes and neutral request flow passed. Resend provider is configured by user report, invalid token handling is controlled, and valid-token mailbox/link smoke passed by user-attested validation.
- Hostinger logs were not reviewed from Codex.
- QA data cleanup/retention is pending.
- Admin queue cross-owner report link can return `404` by ownership protection.
- Browser QA multi-assessment was not replayed by Codex with authenticated cookies.

## Public Launch Blockers

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

1. Review Hostinger runtime/build/error logs after AUTH-1 production deployment.
2. Execute QA data cleanup/retention or explicitly retain QA data with owner/date.
3. Add admin-safe report view or adjust admin queue UX.
4. Run authenticated multi-assessment/upload/report browser QA.

## Public Launch Readiness Review Follow-up

Date: 2026-05-27.

`PUBLIC-LAUNCH-READINESS-REVIEW` result:

- Public launch: NO.
- Controlled production launch remains active: YES.
- Limited public beta / limited public access: YES only under controlled operating conditions.
- Password recovery is no longer a public launch blocker.
- Blocking risks for full public launch remain:
  - Hostinger logs/runtime health not reviewed from Codex.
  - QA cleanup/retention not executed.
  - Fresh authenticated browser QA was not replayed with production cookies.
  - Admin UX gap cross-owner remains.
  - Public support/SLA and entitlement/commercial operating model need final definition.
