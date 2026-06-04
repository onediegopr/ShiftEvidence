# Vercel Preview Env Config Plan

## 1. Objective

Prepare the exact environment-variable plan for a Vercel Preview deployment that can serve public routes, public PDFs, and R2 preview storage without touching production or enabling live Stripe.

## 2. Current State

- `main` is healthy and synced with `origin/main`.
- Cloudflare R2 is active.
- R2 preview bucket: `shift-evidence-preview-evidence`.
- R2 production bucket: `shift-evidence-prod-evidence`.
- R2 adapter is implemented and pushed.
- R2 preview direct smoke passed.
- R2 service-level app smoke passed.
- `.env.r2-smoke.local` exists locally and is not tracked.
- No Vercel deploy has been made yet.
- No production cutover has been made.
- Hostinger still owns DNS / email.
- Neon remains the database provider.
- Stripe live remains prohibited.
- Wise remains manual invoice / bank transfer only.

## 3. Origin / Auth / Checkout Assessment

`*.vercel.app` does **not** currently give full-fidelity auth/checkout in this codebase.

Why:

- `src/server/billing/checkoutOrigin.ts` only accepts `shiftevidence.com` and `www.shiftevidence.com` as safe public hostnames for checkout origin normalization.
- `src/lib/auth.ts` has `trustedOrigins` hard-coded to localhost plus the production domains only.
- `getCheckoutPublicOrigin()` falls back to the production origin when it cannot normalize the request origin.

Implication:

- Public pages can work on Vercel Preview.
- R2 preview can work on Vercel Preview.
- Auth and checkout are **not** full-fidelity on `*.vercel.app` until preview origin policy is updated or a preview-approved domain is used.

Recommended follow-up hito:

- `PREVIEW-ORIGIN-POLICY-1`

## 4. Config Options

### Config A - Public-only Preview

Use this if you want the public site, demo, PDFs, pricing, and support pages to render without enabling authenticated flows or checkout.

Suggested values:

- `NEXT_PUBLIC_APP_URL=<vercel preview url>`
- `BETTER_AUTH_URL=<vercel preview url>`
- `BETTER_AUTH_SECRET=<preview secret>`
- `DATABASE_URL=<Neon preview/staging db>`
- `ADMIN_EMAILS=<operator admin emails>`
- `STORAGE_DRIVER=local`
- `STRIPE_CHECKOUT_ENABLED=false`
- `STRIPE_CHECKOUT_MODE=test`
- `STRIPE_LIVE_PAYMENTS_APPROVED=false`
- Stripe Price IDs: unset
- R2 vars: optional

### Config B - Preview with R2 Storage

Use this as the recommended baseline for preview storage readiness.

Suggested values:

- `STORAGE_DRIVER=r2`
- `R2_ACCOUNT_ID=<account id>`
- `R2_S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com`
- `R2_BUCKET_PREVIEW=shift-evidence-preview-evidence`
- `R2_BUCKET_PROD=shift-evidence-prod-evidence`
- `R2_ACCESS_KEY_ID=<preview access key id>`
- `R2_SECRET_ACCESS_KEY=<preview secret access key>`
- `MAX_UPLOAD_SIZE_MB=50`
- `STRIPE_CHECKOUT_ENABLED=false`
- `STRIPE_CHECKOUT_MODE=test`
- `STRIPE_LIVE_PAYMENTS_APPROVED=false`

### Config C - Preview Auth + Checkout Test

Use this only after the origin policy is fixed and you have test-only Stripe credentials.

Suggested values:

- `STRIPE_SECRET_KEY=sk_test_...`
- `STRIPE_WEBHOOK_SECRET=<test webhook secret>`
- `STRIPE_STARTER_PRICE_ID=price_...`
- `STRIPE_PROFESSIONAL_PRICE_ID=price_...`
- `STRIPE_MSP_PRICE_ID=price_...`
- `STRIPE_CHECKOUT_MODE=test`
- `STRIPE_CHECKOUT_ENABLED=true`
- `STRIPE_LIVE_PAYMENTS_APPROVED=false`

## 5. Env Var Table

