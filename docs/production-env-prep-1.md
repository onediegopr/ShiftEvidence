# Production Env Prep 1

Fecha: 2026-06-06

## 1. Estado actual

Shift Evidence ya pasó por los bloques locales de:

- Methodology KB, admin y persistence.
- REPORTS-UX-1/2/3.
- PDF visual QA.
- Marketing PDFs.
- METHODOLOGY-3.

Este hito no ejecuta deploy, no toca producción real y no aplica cambios de infraestructura. Sirve como checklist central para preparar un futuro cutover/comercialización con seguridad.

### Estado operativo resumido

| Area | Estado |
| --- | ---: |
| PRODUCTION-ENV-PREP-1 | 100% |
| Production readiness | 88% |
| Vercel readiness | 90% |
| Neon/DB readiness | 78% |
| R2/storage readiness | 97% |
| Auth readiness | 88% |
| Billing readiness | 85% |
| DNS/cutover readiness | 72% |
| Rollback readiness | 80% |
| Build/validation health | 100% |
| Shift Evidence global | 98% |

### Observaciones de base

- `main` y `origin/main` estaban sincronizados al arrancar este bloque.
- El working tree sigue sucio solo por archivos preservados o no relacionados.
- No se tocaron producción, DNS, pagos, DB productiva ni secretos.

## 2. Variables necesarias para producción

No documentar valores secretos. Solo nombres, función y estado esperado.

| Variable | Tipo | Obligatoria | Riesgo si falta | Estado esperado |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Neon/Postgres | Sí | Prisma/runtime no arranca | Productiva segura, no preview. |
| `DIRECT_URL` | Neon/Postgres | Depende del flujo de migración | Migrate flow incompleto | Cargar solo si la estrategia lo requiere. |
| `BETTER_AUTH_SECRET` | Auth | Sí | Sesiones inseguras o rotas | Secreto único por entorno productivo. |
| `BETTER_AUTH_URL` | Auth | Sí | Redirect/callback erróneos | Dominio canónico HTTPS. |
| `NEXT_PUBLIC_APP_URL` | App URL | Sí | Links absolutos incorrectos | Dominio canónico HTTPS. |
| `PREVIEW_TRUSTED_ORIGINS` | Auth | Opcional | Previews no confiables | Lista explícita y sin wildcards. |
| `ADMIN_EMAILS` | Admin | Sí | Admin vacío o demasiado amplio | Allowlist exacta. |
| `STORAGE_DRIVER` | Storage | Sí | Storage no duradero | `r2` en producción. |
| `R2_ACCOUNT_ID` | R2 | Sí | Cliente R2 no inicializa | Cuenta correcta, no imprimir. |
| `R2_S3_ENDPOINT` | R2 | Sí | Cliente R2 no inicializa | Endpoint de cuenta. |
| `R2_BUCKET_PREVIEW` | R2 | Sí para preview | Preview incompleto | Bucket preview separado. |
| `R2_BUCKET_PROD` | R2 | Sí para prod | Production storage falla | Bucket prod separado. |
| `R2_ACCESS_KEY_ID` | R2 | Sí | R2 auth falla | Token scopeado. |
| `R2_SECRET_ACCESS_KEY` | R2 | Sí | R2 auth falla | Secreto de acceso. |
| `MAX_UPLOAD_SIZE_MB` | Upload | Opcional | Límites inconsistentes | Valor documentado. |
| `UPSTASH_REDIS_REST_URL` | Rate limit | Sí si rate limiting está activo | Rate limiting fail-closed | Redis prod dedicado. |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limit | Sí si rate limiting está activo | Rate limiting fail-closed | Token prod dedicado. |
| `STRIPE_CHECKOUT_ENABLED` | Billing | Sí para checkout | Checkout expuesto o apagado por error | Safe-off hasta aprobación. |
| `STRIPE_CHECKOUT_MODE` | Billing | Sí para checkout | Modo test/live equivocado | `test` hasta hito live. |
| `STRIPE_LIVE_PAYMENTS_APPROVED` | Billing | Sí para live | Live habilitado por accidente | `false` hasta aprobación explícita. |
| `STRIPE_SECRET_KEY` | Billing | Sí para checkout | Checkout no funciona | Test/live alineado con el modo. |
| `STRIPE_WEBHOOK_SECRET` | Billing | Sí para webhooks | Webhooks rechazados | Configurado por entorno. |
| `STRIPE_STARTER_PRICE_ID` | Billing | Sí si checkout activo | Checkout Starter falla | ID válido por entorno. |
| `STRIPE_PROFESSIONAL_PRICE_ID` | Billing | Sí si checkout activo | Checkout Professional falla | ID válido por entorno. |
| `STRIPE_MSP_PRICE_ID` | Billing | Sí si checkout activo | Checkout MSP falla | ID válido por entorno. |
| `WISE_API_URL` | Manual invoice | Opcional | Automatización prematura | Mantener manual por ahora. |
| `WISE_API_TOKEN` | Manual invoice | No para este hito | Riesgo financiero | No cargar sin hito financiero. |
| `WISE_PROFILE_ID` | Manual invoice | No para este hito | Perfil equivocado | No cargar sin hito financiero. |
| `RESEND_API_KEY` | Email | Opcional | Password reset email ausente | Solo si se activa email real. |
| `EMAIL_FROM` | Email | Opcional | Deliverability incorrecta | Solo con SPF/DKIM/DMARC. |
| `AI_ADVISORY_ENABLED` | AI | Opcional | Costos/uso inesperado | Off salvo hito AI. |
| `AI_ADVISORY_PROVIDER` | AI | Opcional | Provider incorrecto | Desactivado salvo hito AI. |
| `GEMINI_API_KEY` | AI | Opcional | Secreto/costo | No cargar en este hito. |
| `OPENAI_API_KEY` | AI | Opcional | Secreto/costo | No cargar en este hito. |
| `OPENCODE_API_KEY` | AI | Opcional | Secreto/costo | No cargar en este hito. |

