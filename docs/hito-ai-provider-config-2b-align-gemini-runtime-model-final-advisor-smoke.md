# HITO AI-PROVIDER-CONFIG-2B — Align Gemini Runtime Model and Final Senior Advisor Smoke

## Objective

Align the production AI runtime so the primary Senior Migration Advisor provider uses `gemini-2.5-flash`, then complete the final real Advisor smoke.

## Status

PARCIAL / BLOQUEADO OPERATIVO.

The public production smoke is OK and the admin evidence previously confirmed that Gemini and OpenCode Go keys are configured. However, this execution environment cannot read or modify Hostinger environment variables because no Hostinger MCP/API tool is callable and `HOSTINGER_API_TOKEN` is not available locally.

## Current Evidence

Manual authenticated admin evidence confirmed:

- Admin session: `vivianafernandez@gmail.com`.
- AI active: yes.
- Primary provider: `gemini`.
- Primary model visible at that time: `gemini-1.5-flash`.
- Target primary model: `gemini-2.5-flash`.
- Fallback provider: OpenCode Go.
- Fallback model: `glm-5.1`.
- Gemini key: configured.
- OpenCode Go key: configured.
- OpenAI: not exposed as an operational provider.
- Secrets visible: no.
- Raw files sent: no.
- `AiUsageEvent.operationType=senior_advisor_message` present.
- Latest Advisor call observed: successful.
- Assessment: `qwqw`.
- User: `diegoperezroca@gmail.com`.

## Git / Local Preflight

- Branch: `main`.
- HEAD: `60a5264 feat: simplify AI providers to Gemini with OpenCode Go fallback`.
- Working tree before documentation: clean.
- Origin sync: no ahead/behind.
- Stash preserved: `stash@{0}: On main: park beta invite docs before functional readiness`.

## Public Production Smoke

Public routes returned HTTP 200:

- `/`
- `/shiftreadiness`
- `/sign-in`
- `/sign-up`
- `/sample-report`

Admin AI status endpoint without session:

- `/api/admin/ai/status` returns redirect to `/sign-in`.
- This confirms the endpoint remains protected.

## Hostinger / Runtime Access

- Hostinger MCP callable tools: not exposed in this session.
- `HOSTINGER_API_TOKEN`: absent in local environment.
- Chrome authenticated automation: not available in this execution context.
- No env var was read directly from Hostinger by Codex.
- No env var was changed by Codex.

## Required Production Runtime Values

Expected production configuration:

```env
AI_ADVISORY_ENABLED=true
AI_ADVISORY_PROVIDER=gemini
AI_ADVISORY_MODEL=gemini-2.5-flash
AI_ADVISORY_FALLBACK_PROVIDER=opencode_go
AI_ADVISORY_FALLBACK_MODEL=glm-5.1
GEMINI_API_KEY=<configured secret>
OPENCODE_API_KEY=<configured secret>
OPENCODE_GO_BASE_URL=https://opencode.ai/zen/go/v1/chat/completions
```

Secrets must not be printed, logged, committed, or pasted into documentation.

## Pending Manual Check

In Hostinger/hPanel, confirm or update:

- `AI_ADVISORY_MODEL=gemini-2.5-flash`.
- `AI_ADVISORY_FALLBACK_PROVIDER=opencode_go`.
- `AI_ADVISORY_FALLBACK_MODEL=glm-5.1`.

If Hostinger requires restart/redeploy to apply env vars, run it only with explicit operational approval.

## Pending Admin Validation

After runtime reload, validate:

- `/dashboard/admin?tab=ia-consumo`.
- AI active: yes.
- Primary provider: Gemini.
- Primary model: `gemini-2.5-flash`.
- Fallback: OpenCode Go.
- Fallback model: `glm-5.1`.
- OpenAI hidden as operational provider.
- Secrets visible: no.

## Pending Senior Advisor Smoke

With user `diegoperezroca@gmail.com` and assessment `qwqw`, send:

```text
What should I complete next in this assessment?
```

Expected:

- response visible;
- no provider fallback unless Gemini fails operationally;
- provider/model ideally `gemini / gemini-2.5-flash`;
- acceptable fallback `opencode_go / glm-5.1`;
- no 500;
- no UI crash;
- no secrets;
- no raw files.

Quality expectations:

- mention next steps;
- mention missing RVTools/inventory if applicable;
- separate available and missing evidence;
- do not invent data;
- do not guarantee migration success;
- do not approve production;
- do not override deterministic engines.

## Persistence / Usage Pending

After sending:

- reload assessment `qwqw`;
- reopen `Senior Advisor`;
- confirm history persists;
- confirm counter updates;
- confirm no duplicate conversation;
- confirm no cross-assessment leakage;
- confirm `AiUsageEvent.operationType=senior_advisor_message`;
- confirm provider/model and `fallbackUsed` state;
- confirm no full prompt or secrets in metadata.

## Security

- No secrets printed.
- No API keys committed.
- No DB mutation.
- No migrations.
- No pricing changes.
- No billing changes.
- No full public launch declared.
- ADVISOR-2 not started.

## Verdict

PARCIAL / BLOQUEADO OPERATIVO.

The application and provider strategy are ready, and public production remains healthy. Final closure requires direct Hostinger runtime confirmation that `AI_ADVISORY_MODEL` is now `gemini-2.5-flash`, followed by one authenticated Senior Advisor smoke.

## Next Step

Complete manual Hostinger model alignment, restart/redeploy if required, then run the final Advisor smoke and close this hito as complete.
