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
- SHA256: `3996776600b1a22c741fc0d5ffbd203308363a692a42f7b3eb67bddb6d30d4fe`

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

Status: `COMPLETED`

The authenticated Preview flow reached the real evidence upload Server Action and completed after the Preview-only rate-limit fallback was configured:

- Code path: `uploadEvidenceAction`
- Rate limiters checked before storage write:
  - `uploadEvidenceUser`
  - `uploadEvidenceIp`
- Upload redirect result: `/dashboard/assessments/<synthetic-id>?saved=1&tab=evidence`

## R2 Storage Result

- write: OK
- read/download: OK
- content verification: OK
- delete: OK
- post-delete cleanup: OK, download returned `404`
- bucket prod touched: no

## Logs And Deployment Review

- Deployment inspected through Vercel: `READY`
- Deployment target confirmed as Preview (`target: null`)
- Build logs reviewed: build completed successfully
- Runtime smoke result surfaced as the safe application redirect above
- No R2 `AccessDenied` or bucket-selection error observed

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

The authenticated Vercel Preview upload/download smoke is complete against R2 preview storage.

## Follow-Up

`VERCEL-PREVIEW-UPLOAD-RATE-LIMIT-CONFIG` implemented an explicit Preview-only memory fallback controlled by `RATE_LIMIT_PREVIEW_FALLBACK=memory`, redeployed Preview, and completed this smoke.

`UPSTASH-PREVIEW-RATE-LIMIT-1` replaced the active Preview fallback with real Upstash Redis for branch `preview` and reran the authenticated upload/download smoke successfully:

- file: `synthetic-upload-upstash.txt`
- bytes: `73`
- SHA256: `eac4fed4d735d6490413eee30025d483d368258a07d6513e4ecadaa557677c47`
- upload/download/hash/delete/post-delete: OK

## Recommended Next Hito

`AUTHENTICATED-ADMIN-PREVIEW-SMOKE`

After Preview upload rate limiting is configured safely, rerun `R2-AUTHENTICATED-UPLOAD-DOWNLOAD-SMOKE-VERCEL-PREVIEW` and verify:

- upload OK
- R2 preview object created
- authenticated download OK
- SHA256 match OK
- delete OK
- post-delete download blocked or missing
