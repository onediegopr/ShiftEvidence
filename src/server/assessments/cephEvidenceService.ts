import type { AssessmentDetail } from "./assessmentService";
import type {
  CephEvidenceFileSignal,
  CephEvidenceInput,
  CephStorageContextSignals,
} from "./cephReadinessTypes";

type StorageAnalysisRecord = {
  cephSignals?: {
    customerInterested?: unknown;
    positiveSignals?: unknown;
    riskSignals?: unknown;
    missingEvidence?: unknown;
  };
  operationalReadinessSignals?: unknown;
  missingEvidence?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sumNumbers(values: Array<number | null | undefined>) {
  const numbers = values.filter((value): value is number => Number.isFinite(value));
  if (numbers.length === 0) return null;
  return numbers.reduce((total, value) => total + value, 0);
}

function maxNumbers(values: Array<number | null | undefined>) {
  const numbers = values.filter((value): value is number => Number.isFinite(value));
  if (numbers.length === 0) return null;
  return Math.max(...numbers);
}

function getStorageAnalysisRecord(value: unknown): StorageAnalysisRecord | null {
  return isRecord(value) ? (value as StorageAnalysisRecord) : null;
}

function getOperationalSignals(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (isRecord(item) && typeof item.signal === "string") return item.signal;
      return null;
    })
    .filter((item): item is string => Boolean(item));
}

function getMissingEvidenceSignals(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (isRecord(item) && typeof item.item === "string") return item.item;
      return null;
    })
    .filter((item): item is string => Boolean(item));
}

function buildStorageContextSignals(analysis: StorageAnalysisRecord | null): CephStorageContextSignals {
  return {
    cephPositiveSignals: asStringArray(analysis?.cephSignals?.positiveSignals),
    cephRiskSignals: asStringArray(analysis?.cephSignals?.riskSignals),
    missingEvidence: [
      ...asStringArray(analysis?.cephSignals?.missingEvidence),
      ...getMissingEvidenceSignals(analysis?.missingEvidence),
    ].slice(0, 20),
    operationalSignals: getOperationalSignals(analysis?.operationalReadinessSignals).slice(0, 20),
  };
}

function hasClassification(
  evidenceFiles: CephEvidenceFileSignal[],
  classifications: string[],
) {
  return evidenceFiles.some(
    (file) => file.included && classifications.includes(file.classification),
  );
}

function buildEvidenceFileSignals(
  assessment: AssessmentDetail,
): CephEvidenceFileSignal[] {
  return (assessment.storageEvidence ?? [])
    .filter(
      (item) =>
        item.evidenceFile.deletedAt === null &&
        item.evidenceFile.processingStatus !== "deleted" &&
        item.analysisStatus !== "excluded",
    )
    .map((item) => ({
      classification: String(item.classification),
      analysisStatus: String(item.analysisStatus),
      included: item.includedInStorageAnalysis,
    }));
}

function buildRvtoolsDatastoreSummary(assessment: AssessmentDetail) {
  const datastores = assessment.parsedDatastores ?? [];
  const summaries = assessment.parsedInventorySummaries ?? [];
  const parsedVMs = assessment.parsedVMs ?? [];
  const parsedSnapshots = assessment.parsedSnapshots ?? [];
  const summaryCapacity = sumNumbers(summaries.map((summary) => summary.totalProvisionedGb));
  const totalCapacityGb =
    sumNumbers(datastores.map((datastore) => datastore.capacityGb)) ?? summaryCapacity;
  const usedGb =
    sumNumbers(datastores.map((datastore) => datastore.usedGb)) ??
    sumNumbers(summaries.map((summary) => summary.totalUsedGb));
  const freeGb = sumNumbers(datastores.map((datastore) => datastore.freeGb));
  const datastoreCount =
    datastores.length > 0
      ? datastores.length
      : summaries.reduce((total, summary) => total + (summary.datastoreCount ?? 0), 0);
  const highUsageDatastoreCount = datastores.filter((datastore) => {
    const usagePercent = asNumber(datastore.usagePercent);
    if (usagePercent !== null) return usagePercent >= 85;

    const capacityGb = asNumber(datastore.capacityGb);
    const free = asNumber(datastore.freeGb);
    return capacityGb !== null && capacityGb > 0 && free !== null && free / capacityGb <= 0.15;
  }).length;
  const snapshotCount =
    parsedSnapshots.length > 0
      ? parsedSnapshots.length
      : summaries.reduce((total, summary) => total + (summary.snapshotCount ?? 0), 0);
  const oldestSnapshotDays = maxNumbers(summaries.map((summary) => summary.oldestSnapshotDays));
  const snapshotRisk =
    snapshotCount > 0 ||
    (oldestSnapshotDays !== null && oldestSnapshotDays >= 7) ||
    parsedSnapshots.some((snapshot) => (snapshot.ageDays ?? 0) >= 7);
  const largestVmGb =
    maxNumbers(summaries.map((summary) => summary.largestVmGb)) ??
    maxNumbers(parsedVMs.map((vm) => vm.provisionedGb ?? vm.usedGb));
  const vmCount =
    parsedVMs.length > 0
      ? parsedVMs.length
      : summaries.reduce((total, summary) => total + (summary.vmCount ?? 0), 0);

  return {
    totalCapacityGb,
    usedGb,
    freeGb,
    datastoreCount,
    highUsageDatastoreCount,
    snapshotCount,
    snapshotRisk,
    largestVmGb,
    vmCount,
  };
}

