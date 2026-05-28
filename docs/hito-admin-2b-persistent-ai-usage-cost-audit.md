# HITO ADMIN-2B - Persistent AI Usage, Cost and Audit

Fecha: 2026-05-28.

## Objetivo

Agregar persistencia real de consumo IA para que la consola interna `/dashboard/admin` pueda mostrar llamadas IA, tokens estimados, costo estimado y consumo por usuario/evaluacion.

## Alcance implementado

- Modelo Prisma `AiUsageEvent`.
- Migracion segura no destructiva.
- Registro persistente de llamadas AI Advisory.
- Estimacion de tokens por caracteres.
- Estimacion de costo USD por modelo configurable en codigo.
- Endpoint admin read-only `GET /api/admin/ai/usage`.
- UI admin en espanol con cards, tablas, alertas y errores IA.
- Consumo IA agregado por usuario.
- Consumo IA agregado por assessment.
- Tracking separado para preview y PDF.

## DB / migracion

Modelo agregado:

- `AiUsageEvent`

Campos principales:

- `assessmentId`
- `userId`
- `provider`
- `model`
- `operationType`
- `status`
- `durationMs`
- `inputChars`
- `outputChars`
- `estimatedInputTokens`
- `estimatedOutputTokens`
- `estimatedTotalTokens`
- `estimatedCostUsd`
- `errorCategory`
- `fallbackUsed`
- `metadataJson`

Indices:

- `createdAt`
- `userId`
- `assessmentId`
- `provider`
- `status`
- `operationType`

La migracion es aditiva. No borra ni modifica datos existentes. No se ejecuto Prisma reset.

## Tracking IA

El tracking se integra en `src/server/ai/aiAdvisoryClient.ts`.

Se registran estados:

- `success`
- `error`
- `timeout`
- `unavailable`
- `disabled`
- `mock`

Se registran operaciones:

- `preview`
- `pdf`
- `synthetic_test`
- `admin_test`
- `retry`
- `unknown`

PDF report generation pasa `operationType=pdf`. Preview usa `operationType=preview`.

## Tokens y costos

Regla inicial:

- `estimatedTokens = ceil(chars / 4)`

Costos:

- `mock`, `disabled` y `none`: costo 0.
- `gemini-1.5-flash`: estimacion centralizada en helper.
- modelo desconocido: costo `null`.

La UI muestra siempre que el costo es estimado y puede diferir de la facturacion real del proveedor.

## Endpoint admin

Endpoint protegido:

- `GET /api/admin/ai/usage`

Filtros soportados:

- `range=24h|7d|30d|month`
- `provider`
- `status`
- `userId`
- `assessmentId`

Respuesta:

- `summary`
- `recentEvents`
- `byUser`
- `byAssessment`
- `recentErrors`
- `alerts`

No devuelve secrets, prompts completos, responses crudas, cookies, tokens ni rutas de storage.

## UI admin

La tab `IA y Consumo` ahora muestra:

- llamadas 24h/7d/30d;
- exitos persistidos;
- errores;
- timeouts;
- fallbacks;
- duracion promedio;
- tokens estimados;
- costo estimado;
- eventos IA persistidos;
- consumo por usuario;
- consumo por evaluacion;
- errores IA recientes;
- alertas persistentes.

La vista `Usuarios` agrega:

- llamadas IA;
- tokens IA;
- costo IA;
- ultimo uso IA.

La vista `Evaluaciones` agrega:

- llamadas IA;
- tokens IA;
- costo IA;
- errores IA;
- ultimo estado IA.

## Seguridad

No se guarda:

- prompt completo;
- respuesta cruda completa;
- API keys;
- cookies;
- tokens;
- raw uploaded files;
- storage paths privados.

`metadataJson` se sanitiza y descarta keys sensibles como `key`, `secret`, `token`, `cookie`, `password`, `authorization`, `database_url`, `direct_url`, `storage`, `path`, `prompt` y `response`.

Si falla la escritura de `AiUsageEvent`, preview/PDF no se rompen.

## Limitaciones

- La auditoria avanzada separada queda para ADMIN-3.
- No hay billing automatico real.
- No hay presupuesto mensual persistente.
- No hay acciones destructivas ni cambio de provider desde admin.
- Los costos son estimados.

## Validaciones esperadas

- `npm run hostinger:diagnose`
- `npm run ai:guardrails`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run prisma:validate`
- `npm run prisma:generate`

## Decision

- ADMIN-2B complete: SI si migracion segura, typecheck/lint/build/guardrails y push pasan.
- Ready for ADMIN-3: SI.
- Ready for full public launch: NO.

## Follow-up ADMIN-2B-PROD-MIGRATION-SMOKE

Fecha: 2026-05-28.

Resultado: PARCIAL.

El comando `npm run prisma:deploy` fue ejecutado en el runtime Codex, pero fallo de forma segura porque `DATABASE_URL` no esta disponible en ese shell. No se imprimieron secrets y no se aplico migracion productiva desde este entorno.

Produccion sin sesion siguio sana:

- publicas 200.
- privadas/admin 307 a `/sign-in`.

Pendiente:

- ejecutar `npm run prisma:deploy` en el entorno con `DATABASE_URL` productiva segura;
- validar `/dashboard/admin` autenticado;
- generar preview/PDF con Gemini para confirmar evento `AiUsageEvent` persistido.

## Follow-up ADMIN-3

Fecha: 2026-05-28.

ADMIN-3 agrega sobre la base de `AiUsageEvent`:

- presupuesto IA estimado;
- limites informativos;
- alertas por consumo;
- entitlements manuales por usuario;
- oportunidades comerciales deterministicas;
- next best action;
- auditoria avanzada de acciones admin.

Los costos siguen siendo estimados y no constituyen billing real.
