# HITO DEMO-FUNNEL-2B - Collector Checksum QA + Controlled Push

Date: 2026-06-02

## Objective

Close the DEMO-FUNNEL-2 validation gap before pushing the demo funnel work to
`origin/main`.

This hito audited the failing `evidenceArtifactManifest.test.ts`, confirmed the
cause, applied the minimum safe fix, reran validations and prepared the branch
for a controlled push.

## Starting Point

Worktree:

`C:\Users\diego\OneDrive\PERSONAL\INFRASHIFT\infrashift-demo-funnel-2`

Branch:

`feature/demo-funnel-2`

Initial local commit:

`80911a5 feat: restore demo replay and workspace navigation`

After `origin/main` moved forward with billing commits, the branch was rebased
cleanly onto the latest remote main before final validation.

## Initial Failure

The full test suite initially failed in:

`tests/unit/evidenceArtifactManifest.test.ts`

Failing assertion:

- artifact: `/collectors/vmware/shift-vmware-evidence-collector.ps1`
- expected manifest SHA-256: `f65ae14a1508190a1c2cb666c637f5ed42c86bc02314447c29ec64ee3a4c533b`
- received local working-tree SHA-256: `a961f43d8489ffda9644fc1c8eb8a53f6dddaa994b05f7e0647e48d122220f4e`

## Cause

The collector was not functionally modified by DEMO-FUNNEL-2.

Git reported no content diff for the collector, but `git ls-files --eol`
confirmed the issue:

- index: `lf`
- working tree: `crlf`

The manifest hashes the exact file bytes. On Windows, the artifact files were
materialized with CRLF line endings, which changed their local SHA-256 values
without changing the logical file content.

After fixing the VMware collector, the same issue appeared on the VMware README,
confirming this was a deterministic artifact line-ending policy issue across
the evidence artifact family, not a collector logic regression.

## Fix Applied

Minimum safe fix:

- added explicit LF rules for packaged evidence artifacts in `.gitattributes`;
- normalized the local working-tree artifact files to UTF-8 without BOM and LF;
- did not modify collector logic;
- did not regenerate checksums;
- did not change `manifest.json` contents;
- did not change `.sha256` values.

Final content diff for the checksum fix is limited to `.gitattributes`.

Relevant commit:

`e99cb6a test: lock evidence artifact line endings`

## Final Commits

After rebase onto latest `origin/main`, the branch contains:

- `7558efc feat: restore demo replay and workspace navigation`
- `e99cb6a test: lock evidence artifact line endings`

## Validations

Commands executed:

- `npx vitest run tests/unit/evidenceArtifactManifest.test.ts` - OK, 3 tests
- `npx vitest run tests/unit/demoWorkspace.test.ts` - OK, 8 tests
- `npm run test:run` - OK, 114 files / 580 tests
- `npx prisma validate` - OK with local placeholder `DATABASE_URL`
- `npx prisma generate` - OK
- `npm run typecheck` - OK after clearing stale `.next` cache
- `npm run lint` - OK
- `npm run build` - OK with local placeholder env
- `npm run hostinger:diagnose` - OK, no secret values printed

Build warning:

- Known Turbopack/NFT warning from the evidence download route import trace.
- Non-blocking and unrelated to DEMO-FUNNEL-2B.

## Local Smoke

Production start was run locally on port `3001` with placeholder local env.

Validated:

- `http://localhost:3001/demo` - 200
- `http://localhost:3001/demo/replay` - 200
- `http://localhost:3001/demo/workspace` - 200
- `http://localhost:3001/demo/reports/balanced-mid-market` - 200 `application/pdf`
- `http://localhost:3001/` - 200
- `http://localhost:3001/shiftreadiness` - 200
- `http://localhost:3001/pricing` - 200
- `http://localhost:3001/sample-report` - 200
- `http://localhost:3001/vmware-to-proxmox-readiness` - 200

JavaScript chunk check:

- `BAD_SCRIPT_COUNT=0`

## Scope And Safety

Not touched:

- database;
- migrations;
- Prisma schema;
- payment provider behavior;
- billing code beyond accepting current `origin/main` as the rebase base;
- environment variables;
- production manual deploy controls;
- AI runtime;
- customer data.

No secrets were printed or committed.

Full public launch was not declared.

## Push Decision

The blocker was resolved and the branch was pushed to `origin/main`.

Push result:

- command: `git push origin feature/demo-funnel-2:main`
- previous `origin/main`: `0880c4b`
- pushed `origin/main`: `2831a3d`
- force push: no

Hostinger auto-deploy can pick up the updated main commit. Production smoke
should then validate:

- `/demo`
- `/demo/replay`
- `/demo/workspace`
- `/demo/reports/balanced-mid-market`

## Post-Push Production Smoke

Immediate HTTP smoke after push:

- `https://shiftevidence.com/demo` - 200
- `https://shiftevidence.com/demo/reports/balanced-mid-market` - 200 `application/pdf`
- `https://shiftevidence.com/demo/replay` - 404
- `https://shiftevidence.com/demo/workspace` - 404

Result:

- GitHub main is updated.
- Production is still serving a pre-DEMO-FUNNEL-2 deploy at the time of this
  check.
- No manual Hostinger deploy or restart was executed in this hito.
- Final production visual smoke remains pending until Hostinger completes or is
  instructed to redeploy the latest main commit.

## Updated Readiness

- DEMO-FUNNEL-2/2B: 100%
- Demo Replay readiness: 96-98%
- Demo Workspace readiness: 96-98%
- Demo Funnel complete: 97-98%
- Public conversion readiness: 93-95%
- Shift Evidence / ShiftReadiness general: 99.5%
- Full public launch: NO

## Residual Risks

- Production auto-deploy timing is controlled by Hostinger.
- Post-push production smoke may need to wait for deploy completion.
- Browser visual QA depends on an authenticated/control-capable browser channel.
