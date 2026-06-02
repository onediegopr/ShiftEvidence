import {
  EvidenceModuleConfidenceLevel,
  EvidenceModuleKey,
  EvidenceModuleStatus,
  EvidenceModuleSourceType,
} from "@prisma/client";

export type EvidenceInputType = "manual" | "csv" | "xlsx" | "json" | "collector_output";

export type EvidenceModuleMetadata = {
  key: EvidenceModuleKey;
  displayName: string;
  description: string;
  purpose: string;
  acceptedInputTypes: EvidenceInputType[];
  defaultStatus: EvidenceModuleStatus;
  confidenceImpact: "low" | "medium" | "high";
  reportImpact: string[];
  isOptional: boolean;
  phase: "prepared" | "coming_next" | "future";
  userVisible: boolean;
  adminVisible: boolean;
  preparedMessage: string;
};

export const EVIDENCE_EXPANSION_FLAG = "EVIDENCE_EXPANSION_ENABLED";

export const evidenceModuleCatalog = [
  {
    key: EvidenceModuleKey.vmware_enrichment,
    displayName: "VMware Enrichment",
    description: "Attach VMware metadata such as tags, folders, snapshots, policies and network bindings.",
    purpose: "Improve grouping, ownership, stale VM signals and migration-wave context beyond base RVTools.",
    acceptedInputTypes: ["manual", "csv", "xlsx", "json", "collector_output"],
    defaultStatus: EvidenceModuleStatus.not_provided,
    confidenceImpact: "medium",
    reportImpact: ["Inventory confidence", "Wave planning", "Migration Recommendation Plan"],
    isOptional: true,
    phase: "prepared",
    userVisible: true,
    adminVisible: true,
    preparedMessage: "Download the read-only VMware collector, review the JSON output locally, then upload it here. This does not block RVTools reports.",
  },
  {
    key: EvidenceModuleKey.proxmox_target,
    displayName: "Proxmox Target Validation",
    description: "Attach planned or existing Proxmox target evidence such as nodes, storage, bridges and HA signals.",
    purpose: "Validate whether target capacity and design evidence supports stronger migration recommendations.",
    acceptedInputTypes: ["manual", "csv", "xlsx", "json", "collector_output"],
    defaultStatus: EvidenceModuleStatus.not_provided,
    confidenceImpact: "high",
    reportImpact: ["Target readiness", "Storage readiness", "Migration Recommendation Plan"],
    isOptional: true,
    phase: "prepared",
    userVisible: true,
    adminVisible: true,
    preparedMessage: "Download the read-only Proxmox target collector, review the JSON output locally, then upload it here. Missing target evidence limits confidence only.",
  },
  {
    key: EvidenceModuleKey.backup_evidence,
    displayName: "Backup Evidence",
    description: "Upload or provide backup evidence to validate recoverability before migration.",
    purpose: "Identify protected, stale, failed or unprotected workloads before recommending production waves.",
    acceptedInputTypes: ["manual", "csv", "xlsx", "json", "collector_output"],
    defaultStatus: EvidenceModuleStatus.not_provided,
    confidenceImpact: "high",
    reportImpact: ["Backup Readiness", "Business Continuity Risk", "Migration Recommendation Plan"],
    isOptional: true,
    phase: "prepared",
    userVisible: true,
    adminVisible: true,
    preparedMessage: "Prepared for future backup analysis. The base report remains available without backup evidence.",
  },
  {
    key: EvidenceModuleKey.storage_san,
    displayName: "Storage / SAN Evidence",
    description: "Attach storage exports, volume summaries, SAN/NAS evidence or performance windows.",
    purpose: "Improve capacity, performance and target-storage confidence without replacing the storage readiness tab.",
    acceptedInputTypes: ["manual", "csv", "xlsx", "json", "collector_output"],
    defaultStatus: EvidenceModuleStatus.not_provided,
    confidenceImpact: "high",
    reportImpact: ["Storage Destination Readiness", "Ceph suitability", "Migration Recommendation Plan"],
    isOptional: true,
    phase: "prepared",
    userVisible: true,
    adminVisible: true,
    preparedMessage: "Prepared for future storage/SAN parsing. Existing storage readiness remains unchanged.",
  },
  {
    key: EvidenceModuleKey.application_dependency,
    displayName: "Application Dependencies",
    description: "Attach CMDB, dependency map or application grouping evidence.",
    purpose: "Reduce wave-planning assumptions by distinguishing observed, reported and missing dependencies.",
    acceptedInputTypes: ["manual", "csv", "xlsx", "json", "collector_output"],
    defaultStatus: EvidenceModuleStatus.not_provided,
    confidenceImpact: "high",
    reportImpact: ["Wave planning", "Network risk", "Migration Recommendation Plan"],
    isOptional: true,
    phase: "prepared",
    userVisible: true,
    adminVisible: true,
    preparedMessage: "Prepared for future dependency mapping. No dependency completeness is claimed yet.",
  },
  {
    key: EvidenceModuleKey.migration_plan_readiness,
    displayName: "Migration Plan Readiness",
    description: "Track readiness evidence needed for a premium migration recommendation plan.",
    purpose: "Summarize whether enough optional evidence exists for a defensible recommendation plan.",
    acceptedInputTypes: ["manual", "csv", "xlsx", "json"],
    defaultStatus: EvidenceModuleStatus.not_provided,
    confidenceImpact: "medium",
    reportImpact: ["Migration Recommendation Plan"],
    isOptional: true,
    phase: "future",
    userVisible: true,
    adminVisible: true,
    preparedMessage: "Prepared for the future Migration Recommendation Plan. It is not a production approval.",
  },
] as const satisfies readonly EvidenceModuleMetadata[];

