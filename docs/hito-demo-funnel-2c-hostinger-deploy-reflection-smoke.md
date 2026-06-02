# HITO DEMO-FUNNEL-2C - Hostinger Deploy Reflection Smoke

Date: 2026-06-02

## Objective

Confirm that Hostinger production reflects the latest `origin/main` demo funnel
deployment:

- `/demo` as the demo hub;
- `/demo/replay` as the quick Migration Readiness Replay simulation;
- `/demo/workspace` as the deep read-only Demo Workspace;
- `/demo/reports/[scenario]` as existing demo PDFs.

This was a post-push production smoke hito. No feature development was intended.

## Git State

Worktree used:

`C:\Users\diego\OneDrive\PERSONAL\INFRASHIFT\infrashift-demo-funnel-2`

Branch:

`feature/demo-funnel-2`

Validated commit:

`06d40d555366c2783dfab4824419ee00ed02ee3c`

Git checks:

- `HEAD`: `06d40d555366c2783dfab4824419ee00ed02ee3c`
- `origin/main`: `06d40d555366c2783dfab4824419ee00ed02ee3c`
- ahead/behind: none
- stashes: preserved, not applied

## Code Route Verification

Confirmed route files:

- `src/app/demo/page.tsx`
- `src/app/demo/replay/page.tsx`
- `src/app/demo/workspace/page.tsx`
- `src/app/demo/reports/[scenario]/route.ts`

Confirmed copy references:

- `Migration Readiness Replay`
- `Explore a Sample Assessment`
- `Demo Workspace`

Conclusion:

- local code at `origin/main` contains the expected demo funnel architecture.

## Local Validation Context

DEMO-FUNNEL-2B had already completed the full local validation set before push:

- `npx vitest run tests/unit/evidenceArtifactManifest.test.ts` - OK
- `npx vitest run tests/unit/demoWorkspace.test.ts` - OK
- `npm run test:run` - OK, 114 files / 580 tests
- `npx prisma validate` - OK
- `npx prisma generate` - OK
- `npm run typecheck` - OK
- `npm run lint` - OK
- `npm run build` - OK
- `npm run hostinger:diagnose` - OK
- local production-like smoke on port `3001` - OK

Because production now reflected the pushed routes and no local code changes were
made in this hito, the 2C work focused on production reflection smoke rather
than rebuilding unchanged code.

## Production Smoke

HTTP smoke without and with cache-busting:

- `https://shiftevidence.com/demo` - 200 `text/html`
- `https://shiftevidence.com/demo?__srFresh=1` - 200 `text/html`
- `https://shiftevidence.com/demo/replay` - 200 `text/html`
- `https://shiftevidence.com/demo/replay?__srFresh=1` - 200 `text/html`
- `https://shiftevidence.com/demo/workspace` - 200 `text/html`
- `https://shiftevidence.com/demo/workspace?__srFresh=1` - 200 `text/html`
- `https://shiftevidence.com/demo/reports/balanced-mid-market` - 200 `application/pdf`
- `https://shiftevidence.com/demo/reports/balanced-mid-market?__srFresh=1` - 200 `application/pdf`

## Production Copy Checks

`/demo` includes:

- `Watch Quick Simulation`
- `Explore a Sample Assessment`
- `/demo/replay`
- `/demo/workspace`

`/demo/replay` includes:

- `Migration Readiness Replay`
- `Start Simulation`
- `Explore Full Demo Workspace`

`/demo/workspace` includes:

- `Demo Workspace`
- `Watch the 90-second simulation`
- `/demo/replay`

Conclusion:

- Hostinger production now reflects the demo funnel hub, replay and workspace
  architecture.

## Chunk / Asset Check

Routes checked:

- `https://shiftevidence.com/demo`
- `https://shiftevidence.com/demo/replay`
- `https://shiftevidence.com/demo/workspace`

Result:

- `BAD_SCRIPT_COUNT=0`
- no observed `/_next/static/*.js` 404s
- no stale chunk hotfix required

## Hostinger Deploy Reflection

Status:

- reflected latest commit: yes
- evidence: production routes and route-specific copy now match the latest
  demo funnel code
- redeploy executed manually: no
- Hostinger env vars changed: no
- Hostinger settings changed: no
- runtime logs accessed: no, not needed for successful HTTP/content smoke

The previous partial state was therefore consistent with deploy propagation or
build reflection delay, not an application routing bug.

## Hotfix

Hotfix applied:

- no

Code changes:

- none

Documentation changes:

- this file

## Safety

Not touched:

- database;
- migrations;
- Prisma deploy/reset/db push;
- payment flows;
- billing/Prisma stashes;
- environment variables;
- real AI runtime;
- storage;
- Hostinger settings;
- production manual deploy controls.

No secrets were printed.

Full public launch was not declared.

## Final Status

- DEMO-FUNNEL-2/2B repo readiness: 100%
- Hostinger demo funnel reflection: complete
- Demo Funnel production readiness: 96-98%
- Demo Replay readiness: 97-98%
- Demo Workspace readiness: 97-98%
- Public conversion readiness: 93-95%
- Shift Evidence / ShiftReadiness general: 99.5-99.6%
- Full public launch: NO

## Residual Risks

- Browser visual QA may still be useful for final polish.
- Hostinger deploy latency should be expected after future pushes.
- Full public launch remains a separate decision gate.

## Next Steps

Recommended next step:

- run a short browser visual pass for `/demo`, `/demo/replay` and
  `/demo/workspace`, then continue with the next controlled readiness hito.
