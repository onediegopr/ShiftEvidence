# HITO ADVISOR-SMOKE-1F - Senior Advisor Post-Hotfix Real Message, Persistence & Usage Verification

## Objetivo

Validar en produccion real el `Senior Migration Advisor` despues del hotfix:

`4f401fa fix: stabilize Senior Advisor provider response handling`

El smoke debia comprobar:

- runtime actualizado;
- input habilitado;
- envio real de mensaje;
- respuesta exitosa o fallback accionable;
- persistencia del historial;
- contador/creditos;
- `AiUsageEvent` con `senior_advisor_message`;
- ausencia de errores criticos.

## Contexto

El hotfix `4f401fa` estabilizo el manejo de errores del provider Advisor:

- fallback de modelos Gemini legacy;
- manejo de text/safety/empty response;
- fallback copy mas accionable;
- metadata segura del error;
- user message queda `completed` cuando falla el provider.

El intento previo al hotfix habia fallado con:

- mensaje: `ccvxc`;
- provider/model: `gemini` / `gemini-1.5-flash`;
- status: `error`;
- `errorCategory`: `provider_error`;
- assistant message: `failed`.

## Runtime

- Commit local/origin esperado: `4f401fa`.
- Runtime productivo con `4f401fa`: no confirmado.
- Build status productivo: no visible desde este entorno.
- No se ejecuto deploy.

La automatizacion Chrome no pudo tomar control de una sesion autenticada: la extension no respondio en dos intentos. Por esa razon no se pudo confirmar visualmente el commit runtime ni ejecutar el mensaje real desde el browser autenticado.

## Public Smoke

Rutas publicas verificadas por HTTP:

| Ruta | Resultado |
| --- | --- |
| `/` | 200 OK |
| `/shiftreadiness` | 200 OK |
| `/sign-in` | 200 OK |
| `/sign-up` | 200 OK |
| `/sample-report` | 200 OK |

Todas devolvieron HTML con assets Next detectados.

## Sesion / Advisor State

No se pudo validar con sesion autenticada en este hito.

Pendiente:

- usuario `diegoperezroca@gmail.com`;
- assessment `qwqw`;
- plan label `Internal QA`;
- counter `0 / 25`, `1 / 25` o equivalente;
- input enabled;
- prompts enabled;
- send enabled with text.

## Message Send

No ejecutado.

Motivo:

- no hubo acceso automatizado funcional a Chrome/sesion autenticada;
- no se recibio reporte manual post-hotfix;
- no se autorizo deploy/retry operativo adicional.

Mensaje previsto:

```text
What should I complete next in this assessment?
```

## Persistence

No probado post-hotfix.

Pendiente:

- recargar la pagina;
- confirmar que el mensaje nuevo persiste;
- confirmar que la respuesta/fallback persiste;
- confirmar contador actualizado;
- confirmar que no hay datos de otro assessment.

## Usage / Logs

Se consulto Neon produccion en modo read-only.

Assessment identificado:

- title: `qwqw`;
- assessmentId: `cmpsoc5zt0009495ilx9atccf`;
- planLevel: `free`;
- workspaceId: `cmpom1b8p0011izfghk7eo08g`.

Resultado:

- no existe nuevo evento `senior_advisor_message` post-hotfix;
- el unico evento Advisor registrado corresponde al intento previo con `ccvxc`;
- status anterior: `error`;
- provider/model anterior: `gemini` / `gemini-1.5-flash`;
- metadata anterior: `provider_error`, sin metadata enriquecida del hotfix.

No se imprimieron secrets ni prompts completos.

## Final Status

Estado: BLOQUEADO para el smoke autenticado real.

Veredicto:

- DB/usage read-only confirma que no se ejecuto un nuevo mensaje post-hotfix;
- smoke publico OK;
- runtime productivo con `4f401fa` no confirmado;
- envio real, persistencia y usage tracking post-hotfix quedan pendientes.

## Se puede avanzar a ADVISOR-2

No.

Antes de ADVISOR-2 debe cerrarse un smoke funcional del Advisor basico:

- mensaje real enviado;
- respuesta o fallback accionable post-hotfix;
- historial persistente;
- usage event verificado;
- sin errores criticos.

## Riesgos pendientes

- confirmar deploy/runtime con `4f401fa`;
- ejecutar smoke autenticado real;
- validar respuesta Advisor;
- validar persistencia;
- validar `AiUsageEvent` con metadata nueva;
- validar provider/model efectivo;
- ADVISOR-2 Memory Vault;
- RAG;
- billing real;
- retention/export/delete;
- admin visibility;
- full public launch no declarado.

## Proximo paso

Solicitar validacion manual o reintentar con navegador autenticado operativo:

1. abrir `qwqw` como `diegoperezroca@gmail.com`;
2. abrir tab `Senior Advisor`;
3. enviar `What should I complete next in this assessment?`;
4. confirmar respuesta/fallback;
5. recargar y confirmar persistencia;
6. verificar `AiUsageEvent`.
