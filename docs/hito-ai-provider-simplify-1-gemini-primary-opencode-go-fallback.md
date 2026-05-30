# HITO AI-PROVIDER-SIMPLIFY-1 — Gemini Primary + OpenCode Go Fallback

## Objective

Simplify ShiftReadiness AI providers so the operational path is:

- Primary: Google AI Studio Gemini.
- Fallback: OpenCode Go using an OpenAI-compatible chat completions endpoint.
- OpenAI: deprecated for normal operation and removed from visible admin selection.

This hito also records a project pause checkpoint.

## Before

- Runtime provider type included `openai` as an operational provider.
- Senior Advisor used Gemini or OpenAI Responses API depending on provider.
- OpenCode Go was not implemented.
- Production Advisor failure was caused by invalid or inaccessible Gemini API key in runtime.

## After

- `opencode_go` is supported as an internal provider ID.
- Gemini remains the primary provider.
- OpenCode Go is configured as the default fallback provider.
- OpenAI can remain as legacy code path, but it is not listed as an admin-selectable runtime mode.
- Admin status shows Gemini primary and OpenCode Go fallback state without exposing secrets.

## OpenCode Go Adapter

Endpoint:

```text
https://opencode.ai/zen/go/v1/chat/completions
```

Default fallback model:

```text
glm-5.1
```

Request style:

```json
{
  "model": "glm-5.1",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "temperature": 0.2,
  "max_tokens": 900
}
```

Response extraction:

- `choices[0].message.content` string.
- text parts in OpenAI-compatible array content.
- empty or unsupported responses become safe fallback errors.

## Fallback Chain

Senior Advisor behavior:

1. Try Gemini.
2. If Gemini succeeds, persist and track Gemini as final provider.
3. If Gemini fails by configuration, quota, timeout, model availability, invalid response or generic provider error, try OpenCode Go if configured.
4. If Gemini is blocked by provider safety, do not automatically bypass to fallback.
5. If OpenCode Go succeeds, persist and track `opencode_go` as final provider with `fallbackUsed=true`.
6. If both fail, show safe actionable fallback.

## Admin Changes

- Admin runtime quick actions remain: env, disabled, mock, Gemini.
- OpenAI is not exposed as an admin-selectable provider.
- Admin AI status displays:
  - primary provider;
  - fallback provider;
  - Gemini credential presence;
  - OpenCode Go credential presence;
  - no secret values.

## Environment Variables

Use these names only; values must be set in Hostinger, local ignored env files or secret stores:

```env
AI_ADVISORY_PROVIDER=gemini
AI_ADVISORY_MODEL=gemini-2.5-flash
AI_ADVISORY_FALLBACK_PROVIDER=opencode_go
AI_ADVISORY_FALLBACK_MODEL=glm-5.1
GEMINI_API_KEY=<SET_IN_HOSTINGER_OR_SECRET_STORE>
OPENCODE_API_KEY=<SET_IN_HOSTINGER_OR_SECRET_STORE>
OPENCODE_GO_BASE_URL=https://opencode.ai/zen/go/v1/chat/completions
```

## Senior Advisor Impact

- Entitlement, credits and chat persistence remain unchanged.
- Gemini remains primary.
- OpenCode Go can answer when Gemini fails for operational provider reasons and the fallback key exists.
- `AiUsageEvent` records the final provider/model and safe fallback metadata.

## Client Context / Storage AI Impact

- Existing Gemini/mock/disabled paths remain available.
- OpenCode Go chat-completion support was added to the shared advisory client.
- Client Context and Storage AI must continue to degrade safely if provider configuration is unavailable.

## Security

- No secrets committed.
- No prompt or raw response logging added.
- No raw files sent.
- No safety controls disabled.
- No Ceph, Licensing, RVTools or PDF engines changed.
- No DB schema changes.
- No migrations.
- No deploy.
- Full public launch remains not declared.

## Validation Plan

Required commands:

```bash
npx prisma validate
npx prisma generate
npm run test:run
npm run lint
npm run typecheck
npm run build
npm run hostinger:diagnose
```

## Remaining Risks

- Production still needs valid `GEMINI_API_KEY`.
- Production still needs valid `OPENCODE_API_KEY` for real fallback.
- Runtime restart/redeploy must be approved explicitly.
- Real Senior Advisor smoke remains pending after secrets are loaded.
- ADVISOR-2 Memory Vault remains pending.
- Billing remains pending.
