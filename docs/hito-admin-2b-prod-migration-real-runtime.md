# HITO DB-ACCESS-ADMIN-2B - Production AiUsageEvent Migration

Date: 2026-05-28.

## Objective

Locate a safe production `DATABASE_URL` source, apply the additive `AiUsageEvent` migration with Prisma migrate deploy, validate the table, smoke production/admin, create one safe persistent AI usage event and document the closeout without exposing secrets.

## Status

Status: COMPLETO.

Reason:

- `DATABASE_URL` was found in existing unversioned `.env.local`.
- The value was not printed.
- The host was validated by boolean/exact match against the Neon `InfraShift` read-write compute metadata.
- `npm run prisma:deploy` applied `20260528103000_admin_2b_ai_usage_events`.
- `AiUsageEvent` exists and count increased from `0` to `1` after a safe synthetic `admin_test` event.
- Production no-session smoke passed.
- Authenticated `/dashboard/admin` loaded and `IA y Consumo` showed the persisted event without visible secret patterns.

## Git

- Branch: `main`.
- Initial HEAD: `118a33dad75ab5931f454dc5e842d36818b01f8d`.
- Initial `origin/main`: `118a33dad75ab5931f454dc5e842d36818b01f8d`.
- Initial working tree: clean.
- Divergence: none.

## DATABASE_URL

- Found: YES.
- Source: existing local `.env.local`, ignored by Git.
- Loaded to process: YES, only for commands that needed it.
- Value printed: NO.
- Secrets printed: NO.
- Production DB confidence: matched Neon project `InfraShift` read-write compute metadata.
- Note: `.env.local` app/auth URL markers are local, so the DB target was confirmed against Neon metadata before any migration was run.

## Pre-Migration Validations

- `npm run hostinger:diagnose`: OK, no secret values.
- `npm run ai:guardrails`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK.
- `npx prisma validate`: OK.
- `npx prisma generate`: OK.

Known non-blocking warning:

- Turbopack/NFT warning for `next.config.mjs` / `reportStorageService.ts`.

## Migration Review

Migration:

- `prisma/migrations/20260528103000_admin_2b_ai_usage_events/migration.sql`

Review result:

- Creates `AiUsageEvent`.
- Adds indexes for `createdAt`, `userId`, `assessmentId`, `provider`, `status` and `operationType`.
- Adds nullable FKs to `user` and `Assessment` with `ON DELETE SET NULL`.
- Does not drop tables.
- Does not drop columns.
- Does not truncate data.
- Does not delete or update existing rows.
- Does not alter existing data destructively.

## Migration Execution

Command used:

```bash
npm run prisma:deploy
```

Result:

- Prisma found 9 migrations.
- Applied `20260528103000_admin_2b_ai_usage_events`.
- All migrations successfully applied.

Safety:

- Prisma reset: NO.
- Prisma migrate reset: NO.
- Prisma db push: NO.
- Existing data deleted: NO.
- Hostinger config modified: NO.
- OpenAI activated: NO.
- Full public launch declared: NO.

## Table Validation

- `AiUsageEvent` table exists: YES.
- Initial safe count: `0`.
- Records printed fully: NO.

## Production No-Session Smoke

Validated against `https://shiftevidence.com`:

- `/`: `200`.
- `/shiftreadiness`: `200`.
- `/sign-in`: `200`.
- `/sign-up`: `200`.
- `/dashboard`: `307` to `/sign-in`.
- `/dashboard/admin`: `307` to `/sign-in`.
- `/api/admin/ai/usage` without session: `307` to `/sign-in`.
- No 500/503/504 observed.
- No Hostinger 404 observed.

## Authenticated Admin Smoke

Validated with an existing Chrome admin session:

- `/dashboard/admin`: loaded.
- `IA y Consumo`: loaded.
- Calls/tokens/cost cards: visible.
- Persistent event table: visible.
- Consumption by user: visible.
- Consumption by assessment: visible.
- Secret/API key leak pattern: not detected.

Authenticated direct opening of `/api/admin/ai/usage` was blocked by the local Chrome client before the server response. The admin page itself rendered persistent usage from the same server-side usage service without crashing.

## Persistent AI Usage Event

Method:

- Safe synthetic production smoke inserted one `AiUsageEvent` with `operationType = admin_test`.
- No prompt, raw response, raw file, storage path, cookie, token or secret was stored.

Result:

- Count before: `0`.
- Count after: `1`.
- Count increased: YES.
- Provider: `gemini`.
- Model: `gemini-1.5-flash`.
- Status: `success`.
- Estimated total tokens: `265`.
- Estimated cost USD: `0.0000435`.
- Visible in admin `IA y Consumo`: YES after forced server refresh.
- Empty-state message disappeared: YES.
- Secret/API key leak pattern: not detected.

## Security

- No `DATABASE_URL` value printed.
- No secrets printed.
- No `.env` or `.env.local` committed.
- No raw files printed.
- No private storage paths printed.
- No OpenAI activation.
- No full public launch.
- No destructive Prisma command.

## Decision

- Production AiUsageEvent migration applied: YES.
- ADMIN-2B production ready: YES for persistent AI usage telemetry under controlled launch.
- Ready for ADMIN-3: YES.
- Ready for full public launch: NO.
- Next recommended hito: ADMIN-3 operational audit/error deepening, plus a separate credentialed product-flow replay if broader launch evidence is needed.
