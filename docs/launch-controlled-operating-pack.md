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

## Public Launch Readiness Review Update

Date: 2026-05-27.

Decision:

- Public launch: NO.
- Controlled production launch remains active: YES.
- Limited public beta / limited public access may proceed only with controlled operating conditions.

Reasons full public launch is not yet approved:

- Hostinger runtime/build/error logs were not reviewed from Codex.
- QA cleanup/retention is documented but not executed.
- Authenticated browser QA for multi-assessment, upload, report and PDF was not replayed in this review.
- Admin cross-owner report UX gap remains.
- Public support/SLA and entitlement/commercial operating model need final definition.

Operational rule:

- Treat any public users as limited beta users until `PUBLIC-LAUNCH-2` closes the remaining blockers.

## PUBLIC-LAUNCH-2 Operating Update

Date: 2026-05-27.

Limited public beta remains approved under these conditions:

- Low-volume selected users only.
- Manual support.
- Manual entitlement.
- No paid self-service checkout.
- No broad public launch language.
- QA data retained only with `safe to delete` marking.
- Issues captured with screenshots and assessment/report IDs.

Full public launch remains NO until logs, QA cleanup, authenticated browser QA, admin UX and support/SLA are closed.

## PUBLIC-BETA-OPS-1 Follow-up

Date: 2026-05-27.

Operational status:

- Limited beta may continue under controlled / low-volume / invitation-only usage.
- Password recovery regression passed.
- Public/private routes remain healthy.
- No production data cleanup was executed.

Operator reminders:

- Review Hostinger logs manually when available.
- Capture browser QA evidence with screenshots and assessment IDs.
- Keep QA data named `QA Public Beta Ops - safe to delete`.
- Do not hard-delete DB/storage data during beta without inventory and approval.

## PUBLIC-BETA-OPS-2 Follow-up

Date: 2026-05-27.

Operator action still required:

- Export or summarize Hostinger runtime/build/deploy logs without secrets.
- Capture browser QA evidence for multi-assessment and product flow.
- Inventory QA data marked `QA Public Beta Ops 2 - safe to delete`.
- Archive/soft-delete only after item ownership and metadata are confirmed.

## PUBLIC-BETA-OPS-3 Follow-up

Date: 2026-05-27.

Operational status:

- Limited public beta remains operational under controlled, low-volume, invitation-only conditions.
- Public production routes are healthy.
- Password recovery regression passed.
- Full public launch remains NO.

Operator action still required:

- Provide Hostinger deployment/runtime/build log summary without secrets.
- Execute authenticated browser QA with a QA user.
- Execute authenticated upload/parser/report/PDF replay.
- Inventory and archive/retain QA data marked `QA Public Beta Ops 3 - safe to delete`.
