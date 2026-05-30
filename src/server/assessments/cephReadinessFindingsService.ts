import type {
  CephEvidenceInput,
  CephMissingEvidence,
  CephReadinessFinding,
  CephReadinessScores,
  CephRemediation,
} from "./cephReadinessTypes";

function pushUniqueMissing(
  items: CephMissingEvidence[],
  item: CephMissingEvidence,
) {
  if (!items.some((existing) => existing.item === item.item)) {
    items.push(item);
  }
}

export function buildCephMissingEvidence(input: CephEvidenceInput): CephMissingEvidence[] {
  const missing: CephMissingEvidence[] = [];

  if (input.hasMinimumThreeNodes === null) {
    pushUniqueMissing(missing, {
      item: "Target Proxmox node count",
      whyItMatters:
        "Ceph requires validated cluster sizing before node quorum and failure tolerance can be assessed.",
      priority: "high",
    });
  }

  if (!input.hasCephEvidence) {
    pushUniqueMissing(missing, {
      item: "OSD count and disk layout",
      whyItMatters:
        "Ceph suitability depends on disk count, media type, journals/DB/WAL layout and raw-to-usable overhead.",
      priority: "high",
    });
  }

  if (input.hasDedicatedStorageNetwork === null && !input.hasNetworkEvidence) {
    pushUniqueMissing(missing, {
      item: "Storage network speed and separation",
      whyItMatters:
        "Ceph performance and stability depend on validated storage networking, not only source datastore evidence.",
      priority: "high",
    });
  }

  if (!input.hasHardwareEvidence && !input.hasTargetDesignEvidence) {
    pushUniqueMissing(missing, {
      item: "Target hardware and failure-domain design",
      whyItMatters:
        "Node, disk, rack/site and failure-domain evidence are required before recommending Ceph.",
      priority: "high",
    });
  }

  if (input.hasPbs === null && !input.hasBackupEvidence) {
    pushUniqueMissing(missing, {
      item: "PBS or backup strategy",
      whyItMatters:
        "Ceph is not a backup system. Restore strategy must be validated before migration execution.",
      priority: "high",
    });
  }

  if (input.hasCephExperience === null && input.hasVendorOrPartnerSupport === null) {
    pushUniqueMissing(missing, {
      item: "Ceph operations owner or support model",
      whyItMatters:
        "Ceph requires operational ownership for upgrades, recovery, alerting and incident response.",
      priority: "medium",
    });
  }

  for (const item of input.storageContextSignals.missingEvidence.slice(0, 6)) {
    pushUniqueMissing(missing, {
      item,
      whyItMatters:
        "Storage Context Intelligence identified this as a missing validation item for storage decisions.",
      priority: item.toLowerCase().includes("network") || item.toLowerCase().includes("node")
        ? "high"
        : "medium",
    });
  }

  return missing.slice(0, 12);
}

