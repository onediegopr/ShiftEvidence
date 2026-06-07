# Production Env Prep 3

Fecha: 2026-06-07

## 1. Proyecto canónico detectado

### Señales verificadas

- `main` y `origin/main` estaban sincronizados al inicio de este hito.
- Existe metadata local de Vercel en [.vercel/project.json](C:/Users/diego/OneDrive/PERSONAL/SHIFTEVIDENCE/infrashift-r2-recovery/.vercel/project.json).
- Nombre del proyecto detectado: `infrashift-r2-recovery`.
- Org/team detectado en la metadata local: `shift-evidence`.
- `vercel.json` tiene deploy de `main` deshabilitado y `preview` habilitado.
- `vercel` CLI está disponible localmente: `54.7.1`.

### Estado de acceso

- La CLI de Vercel responde y puede listar env vars del proyecto.
- La lista accesible muestra 33 variables en `preview`.
- No apareció ninguna variable con target `production` en la lista accesible.
- El shell local sigue sin tener cargadas las variables canónicas de app.

### Decisión actual

- El proyecto canónico está identificado.
- La carga real de producción sigue bloqueada por decisión del owner y por falta de entorno productivo cargado.

## 2. Estado real de acceso

### Shell local

- `DATABASE_URL`: missing
- `DIRECT_URL`: missing
- `BETTER_AUTH_SECRET`: missing
- `BETTER_AUTH_URL`: missing
- `NEXT_PUBLIC_APP_URL`: missing
- `PREVIEW_TRUSTED_ORIGINS`: missing
- `ADMIN_EMAILS`: missing
- `STORAGE_DRIVER`: missing
- `R2_*`: missing
- `UPSTASH_*`: missing
- `STRIPE_*`: missing
- `RESEND_API_KEY`: missing
- `EMAIL_FROM`: missing
- `AI_*`: missing

### Vercel preview

Se encontraron las siguientes claves en `preview`:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `PREVIEW_TRUSTED_ORIGINS`
- `ADMIN_EMAILS`
- `STORAGE_DRIVER`
- `R2_ACCOUNT_ID`
- `R2_S3_ENDPOINT`
- `R2_BUCKET_PREVIEW`
- `R2_BUCKET_PROD`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `MAX_UPLOAD_SIZE_MB`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `STRIPE_CHECKOUT_ENABLED`
- `STRIPE_CHECKOUT_MODE`
- `STRIPE_LIVE_PAYMENTS_APPROVED`
- `STRIPE_SECRET_KEY`
- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_PROFESSIONAL_PRICE_ID`
- `STRIPE_MSP_PRICE_ID`

### Vercel production

- No se retornaron claves `production` en la lista accesible.
- Estado operativo: `owner action required`.

### Claves que siguen fuera de la lista accesible

- `DIRECT_URL`
- `WISE_API_URL`
- `WISE_API_TOKEN`
- `WISE_PROFILE_ID`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `AI_ADVISORY_ENABLED`
- `AI_ADVISORY_PROVIDER`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`

## 3. Gap audit real de variables

Leyenda:

- `present`: existe en el shell local o en Vercel preview.
- `missing`: no existe en el shell local.
- `blocked`: no debe cargarse todavía en producción.
- `owner action`: necesita aprobación humana o acceso externo.
- `not needed`: no aplica en este gate.

| Variable / grupo | Local shell | Vercel preview | Production | Can Codex load now? | Risk / note |
| --- | --- | --- | --- | --- | --- |
| `DATABASE_URL` | missing | present | blocked | no | Prisma y runtime productivo dependen de Neon real. |
| `DIRECT_URL` | missing | missing | owner action | no | Sólo para un flujo futuro de migraciones/rollback. |
| `BETTER_AUTH_SECRET` | missing | present | blocked | no | No cargar producción sin owner y dominio definitivo. |
| `BETTER_AUTH_URL` | missing | present | blocked | no | Debe coincidir con el dominio canónico. |
| `NEXT_PUBLIC_APP_URL` | missing | present | blocked | no | Links absolutos y checkout dependen de esta URL. |
| `PREVIEW_TRUSTED_ORIGINS` | missing | present | owner action | no | Sólo origins explícitos, sin wildcard. |
| `ADMIN_EMAILS` | missing | present | blocked | no | Allowlist estricta, sin comodines. |
| `STORAGE_DRIVER` | missing | present | blocked | no | Debe estar alineado con R2 o local según entorno. |
| `R2_*` | missing | present | blocked | no | Preview y prod deben quedar separados. |
| `UPSTASH_*` | missing | present | blocked | no | Fail-closed si falta, pero producción sigue pendiente. |
| `STRIPE_*` | missing | present | blocked | no | Checkout safe-off; live cerrado. |
| `RESEND_API_KEY` | missing | missing | blocked | no | No activar email real todavía. |
| `EMAIL_FROM` | missing | missing | blocked | no | Requiere DNS/email policy antes de activarlo. |
| `AI_*` | missing | missing | not needed | no | Deben permanecer off hasta un hito AI explícito. |
| `WISE_*` | missing | missing | not needed | no | Mantener flujo manual por ahora. |

