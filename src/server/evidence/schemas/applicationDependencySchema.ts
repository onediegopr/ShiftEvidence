import { asArray, asNumber, asString, isRecord } from "./vmwareEnrichmentSchema";

export const APPLICATION_DEPENDENCY_SCHEMA = "shift-evidence.application-dependencies.v1";
export const APPLICATION_DEPENDENCY_PARSER_INPUT_OWNER = "Shift Evidence";

export const APPLICATION_DEPENDENCY_RECORD_TYPES = [
  "application",
  "application_component",
  "vm_role",
  "dependency",
  "owner",
  "maintenance_window",
  "migration_group",
  "business_criticality",
  "constraint",
] as const;

export const APPLICATION_DEPENDENCY_CSV_COLUMNS = [
  "recordType",
  "applicationName",
  "applicationId",
  "componentName",
  "vmName",
  "vmInstanceUuid",
  "vmBiosUuid",
  "role",
  "dependencyType",
  "dependsOnVmName",
  "dependsOnApplicationName",
  "ownerName",
  "ownerTeam",
  "criticality",
  "downtimeTolerance",
  "maintenanceWindow",
  "migrationGroup",
  "waveCandidate",
  "source",
  "confidence",
  "notes",
] as const;

export const APPLICATION_DEPENDENCY_CRITICALITIES = ["low", "medium", "high", "critical", "unknown"] as const;
export const APPLICATION_DEPENDENCY_DOWNTIME_TOLERANCES = ["none", "minutes", "hours", "day", "unknown"] as const;
export const APPLICATION_DEPENDENCY_CONFIDENCE_VALUES = ["low", "medium", "high", "unknown"] as const;
export const APPLICATION_DEPENDENCY_SOURCES = [
  "customer_provided",
  "imported",
  "inferred",
  "manual",
  "unknown",
] as const;
export const APPLICATION_DEPENDENCY_DEPENDENCY_TYPES = [
  "app_to_db",
  "frontend_to_backend",
  "backend_to_db",
  "app_to_identity",
  "app_to_file",
  "app_to_queue",
  "app_to_external",
  "monitoring",
  "backup",
  "unknown",
] as const;

export type ApplicationDependencyRecordType = typeof APPLICATION_DEPENDENCY_RECORD_TYPES[number];
export type ApplicationDependencyPayload = {
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
    applications?: Record<string, unknown>[];
    components?: Record<string, unknown>[];
    vmRoles?: Record<string, unknown>[];
    dependencies?: Record<string, unknown>[];
    owners?: Record<string, unknown>[];
    maintenanceWindows?: Record<string, unknown>[];
    migrationGroups?: Record<string, unknown>[];
    criticalities?: Record<string, unknown>[];
    constraints?: Record<string, unknown>[];
  };
  warnings?: unknown;
  errors?: unknown;
};

export type ApplicationDependencyCsvRow = Record<string, string>;

function includesValue(values: readonly string[], value: unknown) {
  const normalized = asString(value)?.toLowerCase();
  return Boolean(normalized && values.includes(normalized));
}

export function isApplicationDependencyRecordType(value: unknown): value is ApplicationDependencyRecordType {
  return includesValue(APPLICATION_DEPENDENCY_RECORD_TYPES, value);
}

export function isApplicationCriticality(value: unknown) {
  return includesValue(APPLICATION_DEPENDENCY_CRITICALITIES, value);
}

export function isDowntimeTolerance(value: unknown) {
  return includesValue(APPLICATION_DEPENDENCY_DOWNTIME_TOLERANCES, value);
}

export function isDependencyType(value: unknown) {
  return includesValue(APPLICATION_DEPENDENCY_DEPENDENCY_TYPES, value);
}

export function isDependencyConfidence(value: unknown) {
  return includesValue(APPLICATION_DEPENDENCY_CONFIDENCE_VALUES, value);
}

export function isDependencySource(value: unknown) {
  return includesValue(APPLICATION_DEPENDENCY_SOURCES, value);
}

export function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "si", "enabled"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "disabled", "unknown"].includes(normalized)) return false;
  }
  return null;
}

export function normalizeName(value: unknown) {
  const text = asString(value);
  return text ? text.toLowerCase().replace(/\s+/g, " ").trim() : null;
}

export function normalizeUuid(value: unknown) {
  const text = asString(value);
  return text ? text.toLowerCase().replace(/[{}]/g, "").trim() : null;
}

export function numberValue(value: unknown) {
  return asNumber(value) ?? 0;
}

export function getArrayEntity(
  payload: ApplicationDependencyPayload,
  key: keyof NonNullable<ApplicationDependencyPayload["entities"]>,
) {
  return asArray(payload.entities?.[key]).filter(isRecord);
}

export function validateApplicationDependencyEnvelope(payload: unknown) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(payload)) {
    return {
      ok: false,
      errors: ["Application Dependency payload must be a JSON object."],
      warnings,
    };
  }

  const typed = payload as ApplicationDependencyPayload;
  if (typed.schema !== APPLICATION_DEPENDENCY_SCHEMA) {
    errors.push(`Unsupported or missing schema. Expected ${APPLICATION_DEPENDENCY_SCHEMA}.`);
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
    if (typed.source.owner !== APPLICATION_DEPENDENCY_PARSER_INPUT_OWNER) {
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
      "applications",
      "components",
      "vmRoles",
      "dependencies",
      "owners",
      "maintenanceWindows",
      "migrationGroups",
      "criticalities",
      "constraints",
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
