# Production Env Prep 1

Fecha: 2026-06-05

## 1. Objetivo

Preparar la configuracion productiva de Shift Evidence por capas, sin ejecutar cutover publico y sin habilitar pagos live.

Este hito documenta decision de proyecto Vercel, matriz de variables Production, carga segura recomendada, variables bloqueadas, estado de Neon/R2/Upstash/Auth/Admin/Stripe/Wise/DNS y proximos hitos.

No se cargaron secretos, no se modificaron env vars productivas, no se tocaron dominios y no se ejecuto deployment productivo intencional.

## 2. Estado actual

| Area | Estado |
| --- | ---: |
| PRODUCTION-ENV-PREP-1 | 100% |
| Production/cutover readiness | 88% |
| Vercel readiness | 90% |
| Storage/R2 readiness | 97% |
| Billing readiness | 95% |
| Stripe live readiness | 65% |
| Admin ops | 94% |
| PDF/report quality | 98% |
| Avance general tecnico | 97% |

Resumen:

- `main` esta sincronizado con `origin/main`.
- Branch `preview` es conocido.
- Preview esta estable y validado.
- PDF visual QA + hotfix estan completos.
- Public sample PDF y Premium sample PDF v2 ya estan diferenciados.
- Demo PDF fue corregido visualmente.
- Production cutover sigue en No-Go inmediato.
- El siguiente paso es preparacion productiva por capas, no cutover.

## 3. Vercel project decision

### Auditoria observada

Vercel team: `shift-evidence`.

Proyectos observados:

| Project | Latest Production URL | Node | Uso observado |
| --- | --- | --- | --- |
| `shiftevidence` | `https://www.shiftevidence.com` | 24.x | Proyecto con dominios productivos activos. |
| `infrashift-r2-recovery` | none | 24.x | Proyecto linkeado al repo local actual y usado para Preview/recovery. |

Proyecto linkeado localmente:

- `.vercel/project.json`: `infrashift-r2-recovery`.
- Production env del proyecto linkeado: no variables encontradas.

`shiftevidence` observado:

- Framework: Next.js.
- Root Directory: `.`.
- Node.js Version: 24.x.
- Build Command: default `npm run build` / `next build`.
- Dominios/aliases observados en el deployment productivo actual:
  - `https://www.shiftevidence.com`
  - `https://shiftevidence.com`
  - `https://infra-evidence.vercel.app`
  - Vercel project aliases.

### Decision recomendada

Recomendacion: tratar `shiftevidence` como el proyecto productivo canonico porque ya tiene los dominios productivos activos.

No preparar `infrashift-r2-recovery` como produccion real hasta una decision explicita de migracion de dominios/proyecto. Mantenerlo como recovery/Preview/staging tecnico.

### Riesgo detectado

Hay auto-deploys Production por pushes a `main` en al menos un proyecto Vercel. En hitos anteriores se removieron deployments Production accidentales de `infrashift-r2-recovery`. El proyecto `shiftevidence` ya sirve dominios productivos, por lo que cualquier push a `main` puede actualizar una URL publica real.

Antes de cutover controlado se debe decidir:

- usar `shiftevidence` como Production final y preparar env ahi; o
- mover dominios hacia `infrashift-r2-recovery` en hito explicito; o
- mantener `infrashift-r2-recovery` solo como recovery y consolidar codigo/env en `shiftevidence`.

No se relinkeo el repo local, no se modificaron settings y no se asignaron dominios.

## 4. Production env matrix

No documentar valores secretos. Esta matriz enumera nombres, categoria y decision de carga.

