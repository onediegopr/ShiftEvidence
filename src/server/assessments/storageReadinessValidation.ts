import type { StorageReadinessPlanLimits } from "./storageReadinessPlanLimits";

export const STORAGE_CURRENT_TYPE_OPTIONS = [
  "vmfs",
  "vsan",
  "nfs",
  "san",
  "local_datastore",
  "mixed",
  "unknown",
] as const;

export const STORAGE_TARGET_PREFERENCE_OPTIONS = [
  "zfs_local",
  "nfs",
  "san",
  "ceph",
  "pbs",
  "unknown",
  "not_decided",
] as const;

export const STORAGE_DESTINATION_MODE_OPTIONS = [
  "agnostic",
  "zfs_local",
  "nfs_san",
  "ceph_candidate",
  "unknown",
] as const;

export const STORAGE_CONSTRAINT_OPTIONS = [
  "performance",
  "capacity",
  "replication",
  "backup",
  "vendor_lock_in",
  "latency",
  "operations",
  "compliance",
  "growth",
  "unknown",
] as const;

export const STORAGE_DOWNTIME_TOLERANCE_OPTIONS = [
  "unknown",
  "none",
  "minutes",
  "hours",
  "weekend_window",
  "flexible",
] as const;

export const STORAGE_EVIDENCE_CLASSIFICATIONS = [
  "source_storage_export",
  "target_storage_design",
  "hardware_bom",
  "network_diagram",
  "ceph_status",
  "ceph_osd_tree",
  "ceph_df",
  "pbs_backup_info",
  "vsan_summary",
  "san_nas_export",
  "architecture_diagram",
  "quote_or_bill_of_materials",
  "unknown_needs_review",
] as const;

export const STORAGE_EVIDENCE_ALLOWED_EXTENSIONS = [
  ".txt",
  ".csv",
  ".xlsx",
  ".xls",
  ".pdf",
  ".docx",
  ".png",
  ".jpg",
  ".jpeg",
] as const;

export type StorageCurrentType = (typeof STORAGE_CURRENT_TYPE_OPTIONS)[number];
export type StorageTargetPreference = (typeof STORAGE_TARGET_PREFERENCE_OPTIONS)[number];
export type StorageDestinationMode = (typeof STORAGE_DESTINATION_MODE_OPTIONS)[number];
export type StorageConstraint = (typeof STORAGE_CONSTRAINT_OPTIONS)[number];
export type StorageDowntimeTolerance = (typeof STORAGE_DOWNTIME_TOLERANCE_OPTIONS)[number];
export type StorageEvidenceClassification = (typeof STORAGE_EVIDENCE_CLASSIFICATIONS)[number];

export type ValidatedStorageContextText = {
  rawText: string;
  wordCount: number;
  characterCount: number;
  truncated: false;
};

export type ValidatedStorageReadinessInput = {
  currentStorageType: StorageCurrentType | null;
  targetStoragePreference: StorageTargetPreference | null;
  mode: StorageDestinationMode;
  needsHighAvailability: boolean | null;
  requiresSharedStorage: boolean | null;
  hasProxmoxTarget: boolean | null;
  hasPbs: boolean | null;
  hasMinimumThreeNodes: boolean | null;
  hasDedicatedStorageNetwork: boolean | null;
  hasCephExperience: boolean | null;
  hasVendorOrPartnerSupport: boolean | null;
  estimatedGrowthPercent3y: number | null;
  downtimeTolerance: StorageDowntimeTolerance | null;
  rpoRtoNotes: string | null;
  sourceNotes: string | null;
  storageConstraints: StorageConstraint[];
};

function normalizeEnumValue(value: FormDataEntryValue | string | null | undefined) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeText(value: FormDataEntryValue | string | null | undefined, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) {
    return null;
  }

  if (normalized.length > maxLength) {
    throw new Error(`Storage input is over the ${maxLength.toLocaleString("en-US")} character limit.`);
  }

  return normalized;
}

