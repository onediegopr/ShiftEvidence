# Marketing PDF System

## Scope

MARKETING-PDF-1 adds a reproducible brochure system for public, non-customer-facing marketing collateral.

Generated assets:

- `public/marketing/shift-evidence-product-brief-v1.pdf`
- `public/marketing/shift-evidence-product-brochure-v1.pdf`
- `public/marketing/migration-blueprint-overview-v1.pdf`
- `public/marketing/shift-evidence-product-brief-v2.pdf`
- `public/marketing/shift-evidence-product-brochure-v2.pdf`
- `public/marketing/migration-blueprint-overview-v2.pdf`

Generator:

- `scripts/generate-marketing-pdfs.mjs`
- Package script: `npm run marketing-pdfs:generate`

## Audience

The PDFs are intended for:

- VMware exit stakeholders who need a simple overview before uploading evidence.
- MSPs, consultants and integrators who need a pre-sales leave-behind.
- Technical buyers comparing Starter, Professional, Blueprint and MSP Partner paths.
- Internal reviews where the product needs to be explained without exposing customer data.

## PDF Roles

## Current Default

Use v2 as the default public brochure family. v1 is preserved for history and regression coverage.

The v2 direction is light, print-first and editorial. It is intended for owner forwarding, office printing, demo follow-up and pricing discussions.

### Product Brief v1

One-page product overview for fast stakeholder sharing.

Use when someone asks:

- What is Shift Evidence?
- Why would we use it before a VMware to Proxmox migration?
- What packages exist?
- What are the boundaries?

### Product Brochure v1

Full product narrative covering:

- VMware exit problem framing.
- Evidence intake and decision engine.
- Assessment lifecycle.
- Deliverables.
- Evidence model and advisor boundaries.
- Scoring model.
- Packages and pricing.
- Security, trust and fit.
- Next steps.

### Migration Blueprint Overview v1

Focused explanation for the planning tier.

Use when a buyer understands the readiness report but needs to know what Blueprint adds:

- Migration waves.
- Pilot framing.
- Rollback assumptions.
- Validation gates.
- Technical review language.

## Pricing Truth

The PDFs intentionally mirror current pricing labels from the product:

- Starter Readiness: `USD 490`
- Professional Assessment: `USD 1,500`
- Migration Blueprint: `From USD 3,500`
- MSP Partner: `From USD 799/month`

If pricing changes, update `src/config/billing.ts`, then update the generator copy and rerun:

```bash
npm run marketing-pdfs:generate
```

## Safety Boundaries

The marketing PDFs must not claim:

- Guaranteed migration success.
- Zero downtime migration.
- Automated migration execution.
- Complete dependency discovery without evidence.
- Verified backup posture without uploaded backup evidence.

Approved framing:

- Evidence-backed readiness.
- Risk-qualified decision pack.
- Missing evidence surfaced before execution.
- No production writes.
- No agent installation required for the assessment intake.
- AI advisor constrained by evidence and assumptions.

## Public Link Placement

Soft links are added in:

- `/sample-report`
- `/pricing`
- `/vmware-to-proxmox-readiness`
- `/demo/replay`

The links are intentionally secondary. The main conversion paths remain sample report, demo, pricing, technical review and sign-up.

## Regeneration Workflow

1. Update copy or layout in `scripts/generate-marketing-pdfs.mjs`.
2. Run `npm run marketing-pdfs:generate`.
3. Run `npx vitest run tests/unit/marketingPdfAssets.test.ts`.
4. Run normal validation for the hito.
5. Inspect rendered PDF pages before committing.

## Production Notes

These assets are static public files. They do not require:

- Database changes.
- Vercel configuration changes.
- R2 changes.
- Stripe changes.
- Webhook changes.
- Production secrets.
