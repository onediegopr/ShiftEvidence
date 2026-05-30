import {
  AssessmentAdvisorMessageRole,
  AssessmentAdvisorMessageStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  getAiAdvisoryProviderKey,
  getEffectiveAiAdvisoryConfig,
} from "../ai/aiAdvisoryConfig";
import type { AiAdvisoryConfig } from "../ai/aiAdvisoryTypes";
import {
  estimateAiCostUsd,
  estimateTokensFromChars,
  recordAiUsageEvent,
  type AiUsageStatus,
} from "../ai/aiUsageService";
import { assertCanUseAi, getEffectiveUserEntitlement } from "../admin/runtimeSettingsService";
import { ensureAssessmentOwnership, type AssessmentDetail } from "../assessments/assessmentService";
import { logger } from "../logging/logger";
import { buildSeniorAdvisorContextPayload, summarizeSeniorAdvisorContextSections } from "./seniorAdvisorContextService";
import {
  buildSeniorAdvisorUsageState,
  resolveSeniorAdvisorPlanLimits,
} from "./seniorAdvisorPlanLimits";
import {
  buildSeniorAdvisorProviderFallbackMessage,
  buildSeniorAdvisorProviderHttpError,
  extractSeniorAdvisorGeminiText,
  getSeniorAdvisorGeminiModelCandidates,
  getSeniorAdvisorProviderErrorCategory,
  getSeniorAdvisorProviderErrorMetadata,
  getSeniorAdvisorProviderErrorModel,
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
};

const MAX_HISTORY_MESSAGES = 50;

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
  }).slice(0, params.maxPromptChars);
  return { prompt, contextUsed: minimalAdvisorContext(params.context), reduced: true };
}

