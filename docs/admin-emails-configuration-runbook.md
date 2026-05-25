# ADMIN_EMAILS Configuration Runbook

## Proposito
`ADMIN_EMAILS` controla el acceso al mini admin interno de unlock requests. Es un control operativo temporal hasta implementar RBAC formal.

## Configuracion local
Agregar en `.env.local`:

```env
ADMIN_EMAILS=admin@example.com,founder@example.com
```

Luego reiniciar `npm run dev`.

## Configuracion en Hostinger
Agregar la misma variable en el panel de environment variables del runtime:

```env
ADMIN_EMAILS=admin@example.com,founder@example.com
```

Despues de cambiarla, reiniciar el proceso Node/Next.

## Seguridad
- Si `ADMIN_EMAILS` esta vacio, nadie puede entrar al admin.
- El helper falla cerrado.
- No se aceptan wildcards como `*@domain.com`.
- No se confia en query params ni client-side state.
- La sesion se valida server-side con Better Auth.

## Troubleshooting
- Si un admin recibe 404, validar que el email de la sesion coincide exactamente tras lowercase/trim.
- Si todos reciben 404, validar que `ADMIN_EMAILS` no esta vacio en el proceso runtime.
- Si una sesion sin login entra al admin, eso es incidente critico; debe revisar `requireAdminSession`.
- Si despues de cambiar `.env.local` no cambia el acceso, reiniciar el dev server.

## Operational notes
- No imprimir valores reales en logs.
- No commitear `.env.local`.
- Mantener `.env.example` con `ADMIN_EMAILS=` sin valores reales.
