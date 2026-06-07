# Production Env Prep 2

Fecha: 2026-06-07

## 1. Alcance y proyecto canónico

Este hito documenta la preparación canónica de variables y runtime readiness sin deploy, sin DNS, sin pagos live y sin migraciones productivas.

### Proyecto canónico conocido

- Repo GitHub: `origin/main`
- Branch canónica: `main`
- Estado de Git al inicio de este hito: `HEAD = origin/main`
- Dominio canónico observado en código y docs: `shiftevidence.com` y `www.shiftevidence.com`
- Proyecto Vercel canónico: no documentado explícitamente en el repo
- Branch de preview/staging: no documentado explícitamente en el repo

### Decisiones que siguen siendo del owner

- Dominio final / redirect principal.
- Timing de Vercel Pro si hiciera falta.
- Neon de producción definitivo.
- Bucket R2 productivo definitivo.
- Gate de Stripe live.
- Flujo Wise/manual definitivo.
- Cutover DNS y rollback.

## 2. Auditoría del shell local

Se revisó la presencia de variables en el shell actual sin imprimir valores.

Resultado:

- Ninguna de las variables canónicas listas abajo está cargada en este shell.
- Eso no invalida los tests ni el build local si el código usa defaults o stubs seguros.
- Sí deja claro que el entorno productivo todavía requiere carga manual/owner action.

## 3. Matriz canónica de variables

Leyenda:

- `present`: disponible o cubierto por un default seguro para ese entorno.
- `missing`: no cargado en el shell o no listo todavía.
- `blocked`: debe cerrarse antes de avanzar ese entorno.
- `manual`: se espera carga o ejecución humana.
- `not needed`: no aplica en ese entorno o en este hito.

### 3.1 Core app, auth y URL

| Variable | Local | Preview/Staging | Production | Required? | Safe default | Dangerous/live? | Owner action required? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `DATABASE_URL` | missing | blocked | blocked | Yes | `postgresql://unit-test:unit-test@localhost:5432/unit_test` only for tests | Yes | Yes | Prisma y runtime productivo requieren Neon real; el shell actual no la tiene cargada. |
| `DIRECT_URL` | not needed | not needed | blocked | Conditional | none | Yes | Yes | Sólo para un flujo futuro de migraciones/rollback. |
| `BETTER_AUTH_SECRET` | missing | blocked | blocked | Yes | none | Yes | Yes | Sin esta clave, Auth cae en fallback 503. |
| `BETTER_AUTH_URL` | missing | blocked | blocked | Yes | `http://localhost:3000` only for local testing | Yes | Yes | Debe coincidir con el dominio canónico en prod. |
| `NEXT_PUBLIC_APP_URL` | missing | blocked | blocked | Yes | `http://localhost:3000` only for local testing | Yes | Yes | Se usa para links absolutos, checkout y redirects. |
| `PREVIEW_TRUSTED_ORIGINS` | not needed | manual | not needed | No | empty string | No | Conditional | No usar wildcards; sólo origins explícitos de preview. |
| `ADMIN_EMAILS` | missing | blocked | blocked | Yes | empty string | Yes | Yes | Allowlist estricta; sin comodines. |
| `MAX_UPLOAD_SIZE_MB` | present | present | present | No | `50` | No | No | Default seguro ya existe en código. |

### 3.2 Storage, R2 y rate limit

| Variable | Local | Preview/Staging | Production | Required? | Safe default | Dangerous/live? | Owner action required? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `STORAGE_DRIVER` | present | manual | blocked | Yes | `local` | Yes | Yes | Cambiar a `r2` sólo cuando existan buckets y credenciales. |
| `R2_ACCOUNT_ID` | not needed | blocked | blocked | Conditional | none | Yes | Yes | Requerido sólo con `STORAGE_DRIVER=r2`. |
| `R2_S3_ENDPOINT` | not needed | blocked | blocked | Conditional | none | Yes | Yes | Requerido sólo con `STORAGE_DRIVER=r2`. |
| `R2_BUCKET_PREVIEW` | not needed | blocked | not needed | Conditional | none | Yes | Yes | Bucket separado para preview. |
| `R2_BUCKET_PROD` | not needed | not needed | blocked | Conditional | none | Yes | Yes | Bucket productivo separado. |
| `R2_ACCESS_KEY_ID` | not needed | blocked | blocked | Conditional | none | Yes | Yes | Credencial de acceso R2. |
| `R2_SECRET_ACCESS_KEY` | not needed | blocked | blocked | Conditional | none | Yes | Yes | Secreto R2, nunca imprimir. |
| `UPSTASH_REDIS_REST_URL` | not needed | blocked | blocked | Conditional | none | Yes | Yes | Sólo si rate limiting se habilita para el entorno. |
| `UPSTASH_REDIS_REST_TOKEN` | not needed | blocked | blocked | Conditional | none | Yes | Yes | Sólo si rate limiting se habilita para el entorno. |

