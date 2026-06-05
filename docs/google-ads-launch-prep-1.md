# Google Ads Launch Prep 1

Fecha: 2026-06-05

## 1. Objetivo

Preparar un lanzamiento controlado de Google Ads para Shift Evidence sin crear, activar ni publicar campanas, sin gastar presupuesto, sin tocar pagos live y sin agregar tracking todavia.

Principio estrategico:

- Capturar demanda caliente de equipos que ya estan evaluando salir de VMware o considerar Proxmox.
- No vender "software de migracion".
- Mensaje central: "Before migrating VMware to Proxmox, know what can break."

## 2. Estado inicial

| Area | Estado inicial |
| --- | ---: |
| GOOGLE-ADS-LAUNCH-PREP-1 | 0% |
| Production/cutover readiness | 100% |
| Pilot readiness | 95% |
| Commercial readiness | 82% |
| Billing readiness | 99% |
| Stripe live readiness | 94% |
| General technical | 99% |

Contexto:

- Production cutover controlled: complete.
- Controlled Production Ready: yes.
- Public launch masivo: no aprobado.
- Live payments: no aprobados.
- Google Ads launch: no aprobado.
- Billing safe-off activo.
- Customer pilot package listo.
- No prospecto/dataset/consentimiento todavia para piloto real.

## 3. Auditoria local

Repositorio:

- Branch: `main`.
- HEAD: `1ac01dfeb32313c3a1624a7f3ed50ee3d9ce99a1`.
- `origin/main`: `1ac01dfeb32313c3a1624a7f3ed50ee3d9ce99a1`.
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

## 4. Landing audit

Base: `https://www.shiftevidence.com`.

| Route | Status | Notes |
| --- | --- | --- |
| `/` | `200 OK` | CTA, RVTools, evidence, no agents/no production access present |
| `/vmware-to-proxmox-readiness` | `200 OK` | Recommended primary paid traffic landing |
| `/pricing` | `200 OK` | Pricing visible |
| `/sample-report` | `200 OK` | Sample report page visible |
| `/demo` | `200 OK` | Demo index visible |
| `/demo/replay` | `200 OK` | Replay visible |
| `/demo/workspace` | `200 OK` | Demo workspace visible |
| `/security` | `200 OK` | Security page visible |
| `/support` | `200 OK` | Support page visible |

Checks:

- No Hostinger page found.
- No Cloudflare/Vercel error found.
- No old `Infra Evidence` branding found.
- CTAs present.
- Trust points present across core routes.
- Demo and sample report routes load.

Recommended primary Ads landing:

- `https://www.shiftevidence.com/vmware-to-proxmox-readiness`.

Readiness:

- Primary landing is technically ready for paid traffic.
- Tracking/conversion readiness is not complete yet.

## 5. Positioning check

Correct positioning present:

- Readiness assessment.
- Migration risk visibility.
- RVTools/evidence-first.
- No agents.
- No production access.
- Missing evidence and risk discovery as value.

Safe disclaimers found:

- "It does not guarantee zero downtime."
- "It does not migrate VMs."
- "No Automated Migration."
- "We do not move VMs or orchestrate conversion scripts."

No risky promises observed:

- No guaranteed migration.
- No automatic migration promise.
- No zero downtime promise.
- No guaranteed savings promise.
- No "no risk" promise.
- No "replaces all consultants" promise.

Recommended copy principle:

- Keep message anchored in "risk before cutover" and "readiness before migration".

## 6. Tracking / analytics audit

Code search:

- `gtag`: not found.
- `GTM-`: not found.
- Google Ads tag: not found.
- Google Analytics implementation: not found.
- `dataLayer`: not found.
- PostHog: not found.
- Facebook pixel: not found.
- Custom analytics references: no production marketing analytics implementation found.

Other findings:

- "google" references are Gemini/Google AI API usage, not Ads tracking.
- "conversion" references are app/business copy or pricing conversion logic, not Ads conversion tracking.

Current status:

- Tracking ready: no.
- Conversion events implemented: no.
- Google tag/GTM ready: no.
- Ads account readiness: not audited in dashboard in this hito.

Recommended next step:

- `GOOGLE-ADS-TRACKING-SETUP-1` before measurable paid launch.
- Decide whether to use Google Tag, GTM or privacy-first analytics.
- Add consent/cookie handling if tracking requires it.

## 7. Conversion map

Primary conversions:

