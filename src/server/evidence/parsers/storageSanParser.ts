import { EvidenceModuleKey, EvidenceModuleSourceType, EvidenceParseResultStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { readEvidenceFile } from "../localStorageService";
import type { EvidenceParser, EvidenceParserInput, EvidenceParserResult } from "../evidenceParserRegistry";
import { asNumber, asString, isRecord } from "../schemas/vmwareEnrichmentSchema";
import {
  STORAGE_SAN_CSV_COLUMNS,
  STORAGE_SAN_SCHEMA,
  asBoolean,
  getArrayEntity,
  isStorageSanRecordType,
  normalizeName,
  numberValue,
  percent,
  validateStorageSanEnvelope,
  type StorageSanCsvRow,
  type StorageSanPayload,
} from "../schemas/storageSanSchema";
import {
  STORAGE_SAN_THRESHOLDS,
  evaluateStorageSanReadiness,
  type StorageSanSummaryForReadiness,
} from "../engines/storageSanReadinessEngine";

export const STORAGE_SAN_PARSER_KEY = "storage-san-parser-v1";
export const STORAGE_SAN_PARSER_VERSION = "1.0.0";

type RvtoolsDatastoreForMatching = {
  datastoreName: string;
};

type DatastoreMatchResult = {
  datastoreName: string;
  matchedDatastoreName: string | null;
  matchedBy: "name" | "unmatched";
};

const SECRET_PATTERNS = [
  { code: "password_pattern", regex: /password\s*=/i },
  { code: "passwd_pattern", regex: /\bpasswd\b/i },
  { code: "secret_pattern", regex: /\bsecret\b/i },
  { code: "token_pattern", regex: /\btoken\b/i },
  { code: "api_key_pattern", regex: /api[_-]?key/i },
  { code: "bearer_pattern", regex: /Authorization\s*:\s*Bearer/i },
  { code: "private_key_pattern", regex: /BEGIN\s+PRIVATE\s+KEY/i },
  { code: "connection_string_key_pattern", regex: /connectionString/i },
  { code: "connection_string_pattern", regex: /(postgresql|mysql|mongodb|sqlserver):\/\//i },
  { code: "embedded_url_credentials_pattern", regex: /[a-z]+:\/\/[^/\s:@]+:[^/\s:@]+@/i },
  { code: "unc_credentials_pattern", regex: /\\\\[^\\/:]+:[^\\/@]+@/i },
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

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { rows: [] as StorageSanCsvRow[], errors: ["CSV file is empty."], warnings: [] as string[] };
  }

  const headers = splitCsvLine(lines[0]);
  const missingColumns = STORAGE_SAN_CSV_COLUMNS.filter((column) => !headers.includes(column));
  const errors = missingColumns.length > 0
    ? [`CSV is missing required column(s): ${missingColumns.join(", ")}.`]
    : [];
  const warnings: string[] = [];
  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce<StorageSanCsvRow>((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });

  if (rows.length === 0) {
    warnings.push("CSV contains headers but no data rows.");
  }

  return { rows, errors, warnings };
}

function recordBase(row: Record<string, unknown>) {
  return {
    sourceSystem: asString(row.sourceSystem),
    vendor: asString(row.vendor),
    model: asString(row.model),
    arrayName: asString(row.arrayName),
    poolName: asString(row.poolName),
    volumeName: asString(row.volumeName),
    lunName: asString(row.lunName),
    datastoreName: asString(row.datastoreName),
    protocol: asString(row.protocol),
    totalGb: asNumber(row.totalGb),
    usedGb: asNumber(row.usedGb),
    freeGb: asNumber(row.freeGb),
    usagePercent: asNumber(row.usagePercent),
    thinProvisioned: asBoolean(row.thinProvisioned),
    replicated: asBoolean(row.replicated),
    snapshotEnabled: asBoolean(row.snapshotEnabled),
    iopsRead: asNumber(row.iopsRead),
    iopsWrite: asNumber(row.iopsWrite),
    latencyMs: asNumber(row.latencyMs),
    throughputMBps: asNumber(row.throughputMBps),
    sampleWindow: asString(row.sampleWindow),
    notes: asString(row.notes),
    criticality: asString(row.criticality),
  };
}

function csvRowsToPayload(rows: StorageSanCsvRow[]) {
  const entities: NonNullable<StorageSanPayload["entities"]> = {
    arrays: [],
    pools: [],
    volumes: [],
    luns: [],
    datastoreMappings: [],
    performanceSamples: [],
    replication: [],
    snapshotPolicies: [],
    targetStorageCandidates: [],
  };
  const errors: string[] = [];
  const warnings: string[] = [];

  rows.forEach((row, index) => {
    const recordType = asString(row.recordType);
    if (!isStorageSanRecordType(recordType)) {
      errors.push(`Row ${index + 2}: unsupported or missing recordType.`);
      return;
    }

    const base = recordBase(row);
    switch (recordType) {
      case "array":
        entities.arrays?.push(base);
        break;
      case "pool":
        entities.pools?.push(base);
        break;
      case "volume":
        entities.volumes?.push(base);
        break;
      case "lun":
        entities.luns?.push(base);
        break;
      case "datastore_mapping":
        entities.datastoreMappings?.push({
          ...base,
          multipath: asString(row.multipath) ?? "unknown",
          shared: asString(row.shared) ?? "unknown",
        });
        break;
      case "performance_sample":
        entities.performanceSamples?.push(base);
        break;
      case "replication":
        entities.replication?.push({
          ...base,
          sourceVolume: asString(row.volumeName),
          targetVolume: asString(row.lunName),
          replicationStatus: asString(row.notes),
        });
        break;
      case "snapshot_policy":
        entities.snapshotPolicies?.push({
          ...base,
          frequency: asString(row.sampleWindow),
          retention: asString(row.notes),
        });
        break;
      case "target_storage_candidate":
        entities.targetStorageCandidates?.push({
          ...base,
          targetName: asString(row.arrayName) ?? asString(row.sourceSystem),
          storageType: asString(row.protocol) ?? asString(row.poolName),
          shared: asBoolean(row.snapshotEnabled),
          confidence: asString(row.criticality),
        });
        break;
    }
  });

  const payload: StorageSanPayload = {
    schema: STORAGE_SAN_SCHEMA,
    source: {
      type: "manual_template",
      generatedAt: new Date().toISOString(),
      owner: "Shift Evidence",
      mode: "customer-provided",
    },
    safety: {
      persistentCredentialsStored: false,
      rawSecretsIncluded: false,
      networkUploadPerformed: false,
    },
    summary: {},
    entities,
    warnings: [],
    errors: [],
  };

  return { payload, errors, warnings };
}

function usagePercentFor(record: Record<string, unknown>) {
  const explicit = asNumber(record.usagePercent);
  if (explicit !== null) return explicit;
  const total = numberValue(record.totalGb);
  const used = numberValue(record.usedGb);
  return percent(used, total);
}

function freePercentFor(record: Record<string, unknown>) {
  const total = numberValue(record.totalGb);
  const free = record.freeGb !== undefined ? numberValue(record.freeGb) : Math.max(0, total - numberValue(record.usedGb));
  if (total <= 0) return 0;
  return Math.round((free / total) * 1000) / 10;
}

function collectDatastoreNames(payload: StorageSanPayload) {
  return [
    ...getArrayEntity(payload, "datastoreMappings"),
    ...getArrayEntity(payload, "volumes"),
    ...getArrayEntity(payload, "luns"),
    ...getArrayEntity(payload, "performanceSamples"),
  ]
    .filter(isRecord)
    .map((record) => asString(record.datastoreName))
    .filter((name): name is string => Boolean(name));
}

function matchDatastores(names: string[], rvtoolsDatastores: RvtoolsDatastoreForMatching[]): DatastoreMatchResult[] {
  const byName = new Map<string, RvtoolsDatastoreForMatching>();
  for (const datastore of rvtoolsDatastores) {
    const normalized = normalizeName(datastore.datastoreName);
    if (normalized) byName.set(normalized, datastore);
  }

  return [...new Set(names)].map((datastoreName) => {
    const normalized = normalizeName(datastoreName);
    const matched = normalized ? byName.get(normalized) : null;
    return {
      datastoreName,
      matchedDatastoreName: matched?.datastoreName ?? null,
      matchedBy: matched ? "name" : "unmatched",
    };
  });
}

function hasProxmoxTargetStorageMatch(payload: StorageSanPayload, proxmoxSummary: Record<string, unknown> | null) {
  const candidates = getArrayEntity(payload, "targetStorageCandidates").filter(isRecord);
  if (candidates.length === 0) return false;
  const proxmoxTargetSummary = isRecord(proxmoxSummary?.proxmoxTargetSummary)
    ? proxmoxSummary.proxmoxTargetSummary
    : null;
  const storageCount = asNumber(proxmoxTargetSummary?.storageCount) ?? 0;
  return storageCount > 0;
}

function buildStorageSanSummary(params: {
  payload: StorageSanPayload;
  matches: DatastoreMatchResult[];
  proxmoxSummary: Record<string, unknown> | null;
}): StorageSanSummaryForReadiness {
  const arrays = getArrayEntity(params.payload, "arrays").filter(isRecord);
  const pools = getArrayEntity(params.payload, "pools").filter(isRecord);
  const volumes = getArrayEntity(params.payload, "volumes").filter(isRecord);
  const luns = getArrayEntity(params.payload, "luns").filter(isRecord);
  const datastoreMappings = getArrayEntity(params.payload, "datastoreMappings").filter(isRecord);
  const performanceSamples = getArrayEntity(params.payload, "performanceSamples").filter(isRecord);
  const replication = getArrayEntity(params.payload, "replication").filter(isRecord);
  const snapshotPolicies = getArrayEntity(params.payload, "snapshotPolicies").filter(isRecord);
  const targetStorageCandidates = getArrayEntity(params.payload, "targetStorageCandidates").filter(isRecord);
  const capacityRecords = [...pools, ...volumes, ...luns, ...targetStorageCandidates];
  const highUsagePoolCount = pools.filter((record) => usagePercentFor(record) >= STORAGE_SAN_THRESHOLDS.usageWarningPercent).length;
  const criticalUsagePoolCount = pools.filter((record) => usagePercentFor(record) >= STORAGE_SAN_THRESHOLDS.usageCriticalPercent).length;
  const lowFreeCapacityPoolCount = pools.filter((record) => freePercentFor(record) < STORAGE_SAN_THRESHOLDS.freeCapacityCriticalPercent).length;
  const highLatencySampleCount = performanceSamples.filter((record) => {
    const latency = asNumber(record.latencyMs) ?? 0;
    return latency > STORAGE_SAN_THRESHOLDS.latencyWarningMs;
  }).length;
  const criticalLatencySampleCount = performanceSamples.filter((record) => {
    const latency = asNumber(record.latencyMs) ?? 0;
    return latency > STORAGE_SAN_THRESHOLDS.latencyCriticalMs;
  }).length;
  const missingPerformanceWindowCount = performanceSamples.filter((record) => !asString(record.sampleWindow)).length;
  const replicationFailureCount = replication.filter((record) => {
    const status = asString(record.replicationStatus)?.toLowerCase() ?? "";
    return status.includes("fail") || status.includes("error") || status.includes("unhealthy") || asBoolean(record.replicated) === false;
  }).length;
  const thinProvisioningRiskCount = capacityRecords.filter((record) => {
    return asBoolean(record.thinProvisioned) === true && usagePercentFor(record) >= STORAGE_SAN_THRESHOLDS.usageWarningPercent;
  }).length;
  const unmatchedDatastoreCount = params.matches.filter((match) => match.matchedBy === "unmatched").length;

  return {
    arrayCount: arrays.length,
    poolCount: pools.length,
    volumeCount: volumes.length,
    lunCount: luns.length,
    datastoreMappingCount: datastoreMappings.length,
    performanceSampleCount: performanceSamples.length,
    replicationRecordCount: replication.length,
    snapshotPolicyCount: snapshotPolicies.length,
    targetStorageCandidateCount: targetStorageCandidates.length,
    highUsagePoolCount,
    criticalUsagePoolCount,
    lowFreeCapacityPoolCount,
    highLatencySampleCount,
    criticalLatencySampleCount,
    missingPerformanceWindowCount,
    replicationFailureCount,
    thinProvisioningRiskCount,
    unmappedDatastoreCount: unmatchedDatastoreCount,
    matchedDatastoreCount: params.matches.filter((match) => match.matchedBy === "name").length,
    unmatchedDatastoreCount,
    performanceEvidencePresent: performanceSamples.length > 0,
    replicationEvidencePresent: replication.length > 0,
    snapshotEvidencePresent: snapshotPolicies.length > 0,
    targetStorageComparisonAvailable: hasProxmoxTargetStorageMatch(params.payload, params.proxmoxSummary),
  };
}

function buildSignals(params: {
  payload: StorageSanPayload;
  summary: StorageSanSummaryForReadiness;
  matches: DatastoreMatchResult[];
}) {
  const pools = getArrayEntity(params.payload, "pools").filter(isRecord);
  const performanceSamples = getArrayEntity(params.payload, "performanceSamples").filter(isRecord);
  const replication = getArrayEntity(params.payload, "replication").filter(isRecord);
  const snapshotPolicies = getArrayEntity(params.payload, "snapshotPolicies").filter(isRecord);
  const targetStorageCandidates = getArrayEntity(params.payload, "targetStorageCandidates").filter(isRecord);

  return {
    capacitySignals: pools.slice(0, 50).map((pool) => ({
      arrayName: asString(pool.arrayName),
      poolName: asString(pool.poolName),
      usagePercent: usagePercentFor(pool),
      freePercent: freePercentFor(pool),
    })),
    performanceSignals: performanceSamples.slice(0, 50).map((sample) => ({
      datastoreName: asString(sample.datastoreName),
      latencyMs: asNumber(sample.latencyMs),
      sampleWindow: asString(sample.sampleWindow),
    })),
    replicationSignals: replication.slice(0, 50).map((record) => ({
      sourceVolume: asString(record.sourceVolume) ?? asString(record.volumeName),
      replicated: asBoolean(record.replicated),
      status: asString(record.replicationStatus),
    })),
    snapshotSignals: snapshotPolicies.slice(0, 50).map((record) => ({
      volumeName: asString(record.volumeName),
      snapshotEnabled: asBoolean(record.snapshotEnabled),
      frequency: asString(record.frequency),
    })),
    mappingSignals: params.matches.slice(0, 50),
    targetStorageSignals: targetStorageCandidates.slice(0, 50).map((candidate) => ({
      targetName: asString(candidate.targetName) ?? asString(candidate.arrayName),
      storageType: asString(candidate.storageType) ?? asString(candidate.protocol),
      totalGb: asNumber(candidate.totalGb),
      freeGb: asNumber(candidate.freeGb),
    })),
  };
}

export function parseStorageSanPayload(params: {
  payload: unknown;
  rvtoolsDatastores?: RvtoolsDatastoreForMatching[];
  proxmoxSummary?: Record<string, unknown> | null;
}): EvidenceParserResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const envelopeValidation = validateStorageSanEnvelope(params.payload);
  warnings.push(...envelopeValidation.warnings);
  errors.push(...envelopeValidation.errors);

  if (!envelopeValidation.ok || !isRecord(params.payload)) {
    return {
      status: EvidenceParseResultStatus.failed,
      summary: {
        schema: isRecord(params.payload) ? params.payload.schema ?? null : null,
        storageSanSummary: null,
        readiness: evaluateStorageSanReadiness({
          summary: {
            arrayCount: 0,
            poolCount: 0,
            volumeCount: 0,
            lunCount: 0,
            datastoreMappingCount: 0,
            performanceSampleCount: 0,
            replicationRecordCount: 0,
            snapshotPolicyCount: 0,
            targetStorageCandidateCount: 0,
            highUsagePoolCount: 0,
            criticalUsagePoolCount: 0,
            lowFreeCapacityPoolCount: 0,
            highLatencySampleCount: 0,
            criticalLatencySampleCount: 0,
            missingPerformanceWindowCount: 0,
            replicationFailureCount: 0,
            thinProvisioningRiskCount: 0,
            unmappedDatastoreCount: 0,
            matchedDatastoreCount: 0,
            unmatchedDatastoreCount: 0,
            performanceEvidencePresent: false,
            replicationEvidencePresent: false,
            snapshotEvidencePresent: false,
            targetStorageComparisonAvailable: false,
          },
          parserFailed: true,
        }),
      },
      warnings,
      errors,
      normalizedEntities: {},
      parserKey: STORAGE_SAN_PARSER_KEY,
      parserVersion: STORAGE_SAN_PARSER_VERSION,
    };
  }

  const secretFindings = scanForSecretPatterns(params.payload);
  if (secretFindings.length > 0) {
    return {
      status: EvidenceParseResultStatus.failed,
      summary: {
        schema: STORAGE_SAN_SCHEMA,
        storageSanSummary: null,
        secretScan: {
          findingCount: secretFindings.length,
          codes: [...new Set(secretFindings.map((finding) => finding.code))],
        },
      },
      warnings,
      errors: [
        ...errors,
        "Potential secret-like content detected in Storage/SAN evidence payload. Values were not stored in parser summary.",
      ],
      normalizedEntities: {},
      parserKey: STORAGE_SAN_PARSER_KEY,
      parserVersion: STORAGE_SAN_PARSER_VERSION,
    };
  }

  const payload = params.payload as StorageSanPayload;
  const rvtoolsDatastores = params.rvtoolsDatastores ?? [];
  const datastoreNames = collectDatastoreNames(payload);
  const matches = matchDatastores(datastoreNames, rvtoolsDatastores);

  if (rvtoolsDatastores.length === 0) {
    warnings.push("Storage/SAN evidence uploaded before RVTools inventory; datastore matching is limited.");
  } else if (matches.some((match) => match.matchedBy === "unmatched")) {
    warnings.push("Some Storage/SAN datastore mappings could not be matched to parsed RVTools datastores.");
  }

  if (!params.proxmoxSummary) {
    warnings.push("Target storage comparison requires Proxmox Target evidence.");
  }

  const summary = buildStorageSanSummary({
    payload,
    matches,
    proxmoxSummary: params.proxmoxSummary ?? null,
  });
  const readiness = evaluateStorageSanReadiness({
    summary,
    rvtoolsDatastoreAvailable: rvtoolsDatastores.length > 0,
    proxmoxTargetEvidenceAvailable: Boolean(params.proxmoxSummary),
  });
  warnings.push(...readiness.warnings);

  const normalizedSummary = {
    schema: STORAGE_SAN_SCHEMA,
    source: {
      type: payload.source?.type ?? null,
      owner: payload.source?.owner ?? null,
      mode: payload.source?.mode ?? null,
    },
    storageSanSummary: summary,
    readiness,
    signals: buildSignals({ payload, summary, matches }),
    matching: {
      matchedDatastoreCount: summary.matchedDatastoreCount,
      unmatchedDatastoreCount: summary.unmatchedDatastoreCount,
      unmatchedDatastores: matches.filter((match) => match.matchedBy === "unmatched").slice(0, 50),
    },
  };

  return {
    status: warnings.length > 0 || readiness.storageReadinessStatus !== "storage_validated"
      ? EvidenceParseResultStatus.parsed_with_warnings
      : EvidenceParseResultStatus.parsed,
    summary: normalizedSummary,
    warnings: [...new Set(warnings)],
    errors,
    normalizedEntities: {
      matching: matches,
      readiness,
    },
    parserKey: STORAGE_SAN_PARSER_KEY,
    parserVersion: STORAGE_SAN_PARSER_VERSION,
  };
}

