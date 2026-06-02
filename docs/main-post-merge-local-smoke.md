# Main Post-Merge Local Smoke

## Objective
Record the final local smoke on `main` after the controlled merge of `feature/demo-funnel-2`, with no deploy, no DB work, no env changes, and no payment activation.

## Branch / HEAD
- Branch: `main`
- HEAD: `9923b572594e873a64a36942333fccbca2dc5a7f`
- `origin/main`: `9923b572594e873a64a36942333fccbca2dc5a7f`
- Working tree: clean except preserved untracked brand assets
- Untracked preserved:
  - `images/shift-evidence-logo-transparent-1024.png`
  - `images/shift-evidence-logo-transparent-512.png`
  - `public/brand/_incoming/`
- Stashes: preserved, none applied

## Validations
- `git diff --check`: clean
- `npm run typecheck`: pass
- `npm run lint`: pass
- `npx vitest run tests/unit/demoWorkspace.test.ts tests/unit/reportPdfRenderer.test.ts tests/unit/billingPaymentOptions.test.ts tests/unit/adminOpsSpanishSafetyCopy.test.ts tests/unit/billingCheckoutArchitecture.test.ts tests/unit/billingAdminStatusLabels.test.ts tests/unit/billingOperationsCopy.test.ts`: pass
- `npm run test:run`: pass, `117` files / `598` tests
- `npm run build`: pass
- Build warning observed:
  - `./next.config.mjs` emitted the existing NFT tracing warning about an unexpected file in the import trace via `src/server/evidence/localStorageService.ts`

## Route Smoke
Smoke was run locally on `http://127.0.0.1:3000`.

### Public / Commercial
- `/` 200
- `/shiftreadiness` 200
- `/vmware-to-proxmox-readiness` 200
- `/demo` 200
- `/demo/replay` 200
- `/demo/workspace` 200
- `/sample-report` 200
- `/pricing` 200
- `/partners` 200
- `/support` 200
- `/security` 200

### Branding / Favicons
- `/favicon.ico` 200
- `/icon.png` 200
- `/apple-icon.png` 200

### PDFs
- `/demo/reports/balanced-mid-market` 200, `application/pdf`, `%PDF`, `14957` bytes
- `/sample-reports/proxmox-migration-readiness-sample-report.pdf` 200, `application/pdf`, `%PDF`, `2685561` bytes
- `/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf` 200, `application/pdf`, `%PDF`, `2685561` bytes

### Billing
- `/billing/checkout/starter` 200, safe/config-gated copy
- `/billing/checkout/professional` 200, safe/config-gated copy
- `/billing/checkout/msp` 200, safe/config-gated copy
- `/billing/bank-transfer/starter` 200, manual invoice copy
- `/billing/bank-transfer/professional` 200, manual invoice copy
- `/billing/bank-transfer/msp` 200, manual invoice copy

### Private Redirects
- `/dashboard` 307 -> `/sign-in`
- `/dashboard/admin` 307 -> `/sign-in`
- `/dashboard/admin/billing` 307 -> `/sign-in`
- `/dashboard/admin/pricing` 307 -> `/sign-in`
- `/dashboard/admin/unlock-requests` 307 -> `/sign-in`

## Demo Preservation
- `/demo` remains the hub.
- `/demo/replay` remains the quick simulation path.
- `/demo/workspace` remains the deep workspace path.
- Quick replay was not replaced.
- Workspace was not removed.
- `/sample-report` remains live.

## Commercial / Pricing Preservation
- Home still presents the readiness-first landing message.
- Pricing still shows:
  - Starter `USD 490`
  - Professional `USD 1,500`
  - Migration Blueprint `USD 3,500`
  - MSP Partner `from USD 399/month`
- Stripe/Wise split remains clear.
- No live launch claim was introduced.
- No full public launch claim was introduced.

## Billing Safety
- Checkout remains config-gated when env is missing.
- Bank transfer remains manual invoice review only.
- No live Stripe activation.
- No Wise transfer automation.
- No payment created.
- No Lemon checkout UI active.

## Branding / Favicons
- Brand and favicon routes continue to load.
- Logo and icon references are intact after the merge.

## Safety Search
Post-merge safety scan remained clean of real secrets.

Observed only as safe boundaries, docs, labels, or historical references:
- `price_`
- `prod_`
- `sk_live`
- `whsec`
- `Lemon`
- `zero downtime`
- `guaranteed migration`
- `guaranteed savings`
- `automatic migration`
- `no risk`
- `production safe`

No real values were surfaced for:
- `STRIPE_SECRET_KEY=`
- `STRIPE_WEBHOOK_SECRET=`
- `DATABASE_URL=`
- `DIRECT_URL=`
- `BETTER_AUTH_SECRET=`
- `API_KEY=`
- `Bearer`
- `PRIVATE KEY`
- raw `password` or `token` secrets

## What Was Not Touched
- No DB
- No migrations
- No env vars
- No payments
- No Stripe live
- No Wise
- No webhooks
- No entitlements real changes
- No Hostinger
- No Vercel
- No deploy
- No force push
- No stash applied

## Pending Real Work
- Browser/session PDF QA
- Browser/session admin billing QA
- Stripe test Price IDs with safe credentials
- Visual PDF QA
- Separate deploy/cutover approval

## Recommendation
- `main` is sane as the post-merge baseline.
- No deploy was performed.
- Next step: plan the preview/deploy path separately, or wait for browser/session and Stripe test credentials if you want to close the remaining QA items first.
