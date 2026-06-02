import { describe, expect, it } from "vitest";
import {
  evaluateStorageSanReadiness,
  type StorageSanSummaryForReadiness,
} from "../../src/server/evidence/engines/storageSanReadinessEngine";

const strongSummary: StorageSanSummaryForReadiness = {
  arrayCount: 1,
  poolCount: 1,
  volumeCount: 1,
  lunCount: 0,
  datastoreMappingCount: 1,
  performanceSampleCount: 1,
  replicationRecordCount: 1,
  snapshotPolicyCount: 1,
  targetStorageCandidateCount: 1,
  highUsagePoolCount: 0,
  criticalUsagePoolCount: 0,
  lowFreeCapacityPoolCount: 0,
  highLatencySampleCount: 0,
  criticalLatencySampleCount: 0,
  missingPerformanceWindowCount: 0,
  replicationFailureCount: 0,
  thinProvisioningRiskCount: 0,
  unmappedDatastoreCount: 0,
  matchedDatastoreCount: 1,
  unmatchedDatastoreCount: 0,
  performanceEvidencePresent: true,
  replicationEvidencePresent: true,
  snapshotEvidencePresent: true,
  targetStorageComparisonAvailable: true,
};

describe("Storage/SAN readiness engine", () => {
  it("validates storage when mapping, performance, protection and target comparison are present", () => {
    const result = evaluateStorageSanReadiness({
      summary: strongSummary,
      rvtoolsDatastoreAvailable: true,
      proxmoxTargetEvidenceAvailable: true,
    });

    expect(result.storageReadinessStatus).toBe("storage_validated");
    expect(result.confidence).toBe("high");
    expect(result.warnings).toEqual([]);
  });

  it("blocks on critical capacity pressure", () => {
    const result = evaluateStorageSanReadiness({
      summary: {
        ...strongSummary,
        highUsagePoolCount: 1,
        criticalUsagePoolCount: 1,
      },
      rvtoolsDatastoreAvailable: true,
      proxmoxTargetEvidenceAvailable: true,
    });

    expect(result.storageReadinessStatus).toBe("storage_insufficient");
    expect(result.blockingIssues.join(" ")).toContain("critically utilized");
  });

  it("requires remediation for high latency and thin provisioning risk", () => {
    const result = evaluateStorageSanReadiness({
      summary: {
        ...strongSummary,
        highLatencySampleCount: 1,
        thinProvisioningRiskCount: 1,
      },
      rvtoolsDatastoreAvailable: true,
      proxmoxTargetEvidenceAvailable: true,
    });

    expect(result.storageReadinessStatus).toBe("storage_requires_remediation");
    expect(result.warnings.join(" ")).toContain("latency");
    expect(result.warnings.join(" ")).toContain("Thin provisioning");
  });

  it("keeps missing optional target comparison as partial rather than failed", () => {
    const result = evaluateStorageSanReadiness({
      summary: {
        ...strongSummary,
        targetStorageComparisonAvailable: false,
      },
      rvtoolsDatastoreAvailable: true,
      proxmoxTargetEvidenceAvailable: false,
    });

    expect(result.storageReadinessStatus).toBe("storage_partially_ready");
    expect(result.warnings.join(" ")).toContain("Target storage comparison");
  });

  it("does not validate an empty or failed parser result", () => {
    const result = evaluateStorageSanReadiness({
      parserFailed: true,
      summary: {
        ...strongSummary,
        arrayCount: 0,
        poolCount: 0,
        volumeCount: 0,
        datastoreMappingCount: 0,
        targetStorageCandidateCount: 0,
      },
    });

    expect(result.storageReadinessStatus).toBe("storage_not_validated");
    expect(result.confidence).toBe("low");
  });
});
