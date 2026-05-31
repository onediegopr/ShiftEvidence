# HITO ADVISOR-3E - Controlled Smoke With Methodology Flag ON

## 1. Objetivo

Validar de forma controlada que el Senior Advisor puede operar con Methodology Context activado mediante:

- validaciones locales;
- smoke local/controlado con `ADVISOR_METHODOLOGY_CONTEXT_ENABLED=true`;
- baseline publico de produccion antes de cualquier cambio;
- evaluacion de viabilidad para activar la flag en produccion;
- documentacion de rollback.

Este hito no declara full public launch.

## 2. Contexto

Base previa:

- ADVISOR-3A: Static Methodology KB Registry.
- ADVISOR-3B: Deterministic Retrieval + Prompt Preview.
- ADVISOR-3C: Prompt Integration Behind Feature Flag.
- ADVISOR-3D: Evaluation Harness + Golden Questions.

Commit base:

- `d3d0ee3 test: add advisor methodology evaluation harness`.

Feature flag:

- `ADVISOR_METHODOLOGY_CONTEXT_ENABLED`.
- default `false`.
- activa solo con valor exacto `"true"`.

## 3. Autorizacion explicita para flag ON

El usuario autorizo hacer smoke controlado con:

```text
ADVISOR_METHODOLOGY_CONTEXT_ENABLED=true
```

La autorizacion incluia produccion/Hostinger solo si existia un canal seguro para cambiar unicamente esa env var, redeploy/restart controlado y rollback inmediato.

## 4. Estado Git

Precheck:

- branch: `main`;
- working tree inicial: limpio;
- `origin/main`: sincronizado;
- HEAD inicial: `d3d0ee3`;
- stashes preservados:
  - `stash@{0}: On main: park unrelated Hero/index changes before ADVISOR-2C`;
  - `stash@{1}: On main: park beta invite docs before functional readiness`.

No se aplicaron stashes.

## 5. Validaciones locales

Ejecutado:

```text
npm run lint
npm run typecheck
npm run test:run
npm run test:run -- seniorAdvisor methodology evaluationHarness
npm run build
```

Resultados:

- `npm run lint`: OK.
- `npm run typecheck`: OK.
- `npm run test:run`: OK, 57 files / 270 tests.
- `npm run test:run -- seniorAdvisor methodology evaluationHarness`: OK, 11 files / 72 tests.
- `npm run build`: bloqueado localmente por `EPERM unlink` sobre `.next/static/mPZ8kXR0C8f6fnOOY0REf` despues de `prisma generate` OK.

Observacion:

- Se detectaron procesos Node locales de Codex.
- No se limpio `.next`.
- No se hizo accion destructiva.
- El bloqueo se trato como ambiental local, coherente con fallos EPERM previos de Windows/OneDrive.

## 6. Smoke local/controlado flag ON

Activacion local:

```text
ADVISOR_METHODOLOGY_CONTEXT_ENABLED=true
```

No se commiteo `.env`.
No se imprimieron secrets.
No se tocaron env vars productivas.

Ejecutado:

```text
npm run test:run -- seniorAdvisorMethodologyContext methodologyEvaluationHarness methodologyPromptPreview
```

Resultado:

- OK, 3 files / 25 tests.

Pregunta principal cubierta:

```text
Can we migrate production workloads without backup evidence?
```

Resultado esperado validado por tests:

- Se incluye `METHODOLOGY GUIDANCE CONTEXT` cuando la flag esta ON.
- Se seleccionan bloques de backup/no-go/evidence guidance.
- Se excluye `needs_review`.
- Se excluye `restricted`.
- Prompt injection-like input no se transforma en instruccion activa.
- Metadata segura no contiene preview completo ni contenido completo de bloques.

## 7. Produccion antes del cambio

Base verificada:

```text
https://shiftevidence.com
```

Rutas:

- `/`: 200 OK.
- `/shiftreadiness`: 200 OK.
- `/sign-in`: 200 OK.
- `/sign-up`: 200 OK.
- `/dashboard`: 307 redirect a `/sign-in`.
- `/dashboard/assessments`: 307 redirect a `/sign-in`.

Assets:

