# Preview R2 Storage Smoke 1

Date: 2026-06-07

## Objective

Validate the Cloudflare R2 preview storage adapter in a preview-equivalent runtime using synthetic data only, with no production systems, no live payments, and no customer data.

## Environment

- Storage driver: `r2`
- VERCEL_ENV: `preview`
- Bucket used: `shift-evidence-preview-evidence`
- Bucket prod used: no
- Runtime source: local ignored smoke env file
- Secrets: stored only in `.env.r2-smoke.local` locally and not documented here

## Synthetic Data

- Smoke id: `d7263072-d21e-4075-bb33-684b913d46fe`
- Relative path: `_smoke/preview-r2-smoke-1/d7263072-d21e-4075-bb33-684b913d46fe/synthetic.txt`
- Location: `r2://shift-evidence-preview-evidence/_smoke/preview-r2-smoke-1/d7263072-d21e-4075-bb33-684b913d46fe/synthetic.txt`
- Bytes: `70`
- SHA256: `f2e6e3f898191f23cb767a30022743d4ed3bfb194c7300e42ccfbe5f914d2a19`
- Content: synthetic smoke text only, no customer data

## Result

- write: OK
- read: OK
- read content verification: OK
- head: OK
- delete: OK
- post-delete read: blocked
- post-delete message: `The specified key does not exist.`

## Safety

- No real customer data used
- No production bucket used
- No production deploy
- No DNS changes
- No Stripe live configuration
- No Wise automation
- No database migrations
- No `db push`
- No secrets printed
- No repo-tracked env files added

## Validations

- `git diff --check`
- `npm run typecheck`
- `npm run lint`

## Conclusion

The R2 preview storage adapter works in a synthetic preview-equivalent smoke against the preview bucket, including write, read, head, delete, and post-delete cleanup.

## Follow-Up

- `PREVIEW-R2-SMOKE-2` if you want to repeat the smoke through an authenticated UI route.
- `PREVIEW-STRIPE-TEST-CONFIG-1` only if you want a separate test-checkout hito.
- `OUTREACH/PILOT-1` if you want to move to customer-safe validation.
