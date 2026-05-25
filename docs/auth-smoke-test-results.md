# Auth Smoke Test Results

Fecha: 2026-05-25

## Rutas probadas
- `/sign-up`
- `/sign-in`
- `/dashboard`
- `/api/auth/sign-up/email`
- `/api/auth/sign-in/email`
- `/api/auth/sign-out`

## Usuario de prueba
- Email: `test+shiftreadiness@example.com`
- Password: redacted

## Resultados
### Sign-up
- Estado: OK
- Resultado: usuario creado con sesión activa
- Observación: el callback relativo `/dashboard` funcionó con `Origin: http://localhost:3000`

### Sign-in
- Estado: OK
- Resultado: sesión creada y acceso a `/dashboard`

### Sign-out
- Estado: OK
- Resultado: sesión invalidada correctamente

### Protección de dashboard
- Sin sesión: redirección a `/sign-in`
- Con sesión: acceso OK

## Observaciones
- La ruta de auth requiere `BETTER_AUTH_URL` y `trustedOrigins` correctos.
- En localhost, el flujo más estable fue usar `callbackURL=/dashboard`.
- Se evitó exponer credenciales reales en logs o documentación.
