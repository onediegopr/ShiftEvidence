# Authenticated Admin Preview Smoke

Fecha: 2026-06-05

## Objetivo

Validar en Vercel Preview, con sesion autenticada real/controlada, el acceso al dashboard y el comportamiento seguro del admin interno sin ejecutar acciones peligrosas.

El hito anterior quedo parcial porque el usuario sintetico autenticado no estaba verificablemente incluido en `ADMIN_EMAILS`. Este hito cerro esa brecha agregando una identidad admin controlada solo en Vercel Preview.

## Preview

- Preview URL validada: `https://infrashift-r2-recovery-diegoperezroca-4286-shift-evidence.vercel.app`
- Deployment Preview final: `https://infrashift-r2-recovery-8yws1ohub-shift-evidence.vercel.app`
- Deployment status: Ready / Preview.
- Preview Protection: habilitada; se uso acceso temporal para QA, sin documentar el enlace ni credenciales.
- Alias Preview estable apuntada al deployment Preview nuevo para combinar origin confiado y runtime actualizado.
- Production env: untouched.
- Production alias: untouched.
- No custom domain.
- No DNS.
- No promote.

## Admin Access

Confirmado por auditoria de codigo:

- `ADMIN_EMAILS` controla el acceso admin.
- Se parsean multiples emails separados por coma.
- Los emails se normalizan con `trim().toLowerCase()`.
- Wildcards no son aceptados.
- La comparacion es case-insensitive por normalizacion.
- Usuarios demo no pueden ser admin aunque el email coincida.
- Rutas con `requireAdminSession` fallan cerradas para no-admin.
- Cambios de env requieren nuevo runtime/deploy Preview para ser efectivos.

## Admin Identity

- Identidad admin controlada: confirmada.
- Email: sintetico, documentado como `<admin-preview-email>`.
- Credencial de acceso: no documentada.
- Artefactos de navegador/autenticacion: no documentados.
- `ADMIN_EMAILS` Preview branch: actualizado para incluir la identidad sintetica.
- Valores existentes de `ADMIN_EMAILS`: preservados sin imprimirlos.
- Production env: no tocada.
- No DB update.
- No invitation manual.

## Vercel Preview Env

- `ADMIN_EMAILS`: actualizado solo para Preview / branch `preview`.
- Otras env vars: no modificadas.
- Env values: no impresos.
- Archivo temporal de env: creado fuera del repo y eliminado en el mismo paso.
- `.env.local`: no trackeado.
- `.env.r2-smoke.local`: no trackeado.

## Rutas Publicas Validadas

| Ruta | Resultado | Observacion |
| --- | --- | --- |
| `/` | 200 OK | Carga publica. |
| `/dashboard` sin sesion | 307 a `/sign-in` | Gate seguro. |
| `/sign-in` | 200 OK | Carga publica. |
| `/sign-up` | 200 OK | Carga publica. |
| `/pricing` | 200 OK | Carga publica. Precios publicos esperados presentes. |
| `/billing/checkout/starter` | 200 OK | Checkout safe-gated; no Stripe hosted checkout live. |
| `/billing/bank-transfer/professional` | 200 OK | Flujo manual/bank transfer disponible. |

## Authenticated Dashboard

| Ruta | Resultado | Observacion |
| --- | --- | --- |
| `POST /api/auth/sign-up/email` | 422 esperado | Usuario sintetico ya existia. |
| `POST /api/auth/sign-in/email` | 200 OK | Sesion admin sintetica creada. |
| `/dashboard` con sesion | 200 OK | Workspace autenticado disponible. |

## Admin Dashboard

| Ruta | Resultado | Observacion |
| --- | --- | --- |
| `/dashboard/admin` | 200 OK | Admin hub disponible con identidad admin. |

Resultado:

- No mostro cierre por falta de permisos.
- Links internos visibles.
- Referencias operativas a billing y unlock requests visibles.
- No se ejecutaron formularios ni acciones admin.
- No se observaron valores sensibles en la respuesta.

## Billing Admin

| Ruta | Resultado | Observacion |
| --- | --- | --- |
| `/dashboard/admin/billing` | 200 OK | Billing admin disponible con identidad admin. |

Resultado:

- Warnings en espanol visibles.
- Copy de operacion interna sensible visible.
- Stripe se mantiene seguro/safe-gated.
- Wise/bank transfer se mantiene manual.
- No live checkout.
- No pago.
- No order real.
- No entitlement real.
- No accion sensible ejecutada.
- Hay menciones historicas/diagnosticas de providers, incluyendo una referencia historica `lemon_squeezy`, pero no se activo Lemon ni un flujo live.
- La pagina puede mostrar nombres de configuracion como diagnostico operativo, sin valores secretos.

