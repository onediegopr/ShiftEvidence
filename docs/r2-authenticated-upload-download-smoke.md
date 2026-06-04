# R2 Authenticated Upload/Download Smoke

Date: 2026-06-04

## Objective

Validate that the application storage contract can write, read, verify, and delete synthetic evidence using `STORAGE_DRIVER=r2` against Cloudflare R2 preview.

## Environment

- Repository branch: `main`
- Storage driver: `r2`
- Runtime bucket selection: preview bucket in non-production mode
- Browser/authenticated UI flow: not used in this smoke

## Smoke Type

- Service-level

## Bucket

- Bucket used: `shift-evidence-preview-evidence`
- Bucket prod used: no

## Object Key

- Relative path: `_smoke/r2-auth-upload-download-smoke/ba67f130-15b5-4fe9-b245-c8554c9c546c/synthetic.txt`
- Location: `r2://shift-evidence-preview-evidence/_smoke/r2-auth-upload-download-smoke/ba67f130-15b5-4fe9-b245-c8554c9c546c/synthetic.txt`

## Payload

- Bytes: `72`
- SHA256: `b17385df3358f0cfe41e9f790948fcde2798f96e97b218ada40c9d56fbfc3e15`
- Content: synthetic only, no customer data

## Result

- write: OK
- read: OK
- content verification: OK
- delete: OK
- post-delete: OK

## Notes

- No UI-authenticated browser/session was used for this smoke.
- Secrets were stored only in `.env.r2-smoke.local` locally and were not documented here.
- `.env.r2-smoke.local` remained untracked.
- No database, deploy, Vercel, Hostinger, Stripe, Wise, webhooks, or entitlements were touched.

## Validations

- `git diff --check`
- `npm run typecheck`
- `npm run lint`
- `npx vitest run tests/unit/storageService.test.ts tests/unit/storagePathContainment.test.ts`
- `npm run test:run`
- `npm run build`

## Pending

- Vercel preview env config
- Authenticated browser upload/download smoke
- Production bucket remains untouched
