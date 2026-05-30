import {
  AssessmentStorageAnalysisStatus,
  AssessmentStorageContextStatus,
  AssessmentStorageDestinationReadinessStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  getAiAdvisoryProviderKey,
  getEffectiveAiAdvisoryConfig,
} from "../ai/aiAdvisoryConfig";
import type { AiAdvisoryConfig } from "../ai/aiAdvisoryTypes";
import { parseJsonText } from "../ai/aiAdvisoryClient";
import { recordAiUsageEvent, type AiUsageStatus } from "../ai/aiUsageService";
import { assertCanUseAi, getEffectiveUserEntitlement } from "../admin/runtimeSettingsService";
import { logger } from "../logging/logger";
import { ensureAssessmentOwnership, type AssessmentDetail } from "./assessmentService";
import {
  chunkStorageContextText,
  summarizeStorageChunkMetadata,
} from "./storageContextChunkingService";
import {
  buildStorageContextPrompt,
  type StorageContextPromptPayload,
} from "./storageContextPrompt";
import {
  sanitizeStorageContextForAi,
  sanitizeStorageContextLabel,
} from "./storageContextSecurityService";
import {
  STORAGE_CONTEXT_ANALYSIS_VERSION,
  STORAGE_CONTEXT_PROMPT_VERSION,
  type StorageContextIntelligenceResult,
  type StorageDestinationOption,
} from "./storageContextIntelligenceTypes";
import {
  calculateStorageReadinessScores,
  labelFromStorageScore,
  type StorageReadinessScoringInput,
} from "./storageReadinessScoringService";
import { resolveStorageReadinessPlanLimits } from "./storageReadinessPlanLimits";
import { buildStorageReadinessAuditMetadata } from "./storageReadinessValidation";

type ActorParams = {
  userId: string;
  assessmentId: string;
};

type NormalizedStorageAnalysis = StorageContextIntelligenceResult & {
  parseWarnings?: string[];
};

type ProviderTextResult = {
  text: string;
  durationMs: number;
};

const MAX_ARRAY_ITEMS = 12;
const MAX_PROMPT_CHUNK_WORDS = 1_600;

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function persistedStorageAnalysisJson(
  result: StorageContextIntelligenceResult,
  modelUsed: string | null,
) {
  return {
    ...result,
    analysisVersion: STORAGE_CONTEXT_ANALYSIS_VERSION,
    promptVersion: STORAGE_CONTEXT_PROMPT_VERSION,
    modelUsed,
  };
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizedString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 2_000) : fallback;
}

function normalizedBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function oneOf<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number],
): T[number] {
  return typeof value === "string" && allowed.includes(value as T[number])
    ? (value as T[number])
    : fallback;
}

function normalizeArray<T>(
  value: unknown,
  mapper: (item: unknown) => T | null,
  maxItems = MAX_ARRAY_ITEMS,
): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(mapper).filter((item): item is T => item !== null).slice(0, maxItems);
}

function normalizeStringList(value: unknown, maxItems = 8) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim().slice(0, 500))
    .slice(0, maxItems);
}

function normalizeSafetyFlag(item: unknown) {
  if (typeof item !== "object" || item === null) return null;
  const row = item as Record<string, unknown>;
  const flag = normalizedString(row.flag);
  if (!flag) return null;

  return {
    flag,
    severity: oneOf(row.severity, ["high", "medium", "low"] as const, "medium"),
    explanation: normalizedString(row.explanation, "Storage context safety note."),
  } satisfies StorageContextIntelligenceResult["safetyFlags"][number];
}

function emptyStorageResult(): StorageContextIntelligenceResult {
  return {
    interpretedStorageSummary:
      "Storage context analysis is not available yet. Use structured inputs, RVTools storage evidence and missing evidence items as planning signals.",
    sourceStorageSummary: [],
    targetStoragePreference: null,
    destinationOptions: [],
    storageConstraints: [],
    cephSignals: {
      customerInterested: false,
      signalSummary: "No Ceph final decision is produced in STORAGE-2.",
      positiveSignals: [],
      riskSignals: [],
      missingEvidence: [],
      finalDecisionDeferred: true,
    },
    operationalReadinessSignals: [],
    missingEvidence: [],
    contradictions: [],
    nextQuestions: [],
    recommendationImpact: [],
    scores: {
      storageCompletenessScore: 0,
      storageEvidenceConfidence: 0,
      storageDestinationReadiness: 0,
      storageMigrationRisk: 0,
      preliminaryCephConfidence: null,
    },
    confidenceLabels: {
      storageContextConfidence: "low",
      storageEvidenceConfidenceLabel: "low",
    },
    safetyFlags: [],
  };
}

