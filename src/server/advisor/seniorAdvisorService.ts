import {
  AssessmentAdvisorMessageRole,
  AssessmentAdvisorMessageStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  OPENCODE_GO_DEFAULT_BASE_URL,
  getAiAdvisoryProviderKey,
  getEffectiveAiAdvisoryConfig,
} from "../ai/aiAdvisoryConfig";
import type { AiAdvisoryConfig, AiAdvisoryProvider } from "../ai/aiAdvisoryTypes";
import {
  estimateAiCostUsd,
  estimateTokensFromChars,
  recordAiUsageEvent,
  type AiUsageStatus,
} from "../ai/aiUsageService";
import { assertCanUseAi, getEffectiveUserEntitlement } from "../admin/runtimeSettingsService";
import { ensureAssessmentOwnership, type AssessmentDetail } from "../assessments/assessmentService";
import { logger } from "../logging/logger";
import { compactAdvisorMemoryPromptContext } from "./advisorMemoryPromptContext";
import { runAdvisorMemoryAutoExtraction, type AdvisorMemoryAutoExtractionResult } from "./advisorMemoryExtractionService";
import { getAdvisorMemoryPanelState } from "./advisorMemoryService";
import type { AdvisorMemoryPanelState } from "./advisorMemoryTypes";
import {
  buildSeniorAdvisorMethodologyAuditMetadata,
  buildSeniorAdvisorMethodologyContext,
  buildSeniorAdvisorMethodologyUsageMetadata,
} from "./seniorAdvisorMethodologyContext";
import { buildSeniorAdvisorContextPayloadWithMemory, summarizeSeniorAdvisorContextSections } from "./seniorAdvisorContextService";
import {
  buildSeniorAdvisorUsageState,
  resolveSeniorAdvisorPlanLimits,
} from "./seniorAdvisorPlanLimits";
import {
  buildSeniorAdvisorProviderFallbackMessage,
  buildSeniorAdvisorProviderHttpError,
  extractSeniorAdvisorGeminiText,
  extractSeniorAdvisorOpenCodeGoText,
  getSeniorAdvisorGeminiModelCandidates,
  getSeniorAdvisorProviderErrorCategory,
  getSeniorAdvisorProviderErrorMetadata,
  getSeniorAdvisorProviderErrorModel,
  SeniorAdvisorProviderError,
  type SeniorAdvisorProviderErrorCategory,
} from "./seniorAdvisorProviderHandling";
import { buildSeniorAdvisorPrompt } from "./seniorAdvisorPrompt";
import {
  inspectSeniorAdvisorMessage,
  sanitizeAdvisorResponse,
} from "./seniorAdvisorSecurity";
import {
  SENIOR_ADVISOR_OPERATION_TYPE,
  type SeniorAdvisorContextPayload,
  type SeniorAdvisorMessageView,
  type SeniorAdvisorPanelState,
  type SeniorAdvisorSafetyFlag,
  type SeniorAdvisorSendResult,
} from "./seniorAdvisorTypes";
import { validateSeniorAdvisorUserMessage } from "./seniorAdvisorValidation";

type ActorParams = {
  userId: string;
  assessmentId: string;
};

type ProviderTextResult = {
  text: string;
  durationMs: number;
  model: string | null;
  provider: AiAdvisoryProvider;
  fallbackUsed: boolean;
  primaryProvider: AiAdvisoryProvider;
  primaryModel: string | null;
  primaryErrorCategory: SeniorAdvisorProviderErrorCategory | null;
};

const MAX_HISTORY_MESSAGES = 50;

const EMPTY_ADVISOR_MEMORY_PANEL_STATE: AdvisorMemoryPanelState = {
  enabled: false,
  available: false,
  lockedReason: "Project Memory is temporarily unavailable.",
  planLabel: "Unavailable",
  maxItemsPerAssessment: 0,
  counts: {
    total: 0,
    active: 0,
    needsReview: 0,
    resolved: 0,
    rejected: 0,
    superseded: 0,
    archived: 0,
    decisions: 0,
    openQuestions: 0,
    nextSteps: 0,
  },
  summary: "Project Memory is temporarily unavailable.",
  previewItems: [],
  items: [],
};

type AdvisorBlockedResultCode = "plan_restricted" | "budget_blocked" | "ai_disabled";

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSafetyFlags(value: unknown): SeniorAdvisorSafetyFlag[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item) || typeof item.flag !== "string") {
        return null;
      }

      return {
        flag: item.flag,
        severity:
          item.severity === "high" || item.severity === "medium" || item.severity === "low"
            ? item.severity
            : "low",
        explanation:
          typeof item.explanation === "string"
            ? item.explanation
            : "Advisor safety note.",
      } satisfies SeniorAdvisorSafetyFlag;
    })
    .filter((item): item is SeniorAdvisorSafetyFlag => item !== null)
    .slice(0, 8);
}

function mapMessageView(message: {
  id: string;
  role: AssessmentAdvisorMessageRole;
  sanitizedContent: string;
  status: AssessmentAdvisorMessageStatus;
  provider: string | null;
  model: string | null;
  creditCost: number;
  createdAt: Date;
  safetyFlagsJson: Prisma.JsonValue | null;
}): SeniorAdvisorMessageView {
  return {
    id: message.id,
    role: message.role,
    content: message.sanitizedContent,
    status: message.status,
    provider: message.provider,
    model: message.model,
    creditCost: message.creditCost,
    createdAt: message.createdAt,
    safetyFlags: parseSafetyFlags(message.safetyFlagsJson),
  };
}

