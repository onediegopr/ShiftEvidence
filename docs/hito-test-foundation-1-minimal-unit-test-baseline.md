# HITO TEST-FOUNDATION-1 - Minimal Unit Test Baseline

## Objetivo

Agregar una base minima de tests unitarios para ShiftReadiness / InfraShift, enfocada en helpers puros y de bajo acoplamiento, sin DB real, sin proveedores AI reales y sin Upstash real.

## Problema corregido

El proyecto no tenia runner de tests ni suite unitaria. Hitos recientes dejaron pendientes tests para helpers de seguridad, validacion, paginacion, logging, rate limiting, storage path containment y AI JSON handling.

## Runner elegido

Runner: Vitest.

Motivo:

- compatible con TypeScript y ESM;
- configuracion minima;
- no requiere Next runtime ni navegador;
- permite tests unitarios rapidos en entorno Node.

## Dependencias agregadas

- `vitest`

## Scripts agregados

- `npm run test`
- `npm run test:run`

## Configuracion creada

- `vitest.config.ts`
- `tests/unit/setupEnv.ts`

`setupEnv.ts` define valores dummy para variables requeridas por imports de servidor durante tests. No usa secretos reales, no conecta DB y no llama servicios externos.

## Tests agregados por modulo

### Logger

Archivo: `tests/unit/logger.test.ts`

Cubre:

- redaccion de keys sensibles;
- serializacion segura de `Error`;
- ausencia de stack en produccion;
- objetos anidados, arrays grandes y referencias circulares.

Helpers exportados para test:

- `sanitizeLogMetadata`
- `serializeLogError`

### Input limits

Archivo: `tests/unit/inputLimits.test.ts`

Cubre:

- limites esperados: company name 216, assessment title 288, description/notes/comments 3600, manual technical context 9000, email 320, URL 2048, currency 12;
- `trim()`;
- input no string;
- texto bajo, igual y sobre limite;
- inputs opcionales y requeridos.

Cambio minimo aplicado:

- se agrego `INPUT_LIMITS.currency = 12`.

### Admin pagination

Archivo: `tests/unit/adminPagination.test.ts`

Cubre:

- default limit 50;
- limit invalido/negativo;
- limit valido;
- clamp a max 100;
- page invalida;
- clamp de page;
- metadata `nextPage` sin `count()` total.

### Rate limit helpers

Archivo: `tests/unit/rateLimit.test.ts`

Cubre:

- hash normalizado;
- el hash no devuelve email/token en claro;
- IP desde headers;
- modo disabled cuando Upstash no esta configurado.

No usa Upstash real.

### Storage path containment

Archivo: `tests/unit/storagePathContainment.test.ts`

Cubre:

- path relativo legitimo;
- subcarpetas legitimas;
- rechazo de `../escape.txt`;
- rechazo de path absoluto externo;
- rechazo de prefijo tramposo `storage2` contra `storage`.

No escribe ni borra archivos fisicos.

### AI JSON handling

Archivo: `tests/unit/aiJsonHandling.test.ts`

Cubre:

- `parseJsonText()` con JSON puro;
- `parseJsonText()` con bloque ```json;
- respuesta malformada devuelve `null`;
- payload pequeno genera JSON parseable;
- payload grande genera JSON parseable sin truncado ciego tipo `[TRUNCATED]`.

Helpers exportados para test:

- `parseJsonText`
- `buildSafeJsonInput`

No llama Gemini, OpenAI ni consume budget AI.

## Fuera de alcance

- Tests E2E.
- Playwright/Cypress.
- Tests contra DB real.
- Tests de login real.
- Tests de proveedores AI reales.
- Tests de parser RVTools.
- Tests de layout/contenido PDF.
- Tests de scoring/cost formulas.
- Refactor de servicios grandes.

## Validaciones ejecutadas

- `npm run test:run`: OK, 6 archivos, 25 tests.
- `npm run hostinger:diagnose`: OK, no imprime secretos y no conecta DB.
- `npm run lint`: OK con 10 warnings preexistentes de `<img>`.
- `npm run typecheck`: OK.
- `npm run build`: OK. Warning NFT conocido de Turbopack, no bloqueante.

## Aislamiento confirmado

- DB real: NO.
- AI providers reales: NO.
- Upstash real: NO.
- Secrets/env reales: NO.
- `.env.local` tocado: NO.

## Que no se toco

- DB schema.
- Migraciones.
- Auth behavior.
- Rate limiting behavior.
- CSP/headers.
- Storage behavior.
- Parser RVTools.
- PDF layout/contenido.
- AI prompts/providers.
- Pricing/scoring.
- UI publica/admin.
- Build/deploy scripts existentes.

## Riesgos pendientes

- Tests de scoring.
- Tests de cost/risk formulas.
- Tests de parser RVTools.
- Tests de report sections/PDF.
- Tests E2E controlados.
- Tests de rutas API con mocks.
- Configurar Upstash real.
- Aplicar migracion DB pendiente en produccion.

## Estado final

- DB migration: NO.
- Production deploy: NO.
- Production launched: NO.