function normalizeWhitespaceForCount(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeStorageContextRawText(
  value: FormDataEntryValue | string | null | undefined,
) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

export function countStorageContextWords(value: string) {
  const normalized = normalizeWhitespaceForCount(value);
  if (!normalized) {
    return 0;
  }

  return normalized.split(" ").filter(Boolean).length;
}

export function countStorageContextCharacters(value: string) {
  return value.length;
}

export function validateStorageContextText(params: {
  rawText: FormDataEntryValue | string | null | undefined;
  limits: StorageReadinessPlanLimits;
  allowEmpty?: boolean;
}): ValidatedStorageContextText {
  const rawText = normalizeStorageContextRawText(params.rawText);
  const wordCount = countStorageContextWords(rawText);
  const characterCount = countStorageContextCharacters(rawText);

  if (!params.allowEmpty && wordCount === 0) {
    throw new Error("Storage context cannot be empty. Add context or skip this optional module.");
  }

  if (wordCount > params.limits.maxStorageContextWords) {
    throw new Error(
      `Storage context is over the ${params.limits.maxStorageContextWords.toLocaleString(
        "en-US",
      )} word limit for this plan.`,
    );
  }

  if (characterCount > params.limits.maxStorageContextCharacters) {
    throw new Error(
      `Storage context is over the ${params.limits.maxStorageContextCharacters.toLocaleString(
        "en-US",
      )} character limit for this plan.`,
    );
  }

  return {
    rawText,
    wordCount,
    characterCount,
    truncated: false,
  };
}

function parseOptionalEnum<T extends readonly string[]>(
  value: FormDataEntryValue | string | null | undefined,
  allowed: T,
  fieldName: string,
): T[number] | null {
  const normalized = normalizeEnumValue(value);
  if (!normalized) {
    return null;
  }

  if (!allowed.includes(normalized as T[number])) {
    throw new Error(`Unsupported ${fieldName}.`);
  }

  return normalized;
}

function parseBooleanPreference(value: FormDataEntryValue | string | null | undefined) {
  const normalized = normalizeEnumValue(value);
  if (!normalized || normalized === "unknown") {
    return null;
  }

  if (normalized === "true" || normalized === "yes" || normalized === "on") {
    return true;
  }

  if (normalized === "false" || normalized === "no" || normalized === "off") {
    return false;
  }

  throw new Error("Unsupported yes/no storage field.");
}

function parseGrowthPercent(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error("Expected 3-year storage growth must be a whole number.");
  }

  if (parsed < 0 || parsed > 1_000) {
    throw new Error("Expected 3-year storage growth must be between 0 and 1,000 percent.");
  }

  return parsed;
}

function parseConstraints(formData: FormData): StorageConstraint[] {
  const values = formData.getAll("storageConstraints").map((value) => normalizeEnumValue(value));
  const uniqueValues = Array.from(new Set(values.filter(Boolean)));

  for (const value of uniqueValues) {
    if (!STORAGE_CONSTRAINT_OPTIONS.includes(value as StorageConstraint)) {
      throw new Error("Unsupported storage constraint.");
    }
  }

  return uniqueValues as StorageConstraint[];
}

function inferMode(targetStoragePreference: StorageTargetPreference | null): StorageDestinationMode {
  switch (targetStoragePreference) {
    case "zfs_local":
      return "zfs_local";
    case "nfs":
    case "san":
      return "nfs_san";
    case "ceph":
      return "ceph_candidate";
    case "unknown":
    case "not_decided":
    case "pbs":
    case null:
      return "agnostic";
  }
}

