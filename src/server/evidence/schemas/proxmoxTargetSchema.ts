import { asArray, asNumber, asString, isRecord } from "./vmwareEnrichmentSchema";

export const PROXMOX_TARGET_SCHEMA = "shift-evidence.proxmox-target.v1";
export const PROXMOX_TARGET_COLLECTOR_NAME = "shift-proxmox-target-collector";

export type ProxmoxTargetPayload = {
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
    packagesInstalled?: unknown;
    servicesRestarted?: unknown;
  };
  summary?: Record<string, unknown>;
  entities?: {
    cluster?: unknown;
    nodes?: unknown;
    nodeStatus?: unknown;
    storages?: unknown;
    nodeStorage?: unknown;
    networks?: unknown;
    ha?: unknown;
    resources?: unknown;
    ceph?: unknown;
    backupTargets?: unknown;
  };
  warnings?: unknown;
  errors?: unknown;
};

export function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return null;
}

export function asFiniteNumber(value: unknown) {
  return asNumber(value);
}

export function gbFromBytes(value: unknown) {
  const bytes = asFiniteNumber(value);
  if (bytes === null) return 0;
  return Math.round((bytes / 1024 / 1024 / 1024) * 10) / 10;
}

export function percent(used: number, total: number) {
  if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.round((used / total) * 1000) / 10;
}

export function validateProxmoxTargetEnvelope(payload: unknown) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(payload)) {
    return {
      ok: false,
      errors: ["Proxmox target payload must be a JSON object."],
      warnings,
    };
  }

  const typed = payload as ProxmoxTargetPayload;
  if (typed.schema !== PROXMOX_TARGET_SCHEMA) {
    errors.push(`Unsupported or missing schema. Expected ${PROXMOX_TARGET_SCHEMA}.`);
  }

  if (!isRecord(typed.collector)) {
    errors.push("Collector metadata is missing.");
  } else {
    if (typed.collector.name !== PROXMOX_TARGET_COLLECTOR_NAME) {
      errors.push("Collector name is not recognized as the Shift Evidence Proxmox target collector.");
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
      "packagesInstalled",
      "servicesRestarted",
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
    for (const key of ["nodes", "storages", "nodeStorage", "networks", "resources", "backupTargets"] as const) {
      if (typed.entities[key] !== undefined && !Array.isArray(typed.entities[key])) {
        errors.push(`Entities.${key} must be an array when present.`);
      }
    }

    if (typed.entities.ha !== undefined && !isRecord(typed.entities.ha)) {
      warnings.push("Entities.ha is present but is not an object; HA signals will be limited.");
    }

    if (typed.entities.ceph !== undefined && !isRecord(typed.entities.ceph)) {
      warnings.push("Entities.ceph is present but is not an object; Ceph signals will be limited.");
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

export function getArrayEntity(payload: ProxmoxTargetPayload, key: keyof NonNullable<ProxmoxTargetPayload["entities"]>) {
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
