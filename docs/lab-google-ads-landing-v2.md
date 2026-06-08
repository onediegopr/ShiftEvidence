# LAB-GADS-LANDING-V2

## Objective

Create a laboratory version of the VMware to Proxmox readiness landing page for Google Ads search traffic review, without replacing the production landing page.

Primary lab route:

- `/laboratorio/google-ads-landing-v2`

Production route preserved:

- `/vmware-to-proxmox-readiness`

## Audit Summary

Reviewed:

- `/vmware-to-proxmox-readiness`
- `/`
- `/demo`
- `/demo/replay`
- `/demo/workspace`
- `/sample-report`
- `/pricing`
- existing lab and preview components
- current CTA routes
- current pricing plan data
- current SEO metadata and noindex patterns
- existing Google Ads planning docs under `docs/google-ads-shift-evidence-launch-pack.md`

Findings:

- The production landing already has safe product truth, SEO metadata and current product positioning.
- The strongest visual patterns are in the current hero, demo replay, demo workspace, sample report, pricing page and landing structure lab.
- Google Ads traffic needs faster commercial clarity, stronger above-the-fold CTAs, clearer output previews and objection handling.
- Existing CTAs are usable: `/start`, `/demo/replay`, `/sample-report`, `/pricing`, plan CTA routes and support/technical review routes.
- Existing pricing data can be reused from `marketingPlans` without changing prices or billing logic.
- Lab pages should remain `noindex, nofollow`.

## What Was Implemented

Created a new lab landing experience for hot search traffic around:

- VMware to Proxmox migration
- ESXi to Proxmox migration
- Proxmox migration assessment
- VMware alternative after Broadcom
- leaving VMware
- VMware exit strategy
- MSP and Proxmox consultant intent

Implemented sections:

- Commercial hero
- Output preview
- Visual proof links
- Pain section
- VMware/Broadcom evaluation drivers
- Three-step process
- Before / After
- Pricing preview
- Security / trust
- Who it is for
- Commercial FAQ
- Final CTA

Also updated `tests/unit/demoWorkspace.test.ts` to align stale expectations with the current published replay route and current homepage hero CTAs.

## CTAs Used

- Start Readiness Assessment: `/start`
- Watch 90-Second Demo: `/demo/replay`
- Download Sample Report: `/sample-report`
- Demo Workspace preview: `/demo/workspace`
- Pricing and plan CTAs: existing plan CTA routes from `marketingPlans`

## Routes Touched

- `/laboratorio/google-ads-landing-v2`

## Routes Not Touched

- `/vmware-to-proxmox-readiness`
- `/`
- `/demo`
- `/demo/replay`
- `/demo/workspace`
- `/sample-report`
- `/pricing`
- billing routes
- checkout routes
- dashboard routes
- admin routes
- API routes

## Product Safety

The lab copy preserves:

- readiness assessment, not migration execution
- evidence-based review, not magic AI
- no agents for base workflow
- no mandatory credentials
- no production access required
- no zero downtime guarantee
- no guaranteed migration outcome
- no claim that it replaces all consulting

## Risks

- The lab is stronger commercially, but it needs visual review before replacing the production landing.
- Pricing CTAs reuse current plan CTA routes; confirm desired Google Ads CTA behavior before publishing.
- The page uses synthetic visual cards rather than new screenshots, because no new screenshot assets were generated in this hito.
- Conversion tracking and analytics were not touched.

## Pending Before Publishing

- Browser QA at desktop and mobile sizes.
- Compare copy density against Google Ads Quality Score expectations.
- Decide whether plan CTAs should point to `/pricing`, `/start`, or current billing/invoice routes.
- Add real product screenshots if desired.
- Confirm final route swap strategy for `/vmware-to-proxmox-readiness`.
- Re-run full validations after any production landing replacement.

## Validations

Executed:

- `git diff --check`: passed
- `npm run typecheck`: passed
- `npm run lint`: passed
- `npx vitest run tests/unit/demoWorkspace.test.ts`: passed, 10/10
- `npm run test:run`: passed, 127/127 files and 646/646 tests
- `npm run build`: passed
- local route smoke for `/laboratorio/google-ads-landing-v2`: passed, 200, `noindex, nofollow`
- local route smoke for `/vmware-to-proxmox-readiness`: passed, 200
- local route smoke for `/`: passed, 200
- local route smoke for `/demo/replay`: passed, 200
- local route smoke for `/sample-report`: passed, 200
- local route smoke for `/pricing`: passed, 200

Browser MCP note:

- The embedded Browser tool returned `Transport closed`, so visual browser automation could not be completed in this run.
- HTTP route smoke, typecheck, lint, tests and build passed.

## Progress

- LAB-GADS-LANDING-V2: 95%
- Google Ads landing design: 92%
- Commercial readiness: 88%
- Production publishing readiness: 0%, intentionally not published
