import { describe, expect, it } from "vitest";
import { getAdvisorMemoryPlanLimits } from "../../src/server/advisor/advisorMemoryPlanLimits";
import {
  canTransitionAdvisorMemoryStatus,
  validateAdvisorMemoryCreateInput,
} from "../../src/server/advisor/advisorMemoryValidation";
import type { AdvisorMemoryCreateInput } from "../../src/server/advisor/advisorMemoryTypes";

const baseInput: AdvisorMemoryCreateInput = {
  assessmentId: "assessment-1",
  workspaceId: "workspace-1",
  type: "decision",
  sourceType: "user_message",
  truthStatus: "customer_reported",
  title: "Decision",
  summary: "User accepted broad licensing estimate due to missing renewal quote.",
  confidence: 80,
};

describe("advisor memory validation", () => {
  it("blocks memory creation for free plans", () => {
    const result = validateAdvisorMemoryCreateInput({
      input: baseInput,
      limits: getAdvisorMemoryPlanLimits("starter"),
      existingItemCount: 0,
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.code).toBe("memory_plan_restricted");
  });

  it("requires title and summary", () => {
    const titleResult = validateAdvisorMemoryCreateInput({
      input: { ...baseInput, title: " " },
      limits: getAdvisorMemoryPlanLimits("internal_qa"),
      existingItemCount: 0,
    });
    const summaryResult = validateAdvisorMemoryCreateInput({
      input: { ...baseInput, summary: " " },
      limits: getAdvisorMemoryPlanLimits("internal_qa"),
      existingItemCount: 0,
    });

    expect(titleResult.ok ? null : titleResult.code).toBe("missing_title");
    expect(summaryResult.ok ? null : summaryResult.code).toBe("missing_summary");
  });

  it("requires confidence to be 0 through 100", () => {
    const result = validateAdvisorMemoryCreateInput({
      input: { ...baseInput, confidence: 101 },
      limits: getAdvisorMemoryPlanLimits("internal_qa"),
      existingItemCount: 0,
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.code).toBe("invalid_confidence");
  });

  it("rejects obvious raw file content", () => {
    const result = validateAdvisorMemoryCreateInput({
      input: { ...baseInput, summary: "VM,Powerstate,CPUs,Memory,Provisioned" },
      limits: getAdvisorMemoryPlanLimits("internal_qa"),
      existingItemCount: 0,
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.code).toBe("raw_file_content_detected");
  });

  it("allows only expected lifecycle transitions", () => {
    expect(canTransitionAdvisorMemoryStatus("needs_review", "active")).toBe(true);
    expect(canTransitionAdvisorMemoryStatus("active", "resolved")).toBe(true);
    expect(canTransitionAdvisorMemoryStatus("active", "rejected")).toBe(false);
    expect(canTransitionAdvisorMemoryStatus("archived", "active")).toBe(false);
  });
});
