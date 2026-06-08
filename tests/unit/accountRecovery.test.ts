import { afterEach, describe, expect, it, vi } from "vitest";

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

  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("account recovery email helpers", () => {
  it("falls back to manual delivery when Resend is not configured", async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    vi.resetModules();

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { detectRecoveryEmailProvider, sendPasswordRecoveryEmail } = await import(
      "../../src/lib/account-recovery"
    );

    expect(detectRecoveryEmailProvider()).toBeNull();

    const deliveryMode = await sendPasswordRecoveryEmail({
      email: "person@example.com",
      resetUrl: "https://example.com/reset-password?token=test",
    });

    expect(deliveryMode).toBe("manual");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends through Resend when credentials are present and trimmed", async () => {
    process.env.RESEND_API_KEY = "  resend-key-123  ";
    process.env.EMAIL_FROM = "  noreply@shiftevidence.com  ";
    vi.resetModules();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    const { detectRecoveryEmailProvider, sendPasswordRecoveryEmail } = await import(
      "../../src/lib/account-recovery"
    );

    expect(detectRecoveryEmailProvider()).toBe("resend");

    const deliveryMode = await sendPasswordRecoveryEmail({
      email: "person@example.com",
      resetUrl: "https://example.com/reset-password?token=test",
    });

    expect(deliveryMode).toBe("email");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer resend-key-123",
      "Content-Type": "application/json",
    });

    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      from: "noreply@shiftevidence.com",
      to: "person@example.com",
      subject: "Reset your ShiftReadiness password",
    });
  });
});
