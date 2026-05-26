# Hostinger Build Failure Diagnostics

## Estado actual

- Local repository is clean and synchronized before this hito.
- Last expected HEAD: `a9e4c58 fix: restore ShiftReadiness landing CTA`.
- Production is not serving the real Next.js app yet.
- Hostinger shows `Build failed`, but no build logs are currently visible to the agent.

## Sintoma

Hostinger build/deploy reports:

- `Build failed`

Known limitation:

- No detailed Hostinger logs were provided.
- The failure cannot be classified as dependency, Node version, env, Prisma, path, install, or Next build failure until logs or terminal output are captured.

## Causas probables

Potential causes to check first:

- Hostinger Node version is lower than required by `package.json` engines (`>=22`).
- Application Root points to the wrong folder.
- Hostinger is building from `public_html` or a static folder instead of the Next.js app root.
- `npm ci` fails because `package-lock.json` is missing, stale, or not uploaded.
- `postinstall` runs `prisma generate` and fails because Prisma dependencies or schema are not available.
- Required env vars are missing.
- `DATABASE_URL` is not available during `postinstall` or build if Hostinger injects env vars only at runtime.
- Build command runs from the wrong working directory.
- Hostinger build cannot access `src/app/page.tsx` or `prisma/schema.prisma`.
- Hostinger Node App requires a specific startup file or Passenger configuration instead of a plain static deploy.
- The app is not associated with `https://shiftevidence.com`.

## Datos faltantes

Required before a real fix:

- Hostinger Application Root.
- Hostinger Node version.
- Build command used by Hostinger.
- Install command used by Hostinger.
- Start command or startup file.
- Whether `npm ci` or `npm install` runs.
- Full build log.
- Whether env vars are available during install/build.
- Whether `postinstall` executes during Hostinger build.
- Whether the domain points to the Node app or `public_html`.

## Revisar Application Root

In hPanel or SSH, confirm:

- The app root contains `package.json`.
- The app root contains `src/app/page.tsx`.
- The app root contains `src/app/shiftreadiness/page.tsx`.
- The app root contains `prisma/schema.prisma`.
- The app root is not `public_html` unless the full Next.js repo is intentionally there.
- The app root is not `.next`.
- The app root is not `node_modules`.

Safe read-only commands if SSH/Terminal is available:

```bash
pwd
ls -la
test -f package.json && echo "package.json present"
test -f src/app/page.tsx && echo "home route present"
test -f src/app/shiftreadiness/page.tsx && echo "shiftreadiness route present"
test -f prisma/schema.prisma && echo "prisma schema present"
```

## Revisar Node version

Run:

```bash
node -v
npm -v
```

Expected:

- Node `>=22`.

If Hostinger only supports lower Node versions, do not patch product code first. Decide whether to change Hostinger runtime or adapt the app in a separate technical hito.

## Revisar env vars sin imprimir secretos

Do not print env values.

Required names:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `HOSTINGER_STORAGE_ROOT`
- `MAX_UPLOAD_SIZE_MB`
- `ADMIN_EMAILS`

Expected production values logically:

- `BETTER_AUTH_URL` should point to `https://shiftevidence.com`.
- `NEXT_PUBLIC_APP_URL` should point to `https://shiftevidence.com`.
- `HOSTINGER_STORAGE_ROOT` should be an absolute path outside `public_html`, `.next`, and `node_modules`.
- `ADMIN_EMAILS` should include the real admin email.

Safe check:

```bash
npm run hostinger:diagnose
```

## Diagnostico por SSH/Terminal

Safe sequence:

```bash
node -v
npm -v
pwd
ls -la
npm run hostinger:diagnose
```

If the diagnostic succeeds, capture the output.

Then, only if authorized for build diagnostics:

```bash
npm ci
npm run build
```

Do not run Prisma migrations for this diagnostic hito.

## Comandos seguros

Safe:

```bash
git status
git log -1 --oneline
npm run hostinger:diagnose
npm run typecheck
npm run lint
npm run build
```

Hostinger read-only:

```bash
node -v
npm -v
pwd
ls -la
```

## Que NO hacer

Do not run:

- `prisma migrate reset`
- `prisma db push --force-reset`
- `prisma migrate deploy` during build failure diagnostics
- deploy
- production restart
- env var edits without recording current names
- deleting `public_html`
- deleting storage
- printing secret values

Do not change:

- landing product copy
- `/shiftreadiness`
- auth
- DB schema
- Prisma migrations
- storage logic
- parser logic
- PDF/report logic

## Resultado local

- `npm run hostinger:diagnose`: OK.
- Local diagnostic Node version: `v22.22.0`.
- Local diagnostic cwd: project root.
- Key files detected:
  - `package.json`: present.
  - `next.config.mjs`: present.
  - `prisma/schema.prisma`: present.
  - `src/app/page.tsx`: present.
  - `src/app/shiftreadiness/page.tsx`: present.
- Local process env presence:
  - required env vars reported absent because this diagnostic reads process env only and does not print or load secret values.
- Storage root:
  - not configured in process env for this diagnostic.
  - no write/read/delete test was performed by this diagnostic.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK after cleaning local `.next` cache.

Local build note:

- First local `npm run build` attempt failed with `EPERM: operation not permitted, unlink '.next/static/...` on Windows/OneDrive.
- No product code change was required.
- After stopping the local dev server and deleting generated `.next` cache, `npm run build` passed.
- This local Windows/OneDrive cache lock is separate from the Hostinger `Build failed` symptom and does not explain the Hostinger failure without production logs.

Known non-blocking warning:

- Turbopack/NFT warning remains related to `reportStorageService.ts` tracing from the report download route.

## Resultado Hostinger

Pending real Hostinger logs and terminal access.

## Proximo paso

Run `npm run hostinger:diagnose` in the exact Hostinger Application Root and capture its output. If it shows missing key files, fix Application Root. If it shows Node lower than `22`, fix Hostinger runtime before retrying build.
