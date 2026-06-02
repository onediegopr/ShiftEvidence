import { EvidenceModuleKey, EvidenceModuleSourceType, EvidenceParseResultStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { readEvidenceFile } from "../localStorageService";
import type { EvidenceParser, EvidenceParserInput, EvidenceParserResult } from "../evidenceParserRegistry";
import { asNumber, asString, isRecord } from "../schemas/vmwareEnrichmentSchema";
import {
  BACKUP_EVIDENCE_SCHEMA,
  asBoolean,
  daysBetweenNow,
  getArrayEntity,
  numberValue,
  percent,
  validateBackupEvidenceEnvelope,
  warningObjectsToMessages,
  type BackupEvidencePayload,
} from "../schemas/backupEvidenceSchema";
import {
  evaluateBackupReadiness,
  type BackupEvidenceSummaryForReadiness,
} from "../engines/backupReadinessEngine";

export const BACKUP_EVIDENCE_PARSER_KEY = "backup-evidence-parser-v1";
export const BACKUP_EVIDENCE_PARSER_VERSION = "1.0.0";

type RvtoolsVmForMatching = {
  vmName: string;
  rawJson?: unknown;
};

type BackupMatchResult = {
  protectedObjectName: string;
  matchedVmName: string | null;
  matchedBy: "instanceUuid" | "biosUuid" | "name" | "unmatched";
};

const SECRET_PATTERNS = [
  { code: "password_pattern", regex: /password\s*=/i },
  { code: "passwd_pattern", regex: /\bpasswd\b/i },
  { code: "secret_pattern", regex: /\bsecret\b/i },
  { code: "token_pattern", regex: /\btoken\b/i },
  { code: "api_key_pattern", regex: /api[_-]?key/i },
  { code: "private_key_pattern", regex: /BEGIN\s+PRIVATE\s+KEY/i },
  { code: "bearer_pattern", regex: /Authorization\s*:\s*Bearer/i },
  { code: "vbr_credentials_pattern", regex: /VBR\s+credentials/i },
  { code: "connection_string_pattern", regex: /(postgresql|mysql|mongodb|sqlserver):\/\//i },
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

function normalizeName(value: unknown) {
  const text = asString(value);
  return text ? text.toLowerCase().replace(/\s+/g, " ").trim() : null;
}

function normalizeUuid(value: unknown) {
  const text = asString(value);
  return text ? text.toLowerCase().replace(/[{}]/g, "").trim() : null;
}

function extractRawJsonString(rawJson: unknown, keys: string[]) {
  if (!isRecord(rawJson)) return null;
  for (const key of keys) {
    const direct = asString(rawJson[key]);
    if (direct) return direct;
  }

  const source = rawJson.__source;
  if (isRecord(source)) {
    for (const key of keys) {
      const value = asString(source[key]);
      if (value) return value;
    }
  }

  return null;
}

function buildRvtoolsIndexes(rvtoolsVms: RvtoolsVmForMatching[]) {
  const byInstanceUuid = new Map<string, RvtoolsVmForMatching>();
  const byBiosUuid = new Map<string, RvtoolsVmForMatching>();
  const byName = new Map<string, RvtoolsVmForMatching>();

  for (const vm of rvtoolsVms) {
    const name = normalizeName(vm.vmName);
    if (name) byName.set(name, vm);

    const instanceUuid = normalizeUuid(
      extractRawJsonString(vm.rawJson, ["instanceUuid", "instance_uuid", "vmInstanceUuid", "uuid"]),
    );
    if (instanceUuid) byInstanceUuid.set(instanceUuid, vm);

    const biosUuid = normalizeUuid(
      extractRawJsonString(vm.rawJson, ["biosUuid", "bios_uuid", "vmUuid", "uuid"]),
    );
    if (biosUuid) byBiosUuid.set(biosUuid, vm);
  }

  return { byInstanceUuid, byBiosUuid, byName };
}

function matchProtectedObject(object: Record<string, unknown>, indexes: ReturnType<typeof buildRvtoolsIndexes>): BackupMatchResult {
  const protectedObjectName = asString(object.name) ?? "unknown-protected-object";
  const instanceUuid = normalizeUuid(object.instanceUuid);
  const biosUuid = normalizeUuid(object.biosUuid);
  const name = normalizeName(object.name);

  if (instanceUuid && indexes.byInstanceUuid.has(instanceUuid)) {
    return {
      protectedObjectName,
      matchedVmName: indexes.byInstanceUuid.get(instanceUuid)?.vmName ?? null,
      matchedBy: "instanceUuid",
    };
  }

  if (biosUuid && indexes.byBiosUuid.has(biosUuid)) {
    return {
      protectedObjectName,
      matchedVmName: indexes.byBiosUuid.get(biosUuid)?.vmName ?? null,
      matchedBy: "biosUuid",
    };
  }

  if (name && indexes.byName.has(name)) {
    return {
      protectedObjectName,
      matchedVmName: indexes.byName.get(name)?.vmName ?? null,
      matchedBy: "name",
    };
  }

  return {
    protectedObjectName,
    matchedVmName: null,
    matchedBy: "unmatched",
  };
}

function jobResultIs(job: Record<string, unknown>, pattern: RegExp) {
  return pattern.test(asString(job.lastResult) ?? "") || pattern.test(asString(job.latestResult) ?? "");
}

function buildBackupSummary(params: {
  payload: BackupEvidencePayload;
  rvtoolsVms: RvtoolsVmForMatching[];
  matches: BackupMatchResult[];
  now?: Date;
}): BackupEvidenceSummaryForReadiness {
  const jobs = getArrayEntity(params.payload, "jobs").filter(isRecord);
  const protectedObjects = getArrayEntity(params.payload, "protectedObjects").filter(isRecord);
  const restorePoints = getArrayEntity(params.payload, "restorePoints").filter(isRecord);
  const repositories = getArrayEntity(params.payload, "repositories").filter(isRecord);
  const backupCopyJobs = getArrayEntity(params.payload, "backupCopyJobs").filter(isRecord);
  const restorePointObjectNames = new Set(
    restorePoints.map((point) => normalizeName(point.objectName ?? point.name)).filter(Boolean),
  );
  const protectedNames = new Set(protectedObjects.map((object) => normalizeName(object.name)).filter(Boolean));
  const staleBackupCount = restorePoints.filter((point) => (daysBetweenNow(point.creationTime, params.now) ?? 0) > 14).length;
  const repositoryPressureCount = repositories.filter((repository) => {
    const capacity = numberValue(repository.capacity);
    const free = numberValue(repository.free);
    const used = repository.used !== undefined ? numberValue(repository.used) : Math.max(0, capacity - free);
    const pressure = capacity > 0 ? percent(used, capacity) : 0;
    return pressure >= 85 || (capacity > 0 && free / capacity <= 0.15);
  }).length;
  const matchedVmNames = new Set(params.matches.map((match) => match.matchedVmName).filter(Boolean));
  const unprotectedVmCount =
    params.rvtoolsVms.length > 0
      ? params.rvtoolsVms.filter((vm) => !matchedVmNames.has(vm.vmName)).length
      : 0;

  return {
    jobCount: jobs.length,
    enabledJobCount: jobs.filter((job) => asBoolean(job.enabled) === true).length,
    disabledJobCount: jobs.filter((job) => asBoolean(job.enabled) === false).length,
    protectedObjectCount: protectedObjects.length,
    matchedVmCount: params.matches.filter((match) => match.matchedBy !== "unmatched").length,
    unmatchedProtectedObjectCount: params.matches.filter((match) => match.matchedBy === "unmatched").length,
    unprotectedVmCount,
    restorePointObjectCount: restorePointObjectNames.size,
    staleBackupCount,
    missingRestorePointCount: [...protectedNames].filter((name) => !restorePointObjectNames.has(name)).length,
    failedJobCount: jobs.filter((job) => jobResultIs(job, /fail/i)).length,
    warningJobCount: jobs.filter((job) => jobResultIs(job, /warn/i)).length,
    repositoryCount: repositories.length,
    repositoryPressureCount,
    backupCopyJobCount: backupCopyJobs.length,
    restoreTestingEvidenceCount: 0,
    rvtoolsVmCount: params.rvtoolsVms.length,
  };
}

function buildSignals(params: {
  summary: BackupEvidenceSummaryForReadiness;
  protectedObjects: Record<string, unknown>[];
  rvtoolsVms: RvtoolsVmForMatching[];
  matches: BackupMatchResult[];
  repositories: Record<string, unknown>[];
}) {
  const matchedVmNames = new Set(params.matches.map((match) => match.matchedVmName).filter(Boolean));
  const unprotected = params.rvtoolsVms
    .filter((vm) => !matchedVmNames.has(vm.vmName))
    .map((vm) => ({ vmName: vm.vmName }))
    .slice(0, 50);

  const repositorySignals = params.repositories.map((repository) => {
    const capacity = numberValue(repository.capacity);
    const free = numberValue(repository.free);
    const used = repository.used !== undefined ? numberValue(repository.used) : Math.max(0, capacity - free);
    return {
      name: asString(repository.name),
      type: asString(repository.type),
      usagePercent: capacity > 0 ? percent(used, capacity) : 0,
    };
  });

  return {
    protectedVmSignals: params.protectedObjects.slice(0, 50).map((object) => ({
      name: asString(object.name),
      jobName: asString(object.jobName),
      latestResult: asString(object.latestResult),
    })),
    unprotectedVmSignals: unprotected,
    staleBackupSignals: [],
    failedJobSignals: [],
    repositorySignals,
    backupCopySignals: [
      {
        backupCopyJobCount: params.summary.backupCopyJobCount,
      },
    ],
  };
}

export function parseBackupEvidencePayload(params: {
  payload: unknown;
  rvtoolsVms?: RvtoolsVmForMatching[];
  now?: Date;
}): EvidenceParserResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const envelopeValidation = validateBackupEvidenceEnvelope(params.payload);
  warnings.push(...envelopeValidation.warnings);
  errors.push(...envelopeValidation.errors);

  if (!envelopeValidation.ok || !isRecord(params.payload)) {
    return {
      status: EvidenceParseResultStatus.failed,
      summary: {
        schema: isRecord(params.payload) ? params.payload.schema ?? null : null,
        backupEvidenceSummary: null,
        readiness: evaluateBackupReadiness({
          summary: {
            jobCount: 0,
            enabledJobCount: 0,
            disabledJobCount: 0,
            protectedObjectCount: 0,
            matchedVmCount: 0,
            unmatchedProtectedObjectCount: 0,
            unprotectedVmCount: 0,
            restorePointObjectCount: 0,
            staleBackupCount: 0,
            missingRestorePointCount: 0,
            failedJobCount: 0,
            warningJobCount: 0,
            repositoryCount: 0,
            repositoryPressureCount: 0,
            backupCopyJobCount: 0,
            restoreTestingEvidenceCount: 0,
            rvtoolsVmCount: 0,
          },
          parserFailed: true,
        }),
      },
      warnings,
      errors,
      normalizedEntities: {},
      parserKey: BACKUP_EVIDENCE_PARSER_KEY,
      parserVersion: BACKUP_EVIDENCE_PARSER_VERSION,
    };
  }

  const secretFindings = scanForSecretPatterns(params.payload);
  if (secretFindings.length > 0) {
    return {
      status: EvidenceParseResultStatus.failed,
      summary: {
        schema: BACKUP_EVIDENCE_SCHEMA,
        backupEvidenceSummary: null,
        secretScan: {
          findingCount: secretFindings.length,
          codes: [...new Set(secretFindings.map((finding) => finding.code))],
        },
      },
      warnings,
      errors: [
        ...errors,
        "Potential secret-like content detected in backup evidence payload. Values were not stored in parser summary.",
      ],
      normalizedEntities: {},
      parserKey: BACKUP_EVIDENCE_PARSER_KEY,
      parserVersion: BACKUP_EVIDENCE_PARSER_VERSION,
    };
  }

  const payload = params.payload as BackupEvidencePayload;
  const rvtoolsVms = params.rvtoolsVms ?? [];
  if (rvtoolsVms.length === 0) {
    warnings.push("Backup evidence uploaded before RVTools inventory; protected/unprotected VM matching is limited.");
  }

  const protectedObjects = getArrayEntity(payload, "protectedObjects").filter(isRecord);
  const repositories = getArrayEntity(payload, "repositories").filter(isRecord);
  const collectorWarnings = warningObjectsToMessages(payload.warnings);
  const collectorErrors = warningObjectsToMessages(payload.errors);
  warnings.push(...collectorWarnings.map((warning) => `Collector warning: ${warning}`));
  warnings.push(...collectorErrors.map((error) => `Collector reported non-fatal error: ${error}`));

  const indexes = buildRvtoolsIndexes(rvtoolsVms);
  const matches = protectedObjects.map((object) => matchProtectedObject(object, indexes));
  const matchedByInstanceUuid = matches.filter((match) => match.matchedBy === "instanceUuid").length;
  const matchedByBiosUuid = matches.filter((match) => match.matchedBy === "biosUuid").length;
  const matchedByName = matches.filter((match) => match.matchedBy === "name").length;
  const unmatched = matches.filter((match) => match.matchedBy === "unmatched");

  if (rvtoolsVms.length > 0 && unmatched.length > 0) {
    warnings.push(`${unmatched.length} protected backup object(s) could not be matched to parsed RVTools inventory.`);
  }

  const summary = buildBackupSummary({
    payload,
    rvtoolsVms,
    matches,
    now: params.now,
  });
  const readiness = evaluateBackupReadiness({
    summary,
    collectorWarningCount: collectorWarnings.length,
    collectorErrorCount: collectorErrors.length,
    rvtoolsInventoryAvailable: rvtoolsVms.length > 0,
  });
  warnings.push(...readiness.warnings);

  const normalizedSummary = {
    schema: BACKUP_EVIDENCE_SCHEMA,
    collector: {
      name: payload.collector?.name ?? null,
      version: payload.collector?.version ?? null,
      mode: payload.collector?.mode ?? null,
    },
    backupEvidenceSummary: summary,
    readiness,
    signals: buildSignals({
      summary,
      protectedObjects,
      rvtoolsVms,
      matches,
      repositories,
    }),
    matching: {
      matchedByInstanceUuid,
      matchedByBiosUuid,
      matchedByName,
      unmatched: unmatched.slice(0, 50),
    },
  };

  return {
    status: warnings.length > 0 || readiness.backupReadinessStatus !== "backup_validated"
      ? EvidenceParseResultStatus.parsed_with_warnings
      : EvidenceParseResultStatus.parsed,
    summary: normalizedSummary,
    warnings: [...new Set(warnings)],
    errors,
    normalizedEntities: {
      matching: matches,
      protectedObjects: protectedObjects.map((object) => ({
        name: asString(object.name),
        jobName: asString(object.jobName),
        instanceUuid: asString(object.instanceUuid),
        biosUuid: asString(object.biosUuid),
        restorePointCount: asNumber(object.restorePointCount) ?? 0,
      })),
      readiness,
    },
    parserKey: BACKUP_EVIDENCE_PARSER_KEY,
    parserVersion: BACKUP_EVIDENCE_PARSER_VERSION,
  };
}

export function createBackupEvidenceParser(): EvidenceParser {
  return {
    parserKey: BACKUP_EVIDENCE_PARSER_KEY,
    parserVersion: BACKUP_EVIDENCE_PARSER_VERSION,
    supportedModules: [EvidenceModuleKey.backup_evidence],
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
            backupEvidenceSummary: null,
          },
          warnings: [],
          errors: ["Backup evidence must be valid JSON."],
          normalizedEntities: {},
          parserKey: BACKUP_EVIDENCE_PARSER_KEY,
          parserVersion: BACKUP_EVIDENCE_PARSER_VERSION,
        };
      }

      const rvtoolsVms = await prisma.parsedVM.findMany({
        where: {
          assessmentId: input.assessmentId,
        },
        select: {
          vmName: true,
          rawJson: true,
        },
      });

      return parseBackupEvidencePayload({
        payload,
        rvtoolsVms,
      });
    },
  };
}
