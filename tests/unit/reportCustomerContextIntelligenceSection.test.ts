import { describe, expect, it } from "vitest";
import type { AssessmentClientContextAnalysis } from "@prisma/client";
import { buildCustomerContextIntelligenceReportSection } from "../../src/server/reports/reportCustomerContextIntelligenceSection";

function analysis(overrides: Partial<AssessmentClientContextAnalysis> = {}): AssessmentClientContextAnalysis {
  return {
    id: "client-context-analysis-1",
    assessmentId: "assessment-1",
    status: "completed",
    interpretedSummary:
      "The customer is under renewal pressure and wants to validate a controlled VMware to Proxmox migration before committing production workloads.",
    businessPrioritiesJson: [
      {
        priority: "Reduce renewal exposure",
        evidence: "Customer described a renewal-driven migration deadline.",
        confidence: "high",
        source: "customer_reported",
      },
    ],
    migrationConstraintsJson: [
      {
        constraint: "Limited downtime for customer-facing systems",
        type: "downtime",
        impact: "Migration waves should avoid business hours.",
        source: "customer_reported",
      },
    ],
    criticalWorkloadsJson: [
      {
        name: "ERP platform",
        reason: "Customer described it as business-critical.",
        validationNeeded: true,
        source: "customer_reported",
      },
    ],
    customerReportedRisksJson: [
      {
        risk: "Renewal deadline may compress validation time.",
        severity: "high",
        rationale: "Customer described a near-term renewal decision.",
        validationNeeded: true,
      },
    ],
    aiExtractedInsightsJson: [
      {
        insight: "A pilot-first migration path is likely safer than a big-bang cutover.",
        impact: "Migration waves should be validated with application owners.",
        confidence: "medium",
      },
    ],
    contradictionsJson: [
      {
        title: "Timeline pressure versus validation depth",
        description: "Customer wants speed but also mentions low tolerance for downtime.",
        validationRecommendation: "Confirm maintenance windows and rollback owners.",
      },
    ],
    validationItemsJson: [
      {
        item: "Confirm application owner for ERP platform",
        whyItMatters: "Workload criticality is customer-reported and needs owner validation.",
        recommendedOwner: "Application owner",
        priority: "high",
      },
    ],
    reportImpactJson: [
      {
        area: "migration_waves",
        impact: "Customer constraints may change wave sequencing.",
        shouldAffectScore: false,
        note: "Use as advisory context until validated.",
      },
    ],
    nextQuestionsJson: [
      {
        question: "Which workloads have strict maintenance windows?",
        reason: "Downtime constraints were mentioned but not fully structured.",
        priority: "high",
      },
    ],
    contextCompletenessScore: 76,
    businessContextConfidence: "medium",
    analysisVersion: "context-intelligence-v1",
    promptVersion: "context-intelligence-prompt-v1",
    modelUsed: "mock-model",
    safetyFlagsJson: [
      {
        flag: "Prompt injection-like language detected",
        severity: "medium",
        explanation: "Client content was treated as data, not instructions.",
      },
    ],
    generatedAt: new Date("2026-05-29T00:00:00.000Z"),
    createdAt: new Date("2026-05-29T00:00:00.000Z"),
    updatedAt: new Date("2026-05-29T00:00:00.000Z"),
    ...overrides,
  } as AssessmentClientContextAnalysis;
}

describe("report customer context intelligence section", () => {
  it("handles null analysis without throwing", () => {
    const section = buildCustomerContextIntelligenceReportSection(null);

    expect(section.included).toBe(false);
    expect(section.status).toBe("not_available");
    expect(section.interpretedSummary).toBeNull();
    expect(section.disclaimers.join(" ")).toContain("No Customer Context Intelligence analysis");
  });

  it("normalizes completed persisted analysis for report/PDF consumption", () => {
    const section = buildCustomerContextIntelligenceReportSection(analysis());

    expect(section.included).toBe(true);
    expect(section.contextCompletenessScore).toBe(76);
    expect(section.businessContextConfidence).toBe("medium");
    expect(section.businessPriorities[0]?.priority).toBe("Reduce renewal exposure");
    expect(section.criticalWorkloads[0]?.validationNeeded).toBe(true);
    expect(section.reportImpact[0]?.shouldAffectScore).toBe(false);
  });

  it("does not include raw client text even if an unexpected property is present", () => {
    const record = {
      ...analysis(),
      rawText: "RAW_TEXT_SECRET should never appear in report output",
    } as AssessmentClientContextAnalysis & { rawText: string };

    const section = buildCustomerContextIntelligenceReportSection(record);

    expect(JSON.stringify(section)).not.toContain("RAW_TEXT_SECRET");
    expect(section.disclaimers.join(" ")).toContain("original free-text narrative is not reproduced");
  });

  it("does not throw on malformed JSON strings and records a disclaimer", () => {
    const section = buildCustomerContextIntelligenceReportSection(
      analysis({
        businessPrioritiesJson: "{not-json" as never,
      }),
    );

    expect(section.businessPriorities).toEqual([]);
    expect(section.disclaimers.join(" ")).toContain("Business priorities JSON could not be parsed");
  });

  it("truncates long arrays for report safety", () => {
    const section = buildCustomerContextIntelligenceReportSection(
      analysis({
        validationItemsJson: Array.from({ length: 20 }, (_, index) => ({
          item: `Validation item ${index + 1}`,
          whyItMatters: "Keep PDF output bounded.",
          priority: "medium",
        })) as never,
      }),
    );

    expect(section.validationItems).toHaveLength(8);
  });

  it("renders stale and failed analysis as safe fallback states", () => {
    const stale = buildCustomerContextIntelligenceReportSection(
      analysis({
        status: "stale" as never,
      }),
    );
    const failed = buildCustomerContextIntelligenceReportSection(
      analysis({
        status: "failed" as never,
        interpretedSummary: null,
      }),
    );

    expect(stale.included).toBe(true);
    expect(stale.disclaimers.join(" ")).toContain("changed after the last analysis");
    expect(failed.interpretedSummary).toContain("analysis failed");
  });

  it("includes additional evidence metadata but not file contents or paths", () => {
    const section = buildCustomerContextIntelligenceReportSection(analysis(), {
      additionalEvidence: [
        {
          classification: "business_context",
          analysisStatus: "received_not_analyzed",
          includedInContextAnalysis: true,
          evidenceFile: {
            originalFilename: "C:\\secret\\customer-context.pdf",
            relativePath: "private/raw/file/content",
          },
        },
      ] as never,
    });

    expect(section.additionalEvidenceSummary[0]?.filename).toBe("customer-context.pdf");
    expect(JSON.stringify(section)).not.toContain("private/raw/file/content");
  });
});
