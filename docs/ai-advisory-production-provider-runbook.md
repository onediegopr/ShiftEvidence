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

## AI-1.3 Production Gemini User-Attested QA

Date: 2026-05-27.

User-attested production QA result:

- AI Advisory appears in report preview: SI.
- Readiness/confidence scores remain visible: SI.
- PDF generates, downloads and opens: SI.
- AI Advisory appears in PDF: SI.
- No raw JSON or `[object Object]`: SI.
- No visible secrets/tokens/cookies/env vars/raw file content: SI.
- Visible errors: NO.
- Final confidence: PASS.

Limitation:

- The user did not conclusively select whether the response looked real vs mock. Treat provider-real visual distinction as not fully attested, while production configuration state indicates Gemini is active.

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

## AI-OPS-1 Runtime Monitoring and Fallback

Date: 2026-05-27.

Operational additions:

- Safe server-side runtime status helper: `getAiRuntimeStatus`.
- Admin-protected status endpoint: `GET /api/admin/ai/status`.
- In-memory per-process counters for requests, successes, errors, timeouts and fallback usage.
- Controlled fallback drill script: `npm run ai:fallback-drill`.

The status helper and endpoint expose only safe metadata:

- enabled/disabled state.
- provider and model labels.
- provider key presence as booleans.
- timeout and input/output limits.
- last status and last error category.
- fallback availability.
- explicit `secretosExpuestos=false` and `archivosCrudosEnviados=false`.

They do not expose:

- API keys.
- env var values.
- prompts.
- raw AI responses.
- cookies/tokens.
- raw uploaded file contents.
- private storage paths.

## Persistent AI Usage Metrics

ADMIN-2B adds persistent usage events through `AiUsageEvent`.

Persisted data is limited to safe operational metadata:

- assessment/user references when available.
- provider and model.
- operation type: preview, pdf, synthetic/admin test, retry or unknown.
- status: success, error, timeout, unavailable, fallback, disabled or mock.
- duration.
- input/output character counts.
- estimated tokens.
- estimated cost.
- error category.
- fallback flag.
- sanitized metadata.

The system does not persist:

- prompts.
- raw provider responses.
- API keys.
- cookies or tokens.
- raw uploaded files.
- private storage paths.

Admin endpoint:

- `GET /api/admin/ai/usage`

The endpoint is admin-protected and read-only.

Operational rollback remains:

```text
AI_ADVISORY_ENABLED=false
```

or:

```text
AI_ADVISORY_PROVIDER=disabled
```

ADMIN-1 can now build a Spanish admin console using the protected status endpoint without adding DB schema.

## ADMIN-4 Runtime Override

Date: 2026-05-28.

ADMIN-4 adds a DB-backed runtime override using non-secret `SystemSetting` data.

Effective AI mode:

1. `aiRuntimeMode=disabled`: AI Advisory is disabled without editing Hostinger env vars.
2. `aiRuntimeMode=mock`: AI Advisory uses mock output for controlled fallback.
3. `aiRuntimeMode=gemini`: Gemini is used only if the Gemini key is configured in runtime env.
4. `aiRuntimeMode=env`: AI Advisory follows `AI_ADVISORY_*` env vars.

Enforcement before provider call:

- runtime disabled check;
- budget block if enabled;
- entitlement check;
- safe fallback output;
- `AiUsageEvent` with `blocked_budget`, `blocked_limit` or `disabled_runtime`.

The runtime override must never store:

- provider API keys;
- prompts;
- raw responses;
- cookies/tokens;
- raw uploaded file contents;
- private storage paths.

Operational note:

- Hostinger env vars remain the base layer.
- Admin runtime settings are an override for temporary operations and controlled hardening.
- OpenAI remains inactive unless explicitly approved in a later hito.

## AI-REPORT-1 Synthetic Report Generator

Date: 2026-05-27.

Command:

```bash
npm run ai:report-synthetic
```

Purpose:

- Generate a 100% synthetic ACME Manufacturing Group readiness report.
- Use the real PDF renderer.
- Attempt Gemini with env-driven config.
- Write ignored local QA artifacts under `qa-artifacts/ai-report-1/`.

Closure rule:

- `providerStatus=success` is required before calling the Gemini portion complete.
- If local `GEMINI_API_KEY` is missing, the script still generates a renderer artifact but the hito remains partial.
- Do not commit PDFs or generated QA artifacts unless explicitly approved.

Strict Gemini-success mode:

```bash
npm run ai:report-synthetic:require-gemini
```

This writes to `qa-artifacts/ai-report-1b/` and exits non-zero unless `providerStatus=success`.

## LOCAL-GEMINI-1 Local Smoke

Date: 2026-05-28.

Use this command to validate local Gemini connectivity without printing secrets or full responses:

```bash
npm run ai:smoke-local-gemini
```

Expected output:

- `provider=gemini`.
- `geminiKeyConfigured=YES`.
- `geminiKeyPrinted=NO`.
- `openAiConfigured=NO`.
- `providerStatus=success`.
- `outputShapeValid=YES`.
- `responsePrinted=NO`.
- `secretsPrinted=NO`.

Local setup notes:

- Keep `GEMINI_API_KEY` only in ignored `.env.local` or local process env.
- Do not commit `.env.local`.
- Do not paste keys into chat, logs, docs or Git.
- `gemini-1.5-flash` returned `404 model_or_endpoint` in local smoke, so the local smoke used an available Gemini model.
- Strict synthetic PDF mode remained pending because `ai:report-synthetic:require-gemini` still returned `providerStatus=error` locally.
- OpenAI remains inactive.

## ADMIN-1 Console Consumption

Date: 2026-05-27.

The Spanish admin console now consumes the safe AI runtime status server-side and presents:

- AI enabled state.
- Provider.
- Model.
- Gemini/OpenAI key configured state without values.
- Last provider state and last error category.
- Fallback availability.
- Safe counters in memory.
- Secrets exposed: false unless runtime status reports otherwise.
- Raw files sent: false unless runtime status reports otherwise.

The console must never display API keys, prompts, raw responses, uploaded file contents, cookies, tokens or private storage paths.

Detailed cost/tokens, per-user consumption and budget alerts remain ADMIN-2 scope.

## ADMIN-2A No-DB AI Consumption Panel

Date: 2026-05-28.

The admin console now exposes a no-database AI consumption panel using runtime memory only:

- Gemini/provider status.
- Model.
- Safe key configured booleans.
- Last status and error category.
- Last duration and average duration when available.
- In-memory calls, successes, errors, timeouts and fallback counters.
- Recent in-memory AI events.
- Operational alerts.
- Honest placeholders for persistent tokens/costs.

Limitations:

- Metrics reset on deploy/restart.
- Costs and tokens are not persisted.
- User/assessment-level consumption remains ADMIN-2B scope.
- No Hostinger env vars are edited from the console.
