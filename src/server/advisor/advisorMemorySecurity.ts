import { sanitizeSeniorAdvisorText } from "./seniorAdvisorSecurity";

export const ADVISOR_MEMORY_TITLE_MAX_CHARS = 140;
export const ADVISOR_MEMORY_SUMMARY_MAX_CHARS = 1_200;

const RAW_FILE_CONTENT_PATTERNS = [
  /-----BEGIN [A-Z ]+PRIVATE KEY-----/i,
  /-----BEGIN CERTIFICATE-----/i,
  /\b(VM|Name),\s*(Powerstate|PowerState|CPUs|Memory|Provisioned)/i,
  /\bBEGIN:VCENTER\b/i,
  /\bRVTools\b[\s\S]{0,120}\b(vInfo|vHost|vDatastore|vSnapshot)\b/i,
];

export function normalizeAdvisorMemoryWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function containsObviousRawFileContent(value: string) {
  return RAW_FILE_CONTENT_PATTERNS.some((pattern) => pattern.test(value));
}

export function sanitizeAdvisorMemoryTitle(value: string) {
  return normalizeAdvisorMemoryWhitespace(
    sanitizeSeniorAdvisorText(value, ADVISOR_MEMORY_TITLE_MAX_CHARS),
  );
}

export function sanitizeAdvisorMemorySummary(value: string) {
  const sanitized = sanitizeSeniorAdvisorText(value, ADVISOR_MEMORY_SUMMARY_MAX_CHARS);
  if (containsObviousRawFileContent(sanitized)) {
    return "[REDACTED_RAW_FILE_CONTENT]";
  }

  return normalizeAdvisorMemoryWhitespace(sanitized);
}

export function sanitizeAdvisorMemoryTags(tags: string[] | null | undefined) {
  if (!Array.isArray(tags)) return [];

  return [...new Set(tags.map((tag) => sanitizeAdvisorMemoryTitle(tag).toLowerCase()).filter(Boolean))]
    .slice(0, 12);
}

export function sanitizeAdvisorMemoryMetadata(
  value: Record<string, unknown> | null | undefined,
) {
  if (!value) return null;

  const output: Record<string, string | number | boolean | null> = {};
  const unsafeKeyPattern = /key|secret|token|cookie|password|authorization|database_url|direct_url|raw|content|path/i;

  for (const [key, item] of Object.entries(value)) {
    if (unsafeKeyPattern.test(key)) continue;
    if (typeof item === "string") {
      const sanitized = sanitizeAdvisorMemorySummary(item).slice(0, 300);
      output[key] = sanitized;
    } else if (typeof item === "number" || typeof item === "boolean" || item === null) {
      output[key] = item;
    }
  }

  return Object.keys(output).length > 0 ? output : null;
}
