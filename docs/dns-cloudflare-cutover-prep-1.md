# DNS Cloudflare Cutover Prep 1

Fecha: 2026-06-05

## 1. Objetivo

Auditar y preparar el cutover DNS final de `shiftevidence.com` usando Cloudflare como DNS authority, sin cambios DNS destructivos, sin romper correo, sin activar Stripe live y sin completar pagos.

## 2. Estado inicial

| Area | Estado inicial |
| --- | ---: |
| DNS-CLOUDFLARE-CUTOVER-PREP-1 | 0% |
| Production/cutover readiness | 99% |
| Vercel readiness | 99% |
| DB readiness | 98% |
| Storage/R2 readiness | 100% |
| Upstash/rate limit readiness | 100% |
| Billing readiness | 99% |
| Stripe live readiness | 94% |
| Admin ops | 98% |
| General technical | 99% |

Baseline:

- Production runtime validado en Vercel project `shiftevidence`.
- Stripe production quedo safe-off despues del hosted checkout smoke:
  - `STRIPE_CHECKOUT_ENABLED=false`.
  - `STRIPE_CHECKOUT_MODE=test`.
  - `STRIPE_LIVE_PAYMENTS_APPROVED=false`.
- No pagos reales completados.
- No grants.
- No entitlements.
- No cutover publico final ejecutado en este hito.
- `main` protegido contra auto-deploy productivo por `vercel.json`.

## 3. Auditoria local

Repositorio:

- Branch: `main`.
- HEAD: `96025f40d728d2d22ed4ae03e2d290deb011eb24`.
- `origin/main`: `96025f40d728d2d22ed4ae03e2d290deb011eb24`.
- `origin/preview`: `5c8b695eb3c20b709db30b00d7cddc6164cf2fed`.
- Repo limpio al iniciar.
- No habia commits locales ahead/behind.
- No habia stashes.
- No habia untracked files visibles.
- `.env.local` no esta trackeado.
- `.env.r2-smoke.local` no esta trackeado.

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

## 4. DNS authority

Public DNS:

| Check | Resultado |
| --- | --- |
| NS `shiftevidence.com` | `alex.ns.cloudflare.com`, `danica.ns.cloudflare.com` |
| SOA primary | `alex.ns.cloudflare.com` |
| SOA responsible mail | `dns.cloudflare.com` |
| SOA serial | `2406169094` |
| Default TTL | 1800 seconds |

Conclusion:

- Cloudflare is the current authoritative DNS provider.
- Hostinger should no longer be assumed as DNS authority.
- Hostinger records remain relevant for email.

DNSSEC:

- No delegated DS/DNSKEY signal was confirmed from local public DNS tooling.
- Treat DNSSEC status as not confirmed from CLI; do not change DNSSEC without owner approval.

## 5. Cloudflare zone audit

Zone:

- `shiftevidence.com`.
- Cloudflare dashboard zone is active and accessible.
- DNS setup visible as Full.

DNS records visible in Cloudflare:

| Host | Type | Content | Proxy | TTL | Purpose |
| --- | --- | --- | --- | --- | --- |
| `shiftevidence.com` | A | `76.76.21.21` | DNS only | Auto | Vercel apex |
| `www.shiftevidence.com` | CNAME | `cname.vercel-dns.com` | DNS only | Auto | Vercel www |
| `autoconfig.shiftevidence.com` | CNAME | `autoconfig.mail.hostinger.com` | DNS only | Auto | Hostinger mail client config |
| `autodiscover.shiftevidence.com` | CNAME | `autodiscover.mail.hostinger.com` | DNS only | Auto | Hostinger mail client config |
| `hostingermail-a._domainkey.shiftevidence.com` | CNAME | `hostingermail-a.dkim.mail.hostinger.com` | DNS only | Auto | Hostinger DKIM |
| `hostingermail-b._domainkey.shiftevidence.com` | CNAME | `hostingermail-b.dkim.mail.hostinger.com` | DNS only | Auto | Hostinger DKIM |
| `hostingermail-c._domainkey.shiftevidence.com` | CNAME | `hostingermail-c.dkim.mail.hostinger.com` | DNS only | Auto | Hostinger DKIM |
| `shiftevidence.com` | MX | `mx1.hostinger.com` priority 5 | DNS only | Auto | Hostinger inbound mail |
| `shiftevidence.com` | MX | `mx2.hostinger.com` priority 10 | DNS only | Auto | Hostinger inbound mail |
| `_dmarc.shiftevidence.com` | TXT | `v=DMARC1; p=none` | DNS only | Auto | DMARC |
| `shiftevidence.com` | TXT | `v=spf1 include:_spf.mail.hostinger.com ~all` | DNS only | Auto | Hostinger SPF |
| `mail.shiftevidence.com` | MX | `inbound-smtp.sa-east-1.amazonaws.com` priority 10 | DNS only | Auto | AWS SES inbound |
| `send.mail.shiftevidence.com` | MX | `feedback-smtp.sa-east-1.amazonses.com` priority 10 | DNS only | Auto | AWS SES feedback |
| `send.mail.shiftevidence.com` | TXT | `v=spf1 include:amazonses.com ~all` | DNS only | Auto | AWS SES SPF |
| `resend._domainkey.mail.shiftevidence.com` | TXT | DKIM public key present | DNS only | Auto | Resend/AWS mail signing |

