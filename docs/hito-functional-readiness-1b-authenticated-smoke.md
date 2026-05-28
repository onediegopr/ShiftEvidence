# HITO FUNCTIONAL-READINESS-1B - Authenticated functional smoke

Date: 2026-05-28.

## Objective

Close the fresh authenticated evidence gap left by `FUNCTIONAL-READINESS-1` for the real product flow:

- user dashboard;
- assessment detail;
- context intake;
- report preview;
- Gemini Advisory in preview/PDF;
- PDF generation/download;
- admin console;
- AI usage visibility;
- localhost and local Gemini smoke.

This hito does not declare full public launch.

## Status

Status: COMPLETE.

Reason:

- Base validations passed.
- Localhost smoke passed.
- Production unauthenticated smoke passed.
- Local Gemini smoke passed with `providerStatus=success`.
- User flow was validated by user-attested evidence with final confidence PASS.
- Admin flow was validated by user-attested evidence with final confidence PASS.
- No visible secrets, raw JSON or `[object Object]` were reported.

## Git Baseline

- Branch: `main`
- Initial HEAD expected: `a7e4c2c chore: enable local Gemini smoke workflow`
- `origin/main` expected: `a7e4c2c`
- Working tree expected: clean
- `BETA-INVITE-1` stash preserved and not applied:
  - `stash@{0}: On main: park beta invite docs before functional readiness`

## Base Validations

Executed before documentation updates:

- `npm run hostinger:diagnose`: OK
- `npm run ai:guardrails`: OK
- `npm run typecheck`: OK
- `npm run lint`: OK
- `npm run build`: OK
- `npx prisma validate`: OK
- `npx prisma generate`: OK
- `npm run ai:smoke-local-gemini`: OK

Known non-blocking warning:

- Next/Turbopack NFT warning from `reportStorageService.ts` through the report download route.

## Local Gemini Smoke

Command:

```bash
npm run ai:smoke-local-gemini
```

Result:

- provider: `gemini`
- model: `gemini-flash-lite-latest`
- Gemini key configured: yes, value not printed
- OpenAI configured: no
- `providerStatus`: `success`
- duration: `1249 ms`
- output shape valid: yes
- response printed: no
- secrets printed: no

Notes:

- This validates local Gemini connectivity.
- It does not close the strict synthetic report path.
- `ai:report-synthetic:require-gemini` remains a separate hardening item under `AI-REPORT-SYNTHETIC-HARDENING`.

## Localhost Smoke

Localhost was validated with `next start` on port `3000`.

| Route | Result |
| --- | --- |
| `/` | `200` |
| `/shiftreadiness` | `200` |
| `/sign-in` | `200` |
| `/sign-up` | `200` |
| `/dashboard` | `307` to `/sign-in` |
| `/dashboard/admin` | `307` to `/sign-in` |

User-attested localhost result:

- localhost active: yes
- `/` loads: yes
- `/shiftreadiness` loads: yes
- `/sign-in` loads: yes
- `/dashboard` redirects: yes
- Gemini local smoke validated by npm: yes
- visible errors: no
- result: PASS

## Production Unauthenticated Smoke

Domain: `https://shiftevidence.com`

| Route | Result |
| --- | --- |
| `/` | `200` |
| `/shiftreadiness` | `200` |
| `/sign-in` | `200` |
| `/sign-up` | `200` |
| `/forgot-password` | `200` |
| `/reset-password` | `200` |
| `/dashboard` | `307` to `/sign-in` |
| `/dashboard/assessments` | `307` to `/sign-in` |
| `/dashboard/admin` | `307` to `/sign-in` |
| `/dashboard/admin/unlock-requests` | `307` to `/sign-in` |

Result:

- Public routes healthy.
- Private/admin routes protected.
- No Hostinger 404 observed.
- No `500`, `503` or `504` observed.

## User-Attested QA - User Flow

Evidence received:

- Login: yes
- `/dashboard` loads: yes
- `/dashboard/assessments` loads: yes
- QA/controlled assessment opens: yes
- Context Intake visible: yes
- Report preview opens: yes
- Gemini Advisory appears: yes
- Looks real/non-mock: yes / user not fully certain
- Fallback if Gemini does not appear: not applicable
- Readiness score visible: yes
- Confidence score visible: yes
- AI does not replace deterministic scores: yes
- PDF generates: yes
- PDF downloads: yes
- PDF opens: yes
- PDF is not empty: yes
- AI Advisory appears in PDF: yes
- No raw JSON: yes
- No `[object Object]`: yes
- No secrets/storage paths: yes
- Visible errors: no
- User final confidence: PASS

Interpretation:

- User flow: PASS.
- Gemini/PDF product flow: PASS by user-attested evidence.
- Real-vs-mock confidence: acceptable for this hito because the admin flow also reported Gemini provider active/runtime env-gemini and AI usage state correct. Codex did not directly inspect the authenticated provider response.

## User-Attested QA - Admin Flow

Evidence received:

- Admin login: yes
- `/dashboard/admin` loads: yes
- Estado del Sistema loads: yes
- Usuarios loads: yes
- Evaluaciones/Assessments loads: yes
- IA y Consumo loads: yes
- Accesos y Planes loads: yes
- Oportunidades loads: yes
- Configuracion Operativa loads: yes
- Auditoria loads: yes
- Gemini appears as active provider or runtime env/gemini: yes
- AiUsageEvent / consumption reflects event or correct state: yes
- No visible secrets: yes
- No visible errors: yes
- User final confidence: PASS

Interpretation:

- Admin flow: PASS.
- AI usage visibility: PASS.
- Admin security visibility: PASS by user-attested evidence.

## Gemini / PDF / AiUsage

- Gemini Advisory visible in preview: yes, user-attested.
- Gemini Advisory visible in PDF: yes, user-attested.
- PDF generated/downloaded/opened: yes, user-attested.
- PDF non-empty: yes, user-attested.
- AiUsageEvent / consumption state visible: yes, user-attested.
- Raw JSON: not visible.
- `[object Object]`: not visible.
- Secrets/storage paths: not visible.

## Findings

### P0

None open.

### P1

None open.

### P2

- Strict synthetic report Gemini success remains pending as `AI-REPORT-SYNTHETIC-HARDENING`.
- QA/demo filtering/archive remains a pre-full-public-launch improvement.
- Hostinger runtime logs review remains a full-public-launch readiness item.

### P3

- UX/accessibility polish items from `FUNCTIONAL-READINESS-1` remain non-blocking.

## Fixes Applied

No product hotfix was required in this hito.

## Security

- No Prisma reset.
- No DB schema changes.
- No Hostinger config changes.
- No OpenAI activation.
- No hard delete.
- No `.env.local` committed.
- No API keys printed.
- No `DATABASE_URL` printed.
- No full public launch declared.

## Decision

- Functional readiness complete: yes.
- Product functional for broader invited beta: yes.
- Ready for first real controlled client usage: yes.
- Ready for full public launch: no.

Recommended next hito:

- `AI-REPORT-SYNTHETIC-HARDENING` for strict synthetic Gemini/PDF providerStatus success, or
- first controlled beta customer onboarding with manual entitlement and supervised support.
