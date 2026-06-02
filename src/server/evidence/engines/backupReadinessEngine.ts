export type BackupReadinessStatus =
  | "backup_validated"
  | "backup_partially_ready"
  | "backup_requires_remediation"
  | "backup_insufficient"
  | "backup_not_validated";

export type BackupReadinessConfidence = "low" | "medium" | "high";

export type BackupEvidenceSummaryForReadiness = {
  jobCount: number;
  enabledJobCount: number;
  disabledJobCount: number;
  protectedObjectCount: number;
  matchedVmCount: number;
  unmatchedProtectedObjectCount: number;
  unprotectedVmCount: number;
  restorePointObjectCount: number;
  staleBackupCount: number;
  missingRestorePointCount: number;
  failedJobCount: number;
  warningJobCount: number;
  repositoryCount: number;
  repositoryPressureCount: number;
  backupCopyJobCount: number;
  restoreTestingEvidenceCount: number;
  rvtoolsVmCount: number;
};

export type BackupReadinessInput = {
  summary: BackupEvidenceSummaryForReadiness;
  parserFailed?: boolean;
  collectorWarningCount?: number;
  collectorErrorCount?: number;
  rvtoolsInventoryAvailable?: boolean;
};

export type BackupReadinessResult = {
  backupReadinessStatus: BackupReadinessStatus;
  confidence: BackupReadinessConfidence;
  blockingIssues: string[];
  warnings: string[];
  recommendations: string[];
};

export function evaluateBackupReadiness(input: BackupReadinessInput): BackupReadinessResult {
  const { summary } = input;
  const blockingIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const collectorWarnings = input.collectorWarningCount ?? 0;
  const collectorErrors = input.collectorErrorCount ?? 0;

  if (input.parserFailed || (summary.jobCount === 0 && summary.protectedObjectCount === 0)) {
    return {
      backupReadinessStatus: "backup_not_validated",
      confidence: "low",
      blockingIssues: [
        input.parserFailed
          ? "Backup evidence could not be parsed."
          : "Backup evidence does not include jobs or protected objects.",
      ],
      warnings: [],
      recommendations: [
        "Upload a valid Shift Evidence Veeam Backup Evidence Collector JSON before relying on backup readiness.",
      ],
    };
  }

  if (summary.protectedObjectCount === 0) {
    blockingIssues.push("No protected VMs/objects were detected.");
    recommendations.push("Add backup coverage for unprotected VMs.");
  }

  if (summary.restorePointObjectCount === 0) {
    blockingIssues.push("No restore points were detected.");
    recommendations.push("Validate recent restore points for critical VMs before migration.");
  }

  if (summary.failedJobCount > 0) {
    warnings.push("One or more backup jobs have failed.");
    recommendations.push("Resolve failed backup jobs before production migration waves.");
  }

  if (summary.disabledJobCount > 0) {
    warnings.push("One or more backup jobs are disabled.");
    recommendations.push("Review disabled backup jobs and confirm they are intentionally excluded.");
  }

  if (summary.staleBackupCount > 0) {
    warnings.push("One or more protected objects have stale restore points.");
    recommendations.push("Do not include VMs without recent backup in early production waves.");
  }

  if (summary.missingRestorePointCount > 0) {
    warnings.push("Some protected objects do not have restore point evidence.");
    recommendations.push("Validate recent restore points for critical VMs before migration.");
  }

  if (summary.repositoryPressureCount > 0) {
    warnings.push("One or more backup repositories have low free-space signals.");
    recommendations.push("Validate repository free space and retention before cutover.");
  }

  if (summary.unprotectedVmCount > 0) {
    warnings.push("Some RVTools VMs do not have matching backup evidence.");
    recommendations.push("Add backup coverage for unprotected VMs.");
  }

  if (summary.unmatchedProtectedObjectCount > 0) {
    warnings.push("Some protected objects could not be matched to RVTools inventory.");
  }

  if (!input.rvtoolsInventoryAvailable) {
    warnings.push("RVTools inventory is unavailable; protected/unprotected VM matching is limited.");
  }

  if (summary.backupCopyJobCount === 0) {
    warnings.push("No backup copy job signal was detected.");
  }

  if (summary.restoreTestingEvidenceCount === 0) {
    warnings.push("Backup presence does not prove restore success. Validate restore testing before production migration.");
    recommendations.push("Perform restore test for representative critical workloads.");
  }

  if (collectorErrors > 0) {
    warnings.push("Collector reported non-fatal errors; backup evidence may be partial.");
  }

  if (collectorWarnings > 0) {
    warnings.push("Collector reported warnings; review backup evidence completeness.");
  }

  const rvtoolsCoverageAvailable = input.rvtoolsInventoryAvailable && summary.rvtoolsVmCount > 0;
  const unprotectedRatio = rvtoolsCoverageAvailable ? summary.unprotectedVmCount / summary.rvtoolsVmCount : 0;

  if (rvtoolsCoverageAvailable && unprotectedRatio > 0.5) {
    blockingIssues.push("A majority of RVTools VMs do not have matching backup evidence.");
  }

  if (blockingIssues.length > 0) {
    return {
      backupReadinessStatus: "backup_insufficient",
      confidence: "high",
      blockingIssues,
      warnings: [...new Set(warnings)],
      recommendations: [...new Set(recommendations)],
    };
  }

  const remediationRequired =
    summary.failedJobCount > 0 ||
    summary.staleBackupCount > 0 ||
    summary.repositoryPressureCount > 0 ||
    summary.unprotectedVmCount > 0 ||
    summary.missingRestorePointCount > 0 ||
    collectorErrors > 0;

  if (remediationRequired) {
    return {
      backupReadinessStatus: "backup_requires_remediation",
      confidence: "medium",
      blockingIssues,
      warnings: [...new Set(warnings)],
      recommendations: [...new Set(recommendations)],
    };
  }

  const strongEvidence =
    rvtoolsCoverageAvailable &&
    summary.matchedVmCount >= Math.max(1, summary.rvtoolsVmCount) &&
    summary.restorePointObjectCount >= summary.protectedObjectCount &&
    summary.failedJobCount === 0 &&
    summary.warningJobCount === 0 &&
    summary.repositoryPressureCount === 0 &&
    summary.restoreTestingEvidenceCount > 0 &&
    collectorWarnings === 0;

  if (strongEvidence) {
    return {
      backupReadinessStatus: "backup_validated",
      confidence: "high",
      blockingIssues,
      warnings: [],
      recommendations: [
        "Backup evidence is strong enough for preliminary migration planning; keep restore testing evidence current before cutover.",
      ],
    };
  }

  return {
    backupReadinessStatus: "backup_partially_ready",
    confidence: "medium",
    blockingIssues,
    warnings: [...new Set(warnings)],
    recommendations: [
      ...new Set([
        ...recommendations,
        "Treat backup readiness as preliminary until restore testing and full inventory mapping are confirmed.",
      ]),
    ],
  };
}