export function parseStorageSanCsv(params: {
  text: string;
  rvtoolsDatastores?: RvtoolsDatastoreForMatching[];
  proxmoxSummary?: Record<string, unknown> | null;
}) {
  const csv = parseCsv(params.text);
  if (csv.errors.length > 0) {
    return {
      status: EvidenceParseResultStatus.failed,
      summary: {
        schema: STORAGE_SAN_SCHEMA,
        storageSanSummary: null,
      },
      warnings: csv.warnings,
      errors: csv.errors,
      normalizedEntities: {},
      parserKey: STORAGE_SAN_PARSER_KEY,
      parserVersion: STORAGE_SAN_PARSER_VERSION,
    } satisfies EvidenceParserResult;
  }

  const converted = csvRowsToPayload(csv.rows);
  if (converted.errors.length > 0) {
    return {
      status: EvidenceParseResultStatus.failed,
      summary: {
        schema: STORAGE_SAN_SCHEMA,
        storageSanSummary: null,
      },
      warnings: [...csv.warnings, ...converted.warnings],
      errors: converted.errors,
      normalizedEntities: {},
      parserKey: STORAGE_SAN_PARSER_KEY,
      parserVersion: STORAGE_SAN_PARSER_VERSION,
    } satisfies EvidenceParserResult;
  }

  const result = parseStorageSanPayload({
    payload: converted.payload,
    rvtoolsDatastores: params.rvtoolsDatastores,
    proxmoxSummary: params.proxmoxSummary,
  });

  return {
    ...result,
    warnings: [...new Set([...csv.warnings, ...converted.warnings, ...result.warnings])],
  };
}

