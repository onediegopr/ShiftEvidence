import type { AssessmentClientContextAnalysis, Prisma } from "@prisma/client";
import type { AssessmentDetail } from "../assessments/assessmentService";

type JsonValue = Prisma.JsonValue | null | undefined;

type AdditionalEvidence = AssessmentDetail["additionalEvidence"];

export type CustomerContextIntelligenceReportSection = {
  included: boolean;
  status: string;
  analysisStatus: string | null;
  contextCompletenessScore: number | null;
  businessContextConfidence: string | null;
  interpretedSummary: string | null;
  businessPriorities: Array<{
    priority: string;
    evidence?: string;
    confidence?: string;
    source?: string;
  }>;
  migrationConstraints: Array<{
    constraint: string;
    type?: string;
    impact?: string;
    source?: string;
  }>;
  criticalWorkloads: Array<{
    name: string;
    reason?: string;
    validationNeeded?: boolean;
    source?: string;
  }>;
  customerReportedRisks: Array<{
    risk: string;
    severity?: string;
    rationale?: string;
    validationNeeded?: boolean;
  }>;
  aiExtractedInsights: Array<{
    insight: string;
    impact?: string;
    confidence?: string;
  }>;
  contradictions: Array<{
    title: string;
    description: string;
    validationRecommendation?: string;
  }>;
  validationItems: Array<{
    item: string;
    whyItMatters?: string;
    recommendedOwner?: string;
    priority?: string;
  }>;
  reportImpact: Array<{
    area: string;
    impact: string;
    shouldAffectScore?: boolean;
    note?: string;
  }>;
  nextQuestions: Array<{
    question: string;
    reason?: string;
    priority?: string;
  }>;
  safetyFlags: Array<{
    flag: string;
    severity?: string;
    explanation?: string;
  }>;
  additionalEvidenceSummary: Array<{
    filename?: string;
    classification?: string;
    analysisStatus?: string;
    included?: boolean;
  }>;
  assumptions: string[];
  disclaimers: string[];
  generatedAt?: string | null;
  modelUsed?: string | null;
  promptVersion?: string | null;
};

const MAX_SUMMARY_LENGTH = 1_200;
const MAX_FIELD_LENGTH = 360;

const BASE_ASSUMPTIONS = [
  "Customer-provided context is advisory and must be validated against structured technical evidence before migration decisions.",
  "Context completeness measures business context quality, not technical evidence confidence.",
  "The original free-text narrative is stored with the assessment but is not reproduced in this report.",
  "Additional evidence is summarized as metadata only; file contents are not printed in this report section.",
  "Customer-reported workload, risk and constraint statements remain unconfirmed until validated by RVTools, backup exports, target evidence or application owners.",
];

const BASE_DISCLAIMERS = [
  "Customer-provided context is treated as advisory information. It may contain assumptions, incomplete details or unverified claims. This section does not replace confirmed technical evidence from RVTools, backup exports, Proxmox target validation or other structured sources.",
  "The original free-text narrative is not reproduced in this report. The report only includes a structured interpretation.",
];

const statusMessages: Record<string, string> = {
  not_started: "Client context was captured, but Customer Context Intelligence analysis has not started.",
  pending: "Customer Context Intelligence analysis is currently pending.",
  failed: "Customer Context Intelligence analysis failed. Structured technical sections remain available.",
  stale: "Client context changed after the last analysis and should be re-analyzed before executive use.",
  ai_disabled: "AI analysis is unavailable for the current runtime configuration.",
  budget_blocked: "AI analysis was blocked by the configured usage or budget guard.",
  plan_restricted: "Customer Context Intelligence analysis is restricted for the current plan.",
};

const severityRank: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  limited: 2,
  low: 3,
  unknown: 4,
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
      warnings.push(`${label} could not be parsed and was omitted from Customer Context Intelligence.`);
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

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function cleanFilename(value: string | null | undefined) {
  const filename = value?.split(/[\\/]/).pop()?.trim();
  return filename ? truncate(filename, 140) : undefined;
}

function normalizePriorities(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        priority: asString(record.priority, "Business priority"),
        evidence: asOptionalString(record.evidence),
        confidence: asOptionalString(record.confidence, 48),
        source: asOptionalString(record.source, 48),
      };
    })
    .sort((left, right) => (priorityRank[left.confidence ?? "unknown"] ?? priorityRank.unknown) - (priorityRank[right.confidence ?? "unknown"] ?? priorityRank.unknown))
    .slice(0, 7);
}