function buildMockAdvisorAnswer(params: {
  context: SeniorAdvisorContextPayload;
  question: string;
}) {
  const question = params.question.toLowerCase();
  const context = params.context;
  const missing = [
    ...context.completion.missingEvidence,
    ...context.licensing.missingEvidence,
    ...context.storage.missingEvidence,
  ].slice(0, 5);
  const topRisks = context.topRisks.slice(0, 3);

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
        ? `Recommended next steps: ${context.completion.nextSteps.slice(0, 4).join("; ")}.`
        : "Recommended next step: review the completion center and fill the highest-impact gaps.",
    ].join("\n\n");
  }

  return [
    `Current assessment status: ${context.completion.completionStatus}, ${context.completion.completionScore}% complete.`,
    topRisks.length > 0
      ? `Top risks: ${topRisks.map((risk) => `${risk.severity} ${risk.title}`).join("; ")}.`
      : "No top risks are available in the advisor context yet.",
    `Readiness score: ${context.scores.readinessScore ?? "not calculated"}; confidence score: ${context.scores.confidenceScore ?? "not calculated"}.`,
    "Use this answer as advisory guidance only. It does not approve production migration or replace the deterministic ShiftReadiness findings.",
  ].join("\n\n");
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

      return { text, durationMs: Date.now() - startedAt, model };
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

  return { text: text.trim(), durationMs: Date.now() - startedAt, model };
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

  return {
    assessmentId: assessment.id,
    conversationId: usageState.conversationId,
    usage: usageState.usage,
    messages: messages.map(mapMessageView),
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
  const assistant = await prisma.$transaction(async (tx) => {
    await tx.assessmentAdvisorMessage.create({
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

    return assistantMessage;
  });

  return mapMessageView(assistant);
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
      metadataJson: { reason: "plan_restricted" },
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
      metadataJson: { reason: "credits_exhausted" },
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
  const context = buildSeniorAdvisorContextPayload(assessment);
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
  });
  const contextSections = summarizeSeniorAdvisorContextSections(boundedPrompt.contextUsed);
  const inputChars = boundedPrompt.prompt.length;

  if (!config.enabled || config.provider === "none" || config.provider === "disabled") {
    const assistantText = "Senior Migration Advisor is currently unavailable because AI is disabled. Deterministic assessment sections remain available.";
    const assistantMessage = await persistAdvisorExchange({
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
      metadataJson: { reason: "ai_disabled", contextReduced: boundedPrompt.reduced },
    });
    await recordAdvisorAuditEvent({
      userId: params.userId,
      assessment,
      eventType: "advisor_message_ai_disabled",
      message: "Senior Migration Advisor message was blocked because AI is disabled.",
      metadataJson: { provider: config.provider, model: config.model },
    });
    return {
      ok: true,
      assistantMessage,
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
    const assistantMessage = await persistAdvisorExchange({
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
      metadataJson: { reason: operationalCheck.code, contextReduced: boundedPrompt.reduced },
    });
    await recordAdvisorAuditEvent({
      userId: params.userId,
      assessment,
      eventType: mapped.eventType,
      message: "Senior Migration Advisor message was blocked by operational controls.",
      metadataJson: { reason: operationalCheck.code },
    });
    return {
      ok: true,
      assistantMessage,
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
      };
    } else {
      const apiKey = getAiAdvisoryProviderKey(config.provider);
      if (!apiKey) {
        const assistantText = "The configured AI provider is missing a server-side API key. Deterministic assessment sections remain available.";
        const assistantMessage = await persistAdvisorExchange({
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
          status: "unavailable",
          durationMs: Date.now() - startedAt,
          inputChars,
          outputChars: assistantText.length,
          errorCategory: "config_missing",
          fallbackUsed: true,
          metadataJson: { reason: "config_missing", contextReduced: boundedPrompt.reduced },
        });
        await recordAdvisorAuditEvent({
          userId: params.userId,
          assessment,
          eventType: "advisor_message_failed",
          message: "Senior Migration Advisor provider configuration is incomplete.",
          metadataJson: { reason: "config_missing" },
        });
        return {
          ok: true,
          assistantMessage,
          usage: usageState.usage,
        };
      }

      providerResult =
        config.provider === "gemini"
          ? await callGeminiProvider({
              config,
              apiKey,
              prompt: boundedPrompt.prompt,
              maxResponseTokens: usageState.limits.maxResponseTokens,
            })
          : await callOpenAiProvider({
              config,
              apiKey,
              prompt: boundedPrompt.prompt,
              maxResponseTokens: usageState.limits.maxResponseTokens,
            });
    }

    const outputText = sanitizeAdvisorResponse(providerResult.text);
    const estimatedInputTokens = estimateTokensFromChars(inputChars);
    const estimatedOutputTokens = estimateTokensFromChars(outputText.length);
    const estimatedCostUsd = estimateAiCostUsd({
      provider: config.provider,
      model: providerResult.model,
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
    });
    const assistantMessage = await persistAdvisorExchange({
      assessment,
      conversationId: conversation.id,
      userId: params.userId,
      userMessage: security.sanitizedText,
      assistantMessage: outputText,
      provider: config.provider,
      model: providerResult.model,
      estimatedInputTokens,
      estimatedOutputTokens,
      estimatedCostUsd,
      creditCost: 1,
      safetyFlags: security.safetyFlags,
      referencedContextJson: contextSections,
    });
    await recordAiUsageEvent({
      assessmentId: assessment.id,
      userId: params.userId,
      provider: config.provider,
      model: providerResult.model,
      operationType: SENIOR_ADVISOR_OPERATION_TYPE,
      status: config.provider === "mock" ? "mock" : "success",
      durationMs: providerResult.durationMs,
      inputChars,
      outputChars: outputText.length,
      fallbackUsed: security.safetyFlags.length > 0 || boundedPrompt.reduced,
      metadataJson: {
        status: config.provider === "mock" ? "mock" : "success",
        contextReduced: boundedPrompt.reduced,
        contextSections: Object.values(contextSections).filter(Boolean).length,
        creditCost: 1,
      },
    });
    await recordAdvisorAuditEvent({
      userId: params.userId,
      assessment,
      eventType: "advisor_message_sent",
      message: "Senior Migration Advisor message completed.",
      metadataJson: {
        provider: config.provider,
        model: providerResult.model,
        creditCost: 1,
      },
    });
    const refreshedUsage = buildSeniorAdvisorUsageState({
      limits: usageState.limits,
      messagesUsed: usageState.usage.messagesUsed + 1,
    });

    return {
      ok: true,
      assistantMessage,
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
    const assistantMessage = await persistAdvisorExchange({
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
      },
    });
    return {
      ok: true,
      assistantMessage,
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
