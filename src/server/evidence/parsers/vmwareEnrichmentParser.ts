import { EvidenceModuleKey, EvidenceModuleSourceType, EvidenceParseResultStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { readEvidenceFile } from "../localStorageService";
import type { EvidenceParser, EvidenceParserInput, EvidenceParserResult } from "../evidenceParserRegistry";
import {
  VMWARE_ENRICHMENT_SCHEMA,
  asArray,
  asNumber,
  asString,
  asStringArray,
  isRecord,
  validateVmwareEnrichmentEnvelope,
  type VmwareEnrichmentPayload,
  type VmwareEnrichmentVm,
} from "../schemas/vmwareEnrichmentSchema";

export const VMWARE_ENRICHMENT_PARSER_KEY = "vmware-enrichment-parser-v1";
export const VMWARE_ENRICHMENT_PARSER_VERSION = "1.0.0";

type RvtoolsVmForMatching = {
  vmName: string;
  rawJson?: unknown;
};

type VmMatchResult = {
  collectorVmName: string;
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
  { code: "connection_string_pattern", regex: /(postgresql|mysql|mongodb|sqlserver):\/\//i },
];

function normalizeName(value: unknown) {
  const text = asString(value);
  return text ? text.toLowerCase().replace(/\s+/g, " ").trim() : null;
}

function normalizeUuid(value: unknown) {
  const text = asString(value);
  return text ? text.toLowerCase().replace(/[{}]/g, "").trim() : null;
}

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

function matchCollectorVm(vm: VmwareEnrichmentVm, indexes: ReturnType<typeof buildRvtoolsIndexes>): VmMatchResult {
  const collectorVmName = asString(vm.name) ?? "unknown-vm";
  const instanceUuid = normalizeUuid(vm.instanceUuid);
  const biosUuid = normalizeUuid(vm.biosUuid);
  const name = normalizeName(vm.name);

  if (instanceUuid && indexes.byInstanceUuid.has(instanceUuid)) {
    return {
      collectorVmName,
      matchedVmName: indexes.byInstanceUuid.get(instanceUuid)?.vmName ?? null,
      matchedBy: "instanceUuid",
    };
  }

  if (biosUuid && indexes.byBiosUuid.has(biosUuid)) {
    return {
      collectorVmName,
      matchedVmName: indexes.byBiosUuid.get(biosUuid)?.vmName ?? null,
      matchedBy: "biosUuid",
    };
  }

  if (name && indexes.byName.has(name)) {
    return {
      collectorVmName,
      matchedVmName: indexes.byName.get(name)?.vmName ?? null,
      matchedBy: "name",
    };
  }

  return {
    collectorVmName,
    matchedVmName: null,
    matchedBy: "unmatched",
  };
}

function buildVmwareSignals(params: {
  vms: VmwareEnrichmentVm[];
  snapshots: unknown[];
  tags: unknown[];
  networks: unknown[];
  datastores: unknown[];
  drsRules: unknown[];
}) {
  const oldSnapshotThresholdDays = 30;
  const snapshotRisks = params.snapshots
    .filter(isRecord)
    .map((snapshot) => ({
      vmName: asString(snapshot.vmName),
      snapshotName: asString(snapshot.snapshotName),
      ageDays: asNumber(snapshot.ageDays),
    }))
    .filter((snapshot) => (snapshot.ageDays ?? 0) >= oldSnapshotThresholdDays);

  const tagSignals = params.vms.map((vm) => ({
    vmName: asString(vm.name),
    tagCount: asStringArray(vm.tags).length,
  }));

  const resourcePoolSignals = params.vms
    .map((vm) => ({
      vmName: asString(vm.name),
      resourcePool: asString(vm.resourcePool),
    }))
    .filter((item) => item.resourcePool);

  const networkSignals = params.networks
    .filter(isRecord)
    .map((network) => ({
      vmName: asString(network.vmName),
      networkName: asString(network.networkName),
      connected: typeof network.connected === "boolean" ? network.connected : null,
    }));

  const clusterPolicySignals = params.drsRules
    .filter(isRecord)
    .map((rule) => ({
      name: asString(rule.name),
      type: asString(rule.type),
      enabled: typeof rule.enabled === "boolean" ? rule.enabled : null,
      vmCount: asArray(rule.vmNames).length,
    }));

  return {
    snapshotRisks,
    tagSignals,
    resourcePoolSignals,
    networkSignals,
    clusterPolicySignals,
    datastoreMappingCount: params.datastores.filter(isRecord).reduce((total, datastore) => {
      return total + asArray(datastore.vmNames).length;
    }, 0),
  };
}

function warningObjectsToMessages(value: unknown) {
  return asArray(value)
    .map((item) => {
      if (typeof item === "string") return item;
      if (!isRecord(item)) return null;
      const code = asString(item.code);
      const message = asString(item.message);
      const target = asString(item.target);
      if (!message && !code) return null;
      return [code, message, target ? `target=${target}` : null].filter(Boolean).join(": ");
    })
    .filter((item): item is string => Boolean(item));
}

export function parseVmwareEnrichmentPayload(params: {
  payload: unknown;
  rvtoolsVms?: RvtoolsVmForMatching[];
}): EvidenceParserResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const envelopeValidation = validateVmwareEnrichmentEnvelope(params.payload);
  warnings.push(...envelopeValidation.warnings);
  errors.push(...envelopeValidation.errors);

  if (!envelopeValidation.ok || !isRecord(params.payload)) {
    return {
      status: EvidenceParseResultStatus.failed,
      summary: {
        schema: isRecord(params.payload) ? params.payload.schema ?? null : null,
        vmwareEnrichmentSummary: null,
      },
      warnings,
      errors,
      normalizedEntities: {},
      parserKey: VMWARE_ENRICHMENT_PARSER_KEY,
      parserVersion: VMWARE_ENRICHMENT_PARSER_VERSION,
    };
  }

  const secretFindings = scanForSecretPatterns(params.payload);
  if (secretFindings.length > 0) {
    return {
      status: EvidenceParseResultStatus.failed,
      summary: {
        schema: VMWARE_ENRICHMENT_SCHEMA,
        vmwareEnrichmentSummary: null,
        secretScan: {
          findingCount: secretFindings.length,
          codes: [...new Set(secretFindings.map((finding) => finding.code))],
        },
      },
      warnings,
      errors: [
        ...errors,
        "Potential secret-like content detected in VMware enrichment payload. Values were not stored in parser summary.",
      ],
      normalizedEntities: {},
      parserKey: VMWARE_ENRICHMENT_PARSER_KEY,
      parserVersion: VMWARE_ENRICHMENT_PARSER_VERSION,
    };
  }

  const payload = params.payload as VmwareEnrichmentPayload;
  const entities = payload.entities ?? {};
  const vms = asArray(entities.vms).filter(isRecord) as VmwareEnrichmentVm[];
  const snapshots = asArray(entities.snapshots);
  const tags = asArray(entities.tags);
  const hosts = asArray(entities.hosts);
  const clusters = asArray(entities.clusters);
  const datastores = asArray(entities.datastores);
  const networks = asArray(entities.networks);
  const drsRules = asArray(entities.drsRules);
  const collectorWarnings = warningObjectsToMessages(payload.warnings);
  const collectorErrors = warningObjectsToMessages(payload.errors);

  warnings.push(...collectorWarnings.map((warning) => `Collector warning: ${warning}`));
  warnings.push(...collectorErrors.map((error) => `Collector reported non-fatal error: ${error}`));

  const rvtoolsVms = params.rvtoolsVms ?? [];
  if (rvtoolsVms.length === 0) {
    warnings.push("VMware enrichment uploaded before RVTools inventory; matching is deferred/limited.");
  }

  const indexes = buildRvtoolsIndexes(rvtoolsVms);
  const matches = vms.map((vm) => matchCollectorVm(vm, indexes));
  const matchedByInstanceUuid = matches.filter((match) => match.matchedBy === "instanceUuid").length;
  const matchedByBiosUuid = matches.filter((match) => match.matchedBy === "biosUuid").length;
  const matchedByName = matches.filter((match) => match.matchedBy === "name").length;
  const unmatched = matches.filter((match) => match.matchedBy === "unmatched");
  const matchedVmCount = matches.length - unmatched.length;

  if (rvtoolsVms.length > 0 && unmatched.length > 0) {
    warnings.push(`${unmatched.length} VMware enrichment VM(s) could not be matched to parsed RVTools inventory.`);
  }

  const signals = buildVmwareSignals({ vms, snapshots, tags, networks, datastores, drsRules });
  const taggedVmCount = vms.filter((vm) => asStringArray(vm.tags).length > 0).length;
  const resourcePools = new Set(vms.map((vm) => asString(vm.resourcePool)).filter(Boolean));
  const vmWithSnapshots = new Set(
    snapshots.filter(isRecord).map((snapshot) => asString(snapshot.vmName)).filter(Boolean),
  );

  const summary = {
    schema: VMWARE_ENRICHMENT_SCHEMA,
    collector: {
      name: payload.collector?.name ?? null,
      version: payload.collector?.version ?? null,
      mode: payload.collector?.mode ?? null,
    },
    vmwareEnrichmentSummary: {
      vmCount: vms.length,
      matchedVmCount,
      unmatchedVmCount: unmatched.length,
      snapshotVmCount: vmWithSnapshots.size,
      oldSnapshotCount: signals.snapshotRisks.length,
      taggedVmCount,
      untaggedVmCount: Math.max(0, vms.length - taggedVmCount),
      resourcePoolCount: resourcePools.size,
      drsRuleCount: drsRules.length,
      networkBindingCount: networks.length,
      datastoreMappingCount: signals.datastoreMappingCount,
      hostCount: hosts.length,
      clusterCount: clusters.length,
      datastoreCount: datastores.length,
      tagAssignmentCount: tags.length,
    },
    signals: {
      snapshotRisks: signals.snapshotRisks.slice(0, 50),
      tagSignals: signals.tagSignals.slice(0, 50),
      resourcePoolSignals: signals.resourcePoolSignals.slice(0, 50),
      networkSignals: signals.networkSignals.slice(0, 50),
      clusterPolicySignals: signals.clusterPolicySignals.slice(0, 50),
    },
    matching: {
      matchedByInstanceUuid,
      matchedByBiosUuid,
      matchedByName,
      unmatched: unmatched.slice(0, 50),
    },
  };

  return {
    status: warnings.length > 0
      ? EvidenceParseResultStatus.parsed_with_warnings
      : EvidenceParseResultStatus.parsed,
    summary,
    warnings,
    errors,
    normalizedEntities: {
      matching: matches,
      vms: vms.map((vm) => ({
        name: asString(vm.name),
        instanceUuid: asString(vm.instanceUuid),
        biosUuid: asString(vm.biosUuid),
        cluster: asString(vm.cluster),
        vmHost: asString(vm.vmHost),
        resourcePool: asString(vm.resourcePool),
        snapshotCount: asNumber(vm.snapshotCount) ?? 0,
        tagCount: asStringArray(vm.tags).length,
      })),
      signals: summary.signals,
    },
    parserKey: VMWARE_ENRICHMENT_PARSER_KEY,
    parserVersion: VMWARE_ENRICHMENT_PARSER_VERSION,
  };
}

export function createVmwareEnrichmentParser(): EvidenceParser {
  return {
    parserKey: VMWARE_ENRICHMENT_PARSER_KEY,
    parserVersion: VMWARE_ENRICHMENT_PARSER_VERSION,
    supportedModules: [EvidenceModuleKey.vmware_enrichment],
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
            vmwareEnrichmentSummary: null,
          },
          warnings: [],
          errors: ["VMware enrichment evidence must be valid JSON."],
          normalizedEntities: {},
          parserKey: VMWARE_ENRICHMENT_PARSER_KEY,
          parserVersion: VMWARE_ENRICHMENT_PARSER_VERSION,
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

      return parseVmwareEnrichmentPayload({
        payload,
        rvtoolsVms,
      });
    },
  };
}
