# MARKETING-PDF-2 Hito Record

## Status

Implemented locally. The v2 brochures are generated and ready for owner visual review.

## Redesign Goals

The goal was to move away from the original dark PDF direction and create a calmer, more printable, more premium editorial brochure family.

Primary goals:

- Light theme.
- Print-first readability.
- More whitespace.
- Cleaner hierarchy.
- More restrained color.
- Less visual noise.
- Better distinction between brochure and technical report.

## Generated Files

The v2 redesign was initially generated with versioned filenames during QA.

Current public distribution now uses canonical filenames:

- `public/marketing/shift-evidence-product-brief.pdf`
- `public/marketing/shift-evidence-product-brochure.pdf`
- `public/marketing/migration-blueprint-overview.pdf`

The earlier `v1` and `v2` public filenames were removed from active public output in MARKETING-PDF-3. Git history preserves them if comparison or rollback is needed.

## Page Counts

- Product Brief v2: 1 page.
- Product Brochure v2: 11 pages.
- Migration Blueprint Overview v2: 8 pages.

## What Changed From v1 To v2

- Dark full-page treatment replaced by light editorial pages.
- Heavy dark cards replaced by low-ink cards and subtle accents.
- Radar-heavy visual language reduced in favor of score bars, flow cards and comparison panels.
- More explicit print-first margins, hierarchy and page rhythm.
- CTAs remain soft and secondary.
- Pricing and safety claims remain aligned with product truth.

## Website Link Changes

Soft CTA placements now point to the canonical PDFs:

- `/sample-report`: product brochure.
- `/pricing`: product brochure and Blueprint overview.
- `/vmware-to-proxmox-readiness`: product brochure and Blueprint overview.
- `/demo/replay`: product brochure.

## Visual QA Findings

Visual render QA was performed with PNG renders.

Verdict:

- v2 is meaningfully lighter and more print-friendly than v1.
- Product Brief v2 works as a one-page owner-sendable PDF.
- Product Brochure v2 has an editorial rhythm and is no longer visually dominated by dark panels.
- Blueprint Overview v2 feels more like a consulting-grade planning overview and better supports the `From USD 3,500` positioning.

## Print-Friendliness Assessment

v2 uses a light paper background, charcoal text, subtle colored accents and low-ink panels. It should print more comfortably than v1 in grayscale or ordinary office print settings.

## Readability Assessment

v2 uses shorter paragraphs, more bullets, clear page labels, larger whitespace and simpler diagram patterns. The PDFs are designed to remain searchable/selectable through PDFKit text output.

## Claim Safety

The v2 copy preserves safe product boundaries:

- No guaranteed migration claim.
- No zero downtime promise.
- No automated migration execution claim.
- No complete dependency discovery claim.
- No verified backup claim without evidence.

## Remaining Gaps

- Owner visual review is still recommended before push/deploy.
- A future v3 may add QR codes, partner variants and Spanish-language versions.

## Recommendation

Safe for owner visual review. Push only after owner approval.
