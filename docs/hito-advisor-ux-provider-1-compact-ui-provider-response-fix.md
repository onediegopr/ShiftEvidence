# HITO ADVISOR-UX-PROVIDER-1 - Senior Advisor Compact UI + Provider Response Fix

## Objetivo

Corregir dos problemas detectados en produccion del `Senior Migration Advisor`:

1. El panel ocupaba demasiado espacio vertical dentro del assessment.
2. Gemini seguia devolviendo fallback fallido:

```text
Senior Migration Advisor received an unusable provider response.
```

Este hito no amplio el alcance funcional del Advisor. No implemento Memory Vault, RAG, billing real, PDF integration, deploy ni migraciones.

## Problema UX

La UI anterior renderizaba en una sola columna:

- explicacion completa;
- `Can help with`;
- `Cannot do`;
- creditos;
- suggested prompts;
- historial;
- textarea.

Resultado: el usuario tenia que scrollear demasiado para leer y responder.

## Solucion UX

Se compacto `SeniorMigrationAdvisorPanel` con un layout tipo cockpit:

- header compacto con titulo, plan y estado;
- franja de usage/creditos;
- ayuda larga dentro de `<details>`;
- prompts como chips compactos;
- contenedor de chat con altura acotada y scroll interno;
- mensajes como cards compactas;
- composer separado al final;
- input de altura reducida;
- locked/enabled state preservado.

El texto customer-facing sigue en ingles.

## Problema Provider

La revision read-only de Neon mostro que el fallo real post-hotfix no era un shape raro de Gemini.

Evento observado:

- `operationType`: `senior_advisor_message`;
- provider: `gemini`;
- model: `gemini-2.5-flash`;
- status: `error`;
- `errorCategory`: `invalid_response`;
- `httpStatus`: `400`;
- `providerStatus`: `INVALID_ARGUMENT`;
- safeReason: `API key not valid. Please pass a valid API key.`;
- fallback usado: si.

La causa real era configuracion invalida de provider/API key, pero el adapter la clasificaba como `invalid_response`, produciendo fallback equivocado.

## Fix Provider

Se actualizo `seniorAdvisorProviderHandling` para:

- reclasificar errores HTTP 400 con textos de API key/auth/credentials como `config_missing`;
- mantener fallback especifico de configuracion invalida;
- soportar `empty_response` como categoria separada;
- extraer texto de Gemini desde:
  - `response.text()`;
  - `response.response.text()`;
  - `candidates[].content.parts[].text`;
  - `response.candidates[].content.parts[].text`;
  - multiples parts de texto;
- detectar parts no text sin romper;
- guardar metadata segura de shape:
  - candidate count;
  - finish reason;
  - first candidate keys;
  - first part types;
  - text function presence.

No se loggea prompt completo, respuesta completa, secrets ni raw file contents.

## Fallback Behavior

Fallbacks diferenciados:

- model unavailable;
- quota/budget exhausted;
- config/API key invalid;
- safety block;
- timeout;
- empty response;
- unsupported response;
- generic provider error.

Para el caso observado, el usuario deberia ver un fallback de configuracion invalida, no `unusable provider response`.

## Archivos Modificados

- `src/components/assessments/SeniorMigrationAdvisorPanel.tsx`
- `src/index.css`
- `src/server/advisor/seniorAdvisorProviderHandling.ts`
- `src/server/advisor/seniorAdvisorService.ts`
- `tests/unit/seniorAdvisorService.test.ts`

## Tests

Se agregaron o ampliaron tests para:

- Gemini SDK response con `text()`;
- Gemini nested `response.text()`;
- Gemini candidates parts text;
- multiples text parts joined;
- empty candidates -> `empty_response`;
- safety finishReason -> `safety_blocked`;
- non-text parts -> `invalid_response`;
- invalid Gemini API key -> `config_missing`;
- metadata segura de response shape.

## Validaciones

Validaciones ejecutadas:

- `npx prisma validate`: OK;
- `npx prisma generate`: OK;
- `npm run test:run`: OK, 43 files / 180 tests;
- `npm run lint`: OK;
- `npm run typecheck`: OK;
- `npm run build`: OK;
- `npm run hostinger:diagnose`: OK.

Nota: `npm run build` mantiene el warning conocido de Turbopack/NFT relacionado con `next.config.mjs` y `localStorageService.ts`. No es nuevo de este hito.

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
- PDF changes;
- deploy;
- ADVISOR-2.

## Estado Esperado Post-Deploy

- UI mas compacta y usable.
- Chat con scroll interno.
- Helper largo colapsado.
- Prompts visibles como chips.
- Composer claro al final.
- Si Gemini devuelve texto, Advisor responde.
- Si el provider falla por API key/config, fallback muestra causa operativa correcta.
- Historial sigue persistiendo.

## Riesgos Pendientes

- Smoke real post-deploy.
- Confirmar que la env productiva de Gemini tenga API key valida.
- Usage tracking final.
- ADVISOR-2 Memory Vault.
- RAG.
- Billing real.
- Full public launch no declarado.

## Proximo Smoke

Ejecutar `ADVISOR-SMOKE-1G`:

1. confirmar runtime con este commit;
2. abrir assessment `qwqw`;
3. enviar `What should I complete next in this assessment?`;
4. validar respuesta o fallback de config claro;
5. recargar y validar persistencia;
6. revisar `AiUsageEvent`.