## 4. Plan de carga recomendado

### Orden de carga

1. Auth URLs y secretos
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL`
   - `NEXT_PUBLIC_APP_URL`
   - `PREVIEW_TRUSTED_ORIGINS`
   - `ADMIN_EMAILS`

2. DB
   - `DATABASE_URL`
   - `DIRECT_URL` sólo si el owner aprueba el flujo de migraciones.

3. R2
   - `STORAGE_DRIVER`
   - `R2_ACCOUNT_ID`
   - `R2_S3_ENDPOINT`
   - `R2_BUCKET_PREVIEW`
   - `R2_BUCKET_PROD`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`

4. Upstash
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

5. Stripe test
   - `STRIPE_CHECKOUT_ENABLED`
   - `STRIPE_CHECKOUT_MODE=test`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_STARTER_PRICE_ID`
   - `STRIPE_PROFESSIONAL_PRICE_ID`
   - `STRIPE_MSP_PRICE_ID`
   - `STRIPE_LIVE_PAYMENTS_APPROVED=false`

6. Email
   - `RESEND_API_KEY`
   - `EMAIL_FROM`

7. Wise manual
   - Mantener manual por ahora.
   - No cargar `WISE_API_TOKEN` ni `WISE_PROFILE_ID` en este gate.

8. AI off
   - Mantener `AI_ADVISORY_ENABLED=false` o sin cargar.
   - No cargar claves AI.

## 5. Variables que deben permanecer apagadas

- `STRIPE_LIVE_PAYMENTS_APPROVED=false`
- `AI_ADVISORY_ENABLED=false` o no configurado
- `AI_ADVISORY_PROVIDER=none` o no configurado
- `GEMINI_API_KEY` sin cargar
- `OPENAI_API_KEY` sin cargar
- `OPENCODE_API_KEY` sin cargar
- `WISE_API_TOKEN` sin cargar
- `WISE_PROFILE_ID` sin cargar

## 6. Riesgos

- La lista accesible de Vercel muestra sólo `preview`, así que producción sigue sin cierre operativo.
- `vercel.json` bloquea deployment de `main`, así que un cutover real requiere decisión explícita.
- `DATABASE_URL` y `BETTER_AUTH_SECRET` locales no están cargados en el shell actual.
- `R2_BUCKET_PROD` existe en preview, pero no hay evidencia de un gate productivo completo.
- Stripe live sigue cerrado y no debe abrirse en este hito.
- El build puede necesitar un placeholder local si no hay envs cargadas.

## 7. Rollback

- Mantener `main` como canal base.
- No cambiar DNS todavía.
- No promover producción hasta tener confirmación de dominio, envs y buckets.
- Si algo falla en preview smoke, volver a la configuración previa sin tocar producción.
- No borrar buckets ni variables desde este gate.

## 8. Preview smoke gate

Este smoke se debe correr después de cargar envs controladas y antes de pensar en producción.

### Públicas

- `/`
- `/about`
- `/pricing`
- `/sample-report`
- `/demo`
- `/demo/replay`
- `/demo/workspace`
- `/vmware-to-proxmox-readiness`
- `/support`
- `/security`

### PDFs

- `/marketing/shift-evidence-product-brief.pdf`
- `/marketing/shift-evidence-product-brochure.pdf`
- `/marketing/migration-blueprint-overview.pdf`
- `/sample-reports/proxmox-migration-readiness-sample-report.pdf`
- `/sample-reports/proxmox-migration-readiness-premium-sample-report-v3.pdf`

### Privadas

- `/dashboard`
- `/dashboard/admin`
- `/dashboard/admin/methodology`
- `/dashboard/admin/billing`

### Billing safe-off

- Si Stripe no está configurado, checkout debe bloquearse con seguridad.
- No debe crearse ningún pago real.
- Live debe seguir cerrado.

### Storage

- Sólo smoke de upload/download sintético.
- Nada destructivo.
- Nada contra buckets productivos sin aprobación.

## 9. Validación local ejecutada

Se ejecutó la batería local pedida sobre el estado final del repo:

- `git diff --check`
- `npx prisma validate`
- `npx prisma generate`
- `npm run typecheck`
- `npm run lint`
- `npx vitest run tests/unit/marketingPdfAssets.test.ts`
- `npx vitest run tests/unit/methodologyKbFoundation.test.ts tests/unit/methodologyExtractionExpansion.test.ts tests/unit/methodologyPersistence.test.ts`
- `npm run test:run`
- `npm run build`

Además:

- `next start`/smoke local validó públicas, privadas y PDFs.
- El build usó placeholders locales seguros para `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL`.
- Better Auth mostró warnings de secreto corto en local, esperables para placeholder.

## 10. Veredicto

`Ready for manual env loading`

Motivo:

- El proyecto canónico está identificado.
- Vercel está accesible y el proyecto responde.
- La lista preview ya contiene las variables canónicas principales.
- Producción sigue sin envs cargadas ni cutover aprobado.

Próximo gate:

1. Carga manual controlada de variables en preview/staging.
2. Preview smoke completo.
3. Recién después, decidir si vale pasar a production cutover planning.
