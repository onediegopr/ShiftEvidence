# Dependency Maintenance Notes

Fecha: 2026-06-05

## 1. Objective

Record maintenance findings from `MEGA-AUDIT-PRODUCTION-READINESS-1` and `MEGA-AUDIT-HOTFIX-1` without upgrading dependencies in this hito.

## 2. PostCSS / Next

`npm audit` reports a moderate transitive issue through the framework dependency tree.

Decision:

- Do not run a forced audit fix.
- Do not force a breaking framework downgrade/upgrade.
- Monitor framework patch releases.
- Handle in a controlled dependency maintenance hito.

## 3. Workbook Parser

Workbook parser risk is documented separately:

- `docs/dependency-xlsx-risk.md`.

Decision:

- Do not replace parser in this hito.
- Do not broaden customer upload exposure until mitigations are reviewed.

## 4. Local Package Hygiene

`npm ls --depth=0` showed one local extraneous package entry.

Decision:

- Treat as local hygiene.
- Prefer clean install/reinstall in a dedicated maintenance window if it recurs.
- Do not change lockfile for this hito solely for local noise.

## 5. Windows / OneDrive Prisma Workflow

Observed during audit:

- Running Prisma generate/build/test concurrently can create false failures on Windows/OneDrive due file locking.

Recommended local workflow:

1. Run Prisma generate.
2. Run tests.
3. Run build.
4. Avoid parallel Prisma generate/build/test jobs locally.

## 6. Future Controlled Dependency Hito

Candidate future hito:

- `DEPENDENCY-MAINTENANCE-1`.

Scope:

- Review framework patch upgrades.
- Review auth package patch upgrades.
- Review Prisma major upgrade separately.
- Re-run full typecheck/lint/tests/build.
- Do not mix with Ads, payments, DNS, or DB migrations unless explicitly approved.
