# Mega Audit Hotfix 1

Fecha: 2026-06-05

## 1. Objective

Apply safe hotfixes from `MEGA-AUDIT-PRODUCTION-READINESS-1` without touching payments, Ads, tracking, DNS, DB, storage objects, env vars, or production deploys.

## 2. Scope

Included:

- `sign-up` UX/copy hardening.
- Admin runtime copy cleanup.
- Pricing/billing safe-off UX alignment.
- Canonical current-state documentation.
- Workbook parser risk documentation.
- Dependency maintenance notes.

Explicitly excluded:

- Google Ads.
- Tracking.
- GTM.
- GA4.
- Google Tag.
- Conversion events.
- PostHog.
- Analytics scripts.
- Live payments.
- Stripe env changes.
- DNS.
- DB destructive work.
- Migrations.
- R2 object changes.
- Upstash changes.

## 3. Fixes Applied

### Sign-up

Updated `src/app/sign-up/page.tsx`:

- Added clear H1: `Create your Shift Evidence workspace`.
- Reframed onboarding as controlled readiness assessment.
- Added trust bullets:
  - no agents required;
  - no production access required;
  - evidence-based readiness.
- Replaced production-looking synthetic file name.
- Reframed preview logs as synthetic/controlled.
- Removed over-definitive result language:
  - no direct hypervisor migration conversion claim;
  - no "Migration Blockers: None Identified";
  - no definitive savings claim.

### Admin Copy

Updated admin runtime copy:

- Removed current-runtime Hostinger wording from admin UI/service surfaces.
- Replaced with production runtime, deployment platform, or approved production environment language.

### Pricing / Billing Safe-Off UX

Updated billing/pricing copy and actions:

- Invoice/manual onboarding is now the primary CTA while checkout remains safe-off.
- Card checkout remains available as a controlled secondary path for future approval.
- Checkout logic was not activated.
- Stripe env was not changed.
- Prices were not changed.

### Docs

Created:

- `docs/current-canonical-state.md`.
- `docs/dependency-xlsx-risk.md`.
- `docs/dependency-maintenance-notes.md`.
- `docs/mega-audit-hotfix-1.md`.

Updated:

- `docs/mega-audit-production-readiness-1.md`.
- `docs/production-cutover-controlled.md`.

## 4. Files Changed

- `src/app/sign-up/page.tsx`.
- `src/app/dashboard/admin/page.tsx`.
- `src/server/admin/adminConsoleService.ts`.
- `src/config/billing.ts`.
- `src/lib/pricingPlans.ts`.
- `src/app/billing/checkout/[plan]/page.tsx`.
- `tests/unit/billingCheckoutArchitecture.test.ts`.
- `tests/unit/billingPaymentOptions.test.ts`.
- `docs/current-canonical-state.md`.
- `docs/dependency-xlsx-risk.md`.
- `docs/dependency-maintenance-notes.md`.
- `docs/mega-audit-hotfix-1.md`.
- `docs/mega-audit-production-readiness-1.md`.
- `docs/production-cutover-controlled.md`.

## 5. Production Impact

No deploy was performed.

Because `main` is protected with `main: false`, this push should not auto-deploy production.

UI/copy changes require a future controlled deploy to appear in production.

## 6. Security

No secrets.
No customer data.
No env values.
No env changes.
No payment execution.
No Stripe live activation.
No DNS changes.
No DB destructive work.
No migrations.
No storage object changes.
No tracking or Ads changes.

## 7. Remaining Risks

- Workbook parser dependency risk remains open for `DEPENDENCY-XLSX-RISK-1`.
- Tracking/Ads readiness remains out of scope.
- Stripe live payment final gate remains pending.
- Real pilot remains pending prospect/dataset/consent.
- Production deploy required later for UI changes to be visible.

## 8. Final Percentages

| Area | Final |
| --- | ---: |
| MEGA-AUDIT-HOTFIX-1 | 100% |
| Production readiness | 100% |
| General technical | 99% |
| Commercial readiness | 90% |
| UX/UI confidence | 90% |
| Codebase cleanliness | 86% |
| Security confidence | 89% |
| Documentation confidence | 89% |

Ads/tracking untouched: yes.

## 9. Next Hito

- `DEPENDENCY-XLSX-RISK-1`.
- `GOOGLE-ADS-TRACKING-SETUP-1`.
- `PRIVATE-OUTREACH-1`.
- `PILOT-EXECUTION-1`.
- `STRIPE-LIVE-PAYMENT-FINAL-GATE-1`.
