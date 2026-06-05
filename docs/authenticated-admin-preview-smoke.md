# Authenticated Admin Preview Smoke

Fecha: 2026-06-05

## Objetivo

Validar en Vercel Preview, con sesion autenticada real/controlada, el acceso al dashboard y el comportamiento seguro del admin interno sin ejecutar acciones peligrosas.

Este smoke quedo parcial porque no se pudo obtener una identidad admin controlada incluida en `ADMIN_EMAILS` sin leer, reemplazar o modificar configuracion sensible. El sistema fallo cerrado como se esperaba.

## Preview

- Preview URL: `https://infrashift-r2-recovery-diegoperezroca-4286-shift-evidence.vercel.app`
- Deployment observado: Ready / Preview.
- Preview Protection: habilitada; se uso acceso temporal para QA, sin documentar el enlace ni credenciales.
- No se uso production alias.
- No se uso custom domain.
- No se hizo deploy ni promote.

## Usuario

- Usuario sintetico/controlado creado via Better Auth.
- Email: sintetico `admin-preview-smoke+<timestamp>@example.invalid`.
- Credencial de acceso: no documentada.
- Artefactos de navegador/autenticacion: no documentados.
- Resultado: sesion creada y dashboard autenticado disponible.
- Admin identity: no confirmada como admin porque el email sintetico no estaba verificablemente incluido en `ADMIN_EMAILS`.

## Rutas Publicas Validadas

| Ruta | Resultado | Observacion |
| --- | --- | --- |
| `/` | 200 OK | Carga publica. |
| `/dashboard` sin sesion | 307 a `/sign-in` | Gate seguro. |
| `/sign-in` | 200 OK | Carga publica. |
| `/sign-up` | 200 OK | Carga publica. |
| `/pricing` | 200 OK | Carga publica. |
| `/billing/checkout/starter` | 200 OK | Checkout safe-gated; no Stripe hosted checkout live. |
| `/billing/bank-transfer/professional` | 200 OK | Flujo manual/bank transfer disponible. |

## Authenticated Dashboard

| Ruta | Resultado | Observacion |
| --- | --- | --- |
| `POST /api/auth/sign-up/email` | 200 OK | Usuario sintetico creado con sesion. |
| `/dashboard` con sesion | 200 OK | Workspace autenticado disponible. |

## Admin Dashboard

| Ruta | Resultado | Observacion |
| --- | --- | --- |
| `/dashboard/admin` | 200 OK | Muestra cierre seguro por falta de email admin en `ADMIN_EMAILS`. |

El hub admin no expuso secretos. La copia indica que el acceso inicial se controla por `ADMIN_EMAILS` y que se debe pedir al operador que agregue el email en configuracion segura.

## Billing Admin

| Ruta | Resultado | Observacion |
| --- | --- | --- |
| `/dashboard/admin/billing` | 404 | Fail-closed por `requireAdminSession` para usuario autenticado no-admin. |

No se pudo validar visualmente la consola de billing admin con identidad admin real/controlada.

## Pricing Admin

| Ruta | Resultado | Observacion |
| --- | --- | --- |
| `/dashboard/admin/pricing` | 200 OK | Renderiza pantalla de acceso denegado para usuario no-admin. |

La ruta no expuso datos internos de pricing para usuario no-admin. No se editaron snapshots, precios publicos, billing runtime, checkout, pagos ni entitlements.

Precios publicos esperados no fueron modificados:

- Starter: USD 490.
- Professional: USD 1,500.
- Migration Blueprint: USD 3,500.
- MSP Partner: from USD 399/month.

## Unlock Requests

| Ruta | Resultado | Observacion |
| --- | --- | --- |
| `/dashboard/admin/unlock-requests` | 404 | Fail-closed por `requireAdminSession` para usuario autenticado no-admin. |

No se aprobaron, completaron, rechazaron ni cancelaron unlock requests.

## Warnings Y Copy En Espanol

- Admin hub muestra copy operativo en espanol para acceso restringido.
- Pricing admin no-admin muestra acceso denegado en espanol.
- No se pudo validar la copia completa de billing admin ni unlock requests con identidad admin real/controlada.

## Billing Safety

Confirmado durante el smoke:

- No Stripe live.
- No live checkout.
- No pago.
- No order real.
- No entitlement.
- Wise/bank transfer sigue manual.
- Lemon no fue activado ni usado.
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

## Logs

Se revisaron logs de Vercel del periodo del smoke.

Observado:

- `POST /api/auth/sign-up/email`: 200.
- `/dashboard`: 200 con sesion sintetica.
- `/dashboard/admin`: 200 con pantalla fail-closed.
- `/dashboard/admin/billing`: 404 para no-admin.
- `/dashboard/admin/pricing`: 200 con acceso denegado.
- `/dashboard/admin/unlock-requests`: 404 para no-admin.

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
- No deploy.
- No promote.
- No secrets documentados.

## Resultado Del Hito

Estado: PARCIAL.

Validado:

- Vercel Preview operativo.
- Preview envs requeridas presentes como encrypted.
- Smoke publico OK.
- Auth sign-up sintetico OK.
- Dashboard autenticado OK.
- Admin fail-closed OK para usuario autenticado no-admin.
- Logs sin secretos detectados.

No validado:

- Admin hub con identidad admin real/controlada.
- Billing admin completo.
- Pricing admin completo con permisos admin.
- Unlock requests completo con permisos admin.

Bloqueo:

- Falta una identidad admin controlada incluida en `ADMIN_EMAILS`.
- No se modifico `ADMIN_EMAILS` porque reemplazar o leer valores existentes podria exponer o romper configuracion segura.
- No se hizo DB update ni invitation manual.

## Porcentajes Finales

- AUTHENTICATED-ADMIN-PREVIEW-SMOKE: 55%.
- Admin internal ops: 90%.
- Vercel Preview readiness: 96%.
- Billing readiness: 92%.
- Production/cutover readiness: 82%.
- Avance general tecnico: 96%.

## Pendientes

- Crear o confirmar un admin controlado incluido en `ADMIN_EMAILS` sin exponer valores.
- Repetir smoke admin autenticado con permisos reales/controlados.
- Validar billing admin, pricing admin y unlock requests con rol admin.
- Stripe test keys / Price IDs.
- QA visual manual de PDFs.
- Production cutover controlado.

## Proximo Hito Recomendado

`AUTHENTICATED-ADMIN-PREVIEW-SMOKE-ADMIN-IDENTITY`

Alternativa si se quiere avanzar billing:

`STRIPE-TESTMODE-PRICE-SMOKE`
