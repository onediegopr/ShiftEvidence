import { afterEach, describe, expect, it } from "vitest";
import {
  createStripeWebhookSignature,
  getStripeWebhookSecret,
  verifyStripeWebhookSignature,
} from "../../src/server/billing/webhooks/stripeWebhookSignature";

const trackedEnvNames = ["STRIPE_WEBHOOK_SECRET"] as const;
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

describe("Stripe webhook signature verification", () => {
  it("reads webhook secret from server-side env without exposing the value", () => {
    process.env.STRIPE_WEBHOOK_SECRET = " whsec_example ";

    expect(getStripeWebhookSecret()).toBe("whsec_example");
  });

  it("accepts a valid Stripe v1 signature over timestamp.rawBody", () => {
    const rawBody = JSON.stringify({ id: "evt_123", type: "checkout.session.completed" });
    const signature = createStripeWebhookSignature({
      rawBody,
      secret: "whsec_secret",
      timestamp: "1780300000",
    });

    expect(
      verifyStripeWebhookSignature({
        rawBody,
        signatureHeader: `t=1780300000,v1=${signature}`,
        secret: "whsec_secret",
      }),
    ).toBe(true);
  });

  it("rejects missing, malformed or mismatched signatures", () => {
    const rawBody = JSON.stringify({ id: "evt_123" });
    const signature = createStripeWebhookSignature({
      rawBody,
      secret: "other_secret",
      timestamp: "1780300000",
    });

    expect(verifyStripeWebhookSignature({ rawBody, signatureHeader: null, secret: "whsec_secret" })).toBe(false);
    expect(verifyStripeWebhookSignature({ rawBody, signatureHeader: "v1=abc", secret: "whsec_secret" })).toBe(false);
    expect(
      verifyStripeWebhookSignature({
        rawBody,
        signatureHeader: `t=1780300000,v1=${signature}`,
        secret: "whsec_secret",
      }),
    ).toBe(false);
  });
});
