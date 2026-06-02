export const VMWARE_ENRICHMENT_SCHEMA = "shift-evidence.vmware-enrichment.v1";
export const VMWARE_ENRICHMENT_COLLECTOR_NAME = "shift-vmware-evidence-collector";

export type VmwareEnrichmentVm = {
  name?: unknown;
  id?: unknown;
  instanceUuid?: unknown;
  biosUuid?: unknown;
  powerState?: unknown;
  guestId?: unknown;
  guestFullName?: unknown;
  numCpu?: unknown;
  memoryGB?: unknown;
  provisionedSpaceGB?: unknown;
  usedSpaceGB?: unknown;
  folder?: unknown;
  resourcePool?: unknown;
  vmHost?: unknown;
  cluster?: unknown;
  datastores?: unknown;
  networks?: unknown;
  toolsStatus?: unknown;
  hardwareVersion?: unknown;
  notes?: unknown;
  tags?: unknown;
  customAttributes?: unknown;
  snapshotCount?: unknown;
  newestSnapshotAgeDays?: unknown;
  oldestSnapshotAgeDays?: unknown;
};

export type VmwareEnrichmentPayload = {
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
  };
  summary?: Record<string, unknown>;
  entities?: {
    vms?: unknown;
    snapshots?: unknown;
    tags?: unknown;
    hosts?: unknown;
    clusters?: unknown;
    datastores?: unknown;
    networks?: unknown;
    drsRules?: unknown;
  };
  warnings?: unknown;
  errors?: unknown;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asStringArray(value: unknown) {
  return asArray(value)
    .map(asString)
    .filter((item): item is string => Boolean(item));
}

export function validateVmwareEnrichmentEnvelope(payload: unknown) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(payload)) {
    return {
      ok: false,
      errors: ["VMware enrichment payload must be a JSON object."],
      warnings,
    };
  }

  const typed = payload as VmwareEnrichmentPayload;
  if (typed.schema !== VMWARE_ENRICHMENT_SCHEMA) {
    errors.push(`Unsupported or missing schema. Expected ${VMWARE_ENRICHMENT_SCHEMA}.`);
  }

  if (!isRecord(typed.collector)) {
    errors.push("Collector metadata is missing.");
  } else {
    if (typed.collector.name !== VMWARE_ENRICHMENT_COLLECTOR_NAME) {
      errors.push("Collector name is not recognized as the Shift Evidence VMware collector.");
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
    if (typed.safety.persistentCredentialsStored !== false) {
      errors.push("Safety flag persistentCredentialsStored must be false.");
    }
    if (typed.safety.configurationChanged !== false) {
      errors.push("Safety flag configurationChanged must be false.");
    }
    if (typed.safety.rawSecretsIncluded !== false) {
      errors.push("Safety flag rawSecretsIncluded must be false.");
    }
    if (typed.safety.networkUploadPerformed !== false) {
      errors.push("Safety flag networkUploadPerformed must be false.");
    }
  }

  if (!isRecord(typed.entities)) {
    errors.push("Entities object is missing.");
  } else {
    for (const key of ["vms", "snapshots", "tags", "hosts", "clusters", "datastores", "networks", "drsRules"] as const) {
      if (typed.entities[key] !== undefined && !Array.isArray(typed.entities[key])) {
        errors.push(`Entities.${key} must be an array when present.`);
      }
    }
  }

  if (typed.summary !== undefined && !isRecord(typed.summary)) {
    warnings.push("Summary is present but is not an object; parser will compute its own summary.");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