function buildHelperCopy() {
  return {
    title: "Senior Migration Advisor",
    shortDescription:
      "Ask an AI migration advisor about this assessment. It can explain risks, summarize findings, suggest next steps, clarify missing evidence and help you prepare executive or technical responses.",
    canDo: [
      "Explain readiness and confidence scores.",
      "Identify missing evidence.",
      "Interpret Storage/Ceph and Licensing results.",
      "Summarize assessment status.",
      "Prepare client-facing explanations.",
      "Create practical next-step checklists.",
    ],
    cannotDo: [
      "Guarantee migration success.",
      "Replace a human migration engineer.",
      "Access systems outside submitted evidence.",
      "Invent missing data.",
      "Approve production migration.",
      "Execute infrastructure changes.",
    ],
    suggestedPrompts: [
      "What should I complete next?",
      "Explain the top risks.",
      "What evidence is missing?",
      "Summarize this assessment for an executive.",
      "Why is Storage/Ceph conditional?",
      "What should we validate before migration?",
      "Draft a client update.",
    ],
  };
}

function mapBlockedCode(code: string): {
  usageStatus: AiUsageStatus;
  resultCode: AdvisorBlockedResultCode;
  eventType: string;
} {
  if (code === "blocked_budget") {
    return {
      usageStatus: "blocked_budget",
      resultCode: "budget_blocked",
      eventType: "advisor_message_budget_blocked",
    };
  }

  if (code === "disabled_runtime") {
    return {
      usageStatus: "disabled_runtime",
      resultCode: "ai_disabled",
      eventType: "advisor_message_ai_disabled",
    };
  }

  return {
    usageStatus: "blocked_limit",
    resultCode: "plan_restricted",
    eventType: "advisor_message_plan_restricted",
  };
}

function compactAdvisorContext(context: SeniorAdvisorContextPayload) {
  return {
    ...context,
    projectMemory: compactAdvisorMemoryPromptContext(context.projectMemory, 3),
    completion: {
      ...context.completion,
      modules: context.completion.modules.slice(0, 8),
      missingEvidence: context.completion.missingEvidence.slice(0, 5),
      nextSteps: context.completion.nextSteps.slice(0, 5),
    },
    topRisks: context.topRisks.slice(0, 5),
    licensing: {
      ...context.licensing,
      executiveRecommendation: context.licensing.executiveRecommendation?.slice(0, 320) ?? null,
      missingEvidence: context.licensing.missingEvidence.slice(0, 5),
    },
    clientContext: {
      ...context.clientContext,
      interpretedSummary: context.clientContext.interpretedSummary?.slice(0, 360) ?? null,
      nextQuestions: context.clientContext.nextQuestions.slice(0, 4),
    },
    storage: {
      ...context.storage,
      interpretedSummary: context.storage.interpretedSummary?.slice(0, 360) ?? null,
      cephSummary: context.storage.cephSummary?.slice(0, 320) ?? null,
      missingEvidence: context.storage.missingEvidence.slice(0, 5),
    },
  } satisfies SeniorAdvisorContextPayload;
}

function minimalAdvisorContext(context: SeniorAdvisorContextPayload) {
  return {
    contextVersion: context.contextVersion,
    projectMemory: compactAdvisorMemoryPromptContext(context.projectMemory, 1),
    assessment: context.assessment,
    completion: {
      completionScore: context.completion.completionScore,
      completionStatus: context.completion.completionStatus,
      modules: context.completion.modules.slice(0, 6),
      missingEvidence: context.completion.missingEvidence.slice(0, 4),
      nextSteps: context.completion.nextSteps.slice(0, 4),
    },
    inventory: context.inventory,
    scores: context.scores,
    topRisks: context.topRisks.slice(0, 3),
    licensing: {
      ...context.licensing,
      executiveRecommendation: context.licensing.executiveRecommendation?.slice(0, 240) ?? null,
      missingEvidence: context.licensing.missingEvidence.slice(0, 3),
    },
    clientContext: {
      ...context.clientContext,
      interpretedSummary: context.clientContext.interpretedSummary?.slice(0, 240) ?? null,
      nextQuestions: context.clientContext.nextQuestions.slice(0, 3),
    },
    storage: {
      ...context.storage,
      interpretedSummary: context.storage.interpretedSummary?.slice(0, 240) ?? null,
      cephSummary: context.storage.cephSummary?.slice(0, 240) ?? null,
      missingEvidence: context.storage.missingEvidence.slice(0, 3),
    },
    evidence: context.evidence,
    reports: context.reports,
    boundaries: context.boundaries,
  } satisfies SeniorAdvisorContextPayload;
}

function buildBoundedPrompt(params: {
  context: SeniorAdvisorContextPayload;
  userQuestion: string;
  recentMessages: SeniorAdvisorMessageView[];
  maxPromptChars: number;
  methodologyContext?: string | null;
}) {
  const candidates = [
    params.context,
    compactAdvisorContext(params.context),
    minimalAdvisorContext(params.context),
  ];
  const historyCandidates = [
    params.recentMessages.slice(-8),
    params.recentMessages.slice(-4),
    [],
  ];

  for (const context of candidates) {
    for (const recentMessages of historyCandidates) {
      const prompt = buildSeniorAdvisorPrompt({
        context,
        userQuestion: params.userQuestion,
        recentMessages,
        methodologyContext: params.methodologyContext,
      });
      if (prompt.length <= params.maxPromptChars) {
        return { prompt, contextUsed: context, reduced: context !== params.context || recentMessages.length !== params.recentMessages.slice(-8).length };
      }
    }
  }

  const prompt = buildSeniorAdvisorPrompt({
    context: minimalAdvisorContext(params.context),
    userQuestion: params.userQuestion.slice(0, 1_200),
    recentMessages: [],
    methodologyContext: params.methodologyContext,
  }).slice(0, params.maxPromptChars);
  return { prompt, contextUsed: minimalAdvisorContext(params.context), reduced: true };
}

