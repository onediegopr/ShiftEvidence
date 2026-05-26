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

1. The landing CTA existed in source but was still too easy to miss in the original long public page.
2. VMware and Proxmox SVG imports were rendered directly as React values in `<img src>` and SVG `<image href>`.
3. In Next.js, imported SVG assets can resolve to an object with a `src` property. Passing that object directly produced `src="[object Object]"` or `href="[object Object]"`, breaking vendor icons.

## Alcance

- Keep the existing ShiftReadiness promo card visible near the top of `/`, without hiding it in long lower sections.
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

## Reopen visual verification

The first closure was not sufficient because the user still could not see the ShiftReadiness CTA in the real local browser flow. The earlier validation proved the text existed in HTML, but it did not provide enough visual evidence that the CTA was actually visible above the fold.

Actions taken during reopen:

- Confirmed local Git remained on `main` with commit `62604d2` present and not pushed.
- Found an old `next start` process on port `3000`.
- Stopped the stale Node process.
- Removed `.next`.
- Ran a clean `npm run build`.
- Started a fresh production-like server with `npm run start -- -p 3000`.
- Rechecked `/`, `/shiftreadiness`, `/sign-in`, and `/dashboard`.
- Saved the served home HTML for inspection.
- Captured a local browser screenshot for visual verification.

Result:

- At reopen time, the CTA was made visible immediately below the top navigation and above the main hero.
- The block shows `New product`, `ShiftReadiness`, the readiness workspace description, and `Explore ShiftReadiness`.
- The CTA uses `href="/shiftreadiness"`.
- The block does not depend on animation, client state, `document`, `window`, or `useEffect`.
- The CTA is not inside a hidden, `sr-only`, `opacity-0`, or invisible container.
- In the served HTML, `New product` appears before the main hero title, confirming the CTA is positioned before the hero content.
- VMware and Proxmox assets resolve to Next static SVG URLs.
- `[object Object]` is absent from the served home HTML.

Why the false OK happened:

- The source fix was valid, but the local browser check was affected by stale runtime/cache risk and lacked explicit visual evidence.
- `curl` and HTML string checks alone were not enough to close a visual regression.
- Future visual hotfixes must include a clean server restart plus browser or screenshot verification.

Production remains separate:

- This reopen did not touch Hostinger.
- `https://shiftevidence.com/shiftreadiness` remains a Hostinger/static routing issue until the domain serves the real Next.js Node app.

## Micro-hotfix CTA position

After visual review, the CTA position directly below the navbar was considered too invasive because it appeared before the primary landing hero message. The CTA was moved from above the hero to immediately after the main hero and before the longer credibility/methodology sections.

Current placement:

- The main hero remains first after the navigation.
- The ShiftReadiness CTA appears immediately after the hero.
- The CTA is still near the beginning of the page and visible without being buried in long sections.
- The required copy remains unchanged: `New product`, `ShiftReadiness`, the VMware to Proxmox readiness description, and `Explore ShiftReadiness`.
- The CTA still points to `/shiftreadiness`.
- VMware and Proxmox icon fixes remain in place.
- Production was not touched; Hostinger remains a separate static/runtime issue.

## Riesgos pendientes

- Production will not reflect this fix until Hostinger serves the real Next.js app.
- Hostinger still requires Application Root, Node runtime, env var, build log, and domain association verification.

## Proximo paso recomendado

Run Hostinger build diagnostics from the real Hostinger Application Root and fix the Node app/domain association before reattempting HITO 9.2.
