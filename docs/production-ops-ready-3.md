# Production Ops Ready 3

Fecha: 2026-06-05

## 1. Objetivo

Cerrar la decision operativa de Upstash production para `shiftevidence`, crear un recurso Redis dedicado para rate limiting, cargar sus variables en Vercel Production y dejar preparado el siguiente smoke Auth/Admin.

Alcance:

- Crear Upstash Redis production dedicado.
- No reutilizar `shift-evidence-preview-rate-limit`.
- Ejecutar smoke no destructivo con key sintetica.
- Cargar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` en Vercel Production.
- Confirmar `ADMIN_EMAILS` por presencia.
- Mantener Stripe live apagado.
- No hacer deploy productivo intencional.

## 2. Estado inicial

| Area | Estado inicial |
| --- | ---: |
| PRODUCTION-OPS-READY-3 | 0% |
| Production/cutover readiness | 94% |
| Vercel readiness | 97% |
| DB readiness | 97% |
| Storage/R2 readiness | 100% |
| Upstash/rate limit readiness | 70% |
| Billing readiness | 96% |
| Admin ops | 94% |
| General technical | 97% |

## 3. Auditoria local

Repositorio:

- Branch actual: `main`.
- HEAD inicial: `019a0b44d3da822cdb0d3dec16ccba4b9d6b8be9`.
- `origin/main`: `019a0b44d3da822cdb0d3dec16ccba4b9d6b8be9`.
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

Project:

- `shiftevidence`.

Environment:

- Production.

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
| `STRIPE_CHECKOUT_ENABLED` | present |
| `STRIPE_CHECKOUT_MODE` | present |
| `STRIPE_LIVE_PAYMENTS_APPROVED` | present |

`DIRECT_URL`:

- Not required by current Prisma schema.
- Not loaded in this hito.

Upstash before this hito:

- `UPSTASH_REDIS_REST_URL`: missing.
- `UPSTASH_REDIS_REST_TOKEN`: missing.

## 5. Upstash billing decision

Decision owner:

- Opcion A aprobada.
- Crear Upstash production dedicado.
- Owner completo manualmente payment method / billing.

Reglas aplicadas:

- Codex no ingreso tarjeta.
- Codex no ingreso datos personales.
- Codex no confirmo billing sensible sin owner.
- Codex se detuvo ante plan/costo variable hasta que el owner completo/aprobo.

## 6. Upstash production resource

Recurso creado:

| Campo | Valor |
| --- | --- |
| Name | `shift-evidence-production-rate-limit` |
| Provider | AWS |
| Region | `N. Virginia, USA (us-east-1)` |
| Endpoint host | `settling-drake-143497.upstash.io` |
| Plan | Pay as You Go |
| Prod Pack | Not activated |

Notas:

- No se reutilizo `shift-evidence-preview-rate-limit`.
- El recurso preview quedo separado.
- Se dejo `Prod Pack` sin activar para no introducir un cambio adicional de plan/features.

## 7. Upstash smoke

Smoke no destructivo contra el recurso production dedicado:

| Check | Resultado |
| --- | --- |
| set/write | OK |
| get/read | OK |
| content verification | OK |
| delete | OK |
| post-delete not found | OK |

Detalles no sensibles:

| Campo | Valor |
| --- | --- |
| Key prefix | `_smoke:production-rate-limit-smoke-1` |
| Data | synthetic smoke value |
| TTL | 120 seconds |
| Customer data | none |

Observacion:

- El primer intento uso por error un token read-only de Upstash y fallo de forma segura con `NOPERM` para `set`.
- Se desmarco `Read-Only Token`.
- El smoke se repitio con token write-capable y paso completo.

## 8. Upstash Vercel env

Target:

- Project: `shiftevidence`.
- Environment: Production.

Variables cargadas/actualizadas:

| Variable | Estado |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` | loaded/updated |
| `UPSTASH_REDIS_REST_TOKEN` | loaded |

Confirmacion:

- Presencia confirmada por probe seguro de Vercel CLI.
- No se imprimieron valores en docs.
- No se ejecuto `vercel env pull`.
- No se hizo deploy productivo intencional.

## 9. Admin

`ADMIN_EMAILS`:

- Present: yes.
- Valor real no documentado.
- Smoke Auth/Admin: deferred.

Proximo smoke recomendado:

- `AUTH-ADMIN-PRODUCTION-SMOKE-1`.

## 10. Stripe

Estado:

- Stripe safe-off vigente.
- `STRIPE_CHECKOUT_ENABLED` presente.
- `STRIPE_CHECKOUT_MODE` presente.
- `STRIPE_LIVE_PAYMENTS_APPROVED` presente.

No se toco:

- Stripe live.
- Live payments.
- Live webhooks.
- Entitlements/grants reales.
- Wise automation.

## 11. Deploy status

Production deploy intencional:

- No.

Auto-deploy:

- `main` sigue protegido por `vercel.json`.
- Se verificara despues del push documental.

## 12. Que NO se toco

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
- R2 prod data fuera de smoke previo.
- Upstash preview data.

No se ejecuto:

- `vercel env pull`.
- Production redeploy.
- Promote.

## 13. Security review

No se guardaron secretos en:

- Git.
- Docs.
- Diff.
- Repo files.
- `.env.local`.
- `.env.r2-smoke.local`.

Temporales:

- Las credenciales Upstash se usaron desde pantalla/temporal fuera del repo para smoke y carga Vercel.
- El temporal fue borrado.
- El clipboard fue reemplazado por `CLEARED_BY_CODEX`.

No se documentaron:

- `UPSTASH_REDIS_REST_TOKEN`.
- `DATABASE_URL`.
- R2 keys.
- Better Auth secret.
- Stripe secret.
- Webhook secret.
- Wise token.
- Passwords.
- Auth header secrets.
- Private-key material.
- Email admin real.

## 14. Estado final

| Area | Estado final |
| --- | ---: |
| PRODUCTION-OPS-READY-3 | 100% |
| Production/cutover readiness | 96% |
| Vercel readiness | 98% |
| DB readiness | 97% |
| Storage/R2 readiness | 100% |
| Upstash/rate limit readiness | 100% |
| Billing readiness | 98% |
| Admin ops | 95% |
| General technical | 98% |

## 15. Pendientes

- `AUTH-ADMIN-PRODUCTION-SMOKE-1`.
- `STRIPE-LIVE-READINESS-1`.
- `DNS-HOSTINGER-CUTOVER-PREP-1`.
- `PRODUCTION-CUTOVER-CONTROLLED`.
