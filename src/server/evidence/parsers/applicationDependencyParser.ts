import { EvidenceModuleKey, EvidenceModuleSourceType, EvidenceParseResultStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { readEvidenceFile } from "../localStorageService";
import type { EvidenceParser, EvidenceParserInput, EvidenceParserResult } from "../evidenceParserRegistry";
import { asString, isRecord } from "../schemas/vmwareEnrichmentSchema";
import {
  APPLICATION_DEPENDENCY_CSV_COLUMNS,
  APPLICATION_DEPENDENCY_SCHEMA,
  asBoolean,
  getArrayEntity,
  isApplicationCriticality,
  isApplicationDependencyRecordType,
  isDependencyConfidence,
  isDependencySource,
  isDependencyType,
  isDowntimeTolerance,
  normalizeName,
  normalizeUuid,
  validateApplicationDependencyEnvelope,
  type ApplicationDependencyCsvRow,
  type ApplicationDependencyPayload,
} from "../schemas/applicationDependencySchema";
import {
  evaluateApplicationDependencyReadiness,
  type ApplicationDependencySummaryForReadiness,
} from "../engines/applicationDependencyReadinessEngine";

export const APPLICATION_DEPENDENCY_PARSER_KEY = "application-dependency-parser-v1";
export const APPLICATION_DEPENDENCY_PARSER_VERSION = "1.0.0";

type RvtoolsVmForMatching = {
  vmName: string;
  rawJson?: unknown;
};

type VmMatchResult = {
  evidenceVmName: string;
  matchedVmName: string | null;
  matchedBy: "instanceUuid" | "biosUuid" | "name" | "unmatched";
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
    return { rows: [] as ApplicationDependencyCsvRow[], errors: ["CSV file is empty."], warnings: [] as string[] };
  }

  const headers = splitCsvLine(lines[0]);
  const missingColumns = APPLICATION_DEPENDENCY_CSV_COLUMNS.filter((column) => !headers.includes(column));
  const errors = missingColumns.length > 0
    ? [`CSV is missing required column(s): ${missingColumns.join(", ")}.`]
    : [];
  const warnings: string[] = [];
  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce<ApplicationDependencyCsvRow>((row, header, index) => {
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
    applicationName: asString(row.applicationName),
    applicationId: asString(row.applicationId),
    componentName: asString(row.componentName),
    vmName: asString(row.vmName),
    vmInstanceUuid: asString(row.vmInstanceUuid),
    vmBiosUuid: asString(row.vmBiosUuid),
    role: asString(row.role),
    dependencyType: asString(row.dependencyType),
    dependsOnVmName: asString(row.dependsOnVmName),
    dependsOnApplicationName: asString(row.dependsOnApplicationName),
    ownerName: asString(row.ownerName),
    ownerTeam: asString(row.ownerTeam),
    criticality: asString(row.criticality),
    downtimeTolerance: asString(row.downtimeTolerance),
    maintenanceWindow: asString(row.maintenanceWindow),
    migrationGroup: asString(row.migrationGroup),
    waveCandidate: asString(row.waveCandidate),
    source: asString(row.source),
    confidence: asString(row.confidence),
    notes: asString(row.notes),
  };
}

function csvRowsToPayload(rows: ApplicationDependencyCsvRow[]) {
  const entities: NonNullable<ApplicationDependencyPayload["entities"]> = {
    applications: [],
    components: [],
    vmRoles: [],
    dependencies: [],
    owners: [],
    maintenanceWindows: [],
    migrationGroups: [],
    criticalities: [],
    constraints: [],
  };
  const errors: string[] = [];
  const warnings: string[] = [];

  rows.forEach((row, index) => {
    const recordType = asString(row.recordType);
    if (!isApplicationDependencyRecordType(recordType)) {
      errors.push(`Row ${index + 2}: unsupported or missing recordType.`);
      return;
    }

    const base = recordBase(row);
    switch (recordType) {
      case "application":
        entities.applications?.push(base);
        break;
      case "application_component":
        entities.components?.push({
          ...base,
          componentType: asString(row.role) ?? asString(row.componentName),
        });
        break;
      case "vm_role":
        entities.vmRoles?.push(base);
        break;
      case "dependency":
        entities.dependencies?.push(base);
        break;
      case "owner":
        entities.owners?.push({
          ...base,
          responsibilityType: asString(row.role),
        });
        break;
      case "maintenance_window":
        entities.maintenanceWindows?.push({
          ...base,
          timezone: asString(row.source),
          approvalRequired: asBoolean(row.confidence),
        });
        break;
      case "migration_group":
        entities.migrationGroups?.push({
          ...base,
          mustMoveTogether: /mustMoveTogether\s*=\s*true/i.test(base.notes ?? ""),
          canMoveSeparately: /canMoveSeparately\s*=\s*true/i.test(base.notes ?? ""),
        });
        break;
      case "business_criticality":
        entities.criticalities?.push(base);
        break;
      case "constraint":
        entities.constraints?.push({
          ...base,
          constraintType: /constraintType\s*=\s*([^;]+)/i.exec(base.notes ?? "")?.[1]?.trim() ?? "unknown",
          severity: /severity\s*=\s*([^;]+)/i.exec(base.notes ?? "")?.[1]?.trim() ?? base.criticality,
        });
        break;
    }
  });

  const payload: ApplicationDependencyPayload = {
    schema: APPLICATION_DEPENDENCY_SCHEMA,
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
      extractRawJsonString(vm.rawJson, ["biosUuid", "bios_uuid", "vmBiosUuid", "vmUuid", "uuid"]),
    );
    if (biosUuid) byBiosUuid.set(biosUuid, vm);
  }

  return { byInstanceUuid, byBiosUuid, byName };
}