export function parseAndValidateStorageAiOutput(
  value: string | unknown,
  fallback: StorageContextIntelligenceResult = emptyStorageResult(),
): NormalizedStorageAnalysis {
  const parsed = typeof value === "string" ? parseJsonText(value) : value;

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      ...fallback,
      safetyFlags: [
        ...fallback.safetyFlags,
        {
          flag: "invalid_ai_json",
          severity: "medium",
          explanation: "AI output was not valid JSON and a safe fallback was used.",
        },
      ],
      parseWarnings: ["invalid_json"],
    };
  }

  const root = parsed as Record<string, unknown>;
  const scores = typeof root.scores === "object" && root.scores !== null
    ? (root.scores as Record<string, unknown>)
    : {};
  const confidenceLabels =
    typeof root.confidenceLabels === "object" && root.confidenceLabels !== null
      ? (root.confidenceLabels as Record<string, unknown>)
      : {};
  const cephSignals = typeof root.cephSignals === "object" && root.cephSignals !== null
    ? (root.cephSignals as Record<string, unknown>)
    : {};
  const targetStoragePreference =
    typeof root.targetStoragePreference === "object" &&
    root.targetStoragePreference !== null &&
    !Array.isArray(root.targetStoragePreference)
      ? (root.targetStoragePreference as Record<string, unknown>)
      : null;

  const result: StorageContextIntelligenceResult = {
    interpretedStorageSummary:
      normalizedString(root.interpretedStorageSummary, fallback.interpretedStorageSummary) ||
      fallback.interpretedStorageSummary,
    sourceStorageSummary: normalizeArray(root.sourceStorageSummary, (item) => {
      if (typeof item !== "object" || item === null) return null;
      const row = item as Record<string, unknown>;
      const summaryItem = normalizedString(row.item);
      return summaryItem
        ? {
            item: summaryItem,
            evidence: normalizedString(row.evidence, "Storage evidence requires validation."),
            confidence: oneOf(row.confidence, ["high", "medium", "low"] as const, "low"),
            source: oneOf(
              row.source,
              ["rvtools", "customer_reported", "additional_evidence", "inferred"] as const,
              "inferred",
            ),
          }
        : null;
    }),
    targetStoragePreference: targetStoragePreference
      ? {
          preference: normalizedString(targetStoragePreference.preference, "unknown"),
          rationale: normalizedString(
            targetStoragePreference.rationale,
            "Target storage preference requires validation.",
          ),
          confidence: oneOf(
            targetStoragePreference.confidence,
            ["high", "medium", "low"] as const,
            "low",
          ),
          source: oneOf(
            targetStoragePreference.source,
            ["customer_reported", "structured_input", "inferred"] as const,
            "structured_input",
          ),
        }
      : fallback.targetStoragePreference,
    destinationOptions: normalizeArray(root.destinationOptions, (item) => {
      if (typeof item !== "object" || item === null) return null;
      const row = item as Record<string, unknown>;
      return {
        option: oneOf(
          row.option,
          [
            "zfs_local",
            "nfs_san",
            "ceph_candidate",
            "pbs_related",
            "existing_shared_storage",
            "unknown",
          ] as const,
          "unknown",
        ),
        suitability: oneOf(
          row.suitability,
          ["possible", "risky", "not_enough_evidence", "not_recommended_yet"] as const,
          "not_enough_evidence",
        ),
        rationale: normalizedString(row.rationale, "Storage option requires validation."),
        missingEvidence: normalizeStringList(row.missingEvidence),
      };
    }),
    storageConstraints: normalizeArray(root.storageConstraints, (item) => {
      if (typeof item !== "object" || item === null) return null;
      const row = item as Record<string, unknown>;
      const constraint = normalizedString(row.constraint);
      return constraint
        ? {
            constraint,
            type: oneOf(
              row.type,
              [
                "capacity",
                "network",
                "downtime",
                "backup",
                "ha",
                "growth",
                "operations",
                "unknown",
              ] as const,
              "unknown",
            ),
            impact: normalizedString(row.impact, "Impact requires validation."),
            source: oneOf(
              row.source,
              ["customer_reported", "structured_input", "inferred"] as const,
              "structured_input",
            ),
          }
        : null;
    }),
    cephSignals: {
      customerInterested: normalizedBoolean(
        cephSignals.customerInterested,
        fallback.cephSignals.customerInterested,
      ),
      signalSummary: normalizedString(
        cephSignals.signalSummary,
        fallback.cephSignals.signalSummary,
      ),
      positiveSignals: normalizeStringList(cephSignals.positiveSignals),
      riskSignals: normalizeStringList(cephSignals.riskSignals),
      missingEvidence: normalizeStringList(cephSignals.missingEvidence),
      finalDecisionDeferred: true,
    },
    operationalReadinessSignals: normalizeArray(root.operationalReadinessSignals, (item) => {
      if (typeof item !== "object" || item === null) return null;
      const row = item as Record<string, unknown>;
      const signal = normalizedString(row.signal);
      return signal
        ? {
            signal,
            impact: normalizedString(row.impact, "Operational impact requires validation."),
            confidence: oneOf(row.confidence, ["high", "medium", "low"] as const, "low"),
          }
        : null;
    }),
    missingEvidence: normalizeArray(root.missingEvidence, (item) => {
      if (typeof item !== "object" || item === null) return null;
      const row = item as Record<string, unknown>;
      const itemText = normalizedString(row.item);
      return itemText
        ? {
            item: itemText,
            whyItMatters: normalizedString(
              row.whyItMatters,
              "Missing storage evidence can change destination design confidence.",
            ),
            priority: oneOf(row.priority, ["high", "medium", "low"] as const, "medium"),
          }
        : null;
    }),
    contradictions: normalizeArray(root.contradictions, (item) => {
      if (typeof item !== "object" || item === null) return null;
      const row = item as Record<string, unknown>;
      const title = normalizedString(row.title);
      return title
        ? {
            title,
            description: normalizedString(row.description, "Contradiction requires validation."),
            validationRecommendation: normalizedString(
              row.validationRecommendation,
              "Validate storage evidence before migration design.",
            ),
          }
        : null;
    }),
    nextQuestions: normalizeArray(root.nextQuestions, (item) => {
      if (typeof item !== "object" || item === null) return null;
      const row = item as Record<string, unknown>;
      const question = normalizedString(row.question);
      return question
        ? {
            question,
            reason: normalizedString(row.reason, "This question improves storage readiness."),
            priority: oneOf(row.priority, ["high", "medium", "low"] as const, "medium"),
          }
        : null;
    }),
    recommendationImpact: normalizeArray(root.recommendationImpact, (item) => {
      if (typeof item !== "object" || item === null) return null;
      const row = item as Record<string, unknown>;
      return {
        area: oneOf(
          row.area,
          [
            "storage_destination",
            "ceph",
            "backup",
            "network",
            "migration_waves",
            "capacity",
            "operations",
          ] as const,
          "storage_destination",
        ),
        impact: normalizedString(row.impact, "Recommendation impact requires validation."),
        shouldAffectScore: normalizedBoolean(row.shouldAffectScore, false),
        note: normalizedString(row.note, "Advisory context only."),
      };
    }),
    scores: {
      storageCompletenessScore: clampScore(
        Number(scores.storageCompletenessScore ?? fallback.scores.storageCompletenessScore),
      ),
      storageEvidenceConfidence: clampScore(
        Number(scores.storageEvidenceConfidence ?? fallback.scores.storageEvidenceConfidence),
      ),
      storageDestinationReadiness: clampScore(
        Number(scores.storageDestinationReadiness ?? fallback.scores.storageDestinationReadiness),
      ),
      storageMigrationRisk: clampScore(
        Number(scores.storageMigrationRisk ?? fallback.scores.storageMigrationRisk),
      ),
      preliminaryCephConfidence:
        scores.preliminaryCephConfidence === null ||
        scores.preliminaryCephConfidence === undefined
          ? fallback.scores.preliminaryCephConfidence
          : clampScore(Number(scores.preliminaryCephConfidence)),
    },
    confidenceLabels: {
      storageContextConfidence: oneOf(
        confidenceLabels.storageContextConfidence,
        ["high", "medium", "limited", "low"] as const,
        fallback.confidenceLabels.storageContextConfidence,
      ),
      storageEvidenceConfidenceLabel: oneOf(
        confidenceLabels.storageEvidenceConfidenceLabel,
        ["high", "medium", "limited", "low"] as const,
        fallback.confidenceLabels.storageEvidenceConfidenceLabel,
      ),
    },
    safetyFlags: normalizeArray(root.safetyFlags, normalizeSafetyFlag),
  };

  if (result.missingEvidence.length === 0) {
    result.missingEvidence = fallback.missingEvidence;
  }

  if (result.destinationOptions.length === 0) {
    result.destinationOptions = fallback.destinationOptions;
  }

  result.cephSignals.finalDecisionDeferred = true;
  return result;
}

