# HITO STORAGE-RELEASE-APPLY-2 - Controlled Storage/Ceph Migration Apply

Date: 2026-05-30

## Objective

Apply the pending Storage/Ceph migrations in the target production environment while explicitly accepting that `/dashboard/admin` is currently in safe fallback, provided the core product remains healthy.

## Final Status

Status: blocked before migration.

No migration was applied because the required preconditions were not satisfied from this Codex runtime:

- Backup/PITR was not confirmed with timestamp.
- No verified production shell/channel with productive `DATABASE_URL` was available.
- The current local runtime did not prove it was the Hostinger production runtime.
- `NODE_ENV=production npm run deploy:check` reported localhost URLs and a non-production storage root condition.
- Chrome/Hostinger authenticated control remains unavailable from Codex due the Chrome Native Messaging Host registry issue recorded in the prior hito.

## Operational Decision

Admin partial/fallback acceptance: yes, as an operational decision for the future apply.

Reason:

- User/Claude-attested production state says public routes are OK.
- Login, dashboard, assessment list, and assessment detail are OK.
- `/dashboard/admin/pricing` is OK.
- `/dashboard/admin` is in safe fallback and does not crash.
- `ERROR 3639664386` is absent.
- Storage missing-table warnings are expected until Storage migrations are applied.

This acceptance does not override the migration prerequisites. Backup/PITR and a verified production execution channel are still required before `prisma migrate status` or `prisma migrate deploy`.

## Git Preflight

- Branch: `main`.
- Local HEAD at start: `5484565 docs: confirm admin assessment recovery after Prisma query hotfix`.
- `origin/main`: synchronized with local HEAD at `5484565`.
- Working tree before documentation: clean.
- Divergence: none.
- Stash preserved: `stash@{0}: On main: park beta invite docs before functional readiness`.

## Backup / PITR

- Backup confirmed: no.
- Timestamp: not available.
- Restore path known: no.
- Provider DB: not confirmed from Codex in this hito.
- User/responsible confirmation: not provided in this hito.

Decision: stop before migration.

## Runtime / Environment Validation

Current process safe checks:

- `DATABASE_URL`: absent in the current process.
- `HOSTINGER_API_TOKEN`: absent in the current process.
- `NEXT_PUBLIC_APP_URL`: absent in the current process.
- `BETTER_AUTH_URL`: absent in the current process.
- `HOSTINGER_STORAGE_ROOT`: absent in the current process.

`NODE_ENV=production npm run deploy:check` result:

- Required variables were detected by the script from the local runtime context.
- The check failed because production URLs must not point to localhost.
- The check warned that production `HOSTINGER_STORAGE_ROOT` should be an absolute persistent path.
- No secret values were printed.

Conclusion: this runtime is not a verified production execution channel.

## Migration Files

Expected migration directories exist locally:

- `20260530120000_storage_1_destination_readiness_foundation`.
- `20260530133000_storage_2_analysis_fallback_statuses`.

The inspected SQL remains additive:

- Creates Storage/Ceph-related enums.
- Creates optional Storage/Ceph tables.
- Creates indexes.
- Adds foreign keys to existing assessment/evidence records.
- Adds fallback statuses to the Storage analysis enum.
- No drops.
- No renames.
- No truncates.
- No destructive data mutation.

## Migration Execution

- `npx prisma migrate status`: not executed.
- Reason: no confirmed production `DATABASE_URL` channel and no confirmed backup/PITR.
- `npx prisma migrate deploy`: not executed.
- Applied migrations: none.
- `prisma db push`: not executed.
- `prisma migrate reset`: not executed.
- Data deleted: no.
- Storage deleted: no.

## Smoke

No post-migration smoke was performed because no migration was applied.

Prior user/Claude-attested state before this attempt:

- Public routes: OK.
- Login: OK.
- `/dashboard`: OK.
- `/dashboard/assessments`: OK.
- Assessment detail: OK.
- Completion Center: visible.
- `/dashboard/admin`: safe fallback.
- `/dashboard/admin/pricing`: OK.
- Logs: Storage missing-table warnings captured.

## Admin

Admin partial state was accepted as a migration decision input, but not resolved in this hito.

Expected future classification after real migration:

- A: admin full if Storage warnings were the only remaining cause.
- B: admin safe fallback if another non-core admin query still fails.
- C: fail if a new server error appears.

If B occurs and core remains healthy, no automatic rollback should be performed; document and open a targeted admin hotfix.

## Safety Boundaries

- No production DB touched.
- No migration applied.
- No deploy/restart performed.
- No env vars changed.
- No pricing changed.
- No storage paths touched.
- No secrets printed.
- Full public launch not declared.

## Findings

- P0: none introduced.
- P1: migration blocked because backup/PITR was not confirmed and this runtime is not verified production.
- P2: admin remains in safe fallback by accepted operating decision.
- P2: Codex still lacks direct Chrome/Hostinger control due missing Native Messaging Host registry key.
- P3: local deploy check can load local env context, but it is not suitable for production migration execution.

## Required Next Step

Before rerunning this apply hito, provide or confirm all of the following without pasting secrets:

- Backup/PITR confirmed with timestamp.
- Restore path known.
- Execution channel is Hostinger/CI/shell with productive `DATABASE_URL`.
- `NODE_ENV=production npm run deploy:check` passes in that channel.
- `npx prisma migrate status` can be run in that channel.
- The only pending migrations are the two expected Storage migrations, or the DB is already up to date.

Only after those are true should `npx prisma migrate deploy` be executed.
