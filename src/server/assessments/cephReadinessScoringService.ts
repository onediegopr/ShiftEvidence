import type { CephEvidenceInput, CephReadinessScores } from "./cephReadinessTypes";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function boolScore(value: boolean | null, trueScore: number, falseScore: number, unknownScore: number) {
  if (value === true) return trueScore;
  if (value === false) return falseScore;
  return unknownScore;
}

function hasStrictDowntime(value: string | null) {
  return value === "none" || value === "minutes";
}

function evidenceCount(input: CephEvidenceInput) {
  return input.evidenceFiles.filter((file) => file.included).length;
}

export function calculateCephReadinessScores(input: CephEvidenceInput): CephReadinessScores {
  const activeEvidenceFiles = evidenceCount(input);
  const criticalMissingCount = [
    input.hasMinimumThreeNodes === null,
    input.hasDedicatedStorageNetwork === null,
    !input.hasCephEvidence && !input.hasTargetDesignEvidence,
    input.hasPbs === null && !input.hasBackupEvidence,
    input.hasCephExperience === null && input.hasVendorOrPartnerSupport === null,
  ].filter(Boolean).length;

  const networkReadinessScore = clampScore(
    boolScore(input.hasDedicatedStorageNetwork, 70, 20, 35) +
      (input.hasNetworkEvidence ? 15 : 0) +
      (input.wantsCeph && input.hasDedicatedStorageNetwork === null ? -10 : 0),
  );

  const backupReadinessScore = clampScore(
    boolScore(input.hasPbs, 70, 20, 35) +
      (input.hasBackupEvidence ? 15 : 0) +
      (input.hasPbs === false && input.wantsCeph ? -10 : 0),
  );

  const operationalSkillsScore = clampScore(
    boolScore(input.hasCephExperience, 60, 20, 35) +
      boolScore(input.hasVendorOrPartnerSupport, 25, 0, 10),
  );

  const failureDomainReadinessScore = clampScore(
    boolScore(input.hasMinimumThreeNodes, 50, 10, 30) +
      (input.hasHardwareEvidence ? 15 : 0) +
      (input.hasTargetDesignEvidence ? 15 : 0) +
      (input.hasMinimumThreeNodes === true ? 10 : 0),
  );

  const hasCapacityEvidence =
    input.rvtoolsDatastoreSummary.totalCapacityGb !== null ||
    input.rvtoolsDatastoreSummary.usedGb !== null ||
    input.rvtoolsDatastoreSummary.datastoreCount > 0;
  const capacityFitScore = clampScore(
    (hasCapacityEvidence ? 45 : 25) +
      (input.hasHardwareEvidence ? 15 : 0) +
      (input.hasTargetDesignEvidence ? 15 : 0) +
      (input.estimatedGrowthPercent3y !== null ? 10 : 0) -
      (input.rvtoolsDatastoreSummary.highUsageDatastoreCount > 0 ? 10 : 0) -
      (input.rvtoolsDatastoreSummary.snapshotRisk ? 5 : 0),
  );

  const cephEvidenceConfidenceScore = clampScore(
    20 +
      (input.hasTargetDesignEvidence ? 15 : 0) +
      (input.hasHardwareEvidence ? 15 : 0) +
      (input.hasNetworkEvidence ? 15 : 0) +
      (input.hasCephEvidence ? 15 : 0) +
      (input.hasBackupEvidence || input.hasPbs === true ? 10 : 0) +
      (input.rvtoolsDatastoreSummary.datastoreCount > 0 ? 10 : 0) +
      Math.min(10, activeEvidenceFiles * 2) -
      criticalMissingCount * 8,
  );

  const operationsAverage = (backupReadinessScore + operationalSkillsScore) / 2;
  const infrastructureAverage =
    (capacityFitScore + networkReadinessScore + failureDomainReadinessScore) / 3;
  const cephOperationsReadinessScore = clampScore(
    operationsAverage +
      (input.hasVendorOrPartnerSupport === true ? 5 : 0) -
      (input.hasCephExperience === false && input.hasVendorOrPartnerSupport !== true ? 10 : 0),
  );

  const cephSuitabilityScore = clampScore(
    (input.wantsCeph ? 20 : 5) +
      infrastructureAverage * 0.35 +
      cephOperationsReadinessScore * 0.25 +
      cephEvidenceConfidenceScore * 0.25 +
      (input.needsHighAvailability === true || input.requiresSharedStorage === true ? 10 : 0) +
      (input.hasMinimumThreeNodes === false ? -30 : 0) +
      (input.hasDedicatedStorageNetwork === false ? -20 : 0) +
      (input.hasPbs === false ? -10 : 0) +
      (hasStrictDowntime(input.downtimeTolerance) ? -5 : 0),
  );

  return {
    cephSuitabilityScore,
    cephOperationsReadinessScore,
    cephEvidenceConfidenceScore,
    capacityFitScore,
    networkReadinessScore,
    failureDomainReadinessScore,
    backupReadinessScore,
    operationalSkillsScore,
  };
}