| Variable | Categoria | Required for production | Secret | Cargar ahora | Fuente | Riesgo | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `DATABASE_URL` | Neon DB | Si | Si | No | Neon production DB | App no arranca / Prisma falla | Requiere Neon prod confirmado; no usar preview. |
| `DIRECT_URL` | Neon DB | Segun Neon | Si | No | Neon production direct connection | Migraciones sin ruta directa si aplica | Cargar solo si Neon prod/migrate flow lo requiere. |
| `BETTER_AUTH_SECRET` | Auth | Si | Si | No | Secret manager / Vercel | Sesiones invalidas o inseguras | Generar unico para Production. |
| `BETTER_AUTH_URL` | Auth | Si | No | No | Dominio productivo | Redirect/auth mismatch | Valor esperado futuro: `https://shiftevidence.com`. |
| `NEXT_PUBLIC_APP_URL` | App URL | Si | No | No | Dominio productivo | URLs absolutas incorrectas | Valor esperado futuro: `https://shiftevidence.com`. |
| `ADMIN_EMAILS` | Admin | Si | Privado | No | Owner/operator | Sin admin o admin incorrecto | Usar allowlist exacta, sin wildcard. |
| `STORAGE_DRIVER` | R2 | Si para durable prod | No | No | App config | Local disk no durable | Valor esperado futuro: `r2`. |
| `R2_ACCOUNT_ID` | R2 | Si | No | No | Cloudflare | R2 client falla | Metadata de cuenta; no es secreto pero no imprimir innecesariamente. |
| `R2_S3_ENDPOINT` | R2 | Si | No | No | Cloudflare | R2 client falla | Endpoint account-specific. |
| `R2_BUCKET_PREVIEW` | R2 | Recomendado | No | No | Cloudflare | Preview routing incompleto | `shift-evidence-preview-evidence`. |
| `R2_BUCKET_PROD` | R2 | Si | No | No | Cloudflare | Production storage falla | `shift-evidence-prod-evidence`. |
| `R2_ACCESS_KEY_ID` | R2 | Si | Si | No | Cloudflare token prod | R2 auth falla | Cargar solo con token prod scopeado. |
| `R2_SECRET_ACCESS_KEY` | R2 | Si | Si | No | Cloudflare token prod | R2 auth falla | No smoke en este hito. |
| `MAX_UPLOAD_SIZE_MB` | Upload | Recomendado | No | No | App policy | Limites inconsistentes | Valor recomendado: `50`. |
| `UPSTASH_REDIS_REST_URL` | Rate limit | Si | Si | No | Upstash prod | Rate limit fail-closed | Requiere Upstash prod dedicado. |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limit | Si | Si | No | Upstash prod | Rate limit fail-closed | No reutilizar Preview salvo decision explicita. |
| `STRIPE_CHECKOUT_ENABLED` | Stripe | Si para checkout | No | No | Billing policy | Checkout activo por accidente | Safe-off futuro recomendado: `false`. |
| `STRIPE_CHECKOUT_MODE` | Stripe | Si para checkout | No | No | Billing policy | Modo incorrecto | Safe-off futuro recomendado: `test`. |
| `STRIPE_LIVE_PAYMENTS_APPROVED` | Stripe | Si para live | No | No | Business approval | Pagos live por accidente | Debe seguir `false` hasta hito live. |
| `STRIPE_SECRET_KEY` | Stripe | Si para checkout | Si | No | Stripe | Checkout falla o riesgo live | No cargar live key en este hito. |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Si para webhook | Si | No | Stripe webhook | Eventos rechazados | Hito separado de webhook/live. |
| `STRIPE_STARTER_PRICE_ID` | Stripe | Si para Starter | No | No | Stripe | Checkout Starter falla | Test/prod IDs deben coincidir con modo. |
| `STRIPE_PROFESSIONAL_PRICE_ID` | Stripe | Si para Professional | No | No | Stripe | Checkout Professional falla | Test/prod IDs deben coincidir con modo. |
| `STRIPE_MSP_PRICE_ID` | Stripe | Si para MSP | No | No | Stripe | Checkout MSP falla | Test/prod IDs deben coincidir con modo. |
| `WISE_API_URL` | Wise | No para cutover inicial | No | No | Wise | Automatizacion prematura | Mantener manual. |
| `WISE_API_TOKEN` | Wise | No para cutover inicial | Si | No | Wise | Riesgo financiero | No automatizar en este hito. |
| `WISE_PROFILE_ID` | Wise | No para cutover inicial | Privado | No | Wise | Perfil equivocado | Mantener manual. |
| `RESEND_API_KEY` | Email | Opcional | Si | No | Email provider | Password reset email no disponible | Hito separado si se activa email real. |
| `EMAIL_FROM` | Email | Opcional | No | No | Email/domain | Deliverability incorrecta | Requiere SPF/DKIM/DMARC. |
| `AI_ADVISORY_ENABLED` | AI | Opcional | No | No | AI policy | Costos/uso inesperado | Mantener off salvo hito AI prod. |
| `AI_ADVISORY_PROVIDER` | AI | Opcional | No | No | AI policy | Provider incorrecto | Mantener disabled/unset. |
| `GEMINI_API_KEY` | AI | Opcional | Si | No | AI provider | Secret/costos | No cargar en este hito. |
| `OPENAI_API_KEY` | AI | Opcional | Si | No | AI provider | Secret/costos | No cargar en este hito. |
| `OPENCODE_API_KEY` | AI | Opcional | Si | No | AI provider | Secret/costos | No cargar en este hito. |

