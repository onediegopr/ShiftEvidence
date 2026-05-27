import type { AiAdvisoryConfig, AiAdvisoryProvider } from "./aiAdvisoryTypes";

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

function parseProvider(value: string | undefined): AiAdvisoryProvider {
  if (value === "mock" || value === "gemini" || value === "openai" || value === "none") {
    return value;
  }

  return "none";
}

export function getAiAdvisoryConfig(): AiAdvisoryConfig {
  const enabled = parseBoolean(process.env.AI_ADVISORY_ENABLED);
  const provider = parseProvider(process.env.AI_ADVISORY_PROVIDER);

  return {
    enabled,
    provider,
    model: process.env.AI_ADVISORY_MODEL?.trim() || null,
    timeoutMs: parsePositiveInteger(process.env.AI_ADVISORY_TIMEOUT_MS, 8000, 30000),
    maxInputChars: parsePositiveInteger(process.env.AI_ADVISORY_MAX_INPUT_CHARS, 24000, 80000),
    maxOutputChars: parsePositiveInteger(process.env.AI_ADVISORY_MAX_OUTPUT_CHARS, 6000, 20000),
  };
}