export function buildSeniorAdvisorMemoryUsageMetadata(
  contextSections: ReturnType<typeof summarizeSeniorAdvisorContextSections>,
) {
  return {
    memoryIncluded: contextSections.memoryIncluded,
    memoryItemCount: contextSections.memoryItemCount,
    memoryContextChars: contextSections.memoryContextChars,
    memoryFallbackReason: contextSections.memoryFallbackReason,
  };
}

function buildAdvisorMemoryExtractionUsageMetadata(
  result: AdvisorMemoryAutoExtractionResult | null,
) {
  return {
    memoryCandidatesGenerated: result?.generated ?? 0,
    memoryCandidatesSkipped: result?.skipped ?? 0,
    memoryExtractionStatus: result?.status ?? "disabled",
  };
}

async function runAdvisorMemoryAutoExtractionSafely(params: {
  userId: string;
  assessment: AssessmentDetail;
  conversationId: string;
  userMessage: { id: string; content: string; status: "completed" | "failed" | "blocked" };
  assistantMessage: { id: string; content: string; status: "completed" | "failed" | "blocked" };
}) {
  try {
    return await runAdvisorMemoryAutoExtraction(params);
  } catch (error) {
    logger.warn("advisor_memory_auto_extraction_failed", {
      assessmentId: params.assessment.id,
      userId: params.userId,
      error,
    });
    return {
      status: "failed",
      generated: 0,
      skipped: 0,
      failed: 1,
      reasons: ["extraction_failed"],
    } satisfies AdvisorMemoryAutoExtractionResult;
  }
}

function buildMockAdvisorAnswer(params: {
  context: SeniorAdvisorContextPayload;
  question: string;
}) {
  const question = params.question.toLowerCase();
  const context = params.context;
  const memory = context.projectMemory?.included ? context.projectMemory : null;
  const missing = [
    ...context.completion.missingEvidence,
    ...context.licensing.missingEvidence,
    ...context.storage.missingEvidence,
    ...(memory?.openQuestions.map((item) => item.title) ?? []),
  ].slice(0, 5);
  const topRisks = context.topRisks.slice(0, 3);
  const memoryContinuity =
    memory && memory.decisions.length > 0
      ? `Known project decisions to preserve: ${memory.decisions
          .slice(0, 3)
          .map((item) => `${item.title} (${item.truthStatus})`)
          .join("; ")}.`
      : null;

  if (question.includes("ceph")) {
    return [
      `Based on the current assessment, Ceph status is ${context.storage.cephStatus ?? "not evaluated"}.`,
      context.storage.cephSummary
        ? `Current Ceph summary: ${context.storage.cephSummary}`
        : "There is not enough persisted Ceph detail to treat Ceph as a confirmed recommendation.",
      "Ceph is not recommended by default. Validate node count, OSD layout, network design, failure domains, backup/PBS and operational ownership before production.",
      missing.length > 0 ? `Next evidence to collect: ${missing.join("; ")}.` : "Next step: validate target architecture evidence before using Ceph in a production plan.",
    ].join("\n\n");
  }

  if (question.includes("missing") || question.includes("next")) {
    return [
      `This assessment is currently ${context.completion.completionStatus} with ${context.completion.completionScore}% completion.`,
      missing.length > 0
        ? `Highest-value missing evidence: ${missing.join("; ")}.`
        : "No high-signal missing evidence was found in the advisor context, but you should still validate business, backup and storage assumptions before production.",
      context.completion.nextSteps.length > 0
        ? `Recommended next steps: ${[
            ...context.completion.nextSteps,
            ...(memory?.nextSteps.map((item) => item.title) ?? []),
          ]
            .slice(0, 4)
            .join("; ")}.`
        : "Recommended next step: review the completion center and fill the highest-impact gaps.",
      memoryContinuity,
    ].join("\n\n");
  }

  return [
    `Current assessment status: ${context.completion.completionStatus}, ${context.completion.completionScore}% complete.`,
    topRisks.length > 0
      ? `Top risks: ${topRisks.map((risk) => `${risk.severity} ${risk.title}`).join("; ")}.`
      : "No top risks are available in the advisor context yet.",
    `Readiness score: ${context.scores.readinessScore ?? "not calculated"}; confidence score: ${context.scores.confidenceScore ?? "not calculated"}.`,
    memoryContinuity,
    "Use this answer as advisory guidance only. It does not approve production migration or replace the deterministic ShiftReadiness findings.",
  ].filter(Boolean).join("\n\n");
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
  maxResponseTokens: number;
}): Promise<ProviderTextResult> {
  const startedAt = Date.now();
  const models = getSeniorAdvisorGeminiModelCandidates(params.config.model);
  let lastError: unknown = null;

  for (const model of models) {
    try {
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
              maxOutputTokens: params.maxResponseTokens,
              temperature: 0.2,
            },
          }),
        },
        params.config.timeoutMs,
      );

      if (!response.ok) {
        throw await buildSeniorAdvisorProviderHttpError({
          response,
          provider: "gemini",
          model,
        });
      }

      const jsonResponse = (await response.json()) as unknown;
      const text = extractSeniorAdvisorGeminiText(jsonResponse);

      return {
        text,
        durationMs: Date.now() - startedAt,
        model,
        provider: "gemini",
        fallbackUsed: false,
        primaryProvider: "gemini",
        primaryModel: params.config.model,
        primaryErrorCategory: null,
      };
    } catch (error) {
      lastError = error;
      const category = getSeniorAdvisorProviderErrorCategory(error);
      const canRetryModel =
        /^gemini-1\.5-/i.test(model) &&
        models.some((candidate) => candidate !== model) &&
        category !== "config_missing" &&
        category !== "quota_exceeded" &&
        category !== "safety_blocked" &&
        category !== "timeout";
      if (!canRetryModel) {
        throw error;
      }
    }
  }

  throw lastError;
}

