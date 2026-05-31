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

  it("uses Lemon Squeezy only as a future card checkout provider", () => {
    expect(marketingPlans.every((plan) => plan.futureProvider === "lemon_squeezy")).toBe(true);
    expect(paymentOptionsCopy.cardCheckout).toContain("will be available through Lemon Squeezy");
    expect(paymentOptionsCopy.notActive).toContain("not processed automatically yet");
  });

  it("keeps Stripe deferred and out of public payment labels", () => {
    expect(marketingPlans.every((plan) => plan.disabledProvider === "stripe_disabled")).toBe(true);
    expect(marketingPlans.flatMap((plan) => plan.paymentOptions).map(getPaymentOptionLabel)).not.toContain("Stripe");
  });

  it("shows bank transfer invoices without exposing Wise as a public payment label", () => {
    expect(getPaymentOptionLabel("bank_transfer_invoice")).toBe("Bank transfer invoice");
    expect(paymentOptionsCopy.bankTransfer).toBe("Bank transfer invoices are available for business customers.");
    expect(JSON.stringify(marketingPlans).toLowerCase()).not.toContain("wise");
  });
});
