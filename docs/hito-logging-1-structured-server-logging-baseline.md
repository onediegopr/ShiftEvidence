# HITO LOGGING-1 - Structured Server Logging Baseline

## Objetivo

Crear una base liviana de logging estructurado server-side para ShiftReadiness / InfraShift, compatible con Next.js y logs de Hostinger, sin introducir proveedor externo ni refactor masivo.

## Problema corregido

El codigo de servidor tenia `console.warn` dispersos y algunos flujos criticos no dejaban eventos operativos estructurados. Eso dificultaba diagnosticar fallas de AI Advisory, reportes, storage/evidence, rate limiting y password reset sin riesgo de exponer datos sensibles.

## Diseno del logger

Se agrego `src/server/logging/logger.ts` con una API simple:

- `logger.info(event, metadata)`
- `logger.warn(event, metadata)`
- `logger.error(event, metadata)`

El logger emite una linea JSON por evento con:

- `level`
- `event`
- `timestamp`
- `metadata`

El logger usa `console` internamente para que Next.js y Hostinger sigan capturando stdout/stderr sin dependencias adicionales.

External logging provider: NO.

## Formato de logs

Ejemplo conceptual:

```json
{"level":"warn","event":"rate_limit_misconfigured","timestamp":"2026-05-29T00:00:00.000Z","metadata":{"reason":"missing_upstash_env"}}
```

## Eventos criticos cubiertos

- AI: `ai_advisory_provider_failed`, `ai_usage_event_persistence_failed`
- PDF/reportes: `report_generation_failed`, `report_generation_cleanup_failed`, `report_physical_cleanup_failed`, `report_delete_failed`, `report_download_failed`
- Evidence/storage: `evidence_upload_failed`, `evidence_file_cleanup_failed`, `evidence_delete_failed`
- Rate limiting: `rate_limit_misconfigured`, `rate_limit_check_failed`
- Password reset: `password_reset_request_failed`, `password_reset_confirm_failed`

## Archivos revisados

- `src/server/ai/aiAdvisoryClient.ts`
- `src/server/ai/aiUsageService.ts`
- `src/server/reports/reportGenerationService.ts`
- `src/server/security/rateLimit.ts`
- `src/server/evidence/localStorageService.ts`
- `src/app/api/account-support/password-reset/request/route.ts`
- `src/app/api/account-support/password-reset/confirm/route.ts`
- `src/app/api/assessments/[id]/reports/[reportId]/delete/route.ts`
- `src/app/api/assessments/[id]/reports/[reportId]/download/route.ts`
- `src/app/dashboard/assessments/[id]/evidence/actions.ts`

## Archivos modificados

- `src/server/logging/logger.ts`
- `src/server/ai/aiAdvisoryClient.ts`
- `src/server/ai/aiUsageService.ts`
- `src/server/reports/reportGenerationService.ts`
- `src/server/security/rateLimit.ts`
- `src/app/api/account-support/password-reset/request/route.ts`
- `src/app/api/account-support/password-reset/confirm/route.ts`
- `src/app/api/assessments/[id]/reports/[reportId]/delete/route.ts`
- `src/app/api/assessments/[id]/reports/[reportId]/download/route.ts`
- `src/app/dashboard/assessments/[id]/evidence/actions.ts`
- `docs/hito-logging-1-structured-server-logging-baseline.md`

## Politica de redaccion de datos sensibles

El logger redacta valores cuando la clave contiene terminos sensibles, incluyendo:

- `password`
- `token`
- `secret`
- `apiKey`
- `authorization`
- `cookie`
- `set-cookie`
- `UPSTASH_REDIS_REST_TOKEN`
- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_SECRET`
- `BETTER_AUTH_SECRET`
- `DATABASE_URL`
- `DIRECT_URL`
- `GEMINI_API_KEY`

Tambien:

- serializa `Error` como nombre/mensaje y stack solo fuera de produccion;
- limita strings largos;
- limita arrays grandes;
- limita profundidad de objetos;
- evita fallos por referencias circulares.

No se loguean payloads completos de AI, prompts, respuestas completas de proveedores, contenido de archivos subidos, RVTools/XLSX/CSV completos ni rutas absolutas de storage.

## Fuera de alcance

- Proveedor externo de observabilidad.
- Trace IDs o request IDs globales.
- Refactor masivo de todos los logs del repo.
- Tests dedicados de logging.
- Cambios de respuestas API.
- Cambios de UX o logica de negocio.
- Cambios de DB schema o migraciones.

## Validaciones ejecutadas

- `npm run hostinger:diagnose`: OK. No imprime valores secretos.
- `npm run lint`: OK con 10 warnings preexistentes de `<img>` en componentes/landing.
- `npm run typecheck`: OK.
- `npm run build`: OK. Warning NFT conocido de Turbopack en `next.config.mjs` / `localStorageService.ts`, no bloqueante.

## Riesgos pendientes

- Agregar tests unitarios para redaccion del logger.
- Agregar request IDs para correlacion de eventos.
- Evaluar proveedor externo de observabilidad cuando el volumen lo justifique.
- Extender cobertura de logs en rutas admin adicionales si aparecen incidentes reales.
- Configurar Upstash real para rate limiting efectivo.
- Aplicar migracion DB pendiente en produccion en hito/deploy controlado.

## Estado final

- External logging provider: NO.
- DB migration: NO.
- Production deploy: NO.
- Production launched: NO.
