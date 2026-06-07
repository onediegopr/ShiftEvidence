# Marketing PDF Canonical Assets

## Status

MARKETING-PDF-3 canonicalizes the public marketing brochure PDFs.

The approved light, print-first editorial PDF family is now exposed through clean public filenames without version suffixes.

## Final Public Filenames

- `public/marketing/shift-evidence-product-brief.pdf`
- `public/marketing/shift-evidence-product-brochure.pdf`
- `public/marketing/migration-blueprint-overview.pdf`

## Final Public URLs

- `/marketing/shift-evidence-product-brief.pdf`
- `/marketing/shift-evidence-product-brochure.pdf`
- `/marketing/migration-blueprint-overview.pdf`

## Removed Obsolete Public Filenames

The following versioned marketing brochure files were removed from active public output:

- `public/marketing/shift-evidence-product-brief-v1.pdf`
- `public/marketing/shift-evidence-product-brief-v2.pdf`
- `public/marketing/shift-evidence-product-brochure-v1.pdf`
- `public/marketing/shift-evidence-product-brochure-v2.pdf`
- `public/marketing/migration-blueprint-overview-v1.pdf`
- `public/marketing/migration-blueprint-overview-v2.pdf`

Git history preserves those versions if a rollback or comparison is needed.

## Link Updates

Canonical URLs are used by the public soft CTA placements:

- `/sample-report`
- `/pricing`
- `/vmware-to-proxmox-readiness`
- `/demo/replay`

Docs and usage snippets now use canonical URLs only for current marketing distribution.

## Why Version Suffixes Were Removed

Version suffixes were useful during redesign QA, but they are noisy for owner sharing, email follow-up and public linking.

Clean filenames make the public URLs stable while Git history preserves the historical assets.

## Regeneration Workflow

Run:

```bash
npm run marketing-pdfs:generate
```

The generator writes the current approved assets directly to the canonical filenames in `public/marketing`.

## Rollback Plan

If a rollback is required:

1. Restore the previous PDFs from Git history.
2. Restore any previous public links if needed.
3. Run `npx vitest run tests/unit/marketingPdfAssets.test.ts`.
4. Run the normal app validation suite before publishing.

## Safety Confirmation

This cleanup only applies to marketing brochure PDFs under `public/marketing`.

It does not remove:

- `public/sample-reports/*`
- Premium sample reports
- Demo report PDFs
- Generated report assets outside the marketing brochure family