function safeDate(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

function sumNumbers(values: Array<number | null | undefined>) {
  const available = values.filter((value): value is number => typeof value === "number");
  return available.length > 0 ? available.reduce((total, value) => total + value, 0) : null;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => sanitizeStorageContextLabel(value, 80)).filter(Boolean)),
  ) as string[];
}

function getParsedStorageSignals(assessment: AssessmentDetail) {
  const datastores = assessment.parsedDatastores ?? [];
  const summaries = assessment.parsedInventorySummaries ?? [];
  const snapshots = assessment.parsedSnapshots ?? [];
  const parsedVms = assessment.parsedVMs ?? [];
  const summarySnapshotCount = summaries.reduce(
    (total, summary) => total + (summary.snapshotCount ?? 0),
    0,
  );
  const totalCapacityGb = sumNumbers(datastores.map((datastore) => datastore.capacityGb));
  const totalUsedGb =
    sumNumbers(datastores.map((datastore) => datastore.usedGb)) ??
    sumNumbers(summaries.map((summary) => summary.totalUsedGb));
  const lowFreeCapacityDatastoreCount = datastores.filter((datastore) => {
    if (typeof datastore.usagePercent === "number") {
      return datastore.usagePercent >= 85;
    }

    if (
      typeof datastore.capacityGb === "number" &&
      datastore.capacityGb > 0 &&
      typeof datastore.freeGb === "number"
    ) {
      return datastore.freeGb / datastore.capacityGb <= 0.15;
    }

    return false;
  }).length;
  const largestVmGb =
    Math.max(
      0,
      ...parsedVms.map((vm) => vm.provisionedGb ?? vm.usedGb ?? 0),
      ...summaries.map((summary) => summary.largestVmGb ?? 0),
    ) || null;

  return {
    datastoreCount:
      datastores.length || summaries.reduce((total, summary) => total + summary.datastoreCount, 0),
    datastoreTypes: uniqueStrings(datastores.map((datastore) => datastore.datastoreType)),
    totalCapacityGb,
    totalUsedGb,
    lowFreeCapacityDatastoreCount,
    snapshotCount: Math.max(snapshots.length, summarySnapshotCount),
    vmDiskMappingSignals: parsedVms.filter(
      (vm) =>
        Boolean(vm.datastoreName) ||
        typeof vm.diskCount === "number" ||
        typeof vm.provisionedGb === "number" ||
        typeof vm.usedGb === "number",
    ).length,
    largestVmGb,
    largeVmCount: parsedVms.filter((vm) => (vm.provisionedGb ?? vm.usedGb ?? 0) >= 1024).length,
  };
}

function getActiveStorageEvidence(assessment: AssessmentDetail) {
  return (assessment.storageEvidence ?? []).filter(
    (item) =>
      item.includedInStorageAnalysis &&
      item.analysisStatus !== "excluded" &&
      item.evidenceFile.deletedAt === null &&
      item.evidenceFile.processingStatus !== "deleted",
  );
}