function normalizeConstraints(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        constraint: asString(record.constraint, "Migration constraint"),
        type: asOptionalString(record.type, 48),
        impact: asOptionalString(record.impact),
        source: asOptionalString(record.source, 48),
      };
    })
    .slice(0, 7);
}

function normalizeCriticalWorkloads(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        name: asString(record.name, "Customer-reported workload", 140),
        reason: asOptionalString(record.reason),
        validationNeeded: asBoolean(record.validationNeeded),
        source: asOptionalString(record.source, 48),
      };
    })
    .slice(0, 8);
}

function normalizeRisks(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        risk: asString(record.risk, "Customer-reported risk"),
        severity: asOptionalString(record.severity, 48),
        rationale: asOptionalString(record.rationale),
        validationNeeded: asBoolean(record.validationNeeded),
      };
    })
    .sort((left, right) => (severityRank[left.severity ?? "unknown"] ?? severityRank.unknown) - (severityRank[right.severity ?? "unknown"] ?? severityRank.unknown))
    .slice(0, 7);
}

function normalizeInsights(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        insight: asString(record.insight, "AI-extracted insight"),
        impact: asOptionalString(record.impact),
        confidence: asOptionalString(record.confidence, 48),
      };
    })
    .slice(0, 6);
}

function normalizeContradictions(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        title: asString(record.title, "Item to validate", 140),
        description: asString(record.description, "This context should be validated before migration decisions."),
        validationRecommendation: asOptionalString(record.validationRecommendation),
      };
    })
    .slice(0, 5);
}

function normalizeValidationItems(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        item: asString(record.item, "Validation item"),
        whyItMatters: asOptionalString(record.whyItMatters),
        recommendedOwner: asOptionalString(record.recommendedOwner, 120),
        priority: asOptionalString(record.priority, 48),
      };
    })
    .sort((left, right) => (priorityRank[left.priority ?? "unknown"] ?? priorityRank.unknown) - (priorityRank[right.priority ?? "unknown"] ?? priorityRank.unknown))
    .slice(0, 8);
}

function normalizeReportImpact(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        area: asString(record.area, "other", 64),
        impact: asString(record.impact, "Context may affect advisory interpretation."),
        shouldAffectScore: asBoolean(record.shouldAffectScore),
        note: asOptionalString(record.note),
      };
    })
    .slice(0, 6);
}

function normalizeNextQuestions(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        question: asString(record.question, "Follow-up question"),
        reason: asOptionalString(record.reason),
        priority: asOptionalString(record.priority, 48),
      };
    })
    .sort((left, right) => (priorityRank[left.priority ?? "unknown"] ?? priorityRank.unknown) - (priorityRank[right.priority ?? "unknown"] ?? priorityRank.unknown))
    .slice(0, 8);
}

function normalizeSafetyFlags(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        flag: asString(record.flag, "Context handling note", 140),
        severity: asOptionalString(record.severity, 48),
        explanation: asOptionalString(record.explanation),
      };
    })
    .sort((left, right) => (severityRank[left.severity ?? "unknown"] ?? severityRank.unknown) - (severityRank[right.severity ?? "unknown"] ?? severityRank.unknown))
    .slice(0, 6);
}

function normalizeAdditionalEvidence(additionalEvidence: AdditionalEvidence | null | undefined) {
  return (additionalEvidence ?? [])
    .map((item) => ({
      filename: cleanFilename(item.evidenceFile?.originalFilename ?? null),
      classification: String(item.classification ?? "unknown_needs_review"),
      analysisStatus: String(item.analysisStatus ?? "received_not_analyzed"),
      included: Boolean(item.includedInContextAnalysis),
    }))
    .slice(0, 8);
}

