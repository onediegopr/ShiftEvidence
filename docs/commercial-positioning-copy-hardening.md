# COMMERCIAL-1 - Landing / Positioning / Pricing Copy Hardening

Date: 2026-06-02

## Objective

Strengthen Shift Evidence / ShiftReadiness commercial positioning without
removing protected content, changing product behavior, touching payments or
altering core technical flows.

The goal was to make the existing surface easier to sell:

- what ShiftReadiness is;
- why it is worth paying for;
- how quick replay and Demo Workspace differ;
- what each plan delivers;
- how Stripe card checkout and Wise/manual invoice requests are separated;
- what the product does not promise.

## Routes Touched

- `/`
- `/shiftreadiness`
- `/vmware-to-proxmox-readiness`
- `/pricing`
- `/sample-report`
- `/partners`
- `/support`

## Files Changed

- `src/components/Hero.tsx`
- `src/views/ShiftReadinessPage.tsx`
- `src/app/vmware-to-proxmox-readiness/page.tsx`
- `src/app/pricing/page.tsx`
- `src/components/sample-report/SampleReportPage.tsx`
- `src/app/partners/page.tsx`
- `src/app/support/page.tsx`
- `src/lib/pricingPlans.ts`

## Copy / CTA Strategy

The commercial sequence now emphasizes:

1. senior-grade migration readiness before touching production;
2. evidence-backed decision packs instead of generic dashboards;
3. fast demo replay for quick comprehension;
4. deep Demo Workspace for proof;
5. sample report as the deliverable bridge;
6. pricing as plan selection;
7. Stripe/Wise payment paths as controlled and configuration-aware.

## Protected Content Preserved

Confirmed preserved:

- `/demo`
- `/demo/replay`
- `/demo/workspace`
- `/demo/reports/[scenario]`
- `/sample-report`
- `/pricing`
- `/partners`
- `/support`
- `/security`
- Stripe checkout routes
- Wise/manual invoice routes
- Admin billing
- Premium sample PDF
- Demo PDFs
- Senior Advisor
- Project Memory
- Evidence Expansion
- Migration Recommendation Plan
- Customer Context
- Storage Destination Readiness
- Licensing & Cost Exposure
- Business Continuity Risk
- Report/PDF generator
- Entitlements
- Auth
- Upload/evidence flows

No protected route or feature was removed, renamed or hidden.

## What Changed

### Home / Hero

- Strengthened the headline from risk audit language to senior-grade migration
  readiness before touching production.
- Preserved quick simulation, Demo Workspace and sample report CTAs.
- Added a pricing CTA to complete the demo -> sample -> pricing path.

### ShiftReadiness

- Reframed the lead around turning exported VMware evidence into a senior-grade
  migration decision pack.
- Updated pricing microcopy to reflect current Stripe/Wise controlled payment
  paths instead of implying checkout is merely future/not activated.

### VMware To Proxmox Readiness

- Clarified that the assessment helps infrastructure teams, MSPs and consultants
  before workshops, pilots or execution.
- Updated FAQ/payment copy to say Stripe is used when configured and Wise/manual
  invoice requests are reviewed.
- Preserved "not a migration execution tool" boundaries elsewhere on the page.

### Pricing

- Reframed pricing as choosing the right evidence-backed migration decision
  pack.
- Preserved all numeric prices:
  - Starter Readiness: USD 490
  - Professional Assessment: USD 1,500
  - Migration Blueprint: From USD 3,500
  - MSP Partner: From USD 399/month
- Clarified that Wise is manual invoice/bank transfer reference, not automatic
  Wise transfer or balance action.
- Added a quick simulation CTA near the read-only sample assessment CTA.

### Sample Report

- Added a clearer bridge between the sample report, Professional Assessment and
  Migration Blueprint.
- Added pricing CTA.
- Clarified quick replay vs deep workspace proof.

### Partners

- Strengthened MSP/consultant value around repeatable readiness conversations,
  client-ready PDFs and pre-sales proposal support.
- Preserved manual review and workspace isolation boundaries.

### Support

- Clarified that support does not provide automatic Wise transfers or automated
  billing provider workflows.

### Pricing Plan Copy

- Preserved prices, plan IDs, provider separation and routes.
- Updated payment notes to:
  - Stripe card checkout when configured;
  - Wise/manual invoice reviewed before fulfillment;
  - no automatic Wise transfer;
  - no automatic fulfillment promise.

## What Did Not Change

No changes were made to:

- database;
- Prisma schema;
- migrations;
- payment behavior;
- Stripe webhook behavior;
- Wise/manual invoice behavior;
- entitlements;
- auth;
- upload/storage;
- report/PDF generator;
- real payments;
- Hostinger;
- Vercel;
- environment variables;
- production deploy.

## Billing Copy Decisions

Billing language now uses these boundaries:

- Stripe = card checkout when configured and approved.
- Wise = manual invoice / bank transfer request.
- Manual invoice requests are reviewed before fulfillment.
- Wise is not automatic transfer execution.
- Checkout availability and access matching are resolved at runtime.
- No automatic public checkout activation is promised for scoped agreements.

Lemon Squeezy was not reintroduced.

## Demo Funnel Preservation

The quick replay remains separate from the Demo Workspace:

- `/demo/replay` = quick conversion simulation.
- `/demo/workspace` = deep proof / read-only sample assessment.
- `/demo` = hub that connects both.

The commercial CTA graph remains:

Home / landing -> Watch 90-second simulation -> Explore Demo Workspace -> View
Sample Report -> View Pricing -> Stripe card checkout or Wise manual invoice
request.

## Claims Safety

No copy was added that promises:

- zero downtime;
- guaranteed migration;
- automatic migration;
- guaranteed savings;
- no risk;
- full diagnosis without evidence;
- replacement of every human migration decision.

The positioning remains evidence-first and conservative.

## Validations

Executed validations:

- `npm run typecheck` - OK
- `npm run lint` - OK
- `npx vitest run tests/unit/billingPaymentOptions.test.ts` - OK
- `npm run test:run` - OK, 114 files / 580 tests
- `npm run build` - OK with local placeholder env
- local production-like route smoke on port `3001` - OK
- local JavaScript chunk check - `LOCAL_BAD_SCRIPT_COUNT=0`
- mandatory search checks - completed

Build note:

- The known Turbopack/NFT warning from the private evidence download route
  remains non-blocking and unrelated to this copy hardening hito.

Browser visual note:

- No direct in-app browser control tool was available in this session. Visual QA
  was covered by local HTTP smoke and route/content checks, not by screenshot QA.

## Remaining Risks

- PDF/report visual quality still needs a dedicated premium polish pass.
- Admin billing still needs Spanish operator warnings and safer action UX.
- Controlled sales smoke should validate demo -> sample -> pricing ->
  checkout/invoice -> admin visibility.

## Next Recommended Hito

Recommended next hito:

`REPORT-QUALITY-1 - PDF/report premium final polish and sample report quality`

Alternative if operations is more urgent:

`ADMIN-OPS-ES-1 - Admin interno en español, warnings, states and billing admin usability`