function getStorageConstraints(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function hasTargetDesignEvidence(assessment: AssessmentDetail) {
  return getActiveStorageEvidence(assessment).filter((item) =>
    [
      "target_storage_design",
      "hardware_bom",
      "network_diagram",
      "architecture_diagram",
      "ceph_status",
      "ceph_osd_tree",
      "ceph_df",
    ].includes(item.classification),
  ).length;
}

function buildScoringInput(assessment: AssessmentDetail): StorageReadinessScoringInput {
  const readiness = assessment.storageDestinationReadiness;
  const context = assessment.storageContext;
  const parsedStorage = getParsedStorageSignals(assessment);
  const activeEvidence = getActiveStorageEvidence(assessment);
  const classifications = activeEvidence.map((item) => item.classification);
  const sourceType = readiness?.currentStorageType ?? null;
  const targetPreference = readiness?.targetStoragePreference ?? null;
  const cephInterested =
    targetPreference === "ceph" ||
    readiness?.hasMinimumThreeNodes === true ||
    readiness?.hasDedicatedStorageNetwork === true ||
    readiness?.hasCephExperience === true ||
    classifications.some((classification) => classification.startsWith("ceph_"));

  return {
    currentStorageType: sourceType,
    targetStoragePreference: targetPreference,
    storageContextWordCount: context?.wordCount ?? 0,
    storageEvidenceCount: activeEvidence.length,
    targetDesignEvidenceCount: hasTargetDesignEvidence(assessment),
    parsedDatastoreCount: parsedStorage.datastoreCount,
    hasDatastoreCapacity: parsedStorage.totalCapacityGb !== null || parsedStorage.totalUsedGb !== null,
    hasVmDiskMapping: parsedStorage.vmDiskMappingSignals > 0,
    snapshotCount: parsedStorage.snapshotCount,
    hasGrowthExpectation: typeof readiness?.estimatedGrowthPercent3y === "number",
    needsHighAvailabilityKnown: readiness?.needsHighAvailability !== null && readiness?.needsHighAvailability !== undefined,
    requiresSharedStorageKnown:
      readiness?.requiresSharedStorage !== null && readiness?.requiresSharedStorage !== undefined,
    hasPbsKnown: readiness?.hasPbs !== null && readiness?.hasPbs !== undefined,
    hasBackupInfo:
      readiness?.hasPbs === true ||
      Boolean(readiness?.rpoRtoNotes?.trim()) ||
      classifications.includes("pbs_backup_info"),
    hasProxmoxTargetKnown:
      readiness?.hasProxmoxTarget !== null && readiness?.hasProxmoxTarget !== undefined,
    hasNetworkInfo:
      readiness?.hasDedicatedStorageNetwork !== null &&
        readiness?.hasDedicatedStorageNetwork !== undefined ||
      classifications.includes("network_diagram"),
    cephInterested,
    sourceStorageComplex: sourceType === "vsan" || sourceType === "mixed",
    largeVmCount: parsedStorage.largeVmCount,
    lowFreeCapacityDatastoreCount: parsedStorage.lowFreeCapacityDatastoreCount,
    downtimeStrict: readiness?.downtimeTolerance === "none" || readiness?.downtimeTolerance === "minutes",
  };
}

function optionForTargetPreference(
  preference: string | null | undefined,
  cephInterested: boolean,
): StorageDestinationOption {
  switch (preference) {
    case "zfs_local":
      return "zfs_local";
    case "nfs":
    case "san":
      return "nfs_san";
    case "ceph":
      return "ceph_candidate";
    case "pbs":
      return "pbs_related";
    default:
      return cephInterested ? "ceph_candidate" : "unknown";
  }
}

function buildHeuristicResult(params: {
  assessment: AssessmentDetail;
  safetyFlags: StorageContextIntelligenceResult["safetyFlags"];
}): StorageContextIntelligenceResult {
  const readiness = params.assessment.storageDestinationReadiness;
  const context = params.assessment.storageContext;
  const parsedStorage = getParsedStorageSignals(params.assessment);
  const activeEvidence = getActiveStorageEvidence(params.assessment);
  const scoring = calculateStorageReadinessScores(buildScoringInput(params.assessment));
  const cephInterested =
    readiness?.targetStoragePreference === "ceph" ||
    readiness?.hasMinimumThreeNodes === true ||
    readiness?.hasDedicatedStorageNetwork === true ||
    activeEvidence.some((item) => item.classification.startsWith("ceph_"));
  const cephPositiveSignals = [
    readiness?.hasMinimumThreeNodes === true ? "Customer reports at least three nodes." : null,
    readiness?.hasDedicatedStorageNetwork === true ? "Dedicated storage networking was reported." : null,
    readiness?.hasCephExperience === true ? "Ceph experience was reported." : null,
    readiness?.hasVendorOrPartnerSupport === true ? "Vendor or partner support was reported." : null,
  ].filter((item): item is string => Boolean(item));
  const cephRiskSignals = [
    readiness?.hasMinimumThreeNodes === false ? "Fewer than three nodes were reported." : null,
    readiness?.hasDedicatedStorageNetwork === false ? "Dedicated storage networking was not reported." : null,
    readiness?.hasCephExperience === false ? "No Ceph experience was reported." : null,
    readiness?.hasVendorOrPartnerSupport === false ? "No support model was reported." : null,
  ].filter((item): item is string => Boolean(item));
  const option = optionForTargetPreference(readiness?.targetStoragePreference, cephInterested);
  const sourceStorageSummary: StorageContextIntelligenceResult["sourceStorageSummary"] = [];
  if (parsedStorage.datastoreCount > 0) {
    sourceStorageSummary.push({
      item: `${parsedStorage.datastoreCount} datastore signal${parsedStorage.datastoreCount === 1 ? "" : "s"}`,
      evidence: "Parsed RVTools datastore metadata.",
      confidence: "medium",
      source: "rvtools",
    });
  }

  if (parsedStorage.totalCapacityGb !== null) {
    sourceStorageSummary.push({
      item: "Datastore capacity evidence available",
      evidence: `${Math.round(parsedStorage.totalCapacityGb)} GB total parsed capacity.`,
      confidence: "medium",
      source: "rvtools",
    });
  }

  if (readiness?.currentStorageType) {
    sourceStorageSummary.push({
      item: `Customer selected source storage: ${readiness.currentStorageType}`,
      evidence: "Structured storage input.",
      confidence: "low",
      source: "customer_reported",
    });
  }

  const operationalReadinessSignals: StorageContextIntelligenceResult["operationalReadinessSignals"] =
    [];
  if (readiness?.hasCephExperience !== null && readiness?.hasCephExperience !== undefined) {
    operationalReadinessSignals.push({
      signal: "Ceph experience",
      impact: readiness.hasCephExperience
        ? "Reported experience improves operational confidence, pending validation."
        : "No reported experience increases operational risk for Ceph-like patterns.",
      confidence: "low",
    });
  }

  if (
    readiness?.hasVendorOrPartnerSupport !== null &&
    readiness?.hasVendorOrPartnerSupport !== undefined
  ) {
    operationalReadinessSignals.push({
      signal: "Support model",
      impact: readiness.hasVendorOrPartnerSupport
        ? "Reported support can reduce operational risk if confirmed."
        : "No reported support model increases operational risk.",
      confidence: "low",
    });
  }

  return {
    interpretedStorageSummary:
      context && context.wordCount > 0
        ? "Storage context was submitted and should be used as advisory input alongside structured storage fields and RVTools datastore evidence."
        : "Storage context analysis is based on structured storage inputs, RVTools datastore signals and storage evidence metadata.",
    sourceStorageSummary,
    targetStoragePreference: readiness?.targetStoragePreference
      ? {
          preference: readiness.targetStoragePreference,
          rationale: "Captured from structured storage inputs. Validate against hardware, network, backup and operations evidence.",
          confidence: "medium",
          source: "structured_input",
        }
      : null,
    destinationOptions: [
      {
        option,
        suitability:
          option === "unknown"
            ? "not_enough_evidence"
            : scoring.missingEvidence.length > 2
              ? "not_enough_evidence"
              : "possible",
        rationale:
          option === "ceph_candidate"
            ? "Ceph is captured as a candidate signal only. Final suitability is deferred."
            : "Destination option is preliminary and depends on missing evidence validation.",
        missingEvidence: scoring.missingEvidence.map((item) => item.item).slice(0, 6),
      },
    ],
    storageConstraints: getStorageConstraints(readiness?.storageConstraintsJson).map((constraint) => ({
      constraint,
      type: oneOf(
        constraint,
        [
          "capacity",
          "network",
          "downtime",
          "backup",
          "ha",
          "growth",
          "operations",
          "unknown",
        ] as const,
        constraint === "latency" || constraint === "performance" ? "network" : "unknown",
      ),
      impact: "This storage constraint should be validated before final destination design.",
      source: "structured_input",
    })),
    cephSignals: {
      customerInterested: cephInterested,
      signalSummary: cephInterested
        ? "Ceph is present as a customer preference or signal, but final suitability is deferred to STORAGE-3."
        : "No strong Ceph preference is captured yet. Final suitability is deferred.",
      positiveSignals: cephPositiveSignals,
      riskSignals: cephRiskSignals,
      missingEvidence: scoring.missingEvidence
        .filter((item) => /ceph|network|target/i.test(item.item))
        .map((item) => item.item),
      finalDecisionDeferred: true,
    },
    operationalReadinessSignals,
    missingEvidence: scoring.missingEvidence,
    contradictions: [],
    nextQuestions: scoring.missingEvidence.slice(0, 6).map((item) => ({
      question: `Can you provide or confirm ${item.item.toLowerCase()}?`,
      reason: item.whyItMatters,
      priority: item.priority,
    })),
    recommendationImpact: [
      {
        area: "storage_destination",
        impact: "Missing storage evidence should affect destination confidence, not core technical readiness automatically.",
        shouldAffectScore: true,
        note: "Storage Destination Readiness remains optional and advisory.",
      },
      {
        area: "ceph",
        impact: "Ceph signals are preliminary only; final suitability is deferred.",
        shouldAffectScore: false,
        note: "STORAGE-3 owns the final Ceph suitability engine.",
      },
    ],
    scores: scoring.scores,
    confidenceLabels: scoring.confidenceLabels,
    safetyFlags: params.safetyFlags,
  };
}

function buildStorageAnalysisPayload(params: {
  assessment: AssessmentDetail;
  chunks: ReturnType<typeof chunkStorageContextText>;
  sanitizedChunkTexts: string[];
  safetyFlags: StorageContextIntelligenceResult["safetyFlags"];
  warnings: string[];
  deterministicScores: StorageContextIntelligenceResult["scores"];
}): StorageContextPromptPayload {
  const readiness = params.assessment.storageDestinationReadiness;
  const context = params.assessment.storageContext;
  const parsedStorage = getParsedStorageSignals(params.assessment);
  const activeEvidence = getActiveStorageEvidence(params.assessment);

  return {
    assessment: {
      id: params.assessment.id,
      title: sanitizeStorageContextLabel(params.assessment.title) ?? "Assessment",
      clientLabel: sanitizeStorageContextLabel(params.assessment.clientLabel),
      sourcePlatform: params.assessment.sourcePlatform,
      targetPlatform: params.assessment.targetPlatform,
      planLevel: params.assessment.planLevel,
    },
    structuredInputs: {
      status: readiness?.status ?? null,
      currentStorageType: readiness?.currentStorageType ?? null,
      targetStoragePreference: readiness?.targetStoragePreference ?? null,
      needsHighAvailability: readiness?.needsHighAvailability ?? null,
      requiresSharedStorage: readiness?.requiresSharedStorage ?? null,
      hasProxmoxTarget: readiness?.hasProxmoxTarget ?? null,
      hasPbs: readiness?.hasPbs ?? null,
      hasMinimumThreeNodes: readiness?.hasMinimumThreeNodes ?? null,
      hasDedicatedStorageNetwork: readiness?.hasDedicatedStorageNetwork ?? null,
      hasCephExperience: readiness?.hasCephExperience ?? null,
      hasVendorOrPartnerSupport: readiness?.hasVendorOrPartnerSupport ?? null,
      estimatedGrowthPercent3y: readiness?.estimatedGrowthPercent3y ?? null,
      downtimeTolerance: readiness?.downtimeTolerance ?? null,
      storageConstraints: getStorageConstraints(readiness?.storageConstraintsJson),
      sourceNotes: sanitizeStorageContextLabel(readiness?.sourceNotes, 600),
      rpoRtoNotes: sanitizeStorageContextLabel(readiness?.rpoRtoNotes, 600),
    },
    rvtoolsStorageSummary: parsedStorage,
    storageContext: {
      wordCount: context?.wordCount ?? 0,
      characterCount: context?.characterCount ?? 0,
      status: context?.status ?? "not_provided",
      submittedAt: safeDate(context?.submittedAt),
      lastEditedAt: safeDate(context?.lastEditedAt),
      chunks: params.chunks.map((chunk, index) => ({
        index: chunk.index,
        sanitizedText: params.sanitizedChunkTexts[index] ?? "",
        wordCount: chunk.wordCount,
        characterCount: chunk.characterCount,
      })),
    },
    storageEvidence: activeEvidence.map((item) => ({
      filename: sanitizeStorageContextLabel(item.evidenceFile.originalFilename),
      classification: item.classification,
      analysisStatus: item.analysisStatus,
      includedInStorageAnalysis: item.includedInStorageAnalysis,
      sizeBytes: item.evidenceFile.sizeBytes,
      uploadedAt: safeDate(item.evidenceFile.uploadedAt),
      notes: sanitizeStorageContextLabel(item.notes, 300),
    })),
    safety: {
      flags: params.safetyFlags,
      warnings: params.warnings,
    },
    deterministicScores: params.deterministicScores,
  };
}

function getErrorCategory(error: unknown) {
  if (error instanceof Error && error.name === "AbortError") {
    return "timeout";
  }

  if (error instanceof Error && /empty|json|parse|invalid/i.test(error.message)) {
    return "invalid_response";
  }

  return "provider_error";
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callGeminiProvider(params: {
  config: AiAdvisoryConfig;
  apiKey: string;
  prompt: string;
}): Promise<ProviderTextResult> {
  const startedAt = Date.now();
  const model = params.config.model ?? "gemini-2.5-flash";
  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": params.apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: params.prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: Math.max(256, Math.min(params.config.maxOutputChars, 8192)),
          temperature: 0.1,
        },
      }),
    },
    params.config.timeoutMs,
  );

  if (!response.ok) {
    throw new Error(`Gemini storage context request failed with status ${response.status}.`);
  }

  const jsonResponse = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = jsonResponse.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("\n")
    .trim();
  if (!text) {
    throw new Error("Gemini storage context response was empty.");
  }

  return { text, durationMs: Date.now() - startedAt };
}

