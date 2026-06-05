# Market Activation 3-4-5

Fecha: 2026-06-05

## 1. Objetivo

Documentar el bloque de activacion comercial 3-4-5 para Shift Evidence:

- `PILOT-EXECUTION-1`.
- `STRIPE-LIVE-PAYMENT-FINAL-GATE-1`.
- `PUBLIC-LAUNCH-CONTROLLED`.

El objetivo operativo fue avanzar sin romper los gates de seguridad: no ejecutar pagos reales sin aprobacion exacta, no usar datos reales sin consentimiento, no lanzar Ads, no automatizar grants y no tocar infraestructura destructiva.

## 2. Estado inicial

| Area | Estado inicial |
| --- | ---: |
| MARKET-ACTIVATION-3-4-5 | 0% |
| Pilot execution readiness | 0% |
| Stripe live payment final gate | 0% |
| Public launch controlled | 0% |
| Production/cutover readiness | 100% |
| Commercial readiness | 86% |
| Pilot readiness | 95% |
| Billing readiness | 99% |
| Stripe live readiness | 94% |
| Ads readiness | 72% |
| Tracking readiness | 20% |
| General technical | 99% |

Produccion ya estaba en estado `Controlled Production Ready`:

- `https://www.shiftevidence.com` activo.
- DNS Cloudflare OK.
- Email DNS preservado.
- Neon production OK.
- R2 production OK.
- R2 app upload/download/delete OK.
- Upstash production OK.
- Auth/admin production OK.
- Stripe live hosted checkout smoke OK.
- Stripe live payment no completado.
- Stripe production restaurado a safe-off.
- Billing safe-off activo.
- PDFs OK.
- Demo/workspace/sample report OK.
- `main` protegido con `vercel.json`: `main: false`, `preview: true`.

## 3. Auditoria inicial

Repositorio:

- Branch: `main`.
- HEAD: `58c1bef26ca3651a9685154a2075fb40c8dfd539`.
- `origin/main`: alineado con `HEAD`.
- `origin/preview`: `5c8b695eb3c20b709db30b00d7cddc6164cf2fed`.
- Repo limpio al iniciar.
- No commits locales ahead/behind.
- No untracked files visibles.
- `.env.local` no trackeado.
- `.env.r2-smoke.local` no trackeado.

Vercel Git hardening preservado:

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

Smoke publico rapido:

| Ruta | Resultado |
| --- | --- |
| `/` | 200 OK |
| `/pricing` | 200 OK |
| `/demo` | 200 OK |
| `/sample-report` | 200 OK |
| `/dashboard` | 307 redirect a sign-in sin login |

Billing safe-off:

| Ruta | Resultado |
| --- | --- |
| `/billing/checkout/starter/start` | 303 `checkout_disabled` |
| `/billing/checkout/professional/start` | 303 `checkout_disabled` |
| `/billing/checkout/msp/start` | 303 `checkout_disabled` |

## 4. Pilot execution

Decision de disponibilidad:

- Tipo: Opcion E, no hay prospecto/dataset todavia.
- Consentimiento: no recibido.
- Dataset real: no recibido.
- Dataset anonimizado aprobado: no recibido.
- Dataset sintetico extendido para rehearsal: no ejecutado en este hito.
- Assessment piloto real: no creado.
- Evidencia real: no subida.
- Reporte con datos reales: no generado.
- Feedback real: no capturado.

Veredicto:

- `Pilot execution blocked pending prospect/dataset/consent`.

Razon:

- No se debe inventar un piloto ni usar datos reales sin autorizacion.
- No se debe commitear ni pegar archivos reales de infraestructura, customer files, IPs, hostnames, emails o evidencia sensible.

Feedback:

| Area | Estado |
| --- | --- |
| Product clarity | Pendiente de prospecto o sesion real |
| Trust | Pendiente de prospecto o sesion real |
| Report quality | Pendiente de prospecto o sesion real |
| Pricing | Pendiente de prospecto o sesion real |
| Upload friction | Pendiente de prospecto o sesion real |
| Security | Pendiente de prospecto o sesion real |
| Missing evidence | Pendiente de prospecto o sesion real |
| Migration plan | Pendiente de prospecto o sesion real |
| Willingness to pay | Pendiente de prospecto o sesion real |
| Next step | Pendiente de prospecto o sesion real |

## 5. Stripe live payment final gate

Estado:

- Stripe live hosted checkout ya fue validado para los 3 planes.
- Pago real no ejecutado.
- No se recibio la frase exacta requerida para ejecutar pago real controlado:
  `apruebo ejecutar pago real controlado Stripe live sin grants automaticos`.
- No se ingreso tarjeta.
- No se completo checkout.
- No se genero pago real.
- No se provoco webhook live intencional.
- No se marco nada como paid.
- No se otorgaron grants ni entitlements.
- No se modificaron envs live en este hito.
- Billing safe-off queda como estado final.

Safe-off final esperado:

- `STRIPE_CHECKOUT_ENABLED=false`.
- `STRIPE_CHECKOUT_MODE=test`.
- `STRIPE_LIVE_PAYMENTS_APPROVED=false`.
- Start routes devuelven `checkout_disabled`.

Veredicto:

- `Payment final gate prepared, payment not executed`.

## 6. Public launch controlled

Decision de alcance:

- Soft public availability: preparado y tecnicamente viable porque produccion ya esta online y estable.
- Private outreach: preparado como proximo paso seguro.
- Public announcement masivo: no aprobado.
- Paid Ads: no aprobado.
- Payment collection live: no aprobado.