## Pricing Admin

| Ruta | Resultado | Observacion |
| --- | --- | --- |
| `/dashboard/admin/pricing` | 200 OK | Pricing admin disponible con identidad admin. |

Resultado:

- No mostro pantalla de acceso denegado.
- Copy en espanol visible.
- Warning de operacion interna sensible visible.
- Separacion clara entre snapshots, precios publicos y billing runtime.
- No se editaron snapshots.
- No se editaron precios.
- No se modifico billing runtime.

Precios publicos esperados validados en `/pricing`:

- Starter: USD 490.
- Professional: USD 1,500.
- Migration Blueprint: USD 3,500.
- MSP Partner: from USD 799/month.

## Unlock Requests

| Ruta | Resultado | Observacion |
| --- | --- | --- |
| `/dashboard/admin/unlock-requests` | 200 OK | Unlock requests disponible con identidad admin. |

Resultado:

- Warning de operacion interna sensible visible.
- Copy advierte que ciertas acciones pueden habilitar acceso real.
- No se aprobaron solicitudes.
- No se completaron solicitudes.
- No se rechazaron solicitudes.
- No se cancelaron solicitudes.
- No grants.
- No revoke.

## Warnings Y Copy En Espanol

Validado:

- Billing admin: warnings de accion manual y revision previa.
- Pricing admin: warning de snapshots/precios publicos/billing runtime.
- Unlock requests: warning de acceso real y accion manual.
- Admin hub: rutas internas visibles para operacion admin.

## Billing Safety

Confirmado durante el smoke:

- No Stripe live.
- No live checkout.
- No Stripe session.
- No pago.
- No order real.
- No entitlement.
- Wise/bank transfer sigue manual.
- Lemon no fue activado ni usado como flujo live.
- Checkout starter no redirigio a Stripe hosted checkout live.

## Acciones No Ejecutadas

No se ejecuto ninguna accion sensible:

- No mark paid.
- No grant entitlement.
- No revoke entitlement.
- No refund.
- No cancel.
- No mark invoice sent.
- No trigger fulfillment.
- No invoice real.
- No edit real pricing.
- No delete assessment.
- No delete user.
- No webhook.
- No live Stripe test.

## Logs

Se revisaron logs de Vercel del periodo del smoke.

Observado durante el cierre exitoso:

- `POST /api/auth/sign-in/email`: 200.
- `/dashboard`: 200 con sesion admin sintetica.
- `/dashboard/admin`: 200.
- `/dashboard/admin/billing`: 200.
- `/dashboard/admin/pricing`: 200.
- `/dashboard/admin/unlock-requests`: 200.

Observado durante investigacion previa:

- Las URLs Preview directas no confiadas devolvieron 403 en auth por origin/trusted origins.
- Se resolvio apuntando la alias Preview estable confiada al deployment Preview actualizado.
- No se amplio wildcard ni se confio en cualquier `*.vercel.app`.

No se observaron valores sensibles impresos en los logs filtrados:

- No connection strings.
- No auth secrets.
- No R2 secrets.
- No Upstash credentials.
- No Stripe secrets.
- No browser auth artifacts.
- No asymmetric credentials.

## Seguridad

- No production DB.
- No bucket prod.
- No production R2 credential.
- No Stripe live.
- No live payments.
- No Wise transfer.
- No webhook real.
- No entitlement real.
- No Hostinger.
- No DNS.
- No custom domain.
- No migrations.
- No db push.
- No production deploy nuevo.
- No promote.
- No secrets documentados.

## Resultado Del Hito

Estado: COMPLETO.

Validado:

- Vercel Preview operativo.
- Preview env admin actualizada solo en branch Preview.
- Preview alias estable apuntada al deployment Preview actualizado.
- Smoke publico OK.
- Auth sign-in admin sintetico OK.
- Dashboard autenticado OK.
- Admin hub OK.
- Billing admin OK.
- Pricing admin OK.
- Unlock requests OK.
- Logs post-fix sin errores activos ni secretos detectados.

## Porcentajes Finales

- AUTHENTICATED-ADMIN-PREVIEW-SMOKE-ADMIN-IDENTITY: 100%.
- Admin internal ops: 94%.
- Vercel Preview readiness: 97%.
- Billing readiness: 93%.
- Production/cutover readiness: 82%.
- Avance general tecnico: 97%.

## Pendientes

- Stripe test keys / Price IDs.
- QA visual manual de PDFs.
- Production cutover controlado.

## Proximo Hito Recomendado

`STRIPE-TESTMODE-PRICE-SMOKE`