async function callOpenAiProvider(params: {
  config: AiAdvisoryConfig;
  apiKey: string;
  prompt: string;
}): Promise<ProviderTextResult> {
  const startedAt = Date.now();
  const model = params.config.model ?? "gpt-5.1-mini";
  const response = await fetchWithTimeout(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: params.prompt,
        max_output_tokens: Math.max(256, Math.min(params.config.maxOutputChars, 8192)),
        text: { format: { type: "json_object" } },
      }),
    },
    params.config.timeoutMs,
  );

  if (!response.ok) {
    throw new Error(`OpenAI storage context request failed with status ${response.status}.`);
  }

  const jsonResponse = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };
  const text =
    jsonResponse.output_text ??
    jsonResponse.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("\n");
  if (!text?.trim()) {
    throw new Error("OpenAI storage context response was empty.");
  }

  return { text: text.trim(), durationMs: Date.now() - startedAt };
}

function mapBlockedStatus(code: string): {
  analysisStatus: AssessmentStorageAnalysisStatus;
  usageStatus: AiUsageStatus;
  eventType: string;
} {
  if (code === "blocked_budget") {
    return {
      analysisStatus: AssessmentStorageAnalysisStatus.budget_blocked,
      usageStatus: "blocked_budget",
      eventType: "storage_context_analysis_budget_blocked",
    };
  }

  if (code === "disabled_runtime") {
    return {
      analysisStatus: AssessmentStorageAnalysisStatus.ai_disabled,
      usageStatus: "disabled_runtime",
      eventType: "storage_context_analysis_unavailable",
    };
  }

  return {
    analysisStatus: AssessmentStorageAnalysisStatus.plan_restricted,
    usageStatus: "blocked_limit",
    eventType: "storage_context_analysis_plan_restricted",
  };
}

