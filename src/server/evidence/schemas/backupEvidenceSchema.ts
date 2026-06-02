import { asArray, asNumber, asString, isRecord } from "./vmwareEnrichmentSchema";

export const BACKUP_EVIDENCE_SCHEMA = "shift-evidence.backup-evidence.v1";
export const BACKUP_EVIDENCE_COLLECTOR_NAME = "shift-veeam-backup-collector";

export type BackupEvidencePayload = {
  schema?: unknown;
  collector?: {
    name?: unknown;
    displayName?: unknown;
    version?: unknown;
    owner?: unknown;
    mode?: unknown;
  };
  source?: Record<string, unknown>;
  safety?: {
    persistentCredentialsStored?: unknown;
    configurationChanged?: unknown;
    rawSecretsIncluded?: unknown;
    networkUploadPerformed?: unknown;
    jobsStarted?: unknown;
    jobsStopped?: unknown;
    restorePerformed?: unknown;
    restorePointsDeleted?: unknown;
  };
  summary?: Record<string, unknown>;
  entities?: {
    jobs?: unknown;
    sessions?: unknown;
    protectedObjects?: unknown;
    restorePoints?: unknown;
    repositories?: unknown;
    backupCopyJobs?: unknown;
  };
  warnings?: unknown;
  errors?: unknown;
};

export function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "enabled"].includes(normalized)) return true;
    if (["false", "0", "no", "disabled"].includes(normalized)) return false;
  }
  return null;
}

export function daysBetweenNow(value: unknown, now = new Date()) {
  const text = asString(value);
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
}

export function percent(used: number, total: number) {
  if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.round((used / total) * 1000) / 10;
}

export function numberValue(value: unknown) {
  return asNumber(value) ?? 0;
}

export function validateBackupEvidenceEnvelope(payload: unknown) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(payload)) {
    return {
      ok: false,
      errors: ["Backup evidence payload must be a JSON object."],
      warnings,
    };
  }

  const typed = payload as BackupEvidencePayload;
  if (typed.schema !== BACKUP_EVIDENCE_SCHEMA) {
    errors.push(`Unsupported or missing schema. Expected ${BACKUP_EVIDENCE_SCHEMA}.`);
  }

  if (!isRecord(typed.collector)) {
    errors.push("Collector metadata is missing.");
  } else {
    if (typed.collector.name !== BACKUP_EVIDENCE_COLLECTOR_NAME) {
      errors.push("Collector name is not recognized as the Shift Evidence Veeam Backup Evidence collector.");
    }
    if (typed.collector.mode !== "read-only") {
      errors.push("Collector mode must be read-only.");
    }
    if (!asString(typed.collector.version)) {
      warnings.push("Collector version is missing.");
    }
  }

  if (!isRecord(typed.safety)) {
    errors.push("Safety metadata is missing.");
  } else {
    const requiredFalseFlags = [
      "persistentCredentialsStored",
      "configurationChanged",
      "rawSecretsIncluded",
      "networkUploadPerformed",
      "jobsStarted",
      "jobsStopped",
      "restorePerformed",
      "restorePointsDeleted",
    ] as const;

    for (const flag of requiredFalseFlags) {
      if (typed.safety[flag] !== false) {
        errors.push(`Safety flag ${flag} must be false.`);
      }
    }
  }

  if (!isRecord(typed.entities)) {
    errors.push("Entities object is missing.");
  } else {
    for (const key of ["jobs", "sessions", "protectedObjects", "restorePoints", "repositories", "backupCopyJobs"] as const) {
      if (typed.entities[key] !== undefined && !Array.isArray(typed.entities[key])) {
        errors.push(`Entities.${key} must be an array when present.`);
      }
    }
  }

  if (!isRecord(typed.summary)) {
    warnings.push("Summary is missing or not an object; parser will compute a safe summary.");
  }

  if (typed.warnings !== undefined && !Array.isArray(typed.warnings)) {
    warnings.push("Warnings are present but not an array; collector warnings will be ignored.");
  }

  if (typed.errors !== undefined && !Array.isArray(typed.errors)) {
    warnings.push("Errors are present but not an array; collector errors will be ignored.");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

export function getArrayEntity(payload: BackupEvidencePayload, key: keyof NonNullable<BackupEvidencePayload["entities"]>) {
  return asArray(payload.entities?.[key]);
}

export function warningObjectsToMessages(value: unknown) {
  return asArray(value)
    .map((item) => {
      if (typeof item === "string") return item;
      if (!isRecord(item)) return null;
      const code = asString(item.code);
      const message = asString(item.message);
      const target = asString(item.target);
      const severity = asString(item.severity);
      if (!message && !code) return null;
      return [code, message, target ? `target=${target}` : null, severity ? `severity=${severity}` : null]
        .filter(Boolean)
        .join(": ");
    })
    .filter((item): item is string => Boolean(item));
}