No records were edited.

## 6. Vercel domains audit

Project:

- Vercel project: `shiftevidence`.
- Project ID: `prj_vPebqKyHjmKQgoyvRpugXS6aulpP`.
- Latest production deployment: `dpl_6qMf4WZ3nC7s6GpwWQgbbreUyfQG`.
- Latest production URL: `shiftevidence-4yyufzm6l-shift-evidence.vercel.app`.
- Latest production state: READY.

Domains attached to the project:

- `shiftevidence.com`.
- `www.shiftevidence.com`.
- `infra-evidence.vercel.app`.
- `shiftevidence-shift-evidence.vercel.app`.
- `shiftevidence-diegoperezroca-4286-shift-evidence.vercel.app`.

Vercel CLI observations:

- `vercel project ls` shows latest production URL as `https://www.shiftevidence.com`.
- `vercel domains inspect shiftevidence.com` finds the domain under team `shift-evidence` and attached to project `shiftevidence`.
- `vercel domains inspect www.shiftevidence.com` finds the domain under team `shift-evidence` and attached to project `shiftevidence`.
- The CLI still displayed intended/current nameserver rows referencing old Hostinger nameservers (`ns1.dns-parking.com`, `ns2.dns-parking.com`), which conflicts with public DNS and Cloudflare dashboard evidence.

Interpretation:

- Public resolution and live HTTP responses prove the current web path is Vercel-backed.
- The Vercel nameserver display should be treated as stale/inconsistent metadata until rechecked in the dashboard.
- No DNS changes should be made solely based on that CLI nameserver display.

## 7. Web DNS comparison

| Host | Cloudflare record | Proxy status | Vercel expected | Current result | Action |
| --- | --- | --- | --- | --- | --- |
| `shiftevidence.com` | A `76.76.21.21` | DNS only | Vercel apex A | Resolves to Vercel and redirects to `www` | No required change |
| `www.shiftevidence.com` | CNAME `cname.vercel-dns.com` | DNS only | Vercel CNAME | Resolves to Vercel and serves 200 | No required change |
| `infra-evidence.vercel.app` | Vercel platform alias | n/a | Vercel technical alias | Serves 200 from Vercel | Keep as technical alias |

Conclusion:

- Web DNS is already aligned with Vercel.
- Cloudflare proxy is off for web records, which avoids Vercel validation/proxy ambiguity.
- No web DNS change is required before controlled production cutover.

## 8. Email DNS inventory

Inbound/provider signals:

- Hostinger inbound mail is configured with MX at apex:
  - `mx1.hostinger.com` priority 5.
  - `mx2.hostinger.com` priority 10.
- Hostinger SPF is configured at apex.
- Hostinger DKIM CNAMEs are present.
- Hostinger autoconfig/autodiscover CNAMEs are present.
- DMARC exists with `p=none`.
- AWS SES/Resend-related mail records exist under `mail.shiftevidence.com` and `send.mail.shiftevidence.com`.

Email preservation checklist:

- Do not delete MX records.
- Do not replace apex SPF without merging includes.
- Do not touch Hostinger DKIM CNAMEs.
- Do not touch DMARC without a separate email policy decision.
- Do not activate Cloudflare Email Routing without owner approval.
- Do not proxy mail-related records.

Risk:

- Low if DNS web records remain unchanged.
- Medium if future edits accidentally replace SPF instead of merging.

## 9. SSL / proxy / cache / rules notes

Cloudflare SSL/TLS:

- Current encryption mode: Full.
- Automatic mode: disabled.
- Universal SSL/edge certificates section present.
- TLS 1.3: enabled.
- Automatic HTTPS Rewrites: enabled.
- Minimum TLS version: TLS 1.0 default.
- Always Use HTTPS appeared present but not checked in the visible dashboard state.

