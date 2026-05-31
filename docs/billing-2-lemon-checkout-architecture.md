# BILLING-2 - Lemon Squeezy Checkout Architecture

Fecha: 2026-05-31

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

## 11. Riesgos

- Los usuarios pueden ver botones Pay by card / Subscribe, pero llegan a placeholder seguro.
- Si env vars aparecen accidentalmente, el estado puede pasar a configured disabled, pero checkout sigue inactivo.
- Activar pagos reales requiere un hito separado con seguridad, webhooks y fulfillment.

## 12. Rollback

Revertir el commit de BILLING-2 elimina:

- config billing nueva;
- rutas placeholder;
- visibilidad admin;
- tests;
- documentacion.

No hay migraciones ni cambios de DB que revertir.