export function createStorageSanParser(): EvidenceParser {
  return {
    parserKey: STORAGE_SAN_PARSER_KEY,
    parserVersion: STORAGE_SAN_PARSER_VERSION,
    supportedModules: [EvidenceModuleKey.storage_san],
    supportedInputTypes: [EvidenceModuleSourceType.json, EvidenceModuleSourceType.csv],
    async parse(input: EvidenceParserInput) {
      const rvtoolsDatastores = await prisma.parsedDatastore.findMany({
        where: {
          assessmentId: input.assessmentId,
        },
        select: {
          datastoreName: true,
        },
      });
      const proxmoxParse = await prisma.evidenceParseResult.findFirst({
        where: {
          assessmentId: input.assessmentId,
          moduleKey: EvidenceModuleKey.proxmox_target,
          status: {
            in: [EvidenceParseResultStatus.parsed, EvidenceParseResultStatus.parsed_with_warnings],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          summaryJson: true,
        },
      });
      const proxmoxSummary =
        isRecord(proxmoxParse?.summaryJson) ? proxmoxParse.summaryJson as Record<string, unknown> : null;

      const buffer = await readEvidenceFile(input.filePath);
      const text = buffer.toString("utf8");
      const inputType = input.inputType ?? EvidenceModuleSourceType.manual;

      if (inputType === EvidenceModuleSourceType.csv || input.originalFilename?.toLowerCase().endsWith(".csv")) {
        return parseStorageSanCsv({
          text,
          rvtoolsDatastores,
          proxmoxSummary,
        });
      }

      try {
        return parseStorageSanPayload({
          payload: JSON.parse(text),
          rvtoolsDatastores,
          proxmoxSummary,
        });
      } catch {
        return {
          status: EvidenceParseResultStatus.failed,
          summary: {
            schema: null,
            storageSanSummary: null,
          },
          warnings: [],
          errors: ["Storage/SAN evidence must be valid JSON or CSV."],
          normalizedEntities: {},
          parserKey: STORAGE_SAN_PARSER_KEY,
          parserVersion: STORAGE_SAN_PARSER_VERSION,
        };
      }
    },
  };
}
