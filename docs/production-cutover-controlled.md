# Production Cutover Controlled

Fecha: 2026-06-05

## 1. Objetivo

Ejecutar el cutover productivo controlado final de Shift Evidence, validando produccion end-to-end sin activar pagos live, sin completar pagos, sin DNS changes y sin acciones destructivas.

## 2. Estado inicial

| Area | Estado inicial |
| --- | ---: |
| PRODUCTION-CUTOVER-CONTROLLED | 0% |
| Production/cutover readiness | 99% |
| Vercel readiness | 99% |
| DNS readiness | 98% |
| Email/DNS readiness | 96% |
| DB readiness | 98% |
| Storage/R2 readiness | 100% |
| Upstash/rate limit readiness | 100% |
| Billing readiness | 99% |
| Stripe live readiness | 94% |
| Admin ops | 98% |
| PDF/report quality | 99% |
| General technical | 99% |

Contexto:

- Proyecto productivo canonico: `shiftevidence`.
- Dominio productivo: `https://www.shiftevidence.com`.
- Apex `https://shiftevidence.com` redirige a `www`.
- DNS authority actual: Cloudflare.
- Stripe production queda safe-off por defecto.
- No public launch masivo aprobado.
- No live payments aprobados.

## 3. Auditoria local

Repositorio:

- Branch: `main`.
- HEAD: `efe19b09974a42c1ad9829d73bf15731be362fbf`.
- `origin/main`: `efe19b09974a42c1ad9829d73bf15731be362fbf`.
- `origin/preview`: `5c8b695eb3c20b709db30b00d7cddc6164cf2fed`.
- Repo limpio al iniciar.
- No commits locales ahead/behind.
- No stashes.
- No untracked files visibles.
- `.env.local` no trackeado.
- `.env.r2-smoke.local` no trackeado.

Vercel Git hardening:

```json
{
  "git": {
    "deploymentEnabled": {
      "main": false,
      "preview": true
    }
  }
}
```

## 4. Deployment actual

Vercel project:

- Project: `shiftevidence`.
- Project ID: `prj_vPebqKyHjmKQgoyvRpugXS6aulpP`.
- Latest production deployment: `dpl_6qMf4WZ3nC7s6GpwWQgbbreUyfQG`.
- Deployment URL: `shiftevidence-4yyufzm6l-shift-evidence.vercel.app`.
- Status: READY.
- Target: Production.

Production aliases/domains:

- `www.shiftevidence.com`.
- `shiftevidence.com`.
- `infra-evidence.vercel.app`.
- Vercel technical aliases.

Previous rollback candidate:

- `dpl_AnX2qEidHNGToMszj6dtCPUii3s1`.

No redeploy was executed in this hito.

## 5. DNS / Cloudflare confirmation

Public DNS:

| Check | Resultado |
| --- | --- |
| NS | `alex.ns.cloudflare.com`, `danica.ns.cloudflare.com` |
| Apex | `76.76.21.21` |
| WWW | CNAME to `cname.vercel-dns.com` |
| MX | `mx1.hostinger.com` priority 5, `mx2.hostinger.com` priority 10 |

HTTP:

| URL | Resultado |
| --- | --- |
| `https://shiftevidence.com` | `308` to `https://www.shiftevidence.com/` |
| `https://www.shiftevidence.com` | `200 OK` |
| `https://shiftevidence.com/pricing` | `308` to `https://www.shiftevidence.com/pricing` |
| `https://www.shiftevidence.com/pricing` | `200 OK` |

Confirmed:

- No DNS changes.
- No Cloudflare proxy changes.
- No MX/SPF/DKIM/DMARC changes.
- No Hostinger changes.
- No redirect loop.
- No Hostinger page.
- No Cloudflare error page.
- No Vercel error page.

## 6. Public route smoke

Base: `https://www.shiftevidence.com`.

| Route | Resultado |
| --- | --- |
| `/` | `200 OK` |
| `/pricing` | `200 OK` |
| `/demo` | `200 OK` |
| `/demo/replay` | `200 OK` |
| `/demo/workspace` | `200 OK` |
| `/sample-report` | `200 OK` |
| `/vmware-to-proxmox-readiness` | `200 OK` |
| `/security` | `200 OK` |
| `/support` | `200 OK` |
| `/partners` | `200 OK` |

