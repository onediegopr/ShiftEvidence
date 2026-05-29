import { describe, expect, it } from "vitest";
import {
  calculateContextCompletenessScore,
  parseAndValidateClientContextAiOutput,
} from "../../src/server/assessments/clientContextAiAnalysisService";

describe("client context AI analysis service", () => {
  it("normalizes valid AI JSON output", () => {
    const parsed = parseAndValidateClientContextAiOutput(
      JSON.stringify({
        interpretedSummary: "The customer is under renewal pressure and needs low downtime.",
        businessPriorities: [
          {
            priority: "Reduce renewal risk",
            evidence: "Renewal pressure was reported.",
            confidence: "high",
            source: "customer_reported",
          },
        ],
        migrationConstraints: [],
        criticalWorkloads: [],
        customerReportedRisks: [],
        aiExtractedInsights: [],
        contradictions: [],
        validationItems: [],
        reportImpact: [],
        nextQuestions: [],
        contextCompletenessScore: 72,
        businessContextConfidence: "medium",
        safetyFlags: [],
      }),
    );

    expect(parsed.interpretedSummary).toContain("renewal pressure");
    expect(parsed.businessPriorities).toHaveLength(1);
    expect(parsed.contextCompletenessScore).toBe(72);
    expect(parsed.businessContextConfidence).toBe("medium");
  });

  it("handles invalid JSON with a safe fallback", () => {
    const parsed = parseAndValidateClientContextAiOutput("not-json");

    expect(parsed.interpretedSummary).toContain("not available");
    expect(parsed.safetyFlags.some((flag) => flag.flag === "invalid_ai_json")).toBe(true);
    expect(parsed.parseWarnings).toContain("invalid_json");
  });

  it("calculates higher completeness for richer context", () => {
    const sparse = calculateContextCompletenessScore({
      wordCount: 10,
      businessPrioritiesCount: 0,
      constraintsCount: 0,
      criticalWorkloadsCount: 0,
      risksCount: 0,
      timelineSignalsCount: 0,
      additionalEvidenceCount: 0,
      validationItemsCount: 0,
    });
    const rich = calculateContextCompletenessScore({
      wordCount: 500,
      businessPrioritiesCount: 2,
      constraintsCount: 2,
      criticalWorkloadsCount: 1,
      risksCount: 1,
      timelineSignalsCount: 1,
      additionalEvidenceCount: 2,
      validationItemsCount: 3,
    });

    expect(rich).toBeGreaterThan(sparse);
    expect(rich).toBe(100);
  });
});
