import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkRateLimit,
  getClientIpFromHeaders,
  hashRateLimitKey,
} from "../../src/server/security/rateLimit";

describe("rate limit helpers", () => {
  const originalUpstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalUpstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercelEnv = process.env.VERCEL_ENV;
  const originalPreviewFallback = process.env.RATE_LIMIT_PREVIEW_FALLBACK;

  afterEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = originalUpstashUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = originalUpstashToken;
    process.env.NODE_ENV = originalNodeEnv;
    process.env.VERCEL_ENV = originalVercelEnv;
    process.env.RATE_LIMIT_PREVIEW_FALLBACK = originalPreviewFallback;
    vi.restoreAllMocks();
  });

  it("hashes normalized keys without returning raw values", () => {
    const firstHash = hashRateLimitKey(" Admin@Example.com ");
    const secondHash = hashRateLimitKey("admin@example.com");

    expect(firstHash).toBe(secondHash);
    expect(firstHash).not.toContain("admin@example.com");
    expect(firstHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("extracts client IP from forwarding headers", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 198.51.100.20",
      "x-real-ip": "198.51.100.30",
    });

    expect(getClientIpFromHeaders(headers)).toBe("203.0.113.10");
  });

  it("falls back to disabled mode when Upstash is not configured", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = await checkRateLimit({
      limiter: "passwordResetRequestIp",
      keyParts: ["ip", "127.0.0.1"],
    });

    expect(result).toMatchObject({
      allowed: true,
      mode: "disabled",
      limiter: "passwordResetRequestIp",
    });
  });

  it("fails closed in production when Upstash is not configured", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    delete process.env.RATE_LIMIT_PREVIEW_FALLBACK;
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = await checkRateLimit({
      limiter: "uploadEvidenceIp",
      keyParts: ["ip", "127.0.0.1"],
    });

    expect(result).toMatchObject({
      allowed: false,
      mode: "active",
      limiter: "uploadEvidenceIp",
    });
  });

  it("uses explicit memory fallback for preview when Upstash is not configured", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "preview";
    process.env.RATE_LIMIT_PREVIEW_FALLBACK = "memory";
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = await checkRateLimit({
      limiter: "uploadEvidenceIp",
      keyParts: ["ip", "127.0.0.1"],
    });

    expect(result).toMatchObject({
      allowed: true,
      mode: "active",
      limiter: "uploadEvidenceIp",
      limit: 50,
      remaining: 49,
    });
  });
});