export function extractCephEvidenceInput(assessment: AssessmentDetail): CephEvidenceInput {
  const readiness = assessment.storageDestinationReadiness ?? null;
  const storageAnalysis = getStorageAnalysisRecord(assessment.storageAnalysis?.recommendationsJson);
  const evidenceFiles = buildEvidenceFileSignals(assessment);
  const storageContextSignals = buildStorageContextSignals(storageAnalysis);
  const targetPreference = readiness?.targetStoragePreference
    ? String(readiness.targetStoragePreference)
    : null;
  const currentStorageType = readiness?.currentStorageType
    ? String(readiness.currentStorageType)
    : null;
  const cephSignalInterest = storageAnalysis?.cephSignals?.customerInterested === true;
  const hasCephEvidence = hasClassification(evidenceFiles, [
    "ceph_status",
    "ceph_osd_tree",
    "ceph_df",
  ]);
  const hasNetworkEvidence = hasClassification(evidenceFiles, [
    "network_diagram",
    "target_storage_design",
    "architecture_diagram",
  ]);
  const hasHardwareEvidence = hasClassification(evidenceFiles, [
    "hardware_bom",
    "target_storage_design",
    "architecture_diagram",
  ]);
  const hasBackupEvidence =
    hasClassification(evidenceFiles, ["pbs_backup_info"]) ||
    Boolean(readiness?.rpoRtoNotes && readiness.rpoRtoNotes.trim().length > 0);
  const hasTargetDesignEvidence = hasClassification(evidenceFiles, [
    "target_storage_design",
    "architecture_diagram",
    "hardware_bom",
  ]);
  const wantsCeph =
    targetPreference === "ceph" ||
    cephSignalInterest ||
    hasCephEvidence ||
    storageContextSignals.cephPositiveSignals.length > 0 ||
    storageContextSignals.cephRiskSignals.length > 0;

  return {
    wantsCeph,
    targetPreference,
    hasProxmoxTarget: readiness?.hasProxmoxTarget ?? null,
    needsHighAvailability: readiness?.needsHighAvailability ?? null,
    requiresSharedStorage: readiness?.requiresSharedStorage ?? null,
    hasPbs: readiness?.hasPbs ?? null,
    hasMinimumThreeNodes: readiness?.hasMinimumThreeNodes ?? null,
    hasDedicatedStorageNetwork: readiness?.hasDedicatedStorageNetwork ?? null,
    hasCephExperience: readiness?.hasCephExperience ?? null,
    hasVendorOrPartnerSupport: readiness?.hasVendorOrPartnerSupport ?? null,
    currentStorageType,
    estimatedGrowthPercent3y: readiness?.estimatedGrowthPercent3y ?? null,
    downtimeTolerance: readiness?.downtimeTolerance ?? null,
    rvtoolsDatastoreSummary: buildRvtoolsDatastoreSummary(assessment),
    storageContextSignals,
    evidenceFiles,
    hasCephEvidence,
    hasNetworkEvidence,
    hasHardwareEvidence,
    hasBackupEvidence,
    hasTargetDesignEvidence,
  };
}