| Conversion | Priority | Notes |
| --- | --- | --- |
| Start readiness assessment | High | Strong product intent |
| Upload RVTools / start upload | High | Strongest evidence intent |
| Book professional assessment | High | Commercial intent |
| Request migration blueprint | High | High-ticket intent |
| Contact/support lead | High | Human follow-up |
| Partner application | High | MSP channel intent |

Secondary conversions:

| Conversion | Priority | Notes |
| --- | --- | --- |
| Watch demo/replay | Medium | Educational intent |
| Open demo workspace | Medium | Product exploration |
| Download/open sample report | Medium | Trust-building intent |
| View pricing | Medium | Commercial research |
| Click bank transfer/manual invoice | Medium | Manual payment intent, not live payment |
| Click checkout | Medium | Track interest only while safe-off |

Low-priority events:

- Generic pageview.
- Scroll depth.
- Time on page.

Recommendation:

- Do not optimize campaigns for pageviews.
- Optimize first for sample report/demo/lead if assessment-start tracking is not ready.

## 8. Campaign structure

### Campaign A: High intent VMware to Proxmox

Landing:

- `/vmware-to-proxmox-readiness`.

Keywords:

- `vmware to proxmox migration`
- `migrate vmware to proxmox`
- `esxi to proxmox migration`
- `proxmox vmware migration`
- `proxmox import vmware`
- `proxmox import wizard vmware`
- `vmware esxi to proxmox`
- `migrate esxi vm to proxmox`
- `vmware to proxmox assessment`
- `proxmox migration assessment`

### Campaign B: Broadcom / VMware cost pain

Keywords:

- `vmware broadcom price increase`
- `vmware alternative after broadcom`
- `vmware licensing cost alternative`
- `broadcom vmware migration`
- `vmware cost increase proxmox`
- `vmware exit strategy`
- `vmware renewal alternative`

### Campaign C: Comparison / alternatives

Keywords:

- `proxmox vs vmware`
- `vmware vs proxmox`
- `proxmox alternative to vmware`
- `vmware replacement`
- `vmware alternatives for business`

### Campaign D: MSP / consultants

Keywords:

- `proxmox migration services`
- `vmware migration services`
- `proxmox consultant`
- `vmware to proxmox consultant`
- `proxmox msp`
- `proxmox assessment`

### Campaign E: Spanish later

Recommendation:

- English first.
- Spanish later as a separate campaign only if owner approves.
- Do not mix languages in the same campaign.

Spanish keywords for later:

- `migrar VMware a Proxmox`
- `migracion VMware Proxmox`
- `alternativa a VMware Broadcom`
- `Proxmox vs VMware`
- `salir de VMware`
- `consultoria Proxmox`
- `assessment Proxmox`

## 9. Negative keywords

Initial negative keyword list:

- `free`
- `gratis`
- `torrent`
- `cracked`
- `crack`
- `job`
- `jobs`
- `salary`
- `course`
- `training`
- `tutorial`
- `youtube`
- `pdf`
- `reddit`
- `homelab`
- `home lab`
- `raspberry`
- `proxmox download`
- `proxmox iso`
- `iso`
- `license key`
- `certification`
- `install proxmox`
- `proxmox on laptop`
- `proxmox gaming`
- `minecraft`
- `windows 11 install`
- `vmware workstation`
- `virtualbox`
- `proxmox home server`

## 10. Ad copy

### Ad 1: Risk

Headlines:

- VMware to Proxmox Readiness
- Analyze Your RVTools Export
- Know What Can Break
- Migration Risk Report
- No Agents Required
- No Production Access

Descriptions:

- Get a professional migration readiness report: VM risks, Proxmox sizing, evidence gaps and migration waves.
- Before migrating, identify risky workloads, backup gaps, storage issues and Proxmox readiness.

### Ad 2: Broadcom / leaving VMware

Headlines:

- Leaving VMware for Proxmox?
- Check Migration Risk First
- RVTools-Based Assessment
- Before You Migrate
- Find Risk Before Cutover

Descriptions:

- Turn VMware exports into a clear readiness assessment before migration execution.
- Identify easy wins, risky workloads, missing evidence and required validations before moving production.

### Ad 3: MSP / consultant

Headlines:

- Proxmox Migration Planning
- For VMware Environments
- Executive + Technical Report
- Client-Ready Assessment
- Built for MSPs

Descriptions:

- Turn RVTools exports into risk scores, VM classification, Proxmox sizing and migration waves.
- Help clients plan VMware exits with repeatable evidence-based reporting.

## 11. Budget plan

