# STRIPE-TESTMODE-PRICE-SMOKE

## Objetivo

Validar de forma controlada la configuracion Stripe test-mode y los Price IDs de test mode para los planes checkout-eligible, sin activar live, sin crear pagos reales, sin tocar webhooks y sin conceder entitlements.

## Entorno

- Fecha: 2026-06-02
- Branch: `feature/demo-funnel-2`
- HEAD inicial: `3983889a541005165fcd9cb904a34e9e42eebd35`
- Runtime de smoke: local `next start` en `http://localhost:3001`
- Variables Stripe reales impresas: no
- Stripe API test-mode ejecutada: no
- Motivo: no habia `STRIPE_SECRET_KEY` test-mode ni Price IDs configurados en el entorno actual

## Git preflight

- Working tree inicial: limpio
- `origin/main`: no estaba por delante de HEAD
- `origin/feature/demo-funnel-2`: sincronizado con HEAD inicial
- Stashes: preservados, no aplicados

## Configuracion revisada

Variables esperadas en codigo:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_CHECKOUT_MODE`
- `STRIPE_CHECKOUT_ENABLED`
- `STRIPE_LIVE_PAYMENTS_APPROVED`
- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_PROFESSIONAL_PRICE_ID`
- `STRIPE_MSP_PRICE_ID`

Estado del entorno actual, sin imprimir valores:

| Variable | Estado |
| --- | --- |
| `STRIPE_SECRET_KEY` | missing |
| `STRIPE_WEBHOOK_SECRET` | missing |
| `STRIPE_CHECKOUT_MODE` | missing |
| `STRIPE_CHECKOUT_ENABLED` | missing |
| `STRIPE_LIVE_PAYMENTS_APPROVED` | missing |
| `STRIPE_STARTER_PRICE_ID` | missing |
| `STRIPE_PROFESSIONAL_PRICE_ID` | missing |
| `STRIPE_MSP_PRICE_ID` | missing |

Interpretacion:

- Modo detectado: missing/default test behavior.
- Live no esta activo.
- Checkout no puede crear sesiones porque faltan secret key y Price IDs.
- No se intento validar Stripe API porque faltan credenciales test-mode seguras.

## Planes revisados

| Plan | Precio esperado | Checkout | Stripe Price env |
| --- | ---: | --- | --- |
| Starter Readiness | USD 490 | eligible | `STRIPE_STARTER_PRICE_ID` |
| Professional Assessment | USD 1,500 | eligible | `STRIPE_PROFESSIONAL_PRICE_ID` |
| MSP Partner | From USD 799/month | eligible | `STRIPE_MSP_PRICE_ID` |
| Migration Blueprint | From USD 3,500 | invoice/manual | no Price ID |

No se cambiaron precios, plan IDs, Price IDs ni valores de pricing.

## Validaciones base

- `npm run typecheck`: OK
- `npm run lint`: OK
- Targeted tests:
  - `tests/unit/billingPaymentOptions.test.ts`
  - `tests/unit/billingCheckoutArchitecture.test.ts`
  - `tests/unit/billingAdminStatusLabels.test.ts`
  - `tests/unit/billingOperationsCopy.test.ts`
  - Resultado: OK, 4 files / 23 tests
- `npx prisma generate`: OK
- `npm run test:run`: OK, 115 files / 593 tests
- `npm run build`: OK

Build warning:

- Warning NFT conocido desde `src/server/evidence/localStorageService.ts` via `next.config.mjs`.
- No bloqueante para este hito.

## Checkout route smoke local

Se probo con Stripe env ausente para validar degradacion segura.

| Ruta | HTTP | Resultado |
| --- | --- | --- |
| `/billing/checkout/starter` | 200 | Render seguro, `Stripe checkout not configured` |
| `/billing/checkout/professional` | 200 | Render seguro, `Stripe checkout not configured` |
| `/billing/checkout/msp` | 200 | Render seguro, `Stripe checkout not configured` |

Markers observados en las tres rutas:

- `Stripe checkout not configured`
- `No checkout session, payment, order, webhook or entitlement is created here.`
- `Stripe is waiting for full configuration.`
- `No payment is active yet`
- `No API keys or variant IDs are required for build.`

Lemon:

- No se detecto `Lemon` en los cuerpos de las rutas checkout.

## Checkout start POST smoke

Se ejecuto POST local a las rutas `/start` sin Stripe env. Resultado esperado: redirect seguro a error `not_configured`, sin crear Stripe session.

| Ruta | Resultado |
| --- | --- |
| `/billing/checkout/starter/start` | `303` a `/billing/checkout/starter?error=not_configured` |
| `/billing/checkout/professional/start` | `303` a `/billing/checkout/professional?error=not_configured` |
| `/billing/checkout/msp/start` | `303` a `/billing/checkout/msp?error=not_configured` |

Nota:

- El redirect absoluto uso dominio publico por la normalizacion de origen configurada, pero no hubo Stripe env, no hubo API call exitosa, no hubo checkout session y no hubo pago.