| Variable | Preview required | Build required | Runtime required | Secret | Recommended value for Preview | Source | Risk if missing | Comment |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `NODE_ENV` | no | no | no | no | leave platform-managed | `next` / Vercel runtime | none; do not override | Vercel controls this; do not set manually. |
| `NEXT_PUBLIC_APP_URL` | yes | yes | yes | no | preview URL | `src/server/url/publicAppUrl.ts`, `src/server/billing/checkoutOrigin.ts`, `src/lib/account-recovery.ts` | wrong absolute URLs, auth redirects, password reset links, checkout success/cancel URLs | Needed for public URLs and origin-derived links. |
| `BETTER_AUTH_URL` | yes | yes | yes | no | preview URL | `src/lib/auth.ts`, `src/lib/account-recovery.ts` | auth base URL mismatch; build/runtime errors from env contract | Must match the preview host if auth is expected to work. |
| `BETTER_AUTH_SECRET` | yes | yes | yes | yes | unique preview secret, 32+ chars | `src/lib/env.ts`, `src/lib/auth.ts` | auth/session signing fails | Keep secret only in Vercel Preview / local env. |
| `ADMIN_EMAILS` | yes for admin console | no | yes | no | operator admin email(s) | `src/server/admin/adminAuth`, `docs/admin-emails-configuration-runbook.md` | admin routes fail closed or no admin access | Safe to set for preview admin testing. |
| `DATABASE_URL` | yes | yes | yes | yes | Neon preview/staging branch URL | `prisma/schema.prisma`, `src/lib/env.ts` | Prisma/build/runtime fail | Use a preview/staging DB branch; do not use prod for preview. |
| `DIRECT_URL` | no | no | no | yes | unset unless a future Neon direct-connection flow needs it | `src/server/admin/adminConsoleService.ts` (display only), release-readiness docs | none in current schema | Not required by the current Prisma schema. |
| `STORAGE_DRIVER` | yes for Config B | no | yes | no | `r2` | `src/server/evidence/storageService.ts`, `src/lib/env.ts` | falls back to local disk; uploads/PDF persistence not durable on Vercel | Use `r2` for preview storage readiness. |
| `HOSTINGER_STORAGE_ROOT` | no if `STORAGE_DRIVER=r2` | no | only for local mode | no | `./storage` as fallback only | `src/server/evidence/storagePaths.ts` | local-mode uploads/PDFs may fail or write to a non-persistent path | Not used when `STORAGE_DRIVER=r2`. |
| `MAX_UPLOAD_SIZE_MB` | recommended | no | yes | no | `50` | `src/server/evidence/uploadValidation.ts` | upload limits may drift from baseline | Keep consistent with local/default behavior. |
| `R2_ACCOUNT_ID` | yes for Config B | no | yes | no | Cloudflare account id | `src/server/evidence/storageService.ts` | R2 client config fails | Not a secret, but still sensitive account metadata. |
| `R2_S3_ENDPOINT` | yes for Config B | no | yes | no | `https://<account_id>.r2.cloudflarestorage.com` | `src/server/evidence/storageService.ts` | R2 client config fails | Use the account-specific S3 endpoint. |
| `R2_BUCKET_PREVIEW` | yes for Config B | no | yes | no | `shift-evidence-preview-evidence` | `src/server/evidence/storageService.ts` | preview storage fails | This is the only bucket to use in preview. |
| `R2_BUCKET_PROD` | recommended for completeness, not used in preview | no | only in production | no | `shift-evidence-prod-evidence` | `src/server/evidence/storageService.ts` | production runtime would fail if missing | Do not use this bucket in preview. |
| `R2_ACCESS_KEY_ID` | yes for Config B | no | yes | yes | preview R2 access key id | `src/server/evidence/storageService.ts` | R2 auth fails | Secret, do not print or commit. |
| `R2_SECRET_ACCESS_KEY` | yes for Config B | no | yes | yes | preview R2 secret access key | `src/server/evidence/storageService.ts` | R2 auth fails | Secret, do not print or commit. |
| `UPSTASH_REDIS_REST_URL` | recommended if you want rate-limited routes to work in preview | no | yes when rate limits are hit | yes | preview/staging Upstash URL | `src/server/security/rateLimit.ts` | in production-like preview, missing Upstash can fail closed for rate-limited flows | If absent, some routes may be blocked in preview because runtime is production-like. |
| `UPSTASH_REDIS_REST_TOKEN` | recommended if you want rate-limited routes to work in preview | no | yes when rate limits are hit | yes | preview/staging Upstash token | `src/server/security/rateLimit.ts` | in production-like preview, missing Upstash can fail closed for rate-limited flows | Secret; only load if you want rate limiting active. |
| `STRIPE_SECRET_KEY` | no for Config A/B; yes for Config C | no | yes if checkout is enabled | yes | unset for A/B; `sk_test_...` for C | `src/server/billing/stripeCheckout.ts`, `src/server/billing/billingConfiguration.ts`, `src/server/billing/stripeLiveDiagnostics.ts` | checkout not configured; test checkout cannot run | Never use live in preview. |
| `STRIPE_WEBHOOK_SECRET` | no for Config A/B; yes for Config C if webhooks are part of the test | no | yes if webhooks are enabled | yes | unset for A/B; test webhook secret for C | `src/server/billing/webhooks/stripeWebhookSignature.ts`, `src/server/billing/stripeLiveDiagnostics.ts` | webhook route returns 503; live event handling unavailable | Safe to omit if checkout is disabled. |
| `STRIPE_CHECKOUT_MODE` | no for Config A/B; yes for C | no | yes if checkout is enabled | no | `test` | `src/server/billing/stripeCheckout.ts`, `src/server/billing/billingConfiguration.ts` | checkout mode defaults to test, but explicit config is clearer | Never set `live` in preview. |
| `STRIPE_CHECKOUT_ENABLED` | yes for safe-gated preview | no | yes | no | `false` | `src/server/billing/stripeCheckout.ts`, `src/server/billing/billingConfiguration.ts` | checkout paths may try to create Stripe sessions | Use `false` unless you are intentionally testing checkout. |
| `STRIPE_LIVE_PAYMENTS_APPROVED` | yes to keep live blocked | no | yes if checkout is enabled | no | `false` | `src/server/billing/stripeCheckout.ts`, `src/server/billing/stripeLiveDiagnostics.ts` | live checkout blocked or, if misused, risky billing behavior | Must stay false in preview. |
| `STRIPE_STARTER_PRICE_ID` | no for A/B; yes for C | no | yes only when checkout enabled | no | unset for A/B; `price_...` test id for C | `src/server/billing/billingConfiguration.ts`, `src/config/billing.ts` | checkout cannot create hosted session | Test-only IDs only; never live IDs in preview. |
| `STRIPE_PROFESSIONAL_PRICE_ID` | no for A/B; yes for C | no | yes only when checkout enabled | no | unset for A/B; `price_...` test id for C | `src/server/billing/billingConfiguration.ts`, `src/config/billing.ts` | checkout cannot create hosted session | Test-only IDs only; never live IDs in preview. |
| `STRIPE_MSP_PRICE_ID` | no for A/B; yes for C | no | yes only when checkout enabled | no | unset for A/B; `price_...` test id for C | `src/server/billing/billingConfiguration.ts`, `src/config/billing.ts` | checkout cannot create hosted session | Test-only IDs only; never live IDs in preview. |
| `WISE_API_URL` | no | no | only if Wise automation is enabled later | no | unset for preview; keep manual invoice flow | `src/server/billing/admin/billingProviderStatusService.ts`, `src/server/billing/invoiceRequestService.ts` | manual invoice status may still work, but automation status changes | Wise should remain manual in preview. |
| `WISE_API_TOKEN` | no | no | only if Wise automation is enabled later | yes | unset for preview | `src/server/billing/admin/billingProviderStatusService.ts` | token-bearing automation becomes available | Do not enable Wise automation in this milestone. |
| `WISE_PROFILE_ID` | no | no | only if Wise automation is enabled later | no | unset for preview | `src/server/billing/admin/billingProviderStatusService.ts` | status checks may remain manual-only | Manual invoice/bank transfer is the intended preview path. |
| `RESEND_API_KEY` | no | no | only for password recovery email | yes | unset unless you explicitly want preview email delivery | `src/lib/account-recovery.ts` | password recovery falls back to manual mode | Optional for preview. |
| `EMAIL_FROM` | no | no | only for password recovery email | no | unset unless you explicitly want preview email delivery | `src/lib/account-recovery.ts` | password recovery falls back to manual mode | Optional for preview. |
| `AI_ADVISORY_ENABLED` | no for public-only preview | no | yes only if AI advisory is intentionally enabled | no | `false` | `src/server/ai/aiAdvisoryConfig.ts`, `src/server/ai/aiRuntimeStatus.ts` | AI advisory may activate unexpectedly | Keep disabled in preview unless you are testing AI. |
| `AI_ADVISORY_PROVIDER` | no for public-only preview | no | yes only if AI advisory is intentionally enabled | no | `disabled` | `src/server/ai/aiAdvisoryConfig.ts`, `src/server/ai/aiRuntimeStatus.ts` | provider choice may drift | Use `disabled` for preview safety. |
| `AI_ADVISORY_MODEL` | no | no | only if AI is enabled | no | unset or `gemini-2.5-flash` only in AI test hito | `src/server/ai/aiAdvisoryConfig.ts` | model selection may drift | Not needed for preview if AI is disabled. |
| `AI_ADVISORY_TIMEOUT_MS` | no | no | only if AI is enabled | no | unset or default | `src/server/ai/aiAdvisoryConfig.ts` | AI requests may time out unexpectedly | Optional tuning only. |
| `AI_ADVISORY_MAX_INPUT_CHARS` | no | no | only if AI is enabled | no | unset or default | `src/server/ai/aiAdvisoryConfig.ts` | AI prompt size may drift | Optional tuning only. |
| `AI_ADVISORY_MAX_OUTPUT_CHARS` | no | no | only if AI is enabled | no | unset or default | `src/server/ai/aiAdvisoryConfig.ts` | AI output size may drift | Optional tuning only. |
| `AI_ADVISORY_FALLBACK_PROVIDER` | no | no | only if AI is enabled | no | `opencode_go` or unset | `src/server/ai/aiAdvisoryConfig.ts`, `src/server/ai/aiRuntimeStatus.ts` | fallback behavior may be unclear | Optional tuning only. |
| `AI_ADVISORY_FALLBACK_MODEL` | no | no | only if AI is enabled | no | `glm-5.1` or unset | `src/server/ai/aiAdvisoryConfig.ts` | fallback behavior may be unclear | Optional tuning only. |
| `OPENCODE_GO_BASE_URL` | no | no | only if AI fallback provider is `opencode_go` | no | unset or default OpenCode Go URL | `src/server/ai/aiAdvisoryConfig.ts` | fallback provider endpoint may drift | Optional tuning only. |
| `GEMINI_API_KEY` | no | no | only if AI provider is Gemini | yes | unset for preview | `src/server/ai/aiAdvisoryConfig.ts`, `src/server/ai/aiRuntimeStatus.ts` | AI advisory cannot use Gemini | Keep absent in preview unless you are intentionally testing AI. |
| `OPENAI_API_KEY` | no | no | only if AI provider is OpenAI | yes | unset for preview | `src/server/ai/aiAdvisoryConfig.ts`, `src/server/ai/aiRuntimeStatus.ts` | AI advisory cannot use OpenAI | Keep absent in preview unless you are intentionally testing AI. |
| `OPENCODE_API_KEY` | no | no | only if AI provider is OpenCode Go | yes | unset for preview | `src/server/ai/aiAdvisoryConfig.ts`, `src/server/ai/aiRuntimeStatus.ts` | fallback provider unavailable | Keep absent in preview unless you are intentionally testing AI. |

