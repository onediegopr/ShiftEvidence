# AI Advisory Guardrails

## Scope

AI Advisory is an optional advisory layer for ShiftReadiness reports. It supports VMware to Proxmox readiness analysis without replacing deterministic scoring, parser output, risk findings or human review.

## Current Status

- Feature-flagged: YES.
- Default runtime behavior: disabled/no-op.
- Mock provider: available for safe validation.
- Real external provider calls: not enabled in AI-1.
- DB schema change: NO.
- Raw uploaded file content sent to AI: NO.
- Secrets/cookies/tokens sent to AI: NO.

## Environment Flags

- `AI_ADVISORY_ENABLED`
- `AI_ADVISORY_PROVIDER`: `none`, `mock`, `gemini`, `openai`
- `AI_ADVISORY_MODEL`
- `AI_ADVISORY_TIMEOUT_MS`
- `AI_ADVISORY_MAX_INPUT_CHARS`
- `AI_ADVISORY_MAX_OUTPUT_CHARS`

If flags are absent, the advisory layer is disabled and report/PDF generation continues normally.

## Payload Rules

Allowed:

- safe assessment reference.
- high-level inventory summary.
- aggregate RVTools metrics.
- internal risk findings.
- readiness/confidence scores.
- migration context coverage.
- answered/unknown/not_applicable/skipped counts.
- missing context.
- safe evidence metadata.

Excluded:

- raw RVTools/XLSX/CSV file contents.
- full uploaded file rows.
- secrets and env vars.
- cookies, session tokens and reset tokens.
- bearer tokens.
- private storage paths.
- absolute filesystem paths.
- passwords.

## Output Rules

AI output must be normalized into:

- executive advisory notes.
- technical advisory notes.
- missing context follow-up questions.
- confidence impact.
- recommended next actions.
- limitations.
- provider status and safe metadata.

AI output must not:

- replace deterministic readiness/confidence scores.
- invent missing evidence.
- promise automatic migration.
- promise zero downtime.
- hide missing context.
- block report/PDF generation when unavailable.

## Failure Behavior

If AI is disabled, unavailable or fails:

- report preview remains available.
- PDF generation remains available.
- deterministic sections remain the source of truth.
- no user-facing crash is allowed.

## Provider Policy

AI-1 included provider stubs and a mock provider only. AI-1.1 adds guarded server-side REST providers for `gemini` and `openai`.

Provider requirements:

- API keys must be server-side environment variables.
- values must never be printed.
- missing/failed provider calls must fall back without breaking report/PDF.
- raw uploaded files must never be sent.

Production activation still requires secure environment configuration and smoke evidence.

## Production Gemini QA Result

AI-1.3 user-attested production QA reported:

- preview AI Advisory visible.
- PDF AI Advisory visible.
- deterministic scores still visible.
- no raw JSON.
- no `[object Object]`.
- no visible secrets/tokens/cookies/env vars/raw file content.
- no visible errors.

Full public launch remains outside this validation.

## AI-1.2 Production Activation Guardrail Result

Date: 2026-05-27.

Gemini production activation was attempted through available Codex/MCP paths and remained blocked:

- No Google AI Studio / Gemini MCP was available.
- No Gemini API key was available through a secure local secret path.
- No Hostinger runtime-env write access was available.
- No Hostinger config was changed.
- No redeploy/restart was executed.
- No raw files, storage paths, cookies, tokens or secrets were sent to AI.
- OpenAI was not activated.

Required secure path before enabling:

- Configure `GEMINI_API_KEY` only as a server-side Hostinger secret/env var.
- Configure `AI_ADVISORY_PROVIDER=gemini`.
- Keep `OPENAI_API_KEY` unused for this hito.
- Verify public routes, authenticated preview and PDF output.
- Confirm no raw JSON, `[object Object]`, secrets or raw evidence appears in UI/PDF/logs.
- Keep rollback ready with `AI_ADVISORY_ENABLED=false` or `AI_ADVISORY_PROVIDER=disabled`.

## Validation

Run:

```bash
npm run ai:guardrails
```

The smoke test checks representative redaction expectations for database URLs, passwords, tokens, cookies, bearer strings, email addresses, storage paths and raw file content.

## Runtime Monitoring Guardrails

AI-OPS-1 adds safe runtime monitoring:

- `getAiRuntimeStatus` returns provider status without secret values.
- `/api/admin/ai/status` is admin-protected and `no-store`.
- runtime events are in-memory and only include safe metadata.
- fallback events are recorded without prompts or raw responses.
- no DB schema was added.

Run:

```bash
npm run ai:fallback-drill
```

The fallback drill verifies:

- missing-key provider fallback.
- provider-error fallback.
- timeout classification.
- fallback event recording.
- input truncation before provider calls.
- PDF does not dump raw AI JSON.
- admin status route requires admin auth.

If the real provider fails, report preview and PDF must continue using deterministic sections.

## Synthetic Report Guardrail

AI-REPORT-1 adds:

```bash
npm run ai:report-synthetic
```

Rules:

- dataset must be synthetic/demo only.
- generated artifacts stay under ignored `qa-artifacts/`.
- Gemini success must be represented only by `providerStatus=success`.
- if `GEMINI_API_KEY` is missing, the result must be marked partial/unavailable.
- no real customer files, raw uploads, API keys or storage paths may be printed or committed.