function readinessStatusForAnalysisStatus(status: AssessmentStorageAnalysisStatus) {
  switch (status) {
    case AssessmentStorageAnalysisStatus.completed:
      return AssessmentStorageDestinationReadinessStatus.analyzed;
    case AssessmentStorageAnalysisStatus.pending:
      return AssessmentStorageDestinationReadinessStatus.analysis_pending;
    case AssessmentStorageAnalysisStatus.failed:
      return AssessmentStorageDestinationReadinessStatus.failed;
    default:
      return AssessmentStorageDestinationReadinessStatus.ready_for_analysis;
  }
}

function contextStatusForAnalysisStatus(status: AssessmentStorageAnalysisStatus) {
  switch (status) {
    case AssessmentStorageAnalysisStatus.completed:
      return AssessmentStorageContextStatus.analyzed;
    case AssessmentStorageAnalysisStatus.stale:
      return AssessmentStorageContextStatus.stale;
    default:
      return AssessmentStorageContextStatus.ready_for_analysis;
  }
}

async function persistStorageContextAnalysis(params: {
  assessment: AssessmentDetail;
  userId: string;
  status: AssessmentStorageAnalysisStatus;
  result: StorageContextIntelligenceResult;
  modelUsed: string | null;
  eventType: string;
  eventMessage: string;
}) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const analysis = await tx.assessmentStorageAnalysis.upsert({
      where: { assessmentId: params.assessment.id },
      create: {
        assessmentId: params.assessment.id,
        status: params.status,
        storageReadinessScore: params.result.scores.storageDestinationReadiness,
        storageEvidenceConfidence: params.result.scores.storageEvidenceConfidence,
        cephSuitabilityStatus: "deferred_storage_2",
        interpretedSummary: params.result.interpretedStorageSummary,
        missingEvidenceJson: json(params.result.missingEvidence),
        recommendationsJson: json(persistedStorageAnalysisJson(params.result, params.modelUsed)),
        analysisVersion: STORAGE_CONTEXT_ANALYSIS_VERSION,
        generatedAt:
          params.status === AssessmentStorageAnalysisStatus.completed ? now : null,
      },
      update: {
        status: params.status,
        storageReadinessScore: params.result.scores.storageDestinationReadiness,
        storageEvidenceConfidence: params.result.scores.storageEvidenceConfidence,
        cephSuitabilityStatus: "deferred_storage_2",
        interpretedSummary: params.result.interpretedStorageSummary,
        missingEvidenceJson: json(params.result.missingEvidence),
        recommendationsJson: json(persistedStorageAnalysisJson(params.result, params.modelUsed)),
        analysisVersion: STORAGE_CONTEXT_ANALYSIS_VERSION,
        generatedAt:
          params.status === AssessmentStorageAnalysisStatus.completed ? now : null,
      },
    });

    await tx.assessmentStorageDestinationReadiness.updateMany({
      where: { assessmentId: params.assessment.id },
      data: {
        status: readinessStatusForAnalysisStatus(params.status),
      },
    });

    await tx.assessmentStorageContext.updateMany({
      where: { assessmentId: params.assessment.id },
      data: {
        status: contextStatusForAnalysisStatus(params.status),
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: params.assessment.workspaceId,
        assessmentId: params.assessment.id,
        eventType: params.eventType,
        message: params.eventMessage,
        metadataJson: buildStorageReadinessAuditMetadata({
          status: params.status,
          wordCount: params.assessment.storageContext?.wordCount ?? 0,
          characterCount: params.assessment.storageContext?.characterCount ?? 0,
          currentStorageType: params.assessment.storageDestinationReadiness?.currentStorageType,
          targetStoragePreference:
            params.assessment.storageDestinationReadiness?.targetStoragePreference,
        }),
      },
    });

    return analysis;
  });
}