## 6. Variables Prohibited In Preview

Do not set these for the preview milestone:

- `STRIPE_CHECKOUT_MODE=live`
- `STRIPE_LIVE_PAYMENTS_APPROVED=true`
- production Stripe secret key
- production R2 access key / secret
- production bucket as the active preview bucket
- production Neon database URL unless explicitly approved for a separate production smoke
- live webhook secrets
- Wise automation secrets if the goal is manual invoice flow only
- Hostinger DNS/email changes

## 7. Origin / Auth / Checkout Risks

- `*.vercel.app` is not currently allowed by the checkout origin normalization logic.
- `trustedOrigins` in Better Auth does not include Vercel preview hosts.
- `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` should point to the preview deployment URL, but that alone does not make auth/checkout full-fidelity.
- Until origin policy is changed, the preview should be treated as public-only or R2-enabled with limited auth/checkout fidelity.

## 8. Neon Preview Recommendation

- Use a dedicated Neon preview or staging branch.
- Load `DATABASE_URL` from that branch only.
- Keep `DIRECT_URL` unset unless a future Neon direct-connect flow explicitly needs it.
- Do not run migrations in this hito.
- Do not use production for preview verification.

## 9. R2 Preview Recommendation

- Use only `shift-evidence-preview-evidence`.
- Keep `shift-evidence-prod-evidence` out of preview writes.
- Load only the preview R2 token in Vercel Preview.
- Keep objects private.
- Do not create public bucket access.

