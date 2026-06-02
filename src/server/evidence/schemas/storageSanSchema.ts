import { asArray, asNumber, asString, isRecord } from "./vmwareEnrichmentSchema";

export const STORAGE_SAN_SCHEMA = "shift-evidence.storage-san.v1";
export const STORAGE_SAN_PARSER_INPUT_OWNER = "Shift Evidence";

export const STORAGE_SAN_RECORD_TYPES = [
  "array",
  "pool",
  "volume",
  "lun",
  "datastore_mapping",
  "performance_sample",
  "replication",
  "snapshot_policy",
  "target_storage_candidate",
] as const;

export const STORAGE_SAN_CSV_COLUMNS = [
  "recordType",
  "sourceSystem",
  "vendor",
  "model",
  "arrayName",
  "poolName",
  "volumeName",
  "lunName",
  "datastoreName",
  "protocol",
  "totalGb",
  "usedGb",
  "freeGb",
  "usagePercent",
  "thinProvisioned",
  "replicated",
  "snapshotEnabled",
  "iopsRead",
  "iopsWrite",
  "latencyMs",
  "throughputMBps",
  "sampleWindow",
  "notes",
  "criticality",
] as const;

export type StorageSanRecordType = typeof STORAGE_SAN_RECORD_TYPES[number];

export type StorageSanPayload = {
  schema?: unknown;
  source?: {
    type?: unknown;
    generatedAt?: unknown;
    owner?: unknown;
    mode?: unknown;
  };
  safety?: {
    persistentCredentialsStored?: unknown;
    rawSecretsIncluded?: unknown;
    networkUploadPerformed?: unknown;
  };
  summary?: Record<string, unknown>;
  entities?: {
    arrays?: Record<string, unknown>[];
    pools?: Record<string, unknown>[];
    volumes?: Record<string, unknown>[];
    luns?: Record<string, unknown>[];
    datastoreMappings?: Record<string, unknown>[];
    performanceSamples?: Record<string, unknown>[];
    replication?: Record<string, unknown>[];
    snapshotPolicies?: Record<string, unknown>[];
    targetStorageCandidates?: Record<string, unknown>[];
  };
  warnings?: unknown;
  errors?: unknown;
};

export type StorageSanCsvRow = Record<string, string>;

export function isStorageSanRecordType(value: unknown): value is StorageSanRecordType {
  const normalized = asString(value);
  return Boolean(normalized && STORAGE_SAN_RECORD_TYPES.includes(normalized as StorageSanRecordType));
}

export function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "si", "sí", "enabled"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "disabled", "unknown"].includes(normalized)) return false;
  }
  return null;
}

export function numberValue(value: unknown) {
  return asNumber(value) ?? 0;
}

export function percent(used: number, total: number) {
  if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.round((used / total) * 1000) / 10;
}

export function normalizeName(value: unknown) {
  const text = asString(value);
  return text ? text.toLowerCase().replace(/\s+/g, " ").trim() : null;
}

export function getArrayEntity(payload: StorageSanPayload, key: keyof NonNullable<StorageSanPayload["entities"]>) {
  return asArray(payload.entities?.[key]);
}

export function validateStorageSanEnvelope(payload: unknown) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(payload)) {
    return {
      ok: false,
      errors: ["Storage/SAN payload must be a JSON object."],
      warnings,
    };
  }

  const typed = payload as StorageSanPayload;
  if (typed.schema !== STORAGE_SAN_SCHEMA) {
    errors.push(`Unsupported or missing schema. Expected ${STORAGE_SAN_SCHEMA}.`);
  }

  if (!isRecord(typed.safety)) {
    errors.push("Safety metadata is missing.");
  } else {
    if (typed.safety.persistentCredentialsStored !== false) {
      errors.push("Safety flag persistentCredentialsStored must be false.");
    }
    if (typed.safety.rawSecretsIncluded !== false) {
      errors.push("Safety flag rawSecretsIncluded must be false.");
    }
    if (typed.safety.networkUploadPerformed !== false) {
      errors.push("Safety flag networkUploadPerformed must be false.");
    }
  }

  if (!isRecord(typed.source)) {
    warnings.push("Source metadata is missing; parser will continue with limited provenance.");
  } else {
    if (typed.source.owner !== STORAGE_SAN_PARSER_INPUT_OWNER) {
      warnings.push("Source owner is not Shift Evidence; ensure the file was normalized through the official template.");
    }
    if (typed.source.mode !== "customer-provided") {
      warnings.push("Source mode is not customer-provided.");
    }
  }

  if (!isRecord(typed.entities)) {
    errors.push("Entities object is missing.");
  } else {
    for (const key of [
      "arrays",
      "pools",
      "volumes",
      "luns",
      "datastoreMappings",
      "performanceSamples",
      "replication",
      "snapshotPolicies",
      "targetStorageCandidates",
    ] as const) {
      if (typed.entities[key] !== undefined && !Array.isArray(typed.entities[key])) {
        errors.push(`Entities.${key} must be an array when present.`);
      }
    }
  }

  if (typed.summary !== undefined && !isRecord(typed.summary)) {
    warnings.push("Summary is present but is not an object; parser will compute a safe summary.");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
