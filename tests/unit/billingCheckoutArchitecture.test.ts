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

const trackedEnvNames = [...billingEnvPlaceholders, "STRIPE_CHECKOUT_ENABLED", "STRIPE_LIVE_PAYMENTS_APPROVED"] as const;

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

  it("does not require Stripe env vars for checkout route state", () => {
    billingEnvPlaceholders.forEach((name) => {
      delete process.env[name];
    });

    const state = getBillingCheckoutRouteState("starter");

    expect(state.plan?.id).toBe("starter_readiness");
    expect(state.status).toBe("not_configured");
    expect("stripe" in state ? state.stripe.checkoutActive : true).toBe(false);
  });

  it("marks checkout as ready when Stripe test env vars are configured", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_example";
    process.env.STRIPE_STARTER_PRICE_ID = "price_starter";
    process.env.STRIPE_CHECKOUT_MODE = "test";

    const state = getBillingCheckoutRouteState("starter");

    expect(state.status).toBe("configured");
    expect("stripe" in state ? state.stripe.checkoutActive : false).toBe(true);
    expect("stripe" in state ? state.stripe.env.secretKeyConfigured : false).toBe(true);
  });

  it("allows checkout to be disabled explicitly without removing credentials", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_example";
    process.env.STRIPE_STARTER_PRICE_ID = "price_starter";
    process.env.STRIPE_CHECKOUT_ENABLED = "false";

    const state = getBillingCheckoutRouteState("starter");

    expect(state.status).toBe("configured_but_disabled");
    expect("stripe" in state ? state.stripe.checkoutActive : true).toBe(false);
  });

  it("blocks Stripe live mode until a separate go-live milestone", () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_example";
    process.env.STRIPE_STARTER_PRICE_ID = "price_starter";
    process.env.STRIPE_CHECKOUT_MODE = "live";

    const state = getBillingCheckoutRouteState("starter");

    expect(state.status).toBe("configured_live_disabled");
    expect("stripe" in state ? state.stripe.checkoutActive : true).toBe(false);
  });

  it("marks Stripe live checkout ready only with explicit live approval", () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_example";
    process.env.STRIPE_STARTER_PRICE_ID = "price_starter";
    process.env.STRIPE_CHECKOUT_MODE = "live";
    process.env.STRIPE_LIVE_PAYMENTS_APPROVED = "\"true\"";

    const state = getBillingCheckoutRouteState("starter");

    expect(state.status).toBe("configured");
    expect("stripe" in state ? state.stripe.mode : "test").toBe("live");
    expect("stripe" in state ? state.stripe.checkoutActive : false).toBe(true);
  });

  it("blocks Stripe live checkout when the secret key is still test-mode", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_example";
    process.env.STRIPE_STARTER_PRICE_ID = "price_starter";
    process.env.STRIPE_CHECKOUT_MODE = "live";
    process.env.STRIPE_LIVE_PAYMENTS_APPROVED = "\"true\"";

    const state = getBillingCheckoutRouteState("starter");

    expect(state.status).toBe("configured_live_disabled");
    expect("stripe" in state ? state.stripe.checkoutActive : true).toBe(false);
  });

  it("keeps provider visibility safe for admin surfaces", () => {
    const status = getBillingAdminStatus();

    expect(status.providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "stripe",
          label: "Stripe",
        }),
        expect.objectContaining({
          id: "bank_transfer",
          label: "Manual invoice / bank transfer",
        }),
        expect.objectContaining({
          id: "lemon_squeezy_legacy",
          status: "Rejected / legacy disabled",
        }),
      ]),
    );
    expect(status.envPlaceholders.map((item) => item.name)).toEqual([...billingEnvPlaceholders]);
  });
});
