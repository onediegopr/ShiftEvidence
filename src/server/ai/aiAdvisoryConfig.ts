import type { AiAdvisoryConfig, AiAdvisoryProvider } from "./aiAdvisoryTypes";
import { getOperationalRuntimeSettings } from "../admin/runtimeSettingsService";

export const OPENCODE_GO_DEFAULT_BASE_URL = "https://opencode.ai/zen/go/v1/chat/completions";
export const OPENCODE_GO_DEFAULT_MODEL = "glm-5.1";

function parseBoolean(value: string | undefined) {
  return value === "true" || value === "1" || value === "yes";
}

function parsePositiveInteger(value: string | undefined, fallback: number, max: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function parseProvider(value: string | undefined, fallback: AiAdvisoryProvider): AiAdvisoryProvider {
  if (
    value === "mock" ||
    value === "gemini" ||
    value === "opencode_go" ||
    value === "openai" ||
    value === "none" ||
    value === "disabled"
  ) {
    return value;
  }

  return fallback;
}

function defaultModelForProvider(provider: AiAdvisoryProvider) {
  if (provider === "gemini") return "gemini-2.5-flash";
  if (provider === "opencode_go") return OPENCODE_GO_DEFAULT_MODEL;
  if (provider === "openai") return "gpt-5.1-mini";
  return null;
}

export function getAiAdvisoryProviderKey(provider: AiAdvisoryProvider) {
  if (provider === "gemini") {
    return process.env.GEMINI_API_KEY?.trim() || null;
  }

  if (provider === "openai") {
    return process.env.OPENAI_API_KEY?.trim() || null;
  }

  if (provider === "opencode_go") {
    return process.env.OPENCODE_API_KEY?.trim() || null;
  }

  return null;
}

export function getOpenCodeGoBaseUrl() {
  return process.env.OPENCODE_GO_BASE_URL?.trim() || OPENCODE_GO_DEFAULT_BASE_URL;
}

export function getAiAdvisoryConfig(): AiAdvisoryConfig {
  const enabled = parseBoolean(process.env.AI_ADVISORY_ENABLED);
  const provider = parseProvider(process.env.AI_ADVISORY_PROVIDER, enabled ? "gemini" : "none");
  const fallbackProvider = parseProvider(process.env.AI_ADVISORY_FALLBACK_PROVIDER, "opencode_go");

  return {
    enabled,
    provider,
    model: process.env.AI_ADVISORY_MODEL?.trim() || defaultModelForProvider(provider),
    fallbackProvider,
    fallbackModel: process.env.AI_ADVISORY_FALLBACK_MODEL?.trim() || defaultModelForProvider(fallbackProvider),
    opencodeGoBaseUrl: getOpenCodeGoBaseUrl(),
    timeoutMs: parsePositiveInteger(process.env.AI_ADVISORY_TIMEOUT_MS, 8000, 30000),
    maxInputChars: parsePositiveInteger(process.env.AI_ADVISORY_MAX_INPUT_CHARS, 24000, 80000),
    maxOutputChars: parsePositiveInteger(process.env.AI_ADVISORY_MAX_OUTPUT_CHARS, 6000, 20000),
  };
}

export async function getEffectiveAiAdvisoryConfig(): Promise<AiAdvisoryConfig> {
  const envConfig = getAiAdvisoryConfig();
  const settings = await getOperationalRuntimeSettings();

  if (settings.aiRuntimeMode === "disabled") {
    return {
      ...envConfig,
      enabled: false,
      provider: "disabled",
      model: envConfig.model,
    };
  }

  if (settings.aiRuntimeMode === "mock") {
    return {
      ...envConfig,
      enabled: true,
      provider: "mock",
      model: "mock-admin-runtime",
    };
  }

  if (settings.aiRuntimeMode === "gemini") {
    return {
      ...envConfig,
      enabled: Boolean(getAiAdvisoryProviderKey("gemini")),
      provider: "gemini",
      model: process.env.AI_ADVISORY_MODEL?.trim() || "gemini-2.5-flash",
    };
  }

  return envConfig;
}
