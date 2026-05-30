import { describe, expect, it } from "vitest";
import {
  calculateStorageReadinessScores,
  labelFromStorageScore,
} from "../../src/server/assessments/storageReadinessScoringService";

describe("storage readiness scoring service", () => {
  it("scores richer storage evidence higher than sparse input", () => {
    const sparse = calculateStorageReadinessScores({
      currentStorageType: null,
      targetStoragePreference: null,
      storageContextWordCount: 0,
      storageEvidenceCount: 0,
      parsedDatastoreCount: 0,
    });
    const rich = calculateStorageReadinessScores({
      currentStorageType: "vmfs",
      targetStoragePreference: "zfs_local",
      storageContextWordCount: 400,
      storageEvidenceCount: 2,
      targetDesignEvidenceCount: 1,
      parsedDatastoreCount: 8,
      hasDatastoreCapacity: true,
      hasVmDiskMapping: true,
      snapshotCount: 1,
      hasGrowthExpectation: true,
      needsHighAvailabilityKnown: true,
      requiresSharedStorageKnown: true,
      hasPbsKnown: true,
      hasBackupInfo: true,
      hasNetworkInfo: true,
    });

    expect(rich.scores.storageCompletenessScore).toBeGreaterThan(
      sparse.scores.storageCompletenessScore,
    );
    expect(rich.scores.storageEvidenceConfidence).toBeGreaterThan(
      sparse.scores.storageEvidenceConfidence,
    );
    expect(labelFromStorageScore(rich.scores.storageCompletenessScore)).toBe("high");
  });

  it("raises migration risk when target and backup evidence are missing", () => {
    const lowRisk = calculateStorageReadinessScores({
      currentStorageType: "vmfs",
      targetStoragePreference: "zfs_local",
      hasBackupInfo: true,
      hasPbsKnown: true,
      hasNetworkInfo: true,
    });
    const highRisk = calculateStorageReadinessScores({
      currentStorageType: "vsan",
      targetStoragePreference: null,
      hasBackupInfo: false,
      hasPbsKnown: false,
      sourceStorageComplex: true,
      snapshotCount: 4,
      lowFreeCapacityDatastoreCount: 2,
      downtimeStrict: true,
    });

    expect(highRisk.scores.storageMigrationRisk).toBeGreaterThan(
      lowRisk.scores.storageMigrationRisk,
    );
  });

  it("captures Ceph preference as preliminary confidence only", () => {
    const result = calculateStorageReadinessScores({
      currentStorageType: "vsan",
      targetStoragePreference: "ceph",
      cephInterested: true,
      hasNetworkInfo: false,
      targetDesignEvidenceCount: 0,
    });

    expect(result.scores.preliminaryCephConfidence).not.toBeNull();
    expect(result.missingEvidence.some((item) => item.item.includes("Ceph"))).toBe(true);
  });
});
