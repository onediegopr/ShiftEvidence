# Admin Entitlement Operating Runbook

## Scope

This runbook covers manual admin review and entitlement fulfillment during controlled production launch.

## Preconditions

- Admin user exists.
- Admin email is included in `ADMIN_EMAILS` conceptually.
- Admin can sign in.
- Admin route loads:
  `/dashboard/admin/unlock-requests`

Do not print secrets, env values, cookies or tokens.

## Review Steps

1. Sign in as admin.
2. Open `/dashboard/admin/unlock-requests`.
3. Review counters: pending, approved, fulfilled, rejected.
4. Locate request.
5. Confirm request is expected for controlled launch.
6. Check user/assessment context.
7. Add or review admin notes.
8. Fulfill only if approved.

## Fulfillment Validation

After fulfill:

- [ ] Request status is fulfilled or entitlement granted.
- [ ] Entitlement exists for full report.
- [ ] User can access full report path.
- [ ] Full report can be generated.
- [ ] PDF can be downloaded.
- [ ] No `0.0.0.0` redirects.
- [ ] No data leakage to unrelated users.

## Known UX Gap

Admin queue may show requests for assessments owned by other users.

Opening the standard user report route may return `404` because ownership protection is working.

Backlog:

- Admin-safe read-only report view.
- Or safer copy/button behavior.

## Safety Rules

- Do not modify DB manually.
- Do not delete QA data without recording it.
- Do not share internal notes externally.
- Do not bypass entitlement flow manually unless explicitly authorized and documented.
