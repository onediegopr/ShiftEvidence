# MARKETING-PDF-1 Hito Record

## Status

Implemented and locally validated for MARKETING-PDF-1. Full repository typecheck/build are blocked by pre-existing methodology work outside this hito.

## Generated Assets

- `public/marketing/shift-evidence-product-brief-v1.pdf`
- `public/marketing/shift-evidence-product-brochure-v1.pdf`
- `public/marketing/migration-blueprint-overview-v1.pdf`

## Generator

- `scripts/generate-marketing-pdfs.mjs`
- `npm run marketing-pdfs:generate`

## Public Link Integration

Soft links were added to:

- `/sample-report`
- `/pricing`
- `/vmware-to-proxmox-readiness`
- `/demo/replay`

The links were kept secondary so they do not replace the main sample report, pricing, demo, technical review or sign-up paths.

## Content Safety

The PDFs avoid unsupported claims:

- No guaranteed migration claim.
- No zero downtime migration claim.
- No automated migration execution claim.
- No complete dependency discovery claim without evidence.
- No verified backup claim without backup evidence.

The copy explicitly states that Shift Evidence is a pre-flight assessment and planning system, not a migration execution tool.

## Validation Log

- `npm run marketing-pdfs:generate`: passed.
- PDF render QA with `pdftoppm`: passed after spacing polish.
- `npx vitest run tests/unit/marketingPdfAssets.test.ts`: passed.
- `git diff --check`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: failed on existing methodology changes in `src/server/methodology/registry.ts` and `src/server/methodology/service.ts`.
- `npm run test:run`: failed on existing methodology tests: `methodologyKbFoundation.test.ts` and `methodologyExtractionExpansion.test.ts`.
- `npm run build`: failed during TypeScript check on existing methodology change: missing `MethodologyRule` in `src/server/methodology/service.ts`.
- Local route smoke on `http://127.0.0.1:3000`: passed for all three marketing PDFs and linked public pages.

## Production Safety

No production systems, payment systems, DNS, Vercel, Hostinger, Neon, R2, Stripe, Wise, webhooks, billing secrets or customer data are required for this hito.
