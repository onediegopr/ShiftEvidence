import { describe, expect, it } from "vitest";
import type { AssessmentCompletionSummary } from "../../src/server/assessments/assessmentCompletionService";
import {
  getCompletionCenterNotice,
  getCompletionModuleHref,
  getCompletionPrimaryCtaHref,
  getCompletionPrimaryCtaLabel,
  getCompletionStatusLabel,
  getCompletionStatusTone,
} from "../../src/components/assessments/assessmentCompletionPresentation";

function summary(overrides: Partial<AssessmentCompletionSummary>): AssessmentCompletionSummary {
  return {
    completionPercent: 0,
    reportConfidencePercent: 0,
    requiredComplete: false,
    canGenerateReport: false,
    modules: [],
    missingRequired: [],
    missingRecommended: [],
    limitations: [],
    primaryCta: "upload_rvtools",
    ...overrides,
  };
}

describe("assessment completion presentation helpers", () => {
  it("maps module statuses to safe user-facing labels and tones", () => {
    expect(getCompletionStatusLabel("complete")).toBe("Complete");
    expect(getCompletionStatusTone("complete")).toBe("good");
    expect(getCompletionStatusLabel("not_started")).toBe("Not started");
    expect(getCompletionStatusTone("not_started")).toBe("neutral");
    expect(getCompletionStatusLabel("failed")).toBe("Needs attention");
    expect(getCompletionStatusTone("failed")).toBe("danger");
  });

  it("builds stable module hrefs for dashboard tabs and report actions", () => {
    expect(getCompletionModuleHref("assessment-1", "rvtools_inventory")).toBe(
      "/dashboard/assessments/assessment-1?tab=evidence#evidence-upload",
    );
    expect(getCompletionModuleHref("assessment-1", "storage_analysis")).toBe(
      "/dashboard/assessments/assessment-1?tab=storage#storage-destination-readiness",
    );
    expect(getCompletionModuleHref("assessment-1", "client_context_intelligence")).toBe(
      "/dashboard/assessments/assessment-1?tab=client-context#client-context-additional-evidence",
    );
    expect(getCompletionModuleHref("assessment-1", "report_generation")).toBe(
      "/dashboard/assessments/assessment-1/report",
    );
  });

  it("maps primary CTA labels and hrefs without blocking optional modules", () => {
    expect(getCompletionPrimaryCtaLabel("generate_report")).toBe("Generate report now");
    expect(
      getCompletionPrimaryCtaHref(
        "assessment-1",
        summary({
          primaryCta: "improve_report",
          canGenerateReport: true,
          missingRecommended: [
            {
              key: "migration_questions",
              label: "Migration Questions",
              description: "",
              required: false,
              status: "not_started",
              weight: 10,
              confidenceContribution: 0,
              completionContribution: 0,
            },
          ],
        }),
      ),
    ).toBe("/dashboard/assessments/assessment-1?tab=context");
  });

  it("explains that reports can be generated while recommended modules remain open", () => {
    const notice = getCompletionCenterNotice(
      summary({
        canGenerateReport: true,
        missingRecommended: [
          {
            key: "storage_analysis",
            label: "Storage Analysis",
            description: "",
            required: false,
            status: "skipped",
            weight: 15,
            confidenceContribution: 0,
            completionContribution: 15,
          },
          {
            key: "licensing_cost_exposure",
            label: "Licensing & Cost Exposure",
            description: "",
            required: false,
            status: "partial",
            weight: 15,
            confidenceContribution: 8,
            completionContribution: 8,
          },
        ],
      }),
    );

    expect(notice).toContain("You can generate the report now");
    expect(notice).toContain("Storage Analysis");
    expect(notice).toContain("Licensing & Cost Exposure");
  });
});
