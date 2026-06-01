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
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_STARTER_PRICE_ID",
  "STRIPE_PROFESSIONAL_PRICE_ID",
  "STRIPE_MSP_PRICE_ID",
  "STRIPE_CHECKOUT_MODE",
  "STRIPE_CHECKOUT_ENABLED",
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
  it("marks Stripe as configured test-mode when checkout env is complete", () => {
    resetTrackedEnv();
    process.env.STRIPE_SECRET_KEY = "sk_test_example";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_example";
    process.env.STRIPE_STARTER_PRICE_ID = "price_starter";
    process.env.STRIPE_PROFESSIONAL_PRICE_ID = "price_professional";
    process.env.STRIPE_MSP_PRICE_ID = "price_msp";
    process.env.STRIPE_CHECKOUT_MODE = "test";

    const status = getBillingProviderStatusSnapshot();

    expect(status.stripe).toMatchObject({
      status: "configurado_test",
      secretKeyPresent: true,
      webhookSecretPresent: true,
      starterPricePresent: true,
      professionalPricePresent: true,
      mspPricePresent: true,
      checkoutMode: "test",
      checkoutEnabled: true,
      checkoutActive: true,
      riskLevel: "bajo",
    });
    expect(status.operations.checkoutTestMode).toBe(true);
    expect(status.operations.livePayments).toBe(false);
    expect(JSON.stringify(status)).not.toContain("sk_test_example");
  });

  it("marks Stripe as not configured without secret key", () => {
    resetTrackedEnv();
    process.env.STRIPE_STARTER_PRICE_ID = "price_starter";
    process.env.STRIPE_PROFESSIONAL_PRICE_ID = "price_professional";
    process.env.STRIPE_MSP_PRICE_ID = "price_msp";

    const status = getBillingProviderStatusSnapshot();

    expect(status.stripe.status).toBe("no_configurado");
    expect(status.stripe.secretKeyPresent).toBe(false);
    expect(status.operations.checkoutTestMode).toBe(false);
  });

  it("flags Stripe live mode as not approved without activating live payments", () => {
    resetTrackedEnv();
    process.env.STRIPE_SECRET_KEY = "sk_live_example";
    process.env.STRIPE_STARTER_PRICE_ID = "price_starter";
    process.env.STRIPE_PROFESSIONAL_PRICE_ID = "price_professional";
    process.env.STRIPE_MSP_PRICE_ID = "price_msp";
    process.env.STRIPE_CHECKOUT_MODE = "live";

    const status = getBillingProviderStatusSnapshot();

    expect(status.stripe.status).toBe("configurado_live_no_aprobado");
    expect(status.stripe.riskLevel).toBe("alto");
    expect(status.operations.checkoutTestMode).toBe(false);
    expect(status.operations.livePayments).toBe(false);
  });

  it("keeps Wise manual by default and Lemon legacy disabled", () => {
    resetTrackedEnv();

    const status = getBillingProviderStatusSnapshot();

    expect(status.wise).toMatchObject({
      status: "factura_manual",
      tokenPresent: false,
      apiUrlMode: "not_configured",
      automationEnabled: false,
      currentUse: "Transferencia bancaria manual / invoice",
    });
    expect(status.lemon).toMatchObject({
      status: "legado_desactivado",
      checkoutEnabled: false,
    });
    expect(status.stripe.publiclyVisible).toBe(true);
  });
});