async function callOpenAiProvider(params: {
  config: AiAdvisoryConfig;
  apiKey: string;
  prompt: string;
  maxResponseTokens: number;
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
        max_output_tokens: params.maxResponseTokens,
      }),
    },
    params.config.timeoutMs,
  );

  if (!response.ok) {
    throw await buildSeniorAdvisorProviderHttpError({
      response,
      provider: "openai",
      model,
    });
  }

  const jsonResponse = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };
  const text =
    jsonResponse.output_text ??
    jsonResponse.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("\n");
  if (!text?.trim()) {
    throw new Error("OpenAI Senior Advisor response was empty.");
  }

  return {
    text: text.trim(),
    durationMs: Date.now() - startedAt,
    model,
    provider: "openai",
    fallbackUsed: false,
    primaryProvider: "openai",
    primaryModel: params.config.model,
    primaryErrorCategory: null,
  };
}

async function callOpenCodeGoProvider(params: {
  config: AiAdvisoryConfig;
  apiKey: string;
  prompt: string;
  maxResponseTokens: number;
  model?: string | null;
  fallbackUsed: boolean;
  primaryProvider: AiAdvisoryProvider;
  primaryModel: string | null;
  primaryErrorCategory: SeniorAdvisorProviderErrorCategory | null;
}): Promise<ProviderTextResult> {
  const startedAt = Date.now();
  const model = params.model ?? params.config.fallbackModel ?? "glm-5.1";
  const response = await fetchWithTimeout(
    params.config.opencodeGoBaseUrl ?? OPENCODE_GO_DEFAULT_BASE_URL,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are the Senior Migration Advisor for one ShiftReadiness assessment. Use only the provided context, avoid guarantees, and answer concisely.",
          },
          { role: "user", content: params.prompt },
        ],
        temperature: 0.2,
        max_tokens: params.maxResponseTokens,
      }),
    },
    params.config.timeoutMs,
  );

  if (!response.ok) {
    throw await buildSeniorAdvisorProviderHttpError({
      response,
      provider: "opencode_go",
      model,
    });
  }

  const jsonResponse = (await response.json()) as unknown;
  const text = extractSeniorAdvisorOpenCodeGoText(jsonResponse);

  return {
    text,
    durationMs: Date.now() - startedAt,
    model,
    provider: "opencode_go",
    fallbackUsed: params.fallbackUsed,
    primaryProvider: params.primaryProvider,
    primaryModel: params.primaryModel,
    primaryErrorCategory: params.primaryErrorCategory,
  };
}

function buildMissingProviderKeyError(provider: AiAdvisoryProvider, model: string | null) {
  return new SeniorAdvisorProviderError({
    message: `${provider} Senior Advisor provider key is not configured.`,
    category: "config_missing",
    provider,
    model,
    safeReason: "server_side_api_key_missing",
  });
}

function shouldFallbackToOpenCodeGo(error: unknown) {
  const category = getSeniorAdvisorProviderErrorCategory(error);
  return category !== "safety_blocked";
}

async function callAdvisorProviderWithFallback(params: {
  config: AiAdvisoryConfig;
  prompt: string;
  maxResponseTokens: number;
}): Promise<ProviderTextResult> {
  const primaryProvider = params.config.provider;
  const primaryModel = params.config.model;

  try {
    const apiKey = getAiAdvisoryProviderKey(primaryProvider);
    if (!apiKey) {
      throw buildMissingProviderKeyError(primaryProvider, primaryModel);
    }

    if (primaryProvider === "gemini") {
      return await callGeminiProvider({
        config: params.config,
        apiKey,
        prompt: params.prompt,
        maxResponseTokens: params.maxResponseTokens,
      });
    }

    if (primaryProvider === "opencode_go") {
      return await callOpenCodeGoProvider({
        config: params.config,
        apiKey,
        prompt: params.prompt,
        maxResponseTokens: params.maxResponseTokens,
        model: primaryModel,
        fallbackUsed: false,
        primaryProvider,
        primaryModel,
        primaryErrorCategory: null,
      });
    }

    return await callOpenAiProvider({
      config: params.config,
      apiKey,
      prompt: params.prompt,
      maxResponseTokens: params.maxResponseTokens,
    });
  } catch (primaryError) {
    if (
      primaryProvider === "gemini" &&
      params.config.fallbackProvider === "opencode_go" &&
      shouldFallbackToOpenCodeGo(primaryError)
    ) {
      const fallbackKey = getAiAdvisoryProviderKey("opencode_go");
      if (fallbackKey) {
        return callOpenCodeGoProvider({
          config: params.config,
          apiKey: fallbackKey,
          prompt: params.prompt,
          maxResponseTokens: params.maxResponseTokens,
          model: params.config.fallbackModel,
          fallbackUsed: true,
          primaryProvider,
          primaryModel,
          primaryErrorCategory: getSeniorAdvisorProviderErrorCategory(primaryError),
        });
      }
    }

    throw primaryError;
  }
}

