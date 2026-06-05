# R2 Vercel Preview Authenticated Upload/Download Smoke

Date: 2026-06-05

## Objective

Validate a real authenticated Vercel Preview upload/download path using Cloudflare R2 preview storage with a synthetic file only.

## Environment

- Deployment URL: `https://infrashift-r2-recovery-diegoperezroca-4286-shift-evidence.vercel.app`
- Deployment ID: `dpl_g4sbPaLnqtpa4meyzXfiGUE6KdPL`
- Deployment target: Preview (`target: null`)
- Deployment state: `READY`
- Git branch deployed: `preview`
- Git commit deployed: `09646e22e1ed950bc513300b25e2378ac283314a`
- Bucket expected by runtime: `shift-evidence-preview-evidence`
- Production bucket used: no

## Synthetic Data

- User: synthetic smoke account only
- Assessment: synthetic smoke assessment only
- File name: `synthetic-upload.txt`
- File content: synthetic smoke text only, no customer data
- Bytes: `87`
- SHA256: `7fc5a940e0bedcf847d1f4427abf7cddecb8c21e83eeb5d0076d9ce05bcff0e7`

## Attempted Flow

- Preview Protection bypass: authorized temporary access was used, value not documented
- Auth sign-up: OK
- Assessment create: OK
- Manual infrastructure intake prerequisite: OK
- Cost / Risk assumptions prerequisite: OK
- Evidence upload gate: unlocked
- Upload action reached: yes
- Upload result: blocked before R2 write
- Download verification: not reached
- Delete cleanup: not reached

## Result

Status: `PARTIAL`

The authenticated Preview flow reached the real evidence upload Server Action, but the upload was blocked before storage by the upload rate limiter:

- Redirect result: `/dashboard/assessments/<synthetic-id>?error=Too%20many%20requests.%20Please%20try%20again%20later.&tab=evidence`
- Code path: `uploadEvidenceAction`
- Rate limiters checked before storage write:
  - `uploadEvidenceUser`
  - `uploadEvidenceIp`

The observed blocker is consistent with Preview running in production mode without the Upstash rate-limit environment variables required by `src/server/security/rateLimit.ts`. In that condition, missing Upstash configuration makes upload rate limiting fail closed before `writeUploadedFile` can call R2.

## R2 Storage Result

- write: not reached
- read/download: not reached
- content verification: not reached
- delete: not reached
- post-delete cleanup: not reached
- bucket prod touched: no

## Logs And Deployment Review

- Deployment inspected through Vercel: `READY`
- Deployment target confirmed as Preview (`target: null`)
- Build logs reviewed: build completed successfully
- Runtime smoke result surfaced as the safe application redirect above
- No R2 `AccessDenied` or bucket-selection error was proven, because the request was blocked before R2 storage execution

## Safety

- No secrets documented
- No `.env.local` content printed
- No `.env.r2-smoke.local` content printed
- No bypass value documented
- No real customer data used
- No production R2 bucket used
- No deploy performed
- No DB migrations or `db push`
- No Stripe, Wise, payments, webhooks, entitlements, Hostinger, DNS, or custom domain changes

## Conclusion

The authenticated Vercel Preview upload/download smoke is not complete yet. The next blocker is Preview rate-limit configuration, not R2 bucket access.

## Follow-Up

`VERCEL-PREVIEW-UPLOAD-RATE-LIMIT-CONFIG` implemented an explicit Preview-only memory fallback controlled by `RATE_LIMIT_PREVIEW_FALLBACK=memory`.

The smoke should be retried after the Preview deployment includes that code and environment variable.

## Recommended Next Hito

`VERCEL-PREVIEW-UPLOAD-RATE-LIMIT-CONFIG`

After Preview upload rate limiting is configured safely, rerun `R2-AUTHENTICATED-UPLOAD-DOWNLOAD-SMOKE-VERCEL-PREVIEW` and verify:

- upload OK
- R2 preview object created
- authenticated download OK
- SHA256 match OK
- delete OK
- post-delete download blocked or missing