## 10. Stripe / Wise Boundary

- Stripe should stay disabled or test-only in preview.
- Never set live Stripe approval flags in preview.
- Never use live Stripe secrets in preview.
- Wise remains manual invoice / bank transfer only.
- Do not automate Wise transfers in this milestone.

## 11. What to Load in Vercel Preview

Minimum recommended preview config:

- `DATABASE_URL=<Neon preview/staging url>`
- `BETTER_AUTH_SECRET=<preview secret>`
- `BETTER_AUTH_URL=<preview url>`
- `NEXT_PUBLIC_APP_URL=<preview url>`
- `ADMIN_EMAILS=<operator emails>`
- `STORAGE_DRIVER=r2`
- `R2_ACCOUNT_ID=<account id>`
- `R2_S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com`
- `R2_BUCKET_PREVIEW=shift-evidence-preview-evidence`
- `R2_BUCKET_PROD=shift-evidence-prod-evidence`
- `R2_ACCESS_KEY_ID=<preview access key id>`
- `R2_SECRET_ACCESS_KEY=<preview secret access key>`
- `MAX_UPLOAD_SIZE_MB=50`
- `STRIPE_CHECKOUT_ENABLED=false`
- `STRIPE_CHECKOUT_MODE=test`
- `STRIPE_LIVE_PAYMENTS_APPROVED=false`