function hasStorageInputsForAnalysis(assessment: AssessmentDetail) {
  const readiness = assessment.storageDestinationReadiness;
  return Boolean(
    readiness?.currentStorageType ||
      readiness?.targetStoragePreference ||
      readiness?.sourceNotes ||
      readiness?.rpoRtoNotes ||
      readiness?.storageConstraintsJson ||
      (assessment.storageContext?.wordCount ?? 0) > 0 ||
      getActiveStorageEvidence(assessment).length > 0 ||
      getParsedStorageSignals(assessment).datastoreCount > 0,
  );
}

export async function runStorageContextAnalysis(params: ActorParams & { force?: boolean }) {
  const assessment = await ensureAssessmentOwnership(params);

  if (
    assessment.storageDestinationReadiness?.status === AssessmentStorageDestinationReadinessStatus.skipped ||
    assessment.storageContext?.status === AssessmentStorageContextStatus.skipped
  ) {
    throw new Error("Storage Destination Readiness was skipped and cannot be analyzed.");
  }

  if (!hasStorageInputsForAnalysis(assessment)) {
    throw new Error("Add storage inputs, storage context, RVTools datastore evidence or storage evidence before running analysis.");
  }

  const entitlement = await getEffectiveUserEntitlement(params.userId);
  const limits = resolveStorageReadinessPlanLimits({
    userEntitlementPlanKey: entitlement?.planKey,
    assessmentPlanLevel: assessment.planLevel,
    workspacePlan: assessment.workspace.plan,
  });
  const rawText = assessment.storageContext?.rawText?.trim() ?? "";
  const chunks = chunkStorageContextText(rawText, {
    maxChunkWords: Math.min(
      MAX_PROMPT_CHUNK_WORDS,
      Math.max(500, Math.floor(limits.maxStorageContextWords / 4)),
    ),
    overlapWords: 80,
  });
  const security = sanitizeStorageContextForAi(rawText);
  const sanitizedChunks = chunks.map((chunk) => sanitizeStorageContextForAi(chunk.text).sanitizedText);
  const heuristic = buildHeuristicResult({
    assessment,
    safetyFlags: security.safetyFlags,
  });
  const payload = buildStorageAnalysisPayload({
    assessment,
    chunks,
    sanitizedChunkTexts: sanitizedChunks,
    safetyFlags: security.safetyFlags,
    warnings: security.warnings,
    deterministicScores: heuristic.scores,
  });
  const prompt = buildStorageContextPrompt(payload);
  const chunkMetadata = summarizeStorageChunkMetadata(chunks);
  const config = await getEffectiveAiAdvisoryConfig();
  const startedAt = Date.now();

  await prisma.$transaction(async (tx) => {
    await tx.assessmentStorageAnalysis.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        status: AssessmentStorageAnalysisStatus.pending,
        storageReadinessScore: heuristic.scores.storageDestinationReadiness,
        storageEvidenceConfidence: heuristic.scores.storageEvidenceConfidence,
        cephSuitabilityStatus: "deferred_storage_2",
        interpretedSummary: heuristic.interpretedStorageSummary,
        missingEvidenceJson: json(heuristic.missingEvidence),
        recommendationsJson: json(persistedStorageAnalysisJson(heuristic, config.model)),
        analysisVersion: STORAGE_CONTEXT_ANALYSIS_VERSION,
      },
      update: {
        status: AssessmentStorageAnalysisStatus.pending,
        storageReadinessScore: heuristic.scores.storageDestinationReadiness,
        storageEvidenceConfidence: heuristic.scores.storageEvidenceConfidence,
        cephSuitabilityStatus: "deferred_storage_2",
        interpretedSummary: heuristic.interpretedStorageSummary,
        missingEvidenceJson: json(heuristic.missingEvidence),
        recommendationsJson: json(persistedStorageAnalysisJson(heuristic, config.model)),
        analysisVersion: STORAGE_CONTEXT_ANALYSIS_VERSION,
      },
    });

    await tx.assessmentStorageDestinationReadiness.updateMany({
      where: { assessmentId: assessment.id },
      data: { status: AssessmentStorageDestinationReadinessStatus.analysis_pending },
    });

    await tx.assessmentStorageContext.updateMany({
      where: { assessmentId: assessment.id },
      data: { status: AssessmentStorageContextStatus.ready_for_analysis },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "storage_context_analysis_started",
        message: "Started Storage Context Intelligence analysis.",
        metadataJson: buildStorageReadinessAuditMetadata({
          status: AssessmentStorageAnalysisStatus.pending,
          wordCount: assessment.storageContext?.wordCount ?? 0,
          characterCount: assessment.storageContext?.characterCount ?? 0,
          currentStorageType: assessment.storageDestinationReadiness?.currentStorageType,
          targetStoragePreference: assessment.storageDestinationReadiness?.targetStoragePreference,
        }),
      },
    });
  });

  if (!limits.aiStorageAnalysisEnabled) {
    await recordAiUsageEvent({
      assessmentId: assessment.id,
      userId: params.userId,
      provider: config.provider,
      model: config.model,
      operationType: "storage_context_analysis",
      status: "blocked_limit",
      durationMs: Date.now() - startedAt,
      inputChars: prompt.length,
      outputChars: JSON.stringify(heuristic).length,
      fallbackUsed: true,
      metadataJson: { reason: "plan_restricted", chunkCount: chunkMetadata.chunkCount },
    });

    return persistStorageContextAnalysis({
      assessment,
      userId: params.userId,
      status: AssessmentStorageAnalysisStatus.plan_restricted,
      result: heuristic,
      modelUsed: config.model,
      eventType: "storage_context_analysis_plan_restricted",
      eventMessage: "Storage Context Intelligence is not available for this plan.",
    });
  }

  if (!config.enabled || config.provider === "none" || config.provider === "disabled") {
    await recordAiUsageEvent({
      assessmentId: assessment.id,
      userId: params.userId,
      provider: config.provider,
      model: config.model,
      operationType: "storage_context_analysis",
      status: "disabled_runtime",
      durationMs: Date.now() - startedAt,
      inputChars: prompt.length,
      outputChars: JSON.stringify(heuristic).length,
      fallbackUsed: true,
      metadataJson: { reason: "ai_disabled", chunkCount: chunkMetadata.chunkCount },
    });

    return persistStorageContextAnalysis({
      assessment,
      userId: params.userId,
      status: AssessmentStorageAnalysisStatus.ai_disabled,
      result: heuristic,
      modelUsed: config.model,
      eventType: "storage_context_analysis_unavailable",
      eventMessage: "Storage Context Intelligence is unavailable by AI runtime configuration.",
    });
  }

  const operationalCheck = await assertCanUseAi({
    userId: params.userId,
    assessmentId: assessment.id,
    provider: config.provider,
    model: config.model,
    inputChars: prompt.length,
    outputChars: 0,
  });

  if (!operationalCheck.allowed) {
    const mapped = mapBlockedStatus(operationalCheck.code);
    await recordAiUsageEvent({
      assessmentId: assessment.id,
      userId: params.userId,
      provider: config.provider,
      model: config.model,
      operationType: "storage_context_analysis",
      status: mapped.usageStatus,
      durationMs: Date.now() - startedAt,
      inputChars: prompt.length,
      outputChars: JSON.stringify(heuristic).length,
      fallbackUsed: true,
      metadataJson: { reason: operationalCheck.code, chunkCount: chunkMetadata.chunkCount },
    });

    return persistStorageContextAnalysis({
      assessment,
      userId: params.userId,
      status: mapped.analysisStatus,
      result: heuristic,
      modelUsed: config.model,
      eventType: mapped.eventType,
      eventMessage: operationalCheck.message,
    });
  }

  try {
    let providerResult: ProviderTextResult;
    if (config.provider === "mock") {
      providerResult = {
        text: JSON.stringify(heuristic),
        durationMs: Date.now() - startedAt,
      };
    } else {
      const apiKey = getAiAdvisoryProviderKey(config.provider);
      if (!apiKey) {
        await recordAiUsageEvent({
          assessmentId: assessment.id,
          userId: params.userId,
          provider: config.provider,
          model: config.model,
          operationType: "storage_context_analysis",
          status: "unavailable",
          durationMs: Date.now() - startedAt,
          inputChars: prompt.length,
          outputChars: JSON.stringify(heuristic).length,
          errorCategory: "config_missing",
          fallbackUsed: true,
          metadataJson: { reason: "config_missing", chunkCount: chunkMetadata.chunkCount },
        });

        return persistStorageContextAnalysis({
          assessment,
          userId: params.userId,
          status: AssessmentStorageAnalysisStatus.ai_disabled,
          result: heuristic,
          modelUsed: config.model,
          eventType: "storage_context_analysis_unavailable",
          eventMessage: "AI provider is enabled but no server-side key is configured.",
        });
      }

      providerResult =
        config.provider === "gemini"
          ? await callGeminiProvider({ config, apiKey, prompt })
          : await callOpenAiProvider({ config, apiKey, prompt });
    }

    const normalized = parseAndValidateStorageAiOutput(providerResult.text, heuristic);
    normalized.safetyFlags = [...security.safetyFlags, ...normalized.safetyFlags].slice(0, 12);
    normalized.scores = {
      ...heuristic.scores,
      ...normalized.scores,
      preliminaryCephConfidence: normalized.scores.preliminaryCephConfidence,
    };
    normalized.confidenceLabels = {
      storageContextConfidence: labelFromStorageScore(normalized.scores.storageCompletenessScore),
      storageEvidenceConfidenceLabel: labelFromStorageScore(
        normalized.scores.storageEvidenceConfidence,
      ),
    };
    normalized.cephSignals.finalDecisionDeferred = true;

    await recordAiUsageEvent({
      assessmentId: assessment.id,
      userId: params.userId,
      provider: config.provider,
      model: config.model,
      operationType: "storage_context_analysis",
      status: config.provider === "mock" ? "mock" : "success",
      durationMs: providerResult.durationMs,
      inputChars: prompt.length,
      outputChars: providerResult.text.length,
      fallbackUsed: Boolean(normalized.parseWarnings?.length),
      metadataJson: {
        chunkCount: chunkMetadata.chunkCount,
        status: config.provider === "mock" ? "mock" : "success",
      },
    });

    return persistStorageContextAnalysis({
      assessment,
      userId: params.userId,
      status: AssessmentStorageAnalysisStatus.completed,
      result: normalized,
      modelUsed: config.model,
      eventType: "storage_context_analysis_completed",
      eventMessage: "Completed Storage Context Intelligence analysis.",
    });
  } catch (error) {
    const errorCategory = getErrorCategory(error);
    const usageStatus: AiUsageStatus = errorCategory === "timeout" ? "timeout" : "error";
    logger.warn("storage_context_analysis_failed", {
      assessmentId: assessment.id,
      userId: params.userId,
      provider: config.provider,
      model: config.model,
      errorCategory,
      error,
    });
    await recordAiUsageEvent({
      assessmentId: assessment.id,
      userId: params.userId,
      provider: config.provider,
      model: config.model,
      operationType: "storage_context_analysis",
      status: usageStatus,
      durationMs: Date.now() - startedAt,
      inputChars: prompt.length,
      outputChars: JSON.stringify(heuristic).length,
      errorCategory,
      fallbackUsed: true,
      metadataJson: { reason: errorCategory, chunkCount: chunkMetadata.chunkCount },
    });

    return persistStorageContextAnalysis({
      assessment,
      userId: params.userId,
      status: AssessmentStorageAnalysisStatus.failed,
      result: {
        ...heuristic,
        safetyFlags: [
          ...heuristic.safetyFlags,
          {
            flag: "storage_ai_analysis_failed",
            severity: "medium",
            explanation:
              "Storage Context Intelligence failed and a deterministic fallback was preserved.",
          },
        ],
      },
      modelUsed: config.model,
      eventType: "storage_context_analysis_failed",
      eventMessage: "Storage Context Intelligence failed; deterministic fallback was preserved.",
    });
  }
}
