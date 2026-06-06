# Methodology-2 Validation Baseline

This baseline keeps METHODOLOGY work isolated from unrelated demo and sample-report changes.

## What passes

- `npm run typecheck`
- `npm run lint`
- `npx vitest run tests/unit/methodologyKbFoundation.test.ts`

## What failed during this hito before the cleanup

- `tests/unit/demoWorkspace.test.ts`
- `tests/unit/premiumSampleReportContent.test.ts`
- `npm run build`

## Why the demo/sample-report tests failed

- The failures were stale copy expectations, not logic bugs.
- The demo workspace route now uses the newer CTA copy.
- The premium sample report now uses updated premium sample phrasing.
- The test expectations were updated to match the current product text.

## Why the build failed

- The first failure mode was an eager `DATABASE_URL` requirement during module import.
- `src/lib/env.ts` used to require `DATABASE_URL` at load time.
- `src/lib/prisma.ts` now resolves Prisma lazily so non-DB builds do not fail immediately on import.
- The later build failure was a Windows file-lock issue on `.next` while Next.js dev servers were running.

## Current methodology shape

- Active methodology version: `Shift Evidence Methodology Bible v2.1`
- Domains: 11
- Active rules: 16
- Knowledge chunks: present and searchable locally
- Admin console: editable note/review workflow is now available behind admin auth, with the seed sections still read-only
- Persisted internal notes, review items, and changelog entries live in the additive `METHODOLOGY-2B` path

## How to reproduce Methodology tests in isolation

```bash
npx vitest run tests/unit/methodologyKbFoundation.test.ts
```

If you want to check the demo copy after this hito:

```bash
npx vitest run tests/unit/demoWorkspace.test.ts tests/unit/premiumSampleReportContent.test.ts
```

## What should be corrected later

- Decide when to apply the additive `methodology_admin_notes_review` migration in local/dev.
- Expand the new note/review workflow into broader admin review flows if needed.
- Expand the Bible extraction plan into real content slices once the next methodology phase starts.
- Re-run build after closing any active Next.js dev servers that hold `.next` locks on Windows.
