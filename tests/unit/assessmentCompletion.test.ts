import { describe, expect, it } from "vitest";
import {
  computeAssessmentCompletionSummary,
  type AssessmentCompletionAssessmentInput,
  type AssessmentCompletionModule,
  type AssessmentModuleKey,
} from "../../src/server/assessments/assessmentCompletionService";
import {
  MIGRATION_CONTEXT_JSON_KEY,
  migrationContextQuestions,
} from "../../src/server/assessments/migrationContextService";
import { STORAGE_CONTEXT_JSON_KEY } from "../../src/server/assessments/costRiskService";

const now = new Date("2026-05-29T12:00:00.000Z");

function moduleByKey(
  modules: AssessmentCompletionModule[],
  key: AssessmentModuleKey,
) {
  const foundModule = modules.find((item) => item.key === key);
  if (!foundModule) {
    throw new Error(`Missing module ${key}`);
  }

  return foundModule;
}

function asAssessment(value: Record<string, unknown>): AssessmentCompletionAssessmentInput {
  return value as unknown as AssessmentCompletionAssessmentInput;
}

function baseAssessment(overrides: Record<string, unknown> = {}) {
  return asAssessment({
    evidenceFiles: [],
    parsedVMs: [],
    parsedHosts: [],
    parsedDatastores: [],
    parsedSnapshots: [],
    parsedInventorySummaries: [],
    riskFindings: [],
    reports: [],
    preliminaryResult: null,
    assessmentScore: null,
    infrastructureInput: null,
    costRiskAssumptions: null,
    storageReadinessEnabled: null,
    storageReadinessStatus: null,
    storageReadinessInput: null,
    clientContext: null,
    clientContextAnalysis: null,
    additionalEvidence: [],
    ...overrides,
  });
}

function parsedRvtoolsAssessment(overrides: Record<string, unknown> = {}) {
  return baseAssessment({
    evidenceFiles: [
      {
        id: "evidence-1",
        evidenceType: "rvtools",
        deletedAt: null,
        uploadedAt: now,
        processingStatus: "parsed",
        originalFilename: "rvtools.xlsx",
      },
    ],
    parsedInventorySummaries: [
      {
        id: "summary-1",
        assessmentId: "assessment-1",
        evidenceFileId: "evidence-1",
        createdAt: now,
        updatedAt: now,
        vmCount: 42,
        hostCount: 4,
        datastoreCount: 3,
        snapshotCount: 6,
        poweredOnVmCount: 38,
        poweredOffVmCount: 4,
        totalProvisionedGb: 12_288,
        totalUsedGb: 8_192,
        largestVmGb: 512,
        oldestSnapshotDays: 20,
        parsedAt: now,
        parseWarningsJson: [],
      },
    ],
    parsedVMs: [
      {
        id: "vm-1",
        assessmentId: "assessment-1",
        evidenceFileId: "evidence-1",
        createdAt: now,
        updatedAt: now,
        vmName: "app-01",
      },
    ],
    parsedHosts: [
      {
        id: "host-1",
        assessmentId: "assessment-1",
        evidenceFileId: "evidence-1",
        createdAt: now,
        updatedAt: now,
        hostName: "esx-01",
      },
    ],
    parsedDatastores: [
      {
        id: "ds-1",
        assessmentId: "assessment-1",
        evidenceFileId: "evidence-1",
        createdAt: now,
        updatedAt: now,
        datastoreName: "SAN-01",
      },
    ],
    ...overrides,
  });
}

function answeredMigrationContext() {
  const answers = Object.fromEntries(
    migrationContextQuestions.map((question) => [
      question.id,
      {
        value: question.type === "multi" ? ["Documented"] : "Documented",
        status: "answered",
        source: "user_input",
        updatedAt: now.toISOString(),
      },
    ]),
  );

  return {
    [MIGRATION_CONTEXT_JSON_KEY]: {
      version: 1,
      answers,
      updatedAt: now.toISOString(),
    },
  };
}

