# HITO RATE-LIMIT-1 - Critical API Rate Limiting with Upstash

## Objetivo

Agregar una capa centralizada de rate limiting para endpoints sensibles o costosos de ShiftReadiness, usando Upstash Redis como store externo y manteniendo el comportamiento actual cuando las variables de Upstash todavia no estan configuradas.

Production deploy: NO.
Production launched: NO.

## Riesgo corregido

La aplicacion no tenia una capa explicita de rate limiting para flujos criticos. Eso podia permitir abuso en password reset, intentos repetidos de confirmacion, generacion masiva de reportes PDF y uploads repetitivos de evidencia.

## Por que Upstash

Upstash Redis permite rate limiting compartido entre instancias y despliegues, sin depender de memoria local del proceso. Esto es importante para Hostinger/Next.js porque un limiter en memoria no seria confiable si hay reinicios o multiples procesos.

## Dependencias agregadas

- `@upstash/redis`
- `@upstash/ratelimit`

## Variables de entorno requeridas

Se agregaron placeholders sin valores reales en `.env.example`:

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

`.env.local` no fue modificado.

## Comportamiento si Upstash no esta configurado

El helper central detecta si faltan `UPSTASH_REDIS_REST_URL` o `UPSTASH_REDIS_REST_TOKEN`.

- Build y desarrollo local no fallan.
- Las rutas quedan en modo fail-open documentado.
- Se emite un warning seguro sin imprimir secretos.
- Si Upstash esta configurado pero el check remoto falla, se permite la request con warning seguro para preservar disponibilidad.
- Para rate limiting efectivo en produccion, ambas variables deben configurarse antes del deploy.

Esta decision evita romper produccion antes de preparar la infraestructura Redis.

## Helper central

Archivo:

- `src/server/security/rateLimit.ts`

Responsabilidades:

- crear clientes Upstash de forma lazy;
- aplicar limites por nombre de limiter;
- construir keys operativas hasheadas;
- extraer IP desde headers comunes;
- devolver errores seguros `429 Too Many Requests`;
- evitar emails, tokens o datos sensibles en claro en keys/logs.

## Rutas protegidas

### Password reset request

Archivo:

- `src/app/api/account-support/password-reset/request/route.ts`

Limites:

- por IP: 5 requests cada 10 minutos;
- por email hash: 3 requests cada 15 minutos.

La respuesta anti-enumeracion se preserva para emails invalidos o inexistentes. El rate limit devuelve un mensaje generico.

### Password reset confirm

Archivo:

- `src/app/api/account-support/password-reset/confirm/route.ts`

Limites:

- por IP: 10 intentos cada 10 minutos;
- por token hash: 5 intentos cada 10 minutos.

No se guarda el token en claro en la key operativa.

### Report generation

Archivo:

- `src/server/reports/reportGenerationService.ts`
- `src/app/api/assessments/[id]/reports/generate/route.ts`

Limites:

- por usuario + assessment: 5 cada 15 minutos;
- por usuario global: 20 por hora.

La proteccion se aplica en el servicio compartido para cubrir tanto la ruta API como server actions que generen PDF.

### Upload de evidencia

Archivo:

- `src/app/dashboard/assessments/[id]/evidence/actions.ts`

Limites:

- por usuario: 20 cada 15 minutos;
- por IP: 50 cada 15 minutos.

La validacion se ejecuta antes de leer el archivo en memoria.

## Rutas no cubiertas

AI Advisory no recibio un endpoint dedicado en este hito porque el flujo actual se dispara dentro del armado de preview/reportes y ya conserva controles de budget existentes. La generacion de reportes queda protegida como capa adicional. Si se expone un endpoint especifico de AI Advisory en el futuro, deberia agregarse un limiter dedicado por usuario y assessment.

No se aplico rate limit global a paginas publicas para evitar bloquear landing, demo o sample report.

## Privacidad de keys

- Emails: hasheados con SHA-256 antes de formar la key.
- Tokens: hasheados con SHA-256 antes de formar la key.
- User IDs y assessment IDs: tambien pasan por una key compuesta hasheada.
- Logs: no imprimen keys, emails, tokens ni variables de entorno.

## Respuesta 429

Respuesta segura:

```json
{
  "error": "Too many requests. Please try again later."
}
```

En flujos que ya usan `message`, se preserva el formato de respuesta existente con el mismo texto seguro.

Headers seguros cuando estan disponibles:

- `Retry-After`
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`

## Que no se toco

- DB schema: NO.
- Prisma migrations: NO.
- `.env.local`: NO.
- Parser RVTools: NO.
- PDF internals/rendering: NO.
- AI prompts/providers: NO.
- Pricing/scoring: NO.
- Storage hardening previo: NO.
- Auth core/Better Auth config: NO.
- Hostinger config: NO.

## Validaciones ejecutadas

- `npm run hostinger:diagnose`: OK. No imprime secretos ni conecta a la base.
- `npm run lint`: OK con warnings preexistentes de `@next/next/no-img-element`.
- `npm run typecheck`: OK.
- `npm run build`: OK.

Warning observado:

- Turbopack/NFT conocido sobre tracing desde `next.config.mjs` hacia storage local. No bloqueante para este hito.

## Riesgos pendientes

- Configurar Upstash real antes de esperar rate limiting efectivo en produccion.
- Ajustar limites con telemetria real.
- Agregar tests unitarios cuando exista una suite estable.
- CSP sigue pendiente en hito separado.