Conservative validation:

- USD 10-20/day.
- 2-4 weeks.
- Max first test: USD 300-600.

Do not scale until:

- Qualified lead occurs.
- Sample report/download intent is confirmed.
- Demo engagement is observed.
- Contact/pilot request occurs.

Metrics to monitor:

- CTR.
- CPC.
- Landing conversion.
- Sample report click/download.
- Demo start.
- Pricing view.
- Lead quality.
- Cost per qualified lead.
- Later paid conversion.

## 12. Google Ads account readiness

Not audited in dashboard in this hito because campaign launch and account changes are not approved.

Known status:

- Account access: unknown.
- Billing configured: unknown.
- Advertiser verification required: unknown.
- Conversion tracking ready: no.
- Google tag/GTM ready: no.
- Developer token: not needed for manual campaign launch.

If Google Ads asks for billing, card, tax data, advertiser verification, OAuth, developer token or sensitive permissions:

- Stop.
- Owner must complete manually.
- Do not store or document credentials.

## 13. Privacy / consent

Current tracking status:

- No marketing tracking implementation detected.
- Cookie/analytics consent state not confirmed for Ads tracking.

Privacy risk:

- Low before tracking is added.
- Medium before launch if conversion tracking is added without consent/cookie review.

Recommended next hito:

- `ADS-TRACKING-CONSENT-HARDENING-1` or combine into `GOOGLE-ADS-TRACKING-SETUP-1`.

Before launch:

- Confirm privacy policy covers analytics/ads measurement.
- Confirm cookie/consent approach if required.
- Confirm form/contact consent language if lead forms are used.
- Confirm sample report download tracking does not collect unnecessary data.

## 14. Go / no-go

Current verdict:

- Ads launch prep complete.
- Launch campaign now: NO-GO.

GO only if:

- Landing 200 OK.
- Sample report OK.
- Demo OK.
- Conversion tracking implemented or owner accepts untracked test.
- Budget approved.
- Negative keywords ready.
- No dangerous claims.
- Privacy/consent acceptable.
- Owner approves spend.
- No live payments required.

Current blockers to launch:

- No conversion tracking implemented.
- Google Ads account/billing/verification not audited.
- Budget/spend not explicitly approved.
- Privacy/consent for marketing tracking not confirmed.

Non-blockers:

- Primary landing is up.
- DNS/production are ready.
- Billing safe-off protects against accidental live payment.
- Ads copy/keywords/negatives are prepared.

## 15. What was not touched

- No Google Ads campaign created.
- No Google Ads launch.
- No ad published.
- No spend.
- No Google billing.
- No Google credentials.
- No tracking scripts added.
- No Stripe live.
- No payments.
- No pricing changes.
- No DNS.
- No Hostinger.
- No DB.
- No migrations.
- No R2.
- No Upstash.
- No customer data.

## 16. Risks

Primary risks:

- Wasting budget without conversion tracking.
- Optimizing for weak pageview signals.
- Attracting homelab/free/tutorial traffic without negatives.
- Confusing users if safe-off checkout is clicked.
- Launching before pilot feedback validates commercial message.
- Privacy/cookie compliance gap if tracking is added quickly.

Mitigations:

- Launch only after tracking setup.
- Start with exact/phrase high-intent keywords.
- Use strong negative keyword list.
- Keep manual invoice path clear.
- Do not activate live payments.
- Review search terms daily during first week.

## 17. Estado final

| Area | Estado final |
| --- | ---: |
| GOOGLE-ADS-LAUNCH-PREP-1 | 100% |
| Ads readiness | 72% |
| Tracking readiness | 20% |
| Commercial readiness | 86% |
| Production readiness | 100% |
| General technical | 99% |

Status:

- Prep complete.
- Campaigns not launched.
- Spend not approved or used.
- Tracking setup remains the main blocker.

## 18. Next hito

Recommended:

- `GOOGLE-ADS-TRACKING-SETUP-1`.

Then:

- `GOOGLE-ADS-LAUNCH-CONTROLLED-1`.
- `PILOT-EXECUTION-1`.

## 19. Follow-up: Market Activation 3-4-5

Fecha: 2026-06-05

`MARKET-ACTIVATION-3-4-5` confirmed the Ads gate remains closed:

- Google Ads launch not approved.
- No paid campaigns launched.
- No ad spend used.
- Tracking readiness remains the primary blocker.
- Next Ads action remains `GOOGLE-ADS-TRACKING-SETUP-1`.
