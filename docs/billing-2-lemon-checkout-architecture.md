# BILLING-2 - Lemon Squeezy Checkout Architecture

Fecha: 2026-05-31

## BILLING-4 update

Lemon Squeezy checkout is decommissioned after provider rejection of the offering as services. This document remains historical architecture evidence. New checkout foundation is Stripe-first with manual invoice fallback; no new Lemon checkout sessions should be created.

## 1. Resumen

BILLING-2 prepara la arquitectura de checkout para Lemon Squeezy sin activar cobros reales.

El hito agrega configuracion central, rutas placeholder y visibilidad admin segura.

No se crean ordenes, no se llama a APIs externas, no se agregan webhooks y no se otorgan entitlements automaticos.

## 2. Arquitectura

Capas nuevas:

- `src/config/billing.ts`
- `src/server/billing/billingConfiguration.ts`
- `src/app/billing/checkout/[plan]/page.tsx`

`src/config/billing.ts` contiene configuracion publica segura:

- providers soportados;
- planes comerciales;
- precios;
- cadencia;
- eligibility de checkout;
- eligibility de invoice;
- slugs de checkout;
- nombres de env vars futuras.

`src/server/billing/billingConfiguration.ts` lee solo presencia de env vars opcionales y devuelve estados seguros. No expone secrets.

## 3. Providers

Providers modelados:

- `lemon_squeezy`: provider futuro de card checkout.
- `bank_transfer`: invoice manual / business invoice.
- `stripe_disabled`: provider diferido y no activo.

Lemon Squeezy queda preparado como `Not Configured` o `Configured, disabled`.

## 4. Planes

| Plan | Precio | Cadencia | Card checkout | Invoice |
| --- | ---: | --- | --- | --- |
| Starter Readiness | USD 490 | One-time | true | true |
| Professional Assessment | USD 1,500 | One-time | true | true |
| Migration Blueprint | From USD 3,500 | Scoped | false | true |
| MSP Partner | From USD 399/month | Monthly | true | true |

## 5. Placeholders

Env vars futuras documentadas:

- `LEMON_SQUEEZY_STORE_ID`
- `LEMON_SQUEEZY_API_KEY`
- `LEMON_STARTER_VARIANT_ID`
- `LEMON_PROFESSIONAL_VARIANT_ID`
- `LEMON_MSP_VARIANT_ID`

Todas son opcionales en este hito.

El build no depende de ellas.

## 6. Rutas

Rutas nuevas:

- `/billing/checkout/starter`
- `/billing/checkout/professional`
- `/billing/checkout/msp`

Comportamiento actual:

- muestran placeholder;
- muestran estado not configured / configured disabled;
- ofrecen invoice/support fallback;
- no llaman Lemon;
- no crean ordenes;
- no mutan DB;
- no generan entitlement.

## 7. CTA behavior

Starter:

- Primary: Pay by card.
- Secondary: Request invoice.

Professional:

- Primary: Pay by card.
- Secondary: Request invoice.

Blueprint:

- Primary: Request invoice.
- Secondary: Discuss scope.

MSP:

- Primary: Subscribe.
- Secondary: Request invoice.

Los botones de card/subscription apuntan a rutas internas placeholder, no a URLs reales.

## 8. Admin visibility

La consola admin muestra:

- Billing Provider: Lemon Squeezy (Not Configured) o Configured, disabled.
- Bank transfer invoice como flujo manual.
- Stripe como disabled.
- Env placeholders con estado configurada/no configurada, sin exponer valores.

## 9. Seguridad

- No secrets.
- No raw env values.
- No Lemon API calls.
- No checkout real.
- No webhooks.
- No DB mutation.
- No entitlement automation.
- No Hostinger.
- No deploy manual.

## 10. Integracion futura

Para activar checkout real en un hito posterior:

1. Agregar credenciales Lemon Squeezy.
2. Agregar Store ID y Variant IDs.
3. Crear servicio server-only de checkout session.
4. Agregar endpoint/action controlado para crear checkout.
5. Agregar webhook verification.
6. Mapear evento pago -> entitlement en transaccion auditada.
7. Agregar smoke productivo controlado.

## 11. Update - Lemon checkout safe wiring

Fecha: 2026-05-31

Se agrego wiring server-side para crear checkouts Lemon Squeezy cuando el runtime
tiene configuracion completa.

