# HITO SAMPLE-PREMIUM-1B - CDN Cache Versioned PDF

Date: 2026-05-31

## Objective

Close the public premium sample report cache issue without touching critical product areas.

## Context

`SAMPLE-PREMIUM-1` published commit `e9c225f feat: add premium synthetic sample readiness report`.

Post-deploy smoke showed:

- `/sample-report` clean requests returned stale HTML from HCDN.
- `/sample-reports/proxmox-migration-readiness-sample-report.pdf` clean requests returned the previous PDF from HCDN.
- `Cache-Control: no-cache` or a cache-busting query reached the new premium PDF.
- The new PDF was byte-identical to the locally validated artifact.

## Decision

No safe repository command for purging Hostinger/HCDN was available. A filename-versioned PDF was added so a clean public URL can reach the new artifact without special headers or query parameters.

## Public Paths

- Current public premium PDF: `/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf`.
- Compatibility PDF retained: `/sample-reports/proxmox-migration-readiness-sample-report.pdf`.
- Main public page retained: `/sample-report`.

## Scope

Changed only public sample assets, public sample CTAs, tests and documentation.

Not touched:

- database;
- auth;
- billing;
- Prisma migrations;
- environment variables;
- Gemini/OpenAI;
- pricing;
- storage core;
- real customer report generation.

## Rollback

1. Revert the versioned PDF asset commit.
2. Point public CTAs back to `/sample-reports/proxmox-migration-readiness-sample-report.pdf`.
3. Keep or remove the versioned PDF only after confirming no external links depend on it.
4. Purge HCDN manually if available.

## Residual Risk

HCDN may continue serving stale HTML for `/sample-report` until expiration or manual purge. The versioned PDF path itself avoids the stale PDF cache key.
