# Manual Unlock Admin v1

## Route
`/dashboard/admin/unlock-requests`

## Security
- Requiere sesion valida.
- Requiere que el email del usuario este incluido en `ADMIN_EMAILS`.
- Si `ADMIN_EMAILS` esta vacio, nadie es admin.
- Si el usuario no es admin, el acceso falla cerrado.
- Los emails se normalizan con trim/lowercase.
- Los wildcards con `*` se ignoran.
- La autorizacion se valida server-side.

## Actions
- Approve
- Reject
- Fulfill
- Cancel

## Behavior
- Approve cambia el estado a `approved`.
- Reject cambia el estado `pending` o `approved` a `rejected`.
- Fulfill cambia el estado a `fulfilled` y concede entitlements.
- Cancel cambia el estado a `cancelled`.
- Fulfill sobre `fulfilled` es no-op idempotente.
- Fulfill sobre `rejected` o `cancelled` esta bloqueado.
- Pending -> fulfilled se permite como shortcut admin manual y queda documentado.

## UI
- Status summary por pending, approved, fulfilled y rejected.
- Filtros por status: all, pending, approved, fulfilled, rejected, cancelled.
- Queue unificada de requests recientes.
- Notas internas opcionales.
- Amount, contact email y estado comercial.
- Emails de usuario/contacto redaccionados.
- Acciones visibles solo cuando aplican al estado actual.

## Limitations
- No checkout.
- No cobro real.
- No scheduling real.
- No panel enterprise.
- No RBAC avanzado; depende de `ADMIN_EMAILS`.
