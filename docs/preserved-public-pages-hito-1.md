# Preserved Public Pages - Hito 1

## Public pages preserved
- Landing page at `/`
- Product page at `/shiftreadiness`

## What stayed intact
- The landing structure and section order.
- The commercial CTA into `/shiftreadiness`.
- The ShiftReadiness product page copy and pricing framing.
- The existing visual language and CSS system.

## What changed
- The project now renders those pages through Next.js App Router.
- Public page metadata now lives in the Next page wrappers.
- `/contact` was added as a lightweight public placeholder route.

## Files involved
- `src/pages/LandingPage.tsx`
- `src/pages/ShiftReadinessPage.tsx`
- `src/app/page.tsx`
- `src/app/shiftreadiness/page.tsx`
- `src/app/contact/page.tsx`

## Rollback recommendation
- If anything regresses, revert the `src/app` routes first and re-enable the previous Vite routing entry points.
- Keep `src/pages` and `src/components` as the visual source of truth.

## Regression risk
- Low for visual content.
- Medium for auth routes, because those depend on env vars and DB availability.

