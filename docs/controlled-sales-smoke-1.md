# CONTROLLED-SALES-SMOKE-1 - End-to-End Controlled Sales Funnel Smoke

## Objective

Validate the controlled sales funnel from public commercial pages through demo, sample report, pricing, billing surfaces and private-route redirects without creating payments, running Wise actions, touching DB state, changing env vars, deploying, or changing billing behavior.

## Environment

- Date: 2026-06-02
- Branch: `feature/demo-funnel-2`
- Initial HEAD: `afd52bf38697656883633950664bf1f03297df12`
- Local runtime: `next start` on `localhost:3001`
- Build env: placeholder local values only; no production secrets printed or used
- Database: no production DB used; no DB mutation performed
- Admin session: not available in local unauthenticated smoke

## Git / Sync

- Working tree started clean.
- `origin/main` had no new commits after fetch.
- `origin/feature/demo-funnel-2` was synchronized with local HEAD before the hito.
- No stash was applied.
- No merge, rebase, force push or deploy was performed.

## Validations Executed

| Check | Result |
| --- | --- |
| `npm run typecheck` | OK |
| `npm run lint` | OK |
| `npx vitest run tests/unit/demoWorkspace.test.ts tests/unit/reportPdfRenderer.test.ts tests/unit/billingPaymentOptions.test.ts` | OK, 3 files / 18 tests |
| `npm run test:run` | OK, 114 files / 588 tests |
| `npm run build` | OK |
| Build warning | Known Turbopack/NFT warning from file download route trace; non-blocking |
| Local bad script check | `LOCAL_BAD_SCRIPT_COUNT=0` |

## Route Smoke

| Route | Result | Notes |
| --- | --- | --- |
| `/` | 200 `text/html` | Public home loads |
| `/shiftreadiness` | 200 `text/html` | Product page loads |
| `/vmware-to-proxmox-readiness` | 200 `text/html` | High-intent landing loads |
| `/demo` | 200 `text/html` | Demo hub loads |
| `/demo/replay` | 200 `text/html` | Quick simulation route loads |
| `/demo/workspace` | 200 `text/html` | Deep demo workspace route loads |
| `/demo/reports/balanced-mid-market` | 200 `application/pdf` | Dynamic demo PDF route OK |
| `/sample-report` | 200 `text/html` | Public sample report page loads |
| `/pricing` | 200 `text/html` | Pricing page loads |
| `/partners` | 200 `text/html` | Partners page loads |
| `/support` | 200 `text/html` | Support page loads |
| `/security` | 200 `text/html` | Security page loads |
| `/sign-in` | 200 `text/html` | Auth page loads |
| `/sign-up` | 200 `text/html` | Signup page loads |
| `/billing/checkout/starter` | 200 `text/html` | Stripe/card checkout surface renders safely |
| `/billing/checkout/professional` | 200 `text/html` | Stripe/card checkout surface renders safely |
| `/billing/checkout/msp` | 200 `text/html` | Stripe/card checkout surface renders safely |
| `/billing/bank-transfer/starter` | 200 `text/html` | Manual invoice / bank transfer surface renders safely |
| `/billing/bank-transfer/professional` | 200 `text/html` | Manual invoice / bank transfer surface renders safely |
| `/billing/bank-transfer/msp` | 200 `text/html` | Manual invoice / bank transfer surface renders safely |
| `/dashboard` | 307 to `/sign-in` | Expected unauthenticated redirect |
| `/dashboard/admin` | 307 to `/sign-in` | Expected unauthenticated redirect |
| `/dashboard/admin/billing` | 307 to `/sign-in` | Expected unauthenticated redirect |

## Funnel QA

### Home

- CTA to quick simulation present.
- CTA to demo workspace present.
- Sample report path present.
- No active automatic migration promise detected.

### ShiftReadiness

- Product page loads and connects to quick simulation, sample report and pricing.
- Copy remains evidence-based.

### VMware to Proxmox Readiness

- High-intent landing loads.
- Connects to sample report and pricing.
- The exact phrase `before touching production` was not used in the smoke check, but the page preserves the evidence-before-migration positioning and safety disclaimers.

### Demo Hub

- `/demo` loads as the public demo hub.
- Quick replay path present.
- Deep workspace path is available; exact `Explore Demo Workspace` text was not present in the smoke string check because the UI uses equivalent CTA language.

### Demo Replay

- `/demo/replay` preserves quick simulation.
- Contains `Start Simulation`.
- Connects to the full demo workspace.

### Demo Workspace

- `/demo/workspace` preserves the deep synthetic assessment experience.
- Contains quick simulation cross-link and PDF references.

### Sample Report

