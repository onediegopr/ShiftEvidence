# Local DB Migration Fix - Missing Evidence Module Tables

Date: 2026-06-02
Status: resolved for the confirmed development database
Scope: local/dev database migration alignment
Production touched: no
Hostinger touched: no
Billing touched: no
Deploy performed: no
Destructive commands used: no
Full public launch: NO

## Problem

Opening an assessment locally produced a Prisma runtime error:

```text
The table `public.AssessmentEvidenceModule` does not exist in the current database.
```

The failing code path was assessment detail loading, where the current application code expects the Evidence Expansion common framework tables.

## Root Cause

The codebase was ahead of the database used by the local/dev environment.

The missing tables are created by the existing migration:

```text
20260601193000_evidence_1_common_framework
```

This was not a Migration Recommendation Plan bug and not a browser tooling bug. It was a schema/migration state mismatch in the confirmed development database.

## Target Confirmation

The user confirmed that the remote Neon PostgreSQL target configured in `.env` / `.env.local` is the database to migrate for this local/dev workflow.

Safe target metadata:

- Provider: PostgreSQL.
- Database name: `neondb`.
- Host: Neon remote host, not localhost.
- SSL hint: present.

No `DATABASE_URL` value was printed.

## Pre-Fix State

Read-only table check before migration:

- `AssessmentEvidenceModule`: missing.
- `EvidenceUpload`: missing.
- `EvidenceParseResult`: missing.

`npx prisma migrate status` initially failed with a schema engine error, but direct read-only SQL checks confirmed the missing tables and showed later migrations already applied.

## Actions Executed

Commands:

```bash
npx prisma migrate deploy
npx prisma generate
```

Result:

- `20260601193000_evidence_1_common_framework` applied successfully.
- `npx prisma generate` initially failed with `EPERM` because the local Next dev server was holding the Prisma query engine DLL.
- The local port `3000` dev server was stopped.
- `npx prisma generate` was rerun successfully.

No destructive command was used.

Not used:

- `prisma migrate reset`.
- `prisma db push --force-reset`.
- `DROP TABLE`.
- `DROP DATABASE`.
- `TRUNCATE`.
- Mass `DELETE`.

## Post-Fix Confirmation

Read-only table check after migration:

- `AssessmentEvidenceModule`: exists.
- `EvidenceUpload`: exists.
- `EvidenceParseResult`: exists.

Prisma:

- `npx prisma migrate status`: database schema up to date.
- `npx prisma validate`: OK.
- `npx prisma generate`: OK after stopping the local dev server.

## Local App Smoke

Local dev server was restarted on:

```text
http://127.0.0.1:3000
```

Route smoke:

- `/sign-in`: `200 OK`.
- `/dashboard/assessments` without session: `307 Temporary Redirect`.

The original table-missing Prisma error was no longer observed during unauthenticated route smoke.

## Validations

Passed:

- `npm run typecheck`.
- `npm run lint`.
- `npm run test:run`.
- `npm run build`.
- `npm run ai:guardrails`.
- `npm run hostinger:diagnose` as safe local diagnostic only.

Known non-blocking warning:

- Turbopack/NFT warning related to `localStorageService` and the report download route.

## Browser QA Status

Codex Chrome/browser control was retried after the database fix.

Result:

- Browser control still failed before page control with the known local browser-runtime asset-path error.
- No authenticated browser QA was completed.
- EVIDENCE-7.1B remains not closed.

## Safety

Confirmed:

- No Hostinger config was touched.
- No production deploy was triggered.
- No billing provider, checkout, pricing or landing changes were made.
- No DB reset or destructive command was executed.
- No secrets, env var values, tokens or cookies were printed.

## Decision

Local/dev database schema mismatch: resolved.

EVIDENCE-7.1B: not closed.

Full public launch: NO.

Recommended next step:

- Repair Codex Browser/Chrome tooling from the Codex plugin UI, then retry EVIDENCE-7.1B authenticated browser closeout.
