# AUTH-1-HOTFIX - Forgot Password 500 Production Fix + Provider Smoke

## Objetivo

Diagnosticar el reporte de `500` en `/forgot-password`, validar el flujo de provider/fallback y confirmar el estado real de password recovery en produccion.

## Contexto

- Production launched: SI, controlled production launch.
- Public launch: NO.
- Resend domain `mail.shiftevidence.com`: VERIFIED por reporte del usuario.
- `RESEND_API_KEY`: presente en Hostinger por reporte del usuario.
- `EMAIL_FROM`: presente en Hostinger por reporte del usuario.
- Password recovery estaba desplegado, pero se reporto `500` en `/forgot-password`.

## Gate A - Local

- Branch: `main`.
- HEAD inicial: `b79af4f docs: record password recovery production smoke`.
- Working tree inicial: limpio.
- `npm run hostinger:diagnose`: OK, sin secretos, envs ausentes localmente.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK.
- Warning: NFT/Turbopack conocido en `reportStorageService`.

## Gate B - Production Routes

Revalidacion productiva:

- `/`: `200`.
- `/sign-in`: `200`.
- `/sign-up`: `200`.
- `/forgot-password`: `200`.
- `/reset-password`: `200`.
- `/dashboard`: `307` a `/sign-in`.
- `500`: ausente en rutas GET.
- `503/504`: ausente.
- Hostinger 404: ausente.

Resultado: el `500` GET de `/forgot-password` no se reprodujo tras el redeploy/restart.

## Gate C - Logs

Logs Hostinger no disponibles desde Codex.

El diagnostico siguio por reproduccion HTTP y auditoria local.

## Gate D - Code Audit

Archivos revisados:

- `src/app/forgot-password/page.tsx`.
- `src/app/api/account-support/password-reset/request/route.ts`.
- `src/app/api/account-support/password-reset/confirm/route.ts`.
- `src/lib/account-recovery.ts`.

Hallazgos:

- `/forgot-password` es pagina client/static y no envia email ni consulta DB durante render.
- Resend se usa solo dentro del POST de request.
- Env provider se decide en runtime dentro de helper.
- No hay envio de email durante GET page render.
- Token invalido con JSON correcto devuelve error controlado.

## Gate E - Fix / Hardening

Fix minimo aplicado:

- `src/app/api/account-support/password-reset/confirm/route.ts`.
- Se agrego validacion de formato de reset token antes de consultar DB.
- Tokens malformados devuelven `400` con mensaje controlado.

Riesgo:

- Bajo. No toca schema, auth normal, DNS, Resend ni dashboard.

## Gate F - Local Validation

- `npm run build`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `/forgot-password` local: `200`.
- `/reset-password` local: `200`.
- POST confirm con token invalido y JSON correcto: `400`, mensaje controlado.

## Gate G - Production Smoke

Produccion actual:

- `/forgot-password`: `200`.
- `/reset-password`: `200`.
- `/dashboard`: `307` sin sesion.
- Email inexistente: respuesta neutral.
- Token invalido: `400`, mensaje controlado.

Valid token:

- Pendiente de ejecutar con una cuenta QA que pueda recibir email real.
- Codex no recibio ni uso token real.
- No se imprimio token.

## Decision

Password recovery production operational: PARCIAL.

Motivo:

- Rutas y request neutral funcionan.
- Token invalido falla controladamente.
- Provider esta configurado segun reporte del usuario.
- Falta smoke de email recibido + link valido + cambio de password + token usado.

Public launch ready: NO.

Next hito recomendado:

- `AUTH-1-VALID-TOKEN-SMOKE - QA mailbox recovery link end-to-end`.