- Home contiene referencias `/_next`.
- Primer asset verificado: 200 OK.

Resultado:

- Produccion publica sana antes de cualquier cambio.
- No Hostinger 404.
- Auth redirects normales para rutas privadas sin sesion.

## 8. Activacion productiva flag ON

Ejecutado:

- No.

Motivo:

- No habia canal seguro disponible para cambiar unicamente `ADVISOR_METHODOLOGY_CONTEXT_ENABLED`.
- `HOSTINGER_API_TOKEN` no estaba disponible en el entorno local.
- El plugin Hostinger API requiere leer token desde env y no se debe improvisar con credenciales.
- No habia herramienta segura expuesta para setear una sola env var, reiniciar/redeployar y hacer rollback inmediato sin tocar otros valores.

Que no se toco:

- No se tocaron env vars productivas.
- No se toco Hostinger.
- No se hizo deploy/redeploy/restart.
- No se tocaron secrets.
- No se tocaron providers.
- No se toco DB productiva.

Rollback plan documentado:

1. Setear `ADVISOR_METHODOLOGY_CONTEXT_ENABLED=false` o remover la variable.
2. Redeploy/restart controlado si aplica.
3. Verificar `/`, `/shiftreadiness`, `/sign-in`, `/sign-up`, `/dashboard`, `/dashboard/assessments`.
4. Confirmar que rutas privadas redirigen a sign-in.

## 9. Produccion con flag ON

No ejecutado.

Razones:

- No se activo la flag en produccion.
- No habia canal seguro para cambio y rollback.
- No se debe simular evidencia productiva inexistente.

Smoke autenticado Senior Advisor:

- No ejecutado en produccion.
- No hubo user-attestation en este hito.

## 10. Metadata segura / DB read-only

DB read-only productiva:

- No ejecutado.

Motivo:

- Al no activar flag ON en produccion ni ejecutar smoke autenticado productivo, no habia evento productivo nuevo que verificar.
- No se hicieron consultas DB productivas.

Validado localmente por tests:

- `methodologyContextEnabled`.
- `methodologyContextStatus`.
- `methodologyBlockIds`.
- `methodologyBlockVersions`.
- `methodologyBlockCount`.
- `methodologyTokenEstimate`.
- No preview completo.
- No full prompt.
- No contenido completo de bloques.

## 11. Seguridad

Confirmado:

- No full prompt persistido.
- No preview completo persistido.
- No raw customer data.
- No secrets.
- No restricted blocks.
- No `needs_review` como fact.
- No DB mutation.
- No schema/migrations.
- No `prisma db push`.
- No `migrate reset`.
- No providers nuevos.
- No embeddings.
- No vector DB.
- No cookies/local storage.
- No landing.
- No `Hero.tsx`.
- No `src/index.css`.
- No stashes reaplicados.

## 12. Fallback

Fallback validado por tests de ADVISOR-3C/3D:

- Si falla el preview builder, Advisor continua sin methodology context.
- No throw.
- Metadata marca status seguro.
- Error code seguro.
- No stack trace completo.
- No contenido sensible.

No se probo fallo forzado en produccion.

## 13. Decision final

Decision:

- Produccion queda con flag OFF / sin cambio.

Motivo:

- Regla por defecto: rollback/off salvo autorizacion explicita para mantener ON.
- No se llego a activar ON por falta de canal seguro.

Verificacion post-decision:

- Produccion publica baseline sano.
- No hubo cambio productivo que revertir.

## 14. Riesgos pendientes

- Ejecutar activacion controlada con canal seguro para una unica env var.
- Smoke autenticado con flag ON.
- DB read-only de metadata post-smoke.
- Optional embeddings/RAG.
- Deeper KB curation.
- Billing real.
- Retention/export/delete.
- Admin visibility avanzada.
- Full public launch.

## 15. Proximo hito recomendado

Si se puede habilitar un canal seguro Hostinger/env:

- ADVISOR-3E-RETRY - Controlled Production Flag ON Smoke.

Si se quiere preparar antes:

- ADVISOR-3F - Controlled Activation Plan / Admin Visibility.

No recomendado:

- Activar la flag manualmente sin rollback verificado.