Public HTML scan:

- No Hostinger branding found.
- No `Infra Evidence` branding found.
- No `infra-evidence` reference found in public route HTML.

## 7. PDF / sample report smoke

| Asset | Status | Content-Type | Magic | Page count |
| --- | --- | --- | --- | ---: |
| `/demo/reports/balanced-mid-market` | `200 OK` | `application/pdf` | `%PDF` | 7 |
| `/sample-reports/proxmox-migration-readiness-sample-report.pdf` | `200 OK` | `application/pdf` | `%PDF` | 13 |
| `/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf` | `200 OK` | `application/pdf` | `%PDF` | 23 |

Result:

- Public sample PDF OK.
- Premium sample PDF OK.
- Demo report PDF OK.
- No broken PDF asset detected.

## 8. Auth smoke

Unauthenticated:

- `/dashboard` returns `307` to `/sign-in`.
- `/sign-in` returns `200 OK`.

Authenticated browser smoke:

- `/dashboard` loads authenticated dashboard.
- Dashboard content visible.
- Assessments visible.
- No sign-in fallback while authenticated.
- No Better Auth origin mismatch observed.
- No 500 observed.

No password, cookie, session token or user secret was documented.

## 9. Admin smoke

Admin browser smoke:

| Route | Resultado |
| --- | --- |
| `/dashboard/admin` | OK |
| `/dashboard/admin/billing` | OK |
| `/dashboard/admin/pricing` | OK |
| `/dashboard/admin/unlock-requests` | OK |

Confirmed:

- Admin shell visible.
- Billing/admin warnings visible.
- Stripe live diagnostic visible.
- Billing page states checkout mode test and checkout disabled.
- Manual fulfillment warnings visible.
- Unlock requests page visible.
- No access denied.
- No raw provider error.

Not executed:

- No grant.
- No revoke.
- No mark paid.
- No mark invoice sent.
- No refund.
- No cancel.
- No pricing edit.
- No delete.

## 10. R2 / evidence status

Prior hito status:

- R2 production upload/download/delete from app production: OK.
- Hash/content verification: OK.
- No customer data.

Controlled cutover smoke:

- Existing synthetic assessment evidence page loaded.
- Evidence tab visible.
- Upload/history UI visible.
- No storage error observed.

No new upload was performed in this hito because production R2 hash smoke was already closed.

## 11. Upstash / rate limit status

Covered flows:

- Public routes.
- Authenticated dashboard.
- Admin pages.
- Billing pages.

Result:

- No unexpected `Too many requests`.
- No Upstash error observed.
- No stress test performed.
- No token exposed.

## 12. Billing safe-off status

Checkout pages:

| Route | Resultado |
| --- | --- |
| `/billing/checkout/starter` | `200 OK` |
| `/billing/checkout/professional` | `200 OK` |
| `/billing/checkout/msp` | `200 OK` |

Checkout start routes:

| Route | Resultado |
| --- | --- |
| `/billing/checkout/starter/start` | `303` to `checkout_disabled` |
| `/billing/checkout/professional/start` | `303` to `checkout_disabled` |
| `/billing/checkout/msp/start` | `303` to `checkout_disabled` |

Bank transfer:

| Route | Resultado |
| --- | --- |
| `/billing/bank-transfer/starter` | `200 OK` |
| `/billing/bank-transfer/professional` | `200 OK` |
| `/billing/bank-transfer/msp` | `200 OK` |

Result:

- Stripe hosted checkout not reached.
- No payment session created.
- Bank transfer remains manual.
- No Wise automation.

## 13. Stripe safety

Runtime behavior confirms:

- Checkout disabled in production.
- Checkout mode remains safe for public routes.
- Live payment approval is not active by behavior.

Admin billing diagnostics observed:

- Checkout mode: test.
- Checkout enabled: false.
- Blocker visible for live smoke approval not present.
- Warning visible that public checkout remains disabled.
- Server-only diagnostic states it does not create Checkout Session, PaymentIntent, Customer, BillingEvent or grants.

