import type { Prisma } from "@prisma/client";
import type { AssessmentDetail } from "../assessments/assessmentService";
import {
  STORAGE_HIGH_USAGE_THRESHOLD_PERCENT,
  isHighUsageDatastore,
} from "../assessments/storageThresholds";

type JsonValue = Prisma.JsonValue | null | undefined;

export type StorageDestinationReadinessReportSection = {
  included: boolean;
  status: string;
  currentStorageType: string | null;
  targetStoragePreference: string | null;
  storageReadinessScore: number | null;
  storageEvidenceConfidence: number | null;
  storageDestinationReadiness: number | null;
  storageMigrationRisk: number | null;
  interpretedStorageSummary: string | null;
  sourceStorageSummary: Array<{
    item: string;
    evidence?: string;
    confidence?: string;
    source?: string;
  }>;
  destinationOptions: Array<{
    option: string;
    suitability: string;
    rationale: string;
    missingEvidence: string[];
  }>;
  storageConstraints: Array<{
    constraint: string;
    type?: string;
    impact?: string;
  }>;
  missingStorageEvidence: Array<{
    item: string;
    whyItMatters: string;
    priority: string;
  }>;
  storageContradictions: Array<{
    title: string;
    description: string;
    validationRecommendation: string;
  }>;
  nextStorageQuestions: Array<{
    question: string;
    reason: string;
    priority: string;
  }>;
  ceph: {
    requestedOrConsidered: boolean;
    status: string | null;
    summary: string | null;
    suitabilityScore: number | null;
    operationsReadinessScore: number | null;
    evidenceConfidenceScore: number | null;
    capacityFitScore: number | null;
    networkReadinessScore: number | null;
    failureDomainReadinessScore: number | null;
    backupReadinessScore: number | null;
    operationalSkillsScore: number | null;
    findings: Array<{
      severity: string;
      category: string;
      title: string;
      description: string;
      impact: string;
      recommendation: string;
    }>;
    remediations: Array<{
      priority: string;
      action: string;
      reason: string;
      requiredBeforeCeph: boolean;
    }>;
    missingEvidence: Array<{
      item: string;
      whyItMatters: string;
      priority: string;
    }>;
    recommendedNextStep: string | null;
  };
  additionalStorageEvidence: Array<{
    filename?: string;
    classification: string;
    analysisStatus: string;
    included: boolean;
  }>;
  assumptions: string[];
  disclaimers: string[];
};

const MAX_SUMMARY_LENGTH = 1_200;
const MAX_FIELD_LENGTH = 360;

const BASE_ASSUMPTIONS = [
  "RVTools storage evidence describes the VMware source estate, not the final Proxmox target storage design.",
  "Storage Destination Readiness is optional and does not block core report generation.",
  "Missing storage evidence lowers confidence and is reported as a planning finding.",
  "Ceph status is consumed from persisted deterministic evaluation when available; the report does not recalculate Ceph.",
];

const BASE_DISCLAIMERS = [
  "Ceph is not recommended by default.",
  "Ceph suitability depends on hardware, network, failure domains, backup and operational readiness.",
  "This report does not install, validate or benchmark a live Ceph cluster.",
  "Customer-provided storage context is advisory until validated with technical evidence.",
  "The original free-text storage narrative is not reproduced.",
  "Storage evidence files are shown as metadata only; file contents are not printed.",
];

const severityRank: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
  unknown: 5,
};

const priorityRank: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
  unknown: 3,
};

function addUnique(list: string[], value: string | null | undefined) {
  const trimmed = value?.trim();
  if (trimmed && !list.includes(trimmed)) {
    list.push(trimmed);
  }
}

function truncate(value: string, maxLength = MAX_FIELD_LENGTH) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function parseJsonValue(value: JsonValue, label: string, warnings: string[]): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      return value;
    }

    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      warnings.push(`${label} could not be parsed and was omitted from Storage Destination Readiness.`);
      return null;
    }
  }

  return value;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = "Not provided", maxLength = MAX_FIELD_LENGTH) {
  return typeof value === "string" && value.trim() ? truncate(value, maxLength) : fallback;
}

function asOptionalString(value: unknown, maxLength = MAX_FIELD_LENGTH) {
  return typeof value === "string" && value.trim() ? truncate(value, maxLength) : undefined;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function clampScore(value: unknown) {
  const number = asNumber(value);
  if (number === null) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(number)));
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown, maxItems = 6) {
  return asArray(value)
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => truncate(item, 240))
    .slice(0, maxItems);
}

