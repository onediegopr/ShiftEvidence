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

AI-1 includes provider stubs and a mock provider only. Real `gemini` or `openai` provider calls require a follow-up hito with explicit API-key handling, timeout validation, logging policy and production authorization.

## Validation

Run:

```bash
npm run ai:guardrails
```

The smoke test checks representative redaction expectations for database URLs, passwords, tokens, cookies, bearer strings, email addresses, storage paths and raw file content.
