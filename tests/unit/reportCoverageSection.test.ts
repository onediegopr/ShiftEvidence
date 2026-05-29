import { describe, expect, it } from "vitest";
import type {
  AssessmentCompletionModule,
  AssessmentCompletionSummary,
} from "../../src/server/assessments/assessmentCompletionService";
import {
  ASSESSMENT_COVERAGE_NO_MAJOR_LIMITATIONS,
  buildAssessmentCoverageSection,
} from "../../src/server/reports/reportCoverageSection";

function module(
  overrides: Partial<AssessmentCompletionModule> & Pick<AssessmentCompletionModule, "key" | "label" | "required" | "status" | "weight">,
): AssessmentCompletionModule {
  return {
    description: `${overrides.label} description`,
    confidenceContribution: overrides.status === "complete" ? overrides.weight : 0,
    completionContribution: overrides.status === "complete" ? overrides.weight : 0,
    impactIfMissing: `${overrides.label} impact if missing.`,
    ...overrides,
  };
}

function summary(overrides: Partial<AssessmentCompletionSummary> = {}): AssessmentCompletionSummary {
  const modules = [
    module({
      key: "rvtools_inventory",
      label: "RVTools Inventory",
      required: true,
      status: "complete",
      weight: 35,
    }),
    module({
      key: "storage_analysis",
      label: "Storage Analysis",
      required: false,
      status: "skipped",
      weight: 15,
      limitationText: "Storage context was skipped; recommendations may be estimated from datastore evidence.",
    }),
    module({
      key: "licensing_cost_exposure",
      label: "Licensing & Cost Exposure",
      required: false,
      status: "complete",
      weight: 15,
    }),
    module({
      key: "ai_advisory",
      label: "AI Advisory",
      required: false,
      status: "not_started",
      weight: 3,
    }),
    module({
      key: "report_generation",
      label: "Report Generation",
      required: true,
      status: "complete",
      weight: 2,
    }),
  ];

  return {
    completionPercent: 72,
    reportConfidencePercent: 61,
    requiredComplete: true,
    canGenerateReport: true,
    modules,
    missingRequired: [],
    missingRecommended: modules.filter((item) => !item.required && item.status !== "complete"),
    limitations: [
      "Storage context was skipped; recommendations may be estimated from datastore evidence.",
      "AI advisory has not been generated. This does not block the report.",
    ],
    primaryCta: "improve_report",
    ...overrides,
  };
}

describe("report coverage section", () => {
  it("builds the Assessment Coverage & Assumptions section with completion metrics", () => {
    const section = buildAssessmentCoverageSection(summary());

    expect(section.title).toBe("Assessment Coverage & Assumptions");
    expect(section.intro).toContain("Missing optional modules do not block report generation");
    expect(section.completionPercent).toBe(72);
    expect(section.reportConfidencePercent).toBe(61);
    expect(section.requiredModulesLabel).toBe("Complete");
    expect(section.reportGenerationLabel).toBe("Generated");
  });

  it("renders module rows with status, required flag and impact", () => {
    const section = buildAssessmentCoverageSection(summary());
    const storage = section.rows.find((row) => row.area === "Storage Analysis");
    const licensing = section.rows.find((row) => row.area === "Licensing & Cost Exposure");

    expect(storage?.status).toBe("Skipped");
    expect(storage?.required).toBe("Optional");
    expect(storage?.impact).toContain("Storage context was skipped");
    expect(storage?.tone).toBe("warning");
    expect(licensing?.impact).toContain("USD cost exposure");
  });

  it("uses a non-harsh not applicable impact and avoids false limitation text", () => {
    const notApplicableModule = module({
      key: "storage_analysis",
      label: "Storage Analysis",
      required: false,
      status: "not_applicable",
      weight: 15,
    });
    const section = buildAssessmentCoverageSection(
      summary({
        modules: [notApplicableModule],
        limitations: [],
        missingRecommended: [],
      }),
    );

    expect(section.rows[0]?.status).toBe("Not Applicable");
    expect(section.rows[0]?.impact).toContain("not treated as a report blocker");
    expect(section.limitations).toEqual([ASSESSMENT_COVERAGE_NO_MAJOR_LIMITATIONS]);
    expect(section.hasLimitations).toBe(false);
  });

  it("always includes the USD note for licensing and subscription values", () => {
    const section = buildAssessmentCoverageSection(summary());

    expect(section.usdNote).toContain("USD");
    expect(section.usdNote).toContain("licensing and subscription");
  });
});
