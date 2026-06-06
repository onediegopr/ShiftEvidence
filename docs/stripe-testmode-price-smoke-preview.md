# Stripe Test-Mode Price Smoke Preview

Fecha: 2026-06-05

## Objetivo

Validar Stripe en modo test de forma controlada para los planes checkout-eligible, cargar configuracion solo en Vercel Preview y llegar hasta Stripe hosted checkout sin completar pagos.

## Stripe Dashboard

- Modo Stripe confirmado: test mode / entorno de prueba.
- Live mode: no tocado.
- Live products: no editados.
- Live webhooks: no tocados.
- Live payments: no activados.

## Productos Y Precios Test

Los productos existian y fueron verificados en Stripe Dashboard test mode:

| Plan | Producto Stripe | Estado | Precio | Cadencia | Price ID |
| --- | --- | --- | ---: | --- | --- |
| Starter Readiness | Starter Readiness | active | USD 490 | one-time | `price_...3zr3` |
| Professional Assessment | Professional Assessment | active | USD 1,500 | one-time | `price_...bwhh` |
| MSP Partner | MSP Partner | active | USD 799 | monthly recurring | `price_...7Lup` |

No se creo precio checkout para Migration Blueprint; sigue siendo manual/invoice only.

## Vercel Preview Env

Configurado solo en Vercel Preview / branch `preview`:

- Server-side Stripe test credential loaded.
- Checkout mode: test.
- Checkout enabled: true.
- Live payments approval: false.
- Starter test Price ID loaded.
- Professional test Price ID loaded.
- MSP test Price ID loaded.

No se cargaron valores en Production. No se imprimieron ni documentaron credenciales. Los archivos temporales usados para cargar valores fueron creados fuera del repo y eliminados.

## Preview Runtime

- Preview deployment: `https://infrashift-r2-recovery-r7nscvzzv-shift-evidence.vercel.app`
- Target: Preview.
- Status: Ready.
- Preview stable alias: `https://infrashift-r2-recovery-diegoperezroca-4286-shift-evidence.vercel.app`
- La alias Preview estable fue apuntada al deployment Preview nuevo para mantener el origin confiado.
- No production alias.
- No promote.
- No custom domain.
- No DNS.

## Checkout Page Smoke

Preview URL validada:

`https://infrashift-r2-recovery-diegoperezroca-4286-shift-evidence.vercel.app`

| Ruta | Resultado | Observacion |
| --- | --- | --- |
| `/billing/checkout/starter` | 200 OK | Checkout ready en test mode. |
| `/billing/checkout/professional` | 200 OK | Checkout ready en test mode. |
| `/billing/checkout/msp` | 200 OK | Checkout ready en test mode. |

Confirmado en las tres rutas:

- No "not configured".
- No live warning.
- No Lemon activo.
- Copy indica que no hay entitlement automatico.

## Checkout Start Smoke

| Ruta | Resultado | Observacion |
| --- | --- | --- |
| `/billing/checkout/starter/start` | 303 | Redirige a Stripe hosted checkout test. |
| `/billing/checkout/professional/start` | 303 | Redirige a Stripe hosted checkout test. |
| `/billing/checkout/msp/start` | 303 | Redirige a Stripe hosted checkout test. |

No se documentaron URLs de sesion.

## Hosted Checkout Test

Se abrio cada hosted checkout en Stripe y se detuvo antes de cualquier pago:

| Plan | Hosted checkout | Importe visible | Cadencia visible |
| --- | --- | ---: | --- |
| Starter Readiness | reached | USD 490 | one-time |
| Professional Assessment | reached | USD 1,500 | one-time |
| MSP Partner | reached | USD 799 | monthly |

Confirmado:

- Entorno de prueba visible.
- No live checkout.
- No tarjeta ingresada.
- No pago completado.

## DB/Admin Safety

La ruta de start crea la sesion en Stripe y redirige. No escribe directamente:

- `BillingOrder`.
- `BillingPayment`.
- `BillingEntitlementGrant`.
- Unlock request.
- Assessment entitlement.

No se ejecuto webhook. No se ejecuto accion admin. No se creo estado paid. No hubo grant ni entitlement.

## Logs

Logs de Vercel durante el smoke:

- Checkout pages: 200.
- Checkout start routes: 303.
- No Stripe runtime errors.
- No origin errors.
- No valores sensibles observados en logs filtrados.

## No Hecho

- No Stripe live.
- No live checkout.
- No pago.
- No tarjeta real.
- No tarjeta test.
- No webhook.
- No Stripe CLI.
- No paid state.
- No grant.
- No entitlement.
- No Wise transfer.
- No Production env.
- No Hostinger.
- No DNS.

## Validaciones

- `git diff --check`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- Tests especificos: 4 archivos, 25 tests OK.
- `npm run test:run`: 119 archivos, 615 tests OK.
- `npm run build`: OK con env dummy no sensible.

Nota: el primer build sin env dummy fallo porque el entorno local no tenia una DB URL; el rerun con valores dummy no sensibles completo correctamente.

## Resultado

Estado: COMPLETO.

Porcentajes finales:

- STRIPE-TESTMODE-PRICE-SMOKE: 100%.
- Billing readiness: 95%.
- Stripe test readiness: 95%.
- Vercel Preview readiness: 97%.
- Production/cutover readiness: 82%.
- Avance general tecnico: 97%.

## Pendientes

- Stripe webhook test-mode smoke si se desea validar persistencia de eventos.
- QA visual manual de PDFs.
- Production cutover controlado.

## Proximo Hito Recomendado

`STRIPE-WEBHOOK-TESTMODE-SMOKE`

Alternativa:

`PRODUCTION-CUTOVER-READINESS-1`