function cleanFilename(value: string | null | undefined) {
  const filename = value?.split(/[\\/]/).pop()?.trim();
  return filename ? truncate(filename, 140) : undefined;
}

function normalizeSourceStorageSummary(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        item: asString(record.item, "Storage signal"),
        evidence: asOptionalString(record.evidence),
        confidence: asOptionalString(record.confidence, 48),
        source: asOptionalString(record.source, 48),
      };
    })
    .slice(0, 7);
}

function normalizeDestinationOptions(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        option: asString(record.option, "unknown", 80),
        suitability: asString(record.suitability, "not_enough_evidence", 80),
        rationale: asString(record.rationale, "Destination option requires validation."),
        missingEvidence: asStringArray(record.missingEvidence, 5),
      };
    })
    .slice(0, 6);
}

function normalizeStorageConstraints(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        constraint: asString(record.constraint, "Storage constraint"),
        type: asOptionalString(record.type, 60),
        impact: asOptionalString(record.impact),
      };
    })
    .slice(0, 7);
}

function normalizeMissingStorageEvidence(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        item: asString(record.item, "Missing storage evidence"),
        whyItMatters: asString(record.whyItMatters, "Missing storage evidence can change target design confidence."),
        priority: asString(record.priority, "medium", 40).toLowerCase(),
      };
    })
    .sort((left, right) => (priorityRank[left.priority] ?? priorityRank.unknown) - (priorityRank[right.priority] ?? priorityRank.unknown))
    .slice(0, 8);
}

function normalizeContradictions(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        title: asString(record.title, "Storage item to validate"),
        description: asString(record.description, "This storage assumption requires validation."),
        validationRecommendation: asString(record.validationRecommendation, "Validate storage evidence before migration design."),
      };
    })
    .slice(0, 6);
}

function normalizeNextQuestions(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        question: asString(record.question, "What storage evidence is still missing?"),
        reason: asString(record.reason, "This answer can improve storage destination confidence."),
        priority: asString(record.priority, "medium", 40).toLowerCase(),
      };
    })
    .sort((left, right) => (priorityRank[left.priority] ?? priorityRank.unknown) - (priorityRank[right.priority] ?? priorityRank.unknown))
    .slice(0, 6);
}

function normalizeCephFindings(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        severity: asString(record.severity, "medium", 40).toLowerCase(),
        category: asString(record.category, "evidence", 80),
        title: asString(record.title, "Ceph readiness finding"),
        description: asString(record.description, "Ceph readiness requires validation."),
        impact: asString(record.impact, "This can affect storage architecture confidence."),
        recommendation: asString(record.recommendation, "Validate before treating Ceph as a production target."),
      };
    })
    .sort((left, right) => (severityRank[left.severity] ?? severityRank.unknown) - (severityRank[right.severity] ?? severityRank.unknown))
    .slice(0, 8);
}

function normalizeCephRemediations(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        priority: asString(record.priority, "medium", 40).toLowerCase(),
        action: asString(record.action, "Collect additional Ceph readiness evidence."),
        reason: asString(record.reason, "This can improve Ceph suitability confidence."),
        requiredBeforeCeph: asBoolean(record.requiredBeforeCeph),
      };
    })
    .sort((left, right) => (priorityRank[left.priority] ?? priorityRank.unknown) - (priorityRank[right.priority] ?? priorityRank.unknown))
    .slice(0, 8);
}

function normalizeAdditionalStorageEvidence(value: AssessmentDetail["storageEvidence"]) {
  return value
    .map((item) => ({
      filename: cleanFilename(item.evidenceFile?.originalFilename),
      classification: String(item.classification),
      analysisStatus: String(item.analysisStatus),
      included: Boolean(item.includedInStorageAnalysis),
    }))
    .slice(0, 10);
}

