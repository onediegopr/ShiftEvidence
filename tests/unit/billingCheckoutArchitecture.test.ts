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

const originalEnv = Object.fromEntries(
  billingEnvPlaceholders.map((name) => [name, process.env[name]]),
);

afterEach(() => {
  billingEnvPlaceholders.forEach((name) => {
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
