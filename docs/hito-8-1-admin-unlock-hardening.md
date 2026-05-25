# Hito 8.1 - Admin/Unlock Hardening

## Objetivo
Dejar el flujo manual de unlock operable y seguro con `ADMIN_EMAILS`, control server-side, acciones admin endurecidas e idempotencia de entitlements.

## Alcance
- Validar `ADMIN_EMAILS` en entorno local.
- Confirmar fail-closed cuando no hay admins configurados.
- Confirmar acceso para admin autorizado y bloqueo para no-admin.
- Mejorar la UI de `/dashboard/admin/unlock-requests`.
- Endurecer transiciones `approve`, `reject` y `fulfill`.
- Validar grants idempotentes de entitlements.
- Validar commercial status y PDF `readiness_report` con entitlement.

## Avance
- Avance general antes del hito: 91%.
- Avance general despues del hito: 93%.
- Avance del hito: 100%.
- Justificacion: el admin manual ya puede operar requests reales con seguridad fail-closed y grants idempotentes.

## Admin setup
`ADMIN_EMAILS` se configura como lista separada por comas:

```env
ADMIN_EMAILS=admin@example.com,founder@example.com
```

Reglas:
- Se normaliza a lowercase.
- Se aplican `trim`.
- Si esta vacio, nadie es admin.
- Los wildcards con `*` se ignoran.
- La autorizacion ocurre server-side.

## Smoke tests
Resultados ejecutados con datos ficticios:
- No session: `/dashboard/admin/unlock-requests` redirige a `/sign-in`.
- Non-admin: usuario autenticado fuera de `ADMIN_EMAILS` recibe 404.
- Admin: usuario configurado en `ADMIN_EMAILS` recibe 200.
- Approve: `pending -> approved`.
- Fulfill: `approved -> fulfilled`.
- Fulfill repetido: no-op seguro.
- Reject: `pending -> rejected`.
- Fulfill sobre rejected: bloqueado.
- Entitlements: no se duplican por `assessmentId + entitlementKey`.
- PDF `readiness_report`: generado con entitlement, descargable antes de delete y bloqueado despues de soft-delete.

## Idempotency
Los entitlements usan `upsert` con unique compuesto `assessmentId_entitlementKey`.
Un segundo `fulfill` sobre una request ya fulfilled retorna la request sin volver a ejecutar grants ni crear filas duplicadas.

## Riesgos
- `ADMIN_EMAILS` debe configurarse en Hostinger o el admin queda cerrado.
- El flujo sigue siendo manual; no existe verificacion automatica de pago.
- No hay RBAC complejo; admin depende de lista de emails.
- Los emails de usuarios se muestran redaccionados en UI admin.

## Rollback
- Revertir cambios en `src/server/admin/adminAuth.ts`.
- Revertir cambios en `src/server/unlocks/unlockRequestService.ts`.
- Revertir cambios en `src/app/dashboard/admin/unlock-requests/page.tsx`.
- Revertir estilos `.admin-filter-row` si fuera necesario.
- No hay migracion nueva que revertir.

## Proximo hito
Recomendado: HITO 9 - Hostinger Deployment Hardening.
