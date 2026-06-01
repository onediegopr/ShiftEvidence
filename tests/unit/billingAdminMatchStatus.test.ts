import { describe, expect, it } from "vitest";
import {
  getBillingMatchStatusLabel,
  getBillingMatchStatusTone,
} from "../../src/server/billing/admin/billingAdminLabels";
import {
  getBillingOrderMatchStatus,
  getBillingSubscriptionMatchStatus,
} from "../../src/server/billing/admin/billingManualMatchService";

describe("billing admin match status", () => {
  it("derives order match status without persisted status fields", () => {
    expect(getBillingOrderMatchStatus({ userId: null, workspaceId: null, assessmentId: null })).toBe("unmatched");
    expect(getBillingOrderMatchStatus({ userId: "user_1", workspaceId: null, assessmentId: null })).toBe("partial");
    expect(getBillingOrderMatchStatus({ userId: "user_1", workspaceId: "workspace_1", assessmentId: "assessment_1" })).toBe("complete");
  });

  it("derives subscription match status without persisted status fields", () => {
    expect(getBillingSubscriptionMatchStatus({ userId: null, workspaceId: null })).toBe("unmatched");
    expect(getBillingSubscriptionMatchStatus({ userId: "user_1", workspaceId: null })).toBe("partial");
    expect(getBillingSubscriptionMatchStatus({ userId: "user_1", workspaceId: "workspace_1" })).toBe("complete");
  });

  it("maps match statuses to Spanish labels and tones", () => {
    expect(getBillingMatchStatusLabel("unmatched")).toBe("Sin match");
    expect(getBillingMatchStatusLabel("partial")).toBe("Match parcial");
    expect(getBillingMatchStatusLabel("complete")).toBe("Match completo");
    expect(getBillingMatchStatusLabel("needs_review")).toBe("Requiere revision");
    expect(getBillingMatchStatusTone("unmatched")).toBe("danger");
    expect(getBillingMatchStatusTone("partial")).toBe("warning");
    expect(getBillingMatchStatusTone("complete")).toBe("good");
  });
});
