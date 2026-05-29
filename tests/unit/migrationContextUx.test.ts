import { describe, expect, it } from "vitest";
import {
  computeMigrationContextCoverage,
  migrationContextQuestions,
  migrationContextSections,
  parseMigrationContextFormData,
} from "../../src/server/assessments/migrationContextService";
import { INPUT_LIMITS } from "../../src/server/validation/inputLimits";

const quickQuestionIds = [
  "main_migration_objective",
  "target_timeline",
  "preferred_target_platform",
  "environment_criticality",
  "include_cost_licensing_analysis",
  "include_storage_readiness",
  "additional_context",
];

function answeredFormData() {
  const formData = new FormData();

  migrationContextQuestions.forEach((question) => {
    formData.set(`context.${question.id}.status`, "answered");
    if (question.type === "multi") {
      formData.append(`context.${question.id}.value`, question.options?.[0] ?? "Documented");
    } else {
      formData.set(`context.${question.id}.value`, question.options?.[0] ?? "Documented");
    }
  });

  return formData;
}

describe("optional migration questions UX model", () => {
  it("defines a compact Quick Questions section with the expected product questions", () => {
    const quickSection = migrationContextSections.find((section) => section.id === "quick_context");

    expect(quickSection?.title).toBe("Quick Questions");
    expect(quickSection?.group).toBe("quick");
    expect(quickSection?.questions.map((question) => question.id)).toEqual(quickQuestionIds);
    expect(quickSection?.description).toContain("optional");
  });

  it("keeps Advanced Context visually secondary in the catalog", () => {
    const advancedSections = migrationContextSections.filter(
      (section) => section.group === "advanced",
    );

    expect(advancedSections.length).toBeGreaterThan(1);
    expect(advancedSections[0]?.id).toBe("decision_context");
    expect(advancedSections.some((section) => section.id === "storage")).toBe(true);
    expect(advancedSections.some((section) => section.id === "backup_dr")).toBe(true);
  });

  it("returns missing coverage when the user skips the optional questions", () => {
    const context = parseMigrationContextFormData(new FormData());
    const coverage = computeMigrationContextCoverage(context);

    expect(coverage.status).toBe("missing");
    expect(coverage.overallPercent).toBe(0);
    expect(context.answers.main_migration_objective.status).toBe("skipped");
  });

  it("returns partial coverage when only a few quick answers are provided", () => {
    const formData = new FormData();
    formData.set("context.main_migration_objective.status", "answered");
    formData.set("context.main_migration_objective.value", "Evaluate Proxmox feasibility");
    formData.set("context.target_timeline.status", "answered");
    formData.set("context.target_timeline.value", "Short term: 3-6 months");

    const context = parseMigrationContextFormData(formData);
    const coverage = computeMigrationContextCoverage(context);

    expect(["limited", "partial"]).toContain(coverage.status);
    expect(coverage.overallPercent).toBeGreaterThan(0);
    expect(context.answers.preferred_target_platform.status).toBe("skipped");
  });

  it("returns strong coverage when all migration context questions are answered", () => {
    const context = parseMigrationContextFormData(answeredFormData());
    const coverage = computeMigrationContextCoverage(context);

    expect(coverage.status).toBe("strong");
    expect(coverage.overallPercent).toBe(100);
    expect(coverage.missingKeyContext).toEqual([]);
  });

  it("persists per-question skipped and not applicable decisions without a DB migration", () => {
    const formData = new FormData();
    formData.set("context.include_storage_readiness.status", "not_applicable");
    formData.set("context.include_storage_readiness.value", "No");
    formData.set("context.include_cost_licensing_analysis.status", "skipped");

    const context = parseMigrationContextFormData(formData);

    expect(context.answers.include_storage_readiness.status).toBe("not_applicable");
    expect(context.answers.include_cost_licensing_analysis.status).toBe("skipped");
  });

  it("guards additional context with the existing long text limit", () => {
    const formData = new FormData();
    formData.set("context.additional_context.status", "answered");
    formData.set("context.additional_context.value", "a".repeat(INPUT_LIMITS.manualTechnicalContext + 1));

    expect(() => parseMigrationContextFormData(formData)).toThrow(
      `Additional context must be ${INPUT_LIMITS.manualTechnicalContext} characters or less.`,
    );
  });
});
