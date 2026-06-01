import { afterEach, describe, expect, it, vi } from "vitest";
import { billingPlans } from "../../src/config/billing";
import { createStripeCheckoutSession, getStripeCheckoutMode } from "../../src/server/billing/stripeCheckout";

const starterPlan = billingPlans.find((plan) => plan.id === "starter_readiness")!;
const mspPlan = billingPlans.find((plan) => plan.id === "msp_partner")!;
const originalFetch = globalThis.fetch;
const trackedEnvNames = [
  "STRIPE_SECRET_KEY",
  "STRIPE_STARTER_PRICE_ID",
  "STRIPE_MSP_PRICE_ID",
  "STRIPE_CHECKOUT_MODE",
  "STRIPE_CHECKOUT_ENABLED",
  "STRIPE_LIVE_PAYMENTS_APPROVED",
] as const;
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

  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("Stripe checkout foundation", () => {
  it("does not call Stripe when server-side env vars are missing", async () => {
    trackedEnvNames.forEach((name) => {
      delete process.env[name];
    });
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const result = await createStripeCheckoutSession(starterPlan, "https://shiftevidence.com");

    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.reason).toBe("not_configured");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("creates a test-mode Stripe Checkout session with server-side plan metadata", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_example";
    process.env.STRIPE_STARTER_PRICE_ID = "price_starter";
    process.env.STRIPE_CHECKOUT_MODE = "test";
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "cs_test_123",
        livemode: false,
        url: "https://checkout.stripe.com/c/pay/cs_test_123",
      }),
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const result = await createStripeCheckoutSession(starterPlan, "https://shiftevidence.com");
    const [, request] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = new URLSearchParams(String(request.body));

    expect(result).toEqual({
      ok: true,
      checkoutId: "cs_test_123",
      testMode: true,
      url: "https://checkout.stripe.com/c/pay/cs_test_123",
    });
    expect(request.headers).toMatchObject({
      Authorization: "Bearer sk_test_example",
      "Content-Type": "application/x-www-form-urlencoded",
    });
    expect(body.get("mode")).toBe("payment");
    expect(body.get("line_items[0][price]")).toBe("price_starter");
    expect(body.get("metadata[provider]")).toBe("stripe");
    expect(body.get("metadata[plan_id]")).toBe("starter_readiness");
    expect(String(request.body)).not.toContain("sk_test_example");
  });

  it("uses subscription mode for MSP without granting access", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_example";
    process.env.STRIPE_MSP_PRICE_ID = "price_msp";
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "cs_test_msp",
        livemode: false,
        url: "https://checkout.stripe.com/c/pay/cs_test_msp",
      }),
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const result = await createStripeCheckoutSession(mspPlan, "https://shiftevidence.com");
    const [, request] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = new URLSearchParams(String(request.body));

    expect(result.ok).toBe(true);
    expect(body.get("mode")).toBe("subscription");
    expect(body.get("metadata[plan_id]")).toBe("msp_partner");
  });

  it("blocks live mode without explicit owner approval before calling Stripe", async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    process.env.STRIPE_SECRET_KEY = "\"sk_live_example\"";
    process.env.STRIPE_STARTER_PRICE_ID = "price_starter";
    process.env.STRIPE_CHECKOUT_MODE = "live";

    const liveResult = await createStripeCheckoutSession(starterPlan, "https://shiftevidence.com");

    expect(liveResult.ok).toBe(false);
    expect(liveResult.ok ? null : liveResult.reason).toBe("live_not_approved");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("blocks live mode when the configured secret key is still test-mode", async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    process.env.STRIPE_SECRET_KEY = "sk_test_example";
    process.env.STRIPE_STARTER_PRICE_ID = "price_starter";
    process.env.STRIPE_CHECKOUT_MODE = "live";
    process.env.STRIPE_LIVE_PAYMENTS_APPROVED = "\"true\"";

    const liveResult = await createStripeCheckoutSession(starterPlan, "https://shiftevidence.com");

    expect(liveResult.ok).toBe(false);
    expect(liveResult.ok ? null : liveResult.reason).toBe("stripe_key_mode_mismatch");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("blocks live mode when the configured secret key prefix is unknown", async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    process.env.STRIPE_SECRET_KEY = "live_secret_without_expected_prefix";
    process.env.STRIPE_STARTER_PRICE_ID = "price_starter";
    process.env.STRIPE_CHECKOUT_MODE = "live";
    process.env.STRIPE_LIVE_PAYMENTS_APPROVED = "\"true\"";

    const liveResult = await createStripeCheckoutSession(starterPlan, "https://shiftevidence.com");

    expect(liveResult.ok).toBe(false);
    expect(liveResult.ok ? null : liveResult.reason).toBe("stripe_key_mode_mismatch");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("creates a live Stripe Checkout session only when explicitly approved", async () => {
    process.env.STRIPE_SECRET_KEY = "\"sk_live_example\"";
    process.env.STRIPE_STARTER_PRICE_ID = "price_starter";
    process.env.STRIPE_CHECKOUT_MODE = "live";
    process.env.STRIPE_LIVE_PAYMENTS_APPROVED = "\"true\"";
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "cs_live_123",
        livemode: true,
        url: "https://checkout.stripe.com/c/pay/cs_live_123",
      }),
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const result = await createStripeCheckoutSession(starterPlan, "https://shiftevidence.com");

    expect(result).toEqual({
      ok: true,
      checkoutId: "cs_live_123",
      testMode: false,
      url: "https://checkout.stripe.com/c/pay/cs_live_123",
    });
  });

  it("blocks invalid price IDs before calling Stripe", async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    process.env.STRIPE_SECRET_KEY = "sk_test_example";
    process.env.STRIPE_STARTER_PRICE_ID = "starter";
    process.env.STRIPE_CHECKOUT_MODE = "test";

    const invalidPriceResult = await createStripeCheckoutSession(starterPlan, "https://shiftevidence.com");

    expect(invalidPriceResult.ok).toBe(false);
    expect(invalidPriceResult.ok ? null : invalidPriceResult.reason).toBe("invalid_price");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns a safe Stripe API error when session creation fails before a response", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_example";
    process.env.STRIPE_STARTER_PRICE_ID = "price_starter";
    const fetchSpy = vi.fn().mockRejectedValue(new Error("network timeout"));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const result = await createStripeCheckoutSession(starterPlan, "https://shiftevidence.com");

    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.reason).toBe("stripe_api_error");
    expect(result.ok ? null : result.detail).not.toContain("sk_test_example");
  });

  it("defaults to test mode unless live mode is explicit", () => {
    delete process.env.STRIPE_CHECKOUT_MODE;
    expect(getStripeCheckoutMode()).toBe("test");

    process.env.STRIPE_CHECKOUT_MODE = "live";
    expect(getStripeCheckoutMode()).toBe("live");
  });
});
