import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Billing 4 Stripe migration boundary", () => {
  it("does not call Lemon from the public checkout start route", () => {
    const source = readFileSync("src/app/billing/checkout/[plan]/start/route.ts", "utf8");

    expect(source).toContain("createStripeCheckoutSession");
    expect(source).not.toContain("createLemonSqueezyCheckout");
  });

  it("keeps Stripe webhook persistence limited to BillingEvent", () => {
    const source = readFileSync("src/server/billing/webhooks/stripeWebhookPersistence.ts", "utf8");

    expect(source).toContain("billingEvent.create");
    expect(source).not.toContain("billingOrder");
    expect(source).not.toContain("billingPayment");
    expect(source).not.toContain("billingSubscription");
    expect(source).not.toContain("billingEntitlementGrant");
  });
});
