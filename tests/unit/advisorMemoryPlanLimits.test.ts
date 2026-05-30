import { describe, expect, it } from "vitest";
import {
  getAdvisorMemoryPlanLimits,
  resolveAdvisorMemoryPlanLimits,
} from "../../src/server/advisor/advisorMemoryPlanLimits";

describe("advisor memory plan limits", () => {
  it("disables memory for starter/free plans", () => {
    const limits = getAdvisorMemoryPlanLimits("starter");

    expect(limits.enabled).toBe(false);
    expect(limits.canUseMemory).toBe(false);
    expect(limits.maxItemsPerAssessment).toBe(0);
  });

  it("enables internal QA with 50 memory items", () => {
    const limits = getAdvisorMemoryPlanLimits("internal_qa");

    expect(limits.enabled).toBe(true);
    expect(limits.maxItemsPerAssessment).toBe(50);
    expect(limits.maxOpenQuestions).toBe(20);
  });

  it("keeps professional, pro, blueprint and partner caps distinct", () => {
    expect(getAdvisorMemoryPlanLimits("readiness_report").maxItemsPerAssessment).toBe(25);
    expect(getAdvisorMemoryPlanLimits("pro").maxItemsPerAssessment).toBe(50);
    expect(getAdvisorMemoryPlanLimits("blueprint").maxItemsPerAssessment).toBe(150);
    expect(getAdvisorMemoryPlanLimits("partner").maxItemsPerAssessment).toBe(100);
  });

  it("aligns plan resolution with Senior Advisor plan aliases", () => {
    expect(resolveAdvisorMemoryPlanLimits({ userEntitlementPlanKey: "internal_qa" }).planKey).toBe("internal_qa");
    expect(resolveAdvisorMemoryPlanLimits({ assessmentPlanLevel: "professional" }).planKey).toBe("pro");
    expect(resolveAdvisorMemoryPlanLimits({ workspacePlan: "custom_blueprint" }).planKey).toBe("blueprint");
    expect(resolveAdvisorMemoryPlanLimits({ workspacePlan: "free" }).enabled).toBe(false);
  });
});