export function validateStorageReadinessFormData(formData: FormData): ValidatedStorageReadinessInput {
  const currentStorageType = parseOptionalEnum(
    formData.get("currentStorageType"),
    STORAGE_CURRENT_TYPE_OPTIONS,
    "current storage type",
  ) as StorageCurrentType | null;
  const targetStoragePreference = parseOptionalEnum(
    formData.get("targetStoragePreference"),
    STORAGE_TARGET_PREFERENCE_OPTIONS,
    "target storage preference",
  ) as StorageTargetPreference | null;
  const explicitMode = parseOptionalEnum(
    formData.get("mode"),
    STORAGE_DESTINATION_MODE_OPTIONS,
    "storage destination mode",
  ) as StorageDestinationMode | null;
  const downtimeTolerance = parseOptionalEnum(
    formData.get("downtimeTolerance"),
    STORAGE_DOWNTIME_TOLERANCE_OPTIONS,
    "downtime tolerance",
  ) as StorageDowntimeTolerance | null;

  return {
    currentStorageType,
    targetStoragePreference,
    mode: explicitMode ?? inferMode(targetStoragePreference),
    needsHighAvailability: parseBooleanPreference(formData.get("needsHighAvailability")),
    requiresSharedStorage: parseBooleanPreference(formData.get("requiresSharedStorage")),
    hasProxmoxTarget: parseBooleanPreference(formData.get("hasProxmoxTarget")),
    hasPbs: parseBooleanPreference(formData.get("hasPbs")),
    hasMinimumThreeNodes: parseBooleanPreference(formData.get("hasMinimumThreeNodes")),
    hasDedicatedStorageNetwork: parseBooleanPreference(formData.get("hasDedicatedStorageNetwork")),
    hasCephExperience: parseBooleanPreference(formData.get("hasCephExperience")),
    hasVendorOrPartnerSupport: parseBooleanPreference(formData.get("hasVendorOrPartnerSupport")),
    estimatedGrowthPercent3y: parseGrowthPercent(formData.get("estimatedGrowthPercent3y")),
    downtimeTolerance,
    rpoRtoNotes: normalizeText(formData.get("rpoRtoNotes"), 8_000),
    sourceNotes: normalizeText(formData.get("sourceNotes"), 8_000),
    storageConstraints: parseConstraints(formData),
  };
}

export function parseStorageEvidenceClassification(
  value: FormDataEntryValue | string | null | undefined,
): StorageEvidenceClassification {
  const normalized = normalizeEnumValue(value) || "unknown_needs_review";
  if (!STORAGE_EVIDENCE_CLASSIFICATIONS.includes(normalized as StorageEvidenceClassification)) {
    throw new Error("Unsupported storage evidence classification.");
  }

  return normalized as StorageEvidenceClassification;
}

export function isStorageEvidenceAllowedExtension(extension: string) {
  return STORAGE_EVIDENCE_ALLOWED_EXTENSIONS.includes(
    extension.trim().toLowerCase() as (typeof STORAGE_EVIDENCE_ALLOWED_EXTENSIONS)[number],
  );
}

export function validateStorageEvidenceExtension(extension: string) {
  if (!isStorageEvidenceAllowedExtension(extension)) {
    throw new Error("Unsupported storage evidence file type.");
  }
}

export function validateStorageEvidenceFileLimit(params: {
  existingFileCount: number;
  limits: StorageReadinessPlanLimits;
}) {
  if (params.limits.maxStorageEvidenceFiles <= 0) {
    throw new Error("Storage evidence files are not enabled for this plan.");
  }

  if (params.existingFileCount >= params.limits.maxStorageEvidenceFiles) {
    throw new Error(
      `This plan allows up to ${params.limits.maxStorageEvidenceFiles} storage evidence file${
        params.limits.maxStorageEvidenceFiles === 1 ? "" : "s"
      }.`,
    );
  }
}

export function buildStorageReadinessAuditMetadata(params: {
  status?: string | null;
  currentStorageType?: string | null;
  targetStoragePreference?: string | null;
  mode?: string | null;
  wordCount?: number | null;
  characterCount?: number | null;
  planLimitWords?: number | null;
  planLimitFiles?: number | null;
  classification?: string | null;
  storageEvidenceId?: string | null;
  evidenceFileId?: string | null;
  includedInStorageAnalysis?: boolean | null;
}) {
  return {
    status: params.status ?? null,
    currentStorageType: params.currentStorageType ?? null,
    targetStoragePreference: params.targetStoragePreference ?? null,
    mode: params.mode ?? null,
    wordCount: params.wordCount ?? 0,
    characterCount: params.characterCount ?? 0,
    planLimitWords: params.planLimitWords ?? null,
    planLimitFiles: params.planLimitFiles ?? null,
    classification: params.classification ?? null,
    storageEvidenceId: params.storageEvidenceId ?? null,
    evidenceFileId: params.evidenceFileId ?? null,
    includedInStorageAnalysis: params.includedInStorageAnalysis ?? null,
  };
}
