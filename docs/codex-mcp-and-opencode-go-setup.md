# Codex / Zed MCP and OpenCode Go Setup

## Purpose

This document describes how to configure development tooling and AI provider secrets without storing secrets in the ShiftReadiness repository.

## Scope

- Codex/Zed MCP configuration is development tooling configuration, not Next.js runtime configuration.
- Neon MCP was already used for controlled database migration work.
- Hostinger runtime variables must be configured in Hostinger or a secret store, not in committed files.
- OpenCode Go is treated as an OpenAI-compatible provider for fallback use.

## Runtime Environment Variables

Use placeholders only in repository examples:

```env
AI_ADVISORY_PROVIDER=gemini
AI_ADVISORY_MODEL=gemini-2.5-flash
AI_ADVISORY_FALLBACK_PROVIDER=opencode_go
AI_ADVISORY_FALLBACK_MODEL=glm-5.1

GEMINI_API_KEY=<SET_IN_HOSTINGER_OR_SECRET_STORE>
OPENCODE_API_KEY=<SET_IN_HOSTINGER_OR_SECRET_STORE>
OPENCODE_GO_BASE_URL=https://opencode.ai/zen/go/v1/chat/completions
```

Never commit `.env.local`, API keys, service tokens, MCP credentials, or Hostinger tokens.

## OpenCode Go

Provider ID:

```text
opencode_go
```

Display name:

```text
OpenCode Go
```

OpenAI-compatible endpoint:

```text
https://opencode.ai/zen/go/v1/chat/completions
```

Initial fallback model:

```text
glm-5.1
```

Other candidate models may be evaluated later:

- `glm-5`
- `kimi-k2.5`
- `kimi-k2.6`
- `deepseek-v4-pro`
- `deepseek-v4-flash`

## Codex / Zed MCP Guidance

- Configure MCP servers in the local developer environment.
- Keep MCP credentials in the relevant secret store or local ignored config.
- Do not put API keys in markdown docs except as placeholders.
- Do not paste provider keys into prompts, tickets, screenshots or commit messages.
- Use Neon MCP for DB inspection/migration workflows only with explicit hito approval.
- Use Hostinger tools only for diagnostics unless the hito explicitly authorizes runtime changes.

## Repository Safety

Allowed in repo:

- `.env.example` style placeholders.
- Provider names.
- Public endpoint URLs.
- Non-secret model names.
- Setup instructions.

Not allowed in repo:

- `GEMINI_API_KEY` values.
- `OPENCODE_API_KEY` values.
- Hostinger API tokens.
- Neon connection strings.
- MCP auth tokens.
- Raw customer evidence.
