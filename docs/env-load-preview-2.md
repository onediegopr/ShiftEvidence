# ENV Load Preview 2

Fecha: 2026-06-07

## 1. Resumen

Este hito intentó desbloquear el smoke de Preview/Staging usando CLI y verificación remota segura. El proyecto canónico está identificado, pero el preview sigue protegido y el pull de envs no entregó valores utilizables para un runtime representativo.

Veredicto operativo actual: `blocked by owner action`.

## 2. Proyecto canónico confirmado

- Repo: `ShiftEvidence`
- Proyecto Vercel: `infrashift-r2-recovery`
- Team / owner: `shift-evidence`
- Project ID: `prj_PYbwfVjK9bZYi7AuPcV1frAl7PD3`
- Team ID: `team_LaG7tNqvwxaPIwMfXlbAReY2`
- Branch de producción: `main`
- `vercel.json`:
  - `main` deploy deshabilitado
  - `preview` deploy habilitado
- CLI disponible: `vercel 54.7.1`

## 3. Lo que se revisó en navegador embebido

- No se pudo usar navegador embebido porque esta sesión no tenía un browser conectado/utilizable.
- No se tocó producción.
- No se desactivó ninguna protección global.

## 4. Estado real de acceso

### Vercel dashboard / API

- El proyecto responde por CLI/API.
- `vercel env ls` funciona.
- `vercel api /v9/projects/prj_PYbwfVjK9bZYi7AuPcV1frAl7PD3` confirma:
  - `private: true`
  - `ssoProtection` activa
  - `productionBranch: main`
  - preview envs scopeadas a ramas `preview` y `feature/demo-funnel-2`

### Preview URL verificada

- `https://infrashift-r2-recovery-r7nscvzzv-shift-evidence.vercel.app`
- Resultado remoto: `401` en públicas, privadas y PDFs
- Conclusión: preview protegida por acceso, no fumable públicamente desde esta sesión

## 5. Variables confirmadas por scope en Vercel

### Branch `preview`

Claves visibles en `preview`:

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

### Branch `feature/demo-funnel-2`

Claves visibles en `feature/demo-funnel-2`:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `ADMIN_EMAILS`
- `STORAGE_DRIVER`
- `MAX_UPLOAD_SIZE_MB`
- `STRIPE_CHECKOUT_ENABLED`
- `STRIPE_CHECKOUT_MODE`
- `STRIPE_LIVE_PAYMENTS_APPROVED`

### No observadas en esta sesión

- `DIRECT_URL`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `AI_ADVISORY_ENABLED`
- `AI_ADVISORY_PROVIDER`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `WISE_API_URL`
- `WISE_API_TOKEN`
- `WISE_PROFILE_ID`

## 6. Qué se cargó realmente

- Se ejecutó `vercel env pull .env.preview-branch.local --environment=preview --git-branch=preview`.
- El archivo temporal se creó correctamente.
- Al inspeccionarlo, los valores de las claves críticas llegaron como cadenas vacías entre comillas.
- Eso impidió usar el archivo como runtime representativo.
- Se eliminó el archivo temporal después de la verificación.

## 7. Smoke local intentado con el set preview descargado

### Resultado

- Públicas:
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
  - todas respondieron `200`

- PDFs:
  - `/marketing/shift-evidence-product-brief.pdf`
  - `/marketing/shift-evidence-product-brochure.pdf`
  - `/marketing/migration-blueprint-overview.pdf`
  - `/sample-reports/proxmox-migration-readiness-sample-report.pdf`
  - `/sample-reports/proxmox-migration-readiness-premium-sample-report-v3.pdf`
  - todas respondieron `200`, `application/pdf`, header `%PDF`, size > 0

- Privadas:
  - `/dashboard`
  - `/dashboard/admin`
  - `/dashboard/admin/methodology`
  - `/dashboard/admin/billing`
  - devolvieron `500`

### Build con el set preview descargado

- `npm run build` falló en prerender de `/sign-in`
- causa observada: `BetterAuthError: Invalid base URL: ""`
- eso confirma que el env pull no entregó valores utilizables para el runtime

## 8. Qué falta o requiere owner

- Acceso/bypass autorizado a la preview protegida para smoke real, o una staging URL sin `401`.
- Confirmar valores reales de preview para:
  - `DATABASE_URL`
  - `BETTER_AUTH_URL`
  - `NEXT_PUBLIC_APP_URL`
  - `BETTER_AUTH_SECRET`
  - y el resto de claves de app si el objetivo es smoke representativo
- Confirmar si `DIRECT_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `WISE_*` y `AI_*` siguen fuera de alcance por ahora.

## 9. Qué no se tocó

- Producción.
- DNS.
- Hostinger.
- Stripe live.
- Pagos reales.
- DB productiva.
- `prisma migrate deploy`.
- `db push`.
- R2 productivo.
- Secretos impresos.
- Datos reales.
- Embeddings externos.
- Scoring automático.
- Runtime de Advisor/PDF.

## 10. Validaciones locales

Se ejecutó:

- `git diff --check`
- `npm run typecheck`
- `npm run lint`

No se ejecutó `npm run test:run` ni `npm run build` como parte del hito final porque el objetivo era documentación + diagnóstico de acceso. El build con envs preview descargados se usó sólo para confirmar el bloqueo.

## 11. Próximo paso recomendado

1. `PREVIEW-R2-SMOKE-1` si se habilita acceso preview real.
2. `PREVIEW-STRIPE-TEST-SMOKE-1` si además se quiere validar checkout test.
3. `OUTREACH/PILOT-1` si se prefiere avanzar con datos customer-safe.
4. `PRODUCTION-CUTOVER-PLAN-1` sólo cuando el owner lo habilite.
