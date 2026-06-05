# Vercel Preview Upload Rate-Limit Config

Date: 2026-06-05

## Objective

Allow the authenticated Vercel Preview upload/download smoke to reach Cloudflare R2 preview storage without lowering production security.

## Blocker

The authenticated Preview upload flow reached `uploadEvidenceAction`, but upload was redirected with:

- `Too many requests. Please try again later.`

The request was blocked before `writeUploadedFile`, so R2 was not reached.

## Rate Limiter Audit

Rate limiting is centralized in `src/server/security/rateLimit.ts`.

Protected upload action:

- `src/app/dashboard/assessments/[id]/evidence/actions.ts`
- `uploadEvidenceAction`
- `uploadEvidenceUser`: 20 requests / 15 minutes
- `uploadEvidenceIp`: 50 requests / 15 minutes

The upload action checks both rate limiters before validating and writing the uploaded file.

When Upstash is configured, the limiter uses:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

When Upstash is missing in `NODE_ENV=production`, the previous behavior failed closed. That is safe for production, but it blocked Vercel Preview smoke execution because Vercel Preview runs production-like server code.

## Vercel Preview Env Status

Confirmed present in Preview without printing values:

- `DATABASE_URL`
- `PREVIEW_TRUSTED_ORIGINS`
- `STORAGE_DRIVER`
- `R2_ACCOUNT_ID`
- `R2_S3_ENDPOINT`
- `R2_BUCKET_PREVIEW`
- `R2_BUCKET_PROD`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `STRIPE_CHECKOUT_ENABLED`
- `RATE_LIMIT_PREVIEW_FALLBACK`

Confirmed missing in Preview:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Solution Chosen

Implemented explicit Preview-only memory fallback:

- Enabled only when `VERCEL_ENV=preview`.
- Enabled only when `RATE_LIMIT_PREVIEW_FALLBACK=memory`.
- Used only when Upstash env vars are missing.
- Keeps normal rate-limit counters in memory per runtime instance.
- Logs a safe operational warning without secrets.
- Does not skip authentication.
- Does not bypass upload ownership checks.
- Does not expose uploads publicly.
- Does not affect production.

Production behavior remains fail-closed when Upstash is missing.

## Upstash Follow-Up

`UPSTASH-PREVIEW-RATE-LIMIT-1` replaced the temporary Preview memory fallback with real Upstash Redis for branch `preview`.

Current Preview status:

- `UPSTASH_REDIS_REST_URL`: loaded
- `UPSTASH_REDIS_REST_TOKEN`: loaded
- `RATE_LIMIT_PREVIEW_FALLBACK`: removed

The memory fallback remains in code as a controlled emergency option, but it is no longer the active Preview path.

## Vercel Env Change

Added to Vercel Preview only:

- `RATE_LIMIT_PREVIEW_FALLBACK`

Value is non-secret and documented by category only. No Production env was changed.

## Smoke Result

Status: completed.

After Preview redeploy and stable Preview alias reassignment:

- Auth sign-up: OK
- Synthetic assessment: OK
- Upload prerequisites: OK
- Upload gate: unlocked
- Upload: OK
- R2 preview storage path exercised through the app storage adapter: OK
- Authenticated download: OK
- Bytes: `87`
- SHA256: `3996776600b1a22c741fc0d5ffbd203308363a692a42f7b3eb67bddb6d30d4fe`
- Hash match: OK
- Delete: OK
- Post-delete download: `404`

## Safety

- No production bucket used.
- No production DB touched.
- No production R2 token used.
- No production deploy intentionally promoted.
- No Stripe, Wise, payments, webhooks, entitlements, Hostinger, DNS, or custom domain changes.
- No secrets documented.
- No real customer data used.

## Pending

- Keep Upstash Preview/Staging as the primary Preview rate-limit path.
- Continue with authenticated admin preview smoke.
