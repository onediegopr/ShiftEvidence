# HITO 9.1.7 - Public Routing & Landing CTA Recovery

## Objetivo

Recover the minimum public routing signal inside the local Next.js app by making the ShiftReadiness CTA visible from the public home route `/`.

## Contexto

- Local Next.js is working:
  - `http://localhost:3000/` returns `200`.
  - `http://localhost:3000/shiftreadiness` returns `200`.
  - `http://localhost:3000/sign-in` returns `200`.
- Production is not serving the Next.js app yet:
  - `https://shiftevidence.com/` returns `200`, but serves static Hostinger/LiteSpeed HTML.
  - `https://shiftevidence.com/shiftreadiness` returns Hostinger `404`.
  - `https://shiftevidence.com/sign-in` returns Hostinger `404`.
  - No `/_next/` assets are visible in production HTML.

## Problema detectado

The landing page already had a ShiftReadiness promotional card in the source, but it appeared after several long sections. That made the product entry point too easy to miss from `/`.

## Alcance

- Move the existing ShiftReadiness card higher on the local landing page.
- Keep the CTA text and target route intact.
- Validate local public routes.
- Document that production is still blocked by the Hostinger static/Node runtime mismatch.

## Fuera de alcance

- No Hostinger changes.
- No deploy.
- No Prisma or database actions.
- No auth changes.
- No storage, parser, report, PDF or unlock changes.
- No pricing changes.
- No checkout changes.
- No public production launch declaration.

## Archivos modificados

- `src/views/LandingPage.tsx`
- `docs/hito-9-1-7-public-routing-landing-cta-recovery.md`
- `docs/hostinger-production-access-gate.md`
- `docs/hostinger-node-runtime-discovery.md`

## Cambio aplicado

Moved the existing ShiftReadiness promo card to immediately after the hero section.

Visible content:

- Label: `New product`
- Title: `ShiftReadiness`
- Description: `A technical readiness workspace for VMware -> Proxmox cost, risk and architecture decisions.`
- CTA: `Explore ShiftReadiness`
- Href: `/shiftreadiness`

No new dependencies were added. No new client boundary was added.

## Validaciones locales

Required validation:

- `/` should return `200`.
- `/shiftreadiness` should return `200`.
- `/sign-in` should return `200`.
- Home HTML should contain `New product`.
- Home HTML should contain `ShiftReadiness`.
- Home HTML should contain `Explore ShiftReadiness`.
- Home HTML should contain `href="/shiftreadiness"`.
- `npm run typecheck` should pass.
- `npm run lint` should pass.
- `npm run build` should pass if executed.

## Estado produccion

Production remains outside the scope of this hito.

Current known state:

- `https://shiftevidence.com/` serves static Hostinger/LiteSpeed HTML.
- `https://shiftevidence.com/shiftreadiness` returns Hostinger `404`.
- `https://shiftevidence.com/sign-in` returns Hostinger `404`.
- Production does not show `/_next/` assets.

This hito does not solve the production static/Node runtime mismatch.

## Riesgos pendientes

- Production still needs Hostinger Node.js runtime discovery and configuration.
- `shiftevidence.com` must be associated with the real Next.js app before HITO 9.2 can run.
- The public home CTA fix only affects the app once production serves the current Next.js build.

## Proximo paso recomendado

Complete Hostinger Node.js App discovery and connect `https://shiftevidence.com` to the real Next.js runtime before reattempting HITO 9.2.
