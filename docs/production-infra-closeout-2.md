# Production Infra Closeout 2

Fecha: 2026-06-05

## 1. Objetivo

Cerrar la infraestructura productiva basica pendiente para `shiftevidence`, sin DNS, sin cutover publico, sin Stripe live, sin pagos, sin migraciones y sin datos reales.

Alcance:

- Corregir permisos/token de Cloudflare R2 prod.
- Ejecutar smoke R2 prod completo con objeto sintetico.
- Cargar R2 prod env en Vercel Production solo si el smoke pasa.
- Crear o confirmar Upstash prod dedicado.
- Cargar `ADMIN_EMAILS` solo si el owner provee email productivo.
- Mantener Stripe live apagado.
- No hacer deploy productivo intencional.

## 2. Estado inicial

| Area | Estado inicial |
| --- | ---: |
| PRODUCTION-INFRA-CLOSEOUT-2 | 0% |
| Production/cutover readiness | 93% |
| Vercel readiness | 96% |
| DB readiness | 97% |
| Storage/R2 readiness | 97% bloqueado por prod smoke |
| Upstash/rate limit readiness | 70% |
| Billing readiness | 96% |
| Admin ops | 94% |
| General technical | 97% |

## 3. Auditoria local

Repositorio:

- Branch actual: `main`.
- HEAD inicial: `8eadbacf3c4ad4b4cd151f0530bd12b921e75e96`.
- `origin/main`: `8eadbacf3c4ad4b4cd151f0530bd12b921e75e96`.
- `origin/preview`: `5c8b695eb3c20b709db30b00d7cddc6164cf2fed`.
- Repo limpio al iniciar.
- No habia commits locales sin pushear.
- No habia untracked files visibles.
- No habia stashes reportados.
- `.env.local` no esta trackeado.
- `.env.r2-smoke.local` no esta trackeado.

Vercel hardening:

- `vercel.json` conserva `git.deploymentEnabled.main=false`.
- `vercel.json` conserva `git.deploymentEnabled.preview=true`.

## 4. R2 token fix

Target:

- Bucket prod: `shift-evidence-prod-evidence`.

Accion:

- Se creo un token nuevo desde Cloudflare R2 Account API Tokens.
- Permiso seleccionado: `Object Read & Write`.
- Scope seleccionado: solo bucket `shift-evidence-prod-evidence`.
- No se uso scope account-wide.
- No se uso token preview.
- No se imprimieron Access Key ni Secret.
- No se guardaron valores en docs/git.

Nota operativa:

- El campo de nombre del token no pudo editarse de forma confiable desde el navegador embebido por una limitacion de clipboard virtual del navegador.
- El criterio critico validado fue permiso y scope del token.

## 5. R2 prod smoke

Smoke directo contra R2 prod:

| Check | Resultado |
| --- | --- |
| write | OK |
| head | OK |
| read | OK |
| content verification | OK |
| SHA256 | OK |
| delete | OK |
| post-delete not found | OK |

Detalles no sensibles:

| Campo | Valor |
| --- | --- |
| Bucket | `shift-evidence-prod-evidence` |
| Object key | `_smoke/production-storage-smoke-2/79b8c540-0b5d-4626-91aa-83e574d43895/synthetic.txt` |
| Bytes | 61 |
| SHA256 | `fd48766e279762f16068558c04f8d9eef43084cec713085c1deb5cefc6010218` |
| Post-delete | not found confirmed |

Contenido:

- Synthetic smoke text only.
- No customer data.
- No client files.

Cleanup:

- El objeto sintetico fue borrado.
- No se borro nada fuera del prefijo smoke.

## 6. R2 Vercel env

Target:

- Project: `shiftevidence`.
- Environment: Production.

Variables cargadas/actualizadas por stdin:

| Variable | Estado |
| --- | --- |
| `STORAGE_DRIVER` | loaded |
| `R2_ACCOUNT_ID` | loaded |
| `R2_S3_ENDPOINT` | loaded |
| `R2_BUCKET_PREVIEW` | loaded |
| `R2_BUCKET_PROD` | loaded |
| `R2_ACCESS_KEY_ID` | loaded |
| `R2_SECRET_ACCESS_KEY` | loaded |
| `MAX_UPLOAD_SIZE_MB` | loaded |

