# Project Pause Checkpoint — AI Provider Simplification

Date: 2026-05-30

## Executive Summary

ShiftReadiness is paused at a controlled technical checkpoint. The core product remains evidence-based and must not be positioned as an automatic migration engine, a zero-downtime guarantee, or a replacement for human migration validation.

Full public launch remains not declared.

## Current Repo State

- Last known checkpoint before this hito: `6fd208e docs: record Gemini provider config validation for Senior Advisor`.
- Branch: `main`.
- Storage/Ceph: operationally closed.
- Admin console: recovered from global fallback; section-level fallback pattern is active.
- Senior Migration Advisor: implemented, migrated in Neon, visible in production, QA entitlement resolved, input enabled, compact UI implemented.
- Open issue: production Gemini runtime is blocked by invalid or inaccessible `GEMINI_API_KEY`; local validation with a valid key confirmed `gemini-2.5-flash` compatibility.

## Closed Areas

- Storage Destination Readiness.
- Storage Free Context.
- Additional Storage Evidence.
- Storage Context Intelligence / AI.
- Ceph Suitability & Operations Readiness.
- Report Preview / PDF operational closure.
- Landing/commercial Storage/Ceph visibility.
- Storage/Ceph Neon migrations applied and verified.
- Storage/Ceph UX/Admin polish implemented and pushed.
- Admin global fallback resolved.
- Admin Evaluaciones resolved.

## Senior Migration Advisor State

- `ADVISOR-AUDIT-1`: complete.
- `ADVISOR-1`: complete and pushed.
- Advisor DB migration applied in Neon.
- Advisor tab visible.
- QA entitlement corrected.
- Input enabled for QA.
- Compact UI implemented.
- Provider response handling improved.
- Remaining blocker: production provider configuration.

## AI Provider Checkpoint

- Primary provider target: Google AI Studio Gemini.
- Fallback provider target: OpenCode Go via OpenAI-compatible chat completions.
- OpenAI: deprecated for normal operation and not exposed as an admin-selectable provider.
- Secrets must remain outside the repo.

Required runtime placeholders:

```env
AI_ADVISORY_PROVIDER=gemini
AI_ADVISORY_MODEL=gemini-2.5-flash
AI_ADVISORY_FALLBACK_PROVIDER=opencode_go
AI_ADVISORY_FALLBACK_MODEL=glm-5.1
GEMINI_API_KEY=<SET_IN_HOSTINGER_OR_SECRET_STORE>
OPENCODE_API_KEY=<SET_IN_HOSTINGER_OR_SECRET_STORE>
OPENCODE_GO_BASE_URL=https://opencode.ai/zen/go/v1/chat/completions
```

## What Remains Open

- Load a valid `GEMINI_API_KEY` into the production runtime.
- Load a valid `OPENCODE_API_KEY` for fallback.
- Restart/redeploy only after explicit authorization.
- Run real Advisor smoke after runtime config is corrected.
- Confirm `AiUsageEvent.operationType = senior_advisor_message` for successful Advisor calls.
- ADVISOR-2 Project Memory Vault remains pending.
- ADVISOR-3 RAG / Methodology KB remains pending.
- Billing and credit purchase remain pending.
- Retention/export/delete policy remains pending.

## Pause Rules

- Do not commit API keys.
- Do not print provider secrets.
- Do not apply migrations while paused.
- Do not deploy without explicit approval.
- Do not declare full public launch.

## Recommended Resume Hito

`AI-PROVIDER-CONFIG-2 — Load Real Gemini/OpenCode Go Runtime Secrets and Smoke Senior Advisor`
