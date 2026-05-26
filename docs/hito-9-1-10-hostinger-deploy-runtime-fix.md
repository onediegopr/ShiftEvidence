# HITO 9.1.10 — Hostinger Deploy Runtime Fix

## Objetivo

Connect `https://shiftevidence.com` to the real ShiftReadiness Next.js runtime deployed from `origin/main`, without running the full HITO 9.2 production smoke test.

Minimum target for this hito:

- `/` serves the current Next.js landing.
- `/shiftreadiness` returns `200`.
- `/sign-in` returns `200`.
- `/dashboard` redirects/protects without returning Hostinger `404`.
- `/_next/` assets are present.

## Contexto

Local and Git state at the start of this hito:

- Branch: `main`
- HEAD: `b71cf2a fix: reposition ShiftReadiness landing CTA`
- `origin/main`: synchronized
- Working tree: clean
- Local Node: `v22.22.0`
- Local npm: `10.9.4`
- Local public routes were already validated in the previous hotfix.
- Production launched: `NO`

## Problema

Public production checks still show that Hostinger is not serving the real Next.js app:

- `https://shiftevidence.com/`: `200 OK`, `Server: LiteSpeed`, `platform: hostinger`, `panel: hpanel`
- `https://shiftevidence.com/shiftreadiness`: `404 Not Found`, Hostinger/LiteSpeed response
- `https://shiftevidence.com/sign-in`: `404 Not Found`, Hostinger/LiteSpeed response
- `https://shiftevidence.com/dashboard`: `404 Not Found`, Hostinger/LiteSpeed response
- Home HTML does not contain `/_next/`
- Home HTML does not contain `ShiftReadiness`
- Home HTML does not contain `Explore ShiftReadiness`

## Causa raíz encontrada

Confirmed from public HTTP evidence:

- The domain is still serving static Hostinger/LiteSpeed HTML.
- The domain is not currently associated with the Next.js App Router runtime.
- The current production surface does not expose Next.js `/_next/` assets.
- The App Router routes are not handled by Node/Next in production.

Not confirmed due missing access:

- Actual Hostinger Application Root.
- Whether a Node.js App exists in hPanel.
- Startup file or start command.
- Node version selected in Hostinger.
- Build logs.
- Runtime logs.
- Whether `public_html` is the active document root.

## Hostinger audit

Access available from this environment:

- hPanel: not available
- SSH: not available
- SFTP: not available
- File Manager: not available
- Logs: not available

Public-only evidence:

- Domain: `https://shiftevidence.com`
- Server header: `LiteSpeed`
- Hostinger headers: `platform: hostinger`, `panel: hpanel`
- Static home content length: `5381`
- 404 route content length: `4510`

## Application Root

Unknown. It must be confirmed in Hostinger hPanel or SSH before this hito can be completed.

Required checks in Hostinger:

```bash
pwd
node -v
npm -v
ls -la
npm run hostinger:diagnose
```

Expected Application Root contents:

- `package.json`
- `next.config.mjs`
- `prisma/schema.prisma`
- `src/app/page.tsx`
- `src/app/shiftreadiness/page.tsx`

If `npm run hostinger:diagnose` is missing, the Application Root is probably wrong or Hostinger is not on the latest `origin/main`.

## Node version

Local Node is `v22.22.0`.

Hostinger Node version is unknown because no hPanel/SSH access is available from this environment.

Requirement:

- Node `>=22`

If Hostinger cannot provide Node `>=22`, the next decision is either:

- change Hostinger runtime/plan, or
- adapt the project runtime deliberately in a separate technical hito.

## Env vars presentes/ausentes

Production values were not visible from this environment. Do not print secrets.

Required production variables:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL=https://shiftevidence.com`
- `NEXT_PUBLIC_APP_URL=https://shiftevidence.com`
- `HOSTINGER_STORAGE_ROOT=/home/<hostinger-user>/shiftreadiness-storage`
- `MAX_UPLOAD_SIZE_MB=50`
- `ADMIN_EMAILS=<real-admin-email>`

Optional:

- `DIRECT_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Build command

Not executed on Hostinger because no Hostinger Application Root or shell access was available.

Expected command from the correct Hostinger Application Root:

```bash
npm ci
npm run hostinger:diagnose
npm run build
```

## Start/restart method

Unknown. Must be discovered in Hostinger.

Expected acceptable options:

- hPanel Node.js App restart
- configured start command using `npm run start`
- Passenger/Node manager restart if Hostinger uses Passenger

The app should not be considered connected until the Node process remains alive and public routes resolve through Next.js.

## public_html status

Public evidence strongly suggests that `public_html` or another static LiteSpeed document root is still serving the domain.

This was not changed.

Before touching `public_html`:

- inspect its contents;
- create a backup;
- document rollback;
- do not delete files blindly.

## Rollback

No Hostinger changes were made, so no runtime rollback was required.

Rollback notes for the future Hostinger fix:

- preserve current static state before changing document root or Node association;
- back up `public_html`;
- capture current hPanel Node App settings;
- capture env var names without values;
- preserve logs before restart;
- do not delete storage;
- do not run `prisma migrate reset`;
- do not declare production launched until full HITO 9.2 smoke passes.

## Cambios aplicados

No Hostinger changes were applied.

Repository changes:

- This document was created to record the partial runtime-fix attempt and the public evidence.

## Validación producción

Public route validation:

- `/`: `200 OK`, static LiteSpeed/Hostinger HTML
- `/shiftreadiness`: `404 Not Found`
- `/sign-in`: `404 Not Found`
- `/dashboard`: `404 Not Found`

HTML checks:

- `/_next/`: absent
- `ShiftReadiness`: absent
- `Explore ShiftReadiness`: absent
- Hostinger static/runtime mismatch: confirmed

## Validación local

Local validation remains required after any future Hostinger-specific repo change.

For this partial hito, local code was not changed beyond documentation.

## Riesgos pendientes

- No hPanel/SSH/SFTP/log access from this environment.
- Application Root is still unknown.
- Node App existence is still unknown.
- Node version in Hostinger is still unknown.
- Current domain likely points to static hosting instead of the Node App.
- Build failure logs are still not available.
- HITO 9.2 remains blocked until public Next runtime is connected.

## Próximo paso recomendado

Do not run HITO 9.2 yet.

Next action:

1. Open Hostinger hPanel or SSH with real access.
2. Identify Application Root and Node App settings.
3. Run `npm run hostinger:diagnose` from the real Application Root.
4. Correct Application Root, Node version, env vars, build/start command, or domain association as needed.
5. Re-run this hito until public Next routes work.
