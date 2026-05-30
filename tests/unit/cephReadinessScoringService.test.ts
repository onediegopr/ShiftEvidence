import { describe, expect, it } from "vitest";
import { calculateCephReadinessScores } from "../../src/server/assessments/cephReadinessScoringService";
import type { CephEvidenceInput } from "../../src/server/assessments/cephReadinessTypes";

function baseInput(overrides: Partial<CephEvidenceInput> = {}): CephEvidenceInput {
  return {
    wantsCeph: true,
    targetPreference: "ceph",
    hasProxmoxTarget: true,
    needsHighAvailability: true,
    requiresSharedStorage: true,
    hasPbs: null,
    hasMinimumThreeNodes: null,
    hasDedicatedStorageNetwork: null,
    hasCephExperience: null,
    hasVendorOrPartnerSupport: null,
    currentStorageType: "vsan",
    estimatedGrowthPercent3y: null,
    downtimeTolerance: "weekend_window",
    rvtoolsDatastoreSummary: {
      totalCapacityGb: 10_000,
      usedGb: 6_000,
      freeGb: 4_000,
      datastoreCount: 4,
      highUsageDatastoreCount: 0,
      snapshotCount: 0,
      snapshotRisk: false,
      largestVmGb: 512,
      vmCount: 40,
    },
    storageContextSignals: {
      cephPositiveSignals: [],
      cephRiskSignals: [],
      missingEvidence: [],
      operationalSignals: [],
    },
    evidenceFiles: [],
    hasCephEvidence: false,
    hasNetworkEvidence: false,
    hasHardwareEvidence: false,
    hasBackupEvidence: false,
    hasTargetDesignEvidence: false,
    ...overrides,
  };
}

describe("Ceph readiness scoring service", () => {
  it("scores strong Ceph evidence higher than sparse input", () => {
    const sparse = calculateCephReadinessScores(baseInput());
    const strong = calculateCephReadinessScores(
      baseInput({
        hasMinimumThreeNodes: true,
        hasDedicatedStorageNetwork: true,
        hasCephExperience: true,
        hasVendorOrPartnerSupport: true,
        hasPbs: true,
        estimatedGrowthPercent3y: 30,
        hasCephEvidence: true,
        hasNetworkEvidence: true,
        hasHardwareEvidence: true,
        hasBackupEvidence: true,
        hasTargetDesignEvidence: true,
        evidenceFiles: [
          { classification: "ceph_status", analysisStatus: "received_not_analyzed", included: true },
          { classification: "network_diagram", analysisStatus: "received_not_analyzed", included: true },
          { classification: "hardware_bom", analysisStatus: "received_not_analyzed", included: true },
        ],
      }),
    );

    expect(strong.cephSuitabilityScore).toBeGreaterThan(sparse.cephSuitabilityScore);
    expect(strong.cephEvidenceConfidenceScore).toBeGreaterThan(
      sparse.cephEvidenceConfidenceScore,
    );
    expect(strong.networkReadinessScore).toBeGreaterThan(sparse.networkReadinessScore);
  });

  it("lowers network score when dedicated storage network is unknown", () => {
    const unknown = calculateCephReadinessScores(baseInput({ hasDedicatedStorageNetwork: null }));
    const confirmed = calculateCephReadinessScores(
      baseInput({ hasDedicatedStorageNetwork: true, hasNetworkEvidence: true }),
    );

    expect(unknown.networkReadinessScore).toBeLessThan(confirmed.networkReadinessScore);
  });

  it("penalizes missing backup/PBS readiness", () => {
    const missingBackup = calculateCephReadinessScores(baseInput({ hasPbs: false }));
    const backupReady = calculateCephReadinessScores(
      baseInput({ hasPbs: true, hasBackupEvidence: true }),
    );

    expect(missingBackup.backupReadinessScore).toBeLessThan(backupReady.backupReadinessScore);
  });
});
