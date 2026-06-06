import { describe, expect, it } from "vitest";
import {
  getPaymentOptionLabel,
  marketingPlans,
  paymentOptionsCopy,
} from "../../src/lib/pricingPlans";

describe("billing payment options foundation", () => {
  it("keeps the approved commercial plans and prices in one source", () => {
    expect(marketingPlans.map((plan) => [plan.id, plan.price])).toEqual([
      ["starter_readiness", "USD 490"],
      ["professional_assessment", "USD 1,500"],
      ["migration_blueprint", "From USD 3,500"],
      ["msp_partner", "From USD 799/month"],
    ]);
  });

  it("keeps Stripe as the controlled configurable card checkout provider", () => {
    expect(marketingPlans.every((plan) => plan.futureProvider === "stripe")).toBe(true);
    expect(paymentOptionsCopy.cardCheckout).toContain("controlled rollout");
    expect(paymentOptionsCopy.notActive).toContain("manual follow-up");
  });

  it("keeps card provider labels out of public payment option labels", () => {
    expect(marketingPlans.flatMap((plan) => plan.paymentOptions).map(getPaymentOptionLabel)).not.toContain("Stripe");
  });

  it("shows bank transfer invoices without exposing Wise as a public payment label", () => {
    expect(getPaymentOptionLabel("bank_transfer_invoice")).toBe("Bank transfer invoice");
    expect(paymentOptionsCopy.bankTransfer).toBe("Bank transfer invoices are the primary onboarding path for business customers.");
    expect(JSON.stringify(marketingPlans).toLowerCase()).not.toContain("wise");
  });
});

