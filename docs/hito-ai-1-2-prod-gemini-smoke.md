# HITO AI-1.2-PROD-GEMINI-SMOKE - Gemini Production Smoke

## Objetivo

Activar Gemini real como provider de AI Advisory en produccion y validar preview/PDF con evidencia autenticada.

## Estado Inicial

- Branch: `main`.
- HEAD local esperado: `8aec1c9 docs: record Gemini production activation gate`.
- origin/main esperado: `8aec1c9` si el cierre remoto fue hecho.
- Full public launch: NO.
- OpenAI: NO activar.

## Resultado

Estado: PARCIAL / BLOQUEADO.

Motivos:

- `origin/main` no estaba en `8aec1c9`; habia un commit local pendiente de push.
- Codex no tiene herramienta para configurar runtime env vars en Hostinger.
- No se pudo cargar `GEMINI_API_KEY` como secret de Hostinger desde este entorno.
- No se pudo ejecutar smoke real contra Gemini en produccion.
- No se activo OpenAI.
- No se declaro full public launch.

## Credencial

Una credencial fue provista en el chat. Por seguridad:

- No fue escrita en codigo.
- No fue escrita en docs.
- No fue commiteada.
- No fue impresa en logs.
- No fue usada por Codex para configurar archivos locales.

Recomendacion: rotar la credencial antes de usarla en produccion, porque fue expuesta en una conversacion.

## Preflight Git

- Branch: `main`.
- Working tree inicial: limpio.
- HEAD local: `8aec1c9`.
- origin/main: `8a8e53e`.
- Estado: local ahead 1.

Decision:

- No tocar produccion mientras el cierre remoto previo no este sincronizado.

## Validaciones Pre-Activacion

Ejecutadas:

- `npm run hostinger:diagnose`: OK.
- `npm run ai:guardrails`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK despues de detener Next local y borrar solo `.next` por lock EPERM Windows/OneDrive.

Warning:

- NFT warning conocido en `next.config.mjs` / `reportStorageService`.
- No bloqueante para este hito.

## Env Vars Objetivo

Configurar manualmente en Hostinger, sin exponer valores:

```bash
AI_ADVISORY_ENABLED=true
AI_ADVISORY_PROVIDER=gemini
AI_ADVISORY_MODEL=gemini-1.5-flash
AI_ADVISORY_TIMEOUT_MS=15000
AI_ADVISORY_MAX_INPUT_CHARS=24000
AI_ADVISORY_MAX_OUTPUT_CHARS=6000
GEMINI_API_KEY=<secret>
```

No configurar:

```bash
OPENAI_API_KEY
AI_ADVISORY_PROVIDER=openai
```

## Rollback

```bash
AI_ADVISORY_ENABLED=false
```

or:

```bash
AI_ADVISORY_PROVIDER=disabled
```

## Smoke Pendiente

No se recibio evidencia user-attested de produccion con Gemini real.

Pendiente:

- configurar env vars en Hostinger.
- restart/redeploy si Hostinger lo requiere.
- ejecutar smoke publico sin sesion.
- ejecutar smoke autenticado user-attested.
- validar preview AI real.
- validar PDF AI real.
- validar no JSON crudo / no `[object Object]`.
- validar no leaks.

## Decision

- Gemini AI active in production: NO / PENDIENTE.
- Ready for limited beta AI usage: NO hasta smoke real.
- Ready for admin console: NO.
- Ready for full public launch: NO.
- Proximo hito recomendado: `AI-1.2-REMOTE-CLOSE` para sincronizar docs pendientes, luego carga manual de env vars y `AI-1.2-PROD-GEMINI-SMOKE-USER-ATTESTED`.

## AI-1.2-PROD-GEMINI-ENV-MCP Attempt

Date: 2026-05-27.

Status: BLOQUEADO.

What was validated:

- Branch `main` was clean and synchronized with `origin/main` at `38af55f`.
- `npm run hostinger:diagnose`: OK.
- `npm run ai:guardrails`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK with the known NFT/Turbopack warning in `reportStorageService`.
- Public production smoke without session passed:
  - `/`: 200.
  - `/shiftreadiness`: 200.
  - `/sign-in`: 200.
  - `/sign-up`: 200.
  - `/forgot-password`: 200.
  - `/reset-password`: 200.
  - `/dashboard`: 307 to `/sign-in`.
  - `/dashboard/assessments`: 307 to `/sign-in`.
  - `/dashboard/admin/unlock-requests`: 307 to `/sign-in`.

Blocking reason:

- No Google AI Studio / Gemini MCP was available in Codex.
- No Gemini API key was available through process environment, `.env.local`, CLI or secret store.
- No Hostinger runtime-env MCP/write tool was available in Codex.
- Hostinger config was not changed.
- Gemini production env vars were not configured.
- No redeploy/restart was executed.
- No real Gemini smoke or authenticated preview/PDF smoke was executed.

Security outcome:

- `GEMINI_API_KEY`: missing for Codex.
- Key printed: NO.
- Secrets committed: NO.
- OpenAI activated: NO.
- Raw files sent to AI: NO.
- Full public launch declared: NO.

Next required action:

- Provide a secure Gemini API key through an approved secret path and a Hostinger runtime-env write path, or configure the target env vars manually in Hostinger and then run authenticated user-attested Gemini preview/PDF smoke.
