# HITO AI-PROVIDER-CONFIG-1 - Validate Gemini API Key and Advisor Runtime Provider Configuration

## Objetivo

Validar la configuracion real del provider IA para que `Senior Migration Advisor` pueda responder correctamente en produccion.

Este hito reviso:

- provider/model efectivo observado;
- presencia segura de variables locales sin imprimir secretos;
- eventos `AiUsageEvent` productivos;
- prueba minima Gemini sin exponer API key;
- estado del smoke Advisor.

No se aplicaron migraciones, no se hizo deploy, no se cambiaron env vars productivas y no se imprimieron secretos.

## Runtime / Git

- Branch local: `main`.
- HEAD local/origin: `cfd76fe fix: compact Senior Advisor UI and stabilize provider response parsing`.
- Working tree al inicio: limpio.
- Runtime productivo con `cfd76fe`: no confirmado por endpoint de version.
- `/api/admin/ai/status`: redirige a `/sign-in` sin sesion, esperado por proteccion admin.
- Build status Hostinger: no visible desde este entorno.

## Public Smoke

Rutas publicas verificadas por HTTP:

| Ruta | Resultado |
| --- | --- |
| `/` | 200 OK |
| `/shiftreadiness` | 200 OK |
| `/sign-in` | 200 OK |
| `/sign-up` | 200 OK |
| `/sample-report` | 200 OK |

## Configuracion Local Segura

Se reviso `.env.local` sin imprimir valores.

Resultado:

- `AI_ADVISORY_PROVIDER`: presente;
- `AI_ADVISORY_MODEL`: presente;
- `AI_ADVISORY_ENABLED`: presente;
- `AI_ADVISORY_TIMEOUT_MS`: presente;
- `AI_ADVISORY_MAX_INPUT_CHARS`: presente;
- `AI_ADVISORY_MAX_OUTPUT_CHARS`: presente;
- `GEMINI_API_KEY`: presente;
- `OPENAI_API_KEY`: ausente.

Los valores secretos no fueron impresos.

## Runtime Settings en DB

Se consulto Neon produccion en modo read-only.

Resultado:

- no existe `ops.runtime`;
- no existe `ai.runtime`;
- no existe `runtime.ai`;
- no existe `ai.advisory.runtime`;
- solo existe `ai.budget`.

Por lo tanto, el runtime productivo parece depender de env vars del host para provider/model/key.

## Usage Productivo Advisor

Se consulto `AiUsageEvent` en Neon produccion en modo read-only.

Ultimos eventos `senior_advisor_message`:

1. Intento con `gemini-2.5-flash`
   - status: `error`;
   - errorCategory anterior: `invalid_response`;
   - httpStatus: `400`;
   - providerStatus: `INVALID_ARGUMENT`;
   - safeReason: `API key not valid. Please pass a valid API key.`;
   - fallbackUsed: `true`.

2. Intento anterior con `gemini-1.5-flash`
   - status: `error`;
   - errorCategory anterior: `provider_error`;
   - fallbackUsed: `true`.

Conclusion: el fallo productivo confirmado es configuracion/API key invalida, no DB, entitlement, UI, migration ni modelo.

## Gemini Provider Test

Se ejecuto una prueba minima local, leyendo `GEMINI_API_KEY` desde `.env.local` sin imprimirla.

Prompt:

```text
Reply with the word OK.
```

Resultados:

- modelo local configurado: success, HTTP 200, respuesta `OK`;
- modelo productivo observado `gemini-2.5-flash`: success, HTTP 200, respuesta `OK`.

Conclusion:

- la key local es valida;
- `gemini-2.5-flash` es compatible con una key valida;
- la key/config productiva en Hostinger no coincide con una key valida o no esta llegando correctamente al runtime.

## Config Changes

No se cambiaron env vars.

Motivos:

- no hay `HOSTINGER_API_TOKEN` disponible en el entorno local;
- no hay acceso automatizado confirmado a hPanel desde este hito;
- no se debe imprimir ni copiar `GEMINI_API_KEY`;
- cualquier cambio de env productiva requiere autorizacion explicita y valor ingresado por el usuario en canal seguro.

Env var que requiere correccion en Hostinger:

- `GEMINI_API_KEY`

Opcional a confirmar:

- `AI_ADVISORY_PROVIDER=gemini`;
- `AI_ADVISORY_MODEL=gemini-2.5-flash` o modelo Gemini valido definido por producto.

## Advisor Smoke

No se ejecuto un nuevo mensaje Advisor desde sesion autenticada durante este hito.

Estado esperado despues de corregir env:

- `Senior Advisor` visible;
- `Internal QA`;
- input habilitado;
- mensaje `What should I complete next in this assessment?`;
- respuesta real o fallback correcto;
- `AiUsageEvent.status=success` si provider responde.

## Seguridad

Este hito no hizo:

- imprimir `GEMINI_API_KEY`;
- loggear prompts completos;
- loggear raw file contents;
- tocar billing;
- tocar pricing;
- migraciones;
- `db push`;
- `migrate reset`;
- deploy;
- full public launch.

## Estado Final

Estado: PARCIAL.

Validado:

- causa productiva: API key/config invalida;
- modelo `gemini-2.5-flash` compatible con key valida;
- key local valida;
- runtime settings DB no overridean provider/model/key;
- public smoke OK.

Pendiente:

- actualizar `GEMINI_API_KEY` productiva en Hostinger;
- confirmar runtime/redeploy si Hostinger lo requiere;
- ejecutar Advisor smoke real;
- verificar `AiUsageEvent.status=success`.

## Proximo Paso

Ejecutar un hito operativo con autorizacion explicita:

1. actualizar `GEMINI_API_KEY` en Hostinger/hPanel sin exponer valor;
2. redeploy/restart si Hostinger lo requiere;
3. ejecutar smoke Advisor;
4. confirmar `AiUsageEvent`.
