# Production Infra Smoke 1

Fecha: 2026-06-05

## 1. Objetivo

Preparar infraestructura productiva basica para `shiftevidence` sin DNS, sin cutover publico, sin Stripe live, sin pagos, sin migraciones y sin datos reales.

Alcance previsto:

- Auditar Vercel Production env.
- Preparar App/Auth/Admin safe env cuando sea posible.
- Confirmar Stripe safe-off.
- Preparar y validar R2 production storage.
- Preparar y validar Upstash production rate limiting.
- No ejecutar deployment productivo intencional.

## 2. Estado inicial

| Area | Estado inicial |
| --- | ---: |
| PRODUCTION-INFRA-SMOKE-1 | 0% |
| Production/cutover readiness | 93% |
| Vercel readiness | 96% |
| DB readiness | 97% |
| Storage/R2 readiness | 97% |
| Billing readiness | 95% |
| Stripe live readiness | 65% |
| Admin ops | 94% |
| PDF/report quality | 98% |
| Avance general tecnico | 97% |

## 3. Auditoria local

Repositorio:

- Branch actual: `main`.
- HEAD inicial: `3e1a3250aadd1eff3b2e84e28c4cbaabc45d67d1`.
- `origin/main`: `3e1a3250aadd1eff3b2e84e28c4cbaabc45d67d1`.
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

## 4. Vercel Production env audit

Target:

| Campo | Valor |
| --- | --- |
| Vercel project | `shiftevidence` |
| Project ID | `prj_vPebqKyHjmKQgoyvRpugXS6aulpP` |
| Environment | Production |

Estado observado:

| Categoria | Estado |
| --- | --- |
| Core DB | `DATABASE_URL` fue cargado en el hito anterior. |
| `DIRECT_URL` | No cargado; no requerido por el schema Prisma actual. |
| App/Auth | Valores safe cargados o actualizados por stdin cuando fue posible. |
| Admin allowlist | Pendiente; no se recibio email admin productivo para cargar. |
| R2 prod | No cargado en este hito por smoke fallido. |
| Upstash prod | Pendiente; no hay recurso/credenciales prod confirmadas. |
| Stripe safe-off | Safe-off cargado o actualizado por stdin. |

No se ejecuto:

- `vercel env pull`.
- Export de env a archivo.
- Deploy productivo.
- Promote.

## 5. App/Auth/Admin env status

Variables App/Auth procesadas en Vercel Production:

| Variable | Estado |
| --- | --- |
| `BETTER_AUTH_SECRET` | Generado y enviado por stdin; valor no impreso. |
| `BETTER_AUTH_URL` | Cargado como URL productiva. |
| `NEXT_PUBLIC_APP_URL` | Cargado como URL productiva. |
| `ADMIN_EMAILS` | Pendiente; no se cargo sin email productivo confirmado. |

Notas:

- No se documento ningun valor secreto.
- No se documento ningun email real.
- No se uso wildcard.
- No se toco Preview env.

## 6. Stripe safe-off status

Variables safe-off procesadas en Vercel Production:

| Variable | Estado esperado |
| --- | --- |
| `STRIPE_CHECKOUT_ENABLED` | `false` |
| `STRIPE_CHECKOUT_MODE` | `test` |
| `STRIPE_LIVE_PAYMENTS_APPROVED` | `false` |

No se cargo:

- `STRIPE_SECRET_KEY`.
- `STRIPE_WEBHOOK_SECRET`.
- Live Price IDs.
- Test Price IDs en Production.
- Wise tokens.

Stripe live sigue bloqueado.

## 7. R2 production prep

Target planificado:

- Bucket prod: `shift-evidence-prod-evidence`.
- Smoke prefix: `_smoke/production-storage-smoke-1/`.

Local ignored env:

- `.env.r2-smoke.local` existe y contiene variables R2, pero no esta trackeado.
- No se imprimieron valores.

Resultado del smoke real contra bucket prod:

| Check | Resultado |
| --- | --- |
| write | Failed |
| head | Not reached |
| read | Not reached |
| content verification | Not reached |
| delete cleanup | Attempted safe cleanup |
| post-delete | Not applicable |

