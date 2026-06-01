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
      ["msp_partner", "From USD 399/month"],
    ]);
  });

  it("uses Stripe as the primary configurable card checkout provider", () => {
    expect(marketingPlans.every((plan) => plan.futureProvider === "stripe")).toBe(true);
    expect(paymentOptionsCopy.cardCheckout).toContain("Stripe");
    expect(paymentOptionsCopy.notActive).toContain("manual follow-up");
  });

  it("keeps Lemon legacy out of public payment labels", () => {
    expect(marketingPlans.every((plan) => plan.disabledProvider === "lemon_squeezy_legacy")).toBe(true);
    expect(marketingPlans.flatMap((plan) => plan.paymentOptions).map(getPaymentOptionLabel)).not.toContain("Stripe");
    expect(JSON.stringify(marketingPlans)).not.toContain("Lemon Squeezy");
  });

  it("shows bank transfer invoices without exposing Wise as a public payment label", () => {
    expect(getPaymentOptionLabel("bank_transfer_invoice")).toBe("Bank transfer invoice");
    expect(paymentOptionsCopy.bankTransfer).toBe("Bank transfer invoices are available for business customers.");
    expect(JSON.stringify(marketingPlans).toLowerCase()).not.toContain("wise");
  });
});
