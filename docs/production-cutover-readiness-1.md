# Production Cutover Readiness 1

Fecha: 2026-06-05

## Objetivo

Auditar el estado tecnico y operativo de Shift Evidence antes de un production cutover comercial real.

Este hito no ejecuta cutover. No modifica produccion. No toca DNS, Hostinger, Stripe live, DB productiva, bucket productivo ni env vars productivas.

## Veredicto

**Ready for production cutover planning only.**

La app esta muy cerca desde el punto de vista tecnico en Preview, pero no esta lista para ejecutar cutover comercial real hoy.

Motivo principal: el proyecto Vercel auditado tiene Preview completo, pero Production no tiene environment variables configuradas. Ademas faltan Vercel Pro, Neon prod confirmado, R2 prod smoke futuro, Upstash prod, Stripe live webhook/test live gate, plan DNS/Hostinger y QA visual manual de PDFs.

## Estado Actual

Ready / cerrado:

- `main` sano y sincronizado con `origin/main`.
- Branch `preview` conocido y usado para smokes no productivos.
- Vercel Preview estable y protegido.
- Preview origin policy explicita y sin wildcards.
- Neon preview/staging configurado y usado en smokes.
- Cloudflare R2 preview configurado.
- R2 preview upload/download autenticado completado.
- Upstash Preview rate limiting configurado.
- Admin Preview smoke con identidad admin completado.
- Stripe test-mode checkout completado hasta hosted checkout, sin pago.
- Billing manual/bank transfer disponible.
- Public routes, pricing, demo, sample report y PDFs publicos validados en hitos previos.
- No secrets trackeados.

Parcial / pendiente:

- Production env del proyecto auditado: no configurado.
- Vercel Pro: pendiente de upgrade manual antes de dominio/cutover.
- Neon production DB: pendiente de confirmar/configurar separada de Preview.
- R2 production bucket: existe por plan, pero no fue usado ni smoked.
- Upstash production: pendiente de crear/configurar separado.
- Stripe live: no listo; requiere env live, webhook, account/price alignment y smoke controlado.
- DNS/Hostinger: plan pendiente, no ejecutado.
- PDF visual QA manual: pendiente.

## What Is Ready

- Codigo base, rutas publicas y privadas estan estables en Preview.
- Auth y admin funcionan con `ADMIN_EMAILS` en Preview.
- Storage R2 preview funciona por adapter.
- Rate limiting real funciona en Preview con Upstash.
- Stripe test-mode checkout llega a Stripe hosted checkout para Starter, Professional y MSP.
- Wise/bank transfer sigue manual y separado.
- Webhook Stripe existe detras de signature verification.
- Fulfillment sigue manual; no hay grant automatico desde checkout creation.
- Rollback conceptual es viable por Vercel deployment rollback y toggles de billing.

## What Is Not Ready

- No hay Production env cargada para `infrashift-r2-recovery`.
- No se debe usar el deployment Production auto-generado por pushes a `main`.
- No hay cutover DNS plan ejecutado.
- No hay smoke de bucket R2 prod.
- No hay Upstash prod confirmado.
- No hay Stripe live webhook configurado/smoked.
- No hay Stripe live hosted checkout smoke exitoso en la app.
- No hay QA visual manual final de PDFs.
- No hay aprobacion explicita para public launch.

## Infra Decision

Decision vigente:

- Vercel Hobby/Preview se usa para desarrollo y smoke.
- Produccion comercial real requiere upgrade manual a Vercel Pro antes de cutover.
- Neon sera DB.
- Cloudflare R2 sera storage durable.
- Hostinger queda para DNS/correo.
- No mover correo ahora.
- No tocar DNS hasta hito explicito.
- No hacer production cutover sin aprobacion explicita.

## Vercel Readiness

Observado:

- Proyecto auditado: `infrashift-r2-recovery`.
- Latest Preview validado: `infrashift-r2-recovery-r7nscvzzv-shift-evidence.vercel.app`.
- Preview target: Ready.
- Stable Preview alias usada para smoke: `infrashift-r2-recovery-diegoperezroca-4286-shift-evidence.vercel.app`.
- Node version reportada por Vercel: 24.x.
- `package.json` declara engine `>=22`.
- Build command efectivo: `prisma generate && next build`.
- No `vercel.json` en repo.
- Production env del proyecto auditado: none found.
- `main` dispara auto-deploys Production, que se removieron en hitos de docs para evitar cutover accidental.

Production readiness:

- Requiere Vercel Pro antes de dominio/cutover comercial.
- Requiere Production env completa antes de cualquier deploy productivo usable.
- Requiere desactivar/remover deployments Production accidentales hasta el hito de cutover.
- Requiere confirmar build/install settings en dashboard antes de dominio.
- Requiere confirmar deployment protection/policy para pre-launch.

No hacer todavia:

- No promote.
- No assign custom domain.
- No Vercel Pro upgrade desde este hito.
- No production env changes desde este hito.

## Neon Readiness

Observado:

- Preview/staging Neon fue usado para smokes.
- Prisma schema usa PostgreSQL via `DATABASE_URL`.
- Hay migraciones versionadas en `prisma/migrations`.
- Scripts disponibles:
  - `npm run prisma:deploy`
  - `npm run prisma:migrate`
  - `npm run prisma:validate`

Produccion necesita:

- Neon production project/database o branch prod separado.
- Production database URL cargada solo en Vercel Production.
- Confirmar si aplica direct URL o pooling segun la configuracion final de Neon/Vercel.
- Ejecutar `prisma migrate deploy` contra prod solo en hito aprobado.
- Nunca usar `db push` en prod.
- Smoke post-cutover de auth/dashboard/admin sin datos reales.

Bloqueo actual:

- Production DB no confirmada/configurada en el proyecto auditado.

## R2 Readiness

Observado:

- Preview bucket probado: `shift-evidence-preview-evidence`.
- Production bucket planificado: `shift-evidence-prod-evidence`.
- Adapter soporta `STORAGE_DRIVER=local` y `STORAGE_DRIVER=r2`.
- Con `VERCEL_ENV=production`, el adapter enruta a bucket prod.
- Con runtime no productivo, enruta a bucket preview.
- Service-level y Preview authenticated upload/download pasaron.
- Bucket prod no fue usado en smokes.

Produccion necesita:

- R2 production credential scoped al bucket prod.
- Production env R2 cargadas solo en Vercel Production.
- Smoke prod futuro con archivo sintetico, write/head/read/delete/post-delete.
- Politica futura de lifecycle/retention.
- Runbook de no borrar objetos reales.

Bloqueo actual:

- No hubo smoke de R2 prod y no debe hacerse antes de cutover aprobado.

## Upstash Readiness

Observado:

- Upstash Preview existe y fue configurado para rate limiting.
- Preview real reemplazo la memoria fallback.
- Production fail-closed se preserva si Upstash falta.

Produccion necesita:

- Crear Upstash prod separado.
- Cargar REST URL y credential en Vercel Production.
- Confirmar limites/rate limits para auth, upload, reports y password reset.
- No reutilizar Preview si se quiere separacion limpia.

Bloqueo actual:

- Upstash prod no confirmado/configurado.

## Stripe Readiness

Observado:

- Stripe test mode confirmado.
- Starter test checkout: USD 490 one-time, hosted checkout reached.
- Professional test checkout: USD 1,500 one-time, hosted checkout reached.
- MSP test checkout: USD 399/month, hosted checkout reached.
- No pago completado.
- No webhook.
- No paid state.
- No grant.
- No entitlement.
- Live no tocado.

Live requiere:

- Live server-side credential.
- Live webhook signing credential.
- Live Price IDs para Starter, Professional y MSP.
- Checkout mode live.
- Checkout enabled.
- Live approval explicitly true.
- Production public origin aligned to `https://shiftevidence.com`.
- Webhook endpoint configurado en Stripe live.
- Webhook test live o at least delivery smoke controlado.
- Manual reconciliation/admin runbook vigente.
- Refund/cancel/revoke runbook vigente.
- Confirmar account/price alignment; un intento previo tuvo `stripe_price_invalid`.
- Confirmar Stripe KYC/tax/branding/fiscal readiness.

Bloqueo actual:

- Stripe live no esta listo para cutover. Test mode esta listo; live requiere hito separado.

## Wise / Manual Invoice Readiness

Observado:

- Bank transfer/manual invoice routes estan disponibles.
- Wise se mantiene manual.
- No Wise API automation.
- Admin billing permite visibilidad operacional.

Produccion necesita:

- Proceso manual de invoice/payment verification.
- Responsable operativo para marcar y reconciliar pagos.
- Proceso fiscal/legal fuera de la app si aplica.
- Runbook para no conceder acceso sin verificacion.

No se necesita Wise API para launch inicial.

## Auth / Admin Readiness

Observado:

- Admin Preview smoke con identidad admin controlada: completo.
- Admin access depende de `ADMIN_EMAILS`.
- Emails se normalizan y no aceptan wildcard.
- Demo users no pueden ser admin.
- Rutas admin fail-closed para no-admin.

Produccion necesita:

- `ADMIN_EMAILS` productivo con emails reales de operadores.
- Confirmar admin production smoke post-cutover.
- Runbook para agregar/remover admins sin exponer emails en docs.
- Revisar que `BETTER_AUTH_URL` y public app URL apunten al dominio real HTTPS.

Bloqueo actual:

- Admin production env no configurada en el proyecto auditado.

## PDF / Report Readiness

Observado:

- PDFs publicos fueron validados en hitos previos.
- Build local con env dummy no sensible paso.
- Renderer tests pasan.

Produccion necesita:

- QA visual manual final de PDFs.
- Production PDF smoke post-cutover.
- Confirmar serverless font/assets behavior en produccion.
- Confirmar generated reports y downloads con storage prod.

Bloqueo actual:

- QA visual manual final pendiente.

## DNS / Hostinger Readiness

Plan, no ejecutado:

- Hostinger queda para DNS y correo.
- Dominio comercial: `shiftevidence.com`.
- Para cutover a Vercel:
  - Agregar dominio en Vercel en hito aprobado.
  - Definir CNAME/A segun instrucciones de Vercel.
  - Mantener MX/TXT/SPF/DKIM/DMARC intactos.
  - Bajar TTL antes del cutover si corresponde.
  - Confirmar que email no se rompe.
  - Preparar rollback DNS.

Bloqueo actual:

- No hay plan DNS ejecutado ni aprobacion de cutover.

## Security / Secrets

Estado:

- `.env.local` no trackeado.
- `.env.r2-smoke.local` no trackeado.
- No secrets agregados al repo en este hito.
- Production env no modificada.
- Live credentials no documentadas.
- Preview credentials no documentadas.

Regla:

- Docs pueden nombrar categorias/env vars, pero nunca valores.
- Live Price IDs pueden documentarse en docs historicos si se consideran no-secret; para nuevos docs se prefiere enmascarado.

## Production Env Categories Needed

Production needs values for these categories:

- Database connection.
- Better Auth secret and HTTPS app/auth URLs.
- Public app URL.
- Admin email allowlist.
- Storage driver and Cloudflare R2 prod bucket/account/endpoint/credentials.
- Upstash prod REST URL and credential.
- Stripe live server credential.
- Stripe live webhook signing credential.
- Stripe live Price IDs.
- Stripe checkout mode/enabled/live approval gates.
- Optional provider/client IDs only if their features are enabled.

Do not load these in this hito.

## Cutover Checklist

### Pre-Cutover