Recomendacion:

- Avanzar con A + B: disponibilidad publica suave y outreach privado a prospectos puntuales.
- No ejecutar D: paid launch / Google Ads hasta completar tracking, conversiones, privacidad/cookies y cuenta publicitaria.

Go/no-go:

| Area | Estado |
| --- | --- |
| Production smoke | GO |
| DNS | GO |
| Auth/admin | GO |
| R2/Upstash/DB | GO |
| PDFs | GO |
| Billing safe-off | GO |
| Support/contact path | GO |
| Dangerous claims | GO, sin claims agresivos documentados |
| Rollback available | GO |
| Tracking for Ads | NO-GO |
| Conversion tracking | NO-GO |
| Google Ads account readiness | NO-GO |
| Live payment collection | NO-GO |

Veredicto:

- `Controlled public availability prepared`.
- `Private outreach prepared`.
- `Public announcement not approved`.
- `Paid Ads not approved`.
- `Payment collection not approved`.

## 7. Launch assets

Short launch note:

```text
Shift Evidence is now available for controlled VMware-to-Proxmox readiness reviews.
It helps teams understand migration risk, evidence gaps, storage readiness, and practical next steps before committing to a platform move.
For now, access is controlled and focused on discovery, sample reports, and manual follow-up.
```

Prospect outreach:

```text
Hi,

We are opening controlled access to Shift Evidence for VMware-to-Proxmox readiness reviews.

The goal is simple: before migration work begins, identify what can break, what evidence is missing, and what the practical migration path looks like.

If useful, I can share a sample report or run a short discovery session without requiring live production data.
```

MSP outreach:

```text
Hi,

Shift Evidence is ready for controlled MSP conversations around VMware-to-Proxmox migration readiness.

It is designed to help qualify client environments, surface migration risks, and package findings into a clear readiness report before deeper project scoping.

For the first conversations, we are keeping access controlled and using either synthetic data, anonymized data, or customer-approved evidence only.
```

Support response:

```text
Thanks for reaching out. Shift Evidence is currently available through controlled onboarding.

We can start with a sample report, a short discovery call, or an approved evidence review. Please do not send sensitive infrastructure files until scope, consent, and retention expectations are confirmed.
```

Internal checklist:

- Confirm lead source.
- Confirm whether the lead is a prospect, MSP, partner, or internal tester.
- Confirm consent before any real evidence.
- Prefer sample report or discovery first.
- If evidence is needed, confirm scope, storage, retention, and cleanup.
- Keep Stripe live payments off unless the exact payment approval gate is completed.
- Use manual follow-up for commercial next steps.
- Do not launch Ads until tracking is implemented and approved.

Lead handling:

- Initial SLA: respond within 1 business day.
- First action: offer sample report or discovery.
- Payment path: manual invoice/Wise or Stripe only after approval gate.
- Evidence path: only after written consent and data handling confirmation.
- Sales packages: Starter, Professional, MSP Blueprint.

## 8. Risks

| Risk | Status | Mitigation |
| --- | --- | --- |
| No real pilot feedback yet | Open | Run `PILOT-EXECUTION-1` with prospect or approved dataset |
| Stripe payment not fully proven end-to-end | Open | Run final gate only with exact approval and no auto-grants |
| Ads tracking incomplete | Open | Complete `GOOGLE-ADS-TRACKING-SETUP-1` before spend |
| Public launch expectations exceed support capacity | Controlled | Keep launch private/soft first |
| Customer data mishandling | Controlled | Require consent, no repo files, no secrets, no real data in docs |
| Accidental live checkout | Controlled | Safe-off remains final state |

## 9. Security review

No secrets documented.
No customer data documented.
No real infrastructure workbook documented.
No customer IPs/hostnames documented.
No real emails documented.
No provider credentials documented.
No payment instrument details documented.
No database connection string documented.
No R2 keys documented.
No Upstash token documented.
No auth provider secret documented.
No browser credential artifacts documented.
No asymmetric credential material documented.
No API bearer credential documented.
No login credential documented.

No DNS changes.
No Hostinger changes.
No Cloudflare destructive changes.
No MX/SPF/DKIM/DMARC changes.
No DB migrations.
No `db push`.
No DB destructive operations.
No Vercel env pull.
No intentional production deploy in this hito.
No payment execution.
No grants or entitlements.
No Ads launch.
No ad spend.

## 10. Final percentages

| Area | Final |
| --- | ---: |
| MARKET-ACTIVATION-3-4-5 | 68% |
| Pilot execution | 20% |
| Stripe payment final gate | 60% |
| Public launch controlled | 75% |
| Commercial readiness | 88% |
| Production readiness | 100% |
| General technical | 99% |

Interpretacion:

- El producto esta listo para disponibilidad controlada.
- El piloto real sigue pendiente por falta de prospecto/dataset/consentimiento.
- El pago real sigue pendiente por falta de aprobacion exacta.
- Ads sigue bloqueado por tracking y conversion readiness.

## 11. Next hito

- `PILOT-EXECUTION-1`: ejecutar con prospecto real, dataset anonimizado aprobado o synthetic-only rehearsal.
- `STRIPE-LIVE-PAYMENT-FINAL-GATE-1`: ejecutar solo si el owner aprueba exactamente el pago real controlado sin grants automaticos.
- `PUBLIC-LAUNCH-CONTROLLED`: aprobar alcance exacto de soft availability/private outreach/public announcement.
- `GOOGLE-ADS-TRACKING-SETUP-1`: implementar tracking/conversiones/privacy review antes de Ads.