Archivos:

- `src/server/billing/lemonSqueezyCheckout.ts`
- `src/app/billing/checkout/[plan]/start/route.ts`
- `src/app/billing/checkout/[plan]/page.tsx`

Comportamiento:

- La UI publica sigue usando rutas internas por plan.
- Los componentes no conocen URLs Lemon ni secrets.
- El API key se lee solo en server runtime.
- Se soportan ambos nombres de API key:
  - `LEMON_SQUEEZY_API_KEY` para app/runtime.
  - `LEMONSQUEEZY_API_KEY` para compatibilidad con MCP/local tooling.
- Cada plan requiere su variant ID correspondiente:
  - `LEMON_STARTER_VARIANT_ID`
  - `LEMON_PROFESSIONAL_VARIANT_ID`
  - `LEMON_MSP_VARIANT_ID`
- Si falta store, API key o variant ID, la ruta degrada a invoice/support.
- Por defecto los checkouts se crean en `test_mode`.
- Para live checkout debe existir decision explicita y configurar
  `LEMON_SQUEEZY_CHECKOUT_MODE=live`.

Lo que NO se activo:

- No webhooks.
- No entitlement automatico.
- No DB mutation.
- No ledger.
- No fulfillment automatico.
- No deploy manual desde Codex.

Fuente tecnica usada:

- Lemon Squeezy Create Checkout API:
  `https://docs.lemonsqueezy.com/api/checkouts/create-checkout`

Riesgo operativo:

- Crear un checkout no crea una orden por si solo; redirige al usuario al
  hosted checkout. Sin webhooks/fulfillment, cualquier acceso posterior al pago
  sigue siendo manual.

## 12. Riesgos

- Los usuarios pueden ver botones Pay by card / Subscribe, pero llegan a placeholder seguro.
- Si env vars aparecen accidentalmente, el estado puede pasar a configured disabled, pero checkout sigue inactivo.
- Activar pagos reales requiere un hito separado con seguridad, webhooks y fulfillment.

## 13. Update - Redirect origin hardening

Fecha: 2026-05-31

El smoke productivo de BILLING-2.7 detecto que los fallback redirects de
`POST /billing/checkout/[plan]/start` devolvian `https://0.0.0.0:3000/...`.

Causa:

- La ruta construia el fallback con `new URL(path, request.url)`.
- En runtime Hostinger/Next, `request.url` puede reflejar el host interno del
  proceso (`0.0.0.0:3000`) y no el dominio publico.

Fix:

- Se agrego `src/server/billing/checkoutOrigin.ts`.
- El origen de checkout se resuelve con esta prioridad:
  1. `NEXT_PUBLIC_APP_URL` si existe y es un host publico permitido.
  2. `BETTER_AUTH_URL` si existe y es un host publico permitido.
  3. `x-forwarded-host` / `x-forwarded-proto` sanitizados.
  4. fallback seguro a `https://shiftevidence.com`.
- Hosts internos como `0.0.0.0`, `localhost`, `127.0.0.1`, `::` y `::1` son
  rechazados para redirects de checkout.
- Hosts no confiables tambien caen al fallback publico.

Runtime env requerida para checkout por plan:

- `LEMON_SQUEEZY_STORE_ID`
- `LEMON_SQUEEZY_API_KEY` o `LEMONSQUEEZY_API_KEY`
- `LEMON_STARTER_VARIANT_ID`
- `LEMON_PROFESSIONAL_VARIANT_ID`
- `LEMON_MSP_VARIANT_ID`

Estado produccion observado antes del fix:

- GET de las tres rutas: 200.
- POST de las tres rutas: `error=not_configured`.
- No se creo checkout externo Lemon.
- No se activaron pagos live.

Verificacion Hostinger:

- No hay `HOSTINGER_API_TOKEN` disponible localmente para lectura por API desde
  Codex.
- Por seguridad no se imprimieron ni copiaron valores de env vars.
- La respuesta `not_configured` indica que, para el runtime que atendio el POST,
  falta al menos una variable requerida por plan o el proceso todavia no tomo el
  entorno esperado.

## 14. Rollback

Revertir el commit de BILLING-2 elimina:

- config billing nueva;
- rutas placeholder;
- visibilidad admin;
- tests;
- documentacion.

No hay migraciones ni cambios de DB que revertir.
