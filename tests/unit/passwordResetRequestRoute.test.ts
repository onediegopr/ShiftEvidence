import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    passwordResetRequest: {
      updateMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditEvent: {
      create: vi.fn(),
    },
  },
  rateLimit: {
    checkRateLimit: vi.fn(),
    buildRateLimitHeaders: vi.fn(() => ({})),
    getClientIpFromHeaders: vi.fn(() => "203.0.113.10"),
    RATE_LIMIT_MESSAGE: "Too many requests.",
  },
  logger: {
    warn: vi.fn(),
  },
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("../../src/server/security/rateLimit", () => mocks.rateLimit);
vi.mock("../../src/server/logging/logger", () => ({ logger: mocks.logger }));

const originalResendApiKey = process.env.RESEND_API_KEY;
const originalEmailFrom = process.env.EMAIL_FROM;

afterEach(() => {
  if (originalResendApiKey === undefined) {
    delete process.env.RESEND_API_KEY;
  } else {
    process.env.RESEND_API_KEY = originalResendApiKey;
  }

  if (originalEmailFrom === undefined) {
    delete process.env.EMAIL_FROM;
  } else {
    process.env.EMAIL_FROM = originalEmailFrom;
  }

  vi.clearAllMocks();
});

function makeRequest(email: string) {
  return new Request("http://localhost:3000/api/account-support/password-reset/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.10",
    },
    body: JSON.stringify({ email }),
  });
}

describe("password reset request route", () => {
  it("records manual fallback when the email provider is not configured", async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    vi.resetModules();

    const { POST } = await import("../../src/app/api/account-support/password-reset/request/route");

    mocks.rateLimit.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.prisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "person@example.com" });
    mocks.prisma.passwordResetRequest.create.mockResolvedValue({ id: "reset-1" });
    mocks.prisma.passwordResetRequest.update.mockResolvedValue({ id: "reset-1" });
    mocks.prisma.auditEvent.create.mockResolvedValue({ id: "audit-1" });

    const response = await POST(makeRequest("person@example.com"));
    const payload = (await response.json()) as { ok: boolean; message: string };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(mocks.prisma.passwordResetRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "manual_pending",
          deliveryMode: "manual",
        }),
      }),
    );
    expect(mocks.logger.warn).toHaveBeenCalledWith(
      "password_reset_email_provider_missing",
      expect.objectContaining({
        providerConfigured: false,
        status: "manual_pending",
        deliveryMode: "manual",
      }),
    );
    expect(mocks.prisma.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadataJson: expect.objectContaining({
            providerConfigured: false,
          }),
        }),
      }),
    );
  });
});
