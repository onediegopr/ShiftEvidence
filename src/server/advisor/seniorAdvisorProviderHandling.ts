export type SeniorAdvisorProviderErrorCategory =
  | "timeout"
  | "provider_error"
  | "invalid_response"
  | "config_missing"
  | "quota_exceeded"
  | "model_unavailable"
  | "safety_blocked";

export class SeniorAdvisorProviderError extends Error {
  category: SeniorAdvisorProviderErrorCategory;
  provider: string;
  model: string | null;
  httpStatus: number | null;
  providerStatus: string | null;
  safeReason: string;

  constructor(params: {
    message: string;
    category: SeniorAdvisorProviderErrorCategory;
    provider: string;
    model?: string | null;
    httpStatus?: number | null;
    providerStatus?: string | null;
    safeReason?: string | null;
  }) {
    super(params.message);
    this.name = "SeniorAdvisorProviderError";
    this.category = params.category;
    this.provider = params.provider;
    this.model = params.model ?? null;
    this.httpStatus = params.httpStatus ?? null;
    this.providerStatus = params.providerStatus ?? null;
    this.safeReason = sanitizeProviderReason(params.safeReason ?? params.message);
  }
}

function sanitizeProviderReason(value: string) {
  return value
    .replace(/[A-Za-z0-9_-]{24,}/g, "[redacted]")
    .replace(/AIza[0-9A-Za-z_-]+/g, "[redacted]")
    .slice(0, 180);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function categorizeProviderHttpStatus(status: number, providerStatus: string | null) {
  if (status === 401 || status === 403) return "config_missing" as const;
  if (status === 404 || providerStatus === "NOT_FOUND") return "model_unavailable" as const;
  if (status === 429 || providerStatus === "RESOURCE_EXHAUSTED") return "quota_exceeded" as const;
  if (status === 400 || providerStatus === "INVALID_ARGUMENT") return "invalid_response" as const;
  return "provider_error" as const;
}

export async function buildSeniorAdvisorProviderHttpError(params: {
  response: Response;
  provider: string;
  model: string | null;
}) {
  let providerStatus: string | null = null;
  let providerMessage = `HTTP ${params.response.status}`;

  try {
    const raw = await params.response.text();
    const parsed = JSON.parse(raw) as unknown;
    if (isRecord(parsed) && isRecord(parsed.error)) {
      providerStatus = asString(parsed.error.status);
      providerMessage = asString(parsed.error.message) ?? providerMessage;
    } else {
      providerMessage = sanitizeProviderReason(raw);
    }
  } catch {
    // Keep the safe default HTTP status message.
  }

  const category = categorizeProviderHttpStatus(params.response.status, providerStatus);
  return new SeniorAdvisorProviderError({
    message: `${params.provider} Senior Advisor request failed with status ${params.response.status}.`,
    category,
    provider: params.provider,
    model: params.model,
    httpStatus: params.response.status,
    providerStatus,
    safeReason: providerMessage ?? `HTTP ${params.response.status}`,
  });
}

export function getSeniorAdvisorGeminiModelCandidates(model: string | null | undefined) {
  const configuredModel = model?.trim() || "gemini-2.5-flash";
  const candidates = [configuredModel];

  if (/^gemini-1\.5-/i.test(configuredModel)) {
    candidates.push("gemini-2.5-flash");
  }

  return Array.from(new Set(candidates));
}

export function extractSeniorAdvisorGeminiText(value: unknown) {
  if (!isRecord(value)) {
    throw new SeniorAdvisorProviderError({
      message: "Gemini Senior Advisor response was not an object.",
      category: "invalid_response",
      provider: "gemini",
      safeReason: "invalid_response_shape",
    });
  }

  if (isRecord(value.promptFeedback)) {
    const blockReason = asString(value.promptFeedback.blockReason);
    if (blockReason) {
      throw new SeniorAdvisorProviderError({
        message: "Gemini Senior Advisor prompt was blocked by provider safety controls.",
        category: "safety_blocked",
        provider: "gemini",
        providerStatus: blockReason,
        safeReason: blockReason,
      });
    }
  }

  const candidates = Array.isArray(value.candidates) ? value.candidates : [];
  const text = candidates
    .flatMap((candidate) => {
      if (!isRecord(candidate)) return [];
      if (asString(candidate.finishReason) === "SAFETY") {
        throw new SeniorAdvisorProviderError({
          message: "Gemini Senior Advisor candidate was blocked by provider safety controls.",
          category: "safety_blocked",
          provider: "gemini",
          providerStatus: "SAFETY",
          safeReason: "SAFETY",
        });
      }
      if (!isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) return [];
      return candidate.content.parts.map((part) => (isRecord(part) ? asString(part.text) ?? "" : ""));
    })
    .join("\n")
    .trim();

  if (!text) {
    throw new SeniorAdvisorProviderError({
      message: "Gemini Senior Advisor response was empty.",
      category: "invalid_response",
      provider: "gemini",
      safeReason: "empty_response",
    });
  }

  return text;
}

export function getSeniorAdvisorProviderErrorCategory(error: unknown): SeniorAdvisorProviderErrorCategory {
  if (error instanceof SeniorAdvisorProviderError) return error.category;
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  if (error instanceof Error && /empty|parse|invalid/i.test(error.message)) return "invalid_response";
  return "provider_error";
}

export function getSeniorAdvisorProviderErrorModel(error: unknown) {
  return error instanceof SeniorAdvisorProviderError ? error.model : null;
}

export function getSeniorAdvisorProviderErrorMetadata(error: unknown): {
  reason: SeniorAdvisorProviderErrorCategory;
  provider: string | null;
  attemptedModel: string | null;
  httpStatus: number | null;
  providerStatus: string | null;
  safeReason: string | null;
} {
  if (error instanceof SeniorAdvisorProviderError) {
    return {
      reason: error.category,
      provider: error.provider,
      attemptedModel: error.model,
      httpStatus: error.httpStatus,
      providerStatus: error.providerStatus,
      safeReason: error.safeReason,
    };
  }

  return {
    reason: getSeniorAdvisorProviderErrorCategory(error),
    provider: null,
    attemptedModel: null,
    httpStatus: null,
    providerStatus: null,
    safeReason: null,
  };
}

export function buildSeniorAdvisorProviderFallbackMessage(error: unknown) {
  const category = getSeniorAdvisorProviderErrorCategory(error);

  if (category === "model_unavailable") {
    return "Senior Migration Advisor could not reach the configured AI model. Deterministic assessment sections remain available; ask an administrator to confirm the Advisor model configuration or retry after the runtime updates.";
  }

  if (category === "quota_exceeded") {
    return "Senior Migration Advisor is temporarily limited by the AI provider quota or rate limit. Deterministic assessment sections remain available; retry later or contact an administrator.";
  }

  if (category === "config_missing") {
    return "Senior Migration Advisor is enabled, but the AI provider configuration is not available to this runtime. Deterministic assessment sections remain available; ask an administrator to verify server-side AI settings.";
  }

  if (category === "safety_blocked") {
    return "Senior Migration Advisor could not answer because the AI provider blocked the request. Deterministic assessment sections remain available; retry with a narrower, non-sensitive question.";
  }

  if (category === "timeout") {
    return "Senior Migration Advisor timed out before completing this answer. Deterministic assessment sections remain available; retry later or ask a narrower question.";
  }

  if (category === "invalid_response") {
    return "Senior Migration Advisor received an unusable provider response. Deterministic assessment sections remain available; retry later or ask a narrower question.";
  }

  return "Senior Migration Advisor could not complete this answer because the AI provider returned an operational error. Deterministic assessment sections remain available; retry later or ask a narrower question.";
}