## 5. Variables safe to load now

Decision de este hito: no cargar variables en Vercel Production.

Razon:

- El proyecto productivo canonico parece ser `shiftevidence`, pero el repo local esta linkeado a `infrashift-r2-recovery`.
- Cargar Production env en el proyecto equivocado puede crear falsa seguridad.
- `shiftevidence` ya sirve dominios reales, por lo que cualquier cambio de Production env debe hacerse con ventana y rollback.
- Neon prod, Upstash prod y R2 prod smoke requieren hitos dedicados.
- Stripe live debe permanecer bloqueado.

Si el usuario aprueba una carga segura en un hito posterior, empezar por capas:

1. Auth/app URL/admin allowlist.
2. Neon prod connection values.
3. R2 prod storage values.
4. Upstash prod values.
5. Stripe safe-off values.

## 6. Variables blocked

Bloqueadas hasta hito especifico:

- Cualquier `DATABASE_URL` productivo hasta `NEON-PRODUCTION-DB-PREP-1`.
- Cualquier migracion productiva hasta hito aprobado de DB.
- Cualquier R2 prod credential hasta `R2-PRODUCTION-STORAGE-SMOKE-1` o preparacion aprobada.
- Cualquier Upstash prod token hasta `UPSTASH-PRODUCTION-RATE-LIMIT-SMOKE-1`.
- Cualquier Stripe live secret o Price ID live hasta `STRIPE-LIVE-READINESS-1`.
- `STRIPE_LIVE_PAYMENTS_APPROVED=true` hasta aprobacion explicita de live payments.
- Wise automation hasta hito financiero separado.
- Email provider production hasta DNS/email readiness.
- AI provider production hasta hito AI prod/cost-control.

## 7. Neon prod status

Estado: no confirmado en este hito.

No se consulto ni modifico DB productiva. No se crearon branches/databases y no se ejecutaron migraciones.

Preparacion requerida:

- Confirmar proyecto/branch/database productiva.
- Definir pooling/direct connection.
- Guardar connection strings solo en Vercel Production o gestor seguro.
- Ejecutar `prisma migrate deploy` solo en hito aprobado.
- No usar `db push`.
- Definir backup/restore o branch restore.

Bloqueo actual:

- No hay Neon prod confirmado para cargar `DATABASE_URL`/`DIRECT_URL`.

## 8. R2 prod status

Estado: preparado conceptualmente, no usado.

Desde docs previos:

- Preview bucket: `shift-evidence-preview-evidence`.
- Production bucket: `shift-evidence-prod-evidence`.
- Token prod fue creado con scope de bucket prod, pero no se uso en este hito.
- Adapter enruta `VERCEL_ENV=production` a bucket prod.

No hecho:

- No smoke R2 prod.
- No writes al bucket prod.
- No carga de R2 Production env.

Preparacion requerida:

- Confirmar token prod scopeado.
- Cargar vars R2 solo en Production del proyecto correcto.
- Ejecutar smoke sintetico write/head/read/delete en hito dedicado.
- Confirmar cleanup post-delete.

## 9. Upstash prod status

Estado: no confirmado.

Desde docs previos:

- Upstash preview/staging existe y funciona.
- Production debe fallar cerrado si falta Upstash.
- No se debe reutilizar preview en prod salvo decision explicita.

Preparacion requerida:

- Crear Redis production dedicado.
- Cargar REST URL/token solo en Production del proyecto correcto.
- Ejecutar smoke no destructivo de rate limit.
- Confirmar que no bloquea rutas criticas accidentalmente.

## 10. Auth/admin prod status

Estado: listo para planificar, no configurado en Production desde este hito.

Requiere:

- `BETTER_AUTH_SECRET` productivo unico.
- `BETTER_AUTH_URL` alineado al dominio final.
- `NEXT_PUBLIC_APP_URL` alineado al dominio final.
- `ADMIN_EMAILS` con allowlist exacta.

Politica:

- No wildcards.
- No documentar emails reales si el owner prefiere privacidad.
- Usar placeholder `<production-admin-email>` en docs.
- Validar login/admin en hito de smoke production-auth controlado.

