import { EvidenceModuleKey, EvidenceModuleSourceType, EvidenceParseResultStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { readEvidenceFile } from "../localStorageService";
import type { EvidenceParser, EvidenceParserInput, EvidenceParserResult } from "../evidenceParserRegistry";
import { asArray, asNumber, asString, isRecord } from "../schemas/vmwareEnrichmentSchema";
import {
  PROXMOX_TARGET_SCHEMA,
  asBoolean,
  gbFromBytes,
  getArrayEntity,
  percent,
  validateProxmoxTargetEnvelope,
  warningObjectsToMessages,
  type ProxmoxTargetPayload,
} from "../schemas/proxmoxTargetSchema";
import {
  evaluateProxmoxTargetReadiness,
  type ProxmoxTargetSummaryForReadiness,
} from "../engines/proxmoxTargetReadinessEngine";

export const PROXMOX_TARGET_PARSER_KEY = "proxmox-target-parser-v1";
export const PROXMOX_TARGET_PARSER_VERSION = "1.0.0";

const SECRET_PATTERNS = [
  { code: "password_pattern", regex: /password\s*=/i, severity: "critical" },
  { code: "passwd_pattern", regex: /\bpasswd\b/i, severity: "critical" },
  { code: "secret_pattern", regex: /\bsecret\b/i, severity: "critical" },
  { code: "token_pattern", regex: /\btoken\b/i, severity: "critical" },
  { code: "api_key_pattern", regex: /api[_-]?key/i, severity: "critical" },
  { code: "private_key_pattern", regex: /BEGIN\s+PRIVATE\s+KEY/i, severity: "critical" },
  { code: "bearer_pattern", regex: /Authorization\s*:\s*Bearer/i, severity: "critical" },
  { code: "pve_api_token_pattern", regex: /PVEAPIToken\s*=/i, severity: "critical" },
  { code: "ticket_pattern", regex: /\bticket\s*=/i, severity: "critical" },
  { code: "connection_string_pattern", regex: /(postgresql|mysql|mongodb|sqlserver):\/\//i, severity: "critical" },
];

function scanForSecretPatterns(value: unknown, path = "$", findings: Array<{ code: string; path: string }> = []) {
  if (typeof value === "string") {
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.regex.test(value)) {
        findings.push({ code: pattern.code, path });
      }
    }
    return findings;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForSecretPatterns(item, `${path}[${index}]`, findings));
    return findings;
  }

  if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) {
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(key)) {
          findings.push({ code: pattern.code, path: `${path}.${key}` });
        }
      }
      scanForSecretPatterns(child, `${path}.${key}`, findings);
    }
  }

  return findings;
}

function numberFromRecord(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = asNumber(record[key]);
    if (value !== null) return value;
  }
  return 0;
}

function extractCephHealth(value: unknown) {
  if (!isRecord(value)) return "unknown";
  const cluster = isRecord(value.cluster) ? value.cluster : value;
  const health = asString(cluster.health) ?? asString(cluster.healthstatus) ?? asString(cluster.status);
  if (health) return health.toLowerCase();
  const nested = isRecord(cluster.health_status) ? cluster.health_status : null;
  return asString(nested?.status)?.toLowerCase() ?? "unknown";
}

function isNodeOnline(node: unknown) {
  if (!isRecord(node)) return false;
  const status = asString(node.status)?.toLowerCase();
  return status === "online" || status === "running";
}

function isSharedStorage(storage: unknown) {
  if (!isRecord(storage)) return false;
  return asBoolean(storage.shared) === true || storage.shared === 1;
}

function isPbsStorage(storage: unknown) {
  if (!isRecord(storage)) return false;
  const type = asString(storage.type)?.toLowerCase() ?? "";
  const content = asString(storage.content)?.toLowerCase() ?? "";
  return type === "pbs" || content.includes("backup");
}

function isBridge(network: unknown) {
  if (!isRecord(network)) return false;
  const type = asString(network.type)?.toLowerCase() ?? "";
  return type === "bridge" || type === "ovsbridge";
}