Proxy:

- Web records are DNS only.
- Email records are DNS only.
- No orange-cloud proxy is currently required for Vercel.

Workers/routes:

- Workers Routes page shows no routes configured.

Page rules / cache:

- No destructive Page Rule or cache change was made.
- Page Rules page did not expose an active rule list during the read-only audit.

Recommendation:

- Keep Vercel web records DNS-only for the final cutover unless a separate Cloudflare proxy/WAF hito is approved and smoked.
- Do not change SSL mode without rollback and smoke.

## 10. Proposed DNS changes

Required before cutover:

- None.

Optional:

- Recheck Vercel dashboard domain details visually because Vercel CLI displayed stale Hostinger nameserver metadata despite public DNS being Cloudflare.
- Consider correcting product/app references from `infra-evidence` to `shiftevidence` where relevant in a separate non-DNS cleanup.
- Consider raising DMARC policy later only after email deliverability is audited.
- Consider Cloudflare proxy/WAF only in a separate hito with Vercel-compatible settings and rollback.

Deferred/risky:

- Cloudflare orange-cloud proxy for apex/www.
- SSL mode changes.
- DNSSEC changes.
- Email Routing activation.
- SPF/DKIM/DMARC edits.
- CAA additions.

Changes executed:

- None.

## 11. Smoke current state

HTTP smoke:

| URL | Result | Server | Notes |
| --- | --- | --- | --- |
| `https://shiftevidence.com` | `308 Permanent Redirect` to `https://www.shiftevidence.com/` | Vercel | canonical apex-to-www redirect OK |
| `https://www.shiftevidence.com` | `200 OK` | Vercel | OK |
| `https://shiftevidence.com/pricing` | `308 Permanent Redirect` to `https://www.shiftevidence.com/pricing` | Vercel | canonical pricing redirect OK |
| `https://www.shiftevidence.com/pricing` | `200 OK` | Vercel | OK |
| `https://infra-evidence.vercel.app` | `200 OK` | Vercel | technical alias OK |

No observed:

- Hostinger page.
- Cloudflare error page.
- Vercel error page.
- HTTPS failure.
- Canonical redirect loop.

## 12. Rollback plan

Current web records to preserve:

- Apex A: `76.76.21.21`, DNS only, TTL Auto.
- `www` CNAME: `cname.vercel-dns.com`, DNS only, TTL Auto.

If a future DNS change breaks web:

1. Restore apex A to `76.76.21.21`.
2. Restore `www` CNAME to `cname.vercel-dns.com`.
3. Keep both DNS only unless Cloudflare proxy is explicitly part of the approved rollback.
4. Verify:
   - `nslookup shiftevidence.com`.
   - `nslookup www.shiftevidence.com`.
   - `curl -I https://shiftevidence.com`.
   - `curl -I https://www.shiftevidence.com`.
   - `curl -I https://www.shiftevidence.com/pricing`.

If a future DNS change affects email:

1. Restore Hostinger MX at apex:
   - `mx1.hostinger.com` priority 5.
   - `mx2.hostinger.com` priority 10.
2. Restore apex SPF exactly or with approved merged includes.
3. Restore Hostinger DKIM CNAMEs.
4. Restore DMARC.
5. Restore SES/Resend subdomain mail records if affected.
6. Do not enable Cloudflare Email Routing as rollback unless separately approved.

Expected propagation:

- Cloudflare DNS TTL Auto observed on records.
- Public resolver changes can still vary by resolver cache.
- Use both local resolver and `1.1.1.1` for verification.

## 13. Security review

Confirmed:

- No DNS changes.
- No DNS destructive action.
- No Cloudflare API token printed.
- No registrar token printed.
- No Vercel env pull.
- No secrets in docs.
- No Stripe live activation.
- No payment.
- No card.
- No webhook live intencional.
- No grants.
- No entitlements.
- No DB destructive.
- No migrations.
- No `db push`.

## 14. Estado final

| Area | Estado final |
| --- | ---: |
| DNS-CLOUDFLARE-CUTOVER-PREP-1 | 100% |
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
| General technical | 99% |

Status:

- Complete.
- DNS is already Cloudflare-authoritative and Vercel-aligned.
- No DNS changes required before controlled cutover.

## 15. Next hito

Recommended:

- `PRODUCTION-CUTOVER-CONTROLLED`.

Optional before cutover:

- `DNS-CLOUDFLARE-DOMAIN-METADATA-RECHECK-1` if the Vercel CLI nameserver metadata mismatch should be resolved visually before launch.
