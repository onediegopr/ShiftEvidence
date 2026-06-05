# Upstash Preview Rate Limit

Date: 2026-06-05

## Objective

Replace the temporary Vercel Preview memory fallback with a real Upstash Redis database for rate limiting, then rerun the authenticated upload/download smoke against R2 preview.

## Previous Blocker

Vercel Preview previously blocked evidence upload before R2 storage with:

- `Too many requests. Please try again later.`

The blocker happened because Preview runs production-like server code and the rate limiter failed closed when Upstash was missing.

## Upstash Preview/Staging Setup

- Upstash Redis database created: yes
- Name: `shift-evidence-preview-rate-limit`
- Plan: Free Tier
- Provider/region: AWS, N. Virginia (`us-east-1`)
- Production Upstash database used: no
- Secrets documented: no

## Vercel Preview Env

Loaded in Vercel Preview for branch `preview`:

- `UPSTASH_REDIS_REST_URL`: yes
- `UPSTASH_REDIS_REST_TOKEN`: yes

Removed from Vercel Preview for branch `preview`:

- `RATE_LIMIT_PREVIEW_FALLBACK`

Decision:

- Upstash Preview/Staging is now the primary rate-limit path.
- The memory fallback remains in code only as a controlled emergency option, but it is no longer enabled in Preview.
- Production still fails closed if Upstash is missing.

## Redeploy

- Deployment ID: `dpl_9CLoAQkeVgGF6yapUYFa9tCmbKF1`
- URL: `https://infrashift-r2-recovery-grxbdo1km-shift-evidence.vercel.app`
- Stable Preview alias: `https://infrashift-r2-recovery-diegoperezroca-4286-shift-evidence.vercel.app`
- Target: Preview
- Status: READY
- Production deploy: no
- Promote: no

Note:

- A manual local `vercel deploy --target preview` attempt failed before smoke because it did not use the branch-scoped Preview env and therefore missed `DATABASE_URL`.
- The successful deployment was a Preview redeploy of the branch deployment after correcting Upstash env formatting.

## Smoke Result

Synthetic file:

- File name: `synthetic-upload-upstash.txt`
- Content: synthetic smoke text only, no customer data
- Bytes: `73`
- SHA256: `eac4fed4d735d6490413eee30025d483d368258a07d6513e4ecadaa557677c47`

Result:

- Sign-up: OK
- Synthetic assessment: OK
- Upload gate: OK
- Upload: OK
- R2 preview write through app storage adapter: OK
- Authenticated download: OK
- SHA256 match: OK
- Delete: OK
- Post-delete download: `404`
- Rate-limit block: no

## Logs Review

Reviewed Vercel logs for the smoke window.

Observed:

- Expected auth, assessment, upload, download, delete and post-delete requests.
- Download before delete returned `200`.
- Post-delete download returned `404`.

Not observed:

- `Too many requests`
- `rate_limit_preview_memory_fallback`
- `rate_limit_misconfigured`
- `rate_limit_check_failed`
- R2 storage errors
- Prisma errors
- secret values

## Safety

- No production DB.
- No production R2 bucket.
- No production R2 token.
- No Stripe, Wise, payments, webhooks or entitlements.
- No Hostinger, DNS or custom domain changes.
- No production deploy or promote.
- No migrations or `db push`.
- No real customer data.
- No secrets committed or documented.

## Pending

- Authenticated admin preview smoke.
- Stripe test keys.
- Production cutover planning.
