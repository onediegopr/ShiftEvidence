# MARKETING-PDF-1 Hito Record

## Status

Implemented and locally validated for MARKETING-PDF-1. The first full-repo validation attempt was temporarily blocked by methodology work in progress; the final rerun passed after the methodology state was resolved into the current local commit history.

## Generated Assets

- `public/marketing/shift-evidence-product-brief-v1.pdf`
- `public/marketing/shift-evidence-product-brochure-v1.pdf`
- `public/marketing/migration-blueprint-overview-v1.pdf`

Note: these were the original MARKETING-PDF-1 filenames. MARKETING-PDF-3 removed versioned marketing brochure filenames from active public output and replaced them with canonical filenames under `public/marketing`. Git history preserves the original files if comparison or rollback is needed.

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
- Initial `npm run typecheck`: temporarily failed on methodology work in progress in `src/server/methodology/registry.ts` and `src/server/methodology/service.ts`.
- Initial `npm run test:run`: temporarily failed on methodology tests: `methodologyKbFoundation.test.ts` and `methodologyExtractionExpansion.test.ts`.
- Initial `npm run build`: temporarily failed during TypeScript check on methodology work in progress.
- Final `npm run typecheck`: passed.
- Final `npm run test:run`: passed, 127 test files / 646 tests.
- Final `npm run build`: passed.
- Local route smoke on `http://127.0.0.1:3000`: passed for all three marketing PDFs and linked public pages.

## Production Safety

No production systems, payment systems, DNS, Vercel, Hostinger, Neon, R2, Stripe, Wise, webhooks, billing secrets or customer data are required for this hito.
