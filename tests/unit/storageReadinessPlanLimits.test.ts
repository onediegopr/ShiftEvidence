import { describe, expect, it } from "vitest";
import {
  getStorageReadinessPlanLimits,
  resolveStorageReadinessPlanLimits,
} from "../../src/server/assessments/storageReadinessPlanLimits";

describe("storage readiness plan limits", () => {
  it("uses conservative starter limits", () => {
    const limits = getStorageReadinessPlanLimits("starter");

    expect(limits.maxStorageContextWords).toBe(1_500);
    expect(limits.maxStorageEvidenceFiles).toBe(1);
    expect(limits.cephDeepDiveEnabled).toBe(false);
    expect(limits.aiStorageAnalysisEnabled).toBe(false);
  });

  it("expands limits for Blueprint without enabling AI in STORAGE-1", () => {
    const limits = getStorageReadinessPlanLimits("blueprint");

    expect(limits.maxStorageContextWords).toBe(40_000);
    expect(limits.maxStorageEvidenceFiles).toBe(15);
    expect(limits.cephDeepDiveEnabled).toBe(true);
    expect(limits.aiStorageAnalysisEnabled).toBe(false);
  });

  it("normalizes workspace and entitlement aliases", () => {
    expect(
      resolveStorageReadinessPlanLimits({
        assessmentPlanLevel: "readiness_report_pro",
      }).planKey,
    ).toBe("pro");
    expect(
      resolveStorageReadinessPlanLimits({
        workspacePlan: "custom_blueprint",
      }).planKey,
    ).toBe("blueprint");
    expect(
      resolveStorageReadinessPlanLimits({
        userEntitlementPlanKey: "msp_partner",
      }).planKey,
    ).toBe("partner");
  });
});
