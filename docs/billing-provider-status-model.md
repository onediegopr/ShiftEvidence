# BILLING-3 - Provider Status Model

Date: 2026-05-31

Status: specification only. Not implemented.

## 1. Goal

Define a safe provider status model for admin billing visibility across Lemon
Squeezy, Wise and Stripe without exposing secret values.

## 2. Provider Status Shape

Recommended TypeScript shape:

```ts
type BillingProviderStatus = {
  id: "lemon_squeezy" | "wise" | "stripe";
  label: string;
  status: "not_configured" | "configured_test" | "configured_live" | "manual" | "disabled" | "error";
  connected: boolean;
  mode: "test" | "live" | "sandbox" | "manual" | "disabled" | "unknown";
  checkoutEnabled: boolean;
  automationEnabled: boolean;
  requiredEnv: BillingProviderEnvStatus[];
  lastVerifiedAt: string | null;
  lastSmokeStatus: "ok" | "failed" | "not_run" | "manual";
  risks: string[];
  recommendedAction: string;
};

type BillingProviderEnvStatus = {
  name: string;
  required: boolean;
  configured: boolean;
  secret: boolean;
};
```

Admin should display only `configured`, never values.

## 3. Lemon Squeezy Status Logic

Required env vars:

- `LEMON_SQUEEZY_STORE_ID`;
- `LEMON_SQUEEZY_API_KEY` or `LEMONSQUEEZY_API_KEY`;
- `LEMON_STARTER_VARIANT_ID`;
- `LEMON_PROFESSIONAL_VARIANT_ID`;
- `LEMON_MSP_VARIANT_ID`;
- `LEMON_SQUEEZY_CHECKOUT_MODE`;
- future: `LEMON_SQUEEZY_WEBHOOK_SECRET`.

Status rules:

- `not_configured`: store/API key/required variants missing.
- `configured_test`: required checkout env present and mode is not `live`.
- `configured_live`: required checkout env present and mode is `live`.
- `disabled`: checkout explicitly disabled.
- `error`: last smoke/API verification failed.

Connected:

- true if read-only API verification succeeds or the latest smoke confirms
  checkout creation.

Mode:

- `test` unless `LEMON_SQUEEZY_CHECKOUT_MODE=live`;
- never infer live from product existence.

Risks:

- live without webhooks;
- variants missing;
- webhook secret missing;
- failed smoke;
- manual fulfillment still active.

## 4. Wise Status Logic

Required/future env vars:

- `WISE_API_TOKEN`;
- `WISE_API_URL`;
- future `WISE_PROFILE_ID`.

Status rules:

- `manual`: no API token, bank transfer invoices handled manually.
- `not_configured`: Wise automation expected but token/profile missing.
- `configured_test`: sandbox token/API URL configured.
- `configured_live`: production token/API URL configured.
- `disabled`: automation explicitly disabled.
- `error`: read-only verification failed.

Mode:

- `sandbox` when API URL points to sandbox;
- `live` only for production API URL;
- `manual` if no automation.

Current recommendation:

- keep Wise manual until Lemon ledger is complete.

## 5. Stripe Status Logic

Status:

- `disabled`.

Required env:

- none for current product.

Admin display:

- `Stripe diferido/desactivado`;
- `No visible como metodo activo`;
- `No configurar todavia`.

## 6. Billing Operations Status

Recommended operation state:

```ts
type BillingOperationsStatus = {
  checkoutTestMode: "ok" | "failed" | "not_run";
  livePayments: "on" | "off";
  manualFulfillment: "on" | "off";
  webhooks: "on" | "off";
  ledger: "on" | "off";
  automaticEntitlements: "on" | "off";
  reconciliation: "manual" | "automated" | "off";
};
```

Current expected values:

- checkoutTestMode: `ok`;
- livePayments: `off`;
- manualFulfillment: `on`;
- webhooks: `off`;
- ledger: `off`;
- automaticEntitlements: `off`;
- reconciliation: `manual`.

## 7. Safe Verification Levels

Verification levels:

1. `env_presence`: required names present.
2. `api_read`: provider read-only call succeeds.
3. `checkout_smoke`: test checkout can be created.
4. `webhook_smoke`: signed test webhook persists event.
5. `ledger_reconcile`: order/payment/subscription rows match provider.

Provider status should show the strongest passed level and timestamp.

## 8. Admin Copy in Spanish

Example copy:

- `Configurado en modo test. Fulfillment manual activo. No activar live hasta BILLING-3G.`
- `API presente, pero webhook no configurado. Las compras no otorgan acceso automatico.`
- `Wise se mantiene como factura manual. No hay automatizacion bancaria.`
- `Stripe esta diferido y no debe mostrarse como metodo activo.`