## 11. Stripe live status

Estado: bloqueado por defecto.

No se habilito live. No se cargaron secrets live. No se configuro webhook live. No se hicieron pagos.

Safe-off recomendado para una carga futura:

```text
STRIPE_CHECKOUT_ENABLED=false
STRIPE_CHECKOUT_MODE=test
STRIPE_LIVE_PAYMENTS_APPROVED=false
```

Live requiere hito separado:

- Account/Price ID alignment.
- Live webhook endpoint y secret.
- Double gate aprobado.
- Smoke hasta hosted checkout live sin pago, salvo aprobacion separada.
- Reconciliation/refund/cancel/revoke runbooks.

## 12. Wise/manual invoice status

Estado: manual.

Wise automation queda bloqueada. Bank transfer/manual invoice sigue siendo respaldo operativo.

No cargar:

- `WISE_API_TOKEN`.
- `WISE_PROFILE_ID`.
- Automatizaciones de transfer/funding.

## 13. DNS/Hostinger boundary

No tocar DNS/Hostinger en este hito.

Pendiente:

- Inventario DNS.
- MX/TXT/SPF/DKIM/DMARC.
- Confirmar email provider.
- Confirmar canonical host.
- Definir cutover window.
- Definir rollback DNS.
- Confirmar si `infra-evidence.vercel.app` debe retirarse o mantenerse como alias tecnico.

## 14. What was changed

Cambios realizados:

- Se creo este documento de preparacion productiva.

No se hicieron cambios en:

- Vercel env.
- Vercel project settings.
- Domains/custom domains.
- DNS/Hostinger.
- Neon.
- R2.
- Upstash.
- Stripe.
- Wise.
- DB/migrations.
- Codigo.

## 15. What was not changed

No se modifico:

- Production env de `shiftevidence`.
- Production env de `infrashift-r2-recovery`.
- Aliases/dominios.
- Deployment protection.
- Billing behavior.
- Auth/admin behavior.
- Storage runtime.
- Rate limit runtime.

## 16. Go/no-go

Veredicto: No-Go para cutover inmediato.

Go para el proximo hito de preparacion si:

- Se decide explicitamente el proyecto productivo final.
- Se autoriza preparar env en ese proyecto.
- Se confirma Neon prod o se crea en hito dedicado.
- Se confirma R2 prod token/bucket y se aprueba smoke separado.
- Se confirma Upstash prod dedicado.
- Se mantiene Stripe live safe-off.

No-Go si:

- No esta claro si Production final es `shiftevidence` o `infrashift-r2-recovery`.
- Se pretende cargar secrets en el proyecto equivocado.
- Se quiere tocar DNS sin inventario de email.
- Se quiere habilitar Stripe live junto con env prep.
- No hay rollback.

## 17. Risks

| Riesgo | Impacto | Mitigacion |
| --- | --- | --- |
| Dos proyectos Vercel con roles distintos | Alto | Decidir proyecto canonico antes de cargar env. |
| Push a `main` auto-deploya Production | Alto | Controlar Git integration / remover deployments accidentales / usar ventana. |
| `shiftevidence` ya sirve dominios reales | Alto | No tocar env sin hito y rollback. |
| Production env vacio en recovery project | Medio-alto | No asumir que recovery esta listo para prod. |
| Neon prod no confirmado | Alto | Hito dedicado DB prod. |
| Upstash prod no confirmado | Medio-alto | Hito dedicado Redis prod. |
| Stripe live mal configurado | Alto | Mantener double gate safe-off. |
| DNS/Email se rompe | Alto | Hito DNS/Hostinger separado. |

## 18. Next hito

Orden recomendado:

1. `VERCEL-PRODUCTION-PROJECT-DECISION-1`
2. `NEON-PRODUCTION-DB-PREP-1`
3. `R2-PRODUCTION-STORAGE-SMOKE-1`
4. `UPSTASH-PRODUCTION-RATE-LIMIT-SMOKE-1`
5. `AUTH-ADMIN-PRODUCTION-SMOKE-1`
6. `STRIPE-LIVE-READINESS-1`
7. `DNS-HOSTINGER-CUTOVER-PREP-1`

Recomendacion inmediata: `VERCEL-PRODUCTION-PROJECT-DECISION-1`, porque hoy hay un proyecto con dominios activos (`shiftevidence`) y otro proyecto linkeado al repo local (`infrashift-r2-recovery`).
