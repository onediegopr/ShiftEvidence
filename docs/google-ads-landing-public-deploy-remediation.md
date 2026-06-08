# GADS-LANDING-PUBLIC-DEPLOY-REMEDIATE-1

## Date

2026-06-08

## Objective

Deploy the Google Ads Landing V2 cutover to the public Vercel project that owns `https://www.shiftevidence.com`.

## Root Cause

The code was correct in Git and passed local production smoke, but public production still served the previous landing because:

- `origin/main` contained the cutover commit `6c84b7a`.
- Local production build rendered Google Ads Landing V2 correctly.
- `vercel.json` disables automatic deployments from `main`.
- The local workspace was linked to Vercel project `infrashift-r2-recovery`.
- The public domains `www.shiftevidence.com` and `shiftevidence.com` are assigned to Vercel project `shiftevidence`.
- No Vercel deployment existed for commit `6c84b7a` before remediation.

## Vercel Project Used

- Project: `shiftevidence`
- Owner: `shift-evidence`
- Project ID: `prj_vPebqKyHjmKQgoyvRpugXS6aulpP`
- Public domains:
  - `https://www.shiftevidence.com`
  - `https://shiftevidence.com`

The deploy used `--project shiftevidence`, so the local workspace link was not changed.

## Deploy Executed

Command shape:

- `vercel deploy --prod --project shiftevidence --yes`

Deployment:

- ID: `dpl_9ChimPsLsCwwoVtBMuSYgZyoLFH5`
- URL: `https://shiftevidence-k3dq8y1rs-shift-evidence.vercel.app`
- Target: `production`
- Status: `Ready`
- Created: `Mon Jun 08 2026 09:27:33 -0300`
- Aliases:
  - `https://www.shiftevidence.com`
  - `https://shiftevidence.com`
  - `https://infra-evidence.vercel.app`
  - `https://shiftevidence-shift-evidence.vercel.app`
  - `https://shiftevidence-diegoperezroca-4286-shift-evidence.vercel.app`

The deployment included:

- `6c84b7a fix: publish Google Ads landing V2`
- `9f96d5b docs: record Google Ads landing deploy diagnosis`

## Public Smoke

`https://www.shiftevidence.com/vmware-to-proxmox-readiness`

- Status: `200`
- V2 content present: yes
- Previous landing copy present: no
- `Assessment cockpit` present: yes
- `Assessment scope` present: no
- `noindex`: no
- Robots: `index, follow`
- Canonical: `https://shiftevidence.com/vmware-to-proxmox-readiness`
- CTA `/start`: present
- CTA `/demo/replay`: present
- CTA `/sample-report`: present
- CTA `/pricing`: present

`https://shiftevidence.com/vmware-to-proxmox-readiness`

- Status: `308`
- Redirects to: `https://www.shiftevidence.com/vmware-to-proxmox-readiness`

`https://www.shiftevidence.com/laboratorio/google-ads-landing-v2`

- Status: `307`
- Redirects to: `/vmware-to-proxmox-readiness`
- Robots on redirect shell: `noindex, nofollow`

Additional route smoke:

- `/`: `200`
- `/pricing`: `200`
- `/sample-report`: `200`
- `/demo/replay`: `200`
- `/start`: `307` redirect to `/sign-up`

## QA Visual / Responsive

Browser QA was performed against:

- `https://www.shiftevidence.com/vmware-to-proxmox-readiness`

Desktop viewport:

- V2 hero present
- old hero absent
- `Assessment cockpit` present
- output cards present
- pricing preview present
- FAQ present
- CTAs present
- no horizontal overflow detected

Mobile viewport `390x844`:

- V2 hero present
- old hero absent
- `Assessment cockpit` present
- output cards present
- pricing preview present
- FAQ present
- CTAs present
- `scrollWidth` matched `clientWidth`
- no horizontal overflow detected

Screenshot capture timed out in the embedded browser, but DOM and layout checks completed.

## What Was Not Touched

- DNS
- Hostinger settings
- Vercel project settings
- environment variables / secrets
- Stripe / Wise / payments
- billing runtime
- DB
- Prisma migrations
- checkout
- webhooks
- entitlements
- admin billing
- pricing amounts
- rollback

Note: Vercel build executed `prisma generate` as part of the normal build script. No database migration or DB write was executed.

## Rollback Recommendation

If rollback becomes necessary, prefer a controlled Vercel rollback or promotion to the previous production deployment:

- previous public deployment: `https://shiftevidence-mx8hgfym8-shift-evidence.vercel.app`

Do not change DNS for rollback unless a separate domain incident requires it.

## Remaining Risks

- Automatic production deploys from `main` remain disabled by `vercel.json`.
- There are still two Vercel projects: `shiftevidence` and `infrashift-r2-recovery`.
- Future production deploys should explicitly target the public project or the project/domain relationship should be consolidated in a separate controlled hito.

## Conclusion

The public production route now serves Google Ads Landing V2 at:

- `https://www.shiftevidence.com/vmware-to-proxmox-readiness`

