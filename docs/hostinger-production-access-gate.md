# Hostinger Production Access Gate

## Objetivo

Este documento define las condiciones mínimas que deben existir antes de reintentar el HITO 9.2 — Real Hostinger Deployment & Production Smoke Execution.

## Estado actual

- Production launched: NO
- Hostinger smoke real: NO ejecutado
- Motivo: falta acceso real, dominio, app root, método deploy, logs y control de reinicio
- Git debe estar limpio antes del reintento

## Discovery HITO 9.1.6

Datos confirmados por inspeccion publica:

- Dominio: `https://shiftevidence.com`
- HTTPS responde: SI
- `/`: `200 OK`
- Servidor: LiteSpeed / Hostinger
- Headers observados: `platform: hostinger`, `panel: hpanel`
- DNS observado: A `147.93.65.5`, AAAA `2a02:4780:13:1295:0:2628:44f:10`
- `/shiftreadiness`: `404 Not Found`
- `/sign-in`: `404 Not Found`
- `/sign-up`: `404 Not Found`
- `/dashboard`: `404 Not Found`
- HTML de `/`: contiene `Shift Evidence`, no contiene `ShiftReadiness`, no contiene `__next` ni rutas `/_next/`

Interpretacion:

- El dominio parece servir contenido estatico desde LiteSpeed/Hostinger.
- No hay evidencia publica de que el dominio este asociado a la app Next.js/Node actual.
- HITO 9.2 no debe reintentarse hasta confirmar Node App Manager/Application Root/Startup File/logs/restart.

Datos pendientes:

- Acceso hPanel/SSH/SFTP/File Manager.
- Contenido real de `public_html`.
- Existencia de Node.js App.
- Dominio asociado a Node.js App.
- Application Root.
- Startup File.
- Node version disponible.
- Metodo deploy/start/restart/logs.
- Ruta absoluta real de usuario Hostinger.
- `HOSTINGER_STORAGE_ROOT` productivo.

Decision:

- Reintentar HITO 9.2: NO
- Motivo: el dominio responde, pero no sirve rutas Next.js y falta discovery real de Node runtime.

## Gate 1 — Acceso Hostinger

Completar antes de reintentar:

- Acceso al panel Hostinger:
- Acceso SSH/SFTP si aplica:
- Usuario responsable:
- App root:
- Carpeta de deploy:
- Método de subida:
- Método de instalación dependencias:
- Método de start:
- Método de restart:
- Método para ver logs:
- Método para detener proceso:
- Método para volver al build anterior:

## Gate 2 — Dominio productivo

Completar antes de reintentar:

- Dominio final:
- URL HTTPS:
- SSL activo:
- DNS apuntando correctamente:
- Ruta pública esperada:
- ¿La app responde en dominio real?:
- ¿Hay proxy/rewrite?:
- ¿Hay puerto específico?:

## Gate 3 — Variables productivas

No escribir secretos. Sólo confirmar nombre y estado.

- DATABASE_URL:
- DIRECT_URL:
- BETTER_AUTH_SECRET:
- BETTER_AUTH_URL:
- NEXT_PUBLIC_APP_URL:
- HOSTINGER_STORAGE_ROOT:
- MAX_UPLOAD_SIZE_MB:
- ADMIN_EMAILS:

Reglas:

- BETTER_AUTH_URL debe apuntar a https://dominio-real
- NEXT_PUBLIC_APP_URL debe apuntar a https://dominio-real
- HOSTINGER_STORAGE_ROOT debe ser ruta absoluta
- HOSTINGER_STORAGE_ROOT no debe estar dentro de .next
- HOSTINGER_STORAGE_ROOT no debe estar en carpeta pública
- ADMIN_EMAILS debe incluir el email real del admin

## Gate 4 — Storage persistente

Completar antes de reintentar:

- Ruta absoluta:
- Existe:
- Permisos write/read/delete:
- No pública:
- Fuera de build:
- Fuera de .next:
- Sobrevive restart:
- Sobrevive deploy:
- Política de backup:

## Gate 5 — Base de datos

Completar antes de reintentar:

- Neon proyecto productivo identificado:
- DATABASE_URL disponible en proceso:
- Prisma validate posible:
- Prisma migrate status posible:
- Prisma migrate deploy permitido:
- Prohibido prisma migrate reset:
- Backup/snapshot DB antes de deploy:

## Gate 6 — Auth

Completar antes de reintentar:

- Usuario de prueba:
- Usuario admin:
- Email admin incluido en ADMIN_EMAILS:
- Login esperado:
- Logout esperado:
- Dashboard protegido:
- Cookies bajo dominio real:
- Incógnito probado:

## Gate 7 — Smoke data

Preparar antes de reintentar:

- Assessment de prueba:
- Archivo RVTools/XLSX/CSV no sensible:
- Archivo inválido para prueba de error:
- Usuario no admin:
- Usuario admin:
- Criterio para borrar datos de prueba:

## Gate 8 — Rollback

Completar antes de reintentar:

- Último commit estable:
- Cómo volver al commit anterior:
- Cómo restaurar env vars previas:
- Cómo detener proceso:
- Cómo reiniciar proceso anterior:
- Cómo preservar storage:
- Cómo preservar logs:
- Qué NO hacer:
  - no borrar storage
  - no migrate reset
  - no tocar DB sin backup
  - no cambiar dominio sin validar auth

## Checklist final antes de HITO 9.2

El HITO 9.2 sólo puede reintentarse si todo esto está confirmado:

- [ ] Git limpio
- [ ] Acceso Hostinger disponible
- [ ] Dominio HTTPS disponible
- [ ] App root identificado
- [ ] Método deploy confirmado
- [ ] Método start/restart confirmado
- [ ] Logs accesibles
- [ ] Node >=22 confirmado o plan para confirmarlo
- [ ] Env vars productivas preparadas
- [ ] Storage persistente definido
- [ ] Admin email confirmado
- [ ] Archivo de prueba disponible
- [ ] Rollback documentado

## Decisión

- Reintentar HITO 9.2: NO
- Motivo: faltan acceso Hostinger real, dominio HTTPS, app root, método deploy, logs, restart control y datos productivos mínimos.
- Fecha: 2026-05-26
- Responsable:

## Nota HITO 9.1.7

After HITO 9.1.7, local public routing is valid and the landing page includes a visible CTA from `/` to `/shiftreadiness`.

Production remains blocked by the Hostinger static/Node runtime mismatch:

- `https://shiftevidence.com/` serves static Hostinger/LiteSpeed HTML.
- `https://shiftevidence.com/shiftreadiness` returns Hostinger `404`.
- `https://shiftevidence.com/sign-in` returns Hostinger `404`.
- No `/_next/` assets are visible in production.

HITO 9.2 must not be retried until the real Hostinger Node.js runtime and domain association are confirmed.

## HITO 9.1.10 runtime fix attempt

Date: 2026-05-26

Result: partial / blocked.

Public checks still show the domain is not serving the real Next.js app:

- `https://shiftevidence.com/` returns `200 OK` from LiteSpeed/Hostinger static hosting.
- `https://shiftevidence.com/shiftreadiness` returns Hostinger `404`.
- `https://shiftevidence.com/sign-in` returns Hostinger `404`.
- `https://shiftevidence.com/dashboard` returns Hostinger `404`.
- No `/_next/` assets were detected.
- Current home HTML does not contain the latest `ShiftReadiness` CTA.

No hPanel, SSH, SFTP, File Manager, Application Root, build logs, runtime logs, or restart control were available from the current environment. No Hostinger changes were made.

Before retrying the runtime fix, obtain:

- hPanel or SSH access.
- Application Root.
- Node.js App status.
- Node version selected in Hostinger.
- start/restart method.
- logs access.
- env var inventory without exposing values.
- `public_html` backup/rollback plan.

