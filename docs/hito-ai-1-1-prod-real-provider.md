# HITO AI-1.1-PROD - Real AI Advisory Provider with Guardrails

## Objetivo

Conectar AI Advisory a providers reales (`gemini` / `openai`) manteniendo fallback, timeout, limites, sanitizacion y no raw-file policy.

## Estado Inicial

- Branch: `main`.
- HEAD/origin esperado: `b96013f test: close AI advisory mock browser QA`.
- Working tree inicial: limpio.
- Production launched: SI.
- Limited public beta: SI.
- Full public launch: NO.
- AI real external provider antes del hito: NO.

## Implementacion

Se reemplazo el stub real-provider de AI-1 por providers REST server-side:

- Gemini `generateContent`.
- OpenAI Responses API.
- Timeout con `AbortController`.
- Provider key lookup server-side.
- Fallback seguro si falta key, falla la respuesta, hay timeout o JSON invalido.
- Output normalization.
- JSON contract conservador.
- Report preview/PDF no bloquean si AI falla.

## Providers

### Gemini

- Env key: `GEMINI_API_KEY`.
- Provider: `AI_ADVISORY_PROVIDER=gemini`.
- Default model si no se configura: `gemini-2.5-flash`.
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`.
- Auth: header `x-goog-api-key`.

### OpenAI

- Env key: `OPENAI_API_KEY`.
- Provider: `AI_ADVISORY_PROVIDER=openai`.
- Default model si no se configura: `gpt-5.1-mini`.
- Endpoint: `https://api.openai.com/v1/responses`.
- Auth: `Authorization: Bearer`.
- Structured output: JSON schema.

## Feature Flags

```bash
AI_ADVISORY_ENABLED=true
AI_ADVISORY_PROVIDER=gemini
AI_ADVISORY_MODEL=gemini-2.5-flash
AI_ADVISORY_TIMEOUT_MS=15000
AI_ADVISORY_MAX_INPUT_CHARS=24000
AI_ADVISORY_MAX_OUTPUT_CHARS=6000
```

Rollback:

```bash
AI_ADVISORY_ENABLED=false
```

or:

```bash
AI_ADVISORY_PROVIDER=mock
```

or:

```bash
AI_ADVISORY_PROVIDER=disabled
```

## Guardrails Preserved

- No raw RVTools/XLSX/CSV contents.
- No storage paths.
- No env vars.
- No passwords.
- No cookies.
- No bearer/session/reset tokens.
- No prompt/response persistence.
- No DB schema change.
- No Prisma migration.
- AI does not replace deterministic readiness/confidence scores.
- Missing evidence is not inferred as fact.

## Local Environment Check

Codex checked only presence booleans, not values:

- `GEMINI_API_KEY`: absent.
- `OPENAI_API_KEY`: absent.
- `AI_ADVISORY_ENABLED`: absent.
- `AI_ADVISORY_PROVIDER`: absent.

Result:

- Real provider smoke could not be executed locally.
- Code/fallback/build validation can be completed.
- Production activation requires secure Hostinger env var configuration.

## Production Activation Status

Implementation: complete.

Production env configuration: pending outside Codex.

Production real-provider smoke: pending until env vars are configured.

Full public launch: NO.

## Decision

AI-1.1-PROD is complete for code-level real-provider readiness and rollback documentation.

It is not complete for verified production activation until Hostinger env vars are set and a user-attested authenticated production smoke confirms real AI output.