function collectVmEvidenceRecords(payload: ApplicationDependencyPayload) {
  return [
    ...getArrayEntity(payload, "components"),
    ...getArrayEntity(payload, "vmRoles"),
    ...getArrayEntity(payload, "dependencies"),
    ...getArrayEntity(payload, "owners"),
    ...getArrayEntity(payload, "maintenanceWindows"),
    ...getArrayEntity(payload, "migrationGroups"),
    ...getArrayEntity(payload, "criticalities"),
    ...getArrayEntity(payload, "constraints"),
  ].filter((record) => asString(record.vmName) || asString(record.vmInstanceUuid) || asString(record.vmBiosUuid));
}

function matchVmRecords(records: Record<string, unknown>[], rvtoolsVms: RvtoolsVmForMatching[]): VmMatchResult[] {
  const indexes = buildRvtoolsIndexes(rvtoolsVms);
  const seen = new Set<string>();
  const uniqueRecords = records.filter((record) => {
    const key = [
      normalizeUuid(record.vmInstanceUuid),
      normalizeUuid(record.vmBiosUuid),
      normalizeName(record.vmName),
    ].filter(Boolean).join("|");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return uniqueRecords.map((record) => {
    const evidenceVmName = asString(record.vmName) ?? "unknown-vm";
    const instanceUuid = normalizeUuid(record.vmInstanceUuid);
    const biosUuid = normalizeUuid(record.vmBiosUuid);
    const name = normalizeName(record.vmName);

    if (instanceUuid && indexes.byInstanceUuid.has(instanceUuid)) {
      return {
        evidenceVmName,
        matchedVmName: indexes.byInstanceUuid.get(instanceUuid)?.vmName ?? null,
        matchedBy: "instanceUuid",
      };
    }

    if (biosUuid && indexes.byBiosUuid.has(biosUuid)) {
      return {
        evidenceVmName,
        matchedVmName: indexes.byBiosUuid.get(biosUuid)?.vmName ?? null,
        matchedBy: "biosUuid",
      };
    }

    if (name && indexes.byName.has(name)) {
      return {
        evidenceVmName,
        matchedVmName: indexes.byName.get(name)?.vmName ?? null,
        matchedBy: "name",
      };
    }

    return {
      evidenceVmName,
      matchedVmName: null,
      matchedBy: "unmatched",
    };
  });
}

function applicationNamesFrom(records: Record<string, unknown>[]) {
  return new Set(records.map((record) => normalizeName(record.applicationName)).filter((name): name is string => Boolean(name)));
}

function isCritical(record: Record<string, unknown>) {
  const criticality = asString(record.criticality)?.toLowerCase();
  return criticality === "critical" || criticality === "high";
}

function isSourceCustomerOnly(payload: ApplicationDependencyPayload) {
  const dependencySources = getArrayEntity(payload, "dependencies")
    .map((record) => asString(record.source)?.toLowerCase())
    .filter(Boolean);
  if (dependencySources.length === 0) return true;
  return dependencySources.every((source) => source === "customer_provided" || source === "manual");
}

function buildDependencyEdges(payload: ApplicationDependencyPayload) {
  return getArrayEntity(payload, "dependencies").map((record) => ({
    sourceVm: normalizeName(record.vmName),
    targetVm: normalizeName(record.dependsOnVmName),
    sourceApplication: normalizeName(record.applicationName),
    targetApplication: normalizeName(record.dependsOnApplicationName),
  }));
}

function countCircularDependencies(payload: ApplicationDependencyPayload) {
  const edges = buildDependencyEdges(payload);
  let circular = 0;
  edges.forEach((edge) => {
    if (edge.sourceVm && edge.targetVm && edge.sourceVm === edge.targetVm) {
      circular += 1;
      return;
    }
    if (
      edge.sourceVm &&
      edge.targetVm &&
      edges.some((candidate) => candidate.sourceVm === edge.targetVm && candidate.targetVm === edge.sourceVm)
    ) {
      circular += 1;
      return;
    }
    if (
      edge.sourceApplication &&
      edge.targetApplication &&
      edge.sourceApplication !== edge.targetApplication &&
      edges.some(
        (candidate) =>
          candidate.sourceApplication === edge.targetApplication &&
          candidate.targetApplication === edge.sourceApplication,
      )
    ) {
      circular += 1;
    }
  });
  return Math.ceil(circular / 2);
}

function countVmwareHints(vmwareSummary: Record<string, unknown> | null) {
  const signals = isRecord(vmwareSummary?.signals) ? vmwareSummary.signals : null;
  const tagSignals = Array.isArray(signals?.tagSignals) ? signals.tagSignals.length : 0;
  const resourcePoolSignals = Array.isArray(signals?.resourcePoolSignals) ? signals.resourcePoolSignals.length : 0;
  return tagSignals + resourcePoolSignals;
}

function validateEntityValues(payload: ApplicationDependencyPayload) {
  const warnings: string[] = [];
  const checkValue = (
    records: Record<string, unknown>[],
    key: string,
    predicate: (value: unknown) => boolean,
    label: string,
  ) => {
    const invalid = records.filter((record) => {
      const value = asString(record[key]);
      return Boolean(value && !predicate(value));
    }).length;
    if (invalid > 0) warnings.push(`${invalid} ${label} value(s) are outside the recommended template vocabulary.`);
  };

  const all = [
    ...getArrayEntity(payload, "applications"),
    ...getArrayEntity(payload, "components"),
    ...getArrayEntity(payload, "vmRoles"),
    ...getArrayEntity(payload, "dependencies"),
    ...getArrayEntity(payload, "owners"),
    ...getArrayEntity(payload, "maintenanceWindows"),
    ...getArrayEntity(payload, "migrationGroups"),
    ...getArrayEntity(payload, "criticalities"),
    ...getArrayEntity(payload, "constraints"),
  ];
  checkValue(all, "criticality", isApplicationCriticality, "criticality");
  checkValue(all, "downtimeTolerance", isDowntimeTolerance, "downtime tolerance");
  checkValue(getArrayEntity(payload, "dependencies"), "dependencyType", isDependencyType, "dependency type");
  checkValue(getArrayEntity(payload, "dependencies"), "confidence", isDependencyConfidence, "dependency confidence");
  checkValue(getArrayEntity(payload, "dependencies"), "source", isDependencySource, "dependency source");
  return warnings;
}

function buildApplicationDependencySummary(params: {
  payload: ApplicationDependencyPayload;
  matches: VmMatchResult[];
  rvtoolsVms: RvtoolsVmForMatching[];
  vmwareSummary: Record<string, unknown> | null;
}): ApplicationDependencySummaryForReadiness {
  const applications = getArrayEntity(params.payload, "applications");
  const components = getArrayEntity(params.payload, "components");
  const vmRoles = getArrayEntity(params.payload, "vmRoles");
  const dependencies = getArrayEntity(params.payload, "dependencies");
  const owners = getArrayEntity(params.payload, "owners");
  const maintenanceWindows = getArrayEntity(params.payload, "maintenanceWindows");
  const migrationGroups = getArrayEntity(params.payload, "migrationGroups");
  const criticalities = getArrayEntity(params.payload, "criticalities");
  const appNames = applicationNamesFrom([...applications, ...components, ...vmRoles, ...dependencies, ...migrationGroups, ...criticalities]);
  const ownerApps = applicationNamesFrom(owners);
  const maintenanceApps = applicationNamesFrom(maintenanceWindows);
  const criticalApps = new Set(
    [...applications, ...criticalities]
      .filter(isCritical)
      .map((record) => normalizeName(record.applicationName))
      .filter((name): name is string => Boolean(name)),
  );
  const criticalVmRecords = [...vmRoles, ...criticalities].filter((record) => asString(record.vmName) && isCritical(record));
  const mappedRvtoolsNames = new Set(params.matches.map((match) => normalizeName(match.matchedVmName)).filter(Boolean));
  const waveCandidates = migrationGroups.filter((record) => {
    const candidate = asString(record.waveCandidate)?.toLowerCase();
    return candidate === "functional_candidate" || candidate === "candidate";
  });
  const functionalValidated = migrationGroups.filter((record) => {
    const candidate = asString(record.waveCandidate)?.toLowerCase();
    return candidate === "functional_validated" || candidate === "validated";
  });
  const technicalOnly = migrationGroups.filter((record) => {
    const candidate = asString(record.waveCandidate)?.toLowerCase();
    return candidate === "technical_only" || candidate === "technical";
  });

  return {
    applicationCount: appNames.size || applications.length,
    componentCount: components.length,
    vmRoleCount: vmRoles.length,
    dependencyCount: dependencies.length,
    ownerCount: owners.length,
    maintenanceWindowCount: maintenanceWindows.length,
    migrationGroupCount: new Set(migrationGroups.map((record) => asString(record.migrationGroup)).filter(Boolean)).size || migrationGroups.length,
    criticalVmCount: criticalVmRecords.length,
    criticalApplicationCount: criticalApps.size,
    unmappedVmCount: params.matches.filter((match) => match.matchedBy === "unmatched").length,
    unownedApplicationCount: [...appNames].filter((name) => !ownerApps.has(name)).length,
    criticalAppWithoutOwnerCount: [...criticalApps].filter((name) => !ownerApps.has(name)).length,
    criticalVmWithoutOwnerCount: criticalVmRecords.filter((record) => {
      const ownerTeam = asString(record.ownerTeam);
      const ownerName = asString(record.ownerName);
      const appName = normalizeName(record.applicationName);
      return !ownerTeam && !ownerName && Boolean(appName && !ownerApps.has(appName));
    }).length,
    missingMaintenanceWindowCount: [...criticalApps].filter((name) => !maintenanceApps.has(name)).length,
    circularDependencyCount: countCircularDependencies(params.payload),
    externalDependencyWithoutNotesCount: dependencies.filter((record) => {
      const type = asString(record.dependencyType)?.toLowerCase();
      return type === "app_to_external" && !asString(record.notes);
    }).length,
    inconsistentMigrationGroupCount: migrationGroups.filter((record) => {
      return asBoolean(record.mustMoveTogether) === true && asBoolean(record.canMoveSeparately) === true;
    }).length,
    lowConfidenceDependencyCount: dependencies.filter((record) => {
      const confidence = asString(record.confidence)?.toLowerCase();
      return confidence === "low" || confidence === "unknown";
    }).length,
    inferredDependencyCount: dependencies.filter((record) => asString(record.source)?.toLowerCase() === "inferred").length,
    functionalWaveCandidateCount: waveCandidates.length,
    functionalWaveValidatedCount: functionalValidated.length,
    technicalOnlyWaveCount: technicalOnly.length || (migrationGroups.length === 0 ? 1 : 0),
    matchedVmCount: params.matches.filter((match) => match.matchedBy !== "unmatched").length,
    unmatchedVmCount: params.matches.filter((match) => match.matchedBy === "unmatched").length,
    unmappedRvtoolsVmCount: params.rvtoolsVms.filter((vm) => !mappedRvtoolsNames.has(normalizeName(vm.vmName))).length,
    rvtoolsVmCount: params.rvtoolsVms.length,
    customerProvidedOnly: isSourceCustomerOnly(params.payload),
    vmwareHintCount: countVmwareHints(params.vmwareSummary),
  };
}

function buildSignals(params: {
  payload: ApplicationDependencyPayload;
  summary: ApplicationDependencySummaryForReadiness;
  matches: VmMatchResult[];
  vmwareSummary: Record<string, unknown> | null;
}) {
  const applications = getArrayEntity(params.payload, "applications");
  const dependencies = getArrayEntity(params.payload, "dependencies");
  const owners = getArrayEntity(params.payload, "owners");
  const maintenanceWindows = getArrayEntity(params.payload, "maintenanceWindows");
  const migrationGroups = getArrayEntity(params.payload, "migrationGroups");
  const criticalities = getArrayEntity(params.payload, "criticalities");
  const constraints = getArrayEntity(params.payload, "constraints");

  return {
    criticalitySignals: [...applications, ...criticalities].slice(0, 50).map((record) => ({
      applicationName: asString(record.applicationName),
      vmName: asString(record.vmName),
      criticality: asString(record.criticality),
      downtimeTolerance: asString(record.downtimeTolerance),
    })),
    ownerSignals: owners.slice(0, 50).map((record) => ({
      applicationName: asString(record.applicationName),
      vmName: asString(record.vmName),
      ownerTeam: asString(record.ownerTeam),
      responsibilityType: asString(record.responsibilityType),
    })),
    dependencySignals: dependencies.slice(0, 50).map((record) => ({
      applicationName: asString(record.applicationName),
      vmName: asString(record.vmName),
      dependencyType: asString(record.dependencyType),
      dependsOnVmName: asString(record.dependsOnVmName),
      source: asString(record.source),
      confidence: asString(record.confidence),
    })),
    maintenanceWindowSignals: maintenanceWindows.slice(0, 50).map((record) => ({
      applicationName: asString(record.applicationName),
      vmName: asString(record.vmName),
      maintenanceWindow: asString(record.maintenanceWindow),
      approvalRequired: asBoolean(record.approvalRequired),
    })),
    migrationGroupSignals: migrationGroups.slice(0, 50).map((record) => ({
      migrationGroup: asString(record.migrationGroup),
      applicationName: asString(record.applicationName),
      vmName: asString(record.vmName),
      waveCandidate: asString(record.waveCandidate),
      mustMoveTogether: asBoolean(record.mustMoveTogether),
      canMoveSeparately: asBoolean(record.canMoveSeparately),
    })),
    technicalWaveSignals: migrationGroups.filter((record) => asString(record.waveCandidate)?.includes("technical")).slice(0, 50),
    functionalWaveSignals: migrationGroups.filter((record) => asString(record.waveCandidate)?.includes("functional")).slice(0, 50),
    constraintSignals: constraints.slice(0, 50).map((record) => ({
      constraintType: asString(record.constraintType),
      applicationName: asString(record.applicationName),
      vmName: asString(record.vmName),
      severity: asString(record.severity),
    })),
    vmwareHintSignals: params.summary.vmwareHintCount > 0 ? { hintCount: params.summary.vmwareHintCount } : null,
  };
}

function emptySummary(parserFailed = false) {
  return {
    schema: APPLICATION_DEPENDENCY_SCHEMA,
    applicationDependencySummary: null,
    readiness: evaluateApplicationDependencyReadiness({
      parserFailed,
      summary: {
        applicationCount: 0,
        componentCount: 0,
        vmRoleCount: 0,
        dependencyCount: 0,
        ownerCount: 0,
        maintenanceWindowCount: 0,
        migrationGroupCount: 0,
        criticalVmCount: 0,
        criticalApplicationCount: 0,
        unmappedVmCount: 0,
        unownedApplicationCount: 0,
        criticalAppWithoutOwnerCount: 0,
        criticalVmWithoutOwnerCount: 0,
        missingMaintenanceWindowCount: 0,
        circularDependencyCount: 0,
        externalDependencyWithoutNotesCount: 0,
        inconsistentMigrationGroupCount: 0,
        lowConfidenceDependencyCount: 0,
        inferredDependencyCount: 0,
        functionalWaveCandidateCount: 0,
        functionalWaveValidatedCount: 0,
        technicalOnlyWaveCount: 0,
        matchedVmCount: 0,
        unmatchedVmCount: 0,
        unmappedRvtoolsVmCount: 0,
        rvtoolsVmCount: 0,
        customerProvidedOnly: true,
        vmwareHintCount: 0,
      },
    }),
  };
}

export function parseApplicationDependencyPayload(params: {
  payload: unknown;
  rvtoolsVms?: RvtoolsVmForMatching[];
  vmwareSummary?: Record<string, unknown> | null;
}): EvidenceParserResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const envelopeValidation = validateApplicationDependencyEnvelope(params.payload);
  warnings.push(...envelopeValidation.warnings);
  errors.push(...envelopeValidation.errors);

  if (!envelopeValidation.ok || !isRecord(params.payload)) {
    return {
      status: EvidenceParseResultStatus.failed,
      summary: emptySummary(true),
      warnings,
      errors,
      normalizedEntities: {},
      parserKey: APPLICATION_DEPENDENCY_PARSER_KEY,
      parserVersion: APPLICATION_DEPENDENCY_PARSER_VERSION,
    };
  }

  const secretFindings = scanForSecretPatterns(params.payload);
  if (secretFindings.length > 0) {
    return {
      status: EvidenceParseResultStatus.failed,
      summary: {
        schema: APPLICATION_DEPENDENCY_SCHEMA,
        applicationDependencySummary: null,
        secretScan: {
          findingCount: secretFindings.length,
          codes: [...new Set(secretFindings.map((finding) => finding.code))],
        },
      },
      warnings,
      errors: [
        ...errors,
        "Potential secret-like content detected in Application Dependency evidence payload. Values were not stored in parser summary.",
      ],
      normalizedEntities: {},
      parserKey: APPLICATION_DEPENDENCY_PARSER_KEY,
      parserVersion: APPLICATION_DEPENDENCY_PARSER_VERSION,
    };
  }

  const payload = params.payload as ApplicationDependencyPayload;
  warnings.push(...validateEntityValues(payload));
  const rvtoolsVms = params.rvtoolsVms ?? [];
  const vmRecords = collectVmEvidenceRecords(payload);
  const matches = matchVmRecords(vmRecords, rvtoolsVms);

  if (rvtoolsVms.length === 0) {
    warnings.push("Application Dependency evidence uploaded before RVTools inventory; VM matching is limited.");
  } else if (matches.some((match) => match.matchedBy === "unmatched")) {
    warnings.push("Some Application Dependency VMs could not be matched to parsed RVTools inventory.");
  }

  if (!params.vmwareSummary) {
    warnings.push("VMware Enrichment evidence is not available; tags and folders cannot improve dependency hints.");
  }

  const summary = buildApplicationDependencySummary({
    payload,
    matches,
    rvtoolsVms,
    vmwareSummary: params.vmwareSummary ?? null,
  });
  const readiness = evaluateApplicationDependencyReadiness({
    summary,
    rvtoolsVmAvailable: rvtoolsVms.length > 0,
    vmwareEnrichmentAvailable: Boolean(params.vmwareSummary),
  });
  warnings.push(...readiness.warnings);

  const normalizedSummary = {
    schema: APPLICATION_DEPENDENCY_SCHEMA,
    source: {
      type: payload.source?.type ?? null,
      owner: payload.source?.owner ?? null,
      mode: payload.source?.mode ?? null,
    },
    applicationDependencySummary: summary,
    readiness,
    signals: buildSignals({ payload, summary, matches, vmwareSummary: params.vmwareSummary ?? null }),
    matching: {
      matchedVmCount: summary.matchedVmCount,
      unmatchedVmCount: summary.unmatchedVmCount,
      unmappedRvtoolsVmCount: summary.unmappedRvtoolsVmCount,
      matchedByInstanceUuid: matches.filter((match) => match.matchedBy === "instanceUuid").length,
      matchedByBiosUuid: matches.filter((match) => match.matchedBy === "biosUuid").length,
      matchedByName: matches.filter((match) => match.matchedBy === "name").length,
      unmatched: matches.filter((match) => match.matchedBy === "unmatched").slice(0, 50),
    },
  };

  return {
    status: warnings.length > 0 || readiness.dependencyReadinessStatus !== "dependency_validated"
      ? EvidenceParseResultStatus.parsed_with_warnings
      : EvidenceParseResultStatus.parsed,
    summary: normalizedSummary,
    warnings: [...new Set(warnings)],
    errors,
    normalizedEntities: {
      matching: matches,
      readiness,
    },
    parserKey: APPLICATION_DEPENDENCY_PARSER_KEY,
    parserVersion: APPLICATION_DEPENDENCY_PARSER_VERSION,
  };
}

export function parseApplicationDependencyCsv(params: {
  text: string;
  rvtoolsVms?: RvtoolsVmForMatching[];
  vmwareSummary?: Record<string, unknown> | null;
}) {
  const csv = parseCsv(params.text);
  if (csv.errors.length > 0) {
    return {
      status: EvidenceParseResultStatus.failed,
      summary: emptySummary(true),
      warnings: csv.warnings,
      errors: csv.errors,
      normalizedEntities: {},
      parserKey: APPLICATION_DEPENDENCY_PARSER_KEY,
      parserVersion: APPLICATION_DEPENDENCY_PARSER_VERSION,
    } satisfies EvidenceParserResult;
  }

  const converted = csvRowsToPayload(csv.rows);
  if (converted.errors.length > 0) {
    return {
      status: EvidenceParseResultStatus.failed,
      summary: emptySummary(true),
      warnings: [...csv.warnings, ...converted.warnings],
      errors: converted.errors,
      normalizedEntities: {},
      parserKey: APPLICATION_DEPENDENCY_PARSER_KEY,
      parserVersion: APPLICATION_DEPENDENCY_PARSER_VERSION,
    } satisfies EvidenceParserResult;
  }

  const result = parseApplicationDependencyPayload({
    payload: converted.payload,
    rvtoolsVms: params.rvtoolsVms,
    vmwareSummary: params.vmwareSummary,
  });

  return {
    ...result,
    warnings: [...new Set([...csv.warnings, ...converted.warnings, ...result.warnings])],
  };
}

export function createApplicationDependencyParser(): EvidenceParser {
  return {
    parserKey: APPLICATION_DEPENDENCY_PARSER_KEY,
    parserVersion: APPLICATION_DEPENDENCY_PARSER_VERSION,
    supportedModules: [EvidenceModuleKey.application_dependency],
    supportedInputTypes: [EvidenceModuleSourceType.json, EvidenceModuleSourceType.csv],
    async parse(input: EvidenceParserInput) {
      const rvtoolsVms = await prisma.parsedVM.findMany({
        where: {
          assessmentId: input.assessmentId,
        },
        select: {
          vmName: true,
          rawJson: true,
        },
      });
      const vmwareParse = await prisma.evidenceParseResult.findFirst({
        where: {
          assessmentId: input.assessmentId,
          moduleKey: EvidenceModuleKey.vmware_enrichment,
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
      const vmwareSummary =
        isRecord(vmwareParse?.summaryJson) ? vmwareParse.summaryJson as Record<string, unknown> : null;

      const buffer = await readEvidenceFile(input.filePath);
      const text = buffer.toString("utf8");
      const inputType = input.inputType ?? EvidenceModuleSourceType.manual;

      if (inputType === EvidenceModuleSourceType.csv || input.originalFilename?.toLowerCase().endsWith(".csv")) {
        return parseApplicationDependencyCsv({
          text,
          rvtoolsVms,
          vmwareSummary,
        });
      }

      try {
        return parseApplicationDependencyPayload({
          payload: JSON.parse(text),
          rvtoolsVms,
          vmwareSummary,
        });
      } catch {
        return {
          status: EvidenceParseResultStatus.failed,
          summary: emptySummary(true),
          warnings: [],
          errors: ["Application Dependency evidence must be valid JSON or CSV."],
          normalizedEntities: {},
          parserKey: APPLICATION_DEPENDENCY_PARSER_KEY,
          parserVersion: APPLICATION_DEPENDENCY_PARSER_VERSION,
        };
      }
    },
  };
}
