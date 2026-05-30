import { describe, expect, it } from "vitest";
import { buildSeniorAdvisorContextPayload } from "../../src/server/advisor/seniorAdvisorContextService";
import type { AssessmentDetail } from "../../src/server/assessments/assessmentService";

const now = new Date("2026-05-30T12:00:00.000Z");

function assessmentFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "assessment-1",
    workspaceId: "workspace-1",
    title: "Advisor context QA",
    clientLabel: "Client",
    status: "draft",
    planLevel: "readiness_report",
    sourcePlatform: "vmware",
    targetPlatform: "proxmox",
    storageReadinessEnabled: true,
    storageReadinessStatus: "selected",
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    workspace: {
      id: "workspace-1",
      name: "Workspace",
      ownerUserId: "user-1",
      companyName: "Client",
      plan: "readiness_report",
      billingStatus: "none",
    },
    modules: [],
    infrastructureInput: null,
    costRiskAssumptions: null,
    preliminaryResult: null,
    licensingAnalysis: {
      status: "needs_input",
      mode: "broad_scenarios",
      financialConfidenceScore: 45,
      financialConfidenceLabel: "limited",
      missingEvidenceJson: [{ item: "VMware renewal quote" }],
      executiveRecommendation: "Validate renewal quote before treating estimates as confirmed.",
    },
    storageReadinessInput: null,
    storageDestinationReadiness: {
      status: "analyzed",
      currentStorageType: "vsan",
      targetStoragePreference: "ceph",
    },
    storageContext: {
      rawText: "RAW STORAGE TEXT SHOULD NOT BE INCLUDED",
      status: "submitted",
      wordCount: 8,
      characterCount: 44,
    },
    storageAnalysis: {
      status: "completed",
      storageReadinessScore: 55,
      storageEvidenceConfidence: 50,
      cephSuitabilityStatus: "ceph_conditional",
      interpretedSummary: "Storage summary only.",
      missingEvidenceJson: [{ item: "OSD layout" }],
      recommendationsJson: {
        cephReadiness: {
          status: "ceph_conditional",
          summary: "Ceph needs network validation.",
          recommendedNextStep: "collect_more_evidence",
        },
      },
    },
    clientContext: {
      rawText: "RAW CLIENT TEXT SHOULD NOT BE INCLUDED",
      status: "submitted",
      wordCount: 8,
      characterCount: 44,
    },
    clientContextAnalysis: {
      status: "completed",
      interpretedSummary: "Client summary only.",
      businessContextConfidence: "medium",
      contextCompletenessScore: 65,
      nextQuestionsJson: [{ question: "Who owns backup validation?" }],
    },
    entitlements: [],
    evidenceFiles: [
      {
        id: "evidence-1",
        evidenceType: "rvtools",
        processingStatus: "parsed",
        deletedAt: null,
        uploadedAt: now,
        originalFilename: "rvtools.xlsx",
        relativePath: "private/secret/path",
      },
    ],
    additionalEvidence: [],
    storageEvidence: [],
    parsedVMs: [],
    parsedHosts: [],
    parsedDatastores: [],
    parsedSnapshots: [],
    parsedInventorySummaries: [],
    riskFindings: [
      {
        severity: "high",
        category: "evidence",
        title: "Backup evidence missing",
        recommendation: "Upload backup evidence.",
      },
    ],
    assessmentScore: {
      readinessScore: 70,
      confidenceScore: 60,
      inventoryScore: 80,
      costRiskScore: null,
      storageScore: 55,
      riskLevel: "medium",
    },
    auditEvents: [],
    aiUsageEvents: [],
    upgradeEvents: [],
    reports: [],
    unlockRequests: [],
    ...overrides,
  } as unknown as AssessmentDetail;
}

describe("senior advisor context service", () => {
  it("builds structured context without raw text or file contents", () => {
    const payload = buildSeniorAdvisorContextPayload(assessmentFixture());
    const serialized = JSON.stringify(payload);

    expect(payload.storage.cephStatus).toBe("ceph_conditional");
    expect(payload.licensing.missingEvidence).toContain("VMware renewal quote");
    expect(payload.evidence.rawFileContentsExcluded).toBe(true);
    expect(serialized).not.toContain("RAW STORAGE TEXT");
    expect(serialized).not.toContain("RAW CLIENT TEXT");
    expect(serialized).not.toContain("private/secret/path");
  });
});