Recommended only if you want rate-limited flows to work in preview:

- `UPSTASH_REDIS_REST_URL=<preview/staging url>`
- `UPSTASH_REDIS_REST_TOKEN=<preview/staging token>`

Recommended to leave unset for preview unless you explicitly enable them:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_PROFESSIONAL_PRICE_ID`
- `STRIPE_MSP_PRICE_ID`
- `WISE_API_URL`
- `WISE_API_TOKEN`
- `WISE_PROFILE_ID`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `AI_ADVISORY_ENABLED`
- `AI_ADVISORY_PROVIDER`
- `AI_ADVISORY_MODEL`
- `AI_ADVISORY_FALLBACK_PROVIDER`
- `AI_ADVISORY_FALLBACK_MODEL`
- `AI_ADVISORY_TIMEOUT_MS`
- `AI_ADVISORY_MAX_INPUT_CHARS`
- `AI_ADVISORY_MAX_OUTPUT_CHARS`
- `OPENCODE_GO_BASE_URL`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`

## 12. What Not to Load

- Any live Stripe secret or live checkout approval.
- Any production R2 access token or production bucket as the active preview bucket.
- Any production Neon connection string for preview testing.
- Any Hostinger DNS/email changes.
- Any live webhook configuration.
- Any real customer data.

## 13. Checklist Before Preview Deploy

- `git diff --check` passes.
- `npm run typecheck` passes.
- `npm run lint` passes.
- Preview env values are prepared from the table above.
- Preview R2 token is preview-only and scoped to the preview bucket.
- Preview DB points to Neon staging/preview.
- Auth origin and checkout origin policy are acknowledged as limited on `*.vercel.app`.
- Stripe live remains disabled.
- Wise remains manual.

## 14. Checklist After Preview Deploy

- Public routes load.
- Public PDFs load.
- Demo routes load.
- R2 preview write/read/delete still works in the preview deployment.
- Upload/download flows are verified with synthetic data only.
- Auth and checkout behavior is documented as limited unless origin policy is fixed.
- No route references the production bucket.
- No route tries to use live Stripe.
- No real data is created.

## 15. Recommendation

Vercel preview is ready for R2-backed public preview, but auth and checkout are still limited by origin policy.

Final verdict:

**Ready for Vercel preview with R2, but auth/checkout limited.**
