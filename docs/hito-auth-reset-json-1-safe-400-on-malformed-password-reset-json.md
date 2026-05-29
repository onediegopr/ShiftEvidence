# HITO AUTH-RESET-JSON-1 - Safe 400 on Malformed Password Reset JSON

## Objetivo

Corregir el manejo de JSON malformado en `password-reset/confirm` para devolver `400 Bad Request` con una respuesta segura, sin alterar el flujo exitoso de reset ni el comportamiento anti-enumeracion.

## Hallazgo corregido

Durante `POST-HARDENING-QA-1` se detecto que `POST /api/account-support/password-reset/confirm` devolvia `500 Internal Server Error` cuando el body tenia JSON malformado.

El endpoint no exponia stack trace ni tokens al cliente, pero el status correcto para un body invalido es `400 Bad Request`.

## Archivos revisados

- `src/app/api/account-support/password-reset/confirm/route.ts`
- `tests/unit/passwordResetConfirmRoute.test.ts`

## Archivos modificados

- `src/app/api/account-support/password-reset/confirm/route.ts`
- `tests/unit/passwordResetConfirmRoute.test.ts`

## Comportamiento anterior

- `request.json()` se ejecutaba dentro del `try` general del endpoint.
- Si el JSON era malformado, el error caia en el catch generico.
- Resultado: `500 Internal Server Error` con mensaje generico `Unable to reset password.`

## Comportamiento nuevo

- El parseo JSON se maneja en un `try/catch` dedicado.
- Si el body no es JSON valido, el endpoint responde:
  - HTTP `400 Bad Request`
  - `{ "ok": false, "message": "Invalid request body." }`
- No se devuelve error crudo.
- No se loguea el body.
- No se loguean tokens.
- No se loguean passwords.

## Comportamiento preservado

- Token invalido bien formado sigue respondiendo `400 Bad Request`.
- Mensaje para token invalido: `This reset link is invalid or has expired.`
- Token hasheado: preservado.
- TTL: preservado.
- One-time use: preservado.
- Revocacion de sesiones: preservada.
- Audit event de reset exitoso: preservado.
- Password reset request: no tocado.
- Anti-enumeracion: preservada.
- Rate limiting existente: preservado.

## Tests agregados

Se agrego `tests/unit/passwordResetConfirmRoute.test.ts` con cobertura para:

- JSON malformado devuelve `400`.
- La respuesta de JSON malformado no expone `SyntaxError`, stack, token ni password.
- Token invalido con JSON bien formado conserva la respuesta segura existente.

## Validaciones ejecutadas

- `npm run test:run`: OK, 7 archivos / 27 tests.
- `npm run lint`: OK, 0 errores, 10 warnings preexistentes de `<img>`.
- `npm run typecheck`: OK.
- `npm run build`: OK, warning NFT conocido no bloqueante.
- `npm run hostinger:diagnose`: OK.
- `npx prisma validate`: OK cargando `.env.local` solo dentro del proceso, sin imprimir valores.
- `npx prisma generate`: OK cargando `.env.local` solo dentro del proceso, sin imprimir valores.

## Validacion funcional local

Con localhost levantado desde el build actualizado:

- JSON malformado:
  - `POST /api/account-support/password-reset/confirm`
  - Resultado: `400 Bad Request`
  - Body: `{ "ok": false, "message": "Invalid request body." }`
- Token invalido bien formado:
  - `POST /api/account-support/password-reset/confirm`
  - Resultado: `400 Bad Request`
  - Body: `{ "ok": false, "message": "This reset link is invalid or has expired." }`

## Areas no tocadas

- Better Auth config: no tocado.
- Password reset request: no tocado.
- Session revocation: no tocada.
- DB schema: no tocado.
- Migraciones: no ejecutadas.
- Rate limiting: no cambiado.
- CSP/headers: no tocado.
- Storage: no tocado.
- Parser: no tocado.
- PDF: no tocado.
- AI: no tocado.
- Pricing/scoring: no tocado.
- UI/copy publica: no tocado.
- `.env.local`: no tocado.

## Confirmaciones finales

- Push realizado: NO.
- Production deploy: NO.
- Production migration applied: NO.
- Production launched: NO.