### 3.3 Billing, Stripe y Wise

| Variable | Local | Preview/Staging | Production | Required? | Safe default | Dangerous/live? | Owner action required? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `STRIPE_CHECKOUT_ENABLED` | missing | blocked | blocked | Conditional | `false` | Yes | Yes | Si falta, checkout debe quedarse safe-off. |
| `STRIPE_CHECKOUT_MODE` | missing | blocked | blocked | Conditional | `test` | Yes | Yes | No pasar a `live` sin gate explícito. |
| `STRIPE_LIVE_PAYMENTS_APPROVED` | not needed | not needed | blocked | Conditional | `false` | Yes | Yes | Gate explícito para live; permanece apagado. |
| `STRIPE_SECRET_KEY` | missing | blocked | blocked | Conditional | none | Yes | Yes | Debe coincidir con el modo test/live. |
| `STRIPE_WEBHOOK_SECRET` | not needed | not needed | blocked | Conditional | none | Yes | Yes | Sólo cuando se active un entorno real de checkout/webhook. |
| `STRIPE_STARTER_PRICE_ID` | missing | blocked | blocked | Conditional | none | Yes | Yes | Price ID test/live no deben mezclarse. |
| `STRIPE_PROFESSIONAL_PRICE_ID` | missing | blocked | blocked | Conditional | none | Yes | Yes | Price ID test/live no deben mezclarse. |
| `STRIPE_MSP_PRICE_ID` | missing | blocked | blocked | Conditional | none | Yes | Yes | Price ID test/live no deben mezclarse. |
| `WISE_API_URL` | manual | manual | manual | No | none | No | Conditional | El flujo sigue manual por ahora. |
| `WISE_API_TOKEN` | not needed | not needed | not needed | No | none | Yes | Yes | No cargar hasta que exista un hito financiero específico. |
| `WISE_PROFILE_ID` | not needed | not needed | not needed | No | none | Yes | Yes | No cargar hasta que exista un hito financiero específico. |

### 3.4 Email e IA

| Variable | Local | Preview/Staging | Production | Required? | Safe default | Dangerous/live? | Owner action required? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `RESEND_API_KEY` | not needed | blocked | blocked | Conditional | none | Yes | Yes | No activar Resend sin DNS email y política de dominio. |
| `EMAIL_FROM` | not needed | blocked | blocked | Conditional | none | Yes | Yes | Debe acompañar el setup SPF/DKIM/DMARC si se activa email real. |
| `AI_ADVISORY_ENABLED` | present | present | present | No | `false` | No | No | El advisor puede quedar apagado sin afectar este hito. |
| `AI_ADVISORY_PROVIDER` | present | present | present | No | `none` | No | No | Sólo se usa si el advisor se habilita explícitamente. |
| `GEMINI_API_KEY` | not needed | not needed | not needed | No | none | Yes | Yes | No cargar hasta un hito AI explícito. |
| `OPENAI_API_KEY` | not needed | not needed | not needed | No | none | Yes | Yes | No cargar hasta un hito AI explícito. |
| `OPENCODE_API_KEY` | not needed | not needed | not needed | No | none | Yes | Yes | No cargar hasta un hito AI explícito. |

## 4. Matriz de go / no-go

