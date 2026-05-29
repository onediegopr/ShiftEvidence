# HITO AI-STABILITY-1 - Safe AI Payload Truncation & JSON Parse

## Objetivo

Endurecer el cliente de AI Advisory para que el payload enviado al proveedor AI siga siendo JSON valido aunque el contexto sea grande, y para que respuestas JSON malformadas del proveedor no sean tratadas como exito silencioso.

## Problema corregido

- El input AI podia depender de una reduccion insuficiente del objeto serializado.
- Si una respuesta del proveedor no era JSON valido, el flujo podia normalizar el resultado contra fallback sin categorizar claramente la respuesta como invalida.

## Archivos revisados

- `src/server/ai/aiAdvisoryClient.ts`
- `src/server/ai/aiAdvisoryTypes.ts`
- `src/server/ai/advisoryContextPayload.ts`
- `src/server/ai/aiAdvisoryPrompts.ts`

## Archivos modificados

- `src/server/ai/aiAdvisoryClient.ts`
- `docs/hito-ai-stability-1-safe-ai-payload-truncation-json-parse.md`

## Estrategia de reduccion semantica

El cliente ahora construye el JSON de entrada desde objetos reducidos antes de serializar. La estrategia intenta, en orden:

1. Payload completo.
2. Payload moderado.
3. Payload fuerte.
4. Payload minimo.
5. Payload de emergencia.
6. Objeto vacio `{}` como ultima defensa para mantener JSON valido.

La reduccion usa los campos reales del payload:

- `riskFindings`
- `manualMigrationContext.coverage`
- `manualMigrationContext.importantContext`
- `manualMigrationContext.missingContext`
- `manualMigrationContext.answers`
- `assumptions.mismatchWarnings`
- `evidenceReceived`
- `evidenceMissing`
- `excluded`

## JSON valido garantizado

No se corta el string JSON final con `slice()`. Cada candidato se reduce como objeto y luego se serializa con `JSON.stringify()`. Si ningun candidato entra en el limite configurado, se usa `{}` como JSON valido minimo.

## Metadata de reduccion

Cuando se usa un payload reducido, se agrega `inputReduction` con:

- `truncated`
- `strategy`
- conteos originales
- conteos por severidad

Esto permite que el proveedor vea que el contexto fue resumido sin exponer archivos crudos, secrets, tokens ni paths privados.

## Parse seguro de respuestas AI

`parseJsonText()` ahora devuelve `null` ante JSON invalido. Los callers de Gemini/OpenAI usan una capa que convierte ese `null` en error controlado, para que el flujo caiga en fallback y registre la categoria `invalid_response`.

No se loguea el payload completo ni la respuesta completa del proveedor.

## Comportamiento preservado

- El contrato de `AiAdvisoryOutput` se mantiene.
- El prompt y la narrativa de negocio se mantienen.
- El fallback existente se mantiene ante errores de proveedor.
- No se tocaron proveedores, env vars, auth, sesiones, PDF, parser RVTools, scoring, DB ni UI.

## Validaciones ejecutadas

- `npm run hostinger:diagnose`: OK
- `npm run typecheck`: OK
- `npm run lint`: OK con 10 warnings conocidos de `<img>`.
- `npm run build`: OK.

Notas:

- El primer `npm run build` fallo por `EPERM` al limpiar `.next`; se verifico que el path estaba dentro del workspace y se removio solamente `.next`.
- El segundo `npm run build` paso.
- Se mantiene el warning NFT conocido de Turbopack en `next.config.mjs -> reportStorageService.ts -> reports download route`.

## Validacion logica

- Payload grande: la entrada AI se construye desde reducciones de objeto y siempre pasa por `JSON.stringify()`.
- Respuesta malformada: `parseJsonText()` devuelve `null`; los providers convierten eso en error controlado para fallback.
- Llamada real a proveedor AI: NO. No se consumio budget ni se requirieron secrets.

## Riesgos pendientes

- Rate limiting sigue pendiente para hitos futuros.
- CSP sigue pendiente para un hito separado.
- Tests unitarios especificos de AI payload/parse siguen pendientes si se formaliza infraestructura de tests.

## Estado final

- HITO AI-STABILITY-1: COMPLETO localmente.
- Production deploy: NO.
- Production launched: NO.