function generatedAtLabel(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function clampScore(value: unknown) {
  const score = asNumber(value);
  if (score === null) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function buildCustomerContextIntelligenceReportSection(
  analysis: AssessmentClientContextAnalysis | null | undefined,
  options: {
    additionalEvidence?: AdditionalEvidence | null;
  } = {},
): CustomerContextIntelligenceReportSection {
  if (!analysis) {
    return {
      included: false,
      status: "not_available",
      analysisStatus: null,
      contextCompletenessScore: null,
      businessContextConfidence: null,
      interpretedSummary: null,
      businessPriorities: [],
      migrationConstraints: [],
      criticalWorkloads: [],
      customerReportedRisks: [],
      aiExtractedInsights: [],
      contradictions: [],
      validationItems: [],
      reportImpact: [],
      nextQuestions: [],
      safetyFlags: [],
      additionalEvidenceSummary: normalizeAdditionalEvidence(options.additionalEvidence),
      assumptions: BASE_ASSUMPTIONS,
      disclaimers: [
        ...BASE_DISCLAIMERS,
        "No Customer Context Intelligence analysis was included for this assessment.",
      ],
      generatedAt: null,
      modelUsed: null,
      promptVersion: null,
    };
  }

  const warnings: string[] = [];
  const analysisStatus = String(analysis.status ?? "not_started");
  const included = analysisStatus !== "not_started";
  const disclaimers = [...BASE_DISCLAIMERS];
  const assumptions = [...BASE_ASSUMPTIONS];
  const interpretedSummary =
    analysis.interpretedSummary?.trim()
      ? truncate(analysis.interpretedSummary, MAX_SUMMARY_LENGTH)
      : statusMessages[analysisStatus] ?? "Customer context was received, but no interpreted summary was persisted.";

  const businessPriorities = normalizePriorities(parseJsonValue(analysis.businessPrioritiesJson, "Business priorities JSON", warnings));
  const migrationConstraints = normalizeConstraints(parseJsonValue(analysis.migrationConstraintsJson, "Migration constraints JSON", warnings));
  const criticalWorkloads = normalizeCriticalWorkloads(parseJsonValue(analysis.criticalWorkloadsJson, "Critical workloads JSON", warnings));
  const customerReportedRisks = normalizeRisks(parseJsonValue(analysis.customerReportedRisksJson, "Customer-reported risks JSON", warnings));
  const aiExtractedInsights = normalizeInsights(parseJsonValue(analysis.aiExtractedInsightsJson, "AI-extracted insights JSON", warnings));
  const contradictions = normalizeContradictions(parseJsonValue(analysis.contradictionsJson, "Contradictions JSON", warnings));
  const validationItems = normalizeValidationItems(parseJsonValue(analysis.validationItemsJson, "Validation items JSON", warnings));
  const reportImpact = normalizeReportImpact(parseJsonValue(analysis.reportImpactJson, "Report impact JSON", warnings));
  const nextQuestions = normalizeNextQuestions(parseJsonValue(analysis.nextQuestionsJson, "Next questions JSON", warnings));
  const safetyFlags = normalizeSafetyFlags(parseJsonValue(analysis.safetyFlagsJson, "Safety flags JSON", warnings));

  if (analysisStatus !== "completed") {
    addUnique(disclaimers, statusMessages[analysisStatus] ?? "Customer Context Intelligence is not in a completed state.");
  }

  if (analysisStatus === "stale") {
    addUnique(assumptions, "The displayed interpretation may not reflect the latest client context until analysis is re-run.");
  }

  if (warnings.length > 0) {
    warnings.forEach((warning) => addUnique(disclaimers, warning));
  }

  if (safetyFlags.length > 0) {
    addUnique(assumptions, "Context handling notes were detected and should be reviewed as input-quality signals, not as confirmed incidents.");
  }

  return {
    included,
    status: analysisStatus,
    analysisStatus,
    contextCompletenessScore: clampScore(analysis.contextCompletenessScore),
    businessContextConfidence: analysis.businessContextConfidence ?? null,
    interpretedSummary,
    businessPriorities,
    migrationConstraints,
    criticalWorkloads,
    customerReportedRisks,
    aiExtractedInsights,
    contradictions,
    validationItems,
    reportImpact,
    nextQuestions,
    safetyFlags,
    additionalEvidenceSummary: normalizeAdditionalEvidence(options.additionalEvidence),
    assumptions,
    disclaimers,
    generatedAt: generatedAtLabel(analysis.generatedAt),
    modelUsed: analysis.modelUsed ?? null,
    promptVersion: analysis.promptVersion ?? null,
  };
}
