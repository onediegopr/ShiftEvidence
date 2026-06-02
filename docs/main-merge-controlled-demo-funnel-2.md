# Main Merge Controlled: Demo Funnel 2

## Objective
Record the controlled merge of `feature/demo-funnel-2` into `main` without deploy, Hostinger, Vercel, DB, env var, or billing runtime changes.

## Branch / HEAD
- Feature branch: `feature/demo-funnel-2`
- Feature HEAD before merge: `9ccd2bd2492abf6333c294882c17c4f96b6b5cb2`
- Main HEAD before merge: `be2c5f48852176beaf355145e9e24d01893a74f1`
- Main HEAD after merge: merge commit created locally on `main`
- Remote canonical: `https://github.com/onediegopr/ShiftEvidence.git`

## Pre-Merge Validation
- `git status -sb`
- `git branch --show-current`
- `git rev-parse HEAD`
- `git remote -v`
- `git fetch origin`
- `git branch -r`
- `git log --oneline -n 20`
- `git log --oneline origin/main..origin/feature/demo-funnel-2`
- `git log --oneline origin/feature/demo-funnel-2..origin/main`
- `git stash list`
- `git ls-files --others --exclude-standard`
- `git show --stat --oneline --decorate --name-only aa0bff5`
- `git show --stat --oneline --decorate --name-only 9ccd2bd`
- `git diff --check`
- `npm run typecheck`
- `npm run lint`
- `npx vitest run tests/unit/demoWorkspace.test.ts tests/unit/reportPdfRenderer.test.ts tests/unit/billingPaymentOptions.test.ts tests/unit/adminOpsSpanishSafetyCopy.test.ts tests/unit/billingCheckoutArchitecture.test.ts tests/unit/billingAdminStatusLabels.test.ts tests/unit/billingOperationsCopy.test.ts`

## Merge
- Command used: `git merge --no-ff origin/feature/demo-funnel-2 -m "merge: integrate demo funnel commercial readiness"`
- Result: merge completed successfully with the `ort` strategy
- Conflicts: none

## Post-Merge Validation
- `git status -sb`
- `git diff --check`
- `npm run typecheck`
- `npm run lint`
- `npx vitest run tests/unit/demoWorkspace.test.ts tests/unit/reportPdfRenderer.test.ts tests/unit/billingPaymentOptions.test.ts tests/unit/adminOpsSpanishSafetyCopy.test.ts tests/unit/billingCheckoutArchitecture.test.ts tests/unit/billingAdminStatusLabels.test.ts tests/unit/billingOperationsCopy.test.ts`
- `npm run test:run`
- `npm run build`

## Route Smoke
Local smoke ran on `http://127.0.0.1:3000` after the merge.

### Public / Commercial
- `/`
- `/shiftreadiness`
- `/vmware-to-proxmox-readiness`
- `/demo`
- `/demo/replay`
- `/demo/workspace`
- `/sample-report`
- `/pricing`
- `/partners`
- `/support`
- `/security`

### Branding / Favicons
- `/favicon.ico`
- `/icon.png`
- `/apple-icon.png`

### PDFs
- `/demo/reports/balanced-mid-market`
- `/sample-reports/proxmox-migration-readiness-sample-report.pdf`
- `/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf`

### Billing
- `/billing/checkout/starter`
- `/billing/checkout/professional`
- `/billing/checkout/msp`
- `/billing/bank-transfer/starter`
- `/billing/bank-transfer/professional`
- `/billing/bank-transfer/msp`

### Private Redirects
- `/dashboard`
- `/dashboard/admin`
- `/dashboard/admin/billing`
- `/dashboard/admin/pricing`
- `/dashboard/admin/unlock-requests`

## Billing Safety
- Stripe checkout stayed config-gated.
- Bank transfer stayed manual invoice review only.
- No live Stripe activation was made.
- No Wise transfer flow was activated.
- No payment was created.

## Safety Search
The post-merge diff and checked surfaces did not expose real secrets. Historical or guardrail-only mentions of `price_`, `prod_`, `sk_live`, `whsec`, `Lemon`, and non-claims such as `zero downtime` remained non-runtime.

## No Deploy
- No deploy was performed.
- No Hostinger changes were made.
- No Vercel changes were made.
- No DB or migrations were run.
- No env vars were changed.

## Pending Items
- Authenticated browser/session PDF QA
- Authenticated admin billing visual QA
- Stripe test-mode Price ID validation with safe test credentials
- Manual visual PDF QA
- Separate deploy/cutover approval

## Rollback Note
If a rollback is required before push, reset `main` back to the pre-merge commit `be2c5f48852176beaf355145e9e24d01893a74f1` and keep the feature branch intact. Do not discard untracked brand assets or stashes.