- Upgrade Vercel Pro manually.
- Confirm final Vercel project to use for production.
- Configure Vercel Production env.
- Confirm Neon prod DB.
- Run `prisma migrate deploy` only if approved.
- Configure R2 prod env.
- Configure Upstash prod.
- Configure Stripe live env.
- Configure Stripe live webhook.
- Confirm admin emails.
- QA PDFs visually.
- Confirm DNS/Hostinger plan.
- Confirm rollback steps and owner approval.

### Cutover

- Deploy production intentionally.
- Assign domain intentionally.
- Update DNS intentionally.
- Smoke public routes.
- Smoke auth.
- Smoke dashboard.
- Smoke admin.
- Smoke R2 prod upload/download with synthetic file.
- Smoke Stripe live only to hosted checkout page, no payment unless separately approved.
- Check logs.

### Post-Cutover

- Monitor Vercel logs.
- Verify no secrets in logs.
- Verify no payment accidents.
- Verify email/DNS.
- Verify R2 objects.
- Verify rate-limit behavior.
- Verify admin billing.
- Verify analytics/observability if configured.
- Keep Preview available as fallback.

## Rollback Plan

- Roll back Vercel to previous known deployment if production deploy fails.
- Revert DNS to prior Hostinger target if domain cutover fails.
- Disable Stripe checkout by setting checkout enabled false.
- Remove live payment approval.
- Remove/disable webhook endpoint if it misbehaves.
- Revert R2 production env only if storage routing is wrong.
- Disable admin actions operationally if needed.
- Keep Preview stable as QA/reference fallback.

## Risk Table

| Severity | Risk | Mitigation |
| --- | --- | --- |
| Critical | Wrong production DB URL. | Separate Neon prod, env review, migrate deploy only with approval. |
| Critical | Stripe live enabled accidentally. | Double gate, no live env until cutover hito, smoke only to hosted page. |
| Critical | Wrong R2 bucket/token. | Scoped prod token, synthetic prod smoke, no delete of real objects. |
| Critical | DNS breaks email. | Preserve MX/TXT/SPF/DKIM/DMARC, rollback DNS plan. |
| Critical | Migrations against wrong DB. | Never use db push, verify target before migrate deploy. |
| Critical | Secrets leaked. | No values in docs/logs, env managed in Vercel only. |
| High | Stripe webhook not configured/tested. | Separate webhook test hito. |
| High | Admin emails wrong. | Production admin smoke after env config. |
| High | R2 prod upload/download fails. | Prod synthetic smoke before real use. |
| High | PDF generation fails on production runtime. | Visual/manual and route smoke after cutover. |
| High | Auth URL mismatch. | Align public/auth URLs to HTTPS production domain. |
| Medium | Visual PDF issues. | Manual PDF QA. |
| Medium | Cache/alias drift. | Explicit Vercel deployment and alias checklist. |
| Medium | Billing copy drift. | Admin billing smoke and docs review. |
| Medium | Analytics/observability missing. | Optional observability hito. |
| Low | Minor copy/branding. | Post-launch polish backlog. |

## Go / No-Go Recommendation

Recommendation: **No-Go for immediate production cutover.**

Approved next state: **production cutover planning only**.

The project is technically strong enough to plan a controlled cutover, but not enough to execute it today. The highest practical blocker is missing Production env on the audited Vercel project, followed by Vercel Pro, prod data/storage/rate-limit separation, Stripe live/webhook readiness, DNS/email safety, and PDF visual QA.

## Percentages Final

- PRODUCTION-CUTOVER-READINESS-1: 100%.
- Production/cutover readiness: 86%.
- Vercel readiness: 88%.
- Storage/R2 readiness: 97%.
- Billing readiness: 95%.
- Stripe live readiness: 65%.
- Admin internal ops: 94%.
- Avance general tecnico: 97%.

## Next Recommended Hito

Recommended:

- `PRODUCTION-CUTOVER-PLAN-2`

Alternatives:

- `STRIPE-WEBHOOK-TESTMODE-SMOKE`
- `PDF-VISUAL-QA-1`
