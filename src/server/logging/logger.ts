type LogLevel = "info" | "warn" | "error";

export type LogMetadata = Record<string, unknown>;

const SENSITIVE_KEY_PATTERN =
  /password|token|secret|api[-_]?key|authorization|cookie|set-cookie|upstash_redis_rest_token|openai_api_key|google_client_secret|better_auth_secret|database_url|direct_url|gemini_api_key/i;

const MAX_DEPTH = 3;
const MAX_ARRAY_ITEMS = 20;
const MAX_STRING_LENGTH = 500;
const MAX_STACK_LENGTH = 2_000;

function truncateString(value: string, maxLength = MAX_STRING_LENGTH) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...[TRUNCATED]`;
}

function serializeError(error: Error) {
  return {
    name: error.name,
    message: truncateString(error.message),
    ...(process.env.NODE_ENV !== "production" && error.stack
      ? { stack: truncateString(error.stack, MAX_STACK_LENGTH) }
      : {}),
  };
}

function sanitizeValue(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (value instanceof Error) {
    return serializeError(value);
  }

  if (value === null || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return truncateString(value);
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "undefined") {
    return null;
  }

  if (typeof value === "function" || typeof value === "symbol") {
    return `[${typeof value}]`;
  }

  if (typeof value !== "object") {
    return String(value);
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  if (depth >= MAX_DEPTH) {
    return "[MaxDepth]";
  }

  seen.add(value);

  if (Array.isArray(value)) {
    const sanitizedItems = value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitizeValue(item, depth + 1, seen));

    if (value.length > MAX_ARRAY_ITEMS) {
      sanitizedItems.push(`[TRUNCATED ${value.length - MAX_ARRAY_ITEMS} items]`);
    }

    return sanitizedItems;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    sanitized[key] = sanitizeValue(item, depth + 1, seen);
  }

  return sanitized;
}

function sanitizeMetadata(metadata: LogMetadata = {}) {
  return sanitizeValue(metadata, 0, new WeakSet<object>()) as LogMetadata;
}

function writeLog(level: LogLevel, event: string, metadata?: LogMetadata) {
  const entry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    metadata: sanitizeMetadata(metadata),
  };

  let line: string;
  try {
    line = JSON.stringify(entry);
  } catch {
    line = JSON.stringify({
      level,
      event: "logger_serialization_failed",
      timestamp: new Date().toISOString(),
      metadata: { originalEvent: event },
    });
  }

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  info(event: string, metadata?: LogMetadata) {
    writeLog("info", event, metadata);
  },
  warn(event: string, metadata?: LogMetadata) {
    writeLog("warn", event, metadata);
  },
  error(event: string, metadata?: LogMetadata) {
    writeLog("error", event, metadata);
  },
};