No se imprimieron valores.

No se ejecuto:

- `vercel env pull`.
- Redeploy.
- Promote.
- Preview env changes.

## 7. Upstash prod

Estado:

- Upstash Preview/Staging existe: `shift-evidence-preview-rate-limit`.
- Se intento crear o confirmar un recurso prod dedicado.
- Upstash informo que el Free Tier permite solo 1 database.
- La consola indico que para crear mas databases se requiere agregar payment method / upgrade.

Decision:

- Fase Upstash prod detenida por requerir billing/payment method.
- No se reutilizo Preview como Production.
- No se cargo `UPSTASH_REDIS_REST_URL`.
- No se cargo `UPSTASH_REDIS_REST_TOKEN`.
- No se ejecuto smoke Upstash prod.

Resource recomendado pendiente:

- `shift-evidence-production-rate-limit`.

## 8. Admin env

`ADMIN_EMAILS`:

- Loaded: no.
- Motivo: no se recibio email productivo confirmado.
- No se documento email real.
- No se uso wildcard.

Auth/Admin smoke:

- Deferred.

## 9. Stripe safe-off confirmation

Estado vigente:

- `STRIPE_CHECKOUT_ENABLED=false` fue procesado en hito anterior.
- `STRIPE_CHECKOUT_MODE=test` fue procesado en hito anterior.
- `STRIPE_LIVE_PAYMENTS_APPROVED=false` fue procesado en hito anterior.

No se cargo:

- `STRIPE_SECRET_KEY`.
- `STRIPE_WEBHOOK_SECRET`.
- Live Price IDs.
- Wise tokens.

Stripe live sigue untouched.

## 10. Deploy status

Production deploy intencional:

- No.

Auto-deploy:

- Se verificara despues del commit/push documental.

Motivo:

- El hito prohibe deploy por defecto.
- `shiftevidence` ya tiene dominios reales.
- Upstash prod y Admin env siguen pendientes.

## 11. Que NO se toco

No se tocaron:

- DNS.
- Hostinger.
- Custom domains.
- Public launch.
- Production cutover.
- Stripe live.
- Live payments.
- Webhooks live.
- Wise automation.
- Entitlements reales.
- Grants.
- DB destructive operations.
- `prisma db push`.
- Migrations.
- Seeds con datos reales.
- Datos reales.
- Archivos de clientes.
- Upstash preview data.
- R2 objects fuera del prefijo smoke.

No se ejecuto:

- `vercel env pull`.
- Production redeploy.
- Promote.

## 12. Security review

No se imprimieron:

- `DATABASE_URL`.
- R2 keys.
- Upstash token.
- Better Auth secret.
- Stripe secret.
- Webhook secret.
- Wise token.
- Passwords.
- Bearer tokens.
- Claves privadas.
- Production admin email real.

Temporales:

- R2 Access Key ID y Secret Access Key se guardaron temporalmente fuera del repo para el smoke y la carga Vercel.
- Los temporales fueron borrados.
- El clipboard fue reemplazado por un marcador inocuo.

## 13. Riesgos

- R2 prod ya esta validado y cargado en Vercel Production, pero no aplicara al runtime actual hasta redeploy controlado.
- Upstash prod sigue bloqueado por limite Free Tier/billing.
- `ADMIN_EMAILS` sigue pendiente.
- No hacer cutover publico hasta cerrar Upstash prod, Admin env y smoke autenticado.

## 14. Estado final

| Area | Estado final |
| --- | ---: |
| PRODUCTION-INFRA-CLOSEOUT-2 | 70% |
| Production/cutover readiness | 94% |
| Vercel readiness | 97% |
| DB readiness | 97% |
| Storage/R2 readiness | 100% |
| Upstash/rate limit readiness | 70% |
| Billing readiness | 96% |
| Admin ops | 94% |
| General technical | 97% |

## 15. Proximo hito recomendado

Recomendado:

- `UPSTASH-PRODUCTION-BILLING-DECISION-AND-SMOKE-1`.

Luego:

- `AUTH-ADMIN-PRODUCTION-SMOKE-1`.
- `STRIPE-LIVE-READINESS-1`.
- `DNS-HOSTINGER-CUTOVER-PREP-1`.
- `PRODUCTION-CUTOVER-CONTROLLED`.