function getErrorCategory(error: unknown) {
  return getSeniorAdvisorProviderErrorCategory(error);
}

async function recordAdvisorAuditEvent(params: {
  userId: string;
  assessment: AssessmentDetail;
  eventType: string;
  message: string;
  metadataJson?: Record<string, string | number | boolean | null>;
}) {
  try {
    await prisma.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: params.assessment.workspaceId,
        assessmentId: params.assessment.id,
        eventType: params.eventType,
        message: params.message,
        metadataJson: params.metadataJson,
      },
    });
  } catch {
    // Advisor UX must not fail because audit persistence is unavailable.
  }
}

async function getAdvisorUsageState(params: {
  assessment: AssessmentDetail;
  userId: string;
}) {
  const [entitlement, conversation] = await Promise.all([
    getEffectiveUserEntitlement(params.userId),
    prisma.assessmentAdvisorConversation.findUnique({
      where: { assessmentId: params.assessment.id },
      select: { id: true, creditUsed: true },
    }),
  ]);
  const limits = resolveSeniorAdvisorPlanLimits({
    userEntitlementPlanKey: entitlement?.planKey,
    assessmentPlanLevel: params.assessment.planLevel,
    workspacePlan: params.assessment.workspace.plan,
  });

  return {
    limits,
    conversationId: conversation?.id ?? null,
    usage: buildSeniorAdvisorUsageState({
      limits,
      messagesUsed: conversation?.creditUsed ?? 0,
    }),
  };
}

export async function getSeniorAdvisorPanelState(
  params: ActorParams,
): Promise<SeniorAdvisorPanelState> {
  const assessment = await ensureAssessmentOwnership(params);
  const usageState = await getAdvisorUsageState({
    assessment,
    userId: params.userId,
  });
  const messages = usageState.conversationId
    ? await prisma.assessmentAdvisorMessage.findMany({
        where: {
          conversationId: usageState.conversationId,
          assessmentId: assessment.id,
          workspaceId: assessment.workspaceId,
        },
        orderBy: { createdAt: "asc" },
        take: MAX_HISTORY_MESSAGES,
      })
    : [];
  const memory = await getAdvisorMemoryPanelState(params).catch((error) => {
    logger.warn("advisor_memory_panel_state_unavailable", {
      assessmentId: assessment.id,
      userId: params.userId,
      error,
    });

    return EMPTY_ADVISOR_MEMORY_PANEL_STATE;
  });

  return {
    assessmentId: assessment.id,
    conversationId: usageState.conversationId,
    usage: usageState.usage,
    messages: messages.map(mapMessageView),
    memory,
    lockedReason: usageState.usage.enabled
      ? null
      : "Senior Migration Advisor is available on Professional, Blueprint and Partner plans.",
    helper: buildHelperCopy(),
  };
}

async function getOrCreateAdvisorConversation(params: {
  assessment: AssessmentDetail;
  userId: string;
}) {
  return prisma.assessmentAdvisorConversation.upsert({
    where: { assessmentId: params.assessment.id },
    create: {
      assessmentId: params.assessment.id,
      workspaceId: params.assessment.workspaceId,
      createdByUserId: params.userId,
      status: "active",
      title: "Senior Migration Advisor",
    },
    update: {
      status: "active",
    },
  });
}

async function persistAdvisorExchange(params: {
  assessment: AssessmentDetail;
  conversationId: string;
  userId: string;
  userMessage: string;
  assistantMessage: string;
  userStatus?: AssessmentAdvisorMessageStatus;
  assistantStatus?: AssessmentAdvisorMessageStatus;
  provider: string | null;
  model: string | null;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUsd: number | null;
  creditCost: number;
  safetyFlags: SeniorAdvisorSafetyFlag[];
  referencedContextJson?: unknown;
}) {
  const now = new Date();
  const exchange = await prisma.$transaction(async (tx) => {
    const userMessage = await tx.assessmentAdvisorMessage.create({
      data: {
        conversationId: params.conversationId,
        assessmentId: params.assessment.id,
        workspaceId: params.assessment.workspaceId,
        userId: params.userId,
        role: "user",
        content: params.userMessage,
        sanitizedContent: params.userMessage,
        status: params.userStatus ?? "completed",
        provider: params.provider,
        model: params.model,
        estimatedInputTokens: params.estimatedInputTokens,
        estimatedOutputTokens: 0,
        estimatedCostUsd: null,
        creditCost: params.creditCost,
        safetyFlagsJson: json(params.safetyFlags),
        referencedContextJson: params.referencedContextJson
          ? json(params.referencedContextJson)
          : undefined,
      },
    });

    const assistantMessage = await tx.assessmentAdvisorMessage.create({
      data: {
        conversationId: params.conversationId,
        assessmentId: params.assessment.id,
        workspaceId: params.assessment.workspaceId,
        userId: params.userId,
        role: "assistant",
        content: params.assistantMessage,
        sanitizedContent: params.assistantMessage,
        status: params.assistantStatus ?? "completed",
        provider: params.provider,
        model: params.model,
        estimatedInputTokens: params.estimatedInputTokens,
        estimatedOutputTokens: params.estimatedOutputTokens,
        estimatedCostUsd: params.estimatedCostUsd,
        creditCost: 0,
        safetyFlagsJson: json(params.safetyFlags),
        referencedContextJson: params.referencedContextJson
          ? json(params.referencedContextJson)
          : undefined,
      },
    });

    await tx.assessmentAdvisorConversation.update({
      where: { id: params.conversationId },
      data: {
        messageCount: { increment: 2 },
        creditUsed: { increment: params.creditCost },
        lastMessageAt: now,
      },
    });

    return { userMessage, assistantMessage };
  });

  return {
    userMessage: mapMessageView(exchange.userMessage),
    assistantMessage: mapMessageView(exchange.assistantMessage),
  };
}

