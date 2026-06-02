export type StorageReadinessStatus =
  | "storage_validated"
  | "storage_partially_ready"
  | "storage_requires_remediation"
  | "storage_insufficient"
  | "storage_not_validated";

export type StorageReadinessConfidence = "low" | "medium" | "high";

export const STORAGE_SAN_THRESHOLDS = {
  usageWarningPercent: 80,
  usageCriticalPercent: 90,
  freeCapacityCriticalPercent: 10,
  latencyWarningMs: 10,
  latencyCriticalMs: 20,
} as const;

export type StorageSanSummaryForReadiness = {
  arrayCount: number;
  poolCount: number;
  volumeCount: number;
  lunCount: number;
  datastoreMappingCount: number;
  performanceSampleCount: number;
  replicationRecordCount: number;
  snapshotPolicyCount: number;
  targetStorageCandidateCount: number;
  highUsagePoolCount: number;
  criticalUsagePoolCount: number;
  lowFreeCapacityPoolCount: number;
  highLatencySampleCount: number;
  criticalLatencySampleCount: number;
  missingPerformanceWindowCount: number;
  replicationFailureCount: number;
  thinProvisioningRiskCount: number;
  unmappedDatastoreCount: number;
  matchedDatastoreCount: number;
  unmatchedDatastoreCount: number;
  performanceEvidencePresent: boolean;
  replicationEvidencePresent: boolean;
  snapshotEvidencePresent: boolean;
  targetStorageComparisonAvailable: boolean;
};

export type StorageSanReadinessInput = {
  summary: StorageSanSummaryForReadiness;
  parserFailed?: boolean;
  collectorWarningCount?: number;
  collectorErrorCount?: number;
  rvtoolsDatastoreAvailable?: boolean;
  proxmoxTargetEvidenceAvailable?: boolean;
};

export type StorageSanReadinessResult = {
  storageReadinessStatus: StorageReadinessStatus;
  confidence: StorageReadinessConfidence;
  blockingIssues: string[];
  warnings: string[];
  recommendations: string[];
};

