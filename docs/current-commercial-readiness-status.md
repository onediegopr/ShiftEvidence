# Current Commercial Readiness Status

## Snapshot

- Repo: `infrashift`
- Branch: `feature/demo-funnel-2`
- Current HEAD: `2d89dd0eeabdbbb26120cd781d3ed065481085da`
- Remote: `origin -> https://github.com/onediegopr/ShiftEvidence.git`
- Working tree: clean except preserved untracked brand source assets

## What Is Closed

- Branding/favicons are in place and wired into the app.
- The live demo funnel remains connected:
  - `/demo`
  - `/demo/replay`
  - `/demo/workspace`
- Public PDFs are healthy:
  - demo PDF
  - sample PDF
  - premium sample PDF v2
- Public routes and private redirects are behaving safely.
- Commercial copy remains aligned with the evidence-based positioning.
- Billing surfaces remain split between card checkout and manual bank transfer.
- Stripe live is still gated and not turned on.
- Wise remains manual-bank-transfer language only.
- The authenticated PDF smoke milestone was documented and pushed as `2d89dd0`.

## What Is Partial

- Full authenticated browser/session PDF QA is still pending.
- Authenticated admin billing visual QA is still pending.
- Stripe test-mode Price ID readiness is still pending.
- Manual visual PDF QA is still pending.

## What Was Audited

- Git sync and branch status.
- Public landing and pricing surfaces.
- Demo hub, quick replay, and workspace routes.
- Public PDFs and favicon/app icon endpoints.
- Admin routes without session.
- Billing checkout and bank-transfer surfaces.
- Safety terms and claim boundaries.
- Recent docs for coherence.

## Brand Assets

Preserved untracked source assets:

- `images/shift-evidence-logo-transparent-1024.png`
- `images/shift-evidence-logo-transparent-512.png`
- `public/brand/_incoming/`

Current decision:

- Keep these assets preserved.
- Do not track the entire `_incoming` directory as runtime assets.
- If any source artwork is later promoted, track only the selected canonical files, not the whole scratch folder.

Observed brand/runtime references:

- Active PDF renderers and tests already reference the canonical transparent icons under `public/brand/`.
- No runtime references depend on the untracked source files directly.

## Safety

- No DB changes were made.
- No migrations were run.
- No `db push` was run.
- No env vars were changed.
- No Stripe live actions were taken.
- No Wise transfers were initiated.
- No payments were triggered.
- No deploy was performed.
- No stashes were applied.
- No secrets were printed.

## Useful Route Checks

Public:

- `/`
- `/demo`
- `/demo/replay`
- `/demo/workspace`
- `/sample-report`
- `/pricing`
- `/vmware-to-proxmox-readiness`
- `/favicon.ico`
- `/icon.png`
- `/apple-icon.png`

PDFs:

- `/demo/reports/balanced-mid-market`
- `/sample-reports/proxmox-migration-readiness-sample-report.pdf`
- `/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf`

Private redirects without session:

- `/dashboard`
- `/dashboard/admin`
- `/dashboard/admin/billing`
- `/dashboard/admin/pricing`
- `/dashboard/admin/unlock-requests`

Billing surfaces:

- `/billing/checkout/starter`
- `/billing/checkout/professional`
- `/billing/checkout/msp`
- `/billing/bank-transfer/starter`
- `/billing/bank-transfer/professional`
- `/billing/bank-transfer/msp`

## Next Steps

1. Re-run authenticated browser PDF QA when a controlled session is available.
2. Re-run authenticated admin billing QA when a controlled admin session is available.
3. Re-check Stripe test-mode Price IDs when safe test credentials are available.
4. Promote only the brand source assets that are explicitly selected for canonical tracking.

