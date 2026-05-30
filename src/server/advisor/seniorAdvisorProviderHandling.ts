export type SeniorAdvisorProviderErrorCategory =
  | "timeout"
  | "provider_error"
  | "invalid_response"
  | "empty_response"
  | "config_missing"
  | "quota_exceeded"
  | "model_unavailable"
  | "safety_blocked";

export type SeniorAdvisorProviderResponseShape = {
  hasTextFunction: boolean;
  hasResponseTextFunction: boolean;
  hasCandidates: boolean;
  hasChoices?: boolean;
  candidateCount: number;
  choiceCount?: number;
  firstCandidateKeys: string[];
  firstChoiceKeys?: string[];
  firstPartTypes: string[];
  finishReason: string | null;
};

export class SeniorAdvisorProviderError extends Error {
  category: SeniorAdvisorProviderErrorCategory;
  provider: string;
  model: string | null;
  httpStatus: number | null;
  providerStatus: string | null;
  safeReason: string;
  responseShape: SeniorAdvisorProviderResponseShape | null;

  constructor(params: {
    message: string;
    category: SeniorAdvisorProviderErrorCategory;
    provider: string;
    model?: string | null;
    httpStatus?: number | null;
    providerStatus?: string | null;
    safeReason?: string | null;
    responseShape?: SeniorAdvisorProviderResponseShape | null;
  }) {
    super(params.message);
    this.name = "SeniorAdvisorProviderError";
    this.category = params.category;
    this.provider = params.provider;
    this.model = params.model ?? null;
    this.httpStatus = params.httpStatus ?? null;
    this.providerStatus = params.providerStatus ?? null;
    this.safeReason = sanitizeProviderReason(params.safeReason ?? params.message);
    this.responseShape = params.responseShape ?? null;
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

function categorizeProviderHttpError(params: {
  status: number;
  providerStatus: string | null;
  safeReason: string;
}) {
  if (/api key|apikey|credential|auth|unauthorized|permission/i.test(params.safeReason)) {
    return "config_missing" as const;
  }

  return categorizeProviderHttpStatus(params.status, params.providerStatus);
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

  const safeReason = providerMessage ?? `HTTP ${params.response.status}`;
  const category = categorizeProviderHttpError({
    status: params.response.status,
    providerStatus,
    safeReason,
  });
  return new SeniorAdvisorProviderError({
    message: `${params.provider} Senior Advisor request failed with status ${params.response.status}.`,
    category,
    provider: params.provider,
    model: params.model,
    httpStatus: params.response.status,
    providerStatus,
    safeReason,
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

function getTextFunctionResult(value: unknown) {
  if (!isRecord(value) || typeof value.text !== "function") return null;
  try {
    const result = value.text();
    return typeof result === "string" ? result.trim() : null;
  } catch {
    return null;
  }
}

function getNestedResponse(value: unknown) {
  return isRecord(value) && isRecord(value.response) ? value.response : null;
}

function getCandidateParts(candidate: Record<string, unknown>) {
  if (!isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) {
    return [];
  }

  return candidate.content.parts;
}

export function describeSeniorAdvisorGeminiResponseShape(value: unknown): SeniorAdvisorProviderResponseShape {
  const response = getNestedResponse(value);
  const source = response ?? value;
  const candidates = isRecord(source) && Array.isArray(source.candidates) ? source.candidates : [];
  const firstCandidate = candidates.find(isRecord) ?? null;
  const parts = firstCandidate ? getCandidateParts(firstCandidate) : [];
  const firstPartTypes = parts
    .filter(isRecord)
    .flatMap((part) => Object.keys(part).sort())
    .filter((key, index, array) => array.indexOf(key) === index)
    .slice(0, 8);

  return {
    hasTextFunction: isRecord(value) && typeof value.text === "function",
    hasResponseTextFunction: Boolean(response && typeof response.text === "function"),
    hasCandidates: candidates.length > 0,
    candidateCount: candidates.length,
    firstCandidateKeys: firstCandidate ? Object.keys(firstCandidate).sort().slice(0, 8) : [],
    firstPartTypes,
    finishReason: firstCandidate ? asString(firstCandidate.finishReason) : null,
  };
}

function throwGeminiInvalidResponse(params: {
  message: string;
  safeReason: string;
  category?: SeniorAdvisorProviderErrorCategory;
  responseShape: SeniorAdvisorProviderResponseShape;
}) {
  throw new SeniorAdvisorProviderError({
    message: params.message,
    category: params.category ?? "invalid_response",
    provider: "gemini",
    safeReason: params.safeReason,
    responseShape: params.responseShape,
  });
}

function extractGeminiTextFromCandidates(params: {
  value: unknown;
  responseShape: SeniorAdvisorProviderResponseShape;
}) {
  const value = params.value;
  if (!isRecord(value)) {
    throwGeminiInvalidResponse({
      message: "Gemini Senior Advisor response was not an object.",
      safeReason: "invalid_response_shape",
      responseShape: params.responseShape,
    });
  }

  const responseValue = value as Record<string, unknown>;

  if (isRecord(responseValue.promptFeedback)) {
    const blockReason = asString(responseValue.promptFeedback.blockReason);
    if (blockReason) {
      throw new SeniorAdvisorProviderError({
        message: "Gemini Senior Advisor prompt was blocked by provider safety controls.",
        category: "safety_blocked",
        provider: "gemini",
        providerStatus: blockReason,
        safeReason: blockReason,
        responseShape: params.responseShape,
      });
    }
  }

  const candidates: unknown[] = Array.isArray(responseValue.candidates) ? responseValue.candidates : [];
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
          responseShape: params.responseShape,
        });
      }
      return getCandidateParts(candidate).map((part) => (isRecord(part) ? asString(part.text) ?? "" : ""));
    })
    .join("\n")
    .trim();

