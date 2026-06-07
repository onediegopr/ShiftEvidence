# ENV Load Preview 1

Fecha: 2026-06-07

## 1. Proyecto canónico detectado

- Repo GitHub ligado: `ShiftEvidence`
- Owner / org: `shift-evidence`
- Proyecto Vercel: `infrashift-r2-recovery`
- Project ID: `prj_PYbwfVjK9bZYi7AuPcV1frAl7PD3`
- Team ID: `team_LaG7tNqvwxaPIwMfXlbAReY2`
- Branch de producción configurada: `main`
- `vercel.json`:
  - `main` deploy deshabilitado
  - `preview` deploy habilitado
- CLI disponible:
  - `vercel 54.7.1`

## 2. Estado de acceso real

### Vercel dashboard / CLI

- `vercel env ls` responde correctamente.
- La API de Vercel responde correctamente para el proyecto.
- La lista accesible muestra variables de `preview` scopeadas a ramas:
  - `preview`
  - `feature/demo-funnel-2`
- No se observó ninguna variable de `production` en la lista accesible.

### Protección de preview

- La preview deployment pública responde `401` por protección de Vercel.
- El proyecto aparece como `private: true` en la API.
- `ssoProtection` está activo para la mayoría de los despliegues.

## 3. Variables confirmadas por scope

### Preview scope detectado en Vercel

Variables vistas en preview:

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

### Variables no cargadas o no recuperables en esta sesión

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

## 4. Qué se cargó realmente

- Se ejecutó `vercel env pull .env.preview-branch.local --environment=preview --git-branch=preview`.
- El archivo local temporal se creó correctamente.
- Al inspeccionarlo, los valores de las claves cargadas llegaron vacíos entre comillas, por lo que no hubo un set utilizable de envs para arrancar un preview local representativo.
- Se limpió el archivo temporal después de la verificación.

## 5. Qué no se cargó

- No se cargó un set usable de `DATABASE_URL`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` y demás claves de app en la sesión local.
- No se cargó nada en producción.
- No se cambió ningún env en Vercel.
- No se imprimió ningún secreto.

## 6. Preview smoke realizado

### URL preview verificada

- `https://infrashift-r2-recovery-r7nscvzzv-shift-evidence.vercel.app`

### Resultado remoto

- Todas las rutas probadas devolvieron `401` por protección:
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
  - PDFs canónicos
  - rutas privadas

### Resultado local con set preview intentado

- Rutas públicas: `200`
- PDFs canónicos: `200`, `application/pdf`, header `%PDF`, size > 0
- Rutas privadas: `500`
- Esto no es un smoke representativo para producción o preview real, porque el set de envs recuperado localmente no contenía valores utilizables.

## 7. Riesgos

- La preview pública está protegida y no puede fumarse sin acceso autenticado/bypass permitido.
- El pull local de envs preview no devolvió valores utilizables, sólo placeholders vacíos entre comillas.
- Sin valores reales, no se puede validar el comportamiento privado de forma fiel desde esta sesión.
- `STRIPE_LIVE_PAYMENTS_APPROVED` debe permanecer `false`.
- No hay evidencia de un preview smoke completo y representativo aún.

## 8. Owner actions pendientes

- Proveer o habilitar acceso autenticado/bypass para la preview protegida.
- Confirmar si el preview debe seguir privado o si hay una URL de staging accesible sin 401.
- Cargar o validar los valores reales de preview en Vercel si el objetivo es smoke representativo.
- Confirmar que `DIRECT_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `WISE_*` y `AI_*` sigan fuera de alcance por ahora.

## 9. Qué no se ejecutó

- No deploy.
- No producción.
- No DNS.
- No Hostinger.
- No Stripe live.
- No `prisma migrate deploy`.
- No `db push`.
- No reset de DB.
- No R2 destructivo.
- No pagos reales.
- No datos reales.
- No secretos impresos.
- No embeddings externos.
- No scoring automático.
- No cambio runtime de Advisor/PDF.

## 10. Validación local

- `git diff --check`
- `npm run typecheck`
- `npm run lint`

No hizo falta `npm run test:run` ni `npm run build` porque este hito quedó en documentación + verificación de acceso/env.

## 11. Veredicto

`Blocked by owner action`

Motivo:

- La preview está protegida.
- El pull de envs no produjo valores utilizables.
- No se pudo realizar un smoke preview representativo de privadas/auth/billing.

## 12. Próximo gate

1. `PREVIEW-R2-SMOKE-1` si se habilita un preview realmente accesible y con envs utilizables.
2. `PREVIEW-STRIPE-TEST-SMOKE-1` si además se quiere validar checkout test.
3. `PRODUCTION-CUTOVER-PLAN-1` sólo cuando el owner confirme acceso y estrategia.