export function evaluateStorageSanReadiness(input: StorageSanReadinessInput): StorageSanReadinessResult {
  const { summary } = input;
  const blockingIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const collectorWarnings = input.collectorWarningCount ?? 0;
  const collectorErrors = input.collectorErrorCount ?? 0;
  const hasStorageEvidence =
    summary.arrayCount > 0 ||
    summary.poolCount > 0 ||
    summary.volumeCount > 0 ||
    summary.lunCount > 0 ||
    summary.datastoreMappingCount > 0 ||
    summary.targetStorageCandidateCount > 0;

  if (input.parserFailed || !hasStorageEvidence) {
    return {
      storageReadinessStatus: "storage_not_validated",
      confidence: "low",
      blockingIssues: [
        input.parserFailed
          ? "Storage/SAN evidence could not be parsed."
          : "Storage/SAN evidence does not include arrays, pools, volumes, LUNs, mappings or target candidates.",
      ],
      warnings: [],
      recommendations: [
        "Upload valid Shift Evidence Storage/SAN CSV or JSON evidence before relying on storage readiness.",
      ],
    };
  }

  if (summary.criticalUsagePoolCount > 0) {
    blockingIssues.push("One or more storage pools are critically utilized.");
    recommendations.push("Investigate pools above 90% utilization before migration.");
  }

  if (summary.lowFreeCapacityPoolCount > 0) {
    blockingIssues.push("One or more storage pools have critically low free capacity.");
    recommendations.push("Confirm storage expansion or cleanup before production migration.");
  }

  if (summary.datastoreMappingCount === 0 && input.rvtoolsDatastoreAvailable) {
    blockingIssues.push("RVTools datastore inventory exists but no datastore-to-storage mappings were provided.");
    recommendations.push("Validate datastore-to-LUN mapping before migration planning.");
  }

  if (summary.highUsagePoolCount > 0) {
    warnings.push("One or more storage pools are above warning utilization thresholds.");
    recommendations.push("Investigate pools above 80% utilization before migration.");
  }

  if (summary.criticalLatencySampleCount > 0) {
    warnings.push("Performance evidence includes critical latency samples.");
    recommendations.push("Review high latency storage samples; workload sensitivity may vary.");
  } else if (summary.highLatencySampleCount > 0) {
    warnings.push("Performance evidence includes elevated latency samples.");
    recommendations.push("Avoid relying on performance conclusions without workload-specific validation.");
  }

  if (summary.missingPerformanceWindowCount > 0) {
    warnings.push("Some performance samples do not include a sample window.");
    recommendations.push("Avoid relying on performance conclusions without a sample window.");
  }

  if (summary.replicationFailureCount > 0) {
    warnings.push("Replication evidence includes failed or unhealthy replication records.");
    recommendations.push("Validate replication status for critical workloads.");
  }

  if (summary.thinProvisioningRiskCount > 0) {
    warnings.push("Thin provisioning risk signals were detected.");
    recommendations.push("Thin provisioning risk detected; validate oversubscription and growth trend.");
  }

  if (summary.unmatchedDatastoreCount > 0) {
    warnings.push("Some Storage/SAN datastore mappings could not be matched to RVTools datastores.");
    recommendations.push("Validate datastore-to-LUN mapping before migration planning.");
  }

  if (!input.rvtoolsDatastoreAvailable) {
    warnings.push("Storage/SAN evidence uploaded before RVTools inventory; datastore matching is limited.");
  }

  if (!input.proxmoxTargetEvidenceAvailable) {
    warnings.push("Target storage comparison requires Proxmox Target evidence.");
    recommendations.push("Confirm target storage capacity before production migration.");
  }

  if (!summary.performanceEvidencePresent) {
    warnings.push("Performance evidence is not present.");
  }

  if (!summary.replicationEvidencePresent) {
    warnings.push("Replication evidence is not present.");
  }

  if (!summary.snapshotEvidencePresent) {
    warnings.push("Snapshot policy evidence is not present.");
  }

  if (collectorErrors > 0) {
    warnings.push("Parser reported non-fatal errors; Storage/SAN evidence may be partial.");
  }

  if (collectorWarnings > 0) {
    warnings.push("Parser reported warnings; review Storage/SAN evidence completeness.");
  }

  if (blockingIssues.length > 0) {
    return {
      storageReadinessStatus: "storage_insufficient",
      confidence: "high",
      blockingIssues,
      warnings: [...new Set(warnings)],
      recommendations: [...new Set(recommendations)],
    };
  }

  const remediationRequired =
    summary.highUsagePoolCount > 0 ||
    summary.highLatencySampleCount > 0 ||
    summary.criticalLatencySampleCount > 0 ||
    summary.replicationFailureCount > 0 ||
    summary.thinProvisioningRiskCount > 0 ||
    summary.unmatchedDatastoreCount > 0 ||
    collectorErrors > 0;

  if (remediationRequired) {
    return {
      storageReadinessStatus: "storage_requires_remediation",
      confidence: "medium",
      blockingIssues,
      warnings: [...new Set(warnings)],
      recommendations: [...new Set(recommendations)],
    };
  }

  const strongEvidence =
    summary.poolCount > 0 &&
    summary.datastoreMappingCount > 0 &&
    summary.performanceEvidencePresent &&
    summary.missingPerformanceWindowCount === 0 &&
    summary.replicationEvidencePresent &&
    summary.snapshotEvidencePresent &&
    summary.targetStorageComparisonAvailable &&
    summary.unmatchedDatastoreCount === 0 &&
    collectorWarnings === 0;

  if (strongEvidence) {
    return {
      storageReadinessStatus: "storage_validated",
      confidence: "high",
      blockingIssues,
      warnings: [],
      recommendations: [
        "Storage/SAN evidence is strong enough for preliminary migration planning; validate final capacity and performance before cutover.",
      ],
    };
  }

  return {
    storageReadinessStatus: "storage_partially_ready",
    confidence: "medium",
    blockingIssues,
    warnings: [...new Set(warnings)],
    recommendations: [
      ...new Set([
        ...recommendations,
        "Treat Storage/SAN readiness as preliminary until mapping, target storage and performance windows are complete.",
      ]),
    ],
  };
}
