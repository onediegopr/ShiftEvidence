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

  it("enables a limited internal QA entitlement without changing commercial plans", () => {
    const limits = getSeniorAdvisorPlanLimits("internal_qa");
    const usage = buildSeniorAdvisorUsageState({ limits, messagesUsed: 0 });

    expect(limits.label).toBe("Internal QA");
    expect(limits.enabled).toBe(true);
    expect(limits.messageLimit).toBe(25);
    expect(usage.enabled).toBe(true);
    expect(usage.messagesRemaining).toBe(25);
    expect(usage.exhausted).toBe(false);
  });

  it("normalizes entitlement, assessment and workspace aliases", () => {
    expect(resolveSeniorAdvisorPlanLimits({ userEntitlementPlanKey: "professional" }).planKey).toBe("pro");
    expect(resolveSeniorAdvisorPlanLimits({ assessmentPlanLevel: "readiness_report" }).planKey).toBe("readiness_report");
    expect(resolveSeniorAdvisorPlanLimits({ workspacePlan: "custom_blueprint" }).planKey).toBe("blueprint");
    expect(resolveSeniorAdvisorPlanLimits({ userEntitlementPlanKey: "msp_partner" }).planKey).toBe("partner");
    expect(resolveSeniorAdvisorPlanLimits({ userEntitlementPlanKey: "internal_qa" }).planKey).toBe("internal_qa");
    expect(resolveSeniorAdvisorPlanLimits({ userEntitlementPlanKey: "advisor_qa" }).planKey).toBe("internal_qa");
  });

  it("prioritizes a valid internal QA entitlement over free assessment and workspace plans", () => {
    const limits = resolveSeniorAdvisorPlanLimits({
      userEntitlementPlanKey: "internal_qa",
      assessmentPlanLevel: "free",
      workspacePlan: "free",
    });
    const usage = buildSeniorAdvisorUsageState({ limits, messagesUsed: 0 });

    expect(limits.planKey).toBe("internal_qa");
    expect(usage.planLabel).toBe("Internal QA");
    expect(usage.messageLimit).toBeGreaterThan(0);
    expect(usage.enabled).toBe(true);
  });

  it("keeps free assessment and workspace plans locked without an entitlement", () => {
    const limits = resolveSeniorAdvisorPlanLimits({
      assessmentPlanLevel: "free",
      workspacePlan: "free",
    });
    const usage = buildSeniorAdvisorUsageState({ limits, messagesUsed: 0 });

    expect(limits.planKey).toBe("starter");
    expect(usage.enabled).toBe(false);
    expect(usage.messageLimit).toBe(0);
  });

  it("marks usage exhausted when the assessment cap is reached", () => {
    const limits = getSeniorAdvisorPlanLimits("readiness_report");
    const usage = buildSeniorAdvisorUsageState({ limits, messagesUsed: limits.messageLimit });

    expect(usage.exhausted).toBe(true);
    expect(usage.messagesRemaining).toBe(0);
    expect(usage.warningReached).toBe(true);
  });
});
