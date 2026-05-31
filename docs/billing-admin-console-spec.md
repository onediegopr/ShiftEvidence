# BILLING-3 - Admin Billing Console Spec

Date: 2026-05-31

Status: specification only. Not implemented.

## 1. Goal

Create an internal Spanish admin billing console that shows provider readiness,
checkout state, manual fulfillment state, webhook readiness, ledger health and
recommended operator actions without exposing secrets.

Recommended route:

- `/dashboard/admin/billing`

Alternative:

- integrate a compact provider status section into existing `/dashboard/admin`
  and link to `/dashboard/admin/billing` for details.

## 2. Language and Visibility

All user-facing admin labels should be Spanish.

Allowed values:

- `Presente`;
- `Ausente`;
- `Configurado`;
- `No configurado`;
- `Modo test`;
- `Modo live`;
- `Manual`;
- `Desactivado`;
- `Requiere revision`.

Never show:

- API key values;
- bearer tokens;
- webhook secrets;
- raw webhook payloads;
- full payment method details;
- full billing address dumps.

## 3. Page Header

Title:

- `Billing y proveedores`

Subtitle:

- `Estado operativo de checkout, proveedores, fulfillment manual, webhooks, ledger y entitlements.`

Global badges:

- `Checkout test-mode: OK/NO`;
- `Live payments: ON/OFF`;
- `Manual fulfillment: ON/OFF`;
- `Webhooks: ON/OFF`;
- `Ledger: ON/OFF`;
- `Entitlements automaticos: ON/OFF`;
- `Reconciliation: ON/OFF`.

## 4. Lemon Squeezy Card

Card title:

- `Lemon Squeezy`

Status values:

- `No configurado`;
- `Configurado test`;
- `Configurado live`;
- `Error`;
- `Desactivado`.

Fields:

| Label | Display |
| --- | --- |
| Store ID | Presente/Ausente |
| API key | Presente/Ausente |
| Starter Variant ID | Presente/Ausente |
| Professional Variant ID | Presente/Ausente |
| MSP Variant ID | Presente/Ausente |
| Checkout mode | Test/Live |
| Checkout enabled | Si/No |
| Webhook secret | Presente/Ausente |
| Store/product/variants | Verificado/No verificado |
| Ultimo smoke | Fecha + OK/NO |
| Accion recomendada | Texto corto |

Recommended actions:

- if test configured and no webhooks: `Mantener fulfillment manual. No activar live.`;
- if live configured without webhooks: `Riesgo alto: volver a test o activar runbook manual estricto.`;
- if variants missing: `Configurar variant IDs antes de checkout.`;
- if webhook missing: `Implementar BILLING-3B antes de automatizar acceso.`;
- if API key missing: `Configurar API key server-side sin exponer valor.`

## 5. Wise Card

Card title:

- `Wise`

Status values:

- `Factura manual`;
- `API no configurada`;
- `API sandbox configurada`;
- `API produccion configurada`;
- `Error`.

Fields:

| Label | Display |
| --- | --- |
| Token | Presente/Ausente |
| API URL | Sandbox/Produccion/No configurada |
| Profile ID | Presente/Ausente |
| Uso actual | Transferencia bancaria manual |
| Automatizacion | Desactivada |
| Ultima verificacion | Fecha/No verificada |
| Riesgos | Texto corto |

Recommended copy:

- `Wise se usa como soporte operativo para facturas y transferencias manuales. No existe automatizacion de cobro ni conciliacion.`

## 6. Stripe Card

Card title:

- `Stripe`

Status:

- `Diferido / desactivado`

Fields:

- `Visible publicamente: No`;
- `Checkout activo: No`;
- `Motivo: proveedor opcional futuro`;
- `Accion recomendada: no configurar todavia`.

## 7. Billing Operations Card

Fields:

| Area | Current value before BILLING-3 |
| --- | --- |
| Checkout test-mode | OK |
| Live payments | OFF |
| Manual fulfillment | ON |
| Webhooks | OFF |
| Ledger | OFF |
| Entitlements automaticos | OFF |
| Reconciliation | Manual |
| Ultimas ordenes | Futuro |
| Ordenes sin match | Futuro |
| Eventos fallidos | Futuro |

Actions:

- `Abrir runbook manual`;
- `Abrir solicitudes de desbloqueo`;
- `Abrir especificacion BILLING-3`;
- `Revisar Lemon dashboard` (external/manual link if safe).

## 8. Ledger Preview Section

Before implementation:

- show disabled/future state:
  - `Ledger no implementado`;
  - `Las ordenes viven en Lemon hasta BILLING-3`;
  - `Usar runbook manual`.

After implementation:

- table columns:
  - Fecha;
  - Provider;
  - Evento;
  - Cliente;
  - Plan;
  - Monto;
  - Estado;
  - Match;
  - Entitlement;
  - Accion.

## 9. Failed Events Section

Before implementation:

- disabled state.

After implementation:

- event id;
- provider event id;
- event type;
- processing status;
- retry count;
- safe error;
- action: retry/mark reviewed.

## 10. Permission Model

Access:

- admin only via existing `requireAdminSession`;
- no public access;
- no customer self-service.

Future roles:

- `owner`;
- `billing_admin`;
- `support_readonly`.

Initial implementation can use current admin gate.

## 11. Data Sources

Initial safe data sources:

- `getBillingAdminStatus`;
- env presence checks;
- billing config;
- manual static provider definitions;
- future ledger tables.

No admin UI should read provider secrets directly.

