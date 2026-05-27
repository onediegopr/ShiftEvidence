# AUTH-1-VALID-TOKEN-SMOKE - QA Mailbox Recovery Link End-to-End

## Objetivo

Cerrar el smoke real de password recovery en produccion con mailbox QA controlado, distinguiendo la validacion automatizada por Codex de la validacion manual user-attested del email y token valido.

## Contexto

- Production launched: SI, controlled production launch.
- Public launch: NO.
- Password recovery estaba en estado PARCIAL tras AUTH-1-HOTFIX.
- Codex no tiene acceso al mailbox QA ni a cookies/sesion del usuario.

## Validacion automatizada por Codex

Local:

- Branch: `main`.
- HEAD inicial: `07c8a9f fix: stabilize forgot password provider flow`.
- Working tree inicial: limpio.
- `npm run hostinger:diagnose`: OK, sin secretos.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run build`: OK tras limpiar solo `.next` por lock Windows/OneDrive.
- Warning: NFT/Turbopack conocido en `reportStorageService`.

Produccion:

- `/`: `200`.
- `/sign-in`: `200`.
- `/sign-up`: `200`.
- `/forgot-password`: `200`.
- `/reset-password`: `200`.
- `/dashboard`: `307` a `/sign-in` sin sesion.
- `500`: ausente.
- `503/504`: ausente.
- Hostinger 404: ausente.

Seguridad:

- Email inexistente ya validado previamente con respuesta neutral.
- Token invalido ya validado previamente con error controlado.
- No se imprimieron tokens, cookies ni secretos.

## Validacion manual user-attested

Validado por el usuario en navegador real y mailbox QA controlado:

- Email real de recovery recibido: SI.
- Link de reset abre correctamente: SI.
- Nueva contrasena funciona: SI.
- Dashboard carga tras login con nueva contrasena: SI.
- Contrasena vieja falla: SI.
- Token usado falla controladamente: SI.
- Token invalido falla controladamente: SI.
- Errores visibles: NO.

No se capturo ni documento el token completo.

## Resultado

Password recovery production operational: SI.

Controlled launch remains active: SI.

Public launch ready: pending final public launch review.

## Riesgos pendientes

- Public launch no se declara automaticamente en este hito.
- Hostinger logs siguen pendientes si no se revisan manualmente.
- QA cleanup/retention sigue pendiente.
- Otros blockers de public launch deben resolverse en una revision separada.

## Proximo hito recomendado

`PUBLIC-LAUNCH-READINESS-REVIEW - Final public launch blockers and go/no-go`.

## Public Launch Readiness Review Follow-up

Date: 2026-05-27.

Password recovery result in public launch review:

- Password recovery production operational: SI.
- Forgot password route: OK.
- Reset password route: OK.
- Non-existing email response: neutral.
- Invalid token with valid JSON: controlled `400`.
- Valid token: accepted by previous user-attested mailbox validation.

Public launch impact:

- Password recovery no longer blocks public launch readiness.
- Public launch still remains NO because other operational blockers remain.
