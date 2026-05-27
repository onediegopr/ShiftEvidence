# HITO AI-1 - Safe AI Advisory Layer

## Objetivo

Implementar una primera capa segura de AI Advisory para assessments VMware -> Proxmox, usando contexto validado, evidencia parseada agregada y findings internos, sin enviar archivos crudos ni secretos.

## Estado Inicial

- Branch: `main`.
- HEAD esperado: `90088f2 docs: close context intake production QA`.
- CONTEXT-1 production QA: COMPLETO.
- Production launched: SI.
- Limited public beta: SI.
- Full public launch: NO.

## Implementacion

Se agrego arquitectura AI Advisory con:

- config segura y feature flags.
- payload builder sanitizado.
- sanitizer/redaction.
- prompt contracts internos.
- client abstraction `generateAiAdvisory`.
- mock provider deterministico.
- stubs seguros para providers reales.
- output schema normalizado.
- integracion opcional en report preview.
- integracion opcional en PDF.
- smoke test de guardrails.

## Feature Flags

- `AI_ADVISORY_ENABLED`.
- `AI_ADVISORY_PROVIDER`: `none`, `mock`, `gemini`, `openai`.
- `AI_ADVISORY_MODEL`.
- `AI_ADVISORY_TIMEOUT_MS`.
- `AI_ADVISORY_MAX_INPUT_CHARS`.
- `AI_ADVISORY_MAX_OUTPUT_CHARS`.

Default seguro:

- AI disabled si no hay flags.
- no external calls.
- report preview/PDF no crashean.

## Payload Seguro

Incluye:

- referencia segura de assessment.
- status/type/source/target.
- resumen RVTools agregado.
- scores readiness/confidence.
- risk findings internos truncados.
- migration context summary.
- status counts: answered/unknown/not_applicable/skipped.
- missing context.
- assumptions agregadas.
- evidence metadata segura.

Excluye:

- raw RVTools/XLSX/CSV.
- storage paths.
- env vars.
- passwords.
- cookies.
- bearer/session/reset tokens.
- raw uploaded file content.

## Sanitizer

Funciones agregadas:

- `redactSecrets`.
- `redactTokens`.
- `redactEmails`.
- `truncateLongText`.
- `stripRawFileContent`.
- `stripStoragePaths`.
- `safeJsonForAI`.
- `sanitizeAiPayload`.

## Prompt Contract

Se agregaron contratos internos para:

- executive advisory.
- technical advisory.
- missing context questions.

Reglas:

- no inventar datos.
- separar confirmed/probable/missing.
- no prometer zero downtime.
- no reemplazar scores deterministas.
- no pedir credenciales ni secretos.

## Client / Provider

`generateAiAdvisory(assessment)`:

- devuelve disabled si feature flag no esta activo.
- devuelve mock advisory si `AI_ADVISORY_ENABLED=true` y provider `mock`.
- devuelve unavailable para `gemini`/`openai` en AI-1.
- no llama proveedores externos.
- nunca debe romper report/PDF.

## Report Preview

Se agrego seccion condicional `AI Advisory Notes`.

Solo aparece si providerStatus es:

- `mock`.
- `success`.

Si AI esta disabled/unavailable/error:

- no rompe.
- se omite la seccion o queda en fallback interno.

## PDF

Se agrego seccion condicional `AI Advisory Notes` al PDF.

Reglas:

- solo aparece con provider `mock` o `success`.
- si AI falla o esta disabled, PDF sigue generando.
- no mostrar JSON crudo.
- no mostrar `[object Object]`.

## Persistence / Schema

- Schema changed: NO.
- Prisma migration: NO.
- AI output persisted: NO.
- Generacion: on-demand para preview/report.

## Audit Trail

AI-1 no persiste eventos `ai_advisory_*` porque no hay external provider call ni persistence de output.

Pendiente para AI-1.1:

- registrar `ai_advisory_requested/generated/failed` cuando se habilite provider real.
- no guardar prompt completo ni respuesta cruda si no hay politica segura.

## Tests / Smoke

Se agrego:

```bash
npm run ai:guardrails
```

Validaciones cubiertas:

- database URL no sale.
- password no sale.
- email se redacta.
- storage path se redacta.
- raw file content se elimina.
- token/cookie/bearer se redactan.

## Validaciones

Validaciones tempranas ejecutadas:

- `npm run ai:guardrails`: OK.
- `npm run typecheck`: OK.

Validaciones finales requeridas:

- `npm run hostinger:diagnose`.
- `npm run typecheck`.
- `npm run lint`.
- `npm run build`.
- `git status`.

## Decision

AI-1 implementa una capa advisory segura, opcional y conservadora.

- Ready for mock advisory validation: SI.
- Ready for real provider calls: NO, requiere hito separado.
- Full public launch: NO.
