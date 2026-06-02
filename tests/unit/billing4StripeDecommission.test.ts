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
});
