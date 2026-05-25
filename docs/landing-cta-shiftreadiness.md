# Landing CTA ShiftReadiness

## CTA placement

The landing page now includes a minimal promo block near the end of the page, before the footer.

The block contains:

- eyebrow: `New product`
- title: `ShiftReadiness`
- text: `A technical readiness workspace for VMware -> Proxmox cost, risk and architecture decisions.`
- CTA: `Explore ShiftReadiness`
- link: `/shiftreadiness`

## Why this location

This placement preserves the existing landing page hierarchy.

It avoids changing the hero, navigation structure or the existing sections.

It adds a single commercial bridge into the new product page without turning the landing into the product page itself.

## Files modified

- `src/pages/LandingPage.tsx`
- `src/App.tsx`
- `src/pages/ShiftReadinessPage.tsx`
- `src/pages/PlaceholderPage.tsx`
- `src/index.css`
- `public/sitemap.xml`
- `public/llms.txt`

## How to revert

1. Remove the `ShiftReadiness` promo section from `src/pages/LandingPage.tsx`.
2. Remove the route handling for `/shiftreadiness`, `/sign-up` and `/contact` in `src/App.tsx`.
3. Delete `src/pages/ShiftReadinessPage.tsx` and `src/pages/PlaceholderPage.tsx`.
4. Remove the ShiftReadiness styles from `src/index.css`.
5. Remove the `/shiftreadiness` entry from `public/sitemap.xml`.
6. Remove the ShiftReadiness references from `public/llms.txt`.

## Landing preservation confirmation

The landing page was not redesigned.

The existing hero, core sections and footer structure remain in place.

The change is intentionally additive and limited to a single promo block.