export const evidenceModuleStatuses = Object.values(EvidenceModuleStatus);

export function isEvidenceExpansionEnabled() {
  const raw = process.env[EVIDENCE_EXPANSION_FLAG];
  if (raw === undefined || raw.trim() === "") return true;
  return ["1", "true", "yes", "on"].includes(raw.trim().toLowerCase());
}

export function getEvidenceModuleCatalog() {
  return evidenceModuleCatalog;
}

export function getEvidenceModuleMetadata(moduleKey: EvidenceModuleKey | string) {
  return evidenceModuleCatalog.find((module) => module.key === moduleKey) ?? null;
}

export function assertEvidenceModuleKey(moduleKey: string) {
  const metadata = getEvidenceModuleMetadata(moduleKey);
  if (!metadata) {
    throw new Error("Unsupported evidence module.");
  }

  return metadata.key;
}

export function getDefaultSourceTypeForFilename(filename: string): EvidenceModuleSourceType {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".json")) return EvidenceModuleSourceType.json;
  if (lower.endsWith(".csv")) return EvidenceModuleSourceType.csv;
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return EvidenceModuleSourceType.xlsx;
  return EvidenceModuleSourceType.manual;
}

export function confidenceForModuleStatus(status: EvidenceModuleStatus) {
  switch (status) {
    case EvidenceModuleStatus.parsed:
    case EvidenceModuleStatus.reviewed:
      return EvidenceModuleConfidenceLevel.medium;
    case EvidenceModuleStatus.parsed_with_warnings:
    case EvidenceModuleStatus.uploaded:
      return EvidenceModuleConfidenceLevel.low;
    case EvidenceModuleStatus.failed:
    case EvidenceModuleStatus.skipped:
      return EvidenceModuleConfidenceLevel.none;
    default:
      return EvidenceModuleConfidenceLevel.limited;
  }
}

export function completionForModuleStatus(status: EvidenceModuleStatus) {
  switch (status) {
    case EvidenceModuleStatus.reviewed:
      return 100;
    case EvidenceModuleStatus.parsed:
      return 80;
    case EvidenceModuleStatus.parsed_with_warnings:
      return 60;
    case EvidenceModuleStatus.uploaded:
      return 35;
    case EvidenceModuleStatus.template_downloaded:
    case EvidenceModuleStatus.collector_downloaded:
      return 10;
    case EvidenceModuleStatus.skipped:
      return 0;
    case EvidenceModuleStatus.failed:
      return 0;
    default:
      return 0;
  }
}

export function warningForMissingModule(module: EvidenceModuleMetadata) {
  switch (module.key) {
    case EvidenceModuleKey.backup_evidence:
      return "Backup recoverability is not validated.";
    case EvidenceModuleKey.proxmox_target:
      return "Proxmox target readiness is not validated.";
    case EvidenceModuleKey.application_dependency:
      return "Application dependency coverage is not validated.";
    case EvidenceModuleKey.storage_san:
      return "Storage/SAN capacity and performance evidence is not validated.";
    case EvidenceModuleKey.vmware_enrichment:
      return "VMware metadata enrichment is not available yet.";
    case EvidenceModuleKey.migration_plan_readiness:
      return "Migration recommendation plan evidence is incomplete.";
    default:
      return "Optional evidence is not provided.";
  }
}
