import { describe, expect, it } from "vitest";
import { extractCephEvidenceInput } from "../../src/server/assessments/cephEvidenceService";
import type { AssessmentDetail } from "../../src/server/assessments/assessmentService";

const now = new Date("2026-05-30T12:00:00.000Z");

function assessment(overrides: Record<string, unknown> = {}): AssessmentDetail {
  return {
    id: "assessment-1",
    workspaceId: "workspace-1",
    storageDestinationReadiness: {
      id: "storage-readiness-1",
      assessmentId: "assessment-1",
      status: "submitted",
      mode: "ceph_candidate",
      currentStorageType: "vsan",
      targetStoragePreference: "ceph",
      needsHighAvailability: true,
      requiresSharedStorage: true,
      hasProxmoxTarget: true,
      hasPbs: null,
      hasMinimumThreeNodes: true,
      hasDedicatedStorageNetwork: null,
      hasCephExperience: null,
      hasVendorOrPartnerSupport: null,
      estimatedGrowthPercent3y: 30,
      downtimeTolerance: "weekend_window",
      rpoRtoNotes: null,
      sourceNotes: null,
      storageConstraintsJson: [],
      assumptionsJson: null,
      createdAt: now,
      updatedAt: now,
    },
    storageAnalysis: {
      id: "storage-analysis-1",
      assessmentId: "assessment-1",
      status: "completed",
      storageReadinessScore: 70,
      storageEvidenceConfidence: 55,
      cephSuitabilityStatus: "deferred_storage_2",
      interpretedSummary: "Ceph is being considered.",
      missingEvidenceJson: [],
      recommendationsJson: {
        interpretedStorageSummary: "Customer wants Ceph.",
        cephSignals: {
          customerInterested: true,
          positiveSignals: ["Ceph is preferred"],
          riskSignals: ["Network unknown"],
          missingEvidence: ["OSD layout"],
          finalDecisionDeferred: true,
        },
        missingEvidence: [{ item: "Network speed", whyItMatters: "Required", priority: "high" }],
        operationalReadinessSignals: [{ signal: "Support unknown", impact: "Risk", confidence: "low" }],
      },
      analysisVersion: "storage-context-intelligence-v1",
      generatedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    storageEvidence: [
      {
        id: "storage-evidence-1",
        assessmentId: "assessment-1",
        evidenceFileId: "evidence-1",
        classification: "network_diagram",
        analysisStatus: "received_not_analyzed",
        includedInStorageAnalysis: true,
        planRestricted: false,
        notes: null,
        createdAt: now,
        updatedAt: now,
        evidenceFile: {
          id: "evidence-1",
          assessmentId: "assessment-1",
          workspaceId: "workspace-1",
          uploadedByUserId: "user-1",
          evidenceType: "other",
          originalFilename: "network.txt",
          storedFilename: "network.txt",
          relativePath: "safe/network.txt",
          fileHash: "hash",
          mimeType: "text/plain",
          sizeBytes: 20,
          processingStatus: "uploaded",
          processingError: null,
          uploadedAt: now,
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
        },
      },
    ],
    parsedDatastores: [
      {
        id: "ds-1",
        assessmentId: "assessment-1",
        evidenceFileId: "evidence-1",
        datastoreName: "vSAN-01",
        datastoreType: "vsan",
        capacityGb: 1_000,
        usedGb: 900,
        freeGb: 100,
        usagePercent: 90,
        riskLevel: "high",
        rawJson: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    parsedSnapshots: [
      {
        id: "snap-1",
        assessmentId: "assessment-1",
        evidenceFileId: "evidence-1",
        vmName: "sql-01",
        snapshotName: "old",
        createdAtSource: now,
        ageDays: 12,
        sizeGb: 20,
        riskLevel: "medium",
        rawJson: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    parsedVMs: [],
    parsedInventorySummaries: [],
    evidenceFiles: [],
    ...overrides,
  } as unknown as AssessmentDetail;
}

describe("Ceph evidence service", () => {
  it("extracts Ceph signals without file contents or raw storage text", () => {
    const input = extractCephEvidenceInput(assessment());

    expect(input.wantsCeph).toBe(true);
    expect(input.hasNetworkEvidence).toBe(true);
    expect(input.rvtoolsDatastoreSummary.highUsageDatastoreCount).toBe(1);
    expect(input.rvtoolsDatastoreSummary.snapshotRisk).toBe(true);
    expect(JSON.stringify(input)).not.toContain("network.txt");
    expect(JSON.stringify(input)).not.toContain("Customer wants Ceph.");
  });
});
