import { getAiAdvisoryConfig, getAiAdvisoryProviderKey } from "./aiAdvisoryConfig";
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

type AiProviderJson = Omit<AiAdvisoryOutput, "providerStatus" | "generatedAt" | "provider" | "model">;

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

function truncateJsonInput(payload: AiAdvisoryContextPayload, maxInputChars: number) {
  const json = JSON.stringify(payload);
  if (json.length <= maxInputChars) {
    return json;
  }

  return `${json.slice(0, maxInputChars)}...[TRUNCATED]`;
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

function parseJsonText(text: string) {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(trimmed) as AiProviderJson;
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

  return normalizeProviderJson(parseJsonText(text), params.fallback);
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

  return normalizeProviderJson(parseJsonText(text), params.fallback);
}

export async function generateAiAdvisoryFromPayload(
  payload: AiAdvisoryContextPayload,
  safeAssessmentId = "synthetic-ai-advisory",
): Promise<AiAdvisoryOutput> {
  const config = getAiAdvisoryConfig();
  const startedAt = Date.now();

  recordAiRuntimeEvent({
    eventType: "ai_advisory_requested",
    provider: config.provider,
    model: config.model,
    assessmentId: safeAssessmentId,
    status: "unknown",
    errorCategory: "none",
  });

  if (!config.enabled || config.provider === "none" || config.provider === "disabled") {
    recordAiRuntimeEvent({
      eventType: "ai_advisory_fallback_used",
      provider: config.provider,
      model: config.model,
      assessmentId: safeAssessmentId,
      durationMs: Date.now() - startedAt,
      status: "disabled",
      errorCategory: "none",
    });
    return emptyOutput(config, "disabled");
  }

  try {
    if (config.provider === "mock") {
      recordAiRuntimeEvent({
        eventType: "ai_advisory_success",
        provider: config.provider,
        model: config.model,
        assessmentId: safeAssessmentId,
        durationMs: Date.now() - startedAt,
        status: "mock",
        errorCategory: "none",
      });
      return buildMockAdvisory(payload, config);
    }

    const apiKey = getAiAdvisoryProviderKey(config.provider);
    if (!apiKey) {
      recordAiRuntimeEvent({
        eventType: "ai_advisory_fallback_used",
        provider: config.provider,
        model: config.model,
        assessmentId: safeAssessmentId,
        durationMs: Date.now() - startedAt,
        status: "unavailable",
        errorCategory: "config_missing",
      });
      return {
        ...emptyOutput(config, "unavailable"),
        limitations: [
          `AI provider ${config.provider} is enabled but no server-side API key is configured.`,
          "Deterministic report sections remain available.",
        ],
      };
    }

    const fallback = buildMockAdvisory(payload, {
      ...config,
      provider: "mock",
    });
    const prompt = buildAiAdvisoryPrompt(truncateJsonInput(payload, config.maxInputChars));
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

    return {
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
  } catch (error) {
    const errorCategory = getErrorCategory(error);
    recordAiRuntimeEvent({
      eventType: errorCategory === "timeout" ? "ai_advisory_timeout" : "ai_advisory_failed",
      provider: config.provider,
      model: config.model,
      assessmentId: safeAssessmentId,
      durationMs: Date.now() - startedAt,
      status: errorCategory === "timeout" ? "timeout" : "error",
      errorCategory,
    });
    recordAiRuntimeEvent({
      eventType: "ai_advisory_fallback_used",
      provider: config.provider,
      model: config.model,
      assessmentId: safeAssessmentId,
      durationMs: Date.now() - startedAt,
      status: errorCategory === "timeout" ? "timeout" : "error",
      errorCategory,
    });
    return emptyOutput(config, "error");
  }
}

export async function generateAiAdvisory(assessment: AssessmentDetail): Promise<AiAdvisoryOutput> {
  return generateAiAdvisoryFromPayload(buildAiAdvisoryContextPayload(assessment), assessment.id);
}
