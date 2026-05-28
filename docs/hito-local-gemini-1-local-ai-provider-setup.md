# HITO LOCAL-GEMINI-1 - Local Gemini Provider Setup

Date: 2026-05-28.

## Objective

Enable and validate real Gemini access in local development for ShiftReadiness without printing, committing or hardcoding secrets.

## Status

Status: PARCIAL / FUNCTIONAL SMOKE COMPLETE.

Reason:

- Local `GEMINI_API_KEY` is configured in ignored `.env.local`.
- Local `AI_ADVISORY_PROVIDER=gemini` is configured.
- OpenAI remains unconfigured.
- Localhost route smoke passed.
- Real Gemini local smoke passed with `providerStatus=success`.
- The heavier synthetic PDF generator still produced `providerStatus=error`; it generated a PDF artifact, but the AI advisory section did not close as Gemini success.

Update after FUNCTIONAL-READINESS-1B:

- `npm run ai:smoke-local-gemini` remains PASS.
- Latest recorded local smoke result: `providerStatus=success`.
- Latest recorded local model: `gemini-flash-lite-latest`.
- Local Gemini smoke supports functional readiness, but strict synthetic PDF success remains separate under `AI-REPORT-SYNTHETIC-HARDENING`.

## Required Local Variables

Configure these only in `.env.local` or process env. Do not commit values.

```env
AI_ADVISORY_ENABLED=true
AI_ADVISORY_PROVIDER=gemini
AI_ADVISORY_MODEL=<available Gemini model>
AI_ADVISORY_TIMEOUT_MS=15000
AI_ADVISORY_MAX_INPUT_CHARS=24000
AI_ADVISORY_MAX_OUTPUT_CHARS=6000
GEMINI_API_KEY=<local secret>
```

Current local model used for smoke:

```env
AI_ADVISORY_MODEL=gemini-flash-lite-latest
```

Notes:

- `gemini-1.5-flash` returned `404 model_or_endpoint` for the local key/runtime during this hito.
- `gemini-2.5-flash` was listed as available and a minimal request worked, but larger smoke attempts saw intermittent provider errors.
- `gemini-flash-lite-latest` completed the safe local smoke successfully.

## Git Safety

Before adding any local secret, confirm `.env.local` is ignored:

```bash
git check-ignore -v .env.local
git status --short -- .env.local
```

Expected:

- `.env.local` is ignored.
- `.env.local` does not appear as tracked or untracked for commit.

## Localhost

Build and start:

```bash
npm run build
npm run start -- -p 3000
```

Smoke:

```bash
curl.exe -I http://localhost:3000
curl.exe -I http://localhost:3000/shiftreadiness
curl.exe -I http://localhost:3000/sign-in
curl.exe -I http://localhost:3000/dashboard
curl.exe -I http://localhost:3000/dashboard/admin
```

Expected without session:

- `/`: `200`.
- `/shiftreadiness`: `200`.
- `/sign-in`: `200`.
- `/dashboard`: `307` to `/sign-in`.
- `/dashboard/admin`: `307` to `/sign-in`.

## Gemini Local Smoke

Recommended safe command:

```bash
npm run ai:smoke-local-gemini
```

Expected:

- `provider=gemini`.
- `geminiKeyConfigured=YES`.
- `geminiKeyPrinted=NO`.
- `openAiConfigured=NO`.
- `providerStatus=success`.
- `outputShapeValid=YES`.
- `responsePrinted=NO`.
- `secretsPrinted=NO`.

The smoke uses synthetic data only and does not print prompts, full responses or keys.

## Synthetic Report/PDF

Strict synthetic report command:

```bash
npm run ai:report-synthetic:require-gemini
```

Result in this hito:

- PDF artifact generated under ignored `qa-artifacts/ai-report-1b/`.
- `provider=gemini`.
- `model=gemini-flash-lite-latest`.
- `providerStatus=error`.
- No secrets printed.

Decision:

- Local Gemini connectivity is functional.
- PDF/report Gemini success remains pending for the long synthetic generator path.
- Do not treat `ai:report-synthetic:require-gemini` as closed until it returns `providerStatus=success`.

## Production vs Local

- Production Gemini state is managed by secure runtime/Hostinger settings and prior production QA evidence.
- Local Gemini uses `.env.local`, which must remain ignored and never committed.
- Local model availability may differ from production model configuration.
- Do not modify Hostinger config from local Gemini setup.

## Troubleshooting

`GEMINI_API_KEY` missing:

- Add it to `.env.local` or local process env.
- Do not paste it in chat, docs, logs or Git.
- If it was exposed, rotate it when practical.

`gemini-1.5-flash` returns 404:

- List available models with a safe local diagnostic.
- Use an available Gemini model locally.
- Keep docs explicit about the local model used.

`providerStatus=unavailable`:

- The key is missing or not loaded.
- Re-open the terminal or confirm `.env.local` parsing.

`providerStatus=error`:

- Check model availability, quota/rate limit, provider 5xx or output parsing.
- Use `npm run ai:smoke-local-gemini` to isolate connectivity from the heavier PDF generator.

EPERM in `.next`:

- Stop local Next processes for this workspace.
- Delete only `.next` if the resolved path is inside the workspace and the lock persists.

EPERM in `node_modules/.prisma`:

- Stop local `next start` for this workspace and retry `npx prisma generate`.
- Do not delete `node_modules`.

Port 3000 occupied:

- Confirm with `netstat -ano | findstr :3000`.
- Reuse the running local server if it belongs to this workspace, or stop/restart it intentionally.

## Security Result

- Key printed: NO.
- Key committed: NO.
- `.env.local` committed: NO.
- OpenAI activated: NO.
- Hostinger config changed: NO.
- Production changed: NO.
- Prisma reset/db schema changes: NO.
