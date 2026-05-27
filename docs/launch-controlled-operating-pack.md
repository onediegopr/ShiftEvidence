# Launch Controlled Operating Pack

## Purpose

This operating pack defines how ShiftReadiness should be operated during controlled production launch.

Production launched: SÍ.

Launch type: controlled production launch.

Public launch: NO.

## What Controlled Launch Means

Controlled launch means limited, supervised production usage.

Allowed:

- Pilot users.
- Supervised demos.
- Manual entitlement flow.
- Synthetic or approved customer data.
- Manual account support.

Not allowed yet:

- Public launch at scale.
- Mass marketing/ads.
- Self-service paid checkout.
- Claims of full public launch readiness before remaining public launch blockers are reviewed.
- Untracked deletion of QA data.

## Daily Checklist

- Public `/` returns OK.
- `/shiftreadiness` returns OK.
- `/sign-in` returns OK.
- `/dashboard` redirects without session.
- QA/admin login works if tested.
- Dashboard loads for authenticated user.
- Admin queue loads for admin.
- Pending requests are reviewed.
- Visible errors are captured.

## Workflow

1. Pilot user creates account.
2. Pilot user creates assessment.
3. Pilot user completes intake and assumptions.
4. Pilot user uploads evidence.
5. Pilot user reviews preview.
6. Pilot user requests full report.
7. Admin reviews and fulfills.
8. Pilot user generates/downloads full report.
9. Issues are documented with assessment ID and screenshots.

## Escalation

Escalate immediately if:

- Public routes fail.
- Private routes expose data.
- Upload stores files publicly.
- Report download is accessible without session.
- Admin route exposes data to non-admin.
- PDF generation repeatedly fails.
- Hostinger returns persistent `503/504`.

## Rollback / Pause

If launch must be paused:

- Do not delete production data.
- Do not run Prisma reset.
- Preserve logs.
- Document reason.
- Revert launch decision documentation if needed.
- Notify pilot users manually.

## Accepted Risks

- Password recovery migrated and deployed; Resend provider and valid-token mailbox smoke passed by user-attested validation.
- Hostinger logs not reviewed from Codex.
- QA cleanup pending.
- Admin UX gap cross-owner.
- Browser multi-assessment replay not automated by Codex.

## AUTH-1 Account Support Update

The application now includes password recovery code and UI:

- `/sign-in` includes `Forgot password?`.
- `/forgot-password` accepts recovery requests with a neutral response.
- `/reset-password?token=...` accepts single-use reset tokens.
- Reset requests are stored with hashed tokens.
- Resend email delivery is configured by user report with `RESEND_API_KEY` and `EMAIL_FROM`.
- If provider delivery regresses, recovery requests fall back to manual support.

Production use has completed controlled migration and deploy. Do not run `prisma migrate reset`.

AUTH-1-PROD status:

- Production migration applied.
- Code pushed and deployed on Hostinger.
- `/forgot-password` and `/reset-password` live.
- Invalid token handling is controlled.
- Password recovery is operational in production.
