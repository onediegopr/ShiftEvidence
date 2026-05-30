const SECRET_KEY_PATTERN =
  /(database_url|better_auth_secret|api[_-]?key|secret|password|passwd|pwd|token|cookie|authorization|bearer|session|reset[_ -]?token)/i;
const SECRET_VALUE_PATTERN =
  /\b(database_url|api[_-]?key|password|passwd|pwd|secret|token|cookie|authorization|bearer|reset token)\s*[:=]\s*[^\s,;]+/gi;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const WINDOWS_PATH_PATTERN = /[A-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)+[^\\/:*?"<>|\r\n]*/gi;
const UNIX_STORAGE_PATH_PATTERN = /\/(?:home|var|mnt|storage|private|uploads|tmp)\/[^\s"'<>]+/gi;

export type SafeJsonValue = string | number | boolean | null | SafeJsonValue[] | { [key: string]: SafeJsonValue };

export function redactSecrets(value: string) {
  return value.replace(SECRET_VALUE_PATTERN, "$1=[REDACTED]");
}

export function redactTokens(value: string) {
  return value
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(/\b[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/g, "[REDACTED_TOKEN]")
    .replace(/\b[A-Fa-f0-9]{32,}\b/g, "[REDACTED_TOKEN]");
}

export function redactEmails(value: string) {
  return value.replace(EMAIL_PATTERN, "[REDACTED_EMAIL]");
}

export function stripStoragePaths(value: string) {
  return value.replace(WINDOWS_PATH_PATTERN, "[REDACTED_PATH]").replace(UNIX_STORAGE_PATH_PATTERN, "[REDACTED_PATH]");
}

export function truncateLongText(value: string, maxChars = 1000) {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, maxChars)}...[TRUNCATED]`;
}

export function stripRawFileContent(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripRawFileContent);
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !/raw|content|buffer|blob|bytes|worksheet|rows|csv|xlsx/i.test(key))
        .map(([key, item]) => [key, stripRawFileContent(item)]),
    );
  }

  return value;
}

function sanitizeString(value: string, maxChars: number) {
  return truncateLongText(redactEmails(stripStoragePaths(redactTokens(redactSecrets(value)))), maxChars);
}

export function safeJsonForAI(value: unknown, maxStringChars = 1000): SafeJsonValue {
  const stripped = stripRawFileContent(value);

  if (stripped === null || stripped === undefined) {
    return null;
  }

  if (typeof stripped === "string") {
    return sanitizeString(stripped, maxStringChars);
  }

  if (typeof stripped === "number" || typeof stripped === "boolean") {
    return stripped;
  }

  if (stripped instanceof Date) {
    return stripped.toISOString();
  }

  if (Array.isArray(stripped)) {
    return stripped.map((item) => safeJsonForAI(item, maxStringChars));
  }

  if (typeof stripped === "object") {
    const output: Record<string, SafeJsonValue> = {};
    for (const [key, item] of Object.entries(stripped as Record<string, unknown>)) {
      if (SECRET_KEY_PATTERN.test(key)) {
        output[key] = "[REDACTED]";
        continue;
      }

      if (/relativePath|storedFilename|fileHash|absolutePath|storageRoot/i.test(key)) {
        output[key] = "[REDACTED]";
        continue;
      }

      output[key] = safeJsonForAI(item, maxStringChars);
    }

    return output;
  }

  return null;
}

export function sanitizeAiPayload<T>(payload: T, maxStringChars = 1000): SafeJsonValue {
  return safeJsonForAI(payload, maxStringChars);
}
