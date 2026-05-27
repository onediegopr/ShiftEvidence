# AI Advisory Production Provider Runbook

## Purpose

Enable real AI Advisory provider calls in production without weakening ShiftReadiness guardrails.

## Supported Providers

- `gemini`
- `openai`
- `mock`
- `none`
- `disabled`

Recommended production provider:

- `gemini`

Fallback provider:

- `mock` or `disabled`

## Required Environment Variables

Do not print or share values.

```bash
AI_ADVISORY_ENABLED=true
AI_ADVISORY_PROVIDER=gemini
AI_ADVISORY_MODEL=gemini-1.5-flash
AI_ADVISORY_TIMEOUT_MS=15000
AI_ADVISORY_MAX_INPUT_CHARS=24000
AI_ADVISORY_MAX_OUTPUT_CHARS=6000
GEMINI_API_KEY=<secret>
```

Optional OpenAI fallback/manual switch:

```bash
AI_ADVISORY_PROVIDER=openai
AI_ADVISORY_MODEL=gpt-5.1-mini
OPENAI_API_KEY=<secret>
```

## Rollback

Fast rollback options:

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

## Data Guardrails

The AI payload must not include:

- raw RVTools/XLSX/CSV file contents.
- storage paths.
- env vars.
- passwords.
- cookies.
- bearer/session/reset tokens.
- raw uploaded file content.

Allowed payload content:

- safe assessment reference.
- aggregate inventory summary.
- internal risk findings.
- deterministic scores.
- migration context coverage.
- missing context.
- safe evidence metadata.

## Expected Behavior

If provider succeeds:

- report preview may show `AI Advisory Notes`.
- PDF may include `AI Advisory Notes`.
- deterministic readiness/confidence scores remain source of truth.

If provider fails, times out or lacks a key:

- provider status is `error` or `unavailable`.
- report preview still works.
- PDF generation still works.
- AI section is omitted unless safe output is available.

## Production Smoke

After setting production env vars:

1. Open a QA assessment in production.
2. Open report preview.
3. Confirm `AI Advisory Notes` appears.
4. Confirm no raw JSON or `[object Object]` appears.
5. Generate PDF preview.
6. Download/open PDF.
7. Confirm AI Advisory section appears.
8. Confirm readiness/confidence scores remain visible.
9. If anything fails, rollback with `AI_ADVISORY_ENABLED=false`.

## Current Limitation

AI-1.1 code supports real providers, but production activation requires Hostinger environment variable configuration outside Codex unless a secure Hostinger configuration path is provided.

## AI-1.2 Activation Attempt

Date: 2026-05-27.

Codex status:

- Hostinger env var configuration tool was not available.
- Hostinger config was not changed.
- No provider key was printed or handled.
- Public production smoke without session passed.
- Gemini production activation remains pending until env vars are configured in Hostinger.

## AI-1.2 Gemini Smoke Attempt

Date: 2026-05-27.

Status:

- Gemini production activation remains pending.
- Codex did not have Hostinger env var write access.
- A credential was provided in chat; rotate it before production use.
- The credential was not written to code, docs, logs or git.
- OpenAI remains inactive.

## AI-1.2 MCP Activation Attempt

Date: 2026-05-27.

Status: BLOQUEADO.

Codex validated:

- Local Git was clean and synchronized with `origin/main`.
- Guardrails, typecheck, lint and build passed.
- Public unauthenticated production routes were healthy.

Codex could not proceed because:

- Google AI Studio / Gemini MCP access was not available.
- No Gemini API key was available through a secure local environment or secret store.
- Hostinger runtime env write access was not available.

Production state after the attempt:

- `AI_ADVISORY_ENABLED`: not configured by Codex.
- `AI_ADVISORY_PROVIDER=gemini`: not configured by Codex.
- `GEMINI_API_KEY`: missing for Codex.
- `OPENAI_API_KEY`: not used.
- Redeploy/restart: not performed.
- Gemini real smoke: not executed.

Manual secure activation remains:

1. Configure the Gemini key as a Hostinger secret/runtime env var.
2. Configure `AI_ADVISORY_PROVIDER=gemini` and the target `AI_ADVISORY_*` limits.
3. Restart/redeploy if Hostinger requires it.
4. Run public route smoke.
5. Run authenticated preview and PDF smoke with synthetic QA data.
6. Roll back with `AI_ADVISORY_ENABLED=false` if preview/PDF breaks.
