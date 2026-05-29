import { describe, expect, it } from "vitest";
import { sanitizeLogMetadata, serializeLogError } from "../../src/server/logging/logger";

describe("logger sanitization", () => {
  it("redacts sensitive keys recursively", () => {
    const sanitized = sanitizeLogMetadata({
      token: "raw-token",
      password: "raw-password",
      apiKey: "raw-api-key",
      authorization: "Bearer secret",
      cookie: "session=secret",
      nested: {
        DATABASE_URL: "postgres://secret",
        DIRECT_URL: "postgres://direct",
        safe: "value",
      },
    });

    expect(sanitized.token).toBe("[REDACTED]");
    expect(sanitized.password).toBe("[REDACTED]");
    expect(sanitized.apiKey).toBe("[REDACTED]");
    expect(sanitized.authorization).toBe("[REDACTED]");
    expect(sanitized.cookie).toBe("[REDACTED]");
    expect(sanitized.nested).toMatchObject({
      DATABASE_URL: "[REDACTED]",
      DIRECT_URL: "[REDACTED]",
      safe: "value",
    });
  });

  it("serializes Error safely", () => {
    const error = new Error("Something failed");
    const serialized = serializeLogError(error);

    expect(serialized.name).toBe("Error");
    expect(serialized.message).toBe("Something failed");
  });

  it("does not include stack in production serialization", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const serialized = serializeLogError(new Error("Production failure"));
      expect(serialized).not.toHaveProperty("stack");
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("limits deep, large and circular metadata without crashing", () => {
    const circular: Record<string, unknown> = { ok: true };
    circular.self = circular;

    const sanitized = sanitizeLogMetadata({
      circular,
      deep: { a: { b: { c: "too deep" } } },
      items: Array.from({ length: 25 }, (_, index) => index),
    });

    expect((sanitized.circular as Record<string, unknown>).self).toBe("[Circular]");
    expect(((sanitized.deep as Record<string, unknown>).a as Record<string, unknown>).b).toBe("[MaxDepth]");
    expect(sanitized.items).toHaveLength(21);
  });
});
