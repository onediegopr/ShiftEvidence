export type ProxmoxTargetStatus =
  | "target_validated"
  | "target_partially_ready"
  | "target_insufficient"
  | "target_not_validated"
  | "target_requires_remediation";

export type ProxmoxTargetConfidence = "low" | "medium" | "high";

export type ProxmoxTargetSummaryForReadiness = {
  nodeCount: number;
  onlineNodeCount: number;
  offlineNodeCount: number;
  totalCpuCores: number;
  totalMemoryGb: number;
  usedMemoryGb: number;
  memoryUsagePercent: number;
  storageCount: number;
  sharedStorageCount: number;
  totalStorageGb: number;
  freeStorageGb: number;
  storageUsagePercent: number;
  vmCount: number;
  containerCount: number;
  haConfigured: boolean;
  haResourceCount: number;
  pbsDetected: boolean;
  pbsStorageCount: number;
  cephDetected: boolean;
  cephHealth: string;
  zfsDetected: boolean;
  bridgeCount: number;
  vlanAwareBridgeCount: number;
};

export type ProxmoxTargetReadinessInput = {
  summary: ProxmoxTargetSummaryForReadiness;
  parserFailed?: boolean;
  collectorWarningCount?: number;
  collectorErrorCount?: number;
  rvtoolsComparisonAvailable?: boolean;
};

export type ProxmoxTargetReadinessResult = {
  targetStatus: ProxmoxTargetStatus;
  confidence: ProxmoxTargetConfidence;
  blockingIssues: string[];
  warnings: string[];
  recommendations: string[];
};

function hasUnhealthyCeph(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && normalized !== "unknown" && normalized !== "ok" && normalized !== "health_ok";
}

export function evaluateProxmoxTargetReadiness(
  input: ProxmoxTargetReadinessInput,
): ProxmoxTargetReadinessResult {
  const { summary } = input;
  const blockingIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const collectorErrors = input.collectorErrorCount ?? 0;
  const collectorWarnings = input.collectorWarningCount ?? 0;

  if (input.parserFailed || summary.nodeCount <= 0 || summary.storageCount <= 0) {
    return {
      targetStatus: "target_not_validated",
      confidence: "low",
      blockingIssues: [
        input.parserFailed
          ? "Proxmox target evidence could not be parsed."
          : "Proxmox target evidence does not include enough nodes and storage to validate readiness.",
      ],
      warnings: [],
      recommendations: [
        "Upload a valid Shift Evidence Proxmox Target Collector JSON before relying on target readiness.",
      ],
    };
  }

  if (summary.onlineNodeCount <= 0) {
    blockingIssues.push("No online Proxmox nodes were detected.");
    recommendations.push("Validate node availability before planning migration waves.");
  }

  if (summary.storageCount <= 0 || summary.totalStorageGb <= 0 || summary.freeStorageGb <= 0) {
    blockingIssues.push("Usable target storage was not detected.");
    recommendations.push("Validate Proxmox storage availability before migration.");
  }

  if (summary.bridgeCount <= 0) {
    blockingIssues.push("No usable Proxmox bridges/networks were detected.");
    recommendations.push("Validate bridge and VLAN design before migrating workloads.");
  }

  if (summary.storageUsagePercent >= 90) {
    blockingIssues.push("Target storage usage is critically high.");
    recommendations.push("Storage usage is high; validate expansion before migration.");
  } else if (summary.storageUsagePercent >= 75) {
    warnings.push("Target storage usage is elevated.");
    recommendations.push("Review target storage headroom before production migration.");
  }

  if (summary.memoryUsagePercent >= 90) {
    warnings.push("Target memory usage is high.");
    recommendations.push("Validate memory headroom against migration wave sizing.");
  }

  if (summary.nodeCount === 1) {
    warnings.push("Only one Proxmox node detected; HA target readiness is limited.");
    recommendations.push("Only one node detected; HA migration target is limited.");
  } else if (summary.onlineNodeCount < summary.nodeCount) {
    warnings.push("One or more Proxmox nodes are offline.");
    recommendations.push("Bring all target nodes online before critical migration waves.");
  }

  if (!summary.haConfigured) {
    warnings.push("HA resources were not detected.");
    recommendations.push("Verify HA groups/resources before migrating critical workloads.");
  }

  if (!summary.pbsDetected) {
    warnings.push("PBS or backup-capable storage was not detected.");
    recommendations.push("Add or validate PBS before production migration.");
  }

  if (summary.cephDetected && hasUnhealthyCeph(summary.cephHealth)) {
    warnings.push(`Ceph health is ${summary.cephHealth}.`);
    recommendations.push("Ceph detected but health is not OK; remediate before relying on it.");
  }

  if (summary.bridgeCount > 0 && summary.vlanAwareBridgeCount === 0) {
    warnings.push("No VLAN-aware bridge detected.");
    recommendations.push("No VLAN-aware bridge detected; validate network design.");
  }

  if (collectorErrors > 0) {
    warnings.push("Collector reported non-fatal errors; output may be partial.");
  }

  if (collectorWarnings > 0) {
    warnings.push("Collector reported warnings; review target evidence completeness.");
  }

  if (!input.rvtoolsComparisonAvailable) {
    warnings.push("RVTools sizing comparison is limited or unavailable for this target evidence.");
  }

  if (blockingIssues.length > 0) {
    return {
      targetStatus: "target_insufficient",
      confidence: "high",
      blockingIssues,
      warnings: [...new Set(warnings)],
      recommendations: [...new Set(recommendations)],
    };
  }

  const remediationSignals =
    collectorErrors > 0 ||
    summary.onlineNodeCount < summary.nodeCount ||
    summary.storageUsagePercent >= 75 ||
    (summary.cephDetected && hasUnhealthyCeph(summary.cephHealth));

  if (remediationSignals) {
    return {
      targetStatus: "target_requires_remediation",
      confidence: "medium",
      blockingIssues,
      warnings: [...new Set(warnings)],
      recommendations: [...new Set(recommendations)],
    };
  }

  const strongEvidence =
    summary.onlineNodeCount === summary.nodeCount &&
    summary.nodeCount >= 2 &&
    summary.storageCount > 0 &&
    summary.freeStorageGb > 0 &&
    summary.bridgeCount > 0 &&
    summary.haConfigured &&
    summary.pbsDetected &&
    summary.storageUsagePercent < 75 &&
    collectorWarnings === 0 &&
    input.rvtoolsComparisonAvailable;

  if (strongEvidence) {
    return {
      targetStatus: "target_validated",
      confidence: "high",
      blockingIssues,
      warnings: [],
      recommendations: [
        "Target evidence is strong enough for preliminary migration planning; still validate final sizing before production cutover.",
      ],
    };
  }

  return {
    targetStatus: "target_partially_ready",
    confidence: "medium",
    blockingIssues,
    warnings: [...new Set(warnings)],
    recommendations: [
      ...new Set([
        ...recommendations,
        "Treat this target validation as preliminary until HA, backup, network and sizing evidence are confirmed.",
      ]),
    ],
  };
}