export function generateCephFindings(
  input: CephEvidenceInput,
  scores: CephReadinessScores,
): CephReadinessFinding[] {
  const findings: CephReadinessFinding[] = [];

  if (!input.wantsCeph) {
    findings.push({
      severity: "info",
      category: "evidence",
      title: "Ceph is not selected as the current destination preference",
      description:
        "The available storage inputs do not indicate that Ceph is being pursued as the target architecture.",
      impact:
        "Ceph should not be introduced unless the customer is explicitly considering it or target evidence changes.",
      recommendation:
        "Continue evaluating ZFS local, existing NFS/SAN or other target patterns unless Ceph becomes a real option.",
    });
  }

  if (input.hasMinimumThreeNodes === false) {
    findings.push({
      severity: "critical",
      category: "nodes",
      title: "Ceph is underdesigned with fewer than three nodes",
      description:
        "The structured storage input indicates that the target does not have the minimum three-node baseline.",
      impact:
        "A production Ceph design would be fragile and should not be treated as a defensible recommendation.",
      recommendation:
        "Use ZFS/local or existing shared storage, or redesign the target to meet Ceph quorum and failure-domain requirements.",
    });
  } else if (input.hasMinimumThreeNodes === null && input.wantsCeph) {
    findings.push({
      severity: "high",
      category: "nodes",
      title: "Target node count is not validated",
      description:
        "Ceph was selected or detected, but the target node count is not confirmed.",
      impact:
        "The assessment cannot determine quorum, capacity overhead or node failure tolerance.",
      recommendation:
        "Collect target node inventory before treating Ceph as a serious architecture candidate.",
    });
  }

  if (!input.hasCephEvidence && input.wantsCeph) {
    findings.push({
      severity: "high",
      category: "osds",
      title: "OSD and disk layout evidence is missing",
      description:
        "No Ceph status, OSD tree, Ceph DF output or equivalent target disk evidence is available.",
      impact:
        "Raw-to-usable capacity, disk failure behavior and performance profile cannot be validated.",
      recommendation:
        "Provide disk inventory, OSD count, media type and any available Ceph status outputs before final recommendation.",
    });
  }

  if (input.hasDedicatedStorageNetwork === false) {
    findings.push({
      severity: "high",
      category: "network",
      title: "Dedicated storage network is not present",
      description:
        "The structured input indicates that there is no dedicated storage network.",
      impact:
        "Ceph may compete with VM, management or backup traffic and create migration/runtime risk.",
      recommendation:
        "Design and validate dedicated storage networking before considering Ceph for production workloads.",
    });
  } else if (input.hasDedicatedStorageNetwork === null && input.wantsCeph) {
    findings.push({
      severity: "high",
      category: "network",
      title: "Storage network design is unknown",
      description:
        "No confirmed storage network speed, separation or topology evidence is available.",
      impact:
        "Ceph performance cannot be defended without network validation.",
      recommendation:
        "Confirm storage network speed, redundancy, separation and failure behavior.",
    });
  }

  if (input.hasPbs === false && !input.hasBackupEvidence) {
    findings.push({
      severity: "high",
      category: "backup",
      title: "Backup/PBS strategy is missing",
      description:
        "The input indicates that PBS is not available and no backup evidence was classified.",
      impact:
        "Ceph would not replace backup or restore validation, so migration risk remains high.",
      recommendation:
        "Define and test backup/restore strategy before moving production workloads.",
    });
  } else if (input.hasPbs === null && !input.hasBackupEvidence) {
    findings.push({
      severity: "medium",
      category: "backup",
      title: "Backup/PBS strategy is not confirmed",
      description: "No validated PBS or backup evidence is attached.",
      impact:
        "The assessment can discuss storage destination options but cannot validate recovery readiness.",
      recommendation:
        "Attach PBS details, backup exports or restore validation notes before production migration planning.",
    });
  }

  if (input.hasCephExperience === false && input.hasVendorOrPartnerSupport !== true) {
    findings.push({
      severity: "high",
      category: "operations",
      title: "Ceph operational ownership is not ready",
      description:
        "The input indicates no Ceph experience and no confirmed vendor or partner support.",
      impact:
        "Incident response, upgrades and recovery operations may be unsafe without a trained owner.",
      recommendation:
        "Assign a Ceph owner, secure partner support or avoid Ceph until operational readiness improves.",
    });
  }

  if (input.currentStorageType === "vsan") {
    findings.push({
      severity: "medium",
      category: "workload",
      title: "vSAN source requires storage migration validation",
      description:
        "The source storage is vSAN, which often hides policy, replication and dependency details behind VMware abstractions.",
      impact:
        "Storage migration waves and target performance assumptions need explicit validation.",
      recommendation:
        "Validate VM placement, policy dependencies, backup state and datastore utilization before migration execution.",
    });
  }

  if (input.rvtoolsDatastoreSummary.snapshotRisk) {
    findings.push({
      severity: "medium",
      category: "workload",
      title: "Snapshot-heavy source increases storage migration risk",
      description:
        "RVTools evidence indicates snapshots or old snapshot signals in the source environment.",
      impact:
        "Snapshots can inflate migration time, recovery risk and datastore pressure.",
      recommendation:
        "Clean up or validate snapshots before storage migration planning.",
    });
  }

  if (scores.cephSuitabilityScore < 45 && input.wantsCeph) {
    findings.push({
      severity: "medium",
      category: "evidence",
      title: "Ceph suitability is weak with current evidence",
      description:
        "The deterministic score is low because critical architecture evidence is missing or negative.",
      impact:
        "Ceph should not be promoted as the final storage target yet.",
      recommendation:
        "Collect missing evidence and remediate prerequisites before re-running Ceph evaluation.",
    });
  }

  return findings.slice(0, 14);
}

export function generateCephRemediations(
  input: CephEvidenceInput,
  scores: CephReadinessScores,
  findings: CephReadinessFinding[],
): CephRemediation[] {
  const remediations: CephRemediation[] = [];

  if (input.hasMinimumThreeNodes !== true) {
    remediations.push({
      priority: "high",
      action: "Confirm target Proxmox node inventory and minimum three-node baseline.",
      reason: "Ceph cannot be defended without validated quorum and node failure tolerance.",
      requiredBeforeCeph: true,
    });
  }

  if (!input.hasCephEvidence) {
    remediations.push({
      priority: "high",
      action: "Provide disk, OSD and raw-to-usable capacity evidence.",
      reason: "Ceph capacity and performance depend on real disk layout, not source datastore size.",
      requiredBeforeCeph: true,
    });
  }

  if (input.hasDedicatedStorageNetwork !== true || !input.hasNetworkEvidence) {
    remediations.push({
      priority: "high",
      action: "Validate storage network speed, redundancy and separation.",
      reason: "Ceph requires a defensible network design before production use.",
      requiredBeforeCeph: true,
    });
  }

  if (input.hasPbs !== true && !input.hasBackupEvidence) {
    remediations.push({
      priority: "high",
      action: "Define PBS/backup and restore validation before migration.",
      reason: "Ceph is not backup and does not remove recovery requirements.",
      requiredBeforeCeph: true,
    });
  }

  if (input.hasCephExperience !== true && input.hasVendorOrPartnerSupport !== true) {
    remediations.push({
      priority: "medium",
      action: "Assign Ceph operational ownership or partner support.",
      reason: "Ceph operations require skills for recovery, monitoring, upgrades and incident response.",
      requiredBeforeCeph: true,
    });
  }

  if (scores.cephSuitabilityScore >= 55 && findings.length > 0) {
    remediations.push({
      priority: "medium",
      action: "Run a pilot with non-critical VMs before production migration.",
      reason: "A pilot validates storage behavior without treating advisory findings as guarantees.",
      requiredBeforeCeph: false,
    });
  }

  if (!input.wantsCeph) {
    remediations.push({
      priority: "low",
      action: "Keep Ceph out of scope unless target architecture changes.",
      reason: "Ceph should not be introduced by default when it is not part of the target preference.",
      requiredBeforeCeph: false,
    });
  }

  return remediations.slice(0, 12);
}