## HITO 9.2S production authenticated smoke

Date: 2026-05-26 America/Buenos_Aires / 2026-05-27 UTC.

Result: partial.

Validated successfully in production:

- Public routes serve the real Next.js app.
- Better Auth sign-up/session works with `__Secure-better-auth.session_token`.
- Authenticated dashboard works.
- Assessment create/open/update works.
- Manual intake and cost/risk assumptions save correctly.
- Upload gate blocks incomplete assessments and enables completed assessments.
- Browser multipart evidence upload works with synthetic CSV data.
- Evidence download is private and requires session.
- Parser runs against the uploaded CSV and produces 2 ParsedVM.
- Risk generation and report preview work.
- PDF preview generation creates a report record and authenticated PDF download works.

Blocking launch issue:

- Report/PDF POST redirects use the internal production host `https://0.0.0.0:3000/...` instead of `https://shiftevidence.com/...`.
- The generated PDF is valid and downloadable after manually navigating back to the public report URL, but the user-facing post-submit redirect is broken.
- Report download without session also redirects to `https://0.0.0.0:3000/sign-in`.

Decision:

- Production launched: NO.
- Next required step: fix or configure production-safe redirects/base URL before declaring launch.

## HITO 9.2S.2 final production smoke

Date: 2026-05-27.

Result: partial.

Validated:

- Production public routes remain OK.
- Non-admin access to `/dashboard/admin/unlock-requests` fails closed with `404`.
- A QA unlock request can be created from the report page.
- The request is visible to the QA user as `Pending manual review`.
- No admin data leakage was observed for the non-admin user.

Blocked:

- Admin real was not available from the current environment.
- Fulfill/entitlement could not be executed.
- Full `readiness_report` generation/download in production remains pending.
- Hostinger runtime logs were not available from the current tool context.

Decision:

- Production launched: NO.
- Launch review still requires admin access, entitlement fulfill, full report smoke and logs review.

## HITO 9.2S.3 production admin entitlement smoke

Date: 2026-05-27.

Result: partial / blocked.

Validated:

- Public production routes continue serving the real Next.js app.
- Private routes without session redirect to `/sign-in`.
- Admin route without session redirects to `/sign-in`.
- Local diagnostics, typecheck, lint and build pass.

Blocked:

- No production admin credentials were available in the current tool context.
- `ADMIN_EMAILS` could not be verified without reading production env values.
- Admin route as real admin was not validated.
- Fulfill/entitlement was not executed.
- Full `readiness_report` generation/download remains pending.
- Hostinger logs remain unavailable from the current tool context.

Decision:

- Production launched: NO.
- Launch review still requires real admin access, entitlement fulfill, full report smoke, secure access validation, logs review and QA data cleanup/retention decision.

## HITO 9.2S.3A production admin access gate

Date: 2026-05-27.

Result: partial / blocked.

Validated:

- Public production routes continue serving the real Next.js app.
- Private routes without session redirect to `/sign-in`.
- `/dashboard/admin/unlock-requests` without session redirects to `/sign-in`.
- Local diagnostics, typecheck, lint and build pass.

Blocked:

- No real production admin credentials were available in the current tool context.
- Production `ADMIN_EMAILS` could not be verified without secure env access.
- Admin route as real admin was not validated.
- Pending unlock request visibility as admin remains pending.

Decision:

- Do not proceed to fulfill/entitlement until real admin access is validated.
- Production launched: NO.

## HITO 9.2S-FINAL production launch readiness gate

Date: 2026-05-27.

Result: partial / blocked at admin access.

Passed:

- Local Git/build gate.
- Public production routes.
- Private redirects without session.
- Admin route without session redirects to `/sign-in`.

Blocked:

- Real production admin was not available in the current tool context.
- Production `ADMIN_EMAILS` could not be verified without secure env access.
- Admin route as admin, pending request visibility, fulfill, entitlement and full report remain pending.
- Hostinger logs remain unavailable from the current tool context.