Error no sensible:

- `AccessDenied`.

Objeto sintetico usado:

- `_smoke/production-storage-smoke-1/86d72764-042c-4eff-8a95-ddb854f9e6e3/synthetic.txt`.

Contenido previsto:

- Synthetic smoke text only.
- No customer data.

Bytes/SHA256:

- No se declara como exitoso porque write fallo.

Decision:

- No cargar `STORAGE_DRIVER=r2` en Vercel Production en este hito.
- No cargar R2 prod secrets en Vercel Production en este hito.
- No declarar R2 prod listo.

Interpretacion probable:

- El token local no tiene permisos sobre bucket prod, o no corresponde al token productivo scopeado.

## 8. Upstash production prep

Estado:

- Upstash Preview/Staging existe y fue validado en hitos previos.
- Production Upstash dedicado no fue confirmado en este hito.
- `.env.local` no contiene `UPSTASH_REDIS_REST_URL` ni `UPSTASH_REDIS_REST_TOKEN`.

Resource recomendado:

- `shift-evidence-production-rate-limit`.

Env loaded:

| Variable | Estado |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` | No |
| `UPSTASH_REDIS_REST_TOKEN` | No |

Smoke:

- No ejecutado.

Motivo:

- No hay recurso/credenciales prod confirmadas y no se debe reutilizar Preview salvo decision explicita.

## 9. Deploy status

Production deploy run:

- No.

Motivo:

- El hito define por defecto no hacer deploy.
- `shiftevidence` ya tiene dominios reales.
- R2 prod y Upstash prod no quedaron listos.
- Auth/Admin production smoke queda diferido.

Post-push auto-deploy:

- Se verificara despues del commit/push documental.

## 10. Que NO se toco

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
- Upstash production.
- R2 objects fuera del prefijo smoke.

No se ejecuto:

- `vercel env pull`.
- Production redeploy.
- Promote.

## 11. Security review

No se imprimieron:

- `DATABASE_URL`.
- `DIRECT_URL`.
- `BETTER_AUTH_SECRET`.
- R2 secrets.
- Upstash tokens.
- Stripe secrets.
- Webhook secrets.
- Wise tokens.
- Passwords.
- Bearer tokens.
- Claves privadas.
- Production admin email real.

El portapapeles fue reemplazado por un marcador inocuo despues de la carga previa de secretos.

## 12. Riesgos

- R2 prod no esta listo hasta crear/usar un token con `Object Read & Write` scopeado al bucket prod.
- Upstash prod no esta listo hasta crear o confirmar recurso dedicado y cargar REST URL/token.
- `ADMIN_EMAILS` no esta cargado; admin production smoke debe esperar allowlist exacta.
- Las variables nuevas de Vercel Production no aplican al runtime actual hasta un redeploy controlado.
- No debe hacerse cutover publico hasta cerrar R2, Upstash, Auth/Admin y smoke productivo controlado.

## 13. Estado final

| Area | Estado final |
| --- | ---: |
| PRODUCTION-INFRA-SMOKE-1 | 45% |
| Production/cutover readiness | 93% |
| Vercel readiness | 96% |
| DB readiness | 97% |
| Storage/R2 readiness | 97% |
| Upstash/rate limit readiness | 70% |
| Billing readiness | 96% |
| Stripe live readiness | 65% |
| Admin ops | 94% |
| PDF/report quality | 98% |
| Avance general tecnico | 97% |

## 14. Proximo hito recomendado

Recomendado:

- `R2-PRODUCTION-TOKEN-FIX-AND-SMOKE-1`.

Luego:

- `UPSTASH-PRODUCTION-RATE-LIMIT-SMOKE-1`.
- `AUTH-ADMIN-PRODUCTION-SMOKE-1`.
- `STRIPE-LIVE-READINESS-1`.
- `DNS-HOSTINGER-CUTOVER-PREP-1`.
- `PRODUCTION-CUTOVER-CONTROLLED`.
