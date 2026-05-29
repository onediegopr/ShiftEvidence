import {
  AssessmentClientContextAnalysisStatus,
  AssessmentClientContextStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { getAiAdvisoryProviderKey, getEffectiveAiAdvisoryConfig } from "../ai/aiAdvisoryConfig";
import { parseJsonText } from "../ai/aiAdvisoryClient";
import { recordAiUsageEvent, type AiUsageStatus } from "../ai/aiUsageService";
import type { AiAdvisoryConfig } from "../ai/aiAdvisoryTypes";
import { assertCanUseAi, getEffectiveUserEntitlement } from "../admin/runtimeSettingsService";
import { logger } from "../logging/logger";
import { ensureAssessmentOwnership, type AssessmentDetail } from "./assessmentService";
import {
  chunkClientContextText,
  summarizeChunkMetadata,
  type ClientContextChunk,
} from "./clientContextChunkingService";
import {
  CLIENT_CONTEXT_ANALYSIS_VERSION,
  CLIENT_CONTEXT_PROMPT_VERSION,
  type BusinessContextConfidence,
  type ClientContextSafetyFlag,
  type CustomerContextIntelligenceResult,
} from "./clientContextIntelligenceTypes";
import { resolveClientContextPlanLimits } from "./clientContextPlanLimits";
import { buildClientContextPrompt, type ClientContextPromptPayload } from "./clientContextPrompt";
import {
  sanitizeClientContextForAi,
  sanitizeClientContextLabel,
} from "./clientContextSecurityService";
import { buildClientContextAuditMetadata } from "./clientContextValidation";

type ActorParams = {
  userId: string;
  assessmentId: string;
};

type NormalizedAnalysis = CustomerContextIntelligenceResult & {
  parseWarnings: string[];
};

type ProviderTextResult = {
  text: string;
  durationMs: number;
};

const MAX_ARRAY_ITEMS = 12;
const MAX_PROMPT_CHUNK_WORDS = 1_600;
const MAX_PROMPT_CHARS_PER_CHUNK = 8_000;

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function clampScore(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizedString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 1200) : fallback;
}

function normalizedBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function oneOf<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  return allowed.includes(value as T[number]) ? (value as T[number]) : fallback;
}

function normalizeArray<T>(value: unknown, normalizeItem: (item: unknown) => T | null) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeItem)
    .filter((item): item is T => item !== null)
    .slice(0, MAX_ARRAY_ITEMS);
}

function fallbackResult(params: {
  interpretedSummary?: string;
  safetyFlags?: ClientContextSafetyFlag[];
  contextCompletenessScore?: number;
  confidence?: BusinessContextConfidence;
} = {}): CustomerContextIntelligenceResult {
  return {
    interpretedSummary:
      params.interpretedSummary ??
      "Customer context was received, but structured AI interpretation is not available yet.",
    businessPriorities: [],
    migrationConstraints: [],
    criticalWorkloads: [],
    customerReportedRisks: [],
    aiExtractedInsights: [],
    contradictions: [],
    validationItems: [],
    reportImpact: [],
    nextQuestions: [],
    contextCompletenessScore: clampScore(params.contextCompletenessScore ?? 0),
    businessContextConfidence: params.confidence ?? "low",
    safetyFlags: params.safetyFlags ?? [],
  };
}

function normalizeSafetyFlag(value: unknown): ClientContextSafetyFlag | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const item = value as Record<string, unknown>;
  const flag = normalizedString(item.flag);
  if (!flag) {
    return null;
  }

  return {
    flag,
    severity: oneOf(item.severity, ["high", "medium", "low"] as const, "low"),
    explanation: normalizedString(item.explanation, "Review this safety flag before using the context."),
  };
}

