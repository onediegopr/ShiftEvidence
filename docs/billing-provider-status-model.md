# Billing Provider Status Model

Status: admin status reference for billing providers.

## Stripe Fields

The admin billing console reports:

- Secret key present or absent.
- Webhook secret present or absent.
- Starter Price ID present or absent.
- Professional Price ID present or absent.
- MSP Price ID present or absent.
- Secret key mode: test, live, restricted live, or unknown.
- Checkout mode: test, live, or unknown.
- Live approved: yes or no.
- Checkout enabled: yes or no.
- Checkout active: yes or no.
- Recommended action.
- Risk level.

## Stripe Statuses

- `no_configurado`: one or more required checkout values are missing.
- `configuracion_invalida`: checkout mode has an unsupported value.
- `configurado_test`: checkout is configured for test-mode.
- `configurado_live_no_aprobado`: live was detected but is blocked by policy or key mismatch.
- `configurado_live_aprobado`: live mode is configured and explicitly approved.
- `desactivado`: checkout is disabled by runtime configuration.

## Wise Fields

Wise status stays manual:

- Token present or absent.
- API URL mode if configured.
- Profile ID present or absent.
- Current use: manual invoice and bank transfer reference.
- Automation: disabled.
- Invoice request flow: enabled.
- Pending invoice request count.
- Recommended action.
- Risk level.

## Operational Boundary

Provider status is read-only visibility. It does not create payments, perform transfers, grant access, or modify assessment entitlements.