function buildDatastoreSourceSummary(assessment: AssessmentDetail) {
  const datastores = assessment.parsedDatastores ?? [];
  if (datastores.length === 0) {
    return [];
  }

  const totalCapacityGb = datastores.reduce((sum, item) => sum + (item.capacityGb ?? 0), 0);
  const totalUsedGb = datastores.reduce((sum, item) => sum + (item.usedGb ?? 0), 0);
  const highUsageCount = datastores.filter((item) =>
    isHighUsageDatastore({
      usagePercent: item.usagePercent,
      capacityGb: item.capacityGb,
      freeGb: item.freeGb,
    }),
  ).length;

  const rows = [
    {
      item: `${datastores.length} datastore${datastores.length === 1 ? "" : "s"} parsed from RVTools`,
      evidence: totalCapacityGb > 0
        ? `${Math.round(totalUsedGb)} GB used of ${Math.round(totalCapacityGb)} GB capacity.`
        : "Datastore count was parsed, but capacity totals were not available.",
      confidence: "medium",
      source: "rvtools",
    },
    highUsageCount > 0
      ? {
          item: `${highUsageCount} datastore${highUsageCount === 1 ? "" : "s"} above ${STORAGE_HIGH_USAGE_THRESHOLD_PERCENT}% usage`,
          evidence: "High datastore utilization can constrain migration staging and storage target sizing.",
          confidence: "medium",
          source: "rvtools",
        }
      : null,
  ];

  return rows.filter((item): item is Exclude<typeof item, null> => item !== null);
}

function statusFallback(assessment: AssessmentDetail) {
  return assessment.storageAnalysis?.status
    ?? assessment.storageDestinationReadiness?.status
    ?? assessment.storageContext?.status
    ?? "not_available";
}

function hasStorageSignals(assessment: AssessmentDetail) {
  return Boolean(
    assessment.storageDestinationReadiness ||
    assessment.storageContext ||
    assessment.storageAnalysis ||
    (assessment.storageEvidence ?? []).length > 0 ||
    (assessment.parsedDatastores ?? []).length > 0,
  );
}

function isCephRequestedOrConsidered(params: {
  assessment: AssessmentDetail;
  analysisRecord: Record<string, unknown>;
  cephRecord: Record<string, unknown>;
}) {
  const readiness = params.assessment.storageDestinationReadiness;
  const cephSignals = asRecord(params.analysisRecord.cephSignals);
  const evidenceHasCeph = (params.assessment.storageEvidence ?? []).some((item) =>
    String(item.classification).startsWith("ceph_"),
  );

  return Boolean(
    readiness?.targetStoragePreference === "ceph" ||
    readiness?.hasMinimumThreeNodes === true ||
    readiness?.hasDedicatedStorageNetwork === true ||
    readiness?.hasCephExperience === true ||
    cephSignals.customerInterested === true ||
    asOptionalString(params.cephRecord.status) ||
    evidenceHasCeph,
  );
}

function normalizeCephSection(params: {
  assessment: AssessmentDetail;
  analysisRecord: Record<string, unknown>;
  cephRecord: Record<string, unknown>;
}) {
  const requestedOrConsidered = isCephRequestedOrConsidered(params);
  const status = asOptionalString(params.cephRecord.status, 80)
    ?? (params.assessment.storageAnalysis?.cephSuitabilityStatus === "deferred_storage_2"
      ? null
      : params.assessment.storageAnalysis?.cephSuitabilityStatus ?? null);

  return {
    requestedOrConsidered,
    status,
    summary: asOptionalString(params.cephRecord.summary, MAX_SUMMARY_LENGTH) ?? null,
    suitabilityScore: clampScore(params.cephRecord.cephSuitabilityScore),
    operationsReadinessScore: clampScore(params.cephRecord.cephOperationsReadinessScore),
    evidenceConfidenceScore: clampScore(params.cephRecord.cephEvidenceConfidenceScore),
    capacityFitScore: clampScore(params.cephRecord.capacityFitScore),
    networkReadinessScore: clampScore(params.cephRecord.networkReadinessScore),
    failureDomainReadinessScore: clampScore(params.cephRecord.failureDomainReadinessScore),
    backupReadinessScore: clampScore(params.cephRecord.backupReadinessScore),
    operationalSkillsScore: clampScore(params.cephRecord.operationalSkillsScore),
    findings: normalizeCephFindings(params.cephRecord.findings),
    remediations: normalizeCephRemediations(params.cephRecord.remediations),
    missingEvidence: normalizeMissingStorageEvidence(params.cephRecord.missingEvidence),
    recommendedNextStep: asOptionalString(params.cephRecord.recommendedNextStep, 80) ?? null,
  };
}

