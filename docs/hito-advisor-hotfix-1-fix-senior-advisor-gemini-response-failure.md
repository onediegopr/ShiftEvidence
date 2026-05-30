# HITO ADVISOR-HOTFIX-1 - Fix Senior Advisor Gemini Response Failure

## Objetivo

Corregir el fallo donde `Senior Migration Advisor` permite escribir y enviar mensajes, pero la respuesta queda en estado `failed` usando `gemini-1.5-flash`.

El foco de este hito fue estabilizar el manejo del provider/fallback del Advisor sin cambiar el alcance funcional del modulo.

## Evidencia de falla

Produccion reportada por el usuario:

- assessment: `qwqw`;
- usuario owner: `diegoperezroca@gmail.com`;
- plan label: `Internal QA`;
- counter: `0 / 25 used`;
- input: habilitado;
- mensaje enviado: `ccvxc`;
- provider: `gemini`;
- model: `gemini-1.5-flash`;
- assistant status: `failed`;
- fallback visible:

```text
Senior Migration Advisor could not complete this answer. Deterministic assessment sections remain available; retry later or ask a narrower question.
```

## DB / Usage Read-Only

Se reviso Neon produccion en modo read-only.

Ultimo intento Advisor:

- `AiUsageEvent.operationType`: `senior_advisor_message`;
- provider: `gemini`;
- model: `gemini-1.5-flash`;
- status: `error`;
- errorCategory: `provider_error`;
- fallbackUsed: `true`;
- inputChars: `5104`;
- estimatedInputTokens: `1276`;
- assistant message persisted as `failed`;
- user message persisted in the conversation.

La metadata anterior solo registraba `provider_error`, sin HTTP status, provider status ni razon segura. Eso impedia distinguir model unavailable, quota, config, safety block, timeout o invalid response.

## Causa raiz

La causa operativa confirmada fue que el adapter del Senior Advisor trataba cualquier error Gemini como `provider_error` generico.

Brechas corregidas:

- no persistia metadata segura suficiente del error;
- no distinguia status HTTP/provider status;
- no manejaba safety blocks de Gemini de forma explicita;
- no reintentaba un modelo moderno si el runtime estaba configurado con un modelo legacy `gemini-1.5-*`;
- marcaba el mensaje del usuario como `failed` cuando el fallo real era del provider;
- el fallback era seguro pero poco accionable.

No se detecto relacion con:

- migracion DB;
- entitlement;
- locked state;
- plan resolver;
- input UI;
- Storage/Ceph;
- Licensing;
- RVTools.

## Cambios realizados

### Provider handling

Se creo:

- `src/server/advisor/seniorAdvisorProviderHandling.ts`

Incluye:

- `SeniorAdvisorProviderError`;
- categorias seguras:
  - `timeout`;
  - `provider_error`;
  - `invalid_response`;
  - `config_missing`;
  - `quota_exceeded`;
  - `model_unavailable`;
  - `safety_blocked`;
- parsing seguro de errores HTTP provider;
- extraccion robusta de texto Gemini;
- deteccion de safety block;
- fallback copy accionable;
- candidatos de modelo Gemini.

### Gemini model fallback

Si el modelo configurado es legacy `gemini-1.5-*`, el Advisor intenta:

1. modelo configurado;
2. `gemini-2.5-flash` como fallback.

No se cambia la env var productiva. El retry ocurre solo dentro del flujo Advisor.

### Persistencia

Cuando falla el provider:

- el user message queda `completed`;
- el assistant message queda `failed`;
- se guarda fallback seguro;
- se registra `AiUsageEvent`;
- se registra audit event con metadata segura;
- no se guarda prompt completo;
- no se guarda respuesta raw completa;
- no se imprimen secrets.

### Logging seguro

El logger ya no recibe el objeto de error completo en este flujo. Registra:

- provider;
- model;
- errorCategory;
- httpStatus;
- providerStatus;
- safeReason.

## Fallback behavior

El fallback ahora diferencia:

- modelo no disponible;
- quota/rate limit;
- config/API key no disponible;
- safety block;
- timeout;
- invalid response;
- provider error generico.

Todos los fallback mantienen:

- deterministic assessment sections remain available;
- no approval de migracion;
- no override de engines;
- no secretos;
- no raw file contents.

## Tests

Se agregaron casos unitarios para:

- operation type `senior_advisor_message`;
- legacy Gemini model fallback candidate;
- extraccion de texto Gemini;
- safety block sin crash;
- model unavailable convertido en fallback accionable.

## Validaciones

Validaciones ejecutadas:

- Prisma validate;
- Prisma generate;
- unit tests;
- lint;
- typecheck;
- build;
- Hostinger diagnose.

## Seguridad

Este hito no hizo:

- migraciones;
- `db push`;
- `migrate reset`;
- cambios de schema;
- cambios de env vars;
- pricing;
- billing;
- Storage/Ceph changes;
- Licensing changes;
- RVTools changes;
- deploy;
- ADVISOR-2.

## Estado esperado post-deploy

En el proximo smoke real:

- si `gemini-1.5-flash` falla por modelo legacy, Advisor debe reintentar con `gemini-2.5-flash`;
- si el provider responde, assistant queda `completed`;
- usage event queda `success`;
- si el provider sigue fallando, fallback debe explicar la causa operativa de forma mas clara;
- user message no debe quedar marcado como failed por un fallo del provider.

## Riesgos pendientes

- Confirmar el HTTP/provider status real post-hotfix.
- Ejecutar `ADVISOR-SMOKE-1F`.
- Confirmar persisted history.
- Confirmar usage tracking success/failure.
- Confirmar si conviene actualizar env `AI_ADVISORY_MODEL` en un hito operativo separado.
- ADVISOR-2 Memory Vault sigue pendiente.

## Proximo paso

Ejecutar `ADVISOR-SMOKE-1F` despues de que produccion tome este commit:

- enviar mensaje QA no sensible;
- validar respuesta;
- recargar y confirmar persistencia;
- revisar usage event;
- confirmar ausencia de secrets/raw prompts.
