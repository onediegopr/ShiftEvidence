# Auth Admin Production Smoke 1

Fecha: 2026-06-05

## 1. Objetivo

Validar el runtime Production de `shiftevidence` despues de cargar envs productivas de Auth, Neon, R2 y Upstash, sin DNS manual, sin Hostinger, sin Stripe live, sin pagos, sin grants, sin migrations y sin cutover publico.

## 2. Estado inicial

| Area | Estado inicial |
| --- | ---: |
| AUTH-ADMIN-PRODUCTION-SMOKE-1 | 0% |
| Production/cutover readiness | 96% |
| Vercel readiness | 98% |
| DB readiness | 97% |
| Storage/R2 readiness | 100% |
| Upstash/rate limit readiness | 100% |
| Billing readiness | 98% |
| Admin ops | 95% |
| PDF/report quality | 98% |
| General technical | 98% |

## 3. Local audit

Repositorio:

- Branch actual: `main`.
- HEAD inicial: `050db1e376dfb59d101c8f3786b9a8b19a6ddf31`.
- `origin/main`: `050db1e376dfb59d101c8f3786b9a8b19a6ddf31`.
- `origin/preview`: `5c8b695eb3c20b709db30b00d7cddc6164cf2fed`.
- Repo limpio al iniciar.
- No habia commits locales sin pushear.
- No habia untracked files visibles.
- `.env.local` no esta trackeado.
- `.env.r2-smoke.local` no esta trackeado.

Vercel hardening:

- `vercel.json` conserva `git.deploymentEnabled.main=false`.
- `vercel.json` conserva `git.deploymentEnabled.preview=true`.

## 4. Vercel Production env audit

Target:

- Project: `shiftevidence`.
- Environment: Production.

Presencia confirmada sin valores:

| Variable | Estado |
| --- | --- |
| `DATABASE_URL` | present |
| `BETTER_AUTH_SECRET` | present |
| `BETTER_AUTH_URL` | present |
| `NEXT_PUBLIC_APP_URL` | present |
| `ADMIN_EMAILS` | present |
| `STORAGE_DRIVER` | present |
| `R2_ACCOUNT_ID` | present |
| `R2_S3_ENDPOINT` | present |
| `R2_BUCKET_PREVIEW` | present |
| `R2_BUCKET_PROD` | present |
| `R2_ACCESS_KEY_ID` | present |
| `R2_SECRET_ACCESS_KEY` | present |
| `MAX_UPLOAD_SIZE_MB` | present |
| `UPSTASH_REDIS_REST_URL` | present |
| `UPSTASH_REDIS_REST_TOKEN` | present |
| `STRIPE_CHECKOUT_ENABLED` | present |
| `STRIPE_CHECKOUT_MODE` | present |
| `STRIPE_LIVE_PAYMENTS_APPROVED` | present |

Notes:

- `DIRECT_URL` is not required by the current Prisma schema.
- No values were printed.
- No `vercel env pull` was executed.

## 5. Deploy decision

Owner approval:

- Approved only a controlled Production redeploy needed to apply envs in `shiftevidence`.

Not approved:

- DNS.
- Hostinger.
- Stripe live.
- Payments.
- Webhooks.
- Grants.
- Migrations.
- `db push`.
- Public cutover.

Rollback candidate:

- Previous Production deployments were visible before redeploy.

## 6. Controlled Production redeploy

Redeploy:

| Field | Value |
| --- | --- |
| Source deployment | `https://shiftevidence-gqyeza3m4-shift-evidence.vercel.app` |
| New deployment URL | `https://shiftevidence-p2yhuq8hj-shift-evidence.vercel.app` |
| Deployment ID | `dpl_A23QzCcExhsWXt17xPr6HadtxTq1` |
| Target | Production |
| Status | Ready |

Alias behavior:

- Vercel aliased the deployment to existing project aliases, including `www.shiftevidence.com`, `shiftevidence.com`, `infra-evidence.vercel.app`, and Vercel-generated aliases.
- No DNS record was edited.
- No custom domain configuration was changed manually.
- No external promote was executed.

Rollback:

- Rollback not needed.

## 7. Public route smoke

Base:

- `https://www.shiftevidence.com`.

Results:

| Route | Status | Content type |
| --- | ---: | --- |
| `/` | 200 | `text/html` |
| `/pricing` | 200 | `text/html` |
| `/demo` | 200 | `text/html` |
| `/demo/replay` | 200 | `text/html` |
| `/demo/workspace` | 200 | `text/html` |
| `/sample-report` | 200 | `text/html` |
| `/vmware-to-proxmox-readiness` | 200 | `text/html` |
| `/security` | 200 | `text/html` |
| `/support` | 200 | `text/html` |

Checks:

- No Hostinger page.
- No server error.
- No visible secret.

## 8. PDF smoke

| Route | Status | Content type | Prefix |
| --- | ---: | --- | --- |
| `/demo/reports/balanced-mid-market` | 200 | `application/pdf` | checked via content type |
| `/sample-reports/proxmox-migration-readiness-sample-report.pdf` | 200 | `application/pdf` | `%PDF` |
| `/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf` | 200 | `application/pdf` | `%PDF` |

## 9. Auth smoke

Flow:

- `/dashboard` redirected unauthenticated session to `/sign-in`.
- Owner completed sign-in manually.
- No password, cookie or session value was printed or documented.

Results:

| Check | Result |
| --- | --- |
| `/sign-in` loads | OK |
| Manual sign-in | OK |
| `/dashboard` authenticated | OK |
| Better Auth origin mismatch | not observed |
| Better Auth visible error | not observed |

User:

