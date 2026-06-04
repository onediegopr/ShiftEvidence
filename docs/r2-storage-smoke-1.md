# R2 Preview Storage Smoke 1

Date: 2026-06-04

## Objective

Document the first real end-to-end smoke against Cloudflare R2 preview storage.

## Scope

- Bucket used: `shift-evidence-preview-evidence`
- Bucket prod used: no
- Token used: new preview token with `Object Read & Write`, scoped to the preview bucket only
- Secrets: saved locally in `.env.r2-smoke.local` only, not documented here

## Result

- write: OK
- head: OK
- read: OK
- content verification: OK
- delete: OK
- post-delete cleanup: OK

## Safety

- No real customer data
- No DB
- No deploy
- No Vercel
- No Hostinger
- No payments
- No secrets stored in git

## Next Hito

- `R2-AUTHENTICATED-UPLOAD-DOWNLOAD-SMOKE`