  if (!text) {
    const hasNonTextParts = params.responseShape.firstPartTypes.some((type) => type !== "text");
    throwGeminiInvalidResponse({
      message: "Gemini Senior Advisor response was empty.",
      safeReason: hasNonTextParts ? "non_text_parts_without_text" : "empty_response",
      category: hasNonTextParts ? "invalid_response" : "empty_response",
      responseShape: params.responseShape,
    });
  }

  return text;
}

export function extractSeniorAdvisorGeminiText(value: unknown) {
  const responseShape = describeSeniorAdvisorGeminiResponseShape(value);
  const directText = getTextFunctionResult(value);
  if (directText) return directText;

  const nestedResponse = getNestedResponse(value);
  const nestedText = getTextFunctionResult(nestedResponse);
  if (nestedText) return nestedText;

  if (nestedResponse) {
    return extractGeminiTextFromCandidates({ value: nestedResponse, responseShape });
  }

  return extractGeminiTextFromCandidates({ value, responseShape });
}

export function describeSeniorAdvisorOpenCodeGoResponseShape(value: unknown): SeniorAdvisorProviderResponseShape {
  const choices = isRecord(value) && Array.isArray(value.choices) ? value.choices : [];
  const firstChoice = choices.find(isRecord) ?? null;
  const message = firstChoice && isRecord(firstChoice.message) ? firstChoice.message : null;
  const content = message?.content;
  const firstPartTypes = Array.isArray(content)
    ? content
        .filter(isRecord)
        .flatMap((part) => Object.keys(part).sort())
        .filter((key, index, array) => array.indexOf(key) === index)
        .slice(0, 8)
    : typeof content === "string"
      ? ["text"]
      : [];

  return {
    hasTextFunction: false,
    hasResponseTextFunction: false,
    hasCandidates: false,
    hasChoices: choices.length > 0,
    candidateCount: 0,
    choiceCount: choices.length,
    firstCandidateKeys: [],
    firstChoiceKeys: firstChoice ? Object.keys(firstChoice).sort().slice(0, 8) : [],
    firstPartTypes,
    finishReason: firstChoice ? asString(firstChoice.finish_reason) ?? asString(firstChoice.finishReason) : null,
  };
}

