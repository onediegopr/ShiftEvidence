import { describe, expect, it } from "vitest";
import {
  buildCephMissingEvidence,
  generateCephFindings,
  generateCephRemediations,
} from "../../src/server/assessments/cephReadinessFindingsService";
import { calculateCephReadinessScores } from "../../src/server/assessments/cephReadinessScoringService";
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
    currentStorageType: "vsan",
    estimatedGrowthPercent3y: null,
    downtimeTolerance: "hours",
    rvtoolsDatastoreSummary: {
      totalCapacityGb: 5_000,
      usedGb: 4_500,
      freeGb: 500,
      datastoreCount: 3,
      highUsageDatastoreCount: 1,
      snapshotCount: 2,
      snapshotRisk: true,
      largestVmGb: 256,
      vmCount: 24,
    },
    storageContextSignals: {
      cephPositiveSignals: [],
      cephRiskSignals: [],
      missingEvidence: ["Failure domains"],
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

describe("Ceph readiness findings service", () => {
  it("creates missing evidence for nodes, OSDs, network and backup", () => {
    const missing = buildCephMissingEvidence(input());

    expect(missing.some((item) => item.item.includes("node"))).toBe(true);
    expect(missing.some((item) => item.item.includes("OSD"))).toBe(true);
    expect(missing.some((item) => item.item.includes("network"))).toBe(true);
    expect(missing.some((item) => item.item.includes("backup"))).toBe(true);
  });

  it("creates findings when operational skills and backup are missing", () => {
    const evidence = input({ hasCephExperience: false, hasVendorOrPartnerSupport: false, hasPbs: false });
    const scores = calculateCephReadinessScores(evidence);
    const findings = generateCephFindings(evidence, scores);

    expect(findings.some((finding) => finding.category === "operations")).toBe(true);
    expect(findings.some((finding) => finding.category === "backup")).toBe(true);
  });

  it("creates required remediations before Ceph when evidence is weak", () => {
    const evidence = input();
    const scores = calculateCephReadinessScores(evidence);
    const findings = generateCephFindings(evidence, scores);
    const remediations = generateCephRemediations(evidence, scores, findings);

    expect(remediations.some((item) => item.requiredBeforeCeph)).toBe(true);
    expect(remediations.some((item) => item.action.includes("storage network"))).toBe(true);
  });
});