export function parseAndValidateClientContextAiOutput(
  value: string | unknown,
  fallback: CustomerContextIntelligenceResult = fallbackResult(),
): NormalizedAnalysis {
  const parsed = typeof value === "string" ? parseJsonText(value) : value;
  const parseWarnings: string[] = [];

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
  const interpretedSummary = normalizedString(root.interpretedSummary, fallback.interpretedSummary);
  if (!interpretedSummary) {
    parseWarnings.push("missing_interpreted_summary");
  }

  const result: CustomerContextIntelligenceResult = {
    interpretedSummary:
      interpretedSummary ||
      "Customer context was analyzed, but the interpreted summary was unavailable.",
    businessPriorities: normalizeArray(root.businessPriorities, (item) => {
      if (typeof item !== "object" || item === null) return null;
      const row = item as Record<string, unknown>;
      const priority = normalizedString(row.priority);
      return priority
        ? {
            priority,
            evidence: normalizedString(row.evidence, "Customer-reported context."),
            confidence: oneOf(row.confidence, ["high", "medium", "low"] as const, "low"),
            source: oneOf(row.source, ["customer_reported", "inferred"] as const, "customer_reported"),
          }
        : null;
    }),
    migrationConstraints: normalizeArray(root.migrationConstraints, (item) => {
      if (typeof item !== "object" || item === null) return null;
      const row = item as Record<string, unknown>;
      const constraint = normalizedString(row.constraint);
      return constraint
        ? {
            constraint,
            type: oneOf(
              row.type,
              ["timeline", "downtime", "staffing", "technical", "business", "compliance", "unknown"] as const,
              "unknown",
            ),
            impact: normalizedString(row.impact, "Impact requires validation."),
            source: oneOf(row.source, ["customer_reported", "inferred"] as const, "customer_reported"),
          }
        : null;
    }),
    criticalWorkloads: normalizeArray(root.criticalWorkloads, (item) => {
      if (typeof item !== "object" || item === null) return null;
      const row = item as Record<string, unknown>;
      const name = normalizedString(row.name);
      return name
        ? {
            name,
            reason: normalizedString(row.reason, "Mentioned by customer context."),
            validationNeeded: normalizedBoolean(row.validationNeeded, true),
            source: oneOf(row.source, ["customer_reported", "inferred"] as const, "customer_reported"),
          }
        : null;
    }),
    customerReportedRisks: normalizeArray(root.customerReportedRisks, (item) => {
      if (typeof item !== "object" || item === null) return null;
      const row = item as Record<string, unknown>;
      const risk = normalizedString(row.risk);
      return risk
        ? {
            risk,
            severity: oneOf(
              row.severity,
              ["critical", "high", "medium", "low", "unknown"] as const,
              "unknown",
            ),
            rationale: normalizedString(row.rationale, "Customer-reported risk requiring validation."),
            validationNeeded: normalizedBoolean(row.validationNeeded, true),
          }
        : null;
    }),
    aiExtractedInsights: normalizeArray(root.aiExtractedInsights, (item) => {
      if (typeof item !== "object" || item === null) return null;
      const row = item as Record<string, unknown>;
      const insight = normalizedString(row.insight);
      return insight
        ? {
            insight,
            impact: normalizedString(row.impact, "Impact requires validation."),
            confidence: oneOf(row.confidence, ["high", "medium", "low"] as const, "low"),
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
            description: normalizedString(row.description, "Potential inconsistency requires validation."),
            evidenceA: normalizedString(row.evidenceA, "Customer context."),
            evidenceB: normalizedString(row.evidenceB) || undefined,
            validationRecommendation: normalizedString(
              row.validationRecommendation,
              "Validate this item against technical evidence before using it in planning.",
            ),
          }
        : null;
    }),
    validationItems: normalizeArray(root.validationItems, (item) => {
      if (typeof item !== "object" || item === null) return null;
      const row = item as Record<string, unknown>;
      const validationItem = normalizedString(row.item);
      return validationItem
        ? {
            item: validationItem,
            whyItMatters: normalizedString(row.whyItMatters, "This can affect migration planning confidence."),
            recommendedOwner: normalizedString(row.recommendedOwner) || undefined,
            priority: oneOf(row.priority, ["high", "medium", "low"] as const, "medium"),
          }
        : null;
    }),
    reportImpact: normalizeArray(root.reportImpact, (item) => {
      if (typeof item !== "object" || item === null) return null;
      const row = item as Record<string, unknown>;
      const impact = normalizedString(row.impact);
      return impact
        ? {
            area: oneOf(
              row.area,
              [
                "readiness",
                "confidence",
                "migration_waves",
                "licensing_cost",
                "backup",
                "storage",
                "network",
                "applications",
                "other",
              ] as const,
              "other",
            ),
            impact,
            shouldAffectScore: normalizedBoolean(row.shouldAffectScore, false),
            note: normalizedString(
              row.note,
              "Customer narrative should be validated before changing deterministic scores.",
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
            reason: normalizedString(row.reason, "This improves business context confidence."),
            priority: oneOf(row.priority, ["high", "medium", "low"] as const, "medium"),
          }
        : null;
    }),
    contextCompletenessScore: clampScore(root.contextCompletenessScore),
    businessContextConfidence: oneOf(
      root.businessContextConfidence,
      ["high", "medium", "limited", "low"] as const,
      "low",
    ),
    safetyFlags: normalizeArray(root.safetyFlags, normalizeSafetyFlag),
  };

  return {
    ...result,
    parseWarnings,
  };
}

export function calculateContextCompletenessScore(input: {
  wordCount: number;
  businessPrioritiesCount: number;
  constraintsCount: number;
  criticalWorkloadsCount: number;
  risksCount: number;
  timelineSignalsCount: number;
  additionalEvidenceCount: number;
  validationItemsCount: number;
}) {
  let score = 0;
  if (input.wordCount > 0) score += 20;
  if (input.wordCount >= 150) score += 15;
  if (input.businessPrioritiesCount > 0) score += 15;
  if (input.constraintsCount > 0) score += 15;
  if (input.criticalWorkloadsCount > 0) score += 10;
  if (input.risksCount > 0 || input.timelineSignalsCount > 0) score += 10;
  if (input.additionalEvidenceCount > 0) score += 10;
  if (input.validationItemsCount > 0) score += 5;
  return clampScore(score);
}

function confidenceFromScore(score: number): BusinessContextConfidence {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  if (score >= 40) return "limited";
  return "low";
}

function hasAnySignal(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function buildHeuristicResult(params: {
  text: string;
  wordCount: number;
  additionalEvidenceCount: number;
  safetyFlags: ClientContextSafetyFlag[];
}): CustomerContextIntelligenceResult {
  const text = params.text;
  const priorities = [
    hasAnySignal(text, ["renewal", "broadcom", "cost", "budget"])
      ? {
          priority: "Control VMware/Broadcom renewal and cost exposure.",
          evidence: "Customer context mentions renewal, Broadcom, cost or budget pressure.",
          confidence: "medium" as const,
          source: "customer_reported" as const,
        }
      : null,
    hasAnySignal(text, ["downtime", "outage", "maintenance window", "availability"])
      ? {
          priority: "Minimize downtime and protect service availability.",
          evidence: "Customer context mentions downtime, outage or maintenance-window concerns.",
          confidence: "medium" as const,
          source: "customer_reported" as const,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const constraints = [
    hasAnySignal(text, ["deadline", "renewal", "before", "date"])
      ? {
          constraint: "Timeline pressure may influence migration sequencing.",
          type: "timeline" as const,
          impact: "The migration plan should validate deadlines and renewal timing before committing to waves.",
          source: "customer_reported" as const,
        }
      : null,
    hasAnySignal(text, ["small team", "staff", "resources", "capacity"])
      ? {
          constraint: "Staffing or operational capacity may be constrained.",
          type: "staffing" as const,
          impact: "Wave sizing and support model should be validated with the operating team.",
          source: "customer_reported" as const,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const workloads = [
    hasAnySignal(text, ["erp", "database", "sql", "sap", "critical", "production"])
      ? {
          name: "Customer-mentioned critical application or database workloads",
          reason: "The narrative references critical, production, ERP, SQL, SAP or database workloads.",
          validationNeeded: true,
          source: "customer_reported" as const,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const risks = [
    hasAnySignal(text, ["backup", "restore", "rollback"])
      ? {
          risk: "Backup, restore or rollback readiness needs validation.",
          severity: "medium" as const,
          rationale: "Customer context references backup, restore or rollback concerns.",
          validationNeeded: true,
        }
      : null,
    hasAnySignal(text, ["unknown", "not sure", "don't know", "unclear"])
      ? {
          risk: "Customer context includes unknowns that can reduce planning confidence.",
          severity: "medium" as const,
          rationale: "The narrative includes uncertainty markers.",
          validationNeeded: true,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const validationItems = [
    ...workloads.map((workload) => ({
      item: `Validate ${workload.name}.`,
      whyItMatters: "Customer narrative alone does not confirm application criticality or dependencies.",
      recommendedOwner: "Application owner",
      priority: "high" as const,
    })),
    ...constraints.map((constraint) => ({
      item: constraint.constraint,
      whyItMatters: "This may affect migration sequencing, readiness confidence or rollback planning.",
      recommendedOwner: "Migration lead",
      priority: "medium" as const,
    })),
  ].slice(0, MAX_ARRAY_ITEMS);
  const score = calculateContextCompletenessScore({
    wordCount: params.wordCount,
    businessPrioritiesCount: priorities.length,
    constraintsCount: constraints.length,
    criticalWorkloadsCount: workloads.length,
    risksCount: risks.length,
    timelineSignalsCount: hasAnySignal(text, ["deadline", "renewal", "date"]) ? 1 : 0,
    additionalEvidenceCount: params.additionalEvidenceCount,
    validationItemsCount: validationItems.length,
  });

  return {
    interpretedSummary:
      params.wordCount > 0
        ? "The customer provided advisory context that should be used to understand business priorities, constraints and follow-up questions. The narrative must be validated against technical evidence before affecting readiness decisions."
        : "No substantive customer context was available for analysis.",
    businessPriorities: priorities,
    migrationConstraints: constraints,
    criticalWorkloads: workloads,
    customerReportedRisks: risks,
    aiExtractedInsights: [
      {
        insight: "Customer-provided context improves business understanding but does not replace RVTools or verified technical evidence.",
        impact: "Use this layer to guide questions and stakeholder alignment, not to automatically raise technical readiness.",
        confidence: params.wordCount >= 150 ? "medium" : "low",
      },
    ],
    contradictions: [],
    validationItems,
    reportImpact: [
      {
        area: "confidence",
        impact: "Business context confidence can improve when narrative details and additional evidence are provided.",
        shouldAffectScore: false,
        note: "Technical evidence confidence remains separate from customer narrative.",
      },
    ],
    nextQuestions: validationItems.slice(0, 5).map((item) => ({
      question: `Can you confirm: ${item.item}`,
      reason: item.whyItMatters,
      priority: item.priority,
    })),
    contextCompletenessScore: score,
    businessContextConfidence: confidenceFromScore(score),
    safetyFlags: params.safetyFlags,
  };
}

function buildPromptPayload(params: {
  assessment: AssessmentDetail;
  chunks: ClientContextChunk[];
  sanitizedChunkTexts: string[];
  safetyFlags: ClientContextSafetyFlag[];
  warnings: string[];
}): ClientContextPromptPayload {
  const context = params.assessment.clientContext;
  const additionalEvidence = (params.assessment.additionalEvidence ?? [])
    .filter((item) => item.includedInContextAnalysis && item.evidenceFile.deletedAt === null)
    .slice(0, 20)
    .map((item) => ({
      filename: sanitizeClientContextLabel(item.evidenceFile.originalFilename),
      purpose: item.purpose,
      classification: item.classification,
      analysisStatus: item.analysisStatus,
      includedInContextAnalysis: item.includedInContextAnalysis,
      sizeBytes: item.evidenceFile.sizeBytes ?? null,
      uploadedAt: item.evidenceFile.uploadedAt?.toISOString?.() ?? null,
      aiSummary: sanitizeClientContextLabel(item.aiSummary, 500),
      notes: sanitizeClientContextLabel(item.notes, 500),
    }));

  return {
    assessment: {
      id: params.assessment.id,
      title: sanitizeClientContextLabel(params.assessment.title) ?? "Assessment",
      clientLabel: sanitizeClientContextLabel(params.assessment.clientLabel),
      sourcePlatform: params.assessment.sourcePlatform,
      targetPlatform: params.assessment.targetPlatform,
      planLevel: params.assessment.planLevel,
    },
    context: {
      wordCount: context?.wordCount ?? 0,
      characterCount: context?.characterCount ?? 0,
      status: context?.status ?? "not_provided",
      submittedAt: context?.submittedAt?.toISOString?.() ?? null,
      lastEditedAt: context?.lastEditedAt?.toISOString?.() ?? null,
      chunks: params.chunks.map((chunk, index) => ({
        index: chunk.index,
        sanitizedText: params.sanitizedChunkTexts[index]?.slice(0, MAX_PROMPT_CHARS_PER_CHUNK) ?? "",
        wordCount: chunk.wordCount,
        characterCount: chunk.characterCount,
      })),
    },
    additionalEvidence,
    safety: {
      flags: params.safetyFlags,
      warnings: params.warnings,
    },
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
    throw new Error(`Gemini client context request failed with status ${response.status}.`);
  }

  const jsonResponse = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = jsonResponse.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n").trim();
  if (!text) {
    throw new Error("Gemini client context response was empty.");
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
    throw new Error(`OpenAI client context request failed with status ${response.status}.`);
  }

  const jsonResponse = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };
  const text =
    jsonResponse.output_text ??
    jsonResponse.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("\n");
  if (!text?.trim()) {
    throw new Error("OpenAI client context response was empty.");
  }

  return { text: text.trim(), durationMs: Date.now() - startedAt };
}

function mapBlockedStatus(code: string): {
  analysisStatus: AssessmentClientContextAnalysisStatus;
  usageStatus: AiUsageStatus;
  eventType: string;
} {
  if (code === "blocked_budget") {
    return {
      analysisStatus: AssessmentClientContextAnalysisStatus.budget_blocked,
      usageStatus: "blocked_budget",
      eventType: "client_context_analysis_budget_blocked",
    };
  }

  if (code === "disabled_runtime") {
    return {
      analysisStatus: AssessmentClientContextAnalysisStatus.ai_disabled,
      usageStatus: "disabled_runtime",
      eventType: "client_context_analysis_unavailable",
    };
  }

  return {
    analysisStatus: AssessmentClientContextAnalysisStatus.plan_restricted,
    usageStatus: "blocked_limit",
    eventType: "client_context_analysis_plan_restricted",
  };
}

function contextStatusForAnalysisStatus(status: AssessmentClientContextAnalysisStatus) {
  switch (status) {
    case AssessmentClientContextAnalysisStatus.completed:
      return AssessmentClientContextStatus.analyzed;
    case AssessmentClientContextAnalysisStatus.pending:
      return AssessmentClientContextStatus.analysis_pending;
    case AssessmentClientContextAnalysisStatus.failed:
      return AssessmentClientContextStatus.analysis_failed;
    default:
      return AssessmentClientContextStatus.ready_for_analysis;
  }
}

async function persistAnalysis(params: {
  assessment: AssessmentDetail;
  userId: string;
  status: AssessmentClientContextAnalysisStatus;
  result: CustomerContextIntelligenceResult;
  modelUsed: string | null;
  promptVersion?: string;
  analysisVersion?: string;
  eventType: string;
  eventMessage: string;
}) {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const analysis = await tx.assessmentClientContextAnalysis.upsert({
      where: { assessmentId: params.assessment.id },
      create: {
        assessmentId: params.assessment.id,
        status: params.status,
        interpretedSummary: params.result.interpretedSummary,
        businessPrioritiesJson: json(params.result.businessPriorities),
        migrationConstraintsJson: json(params.result.migrationConstraints),
        criticalWorkloadsJson: json(params.result.criticalWorkloads),
        customerReportedRisksJson: json(params.result.customerReportedRisks),
        aiExtractedInsightsJson: json(params.result.aiExtractedInsights),
        contradictionsJson: json(params.result.contradictions),
        validationItemsJson: json(params.result.validationItems),
        reportImpactJson: json(params.result.reportImpact),
        nextQuestionsJson: json(params.result.nextQuestions),
        contextCompletenessScore: params.result.contextCompletenessScore,
        businessContextConfidence: params.result.businessContextConfidence,
        analysisVersion: params.analysisVersion ?? CLIENT_CONTEXT_ANALYSIS_VERSION,
        promptVersion: params.promptVersion ?? CLIENT_CONTEXT_PROMPT_VERSION,
        modelUsed: params.modelUsed,
        safetyFlagsJson: json(params.result.safetyFlags),
        generatedAt:
          params.status === AssessmentClientContextAnalysisStatus.completed ? now : null,
      },
      update: {
        status: params.status,
        interpretedSummary: params.result.interpretedSummary,
        businessPrioritiesJson: json(params.result.businessPriorities),
        migrationConstraintsJson: json(params.result.migrationConstraints),
        criticalWorkloadsJson: json(params.result.criticalWorkloads),
        customerReportedRisksJson: json(params.result.customerReportedRisks),
        aiExtractedInsightsJson: json(params.result.aiExtractedInsights),
        contradictionsJson: json(params.result.contradictions),
        validationItemsJson: json(params.result.validationItems),
        reportImpactJson: json(params.result.reportImpact),
        nextQuestionsJson: json(params.result.nextQuestions),
        contextCompletenessScore: params.result.contextCompletenessScore,
        businessContextConfidence: params.result.businessContextConfidence,
        analysisVersion: params.analysisVersion ?? CLIENT_CONTEXT_ANALYSIS_VERSION,
        promptVersion: params.promptVersion ?? CLIENT_CONTEXT_PROMPT_VERSION,
        modelUsed: params.modelUsed,
        safetyFlagsJson: json(params.result.safetyFlags),
        generatedAt:
          params.status === AssessmentClientContextAnalysisStatus.completed ? now : null,
      },
    });

    await tx.assessmentClientContext.updateMany({
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
        metadataJson: buildClientContextAuditMetadata({
          wordCount: params.assessment.clientContext?.wordCount ?? 0,
          characterCount: params.assessment.clientContext?.characterCount ?? 0,
          status: params.status,
        }),
      },
    });

    return analysis;
  });
}

export async function runAssessmentClientContextAnalysis(params: ActorParams & {
  force?: boolean;
}) {
  const assessment = await ensureAssessmentOwnership(params);
  const context = assessment.clientContext;
  const rawText = context?.rawText?.trim() ?? "";

  if (!context || context.status === AssessmentClientContextStatus.skipped) {
    throw new Error("Client context was skipped or is not available for analysis.");
  }

  if (!rawText) {
    throw new Error("Submit client context before running Customer Context Intelligence.");
  }

  const entitlement = await getEffectiveUserEntitlement(params.userId);
  const limits = resolveClientContextPlanLimits({
    userEntitlementPlanKey: entitlement?.planKey,
    assessmentPlanLevel: assessment.planLevel,
    workspacePlan: assessment.workspace.plan,
  });
  const chunks = chunkClientContextText(rawText, {
    maxChunkWords: Math.min(MAX_PROMPT_CHUNK_WORDS, Math.max(500, Math.floor(limits.maxWords / 4))),
    overlapWords: 80,
  });
  const security = sanitizeClientContextForAi(rawText);
  const sanitizedChunks = chunks.map((chunk) => sanitizeClientContextForAi(chunk.text).sanitizedText);
  const activeAdditionalEvidenceCount = (assessment.additionalEvidence ?? []).filter(
    (item) =>
      item.includedInContextAnalysis &&
      item.analysisStatus !== "excluded" &&
      item.evidenceFile.deletedAt === null &&
      item.evidenceFile.processingStatus !== "deleted",
  ).length;
  const heuristic = buildHeuristicResult({
    text: security.sanitizedText,
    wordCount: context.wordCount,
    additionalEvidenceCount: activeAdditionalEvidenceCount,
    safetyFlags: security.safetyFlags,
  });
  const promptPayload = buildPromptPayload({
    assessment,
    chunks,
    sanitizedChunkTexts: sanitizedChunks,
    safetyFlags: security.safetyFlags,
    warnings: security.warnings,
  });
  const prompt = buildClientContextPrompt(promptPayload);
  const chunkMetadata = summarizeChunkMetadata(chunks);
  const config = await getEffectiveAiAdvisoryConfig();
  const startedAt = Date.now();

  await prisma.$transaction(async (tx) => {
    await tx.assessmentClientContextAnalysis.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        status: AssessmentClientContextAnalysisStatus.pending,
        safetyFlagsJson: json(security.safetyFlags),
        analysisVersion: CLIENT_CONTEXT_ANALYSIS_VERSION,
        promptVersion: CLIENT_CONTEXT_PROMPT_VERSION,
        modelUsed: config.model,
      },
      update: {
        status: AssessmentClientContextAnalysisStatus.pending,
        safetyFlagsJson: json(security.safetyFlags),
        analysisVersion: CLIENT_CONTEXT_ANALYSIS_VERSION,
        promptVersion: CLIENT_CONTEXT_PROMPT_VERSION,
        modelUsed: config.model,
      },
    });
    await tx.assessmentClientContext.update({
      where: { assessmentId: assessment.id },
      data: { status: AssessmentClientContextStatus.analysis_pending },
    });
    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "client_context_analysis_started",
        message: "Started Customer Context Intelligence analysis.",
        metadataJson: buildClientContextAuditMetadata({
          wordCount: context.wordCount,
          characterCount: context.characterCount,
          status: "pending",
        }),
      },
    });
  });

  if (!limits.deepAnalysisEnabled) {
    await recordAiUsageEvent({
      assessmentId: assessment.id,
      userId: params.userId,
      provider: config.provider,
      model: config.model,
      operationType: "client_context_analysis",
      status: "blocked_limit",
      durationMs: Date.now() - startedAt,
      inputChars: prompt.length,
      outputChars: JSON.stringify(heuristic).length,
      fallbackUsed: true,
      metadataJson: {
        reason: "plan_restricted",
        chunkCount: chunkMetadata.chunkCount,
        plan: limits.planKey,
      },
    });
    return persistAnalysis({
      assessment,
      userId: params.userId,
      status: AssessmentClientContextAnalysisStatus.plan_restricted,
      result: {
        ...heuristic,
        interpretedSummary:
          "Customer context was received, but AI analysis is restricted for the current plan.",
      },
      modelUsed: config.model,
      eventType: "client_context_analysis_plan_restricted",
      eventMessage: "Customer Context Intelligence analysis was restricted by plan limits.",
    });
  }

  if (!config.enabled || config.provider === "none" || config.provider === "disabled") {
    await recordAiUsageEvent({
      assessmentId: assessment.id,
      userId: params.userId,
      provider: config.provider,
      model: config.model,
      operationType: "client_context_analysis",
      status: "disabled",
      durationMs: Date.now() - startedAt,
      inputChars: prompt.length,
      outputChars: JSON.stringify(heuristic).length,
      fallbackUsed: true,
      metadataJson: { reason: "ai_disabled", chunkCount: chunkMetadata.chunkCount },
    });
    return persistAnalysis({
      assessment,
      userId: params.userId,
      status: AssessmentClientContextAnalysisStatus.ai_disabled,
      result: {
        ...heuristic,
        interpretedSummary:
          "Customer context was received, but AI analysis is disabled by current runtime configuration.",
      },
      modelUsed: config.model,
      eventType: "client_context_analysis_unavailable",
      eventMessage: "Customer Context Intelligence analysis was unavailable because AI is disabled.",
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
    const blocked = mapBlockedStatus(operationalCheck.code);
    await recordAiUsageEvent({
      assessmentId: assessment.id,
      userId: params.userId,
      provider: config.provider,
      model: config.model,
      operationType: "client_context_analysis",
      status: blocked.usageStatus,
      durationMs: Date.now() - startedAt,
      inputChars: prompt.length,
      outputChars: JSON.stringify(heuristic).length,
      fallbackUsed: true,
      metadataJson: {
        reason: operationalCheck.code,
        chunkCount: chunkMetadata.chunkCount,
      },
    });
    return persistAnalysis({
      assessment,
      userId: params.userId,
      status: blocked.analysisStatus,
      result: {
        ...heuristic,
        interpretedSummary: operationalCheck.message,
      },
      modelUsed: config.model,
      eventType: blocked.eventType,
      eventMessage: "Customer Context Intelligence analysis was blocked by operational controls.",
    });
  }

  const providerApiKey = config.provider === "mock" ? null : getAiAdvisoryProviderKey(config.provider);
  if (config.provider !== "mock" && !providerApiKey) {
    await recordAiUsageEvent({
      assessmentId: assessment.id,
      userId: params.userId,
      provider: config.provider,
      model: config.model,
      operationType: "client_context_analysis",
      status: "unavailable",
      durationMs: Date.now() - startedAt,
      inputChars: prompt.length,
      outputChars: JSON.stringify(heuristic).length,
      errorCategory: "config_missing",
      fallbackUsed: true,
      metadataJson: {
        reason: "config_missing",
        chunkCount: chunkMetadata.chunkCount,
      },
    });
    return persistAnalysis({
      assessment,
      userId: params.userId,
      status: AssessmentClientContextAnalysisStatus.ai_disabled,
      result: {
        ...heuristic,
        interpretedSummary:
          "Customer context was received, but the configured AI provider is missing a server-side API key.",
      },
      modelUsed: config.model,
      eventType: "client_context_analysis_unavailable",
      eventMessage: "Customer Context Intelligence analysis was unavailable because provider configuration is incomplete.",
    });
  }

  try {
    const providerText =
      config.provider === "mock"
        ? {
            text: JSON.stringify(heuristic),
            durationMs: Date.now() - startedAt,
          }
        : config.provider === "gemini"
          ? await callGeminiProvider({
              config,
              apiKey: providerApiKey as string,
              prompt,
            })
          : await callOpenAiProvider({
              config,
              apiKey: providerApiKey as string,
              prompt,
            });

    const normalized = parseAndValidateClientContextAiOutput(providerText.text, heuristic);
    const finalScore =
      normalized.contextCompletenessScore > 0
        ? normalized.contextCompletenessScore
        : calculateContextCompletenessScore({
            wordCount: context.wordCount,
            businessPrioritiesCount: normalized.businessPriorities.length,
            constraintsCount: normalized.migrationConstraints.length,
            criticalWorkloadsCount: normalized.criticalWorkloads.length,
            risksCount: normalized.customerReportedRisks.length,
            timelineSignalsCount: normalized.migrationConstraints.filter((item) => item.type === "timeline").length,
            additionalEvidenceCount: activeAdditionalEvidenceCount,
            validationItemsCount: normalized.validationItems.length,
          });
    const finalResult: CustomerContextIntelligenceResult = {
      ...normalized,
      contextCompletenessScore: finalScore,
      businessContextConfidence: normalized.businessContextConfidence || confidenceFromScore(finalScore),
      safetyFlags: [
        ...security.safetyFlags,
        ...normalized.safetyFlags,
        ...normalized.parseWarnings.map((warning) => ({
          flag: warning,
          severity: "low" as const,
          explanation: "AI output normalization adjusted the response into the expected schema.",
        })),
      ].slice(0, MAX_ARRAY_ITEMS),
    };

    await recordAiUsageEvent({
      assessmentId: assessment.id,
      userId: params.userId,
      provider: config.provider,
      model: config.model,
      operationType: "client_context_analysis",
      status: config.provider === "mock" ? "mock" : "success",
      durationMs: providerText.durationMs,
      inputChars: prompt.length,
      outputChars: providerText.text.length,
      metadataJson: {
        chunkCount: chunkMetadata.chunkCount,
        status: "completed",
      },
    });
    return persistAnalysis({
      assessment,
      userId: params.userId,
      status: AssessmentClientContextAnalysisStatus.completed,
      result: finalResult,
      modelUsed: config.model,
      eventType: "client_context_analysis_completed",
      eventMessage: "Completed Customer Context Intelligence analysis.",
    });
  } catch (error) {
    const errorCategory = getErrorCategory(error);
    const usageStatus: AiUsageStatus = errorCategory === "timeout" ? "timeout" : "error";
    logger.warn("client_context_analysis_failed", {
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
      operationType: "client_context_analysis",
      status: usageStatus,
      durationMs: Date.now() - startedAt,
      inputChars: prompt.length,
      outputChars: JSON.stringify(heuristic).length,
      errorCategory,
      fallbackUsed: true,
      metadataJson: {
        reason: errorCategory,
        chunkCount: chunkMetadata.chunkCount,
      },
    });
    return persistAnalysis({
      assessment,
      userId: params.userId,
      status: AssessmentClientContextAnalysisStatus.failed,
      result: {
        ...heuristic,
        interpretedSummary:
          "Customer context was received, but AI analysis failed. Deterministic assessment sections remain available.",
        safetyFlags: [
          ...heuristic.safetyFlags,
          {
            flag: "ai_analysis_failed",
            severity: "medium",
            explanation: "AI analysis failed and a safe fallback summary was stored.",
          },
        ],
      },
      modelUsed: config.model,
      eventType: "client_context_analysis_failed",
      eventMessage: "Customer Context Intelligence analysis failed and stored a safe fallback.",
    });
  }
}