function isVlanAwareBridge(network: unknown) {
  if (!isRecord(network) || !isBridge(network)) return false;
  return (
    asBoolean(network.bridge_vlan_aware) === true ||
    asBoolean(network.vlan_aware) === true ||
    asBoolean(network["vlan-aware"]) === true ||
    network.bridge_vlan_aware === 1
  );
}

function buildSummary(payload: ProxmoxTargetPayload): ProxmoxTargetSummaryForReadiness {
  const nodes = getArrayEntity(payload, "nodes").filter(isRecord);
  const nodeStatus = getArrayEntity(payload, "nodeStatus").filter(isRecord);
  const storages = getArrayEntity(payload, "storages").filter(isRecord);
  const nodeStorage = getArrayEntity(payload, "nodeStorage").filter(isRecord);
  const networks = getArrayEntity(payload, "networks").filter(isRecord);
  const resources = getArrayEntity(payload, "resources").filter(isRecord);
  const backupTargets = getArrayEntity(payload, "backupTargets").filter(isRecord);
  const ha = isRecord(payload.entities?.ha) ? payload.entities.ha : {};
  const haResources = asArray(ha.resources).filter(isRecord);
  const ceph = isRecord(payload.entities?.ceph) ? payload.entities.ceph : {};

  const onlineNodeCount = nodes.filter(isNodeOnline).length;
  const totalMemoryBytes = nodeStatus.reduce(
    (total, status) =>
      total +
      numberFromRecord(isRecord(status.memory) ? status.memory : status, ["total", "maxmem", "memtotal"]),
    0,
  );
  const usedMemoryBytes = nodeStatus.reduce(
    (total, status) =>
      total +
      numberFromRecord(isRecord(status.memory) ? status.memory : status, ["used", "mem", "memused"]),
    0,
  );
  const totalCpuCores = nodeStatus.reduce(
    (total, status) =>
      total +
      numberFromRecord(isRecord(status.cpuinfo) ? status.cpuinfo : status, ["cpus", "cores", "maxcpu"]),
    0,
  );
  const totalStorageBytes = nodeStorage.reduce((total, storage) => total + numberFromRecord(storage, ["total"]), 0);
  const usedStorageBytes = nodeStorage.reduce((total, storage) => total + numberFromRecord(storage, ["used"]), 0);
  const totalStorageGb = gbFromBytes(totalStorageBytes);
  const usedStorageGb = gbFromBytes(usedStorageBytes);
  const freeStorageGb = Math.max(0, Math.round((totalStorageGb - usedStorageGb) * 10) / 10);
  const pbsStorageCount = Math.max(backupTargets.length, storages.filter(isPbsStorage).length);
  const storageTypes = storages.map((storage) => asString(storage.type)?.toLowerCase()).filter(Boolean);

  return {
    nodeCount: nodes.length,
    onlineNodeCount,
    offlineNodeCount: Math.max(0, nodes.length - onlineNodeCount),
    totalCpuCores: Math.round(totalCpuCores),
    totalMemoryGb: gbFromBytes(totalMemoryBytes),
    usedMemoryGb: gbFromBytes(usedMemoryBytes),
    memoryUsagePercent: percent(usedMemoryBytes, totalMemoryBytes),
    storageCount: storages.length,
    sharedStorageCount: storages.filter(isSharedStorage).length,
    totalStorageGb,
    freeStorageGb,
    storageUsagePercent: percent(usedStorageGb, totalStorageGb),
    vmCount: resources.filter((resource) => asString(resource.type)?.toLowerCase() === "qemu").length,
    containerCount: resources.filter((resource) => asString(resource.type)?.toLowerCase() === "lxc").length,
    haConfigured: haResources.length > 0,
    haResourceCount: haResources.length,
    pbsDetected: pbsStorageCount > 0,
    pbsStorageCount,
    cephDetected: ceph.cluster !== undefined && ceph.cluster !== null && JSON.stringify(ceph.cluster) !== "{}",
    cephHealth: extractCephHealth(ceph),
    zfsDetected: storageTypes.includes("zfspool"),
    bridgeCount: networks.filter(isBridge).length,
    vlanAwareBridgeCount: networks.filter(isVlanAwareBridge).length,
  };
}