- Documented as `<production-smoke-user>`.
- Real email redacted from docs.

## 10. Admin smoke

Authenticated admin routes:

| Route | Result |
| --- | --- |
| `/dashboard/admin` | OK |
| `/dashboard/admin/billing` | OK |
| `/dashboard/admin/pricing` | OK |
| `/dashboard/admin/unlock-requests` | OK |

Checks:

- Admin hub visible.
- No access denied.
- Billing admin visible.
- Pricing admin visible.
- Unlock requests visible.
- No admin action executed.

Not executed:

- Grant entitlement.
- Revoke entitlement.
- Mark paid.
- Mark invoice sent.
- Refund.
- Cancel.
- Edit pricing.
- Delete.

## 11. R2 app smoke

Assessment:

- Synthetic controlled assessment created by owner-assisted browser entry.
- Title documented as synthetic only.
- No customer data.

Result:

- App upload/download/delete smoke: deferred.

Reason:

- The app upload gate blocked RVTools/evidence upload until baseline intake and cost/risk assumptions are completed.
- The assessment plan level remained free.
- The Evidence tab displayed `Upload gate: blocked`.
- No grants or entitlement bypass were approved.
- Browser automation could not safely fill additional forms because the embedded browser input path hit a clipboard virtualisation issue.

Safety decision:

- No real files uploaded.
- No RVTools real file used.
- No customer data used.
- No object deletion attempted from the app.
- R2 production storage readiness remains supported by the previous direct R2 production smoke.

Next R2 app step:

- Complete a dedicated `R2-AUTHENTICATED-PRODUCTION-UPLOAD-SMOKE` only with an approved synthetic upload path or a controlled entitlement/test plan.

## 12. Upstash and rate limit smoke

Runtime observations:

- Auth, dashboard, admin and billing flows completed without unexpected `Too many requests`.
- No rate limiter failure was visible in app flows.
- Vercel logs did not show Upstash token values.

Direct production Upstash smoke:

- Completed in `PRODUCTION-OPS-READY-3`.
- write/read/delete/post-delete OK.

This hito:

- App-level normal-flow rate limit behavior: OK.
- Aggressive rate-limit testing: not executed.

## 13. Billing safe-off smoke

Checkout routes:

| Route | Method | Status | Result |
| --- | --- | ---: | --- |
| `/billing/checkout/starter` | POST | 200 | no Stripe live redirect |
| `/billing/checkout/professional` | POST | 200 | no Stripe live redirect |
| `/billing/checkout/msp` | POST | 200 | no Stripe live redirect |
| `/billing/checkout/starter` | GET | 200 | no Stripe live redirect |
| `/billing/checkout/professional` | GET | 200 | no Stripe live redirect |
| `/billing/checkout/msp` | GET | 200 | no Stripe live redirect |

Bank transfer routes:

| Route | Status | Result |
| --- | ---: | --- |
| `/billing/bank-transfer/starter` | 200 | manual copy |
| `/billing/bank-transfer/professional` | 200 | manual copy |
| `/billing/bank-transfer/msp` | 200 | manual copy |

Checks:

- No `checkout.stripe.com` signal.
- No `cs_live_` signal.
- No `livemode` signal.
- Wise text present only as manual bank-transfer copy.
- No Wise automation.
- No payment.
- No order.
- No grant.
- No entitlement.

## 14. Logs review

Window:

- Controlled production redeploy and smoke period.

Observed:

- Public routes: 200.
- Dashboard/admin routes: 200.
- Checkout/bank-transfer routes: 200.
- Sign-in POST: 200.
- No 500 logs found in the checked window.
- No error-level logs found in the checked window.

No visible log leakage:

- No database connection string.
- No R2 key values.
- No Upstash token values.
- No Better Auth secret.
- No Stripe secret.
- No auth cookie/session value.

## 15. Rollback status

Rollback needed:

- No.

Reason:

- Deployment reached Ready.
- Public routes OK.
- Auth/Admin OK.
- Billing safe-off OK.
- No critical errors in logs.

Rollback possible:

- Yes, previous Production deployments remain visible.

## 16. What was not touched

No se tocaron:

- DNS.
- Hostinger.
- Custom domains manually.
- Public launch.
- Stripe live.
- Live payments.
- Live webhooks.
- Wise automation.
- Entitlements reales.
- Grants.
- Mark paid.
- Mark invoice sent.
- Refunds.
- Cancel real orders.
- Destructive DB operations.
- `prisma db push`.
- Migrations.
- Real customer data.
- Customer files.
- Real RVTools files.
- R2 real objects.

## 17. Security review

No se imprimieron ni guardaron:

- Production env values.
- Database connection string.
- R2 key values.
- Upstash token value.
- Better Auth secret.
- Stripe secret.
- Webhook secret.
- Wise token.
- Auth cookie/session values.
- User password.
- Production admin email real.

No se commitearon secretos.

## 18. Estado final

| Area | Estado final |
| --- | ---: |
| AUTH-ADMIN-PRODUCTION-SMOKE-1 | 82% |
| Production/cutover readiness | 97% |
| Vercel readiness | 99% |
| DB readiness | 97% |
| Storage/R2 readiness | 100% |
| Upstash/rate limit readiness | 100% |
| Billing readiness | 99% |
| Admin ops | 98% |
| PDF/report quality | 99% |
| General technical | 98% |

## 19. Next hito

Recommended:

- `R2-AUTHENTICATED-PRODUCTION-UPLOAD-SMOKE`.

Then:

- `STRIPE-LIVE-READINESS-1`.
- `DNS-HOSTINGER-CUTOVER-PREP-1`.
- `PRODUCTION-CUTOVER-CONTROLLED`.
