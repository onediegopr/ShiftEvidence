import { ParsedRiskLevel } from "@prisma/client";
import * as XLSX from "xlsx";
import type {
  ParsedDatastoreRow,
  ParsedHostRow,
  ParsedSnapshotRow,
  ParsedVmRow,
  ParserWarning,
  SheetRole,
} from "./rvtoolsParserTypes";

export function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .replace(/[_\-.]+/g, " ")
    .replace(/[^a-z0-9% ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const VM_FIELD_ALIASES = {
  vmName: ["vm", "name", "vm name", "vmname", "vm name dns", "vm_name"],
  powerState: ["powerstate", "power state", "power state", "power state", "power state"],
  guestOs: ["os", "guest os", "guestos", "guest full name", "guest full"],
  cpuCount: ["cpus", "cpu", "num cpus", "vcpu", "vcpus"],
  memoryMb: ["memory", "memory mb", "memorymb", "memory mib", "memory gb", "memory gb"],
  diskCount: ["disks", "num disks", "disk count"],
  provisionedGb: ["provisioned mib", "provisioned mb", "provisioned gb", "provisioned", "provisioned space"],
  usedGb: ["in use mib", "in use mb", "used gb", "used", "used space"],
  nicCount: ["nics", "num nics", "network adapters"],
  toolsStatus: ["tools", "vmware tools", "tools status"],
  datastoreName: ["datastore", "datastore name"],
  clusterName: ["cluster", "cluster name"],
  hostName: ["host", "host name", "esx host"],
} as const;

const VM_ENRICHMENT_FIELD_ALIASES = {
  vmName: VM_FIELD_ALIASES.vmName,
  networkName: ["network", "network name", "portgroup", "port group"],
  diskCapacityGb: ["capacity", "capacity gb", "capacity mib", "capacity mb", "disk capacity"],
} as const;

const HOST_FIELD_ALIASES = {
  hostName: ["host", "host name", "name", "esx host"],
  clusterName: ["cluster", "cluster name"],
  cpuModel: ["cpu model", "model"],
  cpuSockets: ["# cpu", "cpu sockets", "sockets"],
  cpuCores: ["cores", "cpu cores", "# cores"],
  memoryGb: ["memory", "memory gb", "memory size"],
  version: ["version", "esxi version"],
} as const;

const DATASTORE_FIELD_ALIASES = {
  datastoreName: ["name", "datastore", "datastore name"],
  datastoreType: ["type", "datastore type"],
  capacityGb: ["capacity", "capacity gb", "capacity mib", "capacity mb"],
  usedGb: ["used", "used gb", "used mib", "used mb"],
  freeGb: ["free", "free gb", "free mib", "free mb"],
  usagePercent: ["% used", "used %", "usage %", "percent used"],
  freePercent: ["free %", "% free", "free percent", "percent free"],
} as const;

const SNAPSHOT_FIELD_ALIASES = {
  vmName: ["vm", "vm name", "name"],
  snapshotName: ["snapshot", "snapshot name", "name"],
  createdAtSource: ["created", "create time", "date", "created date"],
  sizeGb: ["size", "size gb", "size mib", "size mb"],
} as const;

function matchesAlias(header: string, alias: string) {
  const normalizedHeader = normalizeHeader(header);
  const normalizedAlias = normalizeHeader(alias);
  return (
    normalizedHeader === normalizedAlias ||
    normalizedHeader.includes(normalizedAlias) ||
    normalizedAlias.includes(normalizedHeader)
  );
}

function findMatchingCell(row: Record<string, unknown>, aliases: readonly string[]) {
  for (const [header, value] of Object.entries(row)) {
    if (aliases.some((alias) => matchesAlias(header, alias))) {
      return { header, value };
    }
  }

  return null;
}

export function getFieldValue(row: Record<string, unknown>, aliases: readonly string[]) {
  return findMatchingCell(row, aliases)?.value ?? null;
}

function getFieldHeader(row: Record<string, unknown>, aliases: readonly string[]) {
  return findMatchingCell(row, aliases)?.header ?? null;
}

function stringify(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  return null;
}

function parseNumberLike(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (value instanceof Date) {
    return null;
  }

  const normalized = String(value)
    .replace(/,/g, "")
    .replace(/[^0-9.+-]+/g, " ")
    .trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized.split(" ")[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseIntegerLike(value: unknown) {
  const parsed = parseNumberLike(value);
  if (parsed === null) {
    return null;
  }

  return Math.trunc(parsed);
}

function parseDateLike(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) {
      return null;
    }

    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, parsed.S));
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function convertToGb(value: unknown, header: string | null) {
  const parsed = parseNumberLike(value);
  if (parsed === null) {
    return null;
  }

  const normalizedHeader = normalizeHeader(header ?? "");

  if (normalizedHeader.includes("tb")) {
    return parsed * 1024;
  }

  if (normalizedHeader.includes("mb") || normalizedHeader.includes("mib")) {
    return parsed / 1024;
  }

  return parsed;
}

function convertToMb(value: unknown, header: string | null) {
  const parsed = parseNumberLike(value);
  if (parsed === null) {
    return null;
  }

  const normalizedHeader = normalizeHeader(header ?? "");

  if (normalizedHeader.includes("gb") || normalizedHeader.includes("gib")) {
    return parsed * 1024;
  }

  if (normalizedHeader.includes("tb")) {
    return parsed * 1024 * 1024;
  }

  return parsed;
}

function computeRiskLevel(score: number): ParsedRiskLevel {
  if (score >= 60) {
    return ParsedRiskLevel.high;
  }

  if (score >= 30) {
    return ParsedRiskLevel.medium;
  }

  return ParsedRiskLevel.low;
}

export function normalizeEntityName(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

function getStringField(row: Record<string, unknown>, aliases: readonly string[]) {
  return stringify(getFieldValue(row, aliases));
}

function mergeDefined<T>(current: T | null, next: T | null) {
  return current !== null && current !== undefined ? current : next;
}

function appendUnique<T>(values: T[], next: T | null | undefined) {
  if (next === null || next === undefined) {
    return values;
  }

  return values.includes(next) ? values : [...values, next];
}

function recomputeVmRisk(row: ParsedVmRow) {
  const risk = parseVmRisk({
    provisionedGb: row.provisionedGb,
    powerState: row.powerState,
    toolsStatus: row.toolsStatus,
  });

  return {
    ...row,
    riskLevel: risk.riskLevel,
    recommendation: risk.recommendation,
  };
}

function parseVmRisk(params: {
  provisionedGb: number | null;
  powerState: string | null;
  toolsStatus: string | null;
}) {
  const warnings: string[] = [];
  let score = 0;

  if (params.provisionedGb !== null && params.provisionedGb > 2048) {
    score = 70;
    warnings.push("Very large VM detected.");
  } else if (params.provisionedGb !== null && params.provisionedGb > 512) {
    score = Math.max(score, 40);
    warnings.push("Large VM detected.");
  }

  const powerState = normalizeHeader(params.powerState ?? "");
  if (powerState.includes("off") || powerState.includes("stopped")) {
    score = Math.max(score, 35);
    warnings.push("Powered-off VM should be reviewed before migration.");
  }

  const toolsStatus = normalizeHeader(params.toolsStatus ?? "");
  if (toolsStatus && (toolsStatus.includes("unknown") || toolsStatus.includes("outdated") || toolsStatus.includes("not installed"))) {
    score = Math.max(score, 30);
    warnings.push("VMware Tools status should be reviewed.");
  }

  return {
    riskLevel: warnings.length > 0 ? computeRiskLevel(score) : null,
    recommendation: warnings.length > 0 ? warnings.join(" ") : null,
  };
}

function parseDatastoreRisk(usagePercent: number | null) {
  if (usagePercent === null) {
    return { riskLevel: null as ParsedRiskLevel | null, recommendation: null as string | null };
  }

  if (usagePercent >= 90) {
    return {
      riskLevel: ParsedRiskLevel.high,
      recommendation: "High datastore usage. Validate free capacity before migration.",
    };
  }

  if (usagePercent >= 80) {
    return {
      riskLevel: ParsedRiskLevel.medium,
      recommendation: "Datastore usage is elevated. Review capacity before migration.",
    };
  }

  return { riskLevel: null, recommendation: null };
}

function parseSnapshotRisk(params: {
  ageDays: number | null;
  sizeGb: number | null;
}) {
  const warnings: string[] = [];
  let score = 0;

  if (params.ageDays !== null && params.ageDays >= 30) {
    score = Math.max(score, 70);
    warnings.push("Old snapshot detected.");
  } else if (params.ageDays !== null && params.ageDays >= 7) {
    score = Math.max(score, 40);
    warnings.push("Snapshot is older than a week.");
  }

  if (params.sizeGb !== null && params.sizeGb > 100) {
    score = Math.max(score, 70);
    warnings.push("Large snapshot size detected.");
  }

  return {
    riskLevel: warnings.length > 0 ? computeRiskLevel(score) : null,
    recommendation: warnings.length > 0 ? warnings.join(" ") : null,
  };
}

export function parseVmRow(
  row: Record<string, unknown>,
  params: {
    assessmentId: string;
    evidenceFileId: string;
    sourceSheetName: string;
    sourceRowNumber: number;
  },
): { row: ParsedVmRow | null; warnings: ParserWarning[] } {
  const warnings: ParserWarning[] = [];
  const vmName = stringify(getFieldValue(row, VM_FIELD_ALIASES.vmName));

  if (!vmName) {
    return {
      row: null,
      warnings: [
        {
          code: "vm_missing_name",
          message: "Skipped VM row without a VM name.",
          sheetName: params.sourceSheetName,
          rowNumber: params.sourceRowNumber,
        },
      ],
    };
  }

  const powerState = stringify(getFieldValue(row, VM_FIELD_ALIASES.powerState));
  const guestOs = stringify(getFieldValue(row, VM_FIELD_ALIASES.guestOs));
  const cpuCount = parseIntegerLike(getFieldValue(row, VM_FIELD_ALIASES.cpuCount));
  const memoryHeader = getFieldHeader(row, VM_FIELD_ALIASES.memoryMb);
  const memoryMb = convertToMb(getFieldValue(row, VM_FIELD_ALIASES.memoryMb), memoryHeader);
  const diskCount = parseIntegerLike(getFieldValue(row, VM_FIELD_ALIASES.diskCount));
  const provisionedHeader = getFieldHeader(row, VM_FIELD_ALIASES.provisionedGb);
  const provisionedGb = convertToGb(getFieldValue(row, VM_FIELD_ALIASES.provisionedGb), provisionedHeader);
  const usedHeader = getFieldHeader(row, VM_FIELD_ALIASES.usedGb);
  const usedGb = convertToGb(getFieldValue(row, VM_FIELD_ALIASES.usedGb), usedHeader);
  const nicCount = parseIntegerLike(getFieldValue(row, VM_FIELD_ALIASES.nicCount));
  const toolsStatus = stringify(getFieldValue(row, VM_FIELD_ALIASES.toolsStatus));
  const datastoreName = stringify(getFieldValue(row, VM_FIELD_ALIASES.datastoreName));
  const clusterName = stringify(getFieldValue(row, VM_FIELD_ALIASES.clusterName));
  const hostName = stringify(getFieldValue(row, VM_FIELD_ALIASES.hostName));
  const risk = parseVmRisk({ provisionedGb, powerState, toolsStatus });

  if (provisionedGb === null) {
    warnings.push({
      code: "vm_missing_provisioned",
      message: `VM "${vmName}" is missing provisioned capacity.`,
      sheetName: params.sourceSheetName,
      rowNumber: params.sourceRowNumber,
    });
  }

  return {
    row: {
      assessmentId: params.assessmentId,
      evidenceFileId: params.evidenceFileId,
      vmName,
      powerState,
      guestOs,
      cpuCount,
      memoryMb,
      diskCount,
      provisionedGb,
      usedGb,
      nicCount,
      toolsStatus,
      datastoreName,
      clusterName,
      hostName,
      riskLevel: risk.riskLevel,
      recommendation: risk.recommendation,
      rawJson: row,
      sourceSheetName: params.sourceSheetName,
      sourceRowNumber: params.sourceRowNumber,
    },
    warnings,
  };
}

export function parseHostRow(
  row: Record<string, unknown>,
  params: {
    assessmentId: string;
    evidenceFileId: string;
    sourceSheetName: string;
    sourceRowNumber: number;
  },
): { row: ParsedHostRow | null; warnings: ParserWarning[] } {
  const warnings: ParserWarning[] = [];
  const hostName = stringify(getFieldValue(row, HOST_FIELD_ALIASES.hostName));

  if (!hostName) {
    return {
      row: null,
      warnings: [
        {
          code: "host_missing_name",
          message: "Skipped host row without a host name.",
          sheetName: params.sourceSheetName,
          rowNumber: params.sourceRowNumber,
        },
      ],
    };
  }

  const clusterName = stringify(getFieldValue(row, HOST_FIELD_ALIASES.clusterName));
  const cpuModel = stringify(getFieldValue(row, HOST_FIELD_ALIASES.cpuModel));
  const cpuSockets = parseIntegerLike(getFieldValue(row, HOST_FIELD_ALIASES.cpuSockets));
  const cpuCores = parseIntegerLike(getFieldValue(row, HOST_FIELD_ALIASES.cpuCores));
  const memoryGbHeader = getFieldHeader(row, HOST_FIELD_ALIASES.memoryGb);
  const memoryGb = convertToGb(getFieldValue(row, HOST_FIELD_ALIASES.memoryGb), memoryGbHeader);
  const version = stringify(getFieldValue(row, HOST_FIELD_ALIASES.version));

  if (cpuSockets === null && cpuCores === null && memoryGb === null) {
    warnings.push({
      code: "host_sparse_row",
      message: `Host "${hostName}" has sparse data.`,
      sheetName: params.sourceSheetName,
      rowNumber: params.sourceRowNumber,
    });
  }

  return {
    row: {
      assessmentId: params.assessmentId,
      evidenceFileId: params.evidenceFileId,
      hostName,
      clusterName,
      cpuModel,
      cpuSockets,
      cpuCores,
      memoryGb,
      version,
      rawJson: row,
      sourceSheetName: params.sourceSheetName,
      sourceRowNumber: params.sourceRowNumber,
    },
    warnings,
  };
}

export function parseDatastoreRow(
  row: Record<string, unknown>,
  params: {
    assessmentId: string;
    evidenceFileId: string;
    sourceSheetName: string;
    sourceRowNumber: number;
  },
): { row: ParsedDatastoreRow | null; warnings: ParserWarning[] } {
  const warnings: ParserWarning[] = [];
  const datastoreName = stringify(getFieldValue(row, DATASTORE_FIELD_ALIASES.datastoreName));

  if (!datastoreName) {
    return {
      row: null,
      warnings: [
        {
          code: "datastore_missing_name",
          message: "Skipped datastore row without a datastore name.",
          sheetName: params.sourceSheetName,
          rowNumber: params.sourceRowNumber,
        },
      ],
    };
  }

  const datastoreType = stringify(getFieldValue(row, DATASTORE_FIELD_ALIASES.datastoreType));
  const capacityHeader = getFieldHeader(row, DATASTORE_FIELD_ALIASES.capacityGb);
  const capacityGb = convertToGb(getFieldValue(row, DATASTORE_FIELD_ALIASES.capacityGb), capacityHeader);
  const usedHeader = getFieldHeader(row, DATASTORE_FIELD_ALIASES.usedGb);
  const directUsedGb = convertToGb(getFieldValue(row, DATASTORE_FIELD_ALIASES.usedGb), usedHeader);
  const freeHeader = getFieldHeader(row, DATASTORE_FIELD_ALIASES.freeGb);
  const freeGb = convertToGb(getFieldValue(row, DATASTORE_FIELD_ALIASES.freeGb), freeHeader);
  const directUsagePercent = parseNumberLike(getFieldValue(row, DATASTORE_FIELD_ALIASES.usagePercent));
  const freePercent = parseNumberLike(getFieldValue(row, DATASTORE_FIELD_ALIASES.freePercent));
  const usedGb =
    directUsedGb ??
    (capacityGb !== null && freeGb !== null && capacityGb >= freeGb
      ? capacityGb - freeGb
      : null);
  const usagePercent =
    directUsagePercent ??
    (freePercent !== null ? Math.max(0, Math.min(100, 100 - freePercent)) : null) ??
    (capacityGb !== null && usedGb !== null && capacityGb > 0
      ? (usedGb / capacityGb) * 100
      : null);
  const risk = parseDatastoreRisk(usagePercent);

  if (usagePercent === null) {
    warnings.push({
      code: "datastore_missing_usage",
      message: `Datastore "${datastoreName}" is missing usage percent.`,
      sheetName: params.sourceSheetName,
      rowNumber: params.sourceRowNumber,
    });
  }

  return {
    row: {
      assessmentId: params.assessmentId,
      evidenceFileId: params.evidenceFileId,
      datastoreName,
      datastoreType,
      capacityGb,
      usedGb,
      freeGb,
      usagePercent,
      riskLevel: risk.riskLevel,
      rawJson: row,
      sourceSheetName: params.sourceSheetName,
      sourceRowNumber: params.sourceRowNumber,
    },
    warnings,
  };
}

export function parseSnapshotRow(
  row: Record<string, unknown>,
  params: {
    assessmentId: string;
    evidenceFileId: string;
    sourceSheetName: string;
    sourceRowNumber: number;
  },
): { row: ParsedSnapshotRow | null; warnings: ParserWarning[] } {
  const warnings: ParserWarning[] = [];
  const vmName = stringify(getFieldValue(row, SNAPSHOT_FIELD_ALIASES.vmName));
  const snapshotName = stringify(getFieldValue(row, SNAPSHOT_FIELD_ALIASES.snapshotName));

  if (!vmName && !snapshotName) {
    return {
      row: null,
      warnings: [
        {
          code: "snapshot_missing_identity",
          message: "Skipped snapshot row without a VM or snapshot name.",
          sheetName: params.sourceSheetName,
          rowNumber: params.sourceRowNumber,
        },
      ],
    };
  }

  const createdAtSource = parseDateLike(getFieldValue(row, SNAPSHOT_FIELD_ALIASES.createdAtSource));
  const sizeHeader = getFieldHeader(row, SNAPSHOT_FIELD_ALIASES.sizeGb);
  const sizeGb = convertToGb(getFieldValue(row, SNAPSHOT_FIELD_ALIASES.sizeGb), sizeHeader);
  const ageDays =
    createdAtSource !== null
      ? Math.max(0, Math.floor((Date.now() - createdAtSource.getTime()) / (24 * 60 * 60 * 1000)))
      : null;
  const risk = parseSnapshotRisk({ ageDays, sizeGb });

  if (createdAtSource === null) {
    warnings.push({
      code: "snapshot_missing_created_at",
      message: `Snapshot "${snapshotName ?? vmName}" is missing a creation date.`,
      sheetName: params.sourceSheetName,
      rowNumber: params.sourceRowNumber,
    });
  }

  return {
    row: {
      assessmentId: params.assessmentId,
      evidenceFileId: params.evidenceFileId,
      vmName,
      snapshotName,
      createdAtSource,
      ageDays,
      sizeGb,
      riskLevel: risk.riskLevel,
      rawJson: row,
      sourceSheetName: params.sourceSheetName,
      sourceRowNumber: params.sourceRowNumber,
    },
    warnings,
  };
}

export function mapRowsByRole(params: {
  role: SheetRole;
  rows: Record<string, unknown>[];
  assessmentId: string;
  evidenceFileId: string;
  sheetName: string;
}) {
  const warnings: ParserWarning[] = [];

  if (params.role === "unknown") {
    return {
      rows: [] as ParsedVmRow[] | ParsedHostRow[] | ParsedDatastoreRow[] | ParsedSnapshotRow[],
      warnings,
    };
  }

  const parsedRows: Array<ParsedVmRow | ParsedHostRow | ParsedDatastoreRow | ParsedSnapshotRow> = [];

  params.rows.forEach((row, index) => {
    const sourceRowNumber = index + 2;
    if (params.role === "vm") {
      const parsed = parseVmRow(row, {
        assessmentId: params.assessmentId,
        evidenceFileId: params.evidenceFileId,
        sourceSheetName: params.sheetName,
        sourceRowNumber,
      });
      if (parsed.row) {
        parsedRows.push(parsed.row);
      }
      warnings.push(...parsed.warnings);
    } else if (params.role === "host") {
      const parsed = parseHostRow(row, {
        assessmentId: params.assessmentId,
        evidenceFileId: params.evidenceFileId,
        sourceSheetName: params.sheetName,
        sourceRowNumber,
      });
      if (parsed.row) {
        parsedRows.push(parsed.row);
      }
      warnings.push(...parsed.warnings);
    } else if (params.role === "datastore") {
      const parsed = parseDatastoreRow(row, {
        assessmentId: params.assessmentId,
        evidenceFileId: params.evidenceFileId,
        sourceSheetName: params.sheetName,
        sourceRowNumber,
      });
      if (parsed.row) {
        parsedRows.push(parsed.row);
      }
      warnings.push(...parsed.warnings);
    } else if (params.role === "snapshot") {
      const parsed = parseSnapshotRow(row, {
        assessmentId: params.assessmentId,
        evidenceFileId: params.evidenceFileId,
        sourceSheetName: params.sheetName,
        sourceRowNumber,
      });
      if (parsed.row) {
        parsedRows.push(parsed.row);
      }
      warnings.push(...parsed.warnings);
    }
  });

  return {
    rows: parsedRows,
    warnings,
  };
}

export function mergeVmEnrichmentRows(params: {
  canonicalVms: ParsedVmRow[];
  rows: Record<string, unknown>[];
  sheetName: string;
}) {
  const warnings: ParserWarning[] = [];
  const byName = new Map(params.canonicalVms.map((vm) => [normalizeEntityName(vm.vmName), vm]));

  params.rows.forEach((row, index) => {
    const sourceRowNumber = index + 2;
    const vmName = getStringField(row, VM_ENRICHMENT_FIELD_ALIASES.vmName);
    const key = normalizeEntityName(vmName);

    if (!key) {
      warnings.push({
        code: "enrichment_missing_vm_name",
        message: `Skipped enrichment row without a VM name in "${params.sheetName}".`,
        sheetName: params.sheetName,
        rowNumber: sourceRowNumber,
      });
      return;
    }

    const canonical = byName.get(key);
    if (!canonical) {
      warnings.push({
        code: "orphan_enrichment_row",
        message: `Skipped enrichment row for VM "${vmName}" because no canonical vInfo row exists.`,
        sheetName: params.sheetName,
        rowNumber: sourceRowNumber,
      });
      return;
    }

    const parsed = parseVmRow(row, {
      assessmentId: canonical.assessmentId,
      evidenceFileId: canonical.evidenceFileId,
      sourceSheetName: params.sheetName,
      sourceRowNumber,
    });
    const parsedRow = parsed.row;
    const metadata = (canonical.rawJson.__enrichment && typeof canonical.rawJson.__enrichment === "object")
      ? canonical.rawJson.__enrichment as Record<string, unknown>
      : {};
    const sheetMetadata = Array.isArray(metadata[params.sheetName])
      ? metadata[params.sheetName] as Array<Record<string, unknown>>
      : [];
    const nextRawJson: Record<string, unknown> = {
      ...canonical.rawJson,
      __enrichment: {
        ...metadata,
        [params.sheetName]: [...sheetMetadata, row],
      },
    };

    const network = getStringField(row, VM_ENRICHMENT_FIELD_ALIASES.networkName);
    const networks = appendUnique(
      Array.isArray(nextRawJson.__networks) ? nextRawJson.__networks as string[] : [],
      network,
    );
    const diskCapacityHeader = getFieldHeader(row, VM_ENRICHMENT_FIELD_ALIASES.diskCapacityGb);
    const diskCapacityGb = convertToGb(
      getFieldValue(row, VM_ENRICHMENT_FIELD_ALIASES.diskCapacityGb),
      diskCapacityHeader,
    );
    const diskRows = params.sheetName.toLowerCase().includes("disk")
      ? Number(nextRawJson.__diskRows ?? 0) + 1
      : Number(nextRawJson.__diskRows ?? 0);
    const totalDiskGb = diskCapacityGb !== null
      ? Number(nextRawJson.__totalDiskGb ?? 0) + diskCapacityGb
      : Number(nextRawJson.__totalDiskGb ?? 0);
    const largestDiskGb = diskCapacityGb !== null
      ? Math.max(Number(nextRawJson.__largestDiskGb ?? 0), diskCapacityGb)
      : Number(nextRawJson.__largestDiskGb ?? 0);

    const merged = recomputeVmRisk({
      ...canonical,
      powerState: mergeDefined(canonical.powerState, parsedRow?.powerState ?? null),
      guestOs: mergeDefined(canonical.guestOs, parsedRow?.guestOs ?? null),
      cpuCount: mergeDefined(canonical.cpuCount, parsedRow?.cpuCount ?? null),
      memoryMb: mergeDefined(canonical.memoryMb, parsedRow?.memoryMb ?? null),
      diskCount: Math.max(canonical.diskCount ?? 0, parsedRow?.diskCount ?? 0, diskRows || 0) || null,
      provisionedGb: mergeDefined(canonical.provisionedGb, parsedRow?.provisionedGb ?? null),
      usedGb: mergeDefined(canonical.usedGb, parsedRow?.usedGb ?? null),
      nicCount: Math.max(canonical.nicCount ?? 0, parsedRow?.nicCount ?? 0, networks.length || 0) || null,
      toolsStatus: mergeDefined(canonical.toolsStatus, parsedRow?.toolsStatus ?? null),
      datastoreName: mergeDefined(canonical.datastoreName, parsedRow?.datastoreName ?? null),
      clusterName: mergeDefined(canonical.clusterName, parsedRow?.clusterName ?? null),
      hostName: mergeDefined(canonical.hostName, parsedRow?.hostName ?? null),
      rawJson: {
        ...nextRawJson,
        __networks: networks,
        __diskRows: diskRows || null,
        __totalDiskGb: totalDiskGb || null,
        __largestDiskGb: largestDiskGb || null,
      },
    });

    Object.assign(canonical, merged);
  });

  return {
    rows: params.canonicalVms,
    warnings,
  };
}

export function inferRoleFromDetection(sheetName: string, headers: string[], rowCount: number): SheetRole {
  const normalizedSheetName = normalizeHeader(sheetName);
  const explicitRoles: Array<{ role: SheetRole; names: string[] }> = [
    { role: "vm", names: ["vinfo"] },
    { role: "vm_enrichment", names: ["vcpu", "vmemory", "vdisks", "vdisk", "vnetwork", "vtools"] },
    { role: "host", names: ["vhosts", "vhost"] },
    { role: "datastore", names: ["vdatastore", "vdatastores"] },
    { role: "snapshot", names: ["vsnapshot", "vsnapshots"] },
    { role: "partial_or_future", names: ["vhealth", "vcluster", "vpartitions", "vpartition"] },
  ];
  const explicit = explicitRoles.find((entry) => entry.names.includes(normalizedSheetName));
  if (explicit) {
    return explicit.role;
  }

  const normalizedHeaders = headers.map(normalizeHeader);
  const aliasGroups: Array<{ role: SheetRole; aliases: readonly string[] }> = [
    { role: "vm", aliases: Object.values(VM_FIELD_ALIASES).flat() },
    { role: "host", aliases: Object.values(HOST_FIELD_ALIASES).flat() },
    { role: "datastore", aliases: Object.values(DATASTORE_FIELD_ALIASES).flat() },
    { role: "snapshot", aliases: Object.values(SNAPSHOT_FIELD_ALIASES).flat() },
  ];

  const scores = aliasGroups.map(({ role, aliases }) => {
    let score = 0;
    for (const alias of aliases) {
      const normalizedAlias = normalizeHeader(alias);
      if (!normalizedAlias) {
        continue;
      }

      if (normalizedSheetName.includes(normalizedAlias)) {
        score += 4;
      }

      if (normalizedHeaders.some((header) => header === normalizedAlias || header.includes(normalizedAlias))) {
        score += 2;
      }
    }

    if (rowCount > 0) {
      score += 1;
    }

    return { role, score };
  });

  const best = scores.reduce((current, candidate) => (candidate.score > current.score ? candidate : current), {
    role: "unknown" as SheetRole,
    score: 0,
  });

  return best.score > 0 ? best.role : "unknown";
}

export function getRoleSpecificWarnings(role: SheetRole, sheetName: string) {
  const warnings: ParserWarning[] = [];
  if (role === "unknown") {
    warnings.push({
      code: "sheet_unrecognized",
      message: `Sheet "${sheetName}" was ignored because it did not look like RVTools inventory data.`,
      sheetName,
    });
  }

  if (role === "partial_or_future") {
    warnings.push({
      code: "sheet_detected_partial_support",
      message: `Sheet "${sheetName}" was detected but is not mapped to a first-class inventory model yet.`,
      sheetName,
    });
  }

  if (role === "vm_enrichment") {
    warnings.push({
      code: "sheet_detected_partial_support",
      message: `Sheet "${sheetName}" was used only to enrich canonical VM rows and does not create standalone VMs.`,
      sheetName,
    });
  }

  return warnings;
}
