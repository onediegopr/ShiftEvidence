# GADS-LANDING-PUBLIC-DEPLOY-DIAGNOSE-1

## Date

2026-06-08 09:20:23 -03:00

## Objective

Diagnose why `https://www.shiftevidence.com/vmware-to-proxmox-readiness` still serves the previous landing page even though `origin/main` contains:

- `6c84b7a fix: publish Google Ads landing V2`

## Git Baseline

- Branch: `main`
- Working tree: clean
- `HEAD`: `6c84b7a97abb119ab2d6305951c744a89f84ea2c`
- `origin/main`: `6c84b7a97abb119ab2d6305951c744a89f84ea2c`
- Latest commit: `6c84b7a fix: publish Google Ads landing V2`

## Local Build / Smoke

`npm run build` passed.

Local production smoke using `next start` on `127.0.0.1:3002`:

- `/vmware-to-proxmox-readiness`: `200`
- V2 content present: yes
- Previous landing copy present: no
- `Assessment cockpit` present: yes
- `robots`: `index, follow`
- canonical: `https://shiftevidence.com/vmware-to-proxmox-readiness`
- `/laboratorio/google-ads-landing-v2`: `307` redirect to `/vmware-to-proxmox-readiness`

Conclusion: the committed code builds and serves correctly locally.

## Public Production HTTP

`https://shiftevidence.com/vmware-to-proxmox-readiness`

- Status: `308`
- Location: `https://www.shiftevidence.com/vmware-to-proxmox-readiness`
- Server: `Vercel`

`https://www.shiftevidence.com/vmware-to-proxmox-readiness`

- Status: `200`
- Server: `Vercel`
- `X-Vercel-Cache`: `HIT`
- `X-Matched-Path`: `/vmware-to-proxmox-readiness`
- `Content-Length`: `73141`
- V2 content present: no
- Previous landing copy present: yes
- `Assessment scope` present: yes
- `Assessment cockpit` present: no
- `/start` CTA present: no
- `/sign-up` CTA present: yes
- canonical: `https://shiftevidence.com/vmware-to-proxmox-readiness`

`https://www.shiftevidence.com/laboratorio/google-ads-landing-v2`

- Status: `404`
- Server: `Vercel`
- `X-Vercel-Cache`: `HIT`
- `X-Matched-Path`: `/404`

Conclusion: the public domain is serving an older production artifact.

## DNS / Origin

DNS resolution:

- `shiftevidence.com`: `A 76.76.21.21`
- `www.shiftevidence.com`: `CNAME cname.vercel-dns.com`

Conclusion: both apex and `www` route to Vercel, not Hostinger.

## Vercel Findings

Local `.vercel/project.json` links this repo to:

- Project: `infrashift-r2-recovery`
- Project ID: `prj_PYbwfVjK9bZYi7AuPcV1frAl7PD3`

Recent deployments for `infrashift-r2-recovery`:

- Latest production deployment: `https://infrashift-r2-recovery-feg6pph5g-shift-evidence.vercel.app`
- Status: `Ready`
- Created: `Sun Jun 07 2026 12:29:46 -0300`
- Target: `production`
- No deployment found with `githubCommitSha=6c84b7a97abb119ab2d6305951c744a89f84ea2c`

Domain ownership in Vercel:

- `shiftevidence.com` is assigned to project `shiftevidence`
- Assigned domains: `www.shiftevidence.com`, `shiftevidence.com`

Recent deployments for project `shiftevidence`:

- Latest production deployment: `https://shiftevidence-mx8hgfym8-shift-evidence.vercel.app`
- Status: `Ready`
- Created: `Sun Jun 07 2026 12:32:49 -0300`
- Aliases include:
  - `https://www.shiftevidence.com`
  - `https://shiftevidence.com`

Project list:

- `shiftevidence`: latest production URL `https://www.shiftevidence.com`
- `infrashift-r2-recovery`: latest production URL `https://infrashift-r2-recovery.vercel.app`

## Deployment Trigger Finding

`vercel.json` contains:

```json
{
  "git": {
    "deploymentEnabled": {
      "main": false,
      "preview": true
    }
  }
}
```

This means pushes to `main` do not automatically trigger production deployments.

## Classification

Primary classification:

- A. Deploy de producción no se ejecutó

Contributing factors:

- `main` auto-deploy is disabled in `vercel.json`
- The public domain is assigned to Vercel project `shiftevidence`
- The local repo is linked to Vercel project `infrashift-r2-recovery`
- No deployment exists for commit `6c84b7a`

Not supported by evidence:

- B. Deploy se ejecutó pero falló
- C. Deploy READY pero dominio apunta a otro non-Vercel origin
- D. Cache/CDN alone is the root cause

Cache is visible, but cache is serving the latest public production artifact currently aliased to the domain, which is older than the cutover commit.

## Safe Remediation Options

Do not execute without owner approval:

1. Controlled production deployment to the actual public Vercel project `shiftevidence`.
2. Re-link or align the local workspace with the public Vercel project before deploying.
3. If `infrashift-r2-recovery` is intended to become production, move/assign domains only after a separate domain cutover hito.
4. If automatic deploys should resume, update `vercel.json` in a controlled hito to enable `main` deployment.

Recommended next hito:

- `GADS-LANDING-PUBLIC-DEPLOY-REMEDIATE-1`

Suggested scope:

- Decide whether production should deploy from project `shiftevidence` or `infrashift-r2-recovery`
- Perform a controlled deploy or promotion only after validating the chosen project and artifact
- Do not change DNS or domain assignment unless explicitly approved

## Safety

Not touched:

- Stripe / Wise / payments
- billing runtime
- DB
- Prisma migrations
- env vars / secrets
- DNS
- Hostinger settings
- Vercel settings
- checkout / webhooks / entitlements
- rollback