export function buildStorageDestinationReadinessReportSection(
  assessment: AssessmentDetail,
): StorageDestinationReadinessReportSection {
  const warnings: string[] = [];
  const analysis = assessment.storageAnalysis ?? null;
  const analysisRecord = asRecord(parseJsonValue(analysis?.recommendationsJson, "Storage analysis JSON", warnings));
  const persistedMissingEvidence = parseJsonValue(
    analysis?.missingEvidenceJson,
    "Storage missing evidence JSON",
    warnings,
  );
  const scoresRecord = asRecord(analysisRecord.scores);
  const cephRecord = asRecord(analysisRecord.cephReadiness);
  const included = hasStorageSignals(assessment);
  const sourceStorageSummary = [
    ...normalizeSourceStorageSummary(analysisRecord.sourceStorageSummary),
    ...buildDatastoreSourceSummary(assessment),
  ].slice(0, 8);
  const missingStorageEvidence = normalizeMissingStorageEvidence(
    analysisRecord.missingEvidence ?? persistedMissingEvidence,
  );
  const ceph = normalizeCephSection({ assessment, analysisRecord, cephRecord });
  const assumptions = [...BASE_ASSUMPTIONS];
  const disclaimers = [...BASE_DISCLAIMERS];
  asStringArray(cephRecord.assumptions, 4).forEach((assumption) => addUnique(assumptions, assumption));

  if (!included) {
    return {
      included: false,
      status: "not_available",
      currentStorageType: null,
      targetStoragePreference: null,
      storageReadinessScore: null,
      storageEvidenceConfidence: null,
      storageDestinationReadiness: null,
      storageMigrationRisk: null,
      interpretedStorageSummary: null,
      sourceStorageSummary: [],
      destinationOptions: [],
      storageConstraints: [],
      missingStorageEvidence: [],
      storageContradictions: [],
      nextStorageQuestions: [],
      ceph: {
        requestedOrConsidered: false,
        status: null,
        summary: null,
        suitabilityScore: null,
        operationsReadinessScore: null,
        evidenceConfidenceScore: null,
        capacityFitScore: null,
        networkReadinessScore: null,
        failureDomainReadinessScore: null,
        backupReadinessScore: null,
        operationalSkillsScore: null,
        findings: [],
        remediations: [],
        missingEvidence: [],
        recommendedNextStep: null,
      },
      additionalStorageEvidence: [],
      assumptions,
      disclaimers: [
        "No Storage Destination Readiness analysis was included for this assessment.",
        ...disclaimers,
      ],
    };
  }

  warnings.forEach((warning) => addUnique(disclaimers, warning));

  if (analysis?.status === "stale") {
    addUnique(disclaimers, "Storage inputs changed after the last analysis and should be re-analyzed before executive use.");
  }

  if (analysis?.status === "failed") {
    addUnique(disclaimers, "Storage Context Intelligence failed; this section is limited to safe fallback evidence and persisted metadata.");
  }

  if (assessment.storageContext?.truncated) {
    addUnique(disclaimers, "Storage free context exceeded the plan limit and was truncated before analysis.");
  }

  if (ceph.status === "not_enough_evidence") {
    addUnique(disclaimers, "Ceph cannot be assessed defensibly until missing target hardware, network, backup or operations evidence is collected.");
  }

  return {
    included: true,
    status: String(statusFallback(assessment)),
    currentStorageType: assessment.storageDestinationReadiness?.currentStorageType ?? null,
    targetStoragePreference: assessment.storageDestinationReadiness?.targetStoragePreference
      ?? asOptionalString(asRecord(analysisRecord.targetStoragePreference).preference, 80)
      ?? null,
    storageReadinessScore: clampScore(analysis?.storageReadinessScore ?? scoresRecord.storageDestinationReadiness),
    storageEvidenceConfidence: clampScore(analysis?.storageEvidenceConfidence ?? scoresRecord.storageEvidenceConfidence),
    storageDestinationReadiness: clampScore(scoresRecord.storageDestinationReadiness ?? analysis?.storageReadinessScore),
    storageMigrationRisk: clampScore(scoresRecord.storageMigrationRisk),
    interpretedStorageSummary: asOptionalString(
      analysis?.interpretedSummary ?? analysisRecord.interpretedStorageSummary,
      MAX_SUMMARY_LENGTH,
    ) ?? null,
    sourceStorageSummary,
    destinationOptions: normalizeDestinationOptions(analysisRecord.destinationOptions),
    storageConstraints: normalizeStorageConstraints(analysisRecord.storageConstraints),
    missingStorageEvidence,
    storageContradictions: normalizeContradictions(analysisRecord.contradictions),
    nextStorageQuestions: normalizeNextQuestions(analysisRecord.nextQuestions),
    ceph,
    additionalStorageEvidence: normalizeAdditionalStorageEvidence(assessment.storageEvidence ?? []),
    assumptions,
    disclaimers,
  };
}
