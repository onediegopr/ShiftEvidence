import { getEffectiveAiAdvisoryConfig, getAiAdvisoryProviderKey } from "./aiAdvisoryConfig";
import { buildAiAdvisoryContextPayload } from "./advisoryContextPayload";
import { buildAiAdvisoryPrompt } from "./aiAdvisoryPrompts";
import type { AssessmentDetail } from "../assessments/assessmentService";
import type {
  AiAdvisoryConfig,
  AiAdvisoryContextPayload,
  AiAdvisoryOutput,
  AiAdvisoryProviderStatus,
} from "./aiAdvisoryTypes";
import { recordAiRuntimeEvent, type AiRuntimeErrorCategory } from "./aiRuntimeStatus";
import { recordAiUsageEvent, type AiUsageOperationType } from "./aiUsageService";
import { assertCanUseAi } from "../admin/runtimeSettingsService";


type AiInputReductionStrategy = "moderate" | "strong" | "minimal" | "emergency";

type AiInputReductionMetadata = {
  truncated: boolean;
  strategy: AiInputReductionStrategy;
  originalCounts: {
    riskFindings: number;
    manualAnswers: number;
    coverageSections: number;
    importantContext: number;
    missingContext: number;
    evidenceReceived: number;
    evidenceMissing: number;
    mismatchWarnings: number;
  };
  severityCounts: Record<string, number>;
};

type ReducedAiAdvisoryContextPayload = AiAdvisoryContextPayload & {
  inputReduction?: AiInputReductionMetadata;
};

function emptyOutput(config: AiAdvisoryConfig, providerStatus: AiAdvisoryProviderStatus): AiAdvisoryOutput {
  return {
    executiveSummaryNotes: [],
    technicalNotes: [],
    missingContextQuestions: [],
    confidenceImpact:
      providerStatus === "disabled"
        ? "AI advisory is disabled by configuration. Deterministic report sections remain available."
        : "AI advisory is unavailable. Deterministic report sections remain available.",
    recommendedNextActions: [],
    limitations: ["AI advisory is an optional layer and does not replace deterministic readiness/confidence scoring."],
    providerStatus,
    generatedAt: new Date().toISOString(),
    provider: config.provider,
    model: config.model,
  };
}

