import { describe, expect, it } from "vitest";
import {
  buildSeniorAdvisorUsageState,
  getSeniorAdvisorPlanLimits,
  resolveSeniorAdvisorPlanLimits,
} from "../../src/server/advisor/seniorAdvisorPlanLimits";

describe("senior advisor plan limits", () => {
  it("disables Senior Migration Advisor for starter/free plans", () => {
    const limits = getSeniorAdvisorPlanLimits("starter");

    expect(limits.enabled).toBe(false);
    expect(limits.messageLimit).toBe(0);
    expect(limits.requestMoreCreditsEnabled).toBe(false);
  });

  it("applies professional and blueprint message caps", () => {
    expect(getSeniorAdvisorPlanLimits("readiness_report").messageLimit).toBe(25);
    expect(getSeniorAdvisorPlanLimits("blueprint").messageLimit).toBe(150);
  });

  it("normalizes entitlement, assessment and workspace aliases", () => {
    expect(resolveSeniorAdvisorPlanLimits({ userEntitlementPlanKey: "professional" }).planKey).toBe("pro");
    expect(resolveSeniorAdvisorPlanLimits({ assessmentPlanLevel: "readiness_report" }).planKey).toBe("readiness_report");
    expect(resolveSeniorAdvisorPlanLimits({ workspacePlan: "custom_blueprint" }).planKey).toBe("blueprint");
    expect(resolveSeniorAdvisorPlanLimits({ userEntitlementPlanKey: "msp_partner" }).planKey).toBe("partner");
  });

  it("marks usage exhausted when the assessment cap is reached", () => {
    const limits = getSeniorAdvisorPlanLimits("readiness_report");
    const usage = buildSeniorAdvisorUsageState({ limits, messagesUsed: limits.messageLimit });

    expect(usage.exhausted).toBe(true);
    expect(usage.messagesRemaining).toBe(0);
    expect(usage.warningReached).toBe(true);
  });
});