describe("assessment completion model", () => {
  it("marks an empty assessment as not ready for report generation", () => {
    const summary = computeAssessmentCompletionSummary(baseAssessment());

    expect(moduleByKey(summary.modules, "rvtools_inventory").status).toBe("not_started");
    expect(summary.canGenerateReport).toBe(false);
    expect(summary.requiredComplete).toBe(false);
    expect(summary.reportConfidencePercent).toBeLessThan(20);
    expect(summary.primaryCta).toBe("upload_rvtools");
  });

  it("allows report generation once RVTools inventory is complete", () => {
    const summary = computeAssessmentCompletionSummary(parsedRvtoolsAssessment());

    expect(moduleByKey(summary.modules, "rvtools_inventory").status).toBe("complete");
    expect(moduleByKey(summary.modules, "infrastructure_risk").status).toBe("partial");
    expect(summary.canGenerateReport).toBe(true);
    expect(summary.primaryCta).toBe("generate_report");
    expect(summary.missingRecommended.some((module) => module.key === "migration_questions")).toBe(
      true,
    );
  });

  it("returns high confidence when evidence, context, cost, AI and report modules are complete", () => {
    const summary = computeAssessmentCompletionSummary(
      parsedRvtoolsAssessment({
        riskFindings: [{ id: "risk-1", createdAt: now, updatedAt: now }],
        infrastructureInput: {
          criticalWorkloadCount: 4,
          largeVmCount: 3,
          poweredOffVmCount: 4,
          storageFootprintTb: 12,
          usedStorageTb: 8,
          notes: "Maintenance windows documented.",
        },
        costRiskAssumptions: {
          vmwareLicenseModel: "core",
          vmCount: 42,
          annualVmwareCost: 120_000,
          estimatedProxmoxCost: 35_000,
          currency: "USD",
          years: 3,
          migrationComplexity: "medium",
          businessCriticality: "high",
          riskTolerance: "moderate",
          assumptionsJson: answeredMigrationContext(),
        },
        storageReadinessEnabled: true,
        storageReadinessStatus: "selected",
        storageReadinessInput: {
          currentStorageType: "SAN",
          targetStoragePreference: "ZFS",
          capacityTb: 12,
          usedTb: 8,
          requiresHa: true,
          requiresSharedStorage: true,
        },
        clientContext: {
          status: "analyzed",
          wordCount: 120,
          characterCount: 850,
          lastEditedAt: now,
          updatedAt: now,
        },
        clientContextAnalysis: {
          status: "completed",
          contextCompletenessScore: 80,
          businessContextConfidence: "high",
          generatedAt: now,
          updatedAt: now,
        },
        additionalEvidence: [],
        aiUsageEvents: [{ status: "success", createdAt: now, updatedAt: now }],
        reports: [
          {
            id: "report-1",
            reportType: "readiness_report",
            status: "generated",
            deletedAt: null,
            generatedAt: now,
            createdAt: now,
            updatedAt: now,
          },
        ],
      }),
    );

    expect(summary.requiredComplete).toBe(true);
    expect(summary.canGenerateReport).toBe(true);
    expect(summary.completionPercent).toBe(100);
    expect(summary.reportConfidencePercent).toBe(100);
    expect(summary.primaryCta).toBe("review_modules");
  });

  it("keeps optional missing modules non-blocking and records limitations", () => {
    const summary = computeAssessmentCompletionSummary(
      parsedRvtoolsAssessment({
        riskFindings: [{ id: "risk-1", createdAt: now, updatedAt: now }],
        reports: [
          {
            id: "report-1",
            reportType: "readiness_report",
            status: "generated",
            deletedAt: null,
            generatedAt: now,
            createdAt: now,
            updatedAt: now,
          },
        ],
      }),
    );

    expect(summary.canGenerateReport).toBe(true);
    expect(summary.requiredComplete).toBe(true);
    expect(summary.missingRecommended.length).toBeGreaterThan(0);
    expect(summary.limitations.length).toBeGreaterThan(0);
    expect(summary.primaryCta).toBe("improve_report");
  });

  it("treats skipped storage as non-blocking while reducing report confidence", () => {
    const summary = computeAssessmentCompletionSummary(
      parsedRvtoolsAssessment({
        costRiskAssumptions: {
          currency: "USD",
          years: 3,
          assumptionsJson: {
            [STORAGE_CONTEXT_JSON_KEY]: {
              version: 1,
              decision: "skipped",
              currentStorageType: null,
              targetStoragePreference: null,
              knownConstraints: [],
              notes: null,
              updatedAt: now.toISOString(),
            },
          },
        },
      }),
    );

    expect(moduleByKey(summary.modules, "storage_analysis").status).toBe("skipped");
    expect(summary.canGenerateReport).toBe(true);
    expect(summary.missingRecommended.some((module) => module.key === "storage_analysis")).toBe(
      true,
    );
    expect(summary.limitations.some((item) => item.includes("Storage Analysis"))).toBe(true);
  });

  it("keeps client context optional and requires completed analysis for full credit", () => {
    const emptySummary = computeAssessmentCompletionSummary(parsedRvtoolsAssessment());
    const draftSummary = computeAssessmentCompletionSummary(
      parsedRvtoolsAssessment({
        clientContext: {
          status: "draft",
          wordCount: 40,
          characterCount: 260,
          lastEditedAt: now,
          updatedAt: now,
        },
      }),
    );
    const submittedSummary = computeAssessmentCompletionSummary(
      parsedRvtoolsAssessment({
        clientContext: {
          status: "ready_for_analysis",
          wordCount: 90,
          characterCount: 620,
          lastEditedAt: now,
          updatedAt: now,
        },
      }),
    );
    const completedSummary = computeAssessmentCompletionSummary(
      parsedRvtoolsAssessment({
        clientContext: {
          status: "analyzed",
          wordCount: 90,
          characterCount: 620,
          lastEditedAt: now,
          updatedAt: now,
        },
        clientContextAnalysis: {
          status: "completed",
          generatedAt: now,
          updatedAt: now,
        },
      }),
    );

    expect(moduleByKey(emptySummary.modules, "client_context_intelligence").status).toBe("not_started");
    expect(moduleByKey(draftSummary.modules, "client_context_intelligence").status).toBe("partial");
    expect(moduleByKey(submittedSummary.modules, "client_context_intelligence").status).toBe("partial");
    expect(moduleByKey(completedSummary.modules, "client_context_intelligence").status).toBe("complete");
    expect(submittedSummary.canGenerateReport).toBe(true);
  });

  it("keeps percentages inside the 0 to 100 range", () => {
    const summaries = [
      computeAssessmentCompletionSummary(baseAssessment()),
      computeAssessmentCompletionSummary(parsedRvtoolsAssessment()),
      computeAssessmentCompletionSummary(
        parsedRvtoolsAssessment({
          storageReadinessEnabled: false,
          storageReadinessStatus: "not_selected",
        }),
      ),
    ];

    summaries.forEach((summary) => {
      expect(summary.completionPercent).toBeGreaterThanOrEqual(0);
      expect(summary.completionPercent).toBeLessThanOrEqual(100);
      expect(summary.reportConfidencePercent).toBeGreaterThanOrEqual(0);
      expect(summary.reportConfidencePercent).toBeLessThanOrEqual(100);
    });
  });
});