function truncateTextForAiInput(value: string | null, maxChars: number) {
  if (!value || value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, maxChars)}...`;
}

function getInputReductionMetadata(
  payload: AiAdvisoryContextPayload,
  strategy: AiInputReductionStrategy,
): AiInputReductionMetadata {
  const severityCounts = payload.riskFindings.reduce<Record<string, number>>((counts, finding) => {
    counts[finding.severity] = (counts[finding.severity] ?? 0) + 1;
    return counts;
  }, {});

  return {
    truncated: true,
    strategy,
    originalCounts: {
      riskFindings: payload.riskFindings.length,
      manualAnswers: payload.manualMigrationContext.answers.length,
      coverageSections: payload.manualMigrationContext.coverage.sections.length,
      importantContext: payload.manualMigrationContext.importantContext.length,
      missingContext: payload.manualMigrationContext.missingContext.length,
      evidenceReceived: payload.evidenceReceived.length,
      evidenceMissing: payload.evidenceMissing.length,
      mismatchWarnings: payload.assumptions.mismatchWarnings.length,
    },
    severityCounts,
  };
}

function compactRiskFindings(payload: AiAdvisoryContextPayload, count: number, textLimit: number) {
  return payload.riskFindings.slice(0, count).map((finding) => ({
    ...finding,
    entityName: truncateTextForAiInput(finding.entityName, 80),
    title: truncateTextForAiInput(finding.title, textLimit) ?? "",
    description: truncateTextForAiInput(finding.description, textLimit) ?? "",
    recommendation: truncateTextForAiInput(finding.recommendation, textLimit),
  }));
}

function compactManualAnswers(payload: AiAdvisoryContextPayload, count: number, textLimit: number) {
  return payload.manualMigrationContext.answers.slice(0, count).map((answer) => ({
    ...answer,
    question: truncateTextForAiInput(answer.question, 140) ?? "",
    value: Array.isArray(answer.value)
      ? answer.value.slice(0, 4).map((item) => truncateTextForAiInput(item, textLimit) ?? "")
      : truncateTextForAiInput(answer.value, textLimit),
  }));
}

function reduceAiInputPayload(
  payload: AiAdvisoryContextPayload,
  strategy: Exclude<AiInputReductionStrategy, "emergency">,
): ReducedAiAdvisoryContextPayload {
  if (strategy === "moderate") {
    return {
      ...payload,
      inputReduction: getInputReductionMetadata(payload, strategy),
      riskFindings: compactRiskFindings(payload, 15, 320),
      manualMigrationContext: {
        ...payload.manualMigrationContext,
        coverage: {
          ...payload.manualMigrationContext.coverage,
          missingKeyContext: payload.manualMigrationContext.coverage.missingKeyContext.slice(0, 12),
          sections: payload.manualMigrationContext.coverage.sections.slice(0, 10).map((section) => ({
            ...section,
            missing: section.missing.slice(0, 8),
          })),
        },
        importantContext: payload.manualMigrationContext.importantContext.slice(0, 14),
        missingContext: payload.manualMigrationContext.missingContext.slice(0, 14),
        answers: compactManualAnswers(payload, 20, 220),
      },
      assumptions: {
        ...payload.assumptions,
        mismatchWarnings: payload.assumptions.mismatchWarnings.slice(0, 8),
      },
      evidenceReceived: payload.evidenceReceived.slice(0, 10),
      evidenceMissing: payload.evidenceMissing.slice(0, 14),
    };
  }

  if (strategy === "strong") {
    return {
      ...payload,
      inputReduction: getInputReductionMetadata(payload, strategy),
      riskFindings: compactRiskFindings(payload, 7, 180),
      manualMigrationContext: {
        ...payload.manualMigrationContext,
        coverage: {
          ...payload.manualMigrationContext.coverage,
          missingKeyContext: payload.manualMigrationContext.coverage.missingKeyContext.slice(0, 6),
          sections: payload.manualMigrationContext.coverage.sections.slice(0, 4).map((section) => ({
            ...section,
            missing: section.missing.slice(0, 4),
          })),
        },
        importantContext: payload.manualMigrationContext.importantContext.slice(0, 6),
        missingContext: payload.manualMigrationContext.missingContext.slice(0, 8),
        answers: compactManualAnswers(payload, 5, 120),
      },
      assumptions: {
        ...payload.assumptions,
        mismatchWarnings: payload.assumptions.mismatchWarnings.slice(0, 4),
      },
      evidenceReceived: payload.evidenceReceived.slice(0, 4),
      evidenceMissing: payload.evidenceMissing.slice(0, 8),
      excluded: payload.excluded.slice(0, 5),
    };
  }

  return {
    ...payload,
    inputReduction: getInputReductionMetadata(payload, strategy),
    riskFindings: compactRiskFindings(payload, 3, 120),
    manualMigrationContext: {
      coverage: {
        overallPercent: payload.manualMigrationContext.coverage.overallPercent,
        status: payload.manualMigrationContext.coverage.status,
        missingKeyContext: payload.manualMigrationContext.coverage.missingKeyContext.slice(0, 4),
        sections: [],
      },
      statusCounts: payload.manualMigrationContext.statusCounts,
      importantContext: payload.manualMigrationContext.importantContext.slice(0, 3),
      missingContext: payload.manualMigrationContext.missingContext.slice(0, 5),
      answers: [],
    },
    assumptions: {
      ...payload.assumptions,
      mismatchWarnings: payload.assumptions.mismatchWarnings.slice(0, 2),
    },
    evidenceReceived: payload.evidenceReceived.slice(0, 2),
    evidenceMissing: payload.evidenceMissing.slice(0, 5),
    excluded: [
      "raw files",
      "secrets",
      "tokens",
      "storage paths",
    ],
  };
}

function buildEmergencyAiInput(payload: AiAdvisoryContextPayload) {
  return {
    assessment: payload.assessment,
    rvtoolsSummary: payload.rvtoolsSummary,
    scores: payload.scores,
    inputReduction: getInputReductionMetadata(payload, "emergency"),
    riskSummary: {
      topFindings: compactRiskFindings(payload, 2, 80),
      evidenceMissing: payload.evidenceMissing.slice(0, 3),
      contextCoverage: {
        overallPercent: payload.manualMigrationContext.coverage.overallPercent,
        status: payload.manualMigrationContext.coverage.status,
      },
    },
  };
}

function buildSafeJsonInput(payload: AiAdvisoryContextPayload, maxInputChars: number) {
  const maxChars = Math.max(2, maxInputChars);
  const candidates: unknown[] = [
    payload,
    reduceAiInputPayload(payload, "moderate"),
    reduceAiInputPayload(payload, "strong"),
    reduceAiInputPayload(payload, "minimal"),
    buildEmergencyAiInput(payload),
  ];

  for (const candidate of candidates) {
    const json = JSON.stringify(candidate);
    if (json.length <= maxChars) {
      return json;
    }
  }

  return "{}";
}

function normalizeStringList(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeProviderJson(value: unknown, fallback: AiAdvisoryOutput): AiAdvisoryOutput {
  if (typeof value !== "object" || value === null) {
    return fallback;
  }

  const root = value as Record<string, unknown>;
  const questions = Array.isArray(root.missingContextQuestions)
    ? root.missingContextQuestions
        .map((item) => {
          if (typeof item !== "object" || item === null) {
            return null;
          }
          const question = item as Record<string, unknown>;
          const priority = question.priority === "high" || question.priority === "medium" || question.priority === "low"
            ? question.priority
            : "medium";
          return {
            question: typeof question.question === "string" ? question.question.trim() : "",
            whyItMatters: typeof question.whyItMatters === "string" ? question.whyItMatters.trim() : "",
            priority,
          } satisfies AiAdvisoryOutput["missingContextQuestions"][number];
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item?.question && item.whyItMatters))
        .slice(0, 10)
    : [];

  return {
    ...fallback,
    executiveSummaryNotes: normalizeStringList(root.executiveSummaryNotes, fallback.executiveSummaryNotes),
    technicalNotes: normalizeStringList(root.technicalNotes, fallback.technicalNotes),
    missingContextQuestions: questions,
    confidenceImpact:
      typeof root.confidenceImpact === "string" && root.confidenceImpact.trim()
        ? root.confidenceImpact.trim()
        : fallback.confidenceImpact,
    recommendedNextActions: normalizeStringList(root.recommendedNextActions, fallback.recommendedNextActions),
    limitations: normalizeStringList(root.limitations, fallback.limitations),
  };
}

function parseJsonText(text: string): unknown | null {
  try {
    const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function parseProviderJsonText(text: string) {
  const parsed = parseJsonText(text);
  if (parsed === null) {
    throw new Error("AI advisory invalid JSON response.");
  }

  return parsed;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function getErrorCategory(error: unknown): AiRuntimeErrorCategory {
  if (error instanceof Error && error.name === "AbortError") {
    return "timeout";
  }

  if (error instanceof Error && /empty|json|parse|invalid/i.test(error.message)) {
    return "invalid_response";
  }

  return "provider_error";
}

function priorityFromIndex(index: number): "high" | "medium" | "low" {
  if (index < 3) return "high";
  if (index < 6) return "medium";
  return "low";
}

function buildMockAdvisory(payload: AiAdvisoryContextPayload, config: AiAdvisoryConfig): AiAdvisoryOutput {
  const topFindings = payload.riskFindings.slice(0, 3);
  const missingContext = payload.manualMigrationContext.missingContext.slice(0, 7);
  const missingEvidence = payload.evidenceMissing.slice(0, 5);
  const vmCount = payload.rvtoolsSummary?.vmCount ?? null;
  const coverage = payload.manualMigrationContext.coverage;

  return {
    executiveSummaryNotes: [
      `Advisory mode is running with sanitized ${config.provider} provider output. Treat this as guidance, not as a deterministic score.`,
      vmCount === null
        ? "No parsed RVTools VM summary is available yet, so migration scale should remain preliminary."
        : `The current sanitized inventory basis includes ${vmCount} VMs and ${payload.rvtoolsSummary?.hostCount ?? 0} hosts.`,
      `Migration context coverage is ${coverage.overallPercent}% (${coverage.status}); missing context should be handled as evidence gaps.`,
    ],
    technicalNotes:
      topFindings.length > 0
        ? topFindings.map((finding) => `${finding.severity.toUpperCase()}: ${finding.title}. Validate before production wave planning.`)
        : ["No high-priority risk findings are available in the sanitized advisory payload yet."],
    missingContextQuestions: missingContext.slice(0, 7).map((item, index) => ({
      question: item.replace(" was not provided or was marked unknown/skipped.", "?"),
      whyItMatters: "This missing context can change confidence, migration sequencing or rollback planning.",
      priority: priorityFromIndex(index),
    })),
    confidenceImpact:
      coverage.status === "strong"
        ? "Context is strong enough to support advisory quality, but deterministic scores remain the source of truth."
        : "Context gaps limit advisory quality. Do not treat AI notes as confirmed evidence.",
    recommendedNextActions: [
      ...missingEvidence.map((item) => `Collect or confirm: ${item}`),
      "Review backup/restore proof before scheduling production workloads.",
      "Confirm application owners and maintenance windows for critical systems.",
    ].slice(0, 7),
    limitations: [
      "No raw RVTools files, storage paths, cookies, tokens or secrets are included.",
      "AI advisory does not replace readiness score, evidence confidence score or internal risk findings.",
      "Missing evidence is not inferred. It remains explicitly marked as missing.",
    ],
    providerStatus: "mock",
    generatedAt: new Date().toISOString(),
    provider: config.provider,
    model: config.model,
  };
}

async function callGeminiProvider(params: {
  config: AiAdvisoryConfig;
  apiKey: string;
  prompt: string;
  fallback: AiAdvisoryOutput;
}) {
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
        contents: [
          {
            role: "user",
            parts: [{ text: params.prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: Math.max(256, Math.min(params.config.maxOutputChars, 8192)),
          temperature: 0.2,
        },
      }),
    },
    params.config.timeoutMs,
  );

  if (!response.ok) {
    throw new Error(`Gemini advisory request failed with status ${response.status}.`);
  }

  const json = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n").trim();
  if (!text) {
    throw new Error("Gemini advisory response was empty.");
  }

  return normalizeProviderJson(parseProviderJsonText(text), params.fallback);
}

async function callOpenAiProvider(params: {
  config: AiAdvisoryConfig;
  apiKey: string;
  prompt: string;
  fallback: AiAdvisoryOutput;
}) {
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
        text: {
          format: {
            type: "json_schema",
            name: "shiftreadiness_ai_advisory",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                executiveSummaryNotes: { type: "array", items: { type: "string" } },
                technicalNotes: { type: "array", items: { type: "string" } },
                missingContextQuestions: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      question: { type: "string" },
                      whyItMatters: { type: "string" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                    },
                    required: ["question", "whyItMatters", "priority"],
                  },
                },
                confidenceImpact: { type: "string" },
                recommendedNextActions: { type: "array", items: { type: "string" } },
                limitations: { type: "array", items: { type: "string" } },
              },
              required: [
                "executiveSummaryNotes",
                "technicalNotes",
                "missingContextQuestions",
                "confidenceImpact",
                "recommendedNextActions",
                "limitations",
              ],
            },
          },
        },
      }),
    },
    params.config.timeoutMs,
  );

  if (!response.ok) {
    throw new Error(`OpenAI advisory request failed with status ${response.status}.`);
  }

  const json = (await response.json()) as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        text?: string;
      }>;
    }>;
  };
  const text = json.output_text ?? json.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("\n");
  if (!text?.trim()) {
    throw new Error("OpenAI advisory response was empty.");
  }

  return normalizeProviderJson(parseProviderJsonText(text), params.fallback);
}

export async function generateAiAdvisoryFromPayload(
  payload: AiAdvisoryContextPayload,
  safeAssessmentId = "synthetic-ai-advisory",
  options: {
    userId?: string | null;
    operationType?: AiUsageOperationType;
  } = {},
): Promise<AiAdvisoryOutput> {
  const config = await getEffectiveAiAdvisoryConfig();
  const startedAt = Date.now();
  const inputJson = buildSafeJsonInput(payload, config.maxInputChars);
  const operationType = options.operationType ?? "unknown";

  recordAiRuntimeEvent({
    eventType: "ai_advisory_requested",
    provider: config.provider,
    model: config.model,
    assessmentId: safeAssessmentId,
    status: "unknown",
    errorCategory: "none",
  });

  if (!config.enabled || config.provider === "none" || config.provider === "disabled") {
    const output = emptyOutput(config, "disabled");
    recordAiRuntimeEvent({
      eventType: "ai_advisory_fallback_used",
      provider: config.provider,
      model: config.model,
      assessmentId: safeAssessmentId,
      durationMs: Date.now() - startedAt,
      status: "disabled",
      errorCategory: "none",
    });
    await recordAiUsageEvent({
      assessmentId: safeAssessmentId,
      userId: options.userId,
      provider: config.provider,
      model: config.model,
      operationType,
      status: "disabled",
      durationMs: Date.now() - startedAt,
      inputChars: inputJson.length,
      outputChars: JSON.stringify(output).length,
      fallbackUsed: true,
      metadataJson: { reason: "disabled" },
    });
    return output;
  }

  const operationalCheck = await assertCanUseAi({
    userId: options.userId,
    assessmentId: safeAssessmentId,
    provider: config.provider,
    model: config.model,
    inputChars: inputJson.length,
    outputChars: 0,
  });

  if (!operationalCheck.allowed) {
    const output = {
      ...emptyOutput(config, "disabled"),
      confidenceImpact: operationalCheck.message,
      limitations: [
        operationalCheck.message,
        "Las secciones deterministicas del reporte siguen disponibles.",
        "AI Advisory es una capa opcional y no reemplaza readiness/confidence.",
      ],
    };
    const status =
      operationalCheck.code === "blocked_budget"
        ? "blocked_budget"
        : operationalCheck.code === "disabled_runtime"
          ? "disabled_runtime"
          : "blocked_limit";
    recordAiRuntimeEvent({
      eventType: "ai_advisory_fallback_used",
      provider: config.provider,
      model: config.model,
      assessmentId: safeAssessmentId,
      durationMs: Date.now() - startedAt,
      status: "disabled",
      errorCategory: "none",
    });
    await recordAiUsageEvent({
      assessmentId: safeAssessmentId,
      userId: options.userId,
      provider: config.provider,
      model: config.model,
      operationType,
      status,
      durationMs: Date.now() - startedAt,
      inputChars: inputJson.length,
      outputChars: JSON.stringify(output).length,
      fallbackUsed: true,
      metadataJson: { reason: operationalCheck.code },
    });
    return output;
  }

  try {
    if (config.provider === "mock") {
      const output = buildMockAdvisory(payload, config);
      recordAiRuntimeEvent({
        eventType: "ai_advisory_success",
        provider: config.provider,
        model: config.model,
        assessmentId: safeAssessmentId,
        durationMs: Date.now() - startedAt,
        status: "mock",
        errorCategory: "none",
      });
      await recordAiUsageEvent({
        assessmentId: safeAssessmentId,
        userId: options.userId,
        provider: config.provider,
        model: config.model,
        operationType,
        status: "mock",
        durationMs: Date.now() - startedAt,
        inputChars: inputJson.length,
        outputChars: JSON.stringify(output).length,
      });
      return output;
    }

    const apiKey = getAiAdvisoryProviderKey(config.provider);
    if (!apiKey) {
      const output = {
        ...emptyOutput(config, "unavailable"),
        limitations: [
          `AI provider ${config.provider} is enabled but no server-side API key is configured.`,
          "Deterministic report sections remain available.",
        ],
      };
      recordAiRuntimeEvent({
        eventType: "ai_advisory_fallback_used",
        provider: config.provider,
        model: config.model,
        assessmentId: safeAssessmentId,
        durationMs: Date.now() - startedAt,
        status: "unavailable",
        errorCategory: "config_missing",
      });
      await recordAiUsageEvent({
        assessmentId: safeAssessmentId,
        userId: options.userId,
        provider: config.provider,
        model: config.model,
        operationType,
        status: "unavailable",
        durationMs: Date.now() - startedAt,
        inputChars: inputJson.length,
        outputChars: JSON.stringify(output).length,
        errorCategory: "config_missing",
        fallbackUsed: true,
        metadataJson: { reason: "config_missing" },
      });
      return output;
    }

    const fallback = buildMockAdvisory(payload, {
      ...config,
      provider: "mock",
    });
    const prompt = buildAiAdvisoryPrompt(inputJson);
    const output = config.provider === "gemini"
      ? await callGeminiProvider({ config, apiKey, prompt, fallback })
      : await callOpenAiProvider({ config, apiKey, prompt, fallback });

    recordAiRuntimeEvent({
      eventType: "ai_advisory_success",
      provider: config.provider,
      model: config.model,
      assessmentId: safeAssessmentId,
      durationMs: Date.now() - startedAt,
      status: "success",
      errorCategory: "none",
    });

    const finalOutput: AiAdvisoryOutput = {
      ...output,
      providerStatus: "success",
      generatedAt: new Date().toISOString(),
      provider: config.provider,
      model: config.model,
      limitations: [
        ...output.limitations,
        "AI advisory is generated from sanitized metadata and is not a deterministic readiness score.",
      ].slice(0, 8),
    };
    await recordAiUsageEvent({
      assessmentId: safeAssessmentId,
      userId: options.userId,
      provider: config.provider,
      model: config.model,
      operationType,
      status: "success",
      durationMs: Date.now() - startedAt,
      inputChars: inputJson.length,
      outputChars: JSON.stringify(finalOutput).length,
    });

    return finalOutput;
  } catch (error) {
    const errorCategory = getErrorCategory(error);
    const status = errorCategory === "timeout" ? "timeout" : "error";
    recordAiRuntimeEvent({
      eventType: errorCategory === "timeout" ? "ai_advisory_timeout" : "ai_advisory_failed",
      provider: config.provider,
      model: config.model,
      assessmentId: safeAssessmentId,
      durationMs: Date.now() - startedAt,
      status,
      errorCategory,
    });
    recordAiRuntimeEvent({
      eventType: "ai_advisory_fallback_used",
      provider: config.provider,
      model: config.model,
      assessmentId: safeAssessmentId,
      durationMs: Date.now() - startedAt,
      status,
      errorCategory,
    });
    const output = emptyOutput(config, "error");
    await recordAiUsageEvent({
      assessmentId: safeAssessmentId,
      userId: options.userId,
      provider: config.provider,
      model: config.model,
      operationType,
      status,
      durationMs: Date.now() - startedAt,
      inputChars: inputJson.length,
      outputChars: JSON.stringify(output).length,
      errorCategory,
      fallbackUsed: true,
      metadataJson: { reason: errorCategory },
    });
    return output;
  }
}

export async function generateAiAdvisory(
  assessment: AssessmentDetail,
  options: {
    userId?: string | null;
    operationType?: AiUsageOperationType;
  } = {},
): Promise<AiAdvisoryOutput> {
  return generateAiAdvisoryFromPayload(buildAiAdvisoryContextPayload(assessment), assessment.id, {
    userId: options.userId ?? assessment.workspace.ownerUserId,
    operationType: options.operationType ?? "preview",
  });
}
