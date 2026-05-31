import { afterEach, describe, expect, it } from "vitest";
import {
  createLemonWebhookSignature,
  getLemonWebhookSecret,
  verifyLemonWebhookSignature,
} from "../../src/server/billing/webhooks/lemonWebhookSignature";

const trackedEnvNames = ["LEMON_SQUEEZY_WEBHOOK_SECRET", "LEMONSQUEEZY_WEBHOOK_SECRET"] as const;
const originalEnv = Object.fromEntries(trackedEnvNames.map((name) => [name, process.env[name]]));

afterEach(() => {
  trackedEnvNames.forEach((name) => {
    const value = originalEnv[name];
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  });
});

describe("Lemon webhook signature verification", () => {
  it("reads webhook secrets from server-side env aliases", () => {
    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET = " primary-secret ";
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    expect(getLemonWebhookSecret()).toBe("primary-secret");

    delete process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = "legacy-secret";

    expect(getLemonWebhookSecret()).toBe("legacy-secret");
  });

  it("accepts a valid X-Signature HMAC SHA-256 over the raw body", () => {
    const rawBody = JSON.stringify({ data: { id: "1" } });
    const signature = createLemonWebhookSignature(rawBody, "signing-secret");

    expect(
      verifyLemonWebhookSignature({
        rawBody,
        signature,
        secret: "signing-secret",
      }),
    ).toBe(true);
  });

  it("rejects missing, malformed or mismatched signatures", () => {
    const rawBody = JSON.stringify({ data: { id: "1" } });

    expect(verifyLemonWebhookSignature({ rawBody, signature: null, secret: "secret" })).toBe(false);
    expect(verifyLemonWebhookSignature({ rawBody, signature: "abc", secret: "secret" })).toBe(false);
    expect(
      verifyLemonWebhookSignature({
        rawBody,
        signature: createLemonWebhookSignature(rawBody, "other-secret"),
        secret: "secret",
      }),
    ).toBe(false);
  });
});