## Manual invoice / bank transfer separation

| Ruta | HTTP | Resultado |
| --- | --- | --- |
| `/billing/bank-transfer/starter` | 200 | Manual invoice render seguro |
| `/billing/bank-transfer/professional` | 200 | Manual invoice render seguro |
| `/billing/bank-transfer/msp` | 200 | Manual invoice render seguro |

Markers observados:

- `Request a manual invoice`
- `Wise is used only as a manual bank transfer reference`
- `No financial automation or access grant is triggered.`
- `manual invoice request only`

Resultado:

- Manual invoice/bank transfer sigue separado de Stripe.
- Wise no se ejecuta como transferencia automatica.
- No se crea payment ni access grant por render.

## Pricing route

- `/pricing`: `200`
- No se modificaron precios.

## Admin status observation

No hubo browser/admin session disponible para validar visualmente `/dashboard/admin/billing`.

Validacion sin sesion:

| Ruta | Resultado |
| --- | --- |
| `/dashboard/admin/billing` | `307` a `/sign-in` |
| `/dashboard/admin` | `307` a `/sign-in` |
| `/dashboard` | `307` a `/sign-in` |

Resultado:

- Admin no queda publico sin sesion.
- Visual admin billing sigue pendiente para un hito autenticado.

## Stripe API test-mode validation

No ejecutada.

Motivo:

- No habia `STRIPE_SECRET_KEY` test-mode configurada en el entorno actual.
- No habia `STRIPE_STARTER_PRICE_ID`, `STRIPE_PROFESSIONAL_PRICE_ID` ni `STRIPE_MSP_PRICE_ID`.

Por seguridad:

- No se llamo a Stripe API.
- No se creo Checkout Session.
- No se genero URL de checkout.
- No se uso tarjeta.
- No se completo pago.
- No se expiro ninguna session porque no se creo ninguna.

## DB / billing state safety

No se valido DB state porque el hito se ejecuto sin DB local/test segura conectada para billing state.

No se forzo conexion DB.

Acciones no ejecutadas:

- No `BillingPayment paid`.
- No `BillingOrder paid`.
- No `AssessmentEntitlement`.
- No `BillingEntitlementGrant`.
- No fulfillment.
- No revoke.

## Safety search

Busqueda focalizada en billing/admin/pricing/demo/public checkout surfaces:

- Lemon: no aparece como UI activa en las rutas checkout/manual invoice revisadas.
- Stripe live: aparece bloqueado por aprobacion explicita y por modo/env.
- Wise: aparece como referencia manual de bank transfer, no automatizacion.
- Manual invoice: presente y separado.
- Auto-grant: las rutas aclaran que no hay entitlement automatico.
- Claims peligrosos:
  - `zero downtime` aparece como negacion: "does not guarantee zero downtime".
  - `guaranteed savings` aparece como negacion/limitacion en demo/report.
  - No se detecto promesa activa de automatic migration, guaranteed migration o no risk en las superficies focalizadas.
- Secrets: no se imprimieron valores.

## Que NO se ejecuto

- No Stripe live.
- No tarjetas reales.
- No pagos reales.
- No checkout live.
- No live Price IDs.
- No live webhook.
- No env vars productivas.
- No Hostinger.
- No Vercel.
- No deploy.
- No DB destructiva.
- No migrations.
- No `db push`.
- No Prisma schema changes.
- No Wise transfers.
- No fulfillment real.
- No grants reales.
- No pricing real changes.
- No force push.
- No stashes aplicados.
- No secrets impresos.

## Resultado por plan

| Plan | Price ID validado por Stripe API | Route smoke | Resultado |
| --- | --- | --- | --- |
| Starter Readiness | no, env missing | OK | Safe `not_configured` |
| Professional Assessment | no, env missing | OK | Safe `not_configured` |
| MSP Partner | no, env missing | OK | Safe `not_configured` |
| Migration Blueprint | no aplica | invoice/manual | Manual/invoice-only |

## Decision

Estado del hito: parcial.

La aplicacion degrada de forma segura cuando Stripe test-mode no esta configurado. Las rutas checkout y manual invoice cargan, separan Stripe/Wise correctamente y no crean pagos ni grants. La validacion real de Price IDs test-mode queda bloqueada hasta que existan credenciales Stripe test-mode y Price IDs test en un entorno seguro.

## Riesgos restantes

- Validar Price IDs test-mode reales con una Stripe secret key de test cargada de forma segura.
- Validar admin billing visual autenticado.
- Validar PDF autenticado real/sintetico.
- Mantener Stripe live bloqueado hasta aprobacion explicita.

## Proximo hito recomendado

- `STRIPE-TESTMODE-PRICE-SMOKE-PUSH` para pushear esta documentacion.
- Luego, si se cargan credenciales test seguras, reintentar Price ID lookup test-mode sin crear pagos.

