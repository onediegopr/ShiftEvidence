import { describe, expect, it } from "vitest";
import {
  getClientContextPlanLimits,
  resolveClientContextPlanLimits,
} from "../../src/server/assessments/clientContextPlanLimits";
import {
  buildClientContextAuditMetadata,
  countClientContextWords,
  parseAdditionalEvidenceClassification,
  parseAdditionalEvidencePurpose,
  validateAdditionalEvidenceFileLimit,
  validateClientContextText,
} from "../../src/server/assessments/clientContextValidation";

describe("client context plan limits and validation", () => {
  it("counts words and accepts valid drafts", () => {
    const limits = getClientContextPlanLimits("starter");
    const validated = validateClientContextText({
      rawText: "Business deadline is tied to the VMware renewal.",
      limits,
      allowEmpty: true,
    });

    expect(countClientContextWords(validated.rawText)).toBe(8);
    expect(validated.wordCount).toBe(8);
    expect(validated.characterCount).toBeGreaterThan(0);
    expect(validated.truncated).toBe(false);
  });

  it("rejects empty submitted context unless the user skips the module", () => {
    const limits = getClientContextPlanLimits("starter");

    expect(() =>
      validateClientContextText({
        rawText: "   ",
        limits,
      }),
    ).toThrow(/cannot be empty/i);
  });

  it("rejects context above the active plan word limit", () => {
    const limits = { ...getClientContextPlanLimits("starter"), maxWords: 3 };

    expect(() =>
      validateClientContextText({
        rawText: "one two three four",
        limits,
      }),
    ).toThrow(/word limit/i);
  });

  it("resolves larger limits for Pro and Blueprint plans", () => {
    const starter = resolveClientContextPlanLimits({ userEntitlementPlanKey: "starter" });
    const pro = resolveClientContextPlanLimits({ userEntitlementPlanKey: "professional" });
    const blueprint = resolveClientContextPlanLimits({ assessmentPlanLevel: "custom_blueprint" });

    expect(pro.maxWords).toBeGreaterThan(starter.maxWords);
    expect(blueprint.maxWords).toBe(50_000);
    expect(blueprint.maxFiles).toBeGreaterThan(pro.maxFiles);
  });

  it("validates additional evidence purpose and classification allowlists", () => {
    expect(parseAdditionalEvidencePurpose("client_context")).toBe("client_context");
    expect(parseAdditionalEvidenceClassification("financial_evidence")).toBe("financial_evidence");
    expect(() => parseAdditionalEvidenceClassification("executable_macro")).toThrow(/unsupported/i);
  });

  it("enforces additional evidence file limits", () => {
    const limits = { ...getClientContextPlanLimits("starter"), maxFiles: 1 };

    expect(() =>
      validateAdditionalEvidenceFileLimit({
        existingFileCount: 1,
        limits,
      }),
    ).toThrow(/allows up to 1 additional evidence file/i);
  });

  it("keeps raw client text out of audit metadata", () => {
    const metadata = buildClientContextAuditMetadata({
      wordCount: 20,
      characterCount: 140,
      status: "ready_for_analysis",
      planLimitWords: 5_000,
      planLimitFiles: 1,
    });

    expect(metadata).not.toHaveProperty("rawText");
    expect(metadata).not.toHaveProperty("content");
    expect(metadata.wordCount).toBe(20);
  });
});
