# HITO PROD-HOTFIX-2 - Admin/Assessment Prisma Query Mismatch

Date: 2026-05-30

## Objective

Resolve the production `PrismaClientValidationError` affecting `/dashboard/admin` and assessment detail routes without applying Storage migrations, touching production data, changing env vars, or declaring launch readiness.

## Reported Symptoms

- `/dashboard/admin` showed the safe fallback instead of the complete admin console.
- Assessment detail routes failed with a server error.
- Runtime logs reported `PrismaClientValidationError` around `prisma.assessment.findMany()`.
- The reported query shape referenced `workspace.ownerUser.select.email`.
- Storage/Ceph migrations remain pending, so core assessment routes must not depend on new Storage tables.

## Root Cause

The admin and AI usage data loaders were selecting `workspace.ownerUser.email` through nested Prisma relation includes inside assessment/event queries. Even though the relation exists in the local Prisma schema, production logs showed the runtime Prisma client/query shape rejecting that nested path.

Assessment detail also eagerly loaded Storage/Ceph relations. Because Storage migrations are still pending in the target production environment, those optional relations can fail at runtime and should not break the core assessment page.

## Hotfix

### Admin Console

- Removed nested `workspace.ownerUser.select.email` from admin assessment queries.
- Kept `workspace.ownerUserId` as the stable scalar field.
- Loaded owner emails separately through `prisma.user.findMany()`.
- Preserved admin assessment search by owner email by resolving matching user IDs first and then filtering by `workspace.ownerUserId`.
- Added the Spanish internal fallback label: `Propietario no disponible en este runtime`.

### Admin Opportunities

- Removed nested owner relation selection from commercial opportunity queries.
- Resolved owner email through a separate user lookup keyed by `ownerUserId`.

### AI Usage Admin View

- Removed nested owner relation selection from AI usage assessment includes.
- Resolved owner labels through a separate user lookup keyed by `ownerUserId`.

### Assessment Detail

- Split assessment loading into:
  - core assessment include;
  - optional Storage/Ceph relation include.
- Core routes load first without Storage/Ceph relations.
- Optional Storage/Ceph relations load separately and degrade to empty values if unavailable.
- Added sanitized warning event: `assessment_detail_optional_storage_unavailable`.
- Added `findAssessmentForAdmin()` so admin assessment detail and report preview use the same safe loader pattern.

## Files Modified

- `src/server/admin/adminConsoleService.ts`
- `src/server/admin/adminOpsService.ts`
- `src/server/ai/aiUsageService.ts`
- `src/server/assessments/assessmentService.ts`
- `src/app/dashboard/assessments/[id]/page.tsx`
- `src/app/dashboard/assessments/[id]/report/page.tsx`
- `tests/unit/assessmentDetailInclude.test.ts`

## Regression Test

Added a unit test that verifies the assessment detail core include does not eagerly include Storage/Ceph relations and uses `workspace.ownerUserId` instead of the owner relation.

## Validations

- `npx prisma validate`: passed.
- `npx prisma generate`: passed.
- `npm run test:run`: passed, 36 files / 152 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run hostinger:diagnose`: passed as diagnostic; local required production env vars were absent, and no secret values were printed.

Known build note:

- The first local build hit a Windows/OneDrive `EPERM` unlink error under `.next`. The resolved `.next` path was verified inside the workspace and only `.next` was removed before retrying.
- Turbopack/NFT warning for `next.config.mjs` and `src/server/evidence/localStorageService.ts` remains the known non-blocking warning.

## Security And Release Boundaries

- No Storage migrations applied.
- No `prisma migrate deploy`.
- No `prisma db push`.
- No `prisma migrate reset`.
- No DB writes or production data mutations performed by this hotfix.
- No env vars changed.
- No pricing changes.
- No secrets printed.
- Full public launch remains not declared.

## Production Smoke

Local validation passed. Production authenticated smoke still requires browser/admin session validation after deployment because the Codex Chrome connector was previously unavailable.

Expected post-deploy checks:

- `/dashboard/admin` should load the full admin console instead of the global fallback.
- `/dashboard/admin/pricing` should remain OK.
- `/dashboard/assessments` should remain OK.
- Assessment detail should load without server error.
- Storage/Ceph sections may show empty or pending state until Storage migrations are applied.
- `PrismaClientValidationError` and digest `3639664386` should not reappear.

## Risks Pending

- Confirm Hostinger auto-deploy completion for the hotfix commit.
- Confirm authenticated production admin smoke with a real admin session.
- Storage migrations remain pending.
- Storage release apply remains pending.
- PDF visual real validation remains pending.
- Full public launch remains not declared.

## Decision

This hotfix is safe to push through the normal Hostinger deploy path. It does not attempt Storage release and is intended to restore admin and assessment detail stability before reattempting Storage/Ceph release validation.