- Explains public sample vs Professional Assessment vs Migration Blueprint.
- Preserved CTAs:
  - Watch Quick Simulation.
  - Explore a Sample Assessment.
  - View pricing.
  - Download full sample PDF.
  - Start readiness assessment.
  - Book readiness review.

### Pricing

Pricing page loads and includes:

- Starter: USD 490.
- Professional: USD 1,500.
- Migration Blueprint: from USD 3,500.
- MSP Partner: from USD 399/month.
- Checkout/manual invoice separation remains visible through dedicated checkout and bank-transfer routes.
- No active Lemon checkout surface detected.

## PDF / Sample Assets QA

| Asset | Result |
| --- | --- |
| `/demo/reports/balanced-mid-market` | 200 `application/pdf`, 14,133 bytes, `%PDF` header |
| `/sample-reports/proxmox-migration-readiness-sample-report.pdf` | 200 `application/pdf`, 221,463 bytes, `%PDF` header |
| `/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf` | 200 `application/pdf`, 221,463 bytes, `%PDF` header |

Visual PDF QA was not performed because no local visual PDF renderer/text extraction tool was used in this hito.

## Stripe Checkout Surface QA

Validated routes:

- `/billing/checkout/starter`
- `/billing/checkout/professional`
- `/billing/checkout/msp`

Findings:

- All routes render HTTP 200 locally.
- Copy/checks confirm Stripe/checkout surface on starter route.
- No live payment was created.
- No Stripe API call was triggered by this smoke.
- No webhook behavior was changed.
- No BillingOrder paid state was created.
- No entitlement was granted.
- No Lemon checkout surface was detected.

## Manual Invoice / Bank Transfer QA

Validated routes:

- `/billing/bank-transfer/starter`
- `/billing/bank-transfer/professional`
- `/billing/bank-transfer/msp`

Findings:

- All routes render HTTP 200 locally.
- Professional manual invoice route includes manual/invoice copy.
- No Wise API action was executed.
- No transfer was created.
- No entitlement was granted.
- No synthetic request was created because this hito used local placeholder DB configuration, and the prompt explicitly allowed reporting pending rather than forcing DB access.

## Admin Visibility QA

Admin authenticated session was not available in this local smoke.

Unauthenticated results:

- `/dashboard`: 307 to `/sign-in`.
- `/dashboard/admin`: 307 to `/sign-in`.
- `/dashboard/admin/billing`: 307 to `/sign-in`.

This confirms private/admin routes are not public in the local smoke. Admin billing visual verification remains pending for an authenticated browser/admin hito.

## Claims Safety

Searched:

- `zero downtime`
- `guaranteed migration`
- `guaranteed savings`
- `fully automated migration`
- `automatic migration`
- `no risk`
- `100% accurate`
- `production safe`
- `replace consultant`
- `Lemon`
- `lemon`
- `lemon_squeezy`

Relevant findings:

- Dangerous phrases appear as disclaimers, guardrails, tests, methodology examples or docs, not active public promises.
- Public/demo copy includes explicit non-claims such as no zero-downtime guarantee and no guaranteed savings.
- Lemon appears only in historical removal docs and the preserved historical Prisma enum/migration context, not as an active checkout UI.

## Billing Safety

Confirmed:

- No real payments.
- No live Stripe activation.
- No Stripe API call in smoke.
- No Wise API call.
- No manual invoice fulfillment.
- No BillingPayment paid state.
- No BillingOrder paid state.
- No AssessmentEntitlement grant.
- No webhook changes.
- No pricing changes.

## Preservation

Confirmed preserved:

- `/demo`
- `/demo/replay`
- `/demo/workspace`
- `/demo/reports/[scenario]`
- `/sample-report`
- `/pricing`
- Stripe/Wise separation
- Admin billing route protection
- Public sample PDFs
- Premium sample PDF
- Report/PDF generator
- Business Continuity
- Licensing
- Storage Destination
- Evidence Confidence
- Readiness Score

## What Was Not Touched

- No DB destructive action.
- No migrations.
- No Prisma schema changes.
- No env vars.
- No Hostinger.
- No Vercel.
- No deploy.
- No force push.
- No stash applied.
- No product code changes.
- No billing behavior changes.

## Risks Remaining

- Manual visual PDF QA remains recommended.
- Authenticated admin billing visibility remains pending.
- Authenticated real/synthetic PDF generation smoke remains pending.
- Admin Spanish ops polish remains pending.
- Production deploy/cutover remains separate.
- Stripe test-mode Price IDs and auth flow should be validated only in a controlled authenticated/test-mode hito if still pending.

## Recommendation

If this local controlled sales smoke is accepted, next recommended hito is `ADMIN-OPS-ES-1` to polish internal/admin operations. If the priority is commercial runtime, run a separate authenticated/browser smoke for admin billing visibility and Stripe test-mode configuration without touching live payments.
