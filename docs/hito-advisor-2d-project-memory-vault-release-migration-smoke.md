# HITO ADVISOR-2D - Project Memory Vault Release Migration + Smoke

Status: partial operational closure. Production database migration completed and public smoke passed. Authenticated UI smoke was blocked because no controllable authenticated browser session was available from Codex.

## Objective

Close the controlled production readiness pass for ADVISOR-2 Project Memory Vault:

- validate Git state and recent landing commits;
- validate the ADVISOR-2A migration;
- apply the migration to Neon production only after safe checks;
- validate table, enums and Prisma migration state;
- run public smoke;
- attempt authenticated Senior Advisor Memory smoke when a session is available;
- document remaining release gates.

No new features were implemented. No deploy was run. Hostinger, env vars, landing, `Hero.tsx`, `index.css`, stashes, Storage/Ceph, Licensing, RVTools, billing, RAG and embeddings were not changed.

## Git State

Branch: `main`.

Preflight result:

- working tree clean before migration work;
- `main` synchronized with `origin/main`;
- no divergence;
- ADVISOR-2A present: `9242a82 feat: add Senior Advisor project memory vault foundation`;
- ADVISOR-2B present: `d771638 feat: add Senior Advisor project memory UI panel`;
- ADVISOR-2C present: `53b3457 feat: integrate Senior Advisor project memory into prompt context`;
- recent landing commits present, including `1727b04` and `e761174`;
- stashes preserved:
  - `stash@{0}: On main: park unrelated Hero/index changes before ADVISOR-2C`;
  - `stash@{1}: On main: park beta invite docs before functional readiness`.

Landing was not touched.

## Migration Inventory

Migration reviewed:

`prisma/migrations/20260530220000_advisor_2a_project_memory_vault/migration.sql`

The migration is additive:

- creates enum `AssessmentAdvisorMemoryItemType`;
- creates enum `AssessmentAdvisorMemoryItemStatus`;
- creates enum `AssessmentAdvisorMemorySourceType`;
- creates enum `AssessmentAdvisorMemoryTruthStatus`;
- creates table `AssessmentAdvisorMemoryItem`;
- creates expected indexes;
- creates foreign keys with cascade/set-null behavior.

No drops, renames, deletes, backfill or mandatory columns on existing populated tables were present.

## Local Validation

Executed before production DB mutation:

- `npx prisma validate`: passed with `.env.local` loaded into the process.
- `npx prisma generate`: passed.
- `npm run test:run`: passed, 51 test files / 215 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run hostinger:diagnose`: exit 0.

Known build note: Turbopack/NFT warning remains for `src/server/evidence/localStorageService.ts` import trace through `next.config.mjs`.

Hostinger diagnose note: env vars report absent because the diagnostic script does not load `.env.local` and does not print secrets.

## Neon Production Migration

Project: `InfraShift`.

Project ID: `icy-term-84598838`.

Production branch: `production`.

Production branch ID: `br-raspy-morning-ap11hfm6`.

Database: `neondb`.

Before migration:

- `_prisma_migrations` had no failed migrations.
- `failed_count = 0`.
- `AssessmentAdvisorMemoryItem` was absent.
- all four Advisor Memory enums were absent.
- ADVISOR-2A migration was pending.

Temporary branch validation:

- temporary branch: `mcp-migration-2026-05-30T23-34-10`;
- temporary branch ID: `br-cold-hall-aps8lvza`;
- migration ID: `ce5b6ec0-65e7-4c61-b712-94adca4f3837`;
- migration applied successfully on the temporary branch;
- temporary branch validation confirmed:
  - Prisma migration row present;
  - `AssessmentAdvisorMemoryItem` table present;
  - all four enums present;
  - `failed_count = 0`.

Production apply:

- user explicitly authorized the apply;
- Neon MCP `complete_database_migration` applied the already-tested migration to production;
- temporary branch `br-cold-hall-aps8lvza` was deleted by Neon MCP cleanup;
- no `db push`, `migrate reset` or destructive command was used.

After migration:

- migration row:
  - `migration_name = 20260530220000_advisor_2a_project_memory_vault`;
  - `finished_at = 2026-05-31T00:12:02.896Z`;
  - `rolled_back_at = null`;
  - `logs = null`;
- table present: `AssessmentAdvisorMemoryItem`;
- enums present:
  - `AssessmentAdvisorMemoryItemStatus`;
  - `AssessmentAdvisorMemoryItemType`;
  - `AssessmentAdvisorMemorySourceType`;
  - `AssessmentAdvisorMemoryTruthStatus`;
- `failed_count = 0`.

## Runtime / Hostinger Status

No Hostinger deploy was run and no env vars were changed.

Public runtime evidence:

- `https://shiftevidence.com/` returned 200;
- landing HTML contains current TAM badge text, indicating recent landing runtime content is live;
- protected dashboard routes redirect unauthenticated traffic to `/sign-in`.

Because no deploy was performed in this hito, the runtime commit was not changed by Codex.

## Public Smoke

Executed with `curl.exe` against `https://shiftevidence.com`:

| Route | Result |
| --- | --- |
| `/` | 200 |
| `/shiftreadiness` | 200 |
| `/sign-in` | 200 |
| `/sign-up` | 200 |
| `/sample-report` | 200 |

Protected route behavior:

| Route | Result |
| --- | --- |
| `/dashboard` | 307 to `https://shiftevidence.com/sign-in` |
| `/dashboard/assessments` | 307 to `https://shiftevidence.com/sign-in` |

No Hostinger 404 was observed in the public routes tested.

## Authenticated Senior Advisor Memory Smoke

Blocked.

Reason:

- Chrome connector returned `Browser is not available: extension`;
- no controllable authenticated browser session was available;
- no credentials were requested or used;
- no manual session state, cookies or local storage were inspected.

Not executed:

- dashboard authenticated load;
- assessment detail authenticated load;
- Senior Advisor tab load;
- Project Memory panel UI visibility;
- manual memory note creation through UI;
- lifecycle actions through UI;
- prompt memory message through UI.

This should be completed manually or in a follow-up authenticated smoke with Chrome extension/session available.

## Usage Metadata

Production DB query against latest `senior_advisor_message` usage events found existing events, but they predate the ADVISOR-2C runtime memory metadata path and do not contain the new memory metadata keys.

Expected keys for the next authenticated Advisor message after runtime is serving 2C:

- `memoryIncluded`;
- `memoryItemCount`;
- `memoryContextChars`;
- `memoryFallbackReason`.

No full prompt, memory titles/summaries, secrets or raw file contents should be persisted in usage metadata.

## Result

Production database readiness for Project Memory Vault is complete.

Public smoke is complete.

Authenticated Advisor Memory smoke is blocked until a controllable authenticated session is available and the runtime can be verified through the UI.

Full public launch is not declared.

## Remaining Risks

- authenticated Project Memory panel smoke still pending;
- prompt memory smoke through UI still pending;
- usage metadata verification after a fresh post-2C Advisor message still pending;
- automatic memory extraction remains future work;
- RAG and embeddings remain future work;
- billing/pricing integration remains future work;
- retention/export/delete workflows remain future work;
- advanced admin memory visibility remains future work;
- full public launch remains undeclared.
