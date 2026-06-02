# ADMIN-OPS-ES-1 - Admin interno en espanol y operacion segura

## Objetivo

Endurecer la consola administrativa interna con copy en espanol y avisos visibles antes de acciones manuales sensibles, sin modificar comportamiento de producto, billing, pagos, pricing, base de datos ni despliegues.

## Alcance

Rutas revisadas y endurecidas:

- `/dashboard/admin`
- `/dashboard/admin/billing`
- `/dashboard/admin/pricing`
- `/dashboard/admin/unlock-requests`

No se tocaron rutas publicas, landing, checkout publico, webhooks, Prisma schema, migraciones, env vars, Hostinger, Vercel ni pricing numerico.

## Cambios aplicados

### Consola admin principal

- Se agrego banner interno de seguridad para acciones manuales.
- Se explicita que las notas internas no deben guardar secretos, passwords, API keys ni datos de tarjeta.
- Se mantiene el enfoque de logs/proveedores sanitizados antes de compartir con clientes.

### Billing admin

- Se reforzo el copy de operaciones sensibles.
- Se aclara que Wise/bank transfer es una solicitud manual, no una transferencia automatica.
- Se aclara que Stripe live debe permanecer desactivado salvo aprobacion explicita.
- Se reforzo el aviso antes de marcar pago recibido: solo despues de verificar pago fuera de la plataforma.
- Se aclara que actualizar invoice requests no concede acceso ni crea transferencias Wise.
- Se ajustaron labels visibles para reducir mezcla ingles/espanol, incluyendo `Factura enviada`, `Modo checkout`, `Pagos live` y `Accesos automaticos`.

### Pricing admin

- Se agrego banner de control manual para snapshots.
- Se aclara que aprobar snapshots no modifica precios publicos, billing runtime, checkout, pagos ni entitlements automaticos.
- Se agrego aviso antes de aprobar o archivar snapshots para validar fuente, moneda, USD, alcance e impacto comercial fuera de la plataforma.

### Unlock requests

- Se agrego banner de operacion interna sensible.
- Se aclara que no concede acceso automaticamente salvo que la accion lo indique.
- Se agregaron avisos antes de aprobar/completar solicitudes.
- Se aclara que completar puede habilitar acceso real y requiere verificar pago externo y match usuario/workspace/assessment.
- Se reforzaron placeholders de notas internas para no guardar secretos, passwords, API keys ni datos de tarjeta.

## Tests

Se agrego `tests/unit/adminOpsSpanishSafetyCopy.test.ts` para proteger:

- banner de consola admin segura;
- copy manual de Wise/bank transfer;
- restriccion de Stripe live;
- separacion de pricing admin vs precios publicos/billing runtime;
- warnings de unlock requests;
- ausencia de copy Lemon en superficies admin revisadas.

## Seguridad

- No se crearon pagos.
- No se tocaron payments, orders paid, entitlements ni unlocks reales.
- No se tocaron DB, migraciones ni Prisma schema.
- No se tocaron env vars.
- No se tocaron Hostinger ni Vercel.
- No se hizo deploy.
- No se hizo push.
- No se imprimieron secretos.

## Riesgos pendientes

- Validar visualmente con sesion admin real cuando el flujo de browser autenticado este disponible.
- Seguir revisando copy interno de nuevas pantallas admin que se agreguen en hitos posteriores.
- Mantener Storage release, billing automatizado y full public launch como hitos separados.

## Decision

ADMIN-OPS-ES-1 queda orientado a operacion interna mas clara y segura. El hito no habilita pagos live, no automatiza Wise, no cambia pricing publico y no declara full public launch.
