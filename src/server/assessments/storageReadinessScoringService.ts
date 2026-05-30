import type { StorageContextIntelligenceResult } from "./storageContextIntelligenceTypes";

export type StorageReadinessScoringInput = {
  currentStorageType?: string | null;
  targetStoragePreference?: string | null;
  storageContextWordCount?: number | null;
  storageEvidenceCount?: number | null;
  targetDesignEvidenceCount?: number | null;
  parsedDatastoreCount?: number | null;
  hasDatastoreCapacity?: boolean;
  hasVmDiskMapping?: boolean;
  snapshotCount?: number | null;
  hasGrowthExpectation?: boolean;
  needsHighAvailabilityKnown?: boolean;
  requiresSharedStorageKnown?: boolean;
  hasPbsKnown?: boolean;
  hasBackupInfo?: boolean;
  hasProxmoxTargetKnown?: boolean;
  hasNetworkInfo?: boolean;
  missingEvidenceCount?: number | null;
  cephInterested?: boolean;
  sourceStorageComplex?: boolean;
  largeVmCount?: number | null;
  lowFreeCapacityDatastoreCount?: number | null;
  downtimeStrict?: boolean;
};

export type StorageReadinessScoringResult = {
  scores: StorageContextIntelligenceResult["scores"];
  confidenceLabels: StorageContextIntelligenceResult["confidenceLabels"];
  missingEvidence: StorageContextIntelligenceResult["missingEvidence"];
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function labelFromStorageScore(score: number) {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  if (score >= 40) return "limited";
  return "low";
}

function meaningfulText(value: string | null | undefined) {
  return Boolean(value && value !== "unknown" && value !== "not_decided");
}

function buildMissingEvidence(input: StorageReadinessScoringInput) {
  const missing: StorageContextIntelligenceResult["missingEvidence"] = [];

  if (!meaningfulText(input.currentStorageType)) {
    missing.push({
      item: "Confirmed source storage type",
      whyItMatters: "The source storage pattern changes migration risk, downtime and validation steps.",
      priority: "high",
    });
  }

  if (!meaningfulText(input.targetStoragePreference)) {
    missing.push({
      item: "Target storage preference or architecture",
      whyItMatters: "A destination pattern is required before storage recommendations can be specific.",
      priority: "high",
    });
  }

  if (!input.hasBackupInfo && !input.hasPbsKnown) {
    missing.push({
      item: "Backup/PBS strategy",
      whyItMatters: "Restore proof and backup design affect migration safety more than raw capacity alone.",
      priority: "high",
    });
  }

  if (!input.hasNetworkInfo) {
    missing.push({
      item: "Storage network design",
      whyItMatters: "Network speed, separation and failure domains are required before evaluating shared storage or Ceph.",
      priority: input.cephInterested ? "high" : "medium",
    });
  }

  if (input.cephInterested && input.targetDesignEvidenceCount === 0) {
    missing.push({
      item: "Ceph node, OSD and failure-domain details",
      whyItMatters: "Ceph suitability cannot be defended without hardware, disk and network evidence.",
      priority: "high",
    });
  }

  return missing.slice(0, 12);
}

export function calculateStorageReadinessScores(
  input: StorageReadinessScoringInput,
): StorageReadinessScoringResult {
  const storageEvidenceCount = Math.max(0, input.storageEvidenceCount ?? 0);
  const parsedDatastoreCount = Math.max(0, input.parsedDatastoreCount ?? 0);
  const contextWords = Math.max(0, input.storageContextWordCount ?? 0);
  const missingEvidence = buildMissingEvidence(input);
  const missingEvidenceCount = input.missingEvidenceCount ?? missingEvidence.length;

  const storageCompletenessScore = clampScore(
    (meaningfulText(input.currentStorageType) ? 15 : 0) +
      (meaningfulText(input.targetStoragePreference) ? 15 : 0) +
      (contextWords >= 50 ? 15 : contextWords > 0 ? 8 : 0) +
      (storageEvidenceCount > 0 ? 10 : 0) +
      (input.hasGrowthExpectation ? 10 : 0) +
      (input.needsHighAvailabilityKnown || input.requiresSharedStorageKnown ? 10 : 0) +
      (input.hasPbsKnown || input.hasBackupInfo ? 10 : 0) +
      (input.cephInterested || input.targetStoragePreference !== "ceph" ? 10 : 0) +
      (parsedDatastoreCount > 0 ? 5 : 0),
  );

  const storageEvidenceConfidence = clampScore(
    (parsedDatastoreCount > 0 ? 25 : 0) +
      (input.hasDatastoreCapacity ? 15 : 0) +
      (input.hasVmDiskMapping ? 15 : 0) +
      ((input.snapshotCount ?? 0) > 0 ? 10 : parsedDatastoreCount > 0 ? 5 : 0) +
      (storageEvidenceCount > 0 ? 15 : 0) +
      ((input.targetDesignEvidenceCount ?? 0) > 0 ? 10 : 0) +
      (contextWords > 0 ? 10 : 0),
  );

  const storageDestinationReadiness = clampScore(
    35 +
      (meaningfulText(input.targetStoragePreference) ? 15 : -10) +
      (input.hasGrowthExpectation ? 10 : -5) +
      (input.needsHighAvailabilityKnown || input.requiresSharedStorageKnown ? 10 : -5) +
      (input.hasBackupInfo || input.hasPbsKnown ? 10 : -10) +
      (input.hasNetworkInfo ? 10 : input.cephInterested ? -10 : -5) +
      Math.min(10, storageEvidenceCount * 3) -
      Math.min(20, missingEvidenceCount * 3),
  );

  const storageMigrationRisk = clampScore(
    20 +
      (input.sourceStorageComplex ? 15 : 0) +
      ((input.snapshotCount ?? 0) > 0 ? 10 : 0) +
      ((input.lowFreeCapacityDatastoreCount ?? 0) > 0 ? 10 : 0) +
      (!input.hasBackupInfo && !input.hasPbsKnown ? 15 : 0) +
      (!meaningfulText(input.targetStoragePreference) ? 15 : 0) +
      (input.downtimeStrict ? 10 : 0) +
      ((input.largeVmCount ?? 0) > 0 ? 5 : 0) +
      Math.min(15, missingEvidenceCount * 2),
  );

  const preliminaryCephConfidence =
    input.cephInterested || input.targetStoragePreference === "ceph"
      ? clampScore(
          20 +
            (input.hasNetworkInfo ? 20 : 0) +
            ((input.targetDesignEvidenceCount ?? 0) > 0 ? 20 : 0) +
            (input.hasBackupInfo || input.hasPbsKnown ? 10 : 0) +
            (storageEvidenceCount > 0 ? 10 : 0) +
            (input.hasGrowthExpectation ? 10 : 0) -
            Math.min(20, missingEvidenceCount * 3),
        )
      : null;

  return {
    scores: {
      storageCompletenessScore,
      storageEvidenceConfidence,
      storageDestinationReadiness,
      storageMigrationRisk,
      preliminaryCephConfidence,
    },
    confidenceLabels: {
      storageContextConfidence: labelFromStorageScore(storageCompletenessScore),
      storageEvidenceConfidenceLabel: labelFromStorageScore(storageEvidenceConfidence),
    },
    missingEvidence,
  };
}
