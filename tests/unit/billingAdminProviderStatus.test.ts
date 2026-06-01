import { afterEach, describe, expect, it } from "vitest";
import { getBillingProviderStatusSnapshot } from "../../src/server/billing/admin/billingProviderStatusService";

const trackedEnvNames = [
  "LEMON_SQUEEZY_STORE_ID",
  "LEMON_SQUEEZY_API_KEY",
  "LEMONSQUEEZY_API_KEY",
  "LEMON_STARTER_VARIANT_ID",
  "LEMON_PROFESSIONAL_VARIANT_ID",
  "LEMON_MSP_VARIANT_ID",
  "LEMON_SQUEEZY_CHECKOUT_MODE",
  "LEMON_SQUEEZY_CHECKOUT_ENABLED",
  "LEMON_SQUEEZY_WEBHOOK_SECRET",
  "LEMONSQUEEZY_WEBHOOK_SECRET",
  "WISE_API_TOKEN",
  "WISE_API_URL",
  "WISE_PROFILE_ID",
] as const;

const originalEnv = Object.fromEntries(trackedEnvNames.map((name) => [name, process.env[name]]));

function resetTrackedEnv() {
  trackedEnvNames.forEach((name) => {
    delete process.env[name];
  });
}

afterEach(() => {
  trackedEnvNames.forEach((name) => {
    const value = originalEnv[name];
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  });
});

describe("billing admin provider status", () => {
  it("marks Lemon as configured test-mode when checkout env is complete", () => {
    resetTrackedEnv();
    process.env.LEMON_SQUEEZY_STORE_ID = "store";
    process.env.LEMON_SQUEEZY_API_KEY = "api-key";
    process.env.LEMONSQUEEZY_API_KEY = "alias-key";
    process.env.LEMON_STARTER_VARIANT_ID = "starter";
    process.env.LEMON_PROFESSIONAL_VARIANT_ID = "professional";
    process.env.LEMON_MSP_VARIANT_ID = "msp";
    process.env.LEMON_SQUEEZY_CHECKOUT_MODE = "test";

    const status = getBillingProviderStatusSnapshot();

    expect(status.lemon).toMatchObject({
      status: "configurado_test",
      storeIdPresent: true,
      apiKeyPresent: true,
      apiKeyAliasPresent: true,
      starterVariantPresent: true,
      professionalVariantPresent: true,
      mspVariantPresent: true,
      checkoutMode: "test",
      checkoutEnabled: true,
      riskLevel: "bajo",
    });
    expect(status.operations.checkoutTestMode).toBe(true);
    expect(status.operations.livePayments).toBe(false);
    expect(JSON.stringify(status)).not.toContain("api-key");
  });

  it("marks Lemon as not configured without API key", () => {
    resetTrackedEnv();
    process.env.LEMON_SQUEEZY_STORE_ID = "store";
    process.env.LEMON_STARTER_VARIANT_ID = "starter";
    process.env.LEMON_PROFESSIONAL_VARIANT_ID = "professional";
    process.env.LEMON_MSP_VARIANT_ID = "msp";

    const status = getBillingProviderStatusSnapshot();

    expect(status.lemon.status).toBe("no_configurado");
    expect(status.lemon.apiKeyPresent).toBe(false);
    expect(status.operations.checkoutTestMode).toBe(false);
  });

  it("flags live Lemon without webhook secret as high risk", () => {
    resetTrackedEnv();
    process.env.LEMON_SQUEEZY_STORE_ID = "store";
    process.env.LEMON_SQUEEZY_API_KEY = "api-key";
    process.env.LEMON_STARTER_VARIANT_ID = "starter";
    process.env.LEMON_PROFESSIONAL_VARIANT_ID = "professional";
    process.env.LEMON_MSP_VARIANT_ID = "msp";
    process.env.LEMON_SQUEEZY_CHECKOUT_MODE = "live";

    const status = getBillingProviderStatusSnapshot();

    expect(status.lemon.status).toBe("configurado_live");
    expect(status.lemon.webhookSecretPresent).toBe(false);
    expect(status.lemon.riskLevel).toBe("alto");
    expect(status.operations.livePayments).toBe(true);
  });

  it("keeps Wise manual by default and Stripe deferred", () => {
    resetTrackedEnv();

    const status = getBillingProviderStatusSnapshot();

    expect(status.wise).toMatchObject({
      status: "factura_manual",
      tokenPresent: false,
      apiUrlMode: "not_configured",
      automationEnabled: false,
      currentUse: "Transferencia bancaria manual / invoice",
    });
    expect(status.stripe).toMatchObject({
      status: "diferido_desactivado",
      publiclyVisible: false,
      checkoutActive: false,
    });
  });
});