export function extractSeniorAdvisorOpenCodeGoText(value: unknown) {
  const responseShape = describeSeniorAdvisorOpenCodeGoResponseShape(value);
  if (!isRecord(value)) {
    throw new SeniorAdvisorProviderError({
      message: "OpenCode Go Senior Advisor response was not an object.",
      category: "invalid_response",
      provider: "opencode_go",
      safeReason: "invalid_response_shape",
      responseShape,
    });
  }

  const choices = Array.isArray(value.choices) ? value.choices : [];
  const text = choices
    .flatMap((choice) => {
      if (!isRecord(choice) || !isRecord(choice.message)) return [];
      const content = choice.message.content;
      if (typeof content === "string") return [content];
      if (!Array.isArray(content)) return [];
      return content.map((part) => {
        if (!isRecord(part)) return "";
        if (typeof part.text === "string") return part.text;
        if (typeof part.content === "string") return part.content;
        return "";
      });
    })
    .join("\n")
    .trim();

  if (!text) {
    throw new SeniorAdvisorProviderError({
      message: "OpenCode Go Senior Advisor response was empty.",
      category: responseShape.hasChoices ? "empty_response" : "invalid_response",
      provider: "opencode_go",
      safeReason: responseShape.hasChoices ? "empty_response" : "invalid_response_shape",
      responseShape,
    });
  }

  return text;
}

export function getSeniorAdvisorProviderErrorCategory(error: unknown): SeniorAdvisorProviderErrorCategory {
  if (error instanceof SeniorAdvisorProviderError) return error.category;
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  if (error instanceof Error && /empty/i.test(error.message)) return "empty_response";
  if (error instanceof Error && /parse|invalid/i.test(error.message)) return "invalid_response";
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
  responseHasTextFunction: boolean | null;
  responseHasResponseTextFunction: boolean | null;
  responseHasCandidates: boolean | null;
  responseCandidateCount: number | null;
  responseFirstCandidateKeys: string | null;
  responseFirstPartTypes: string | null;
  responseFinishReason: string | null;
} {
  if (error instanceof SeniorAdvisorProviderError) {
    const shape = error.responseShape;
    return {
      reason: error.category,
      provider: error.provider,
      attemptedModel: error.model,
      httpStatus: error.httpStatus,
      providerStatus: error.providerStatus,
      safeReason: error.safeReason,
      responseHasTextFunction: shape?.hasTextFunction ?? null,
      responseHasResponseTextFunction: shape?.hasResponseTextFunction ?? null,
      responseHasCandidates: shape?.hasCandidates ?? null,
      responseCandidateCount: shape?.candidateCount ?? shape?.choiceCount ?? null,
      responseFirstCandidateKeys: (shape?.firstCandidateKeys.length ? shape.firstCandidateKeys : shape?.firstChoiceKeys ?? []).join(",") || null,
      responseFirstPartTypes: shape?.firstPartTypes.join(",") ?? null,
      responseFinishReason: shape?.finishReason ?? null,
    };
  }

  return {
    reason: getSeniorAdvisorProviderErrorCategory(error),
    provider: null,
    attemptedModel: null,
    httpStatus: null,
    providerStatus: null,
    safeReason: null,
    responseHasTextFunction: null,
    responseHasResponseTextFunction: null,
    responseHasCandidates: null,
    responseCandidateCount: null,
    responseFirstCandidateKeys: null,
    responseFirstPartTypes: null,
    responseFinishReason: null,
  };
}

export function buildSeniorAdvisorProviderFallbackMessage(error: unknown) {
  const category = getSeniorAdvisorProviderErrorCategory(error);

  if (category === "model_unavailable") {
    return "Senior Migration Advisor could not use the configured AI model. Deterministic assessment sections remain available while the AI provider configuration is reviewed.";
  }

  if (category === "quota_exceeded") {
    return "Senior Migration Advisor could not answer because the AI provider quota or budget appears to be exhausted. Deterministic assessment sections remain available; retry later or contact an administrator.";
  }

  if (category === "config_missing") {
    return "Senior Migration Advisor is enabled, but the AI provider configuration is not valid for this runtime. Deterministic assessment sections remain available while server-side AI settings are reviewed.";
  }

  if (category === "safety_blocked") {
    return "Senior Migration Advisor could not answer because the provider safety filter blocked the response. Try a narrower, non-sensitive question.";
  }

  if (category === "timeout") {
    return "Senior Migration Advisor timed out before completing this answer. Deterministic assessment sections remain available; retry later or ask a narrower question.";
  }

  if (category === "empty_response") {
    return "Senior Migration Advisor received an empty provider response. Deterministic assessment sections remain available; retry later or ask a narrower question.";
  }

  if (category === "invalid_response") {
    return "Senior Migration Advisor received an empty or unsupported provider response. Deterministic assessment sections remain available; retry later or ask a narrower question.";
  }

  return "Senior Migration Advisor could not complete this answer because the AI provider returned an operational error. Deterministic assessment sections remain available; retry later or ask a narrower question.";
}
