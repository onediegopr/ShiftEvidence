# Billing Payment Options Foundation

Fecha: 2026-05-31

## 1. Que se implemento

Se implemento una base visual, textual y estructural para comunicar planes, precios y opciones de pago sin activar pagos reales.

La fuente central vive en:

```text
src/lib/pricingPlans.ts
```

El objetivo es preparar el producto para checkout futuro e invoice empresarial, manteniendo claro que el billing automatico todavia no esta activo.

## 2. Decisiones comerciales

Planes aprobados:

| Plan | Precio | Pago recomendado |
| --- | ---: | --- |
| Starter Readiness | USD 490 | Card checkout futuro, bank transfer invoice opcional |
| Professional Assessment | USD 1,500 | Card checkout o bank transfer invoice |
| Migration Blueprint | From USD 3,500 | Invoice + bank transfer despues de scope |
| MSP Partner | From USD 399/month | Card subscription futuro o invoice segun acuerdo |

## 3. Metodos de pago visibles

Metodos visibles para clientes:

- Card checkout.
- Bank transfer invoice.
- Business invoice.

Copy base:

```text
Pay by card through secure checkout. Bank transfer invoices are available for business customers.
```

## 4. Lemon Squeezy

Lemon Squeezy queda como provider futuro de card checkout.

Copy permitido:

```text
Secure card checkout will be available through Lemon Squeezy.
```

No se llamaron APIs, no se crearon checkout URLs y no se agregaron secrets.

## 5. Wise / Bank transfer

La UI publica muestra:

- Bank transfer invoice.
- Business invoice.
- Bank transfer available on request.

Wise no se muestra como marca principal ni como CTA publico.

## 6. Stripe

Stripe queda diferido.

No se integro Stripe, no se agregaron env vars, no se crearon webhooks y no se muestra como metodo de pago publico.

## 7. Que queda fuera

- Pagos reales.
- Checkout activo.
- Webhooks.
- Entitlement automatico post-pago.
- Lemon Squeezy API.
- Stripe.
- Wise como marca publica.
- Billing ledger.
- Facturacion fiscal automatizada.
- Cambios de DB o migraciones.

## 8. Superficies alineadas

- Pricing page.
- ShiftReadiness page.
- Landing FAQ y pricing preview.
- VMware to Proxmox readiness sales page.
- Support / partner routing copy.
- Dashboard upgrade/request copy.
- Admin manual entitlement source labels.
- Manual unlock amounts para Starter y Professional.

## 9. Riesgos

- Los tipos internos `readiness_report` y `readiness_report_pro` siguen existiendo por compatibilidad con reportes, entitlements y PDF.
- Los registros historicos de admin pueden conservar sources antiguos como `wise` o `stripe`.
- Los pagos reales aun requieren un hito separado de provider, webhook y fulfillment.

## 10. Proximos hitos

1. BILLING-2 Lemon Squeezy checkout design.
2. BILLING-3 webhook and entitlement fulfillment.
3. BILLING-4 invoice operating workflow.
4. BILLING-5 billing audit log / ledger.