export async function sendSeniorAdvisorMessage(
  params: ActorParams & { message: unknown },
): Promise<SeniorAdvisorSendResult> {
  const assessment = await ensureAssessmentOwnership(params);
  const usageState = await getAdvisorUsageState({
    assessment,
    userId: params.userId,
  });
  const config = await getEffectiveAiAdvisoryConfig();
  const startedAt = Date.now();

  if (!usageState.limits.enabled) {
    await recordAdvisorAuditEvent({
      userId: params.userId,
      assessment,
      eventType: "advisor_message_plan_restricted",
      message: "Senior Migration Advisor was blocked by plan limits.",
      metadataJson: { plan: usageState.limits.planKey },
    });
    await recordAiUsageEvent({
      assessmentId: assessment.id,
      userId: params.userId,
      provider: config.provider,
      model: config.model,
      operationType: SENIOR_ADVISOR_OPERATION_TYPE,
      status: "blocked_limit",
      durationMs: Date.now() - startedAt,
      inputChars: 0,
      outputChars: 0,
      fallbackUsed: true,
      metadataJson: {
        reason: "plan_restricted",
        memoryIncluded: false,
        memoryItemCount: 0,
        memoryContextChars: 0,
        memoryFallbackReason: "not_evaluated",
      },
    });
    return {
      ok: false,
      code: "plan_restricted",
      message: "Senior Migration Advisor is not included in this plan.",
      usage: usageState.usage,
    };
  }

  if (usageState.usage.exhausted) {
    await recordAdvisorAuditEvent({
      userId: params.userId,
      assessment,
      eventType: "advisor_credit_limit_reached",
      message: "Senior Migration Advisor message limit was reached.",
      metadataJson: {
        messagesUsed: usageState.usage.messagesUsed,
        messageLimit: usageState.usage.messageLimit,
      },
    });
    await recordAiUsageEvent({
      assessmentId: assessment.id,
      userId: params.userId,
      provider: config.provider,
      model: config.model,
      operationType: SENIOR_ADVISOR_OPERATION_TYPE,
      status: "blocked_limit",
      durationMs: Date.now() - startedAt,
      inputChars: 0,
      outputChars: 0,
      fallbackUsed: true,
      metadataJson: {
        reason: "credits_exhausted",
        memoryIncluded: false,
        memoryItemCount: 0,
        memoryContextChars: 0,
        memoryFallbackReason: "not_evaluated",
      },
    });
    return {
      ok: false,
      code: "credits_exhausted",
      message: "Advisor message limit reached for this assessment.",
      usage: usageState.usage,
    };
  }

  const validation = validateSeniorAdvisorUserMessage({
    message: params.message,
    limits: usageState.limits,
  });
  if (!validation.ok) {
    return {
      ok: false,
      code: "validation_failed",
      message: validation.message,
      usage: usageState.usage,
    };
  }

  const security = inspectSeniorAdvisorMessage(
    validation.normalizedMessage,
    usageState.limits.maxUserMessageChars,
  );
  const context = await buildSeniorAdvisorContextPayloadWithMemory({
    assessment,
    userId: params.userId,
  });
  const methodologyContext = buildSeniorAdvisorMethodologyContext({
    context,
    userQuestion: security.sanitizedText,
  });
  const methodologyUsageMetadata = buildSeniorAdvisorMethodologyUsageMetadata(methodologyContext);
  const methodologyAuditMetadata = buildSeniorAdvisorMethodologyAuditMetadata(methodologyContext);
  if (methodologyContext.status === "error") {
    logger.warn("advisor_methodology_context_preview_failed", {
      assessmentId: assessment.id,
      userId: params.userId,
      errorCode: methodologyContext.errorCode,
    });
  }
  const conversation = await getOrCreateAdvisorConversation({
    assessment,
    userId: params.userId,
  });
  const recentMessages = await prisma.assessmentAdvisorMessage.findMany({
    where: {
      conversationId: conversation.id,
      assessmentId: assessment.id,
      workspaceId: assessment.workspaceId,
    },
    orderBy: { createdAt: "asc" },
    take: 12,
  });
  const recentMessageViews = recentMessages.map(mapMessageView);
  const boundedPrompt = buildBoundedPrompt({
    context,
    userQuestion: security.sanitizedText,
    recentMessages: recentMessageViews,
    maxPromptChars: Math.min(
      usageState.limits.maxPromptInputChars,
      config.maxInputChars > 0 ? config.maxInputChars : usageState.limits.maxPromptInputChars,
    ),
    methodologyContext: methodologyContext.promptSection,
  });
  const contextSections = summarizeSeniorAdvisorContextSections(boundedPrompt.contextUsed);
  const memoryUsageMetadata = buildSeniorAdvisorMemoryUsageMetadata(contextSections);
  const inputChars = boundedPrompt.prompt.length;

  if (!config.enabled || config.provider === "none" || config.provider === "disabled") {
    const assistantText = "Senior Migration Advisor is currently unavailable because AI is disabled. Deterministic assessment sections remain available.";
    const exchange = await persistAdvisorExchange({
      assessment,
      conversationId: conversation.id,
      userId: params.userId,
      userMessage: security.sanitizedText,
      assistantMessage: assistantText,
      userStatus: "blocked",
      assistantStatus: "blocked",
      provider: config.provider,
      model: config.model,
      estimatedInputTokens: estimateTokensFromChars(inputChars),
      estimatedOutputTokens: estimateTokensFromChars(assistantText.length),
      estimatedCostUsd: 0,
      creditCost: 0,
      safetyFlags: security.safetyFlags,
      referencedContextJson: contextSections,
    });
    await recordAiUsageEvent({
      assessmentId: assessment.id,
      userId: params.userId,
      provider: config.provider,
      model: config.model,
      operationType: SENIOR_ADVISOR_OPERATION_TYPE,
      status: "disabled_runtime",
      durationMs: Date.now() - startedAt,
      inputChars,
      outputChars: assistantText.length,
      fallbackUsed: true,
      metadataJson: {
        reason: "ai_disabled",
        contextReduced: boundedPrompt.reduced,
        ...memoryUsageMetadata,
        ...methodologyUsageMetadata,
      },
    });
    await recordAdvisorAuditEvent({
      userId: params.userId,
      assessment,
      eventType: "advisor_message_ai_disabled",
      message: "Senior Migration Advisor message was blocked because AI is disabled.",
      metadataJson: {
        provider: config.provider,
        model: config.model,
        ...methodologyAuditMetadata,
      },
    });
    return {
      ok: true,
      assistantMessage: exchange.assistantMessage,
      usage: usageState.usage,
    };
  }

  const operationalCheck = await assertCanUseAi({
    userId: params.userId,
    assessmentId: assessment.id,
    provider: config.provider,
    model: config.model,
    inputChars,
    outputChars: 0,
  });

  if (!operationalCheck.allowed) {
    const mapped = mapBlockedCode(operationalCheck.code);
    const assistantText = operationalCheck.message;
    const exchange = await persistAdvisorExchange({
      assessment,
      conversationId: conversation.id,
      userId: params.userId,
      userMessage: security.sanitizedText,
      assistantMessage: assistantText,
      userStatus: "blocked",
      assistantStatus: "blocked",
      provider: config.provider,
      model: config.model,
      estimatedInputTokens: estimateTokensFromChars(inputChars),
      estimatedOutputTokens: estimateTokensFromChars(assistantText.length),
      estimatedCostUsd: 0,
      creditCost: 0,
      safetyFlags: security.safetyFlags,
      referencedContextJson: contextSections,
    });
    await recordAiUsageEvent({
      assessmentId: assessment.id,
      userId: params.userId,
      provider: config.provider,
      model: config.model,
      operationType: SENIOR_ADVISOR_OPERATION_TYPE,
      status: mapped.usageStatus,
      durationMs: Date.now() - startedAt,
      inputChars,
      outputChars: assistantText.length,
      fallbackUsed: true,
      metadataJson: {
        reason: operationalCheck.code,
        contextReduced: boundedPrompt.reduced,
        ...memoryUsageMetadata,
        ...methodologyUsageMetadata,
      },
    });
    await recordAdvisorAuditEvent({
      userId: params.userId,
      assessment,
      eventType: mapped.eventType,
      message: "Senior Migration Advisor message was blocked by operational controls.",
      metadataJson: {
        reason: operationalCheck.code,
        ...methodologyAuditMetadata,
      },
    });
    return {
      ok: true,
      assistantMessage: exchange.assistantMessage,
      usage: usageState.usage,
    };
  }

  try {
    let providerResult: ProviderTextResult;
    if (config.provider === "mock") {
      const mockText = buildMockAdvisorAnswer({
        context: boundedPrompt.contextUsed,
        question: security.sanitizedText,
      });
      providerResult = {
        text: mockText,
        durationMs: Date.now() - startedAt,
        model: config.model,
        provider: "mock",
        fallbackUsed: false,
        primaryProvider: "mock",
        primaryModel: config.model,
        primaryErrorCategory: null,
      };
    } else {
      providerResult = await callAdvisorProviderWithFallback({
        config,
        prompt: boundedPrompt.prompt,
        maxResponseTokens: usageState.limits.maxResponseTokens,
      });
    }

    const outputText = sanitizeAdvisorResponse(providerResult.text);
    const estimatedInputTokens = estimateTokensFromChars(inputChars);
    const estimatedOutputTokens = estimateTokensFromChars(outputText.length);
    const estimatedCostUsd = estimateAiCostUsd({
      provider: providerResult.provider,
      model: providerResult.model,
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
    });
    const exchange = await persistAdvisorExchange({
      assessment,
      conversationId: conversation.id,
      userId: params.userId,
      userMessage: security.sanitizedText,
      assistantMessage: outputText,
      provider: providerResult.provider,
      model: providerResult.model,
      estimatedInputTokens,
      estimatedOutputTokens,
      estimatedCostUsd,
      creditCost: 1,
      safetyFlags: security.safetyFlags,
      referencedContextJson: contextSections,
    });
    const memoryExtraction = await runAdvisorMemoryAutoExtractionSafely({
      userId: params.userId,
      assessment,
      conversationId: conversation.id,
      userMessage: {
        id: exchange.userMessage.id,
        content: exchange.userMessage.content,
        status: exchange.userMessage.status,
      },
      assistantMessage: {
        id: exchange.assistantMessage.id,
        content: exchange.assistantMessage.content,
        status: exchange.assistantMessage.status,
      },
    });
    await recordAiUsageEvent({
      assessmentId: assessment.id,
      userId: params.userId,
      provider: providerResult.provider,
      model: providerResult.model,
      operationType: SENIOR_ADVISOR_OPERATION_TYPE,
      status: providerResult.provider === "mock" ? "mock" : "success",
      durationMs: providerResult.durationMs,
      inputChars,
      outputChars: outputText.length,
      fallbackUsed: providerResult.fallbackUsed || security.safetyFlags.length > 0 || boundedPrompt.reduced,
      metadataJson: {
        status: providerResult.provider === "mock" ? "mock" : "success",
        primaryProvider: providerResult.primaryProvider,
        primaryModel: providerResult.primaryModel,
        finalProvider: providerResult.provider,
        finalModel: providerResult.model,
        fallbackUsed: providerResult.fallbackUsed,
        primaryErrorCategory: providerResult.primaryErrorCategory,
        contextReduced: boundedPrompt.reduced,
        contextSections: Object.values(contextSections).filter(Boolean).length,
        ...memoryUsageMetadata,
        ...methodologyUsageMetadata,
        ...buildAdvisorMemoryExtractionUsageMetadata(memoryExtraction),
        creditCost: 1,
      },
    });
    await recordAdvisorAuditEvent({
      userId: params.userId,
      assessment,
      eventType: "advisor_message_sent",
      message: "Senior Migration Advisor message completed.",
      metadataJson: {
        provider: providerResult.provider,
        model: providerResult.model,
        fallbackUsed: providerResult.fallbackUsed,
        creditCost: 1,
        ...methodologyAuditMetadata,
      },
    });
    const refreshedUsage = buildSeniorAdvisorUsageState({
      limits: usageState.limits,
      messagesUsed: usageState.usage.messagesUsed + 1,
    });

    return {
      ok: true,
      assistantMessage: exchange.assistantMessage,
      usage: refreshedUsage,
    };
  } catch (error) {
    const errorCategory = getErrorCategory(error);
    const usageStatus: AiUsageStatus = errorCategory === "timeout" ? "timeout" : "error";
    const providerErrorMetadata = getSeniorAdvisorProviderErrorMetadata(error);
    const errorModel = getSeniorAdvisorProviderErrorModel(error) ?? config.model;
    logger.warn("senior_advisor_message_failed", {
      assessmentId: assessment.id,
      userId: params.userId,
      provider: config.provider,
      model: errorModel,
      errorCategory,
      providerStatus: providerErrorMetadata.providerStatus ?? null,
      httpStatus: providerErrorMetadata.httpStatus ?? null,
      safeReason: providerErrorMetadata.safeReason ?? null,
      responseCandidateCount: providerErrorMetadata.responseCandidateCount ?? null,
      responseFirstPartTypes: providerErrorMetadata.responseFirstPartTypes ?? null,
      responseFinishReason: providerErrorMetadata.responseFinishReason ?? null,
    });
    const assistantText = buildSeniorAdvisorProviderFallbackMessage(error);
    const exchange = await persistAdvisorExchange({
      assessment,
      conversationId: conversation.id,
      userId: params.userId,
      userMessage: security.sanitizedText,
      assistantMessage: assistantText,
      userStatus: "completed",
      assistantStatus: "failed",
      provider: config.provider,
      model: errorModel,
      estimatedInputTokens: estimateTokensFromChars(inputChars),
      estimatedOutputTokens: estimateTokensFromChars(assistantText.length),
      estimatedCostUsd: 0,
      creditCost: 0,
      safetyFlags: security.safetyFlags,
      referencedContextJson: contextSections,
    });
    const memoryExtraction = await runAdvisorMemoryAutoExtractionSafely({
      userId: params.userId,
      assessment,
      conversationId: conversation.id,
      userMessage: {
        id: exchange.userMessage.id,
        content: exchange.userMessage.content,
        status: exchange.userMessage.status,
      },
      assistantMessage: {
        id: exchange.assistantMessage.id,
        content: exchange.assistantMessage.content,
        status: exchange.assistantMessage.status,
      },
    });
    await recordAiUsageEvent({
      assessmentId: assessment.id,
      userId: params.userId,
      provider: config.provider,
      model: errorModel,
      operationType: SENIOR_ADVISOR_OPERATION_TYPE,
      status: usageStatus,
      durationMs: Date.now() - startedAt,
      inputChars,
      outputChars: assistantText.length,
      errorCategory,
      fallbackUsed: true,
      metadataJson: {
        ...providerErrorMetadata,
        contextReduced: boundedPrompt.reduced,
        ...memoryUsageMetadata,
        ...methodologyUsageMetadata,
        ...buildAdvisorMemoryExtractionUsageMetadata(memoryExtraction),
      },
    });
    await recordAdvisorAuditEvent({
      userId: params.userId,
      assessment,
      eventType: "advisor_message_failed",
      message: "Senior Migration Advisor message failed.",
      metadataJson: {
        ...providerErrorMetadata,
        contextReduced: boundedPrompt.reduced,
        ...methodologyAuditMetadata,
      },
    });
    return {
      ok: true,
      assistantMessage: exchange.assistantMessage,
      usage: usageState.usage,
    };
  }
}

export async function requestMoreAdvisorCredits(params: ActorParams) {
  const assessment = await ensureAssessmentOwnership(params);
  const usageState = await getAdvisorUsageState({
    assessment,
    userId: params.userId,
  });

  await recordAdvisorAuditEvent({
    userId: params.userId,
    assessment,
    eventType: "advisor_credit_request_clicked",
    message: "User requested more Senior Migration Advisor credits.",
    metadataJson: {
      messagesUsed: usageState.usage.messagesUsed,
      messageLimit: usageState.usage.messageLimit,
      plan: usageState.limits.planKey,
    },
  });

  return {
    ok: true,
    message:
      "Advisor credit requests are handled manually for now. Billing integration is not active yet.",
  };
}