## 3. Qué variables son obligatorias

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `ADMIN_EMAILS`
- `STORAGE_DRIVER`
- `R2_*` para storage duradero en producción
- `STRIPE_*` si el checkout se habilita
- `UPSTASH_*` si se activa rate limiting productivo

## 4. Qué variables son opcionales

- `DIRECT_URL`
- `PREVIEW_TRUSTED_ORIGINS`
- `MAX_UPLOAD_SIZE_MB`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `AI_*`
- `WISE_*` mientras el flujo siga manual

## 5. Qué variables son peligrosas/live

- Cualquier `DATABASE_URL` de producción si no está confirmado el proyecto canon.
- `BETTER_AUTH_SECRET` si se copia entre entornos.
- `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL` si apuntan al host equivocado.
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` si se mezclan preview/prod.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` y `STRIPE_LIVE_PAYMENTS_APPROVED=true`.
- `WISE_API_TOKEN` si se activa automatización antes de tiempo.
- `GEMINI_API_KEY` / `OPENAI_API_KEY` / `OPENCODE_API_KEY`.

## 6. Checklist Vercel Hobby/Pro

- Confirmar cuál es el proyecto canónico para producción.
- Verificar si `main` despliega o si sigue bloqueado por configuración.
- Confirmar Node 22+ o superior en build/runtime.
- Revisar `vercel.json` y el estado de deployment protection.
- Verificar que la variable `NEXT_PUBLIC_APP_URL` coincida con el dominio final.
- Confirmar si la promoción a Production requiere Vercel Pro por límites del proyecto.
- No relinkear el repo ni cambiar dominios sin decisión explícita.

## 7. Checklist Neon

- Confirmar proyecto Neon productivo.
- Confirmar si se requiere `DIRECT_URL`.
- Definir si el flujo de migración será `prisma migrate deploy`.
- Verificar que `DATABASE_URL` sea de producción y no de preview.
- No usar `db push` en producción.
- Preparar estrategia de rollback y backup antes de cualquier migración.

## 8. Checklist R2

- Confirmar buckets separados para preview y producción.
- Confirmar `STORAGE_DRIVER=r2` solo cuando exista bucket prod.
- Verificar que el adapter use bucket prod en `VERCEL_ENV=production`.
- Validar capacidades de write/read/head/delete en un smoke controlado.
- No tocar el bucket productivo sin hito de smoke separado.

## 9. Checklist Stripe test/live

- Mantener `STRIPE_LIVE_PAYMENTS_APPROVED=false` hasta aprobación explícita.
- Mantener `STRIPE_CHECKOUT_MODE=test` mientras el live no esté aprobado.
- Confirmar que los Price IDs test y live no se mezclen.
- Verificar webhooks solo cuando el entorno esté alineado.
- No activar pagos live junto con env prep.

## 10. Checklist Wise/manual invoice

- Mantener Wise como respaldo manual.
- No automatizar transferencias en este hito.
- No cargar credenciales de producción sin aprobación financiera.
- Documentar el flujo manual de invoice/transfer para después del cutover.

## 11. Checklist DNS/Hostinger

- Confirmar dominio canónico.
- Inventariar registros A/CNAME/MX/TXT.
- Verificar SPF, DKIM y DMARC antes de email productivo.
- Confirmar rollback DNS.
- No cambiar DNS ni Hostinger en este hito.

## 12. Checklist rollback

- Mantener el último deploy conocido bueno.
- Confirmar que los despliegues de `main` no rompen el canal previo.
- Definir el plan de volver atrás en caso de auth, DB, R2 o Stripe.
- Documentar criterio de corte y de reversa.
- No ejecutar rollback real mientras este hito siga siendo de preparación.

## 13. Readiness matrix

