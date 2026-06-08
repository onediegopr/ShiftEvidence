# GADS-LANDING-PROD-CUTOVER-1

## Objective

Replace the production `/vmware-to-proxmox-readiness` landing page with the approved Google Ads Landing V2 laboratory version.

## Owner Decision

The owner approved the lab version visually and requested production cutover while preserving the existing production URL.

## What Was Replaced

The previous `/vmware-to-proxmox-readiness` implementation was replaced with the Google Ads Landing V2 component.

The production page now renders:

- `src/components/googleAdsLanding/GoogleAdsLandingV2.tsx`

The production route remains:

- `/vmware-to-proxmox-readiness`

## Laboratory Route

The former lab route now redirects to the production landing:

- `/laboratorio/google-ads-landing-v2` -> `/vmware-to-proxmox-readiness`

This preserves any internal or review link that may still point to the lab while avoiding two divergent landing versions.

## Metadata / SEO Final

Production metadata:

- Title: `VMware to Proxmox Migration Readiness Assessment`
- Canonical: `https://shiftevidence.com/vmware-to-proxmox-readiness`
- Robots: `index, follow`

The page keeps the existing `Service` JSON-LD schema for Proxmox Migration Readiness.

## Final CTAs

Primary CTAs:

- Start Readiness Assessment: `/start`
- Watch 90-Second Demo: `/demo/replay`
- Download Sample Report: `/sample-report`

Supporting CTAs:

- Demo Workspace: `/demo/workspace`
- Pricing plan CTAs: existing `marketingPlans` routes

## Routes Touched

- `/vmware-to-proxmox-readiness`
- `/laboratorio/google-ads-landing-v2`

## Routes Not Touched

- `/`
- `/pricing`
- `/sample-report`
- `/demo/replay`
- `/start`
- billing routes
- checkout routes
- webhooks
- admin billing
- dashboard routes
- API routes

## Rollback

Rollback options:

- Revert the cutover commit to restore the previous production landing implementation.
- Keep the Google Ads Landing V2 component in place and re-point `/vmware-to-proxmox-readiness` to the previous page implementation if a softer rollback is preferred.

## Risks / Pending Review

- Final visual QA should be confirmed on desktop and mobile after cutover.
- Conversion tracking was not changed.
- Pricing amounts and billing behavior were not changed.
- The lab route redirects to production, so side-by-side review now requires reverting or checking the prior commit.

## Validations

Executed for this cutover:

- `git diff --check`: passed
- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run test:run`: passed, 127/127 files and 646/646 tests
- `npm run build`: passed
- local smoke for `/vmware-to-proxmox-readiness`: 200, `index, follow`, canonical OK, V2 content present
- local smoke for `/laboratorio/google-ads-landing-v2`: 307 redirect to `/vmware-to-proxmox-readiness`
- local smoke for `/`, `/pricing`, `/sample-report`, `/demo/replay`: 200
- local smoke for `/start`: 307 redirect to `/sign-up`
