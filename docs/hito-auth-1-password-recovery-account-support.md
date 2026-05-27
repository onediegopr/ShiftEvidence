# HITO AUTH-1 - Password Recovery + Account Support

## Objetivo

Implementar recuperacion de password y soporte de cuenta para ShiftReadiness sin romper Better Auth, login existente ni el estado de controlled production launch.

## Contexto

- Production launched: SI, controlled production launch.
- Public launch: NO.
- Bloqueador principal: no habia forgot password autoservicio.
- Controlled launch podia operar con soporte manual, pero public launch no debia avanzar sin recovery formal.

## Auditoria local

- Branch: main.
- HEAD inicial esperado: `5b559b9 docs: add production launch operating pack v1.0`.
- Working tree inicial: limpio.
- Node: `v22.22.0`.
- npm: `10.9.4`.
- `npm run hostinger:diagnose`: OK.
- `npm run typecheck`: OK inicial.
- `npm run lint`: OK inicial.
- `npm run build`: OK inicial con warning Turbopack/NFT conocido.

## Auth audit

- Better Auth esta configurado en `src/lib/auth.ts`.
- Email/password login existente esta activo.
- Better Auth expone endpoints nativos de password reset.
- Se descarto usar el flujo nativo directamente porque almacena el token como parte del identificador de verificacion, mientras este hito exige no guardar token plano.
- Se mantiene el login existente de Better Auth.
- Se usa el hasher compatible de Better Auth para escribir la nueva password.

## Diseno del flujo

Rutas:

- `/sign-in`: agrega link `Forgot password?`.
- `/forgot-password`: form de solicitud.
- `/reset-password?token=...`: form para nueva password.

APIs:

- `POST /api/account-support/password-reset/request`.
- `POST /api/account-support/password-reset/confirm`.

Respuesta de request:

- Siempre responde mensaje neutral.
- No revela si el email existe.
- No imprime token.

Mensaje neutral:

`If an account exists, we'll send recovery instructions.`

## DB / Prisma

Se agrego el modelo `PasswordResetRequest`.

Campos principales:

- `emailNormalized`.
- `emailHash`.
- `tokenHash`.
- `expiresAt`.
- `usedAt`.
- `status`.
- `deliveryMode`.
- hashes opcionales de IP y user agent.

Seguridad:

- No se guarda token plano.
- `tokenHash` es unico.
- Token expira.
- Token es de uso unico.
- Requests anteriores activos del mismo usuario quedan `superseded`.

Migration local creada:

- `prisma/migrations/20260527190000_auth_password_recovery/migration.sql`.

Produccion:

- Requiere migracion productiva controlada antes de usar el flujo en produccion.
- No se ejecuto `prisma migrate deploy`.
- No se ejecuto `prisma migrate reset`.

## Backend implementation

Request reset:

- Normaliza email.
- Valida formato.
- Responde neutral para email inexistente.
- Para email existente:
  - genera token random seguro;
  - almacena hash;
  - establece expiracion de 60 minutos;
  - intenta email si hay provider configurado;
  - si no hay provider, deja request en modo manual;
  - registra audit event.

Confirm reset:

- Requiere token.
- Hashea token entrante.
- Busca token hash.
- Rechaza invalido/expirado/usado/superseded.
- Valida longitud de password.
- Hashea password con `better-auth/crypto`.
- Actualiza o crea account credential compatible.
- Marca token como usado.
- Revoca sesiones existentes del usuario.
- Registra audit event.

## Email / fallback

Provider implementado:

- Resend si existen `RESEND_API_KEY` y `EMAIL_FROM`.

Fallback:

- Si no hay provider, la solicitud queda registrada como `manual_pending`.
- El usuario ve el mismo mensaje neutral.
- Controlled launch puede operar con soporte manual.
- Public launch requiere provider real validado.

Env vars conceptuales:

- `RESEND_API_KEY` opcional.
- `EMAIL_FROM` opcional.

No se imprimieron valores.

## UI

Archivos:

- `src/app/forgot-password/page.tsx`.
- `src/app/reset-password/page.tsx`.
- `src/app/reset-password/reset-password-form.tsx`.
- `src/app/sign-in/page.tsx`.
- `src/index.css`.

Estados cubiertos:

- request enviado;
- error de request;
- token faltante;
- password mismatch;
- token invalido/expirado/usado;
- password actualizada.

## QA local

Validado hasta ahora:

- TypeScript compila tras regenerar Prisma client.
- Lint pasa.
- Build final pendiente de ejecutar al cierre del hito.

Limitacion:

- No se aplico la migration sobre una DB local porque el entorno puede estar apuntando a una DB compartida/productiva. Ejecutar migracion requiere confirmacion del target DB.
- Por esa razon, el smoke end-to-end de token contra DB queda pendiente hasta aplicar la migration en entorno seguro.

## Riesgos pendientes

- Produccion requiere ejecutar migration controlada antes de activar el flujo.
- Email real requiere configurar provider.
- Sin provider, el recovery queda como soporte manual y public launch sigue NO.
- Faltan rate limits persistentes por IP/email; el endpoint evita enumeracion, pero public launch deberia agregar rate limiting formal.

## Decision

- Controlled launch remains active: SI.
- Public launch ready: NO.
- Motivo: el flujo esta implementado localmente, pero produccion requiere migration/deploy controlados y email provider real para self-service public launch.
