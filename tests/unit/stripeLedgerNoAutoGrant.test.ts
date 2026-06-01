import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Stripe ledger no auto-grant boundary", () => {
  it("keeps Stripe webhook persistence and business ledger away from entitlement writes", () => {
    const persistence = readFileSync("src/server/billing/webhooks/stripeWebhookPersistence.ts", "utf8");
    const businessLedger = readFileSync("src/server/billing/ledger/stripeBusinessLedgerService.ts", "utf8");
    const route = readFileSync("src/app/api/webhooks/stripe/route.ts", "utf8");
    const combined = [persistence, businessLedger, route].join("\n");

    expect(combined).not.toContain("grantAssessmentEntitlement");
    expect(combined).not.toContain("revokeAssessmentEntitlement");
    expect(combined).not.toContain("fulfillBillingOrderManually");
    expect(combined).not.toContain("billingEntitlementGrant.create");
    expect(combined).not.toContain("billingEntitlementGrant.upsert");
    expect(combined).not.toContain("assessmentEntitlement.create");
    expect(combined).not.toContain("assessmentEntitlement.update");
    expect(combined).not.toContain("assessmentEntitlement.upsert");
  });

  it("keeps manual fulfillment as the only approved AssessmentEntitlement writer in billing admin flow", () => {
    const manualFulfillment = readFileSync("src/server/billing/admin/billingManualFulfillmentService.ts", "utf8");
    const manualMatch = readFileSync("src/server/billing/admin/billingManualMatchService.ts", "utf8");

    expect(manualFulfillment).toContain("grantAssessmentEntitlement");
    expect(manualMatch).not.toContain("grantAssessmentEntitlement");
    expect(manualMatch).not.toContain("fulfillBillingOrderManually");
  });
});