| Área | Estado | Motivo breve |
| --- | --- | --- |
| Vercel project | Owner decision | El nombre canónico no está documentado explícitamente en el repo. |
| Vercel Pro decision | Owner decision | Depende del proyecto final y de protección/limits. |
| Domain / DNS | Blocked | Falta la decisión final de cutover y la ventana de cambios. |
| Auth | Partial | El código está preparado, pero faltan secretos y URLs canónicas cargadas. |
| DB | Blocked | `DATABASE_URL` productiva no está cargada en el shell y no hay cutover. |
| Prisma migrations | Blocked | `DIRECT_URL` y ventana de `migrate deploy` siguen pendientes. |
| R2 storage | Partial | El driver soporta `r2`, pero faltan buckets y credenciales por entorno. |
| Upstash / rate limit | Partial | Fail-closed existe, pero la configuración productiva sigue sin cargar. |
| Stripe test | Partial | El checkout está safe-off y requiere envs para probar rutas reales. |
| Stripe live | Blocked | El gate live no está aprobado. |
| Wise / manual | Ready | El flujo manual sigue siendo el respaldo operativo por ahora. |
| Email | Partial | La ruta existe, pero Resend y el dominio de correo siguen pendientes. |
| Admin access | Ready | El allowlist existe y la consola admin está lista. |
| Reports / PDFs | Ready | Los PDFs canónicos existen y el smoke local pasa. |
| Marketing PDFs | Ready | Los assets canónicos existen y están enlazados. |
| Rollback | Partial | Existe el plan, pero falta una ventana real de cutover. |
| Monitoring / logs | Partial | Hay base técnica, pero no observabilidad productiva cerrada. |
| Customer-safe pilot | Partial | Puede hacerse antes de producción, pero aún es decisión del owner. |

## 5. Production Cutover Next Gate - Not Executed

Este gate no se ejecutó todavía.

### Lo que se podrá hacer en PRODUCTION-ENV-PREP-3

- Cargar variables productivas en el proyecto canónico.
- Verificar dominios y redirects.
- Ejecutar smoke post-carga sin tocar usuarios reales.
- Cerrar el checklist de auth, storage, email y billing test.

### Lo que requiere aprobación explícita

- Cualquier cambio de DNS.
- Cualquier promoción a producción de Vercel.
- Cualquier migración productiva.
- Cualquier activación de Stripe live.
- Cualquier automatización de Wise.

### Lo que sigue bloqueado

- Cutover público.
- `prisma migrate deploy` productivo.
- `db push` productivo.
- Pago live.
- Activación de AI con costo real.

### Variables que deben cargarse manualmente

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `ADMIN_EMAILS`
- `STORAGE_DRIVER`
- `R2_*` según preview/prod
- `UPSTASH_*` si rate limiting se activa
- `STRIPE_*` de test o live según gate
- `RESEND_API_KEY` y `EMAIL_FROM` si se activa email real

### Smoke posterior requerido

- Routes públicas.
- Routes privadas sin sesión.
- PDFs canónicos.
- Auth redirects.
- Checkout safe-off o test.
- Storage read/write básico.

## 6. Qué se auditó

- Configuración canónica de variables.
- Separación local / preview / production.
- Auth y trusted origins.
- Prisma y flujo de migración.
- R2 preview/prod.
- Rate limiting.
- Stripe test/live.
- Wise/manual.
- Email.
- AI advisor.

## 7. Qué quedó documentado

- La matriz canónica de variables.
- La lectura de riesgo por entorno.
- El go/no-go por área.
- El siguiente gate de cutover sin ejecutar.

## 8. Qué no se ejecutó

- No deploy.
- No DNS.
- No Hostinger.
- No Vercel production promotion.
- No `prisma migrate deploy`.
- No `db push`.
- No reset de DB.
- No Stripe live.
- No Wise real.
- No R2 destructivo.
- No secretos impresos.
- No datos reales.
- No embeddings externos.
- No scoring automático.
- No cambio runtime de Advisor/PDF.

## 9. Validación local

- `git diff --check`
- `npx prisma validate`
- `npx prisma generate`
- `npm run typecheck`
- `npm run lint`
- `npx vitest run tests/unit/marketingPdfAssets.test.ts`
- `npx vitest run tests/unit/methodologyKbFoundation.test.ts tests/unit/methodologyExtractionExpansion.test.ts tests/unit/methodologyPersistence.test.ts`
- `npm run test:run`
- `npm run build`

Si `next dev -p 3000` deja lock en `.next`, se documenta y se cierra sólo si hace falta para el build local.

## 10. Recomendación final

Veredicto: `bloqueado para cutover`, pero `listo para carga manual de env` y `listo para preview smoke`.

Siguiente paso recomendado:

1. `PRODUCTION-ENV-PREP-3` para carga manual y smoke post-carga.
2. `OUTREACH/PILOT-1` si se quiere validar mercado con datos customer-safe antes de producción.
3. `METHODOLOGY-4` sólo si se quiere seguir profundizando el motor interno antes de operar.
