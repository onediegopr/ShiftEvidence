import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Billing 4 Stripe migration boundary", () => {
  it("uses Stripe from the public checkout start route", () => {
    const source = readFileSync("src/app/billing/checkout/[plan]/start/route.ts", "utf8");

    expect(source).toContain("createStripeCheckoutSession");
  });

  it("keeps Stripe webhook fulfillment boundary manual", () => {
    const source = readFileSync("src/server/billing/webhooks/stripeWebhookPersistence.ts", "utf8");
    const businessLedger = readFileSync("src/server/billing/ledger/stripeBusinessLedgerService.ts", "utf8");
    const combined = `${source}\n${businessLedger}`;

    expect(source).toContain("billingEvent.create");
    expect(source).toContain("processStripeBillingEvent");
    expect(combined).not.toContain("billingEntitlementGrant.create");
    expect(combined).not.toContain("grantAssessmentEntitlement");
    expect(combined).not.toContain("revokeAssessmentEntitlement");
  });

  it("keeps the retired card provider out of active billing surfaces", () => {
    const retiredProvider = ["lem", "on"].join("");
    const activeSources = [
      "src/config/billing.ts",
      "src/lib/pricingPlans.ts",
      "src/server/billing/billingConfiguration.ts",
      "src/server/billing/stripeCheckout.ts",
      "src/server/billing/admin/billingProviderStatusService.ts",
      "src/app/billing/checkout/[plan]/page.tsx",
      "src/app/billing/checkout/[plan]/start/route.ts",
      "src/app/dashboard/admin/billing/page.tsx",
    ]
      .map((path) => readFileSync(path, "utf8"))
      .join("\n")
      .toLowerCase();

    expect(activeSources).not.toContain(retiredProvider);
    expect(activeSources).not.toContain(["squ", "eeze"].join(""));
  });
});