function buildSignals(summary: ProxmoxTargetSummaryForReadiness) {
  return {
    capacitySignals: [
      `CPU cores detected: ${summary.totalCpuCores}`,
      `Memory detected: ${summary.totalMemoryGb} GB total, ${summary.memoryUsagePercent}% used`,
    ],
    storageSignals: [
      `Storage pools detected: ${summary.storageCount}`,
      `Shared storage pools: ${summary.sharedStorageCount}`,
      `Storage usage: ${summary.storageUsagePercent}%`,
    ],
    networkSignals: [
      `Bridges detected: ${summary.bridgeCount}`,
      `VLAN-aware bridges detected: ${summary.vlanAwareBridgeCount}`,
    ],
    haSignals: [
      summary.haConfigured
        ? `HA resources detected: ${summary.haResourceCount}`
        : "HA resources were not detected.",
    ],
    backupTargetSignals: [
      summary.pbsDetected
        ? `PBS/backup-capable storage targets detected: ${summary.pbsStorageCount}`
        : "No PBS/backup-capable storage target detected.",
    ],
    cephSignals: [
      summary.cephDetected
        ? `Ceph detected with health: ${summary.cephHealth}`
        : "Ceph not detected or endpoint unavailable.",
    ],
  };
}

export function parseProxmoxTargetPayload(params: {
  payload: unknown;
  rvtoolsVmCount?: number;
}): EvidenceParserResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const envelopeValidation = validateProxmoxTargetEnvelope(params.payload);
  warnings.push(...envelopeValidation.warnings);
  errors.push(...envelopeValidation.errors);

  if (!envelopeValidation.ok || !isRecord(params.payload)) {
    return {
      status: EvidenceParseResultStatus.failed,
      summary: {
        schema: isRecord(params.payload) ? params.payload.schema ?? null : null,
        proxmoxTargetSummary: null,
        readiness: evaluateProxmoxTargetReadiness({
          summary: {
            nodeCount: 0,
            onlineNodeCount: 0,
            offlineNodeCount: 0,
            totalCpuCores: 0,
            totalMemoryGb: 0,
            usedMemoryGb: 0,
            memoryUsagePercent: 0,
            storageCount: 0,
            sharedStorageCount: 0,
            totalStorageGb: 0,
            freeStorageGb: 0,
            storageUsagePercent: 0,
            vmCount: 0,
            containerCount: 0,
            haConfigured: false,
            haResourceCount: 0,
            pbsDetected: false,
            pbsStorageCount: 0,
            cephDetected: false,
            cephHealth: "unknown",
            zfsDetected: false,
            bridgeCount: 0,
            vlanAwareBridgeCount: 0,
          },
          parserFailed: true,
        }),
      },
      warnings,
      errors,
      normalizedEntities: {},
      parserKey: PROXMOX_TARGET_PARSER_KEY,
      parserVersion: PROXMOX_TARGET_PARSER_VERSION,
    };
  }

  const secretFindings = scanForSecretPatterns(params.payload);
  if (secretFindings.length > 0) {
    return {
      status: EvidenceParseResultStatus.failed,
      summary: {
        schema: PROXMOX_TARGET_SCHEMA,
        proxmoxTargetSummary: null,
        secretScan: {
          findingCount: secretFindings.length,
          codes: [...new Set(secretFindings.map((finding) => finding.code))],
        },
      },
      warnings,
      errors: [
        ...errors,
        "Potential secret-like content detected in Proxmox target payload. Values were not stored in parser summary.",
      ],
      normalizedEntities: {},
      parserKey: PROXMOX_TARGET_PARSER_KEY,
      parserVersion: PROXMOX_TARGET_PARSER_VERSION,
    };
  }

  const payload = params.payload as ProxmoxTargetPayload;
  const summary = buildSummary(payload);
  const collectorWarnings = warningObjectsToMessages(payload.warnings);
  const collectorErrors = warningObjectsToMessages(payload.errors);
  warnings.push(...collectorWarnings.map((warning) => `Collector warning: ${warning}`));
  warnings.push(...collectorErrors.map((error) => `Collector reported non-fatal error: ${error}`));

  const rvtoolsComparisonAvailable = typeof params.rvtoolsVmCount === "number" && params.rvtoolsVmCount > 0;
  const readiness = evaluateProxmoxTargetReadiness({
    summary,
    collectorWarningCount: collectorWarnings.length,
    collectorErrorCount: collectorErrors.length,
    rvtoolsComparisonAvailable,
  });
  warnings.push(...readiness.warnings);

  if (rvtoolsComparisonAvailable) {
    warnings.push("Target sizing comparison is preliminary and based on available RVTools inventory only.");
  }

  const normalizedSummary = {
    schema: PROXMOX_TARGET_SCHEMA,
    collector: {
      name: payload.collector?.name ?? null,
      version: payload.collector?.version ?? null,
      mode: payload.collector?.mode ?? null,
    },
    proxmoxTargetSummary: summary,
    readiness,
    signals: buildSignals(summary),
    sizingComparison: {
      preliminary: true,
      rvtoolsVmCount: params.rvtoolsVmCount ?? 0,
      targetVmCount: summary.vmCount,
      note: rvtoolsComparisonAvailable
        ? "Basic comparison only; not final sizing."
        : "RVTools inventory unavailable; target sizing comparison limited.",
    },
  };

  return {
    status: warnings.length > 0 || readiness.targetStatus !== "target_validated"
      ? EvidenceParseResultStatus.parsed_with_warnings
      : EvidenceParseResultStatus.parsed,
    summary: normalizedSummary,
    warnings: [...new Set(warnings)],
    errors,
    normalizedEntities: {
      nodes: getArrayEntity(payload, "nodes").map((node) => {
        if (!isRecord(node)) return {};
        return {
          name: asString(node.node) ?? asString(node.name),
          status: asString(node.status),
        };
      }),
      storages: getArrayEntity(payload, "storages").map((storage) => {
        if (!isRecord(storage)) return {};
        return {
          id: asString(storage.storage),
          type: asString(storage.type),
          shared: asBoolean(storage.shared),
        };
      }),
      readiness,
    },
    parserKey: PROXMOX_TARGET_PARSER_KEY,
    parserVersion: PROXMOX_TARGET_PARSER_VERSION,
  };
}

export function createProxmoxTargetParser(): EvidenceParser {
  return {
    parserKey: PROXMOX_TARGET_PARSER_KEY,
    parserVersion: PROXMOX_TARGET_PARSER_VERSION,
    supportedModules: [EvidenceModuleKey.proxmox_target],
    supportedInputTypes: [EvidenceModuleSourceType.json, EvidenceModuleSourceType.collector_output],
    async parse(input: EvidenceParserInput) {
      let payload: unknown;
      try {
        const buffer = await readEvidenceFile(input.filePath);
        payload = JSON.parse(buffer.toString("utf8"));
      } catch {
        return {
          status: EvidenceParseResultStatus.failed,
          summary: {
            schema: null,
            proxmoxTargetSummary: null,
          },
          warnings: [],
          errors: ["Proxmox target evidence must be valid JSON."],
          normalizedEntities: {},
          parserKey: PROXMOX_TARGET_PARSER_KEY,
          parserVersion: PROXMOX_TARGET_PARSER_VERSION,
        };
      }

      const rvtoolsVmCount = await prisma.parsedVM.count({
        where: {
          assessmentId: input.assessmentId,
        },
      });

      return parseProxmoxTargetPayload({
        payload,
        rvtoolsVmCount,
      });
    },
  };
}
