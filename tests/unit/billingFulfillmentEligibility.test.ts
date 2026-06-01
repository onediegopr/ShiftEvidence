import { describe, expect, it } from "vitest";
import {
  buildBillingFulfillmentPreview,
  getBillingPlanEntitlementKeys,
} from "../../src/server/billing/admin/billingManualFulfillmentService";

const matchedPaidOrder = {
  id: "order_1",
  planId: "starter_readiness",
  status: "paid" as const,
  userId: "user_1",
  workspaceId: "workspace_1",
  assessmentId: "assessment_1",
  refundedAt: null,
  cancelledAt: null,
};

describe("billing fulfillment eligibility", () => {
  it("maps Starter and Professional plans to supported entitlement keys", () => {
    expect(getBillingPlanEntitlementKeys("starter_readiness")).toEqual(["full_report_unlocked"]);
    expect(getBillingPlanEntitlementKeys("professional_assessment")).toEqual([
      "full_report_unlocked",
      "pro_matrix_unlocked",
    ]);
  });

  it("marks a paid matched Starter order as eligible", () => {
    const preview = buildBillingFulfillmentPreview({
      order: matchedPaidOrder,
    });

    expect(preview.eligible).toBe(true);
    expect(preview.status).toBe("eligible");
    expect(preview.entitlementKeys).toEqual(["full_report_unlocked"]);
  });

  it("rejects pending, refunded and cancelled orders", () => {
    expect(buildBillingFulfillmentPreview({
      order: { ...matchedPaidOrder, status: "pending" },
    }).eligible).toBe(false);
    expect(buildBillingFulfillmentPreview({
      order: { ...matchedPaidOrder, status: "refunded" },
    }).eligible).toBe(false);
    expect(buildBillingFulfillmentPreview({
      order: { ...matchedPaidOrder, status: "cancelled" },
    }).eligible).toBe(false);
  });

  it("rejects MSP, Migration Blueprint and unknown plans", () => {
    expect(buildBillingFulfillmentPreview({
      order: { ...matchedPaidOrder, planId: "msp_partner" },
    }).eligible).toBe(false);
    expect(buildBillingFulfillmentPreview({
      order: { ...matchedPaidOrder, planId: "migration_blueprint" },
    }).eligible).toBe(false);
    expect(buildBillingFulfillmentPreview({
      order: { ...matchedPaidOrder, planId: "unknown_plan" },
    }).eligible).toBe(false);
  });

  it("rejects orders without complete match", () => {
    const preview = buildBillingFulfillmentPreview({
      order: { ...matchedPaidOrder, assessmentId: null },
    });

    expect(preview.eligible).toBe(false);
    expect(preview.reasons.join(" ")).toContain("match completo");
  });

  it("reports already granted when all expected billing grants exist", () => {
    const preview = buildBillingFulfillmentPreview({
      order: matchedPaidOrder,
      existingGrantKeys: ["full_report_unlocked"],
    });

    expect(preview.status).toBe("already_granted");
    expect(preview.eligible).toBe(false);
  });
});
