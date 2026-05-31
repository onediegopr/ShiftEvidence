import { afterEach, describe, expect, it } from "vitest";
import {
  billingEnvPlaceholders,
  billingPlans,
  getBillingPlanByCheckoutSlug,
} from "../../src/config/billing";
import {
  getBillingAdminStatus,
  getBillingCheckoutRouteState,
} from "../../src/server/billing/billingConfiguration";

const trackedEnvNames = [...billingEnvPlaceholders, "LEMON_SQUEEZY_CHECKOUT_ENABLED"] as const;

const originalEnv = Object.fromEntries(trackedEnvNames.map((name) => [name, process.env[name]]));

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

describe("billing checkout architecture", () => {
  it("centralizes checkout eligibility and invoice eligibility by plan", () => {
    expect(
      billingPlans.map((plan) => ({
        id: plan.id,
        checkoutEligible: plan.checkoutEligible,
        invoiceEligible: plan.invoiceEligible,
        checkoutSlug: plan.checkoutSlug,
      })),
    ).toEqual([
      {
        id: "starter_readiness",
        checkoutEligible: true,
        invoiceEligible: true,
        checkoutSlug: "starter",
      },
      {
        id: "professional_assessment",
        checkoutEligible: true,
        invoiceEligible: true,
        checkoutSlug: "professional",
      },
      {
        id: "migration_blueprint",
        checkoutEligible: false,
        invoiceEligible: true,
        checkoutSlug: null,
      },
      {
        id: "msp_partner",
        checkoutEligible: true,
        invoiceEligible: true,
        checkoutSlug: "msp",
      },
    ]);
  });

  it("routes checkout plans to safe internal placeholders", () => {
    expect(getBillingPlanByCheckoutSlug("starter")?.primaryAction.href).toBe("/billing/checkout/starter");
    expect(getBillingPlanByCheckoutSlug("professional")?.primaryAction.href).toBe("/billing/checkout/professional");
    expect(getBillingPlanByCheckoutSlug("msp")?.primaryAction.href).toBe("/billing/checkout/msp");
  });

  it("does not require Lemon Squeezy env vars for checkout route state", () => {
    billingEnvPlaceholders.forEach((name) => {
      delete process.env[name];
    });

    const state = getBillingCheckoutRouteState("starter");

    expect(state.plan?.id).toBe("starter_readiness");
    expect(state.status).toBe("not_configured");
    expect("lemon" in state ? state.lemon.checkoutActive : true).toBe(false);
  });

  it("marks checkout as ready when Lemon Squeezy env vars are configured", () => {
    process.env.LEMON_SQUEEZY_STORE_ID = "393386";
    process.env.LEMONSQUEEZY_API_KEY = "test-key";
    process.env.LEMON_STARTER_VARIANT_ID = "123";

    const state = getBillingCheckoutRouteState("starter");

    expect(state.status).toBe("configured");
    expect("lemon" in state ? state.lemon.checkoutActive : false).toBe(true);
    expect("lemon" in state ? state.lemon.env.apiKeyConfigured : false).toBe(true);
  });

  it("allows checkout to be disabled explicitly without removing credentials", () => {
    process.env.LEMON_SQUEEZY_STORE_ID = "393386";
    process.env.LEMON_SQUEEZY_API_KEY = "test-key";
    process.env.LEMON_STARTER_VARIANT_ID = "123";
    process.env.LEMON_SQUEEZY_CHECKOUT_ENABLED = "false";

    const state = getBillingCheckoutRouteState("starter");

    expect(state.status).toBe("configured_but_disabled");
    expect("lemon" in state ? state.lemon.checkoutActive : true).toBe(false);
  });

  it("keeps provider visibility safe for admin surfaces", () => {
    const status = getBillingAdminStatus();

    expect(status.providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "lemon_squeezy",
          label: "Lemon Squeezy",
        }),
        expect.objectContaining({
          id: "bank_transfer",
          label: "Bank transfer invoice",
        }),
        expect.objectContaining({
          id: "stripe_disabled",
          status: "Disabled",
        }),
      ]),
    );
    expect(status.envPlaceholders.map((item) => item.name)).toEqual([...billingEnvPlaceholders]);
  });
});