Logs:

- No `checkout.session.completed` found in the smoke window.
- No `payment_intent.succeeded` found in the smoke window.

No live payment was completed.

## 14. Logs review

Vercel runtime logs reviewed for the smoke window.

No logs found for:

- HTTP 500.
- error/fatal level logs.
- `checkout.session.completed`.
- `payment_intent.succeeded`.
- `origin mismatch`.
- `storage`.
- `Too many requests`.

One 500 query returned no findings but warned that the runtime log query timed out before all pages were fetched. Error/fatal query also returned no logs.

No observed:

- DATABASE_URL leakage.
- R2 key leakage.
- Upstash token leakage.
- Better Auth secret leakage.
- Stripe secret leakage.
- Webhook secret leakage.
- cookies/session leakage.
- payment completed.
- storage errors.
- auth origin errors.

## 15. Rollback readiness

Rollback possible: yes.

Current production deployment:

- `dpl_6qMf4WZ3nC7s6GpwWQgbbreUyfQG`.

Previous rollback candidate:

- `dpl_AnX2qEidHNGToMszj6dtCPUii3s1`.

Rollback not needed because smoke passed.

Rollback principles:

- Roll back Vercel to previous production deployment if needed.
- Keep Stripe safe-off.
- Do not change DNS.
- Preserve R2 and DB.
- No destructive rollback.

## 16. Go/no-go verdict

Verdict:

- Controlled Production Ready with minor non-blocking observations.

Readiness criteria:

- Public routes OK.
- Auth/admin OK.
- PDFs OK.
- R2/DB/Upstash ready.
- Billing safe-off OK.
- DNS OK.
- Email DNS preserved.
- Logs clean for the smoke window.
- Rollback available.

Minor non-blocking observations:

- Vercel CLI domain metadata previously displayed stale Hostinger nameserver rows, while public DNS and Cloudflare confirmed Cloudflare authority.
- Vercel runtime log query for 500 returned no findings but timed out before all pages were fetched.
- Stripe live readiness is not paid-live ready by default; final real payment test still requires a separate approval/hito.

Not approved:

- Full public launch.
- Paid live launch.
- Ads launch.
- Stripe payment live.
- Customer-ready payment collection.

## 17. What was not touched

- No DNS records.
- No Cloudflare proxy.
- No Hostinger.
- No MX/SPF/DKIM/DMARC.
- No Stripe live payment.
- No card.
- No webhook live intentional.
- No grants.
- No entitlements.
- No mark paid.
- No mark invoice sent.
- No Wise automation.
- No DB destructive.
- No migrations.
- No `db push`.
- No customer files.
- No real RVTools.
- No `vercel env pull`.
- No deploy or redeploy.

## 18. Security review

Confirmed:

- No secrets in docs.
- No secrets in git.
- No env values printed.
- No session tokens documented.
- No cookies documented.
- No real customer data.
- No production admin email documented.

## 19. Estado final

| Area | Estado final |
| --- | ---: |
| PRODUCTION-CUTOVER-CONTROLLED | 100% |
| Production/cutover readiness | 100% |
| Vercel readiness | 99% |
| DNS readiness | 99% |
| Email/DNS readiness | 97% |
| DB readiness | 98% |
| Storage/R2 readiness | 100% |
| Upstash/rate limit readiness | 100% |
| Billing readiness | 99% |
| Stripe live readiness | 94% |
| Admin ops | 99% |
| PDF/report quality | 100% |
| General technical | 99% |

## 20. Next hito

Recommended:

- `CUSTOMER-PILOT-1`.

Optional:

- `STRIPE-LIVE-PAYMENT-FINAL-GATE-1` only if/when the owner wants a real payment test.
- `GOOGLE-ADS-LAUNCH-PREP-1`.

## 21. Follow-up: Market Activation 3-4-5

Fecha: 2026-06-05

`MARKET-ACTIVATION-3-4-5` did not change the production cutover decision:

- Production remains ready for controlled availability.
- Public launch masivo was not approved.
- Paid Ads were not approved.
- Live payment collection was not approved.
- Recommended commercial path remains soft availability plus private outreach.
