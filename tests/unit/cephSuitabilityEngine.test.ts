import { describe, expect, it } from "vitest";
import { evaluateCephReadinessFromInput } from "../../src/server/assessments/cephSuitabilityEngine";
import type { CephEvidenceInput } from "../../src/server/assessments/cephReadinessTypes";

function input(overrides: Partial<CephEvidenceInput> = {}): CephEvidenceInput {
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
    currentStorageType: "vmfs",
    estimatedGrowthPercent3y: null,
    downtimeTolerance: "weekend_window",
    rvtoolsDatastoreSummary: {
      totalCapacityGb: 8_000,
      usedGb: 5_000,
      freeGb: 3_000,
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

describe("Ceph suitability engine", () => {
  it("does not recommend Ceph when it is not selected", () => {
    const result = evaluateCephReadinessFromInput(
      input({ wantsCeph: false, targetPreference: "zfs_local" }),
    );

    expect(["ceph_does_not_apply", "ceph_overkill"]).toContain(result.status);
    expect(result.summary).toContain("Ceph");
  });

  it("returns not enough evidence when Ceph is requested without critical facts", () => {
    const result = evaluateCephReadinessFromInput(input());

    expect(result.status).toBe("not_enough_evidence");
    expect(result.missingEvidence.length).toBeGreaterThan(0);
  });

  it("marks Ceph underdesigned when the target has fewer than three nodes", () => {
    const result = evaluateCephReadinessFromInput(input({ hasMinimumThreeNodes: false }));

    expect(result.status).toBe("ceph_underdesigned");
    expect(result.findings.some((finding) => finding.category === "nodes")).toBe(true);
  });

  it("can produce conditional or applies when strong evidence exists", () => {
    const result = evaluateCephReadinessFromInput(
      input({
        hasMinimumThreeNodes: true,
        hasDedicatedStorageNetwork: true,
        hasCephExperience: true,
        hasVendorOrPartnerSupport: true,
        hasPbs: true,
        estimatedGrowthPercent3y: 35,
        hasCephEvidence: true,
        hasNetworkEvidence: true,
        hasHardwareEvidence: true,
        hasBackupEvidence: true,
        hasTargetDesignEvidence: true,
        evidenceFiles: [
          { classification: "ceph_status", analysisStatus: "received_not_analyzed", included: true },
          { classification: "ceph_osd_tree", analysisStatus: "received_not_analyzed", included: true },
          { classification: "network_diagram", analysisStatus: "received_not_analyzed", included: true },
          { classification: "hardware_bom", analysisStatus: "received_not_analyzed", included: true },
          { classification: "pbs_backup_info", analysisStatus: "received_not_analyzed", included: true },
        ],
      }),
    );

    expect(["ceph_applies", "ceph_conditional"]).toContain(result.status);
    expect(result.cephSuitabilityScore).toBeGreaterThanOrEqual(60);
    expect(result.decisionRationale.join(" ")).not.toContain("AI recommended");
  });

  it("can classify small/simple cases as overkill", () => {
    const result = evaluateCephReadinessFromInput(
      input({
        wantsCeph: true,
        targetPreference: "ceph",
        needsHighAvailability: false,
        requiresSharedStorage: false,
        rvtoolsDatastoreSummary: {
          totalCapacityGb: 500,
          usedGb: 200,
          freeGb: 300,
          datastoreCount: 1,
          highUsageDatastoreCount: 0,
          snapshotCount: 0,
          snapshotRisk: false,
          largestVmGb: 80,
          vmCount: 8,
        },
      }),
    );

    expect(["ceph_overkill", "not_enough_evidence"]).toContain(result.status);
  });
});