Decision:

- Ready for controlled production launch review: NO.
- Production launched: NO.

## HITO 9.2S-FINAL-R admin-enabled launch readiness gate

Date: 2026-05-27.

Result: partial / blocked at admin access.

Passed:

- Local Git/build gate after clearing local `.next` lock.
- Public production routes.
- Private redirects without session.
- Admin route without session redirects to `/sign-in`.

Blocked:

- Real production admin was not available in the current tool context.
- Production `ADMIN_EMAILS` could not be verified without secure env access.
- Admin route as admin, pending request visibility, fulfill, entitlement and full report remain pending.
- Hostinger logs remain unavailable from the current tool context.

Decision:

- Ready for controlled production launch review: NO.
- Production launched: NO.

## HITO 9.2S-FINAL-R2 admin credentials live validation

Date: 2026-05-27.

Result: partial / blocked at admin access.

Passed:

- Local Git/build gate.
- Public production routes.
- Private redirects without session.
- Admin route without session redirects to `/sign-in`.

Blocked:

- Real production admin was not available in the current tool context.
- Production `ADMIN_EMAILS` could not be verified without secure env access.
- Admin route as admin, pending request visibility, fulfill, entitlement and full report remain pending.
- Hostinger logs remain unavailable from the current tool context.

Decision:

- Ready for controlled production launch review: NO.
- Production launched: NO.

## HITO 9.2S-FINAL-R2 continuation — dynamic route blocker

Date: 2026-05-27.

Additional user context:

- A different production admin user reportedly can sign in.
- Password recovery is not implemented yet and remains a product risk.

Observed from the current tool context:

- Static/public routes remain `200 OK`.
- `/dashboard`, `/dashboard/assessments` and `/dashboard/admin/unlock-requests` returned `503 Service Unavailable` / `504 Gateway Time-out` from Hostinger/hcdn during unauthenticated `curl` checks.
- Expected unauthenticated behavior was `307` to `/sign-in`.

Impact:

- Admin route validation could not proceed from the tool context.
- `ADMIN_EMAILS` remains unverified.
- Fulfill, entitlement and full report remain pending.

Decision:

- Ready for controlled production launch review: NO.
- Production launched: NO.
- Review Hostinger runtime logs or reproduce in an authenticated browser session before continuing admin entitlement closure.

## HITO 9.2S-RUNTIME dynamic routes recovery

Date: 2026-05-27.

Result: partial / recovered during recheck.

Observed:

- Public routes remained `200 OK`.
- `/dashboard`, `/dashboard/assessments` and `/dashboard/admin/unlock-requests` returned `307` to `/sign-in` across initial check and two retries.
- The previous `503/504` pattern was not reproduced.

Actions:

- No Hostinger config changes.
- No restart.
- No redeploy.
- No env changes.
- No DB changes.

Limitations:

- Hostinger runtime logs were not available from the current tool context.
- Admin authenticated route could not be validated without an admin session/cookies.

Decision:

- Dynamic route blocker resolved in current recheck: YES.
- Admin entitlement closure remains pending.
- Production launched: NO.

## HITO 9.2S-LAUNCH-REVIEW manual admin validation

Date: 2026-05-27.

Result: ready for controlled production launch review.

Evidence split:

- Codex validated public routes and unauthenticated private redirects.
- User validated admin-owned entitlement and full report flow manually in a real browser.

Manual user-attested validation:

- Dashboard works.
- Real admin can access `/dashboard/admin/unlock-requests`.
- Admin-owned assessment flow works.
- Fulfill/entitlement/full report/full PDF works.

Remaining risks:

- Hostinger logs not reviewed from tool context.
- Password recovery is not implemented.
- QA data cleanup/retention pending.
- Admin queue cross-owner report link can lead to `404` due to ownership protection.

Decision:

- Ready for controlled production launch review: YES.
- Production launched: NO.
