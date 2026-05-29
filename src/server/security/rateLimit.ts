import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "../logging/logger";

export type RateLimitName =
  | "passwordResetRequestIp"
  | "passwordResetRequestEmail"
  | "passwordResetConfirmIp"
  | "passwordResetConfirmToken"
  | "reportGenerateUser"
  | "reportGenerateAssessment"
  | "uploadEvidenceUser"
  | "uploadEvidenceIp";

type RateLimitConfig = {
  limit: number;
  window: `${number} ${"s" | "m" | "h" | "d"}`;
  prefix: string;
};

export type RateLimitResult = {
  allowed: boolean;
  mode: "active" | "disabled";
  limiter: RateLimitName;
  limit?: number;
  remaining?: number;
  reset?: number;
  retryAfterSeconds?: number;
};

export const RATE_LIMIT_MESSAGE = "Too many requests. Please try again later.";

const RATE_LIMITS: Record<RateLimitName, RateLimitConfig> = {
  passwordResetRequestIp: { limit: 5, window: "10 m", prefix: "rl:pwd-reset-request-ip" },
  passwordResetRequestEmail: { limit: 3, window: "15 m", prefix: "rl:pwd-reset-request-email" },
  passwordResetConfirmIp: { limit: 10, window: "10 m", prefix: "rl:pwd-reset-confirm-ip" },
  passwordResetConfirmToken: { limit: 5, window: "10 m", prefix: "rl:pwd-reset-confirm-token" },
  reportGenerateUser: { limit: 20, window: "1 h", prefix: "rl:report-generate-user" },
  reportGenerateAssessment: { limit: 5, window: "15 m", prefix: "rl:report-generate-assessment" },
  uploadEvidenceUser: { limit: 20, window: "15 m", prefix: "rl:upload-evidence-user" },
  uploadEvidenceIp: { limit: 50, window: "15 m", prefix: "rl:upload-evidence-ip" },
};

let redis: Redis | null | undefined;
const limiters = new Map<RateLimitName, Ratelimit>();
let missingUpstashWarningEmitted = false;
let rateLimitFailureWarningEmitted = false;

export class RateLimitExceededError extends Error {
  result: RateLimitResult;

  constructor(result: RateLimitResult) {
    super(RATE_LIMIT_MESSAGE);
    this.name = "RateLimitExceededError";
    this.result = result;
  }
}

export function isRateLimitExceededError(error: unknown): error is RateLimitExceededError {
  return error instanceof RateLimitExceededError;
}

export function hashRateLimitKey(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function getClientIpFromHeaders(headers: Pick<Headers, "get">) {
  const forwardedFor = headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();
  if (forwardedIp) {
    return forwardedIp;
  }

  return headers.get("x-real-ip")?.trim() || headers.get("cf-connecting-ip")?.trim() || "unknown";
}

function getRedisClient() {
  if (redis !== undefined) {
    return redis;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    redis = null;
    if (!missingUpstashWarningEmitted) {
      missingUpstashWarningEmitted = true;
      logger.warn("rate_limit_misconfigured", {
        reason: "missing_upstash_env",
      });
    }
    return redis;
  }

  redis = new Redis({ url, token });
  return redis;
}

function getLimiter(name: RateLimitName) {
  const existing = limiters.get(name);
  if (existing) {
    return existing;
  }

  const redisClient = getRedisClient();
  if (!redisClient) {
    return null;
  }

  const config = RATE_LIMITS[name];
  const limiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    prefix: config.prefix,
    analytics: false,
  });

  limiters.set(name, limiter);
  return limiter;
}

function buildHashedKey(parts: Array<string | number | null | undefined>) {
  const normalized = parts
    .map((part) => String(part ?? "unknown").trim().toLowerCase())
    .filter(Boolean)
    .join(":");

  return hashRateLimitKey(normalized || "unknown");
}

export async function checkRateLimit(params: {
  limiter: RateLimitName;
  keyParts: Array<string | number | null | undefined>;
}): Promise<RateLimitResult> {
  const limiter = getLimiter(params.limiter);
  if (!limiter) {
    const isProduction = process.env.NODE_ENV === "production";
    return {
      allowed: !isProduction,
      mode: isProduction ? "active" : "disabled",
      limiter: params.limiter,
    };
  }

  let result: Awaited<ReturnType<Ratelimit["limit"]>>;
  try {
    result = await limiter.limit(buildHashedKey(params.keyParts));
  } catch (error) {
    if (!rateLimitFailureWarningEmitted) {
      rateLimitFailureWarningEmitted = true;
      logger.warn("rate_limit_check_failed", {
        limiter: params.limiter,
        error,
      });
    }

    return {
      allowed: true,
      mode: "disabled",
      limiter: params.limiter,
    };
  }

  const retryAfterSeconds = result.success
    ? undefined
    : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));

  return {
    allowed: result.success,
    mode: "active",
    limiter: params.limiter,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    retryAfterSeconds,
  };
}

export async function assertRateLimit(params: {
  limiter: RateLimitName;
  keyParts: Array<string | number | null | undefined>;
}) {
  const result = await checkRateLimit(params);
  if (!result.allowed) {
    throw new RateLimitExceededError(result);
  }

  return result;
}

export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {};

  if (typeof result.limit === "number") {
    headers["X-RateLimit-Limit"] = String(result.limit);
  }

  if (typeof result.remaining === "number") {
    headers["X-RateLimit-Remaining"] = String(result.remaining);
  }

  if (typeof result.retryAfterSeconds === "number") {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }

  return headers;
}