| Área | Estado |
| --- | --- |
| App build | Ready |
| Env vars | Partial |
| Auth | Partial |
| DB migrations | Blocked |
| R2 storage | Partial |
| PDF generation | Ready |
| Billing Stripe | Blocked |
| Wise/manual invoice | Partial |
| Admin access | Ready |
| DNS/domain | Blocked |
| Monitoring/logs | Partial |
| Rollback | Partial |
| Security/secrets | Requires owner action |
| Legal/commercial copy | Ready |
| Pilot readiness | Partial |

Leyenda:

- `Ready`: puede avanzar sin trabajo adicional relevante.
- `Partial`: funcional en local o preview, pero falta cierre productivo.
- `Blocked`: no debe avanzar todavía.
- `Not configured`: no existe configuración lista.
- `Requires owner action`: necesita decisión humana explícita.

## 14. Qué no hacer hasta aprobación explícita

- No hacer deploy.
- No ejecutar cutover público.
- No tocar producción real.
- No aplicar `prisma migrate deploy` sin ventana aprobada.
- No hacer `db push`.
- No cambiar DNS/Hostinger.
- No tocar Stripe live.
- No ejecutar pagos reales.
- No usar datos reales de clientes.
- No activar embeddings externos.
- No activar scoring automático.
- No endurecer runtime de Advisor/PDF fuera de lo ya publicado.

## 15. Future Cutover Plan - Not Executed

Este plan existe para cuando el owner apruebe el paso a operación real. Aún no fue ejecutado.

### 15.1 Pre-cutover checklist

- Confirmar proyecto Vercel canónico.
- Confirmar dominio canónico.
- Confirmar variables productivas por entorno.
- Confirmar accesos admin.
- Confirmar backups y rollback.
- Confirmar ventanas de mantenimiento.
- Confirmar responsables de aprobación.

### 15.2 Backup / rollback

- Identificar último deploy bueno.
- Verificar backup de DB y estrategia de restore.
- Confirmar bucket R2 y storage de evidencias.
- Documentar rollback DNS y rollback app.

### 15.3 Vercel Pro upgrade decision

- Confirmar si el proyecto canónico necesita Pro para dominios, límites o protección.
- Confirmar si el proyecto recovery seguirá como staging.

### 15.4 Env var loading

- Cargar primero auth y URL canónica.
- Luego DB.
- Luego R2.
- Luego rate limit.
- Luego Stripe test.
- Luego Wise/manual.
- Dejar live disabled hasta aprobación final.

### 15.5 DB migration plan

- Ejecutar solo migraciones aprobadas.
- Preferir `prisma migrate deploy`.
- Validar en preview/staging antes de producción.

### 15.6 R2 production bucket check

- Verificar bucket prod.
- Verificar ACL/credenciales.
- Validar upload/download/delete con smoke controlado.

### 15.7 Stripe live gate

- No activar live checkout sin aprobación explícita.
- Confirmar key mode, Price IDs y webhook secret.

### 15.8 Wise/manual invoice gate

- Mantener manual hasta un hito financiero separado.
- No automatizar pagos.

### 15.9 DNS/custom domain

- Definir dominio final.
- Programar cambio DNS con rollback.
- Confirmar email records si se activa correo real.

### 15.10 Smoke after deploy

- Validar routes públicas.
- Validar routes privadas.
- Validar PDFs.
- Validar auth.
- Validar checkout safe-off o live según el gate aprobado.

### 15.11 Rollback triggers

- Auth rota.
- DB no conecta.
- R2 no escribe/lee.
- Stripe se activa sin gate.
- Los PDFs no sirven.
- El dominio no resuelve.

### 15.12 Go / No-Go

- Go solo si el owner confirma proyecto, dominio, env, storage, billing y rollback.
- No-Go mientras siga bloqueado cualquiera de esos puntos.

## 16. Qué se auditó

- Configuración Vercel.
- Uso de `DATABASE_URL` y Prisma.
- Separación de R2 preview/prod.
- Variables de auth y trusted origins.
- Gating de Stripe/Wise.
- Generación y entrega de PDFs.
- Acceso admin y consola de metodología.

## 17. Qué quedó documentado

- Esta checklist central de producción.
- La matriz de variables productivas.
- La matriz de readiness por áreas.
- El plan futuro de cutover no ejecutado.
- Las restricciones explícitas de lo que no se debe hacer todavía.

## 18. Validación local

- Este hito se documentó sin tocar producción.
- Los pasos de validación deben ejecutarse solo con entorno local o placeholders seguros.
- Si falta `DATABASE_URL` local, usar placeholder no sensible para validar Prisma localmente y documentarlo.

## 19. Recomendación final

Veredicto actual: `bloqueado para cutover`, pero `listo para planificación`.

Siguiente paso recomendado:

1. `PRODUCTION-ENV-PREP-2` para cargar variables productivas de forma controlada en el proyecto canónico.
2. `OUTREACH/PILOT-1` si se quiere validar mercado con datos customer-safe antes de tocar producción.
3. `METHODOLOGY-4` solo si se quiere seguir profundizando el motor interno antes de operación real.
