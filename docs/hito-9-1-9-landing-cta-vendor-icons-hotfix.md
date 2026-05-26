# HITO 9.1.9 - Landing CTA & Vendor Icons Hotfix

## Objetivo

Recover the public landing CTA to ShiftReadiness and fix broken VMware/Proxmox visual assets in the local Next.js app.

## Contexto

Production still does not serve the real Next.js app:

- `https://shiftevidence.com/` returns static Hostinger/LiteSpeed HTML.
- `https://shiftevidence.com/shiftreadiness` returns Hostinger `404`.
- `https://shiftevidence.com/sign-in` returns Hostinger `404`.
- No production `/_next/` assets are visible.

This hito is local-only and does not solve Hostinger deployment.

## Problemas detectados

1. The landing CTA existed in source but was still too easy to miss because it appeared after the hero in a long public page.
2. VMware and Proxmox SVG imports were rendered directly as React values in `<img src>` and SVG `<image href>`.
3. In Next.js, imported SVG assets can resolve to an object with a `src` property. Passing that object directly produced `src="[object Object]"` or `href="[object Object]"`, breaking vendor icons.

## Alcance

- Move the existing ShiftReadiness promo card above the hero so it is visible near the top of `/`.
- Add a small `assetSrc` helper to resolve imported image assets to URL strings.
- Use that helper across public landing components that render VMware/Proxmox icons.
- Validate local routes and HTML.
- Re-check production as read-only evidence.

## Fuera de alcance

- No Hostinger changes.
- No deploy.
- No Prisma migrations.
- No database changes.
- No auth internals.
- No storage, parser, PDF, report, unlock, or admin changes.
- No checkout or payment changes.
- No external logo downloads or hotlinks.

## Archivos modificados

- `src/lib/assetSrc.ts`
- `src/views/LandingPage.tsx`
- `src/components/Hero.tsx`
- `src/components/Features.tsx`
- `src/components/Process.tsx`
- `src/components/SavingsCalculator.tsx`

## Cambio aplicado

Added:

```ts
type ImportedAsset = string | { src: string };

export function assetSrc(asset: ImportedAsset): string {
  return typeof asset === "string" ? asset : asset.src;
}
```

Updated public landing components to use:

- `assetSrc(vmwareLogo)`
- `assetSrc(proxmoxLogo)`

The ShiftReadiness CTA remains:

- Label: `New product`
- Title: `ShiftReadiness`
- Description: `A technical readiness workspace for VMware -> Proxmox cost, risk and architecture decisions.`
- CTA: `Explore ShiftReadiness`
- href: `/shiftreadiness`

## Validaciones locales

- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK.
- `npm run start -- -p 3000`: OK.
- `/`: `200 OK`.
- `/shiftreadiness`: `200 OK`.
- `/sign-in`: `200 OK`.
- `/dashboard`: `307` redirect to `/sign-in`, expected without session.

HTML checks:

- Home contains `New product`.
- Home contains `ShiftReadiness`.
- Home contains the expected description.
- Home contains `Explore ShiftReadiness`.
- Home contains `href="/shiftreadiness"`.
- Home no longer contains `[object Object]`.
- Home references Next static SVG assets:
  - `/_next/static/media/vmware...svg`
  - `/_next/static/media/proxmox...svg`

## Estado produccion

Production remains blocked by Hostinger static/runtime mismatch:

- `https://shiftevidence.com/`: `200 OK`, static Hostinger/LiteSpeed HTML.
- `https://shiftevidence.com/shiftreadiness`: `404 Not Found`.
- `https://shiftevidence.com/sign-in`: `404 Not Found`.

This hito did not touch production.

## Warnings conocidos

- `next build` still reports the known non-blocking Turbopack/NFT warning related to `reportStorageService.ts` through the report download route.

## Riesgos pendientes

- Production will not reflect this fix until Hostinger serves the real Next.js app.
- Hostinger still requires Application Root, Node runtime, env var, build log, and domain association verification.

## Proximo paso recomendado

Run Hostinger build diagnostics from the real Hostinger Application Root and fix the Node app/domain association before reattempting HITO 9.2.
