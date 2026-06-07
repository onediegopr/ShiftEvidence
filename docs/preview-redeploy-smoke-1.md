# Preview Redeploy Smoke 1

## Status
- Push docs: done.
- Preview deploy: done.
- Smoke: done on authenticated Vercel browser session.

## Pushed commits
- `437f12a` `docs: record preview environment loading gate`
- `4e592f3` `docs: record preview environment smoke gate`

## Preview deploy
- URL: `https://infrashift-r2-recovery-qwf85ubml-shift-evidence.vercel.app`
- Target: preview
- Confirmed not production: yes
- Preview Protection: still active on unauthenticated access
- Authenticated browser session: usable

## Smoke results
### Public routes
- `/` OK
- `/about` OK
- `/pricing` OK
- `/sample-report` OK
- `/demo` OK
- `/demo/replay` OK
- `/demo/workspace` OK
- `/vmware-to-proxmox-readiness` OK
- `/support` OK
- `/security` OK

### PDFs
- `/marketing/shift-evidence-product-brief.pdf` OK
- `/marketing/shift-evidence-product-brochure.pdf` OK
- `/marketing/migration-blueprint-overview.pdf` OK

### Private routes
- `/dashboard` redirected to `/sign-in`
- `/dashboard/admin` redirected to `/sign-in`
- `/dashboard/admin/methodology` redirected to `/sign-in`
- `/dashboard/admin/billing` redirected to `/sign-in`

### Billing
- Safe-off/test only behavior preserved.
- No live payment flow was exercised.

## What remains blocked
- Unauthenticated automation against the Preview URL still receives protection gating.
- No production deploy, DNS, or live payment changes were made.

## Next recommended gate
- `PREVIEW-STRIPE-TEST-SMOKE-1` if test checkout needs validation.
- `OUTREACH/PILOT-1` if the next focus is customer-safe validation.
