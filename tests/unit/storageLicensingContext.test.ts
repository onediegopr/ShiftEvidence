import { describe, expect, it } from "vitest";
import {
  computeAssessmentCompletionSummary,
  type AssessmentCompletionAssessmentInput,
  type AssessmentCompletionModule,
  type AssessmentModuleKey,
} from "../../src/server/assessments/assessmentCompletionService";
import {
  LICENSING_CONTEXT_JSON_KEY,
  parseLicensingCostContextFormData,
  parseStorageAnalysisContextFormData,
  STORAGE_CONTEXT_JSON_KEY,
} from "../../src/server/assessments/costRiskService";

const now = new Date("2026-05-29T12:00:00.000Z");

function asAssessment(value: Record<string, unknown>): AssessmentCompletionAssessmentInput {
  return value as unknown as AssessmentCompletionAssessmentInput;
}

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
    costRiskAssumptions: {
      currency: "USD",
      years: 3,
      assumptionsJson: null,
    },
    storageReadinessEnabled: false,
    storageReadinessStatus: "not_selected",
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

function assumptionsJson(value: Record<string, unknown>) {
  return {
    currency: "USD",
    years: 3,
    assumptionsJson: value,
  };
}

describe("optional storage and licensing module UX model", () => {
  it("parses storage context decisions and constraints from form data", () => {
    const formData = new FormData();
    formData.set("storageDecision", "active");
    formData.set("currentStorageType", "SAN");
    formData.set("targetStoragePreference", "Proxmox + Ceph");
    formData.append("knownStorageConstraints", "Performance");
    formData.append("knownStorageConstraints", "Backup");
    formData.set("storageNotes", "Needs validation during architecture review.");

    const context = parseStorageAnalysisContextFormData(formData);

    expect(context.decision).toBe("active");
    expect(context.currentStorageType).toBe("SAN");
    expect(context.targetStoragePreference).toBe("Proxmox + Ceph");
    expect(context.knownConstraints).toEqual(["Performance", "Backup"]);
    expect(context.notes).toBe("Needs validation during architecture review.");
  });

  it("parses licensing context with USD-oriented cost preferences", () => {
    const formData = new FormData();
    formData.set("licensingDecision", "active");
    formData.set("renewalTimeframe", "3-6 months");
    formData.set("includeProxmoxEstimate", "yes");
    formData.set("licensingNotes", "Renewal exposure should be modeled in USD.");

    const context = parseLicensingCostContextFormData(formData);

    expect(context.decision).toBe("active");
    expect(context.renewalTimeframe).toBe("3-6 months");
    expect(context.includeProxmoxEstimate).toBe("yes");
    expect(context.notes).toContain("USD");
  });

  it("marks empty storage context as not started", () => {
    const summary = computeAssessmentCompletionSummary(baseAssessment());

    expect(moduleByKey(summary.modules, "storage_analysis").status).toBe("not_started");
  });

  it("marks partial and complete storage context without requiring report access", () => {
    const partialSummary = computeAssessmentCompletionSummary(
      baseAssessment({
        costRiskAssumptions: assumptionsJson({
          [STORAGE_CONTEXT_JSON_KEY]: {
            version: 1,
            decision: "active",
            currentStorageType: "SAN",
            targetStoragePreference: null,
            knownConstraints: [],
            notes: null,
            updatedAt: now.toISOString(),
          },
        }),
      }),
    );
    const completeSummary = computeAssessmentCompletionSummary(
      parsedRvtoolsAssessment({
        costRiskAssumptions: assumptionsJson({
          [STORAGE_CONTEXT_JSON_KEY]: {
            version: 1,
            decision: "active",
            currentStorageType: "SAN",
            targetStoragePreference: "Proxmox + Ceph",
            knownConstraints: ["Performance"],
            notes: null,
            updatedAt: now.toISOString(),
          },
        }),
      }),
    );

    expect(moduleByKey(partialSummary.modules, "storage_analysis").status).toBe("partial");
    expect(moduleByKey(completeSummary.modules, "storage_analysis").status).toBe("complete");
  });

  it("keeps skipped and not applicable storage explicit and non-blocking", () => {
    const skippedSummary = computeAssessmentCompletionSummary(
      parsedRvtoolsAssessment({
        costRiskAssumptions: assumptionsJson({
          [STORAGE_CONTEXT_JSON_KEY]: {
            version: 1,
            decision: "skipped",
            currentStorageType: null,
            targetStoragePreference: null,
            knownConstraints: [],
            notes: null,
            updatedAt: now.toISOString(),
          },
        }),
      }),
    );
    const notApplicableSummary = computeAssessmentCompletionSummary(
      parsedRvtoolsAssessment({
        costRiskAssumptions: assumptionsJson({
          [STORAGE_CONTEXT_JSON_KEY]: {
            version: 1,
            decision: "not_applicable",
            currentStorageType: null,
            targetStoragePreference: null,
            knownConstraints: [],
            notes: null,
            updatedAt: now.toISOString(),
          },
        }),
      }),
    );

    expect(moduleByKey(skippedSummary.modules, "storage_analysis").status).toBe("skipped");
    expect(skippedSummary.limitations.some((item) => item.includes("Storage Analysis was skipped"))).toBe(true);
    expect(skippedSummary.canGenerateReport).toBe(true);
    expect(moduleByKey(notApplicableSummary.modules, "storage_analysis").status).toBe("not_applicable");
    expect(notApplicableSummary.missingRecommended.some((module) => module.key === "storage_analysis")).toBe(false);
  });

  it("marks empty, partial and complete licensing context", () => {
    const emptySummary = computeAssessmentCompletionSummary(baseAssessment());
    const partialSummary = computeAssessmentCompletionSummary(
      baseAssessment({
        costRiskAssumptions: {
          annualVmwareCost: 120_000,
          estimatedProxmoxCost: null,
          vmwareLicenseModel: null,
          currency: "USD",
          years: 3,
          assumptionsJson: null,
        },
      }),
    );
    const completeSummary = computeAssessmentCompletionSummary(
      parsedRvtoolsAssessment({
        costRiskAssumptions: {
          annualVmwareCost: 120_000,
          estimatedProxmoxCost: 35_000,
          vmwareLicenseModel: "subscription",
          vmCount: 42,
          currency: "USD",
          years: 3,
          assumptionsJson: {
            [LICENSING_CONTEXT_JSON_KEY]: {
              version: 1,
              decision: "active",
              renewalTimeframe: "3-6 months",
              includeProxmoxEstimate: "yes",
              notes: "Model amounts in USD.",
              updatedAt: now.toISOString(),
            },
          },
        },
      }),
    );

    expect(moduleByKey(emptySummary.modules, "licensing_cost_exposure").status).toBe("not_started");
    expect(moduleByKey(partialSummary.modules, "licensing_cost_exposure").status).toBe("partial");
    expect(moduleByKey(completeSummary.modules, "licensing_cost_exposure").status).toBe("complete");
  });

  it("keeps report generation available when storage and licensing are skipped", () => {
    const summary = computeAssessmentCompletionSummary(
      parsedRvtoolsAssessment({
        costRiskAssumptions: assumptionsJson({
          [STORAGE_CONTEXT_JSON_KEY]: {
            version: 1,
            decision: "skipped",
            currentStorageType: null,
            targetStoragePreference: null,
            knownConstraints: [],
            notes: null,
            updatedAt: now.toISOString(),
          },
          [LICENSING_CONTEXT_JSON_KEY]: {
            version: 1,
            decision: "skipped",
            renewalTimeframe: null,
            includeProxmoxEstimate: null,
            notes: null,
            updatedAt: now.toISOString(),
          },
        }),
      }),
    );

    expect(moduleByKey(summary.modules, "storage_analysis").status).toBe("skipped");
    expect(moduleByKey(summary.modules, "licensing_cost_exposure").status).toBe("skipped");
    expect(summary.canGenerateReport).toBe(true);
  });

  it("marks submitted Storage Destination Readiness complete without blocking report generation", () => {
    const summary = computeAssessmentCompletionSummary(
      parsedRvtoolsAssessment({
        storageDestinationReadiness: {
          id: "storage-destination-1",
          assessmentId: "assessment-1",
          status: "submitted",
          mode: "ceph_candidate",
          currentStorageType: "vsan",
          targetStoragePreference: "ceph",
          needsHighAvailability: true,
          requiresSharedStorage: true,
          hasProxmoxTarget: false,
          hasPbs: null,
          hasMinimumThreeNodes: null,
          hasDedicatedStorageNetwork: null,
          hasCephExperience: null,
          hasVendorOrPartnerSupport: null,
          estimatedGrowthPercent3y: 30,
          downtimeTolerance: "weekend_window",
          rpoRtoNotes: null,
          sourceNotes: null,
          storageConstraintsJson: ["performance", "backup"],
          assumptionsJson: {
            noCephRecommendationInStorage1: true,
          },
          createdAt: now,
          updatedAt: now,
        },
        storageContext: {
          id: "storage-context-1",
          assessmentId: "assessment-1",
          rawText: "Ceph is being considered, but hardware and networking are not validated.",
          wordCount: 11,
          characterCount: 72,
          status: "submitted",
          planLimitWords: 1500,
          planLimitFiles: 1,
          truncated: false,
          submittedByUserId: "user-1",
          submittedAt: now,
          lastEditedAt: now,
          createdAt: now,
          updatedAt: now,
        },
        storageAnalysis: {
          id: "storage-analysis-1",
          assessmentId: "assessment-1",
          status: "not_started",
          storageReadinessScore: null,
          storageEvidenceConfidence: null,
          cephSuitabilityStatus: "not_evaluated_storage_1",
          interpretedSummary: null,
          missingEvidenceJson: [],
          recommendationsJson: [],
          analysisVersion: "storage-1-foundation",
          generatedAt: null,
          createdAt: now,
          updatedAt: now,
        },
        storageEvidence: [],
      }),
    );

    const storageModule = moduleByKey(summary.modules, "storage_analysis");

    expect(storageModule.status).toBe("complete");
    expect(storageModule.limitationText).toContain("Ceph suitability is not calculated");
    expect(summary.canGenerateReport).toBe(true);
  });

  it("keeps skipped Storage Destination Readiness optional", () => {
    const summary = computeAssessmentCompletionSummary(
      parsedRvtoolsAssessment({
        storageDestinationReadiness: {
          id: "storage-destination-1",
          assessmentId: "assessment-1",
          status: "skipped",
          mode: "agnostic",
          currentStorageType: null,
          targetStoragePreference: null,
          createdAt: now,
          updatedAt: now,
        },
        storageContext: {
          id: "storage-context-1",
          assessmentId: "assessment-1",
          rawText: null,
          wordCount: 0,
          characterCount: 0,
          status: "skipped",
          createdAt: now,
          updatedAt: now,
        },
        storageEvidence: [],
      }),
    );

    expect(moduleByKey(summary.modules, "storage_analysis").status).toBe("skipped");
    expect(summary.canGenerateReport).toBe(true);
  });
});
