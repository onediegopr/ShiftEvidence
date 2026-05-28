# HITO Industry Evaluations Landing Section

Date: 2026-05-28.

## Objective

Add and maintain a public landing credibility section for ShiftReadiness:

- `What private assessments reveal`

The section presents representative private evaluation examples by industry and decision type. It does not disclose customer names, company brands, locations or identifiable infrastructure details, and it must not be interpreted as verified customer reviews.

## Public Copy Correction

COPY-FIX-1 corrected the public section from Spanish to English because the public marketing site is in English.

Admin and internal console copy remain out of scope and may continue to use Spanish where appropriate.

Latest public subtitle:

- `Infrastructure assessments often involve sensitive cost, risk, and environment data. These anonymized-style examples show the kinds of decisions ShiftReadiness helps structure, without company names or identifying details.`

## Location

Main file:

- `src/views/LandingPage.tsx`

Landing placement:

- After the public value/process sections.
- After `Process`.
- Before FAQ and the final CTA.
- Public anchor: `#industry-evaluations`.

Not modified by this section:

- `/demo`.
- `/sample-report`.
- dashboard/admin/auth/backend.
- pricing.
- parser.
- PDF/report generation.
- assessment flow.
- business logic.

## Evaluations Included

The section includes 4 compact cards:

- Manufacturing: renewal pressure, cost risk, pilot planning.
- Financial Services: evidence confidence, governance and production wave approval.
- Healthcare / Regulated Operations: continuity, criticality and validation.
- MSP / IT Services: client pipeline qualification and repeatable readiness workflow.

Each card opens a modal with:

- title;
- industry;
- scenario;
- key signals;
- readiness interpretation;
- evidence gaps;
- suggested next step;
- disclaimer.

## Privacy And Claim Safety

- No real logos are used.
- No real company names are used.
- No photos of people are used.
- The copy does not claim public testimonials.
- The copy does not claim verified customer reviews.
- The copy does not claim verified public case studies.
- The section does not publish named or verified customer identities.
- The examples are shown by industry with identifying details removed.
- No specific savings are promised.
- No zero-downtime or 100% success claims are made.
- No migration automation claim is made.
- No customer data or sensitive infrastructure data is included.

## UX/UI

- Compact cards in a responsive grid.
- 4 columns on desktop when width allows.
- 2x2 layout on intermediate widths.
- Vertical stack on mobile.
- CTA: `View evaluation`.
- Responsive modal with dark overlay.
- Modal closes by button, ESC and outside click.
- Cards are real buttons.
- Modal uses `role="dialog"` and `aria-modal="true"`.

## Files Modified

- `src/views/LandingPage.tsx`
- `src/index.css`
- `docs/hito-industry-evaluations-landing-section.md`

## Validation History

Initial implementation:

- `npm run lint`: OK.
- `npm run typecheck`: OK.
- `npm run build`: OK, with known non-blocking NFT warning.
- Local smoke: `/`, `/demo`, `/sample-report`, `/shiftreadiness` OK; `/dashboard` and `/dashboard/admin` redirect to `/sign-in`.
- Interactive QA: 4 cards detected; each card opens its modal; close by button, ESC and outside click validated.

COPY-FIX-1:

- Public section copy corrected to English.
- Modal copy corrected to English.
- Disclaimer corrected to English.
- Documentation corrected to English.

## Pending Risks

- HCDN may temporarily serve older cached HTML for `/` until cache is purged or expires.
- The section must not be presented as a verified customer testimonial or public case study.
