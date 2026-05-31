import { afterEach, describe, expect, it, vi } from "vitest";
import { billingPlans } from "../../src/config/billing";
import { createLemonSqueezyCheckout, getLemonSqueezyCheckoutMode } from "../../src/server/billing/lemonSqueezyCheckout";

const starterPlan = billingPlans.find((plan) => plan.id === "starter_readiness")!;
const originalFetch = globalThis.fetch;
const trackedEnvNames = [
  "LEMON_SQUEEZY_STORE_ID",
  "LEMON_SQUEEZY_API_KEY",
  "LEMONSQUEEZY_API_KEY",
  "LEMON_STARTER_VARIANT_ID",
  "LEMON_SQUEEZY_CHECKOUT_MODE",
  "LEMON_SQUEEZY_CHECKOUT_ENABLED",
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

describe("Lemon Squeezy checkout creation", () => {
  it("does not call Lemon when required env vars are missing", async () => {
    trackedEnvNames.forEach((name) => {
      delete process.env[name];
    });
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const result = await createLemonSqueezyCheckout(starterPlan, "https://shiftevidence.com/billing/checkout/starter");

    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.reason).toBe("not_configured");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("creates a test-mode checkout URL through the Lemon API when configured", async () => {
    process.env.LEMON_SQUEEZY_STORE_ID = "393386";
    process.env.LEMONSQUEEZY_API_KEY = "test-key";
    process.env.LEMON_STARTER_VARIANT_ID = "123";
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: "checkout_123",
          attributes: {
            test_mode: true,
            url: "https://shiftevidence.lemonsqueezy.com/checkout/custom/checkout_123",
          },
        },
      }),
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const result = await createLemonSqueezyCheckout(starterPlan, "https://shiftevidence.com/billing/checkout/starter");
    const [, request] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(request.body));

    expect(result).toEqual({
      ok: true,
      checkoutId: "checkout_123",
      testMode: true,
      url: "https://shiftevidence.lemonsqueezy.com/checkout/custom/checkout_123",
    });
    expect(request.headers).toMatchObject({
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: "Bearer test-key",
    });
    expect(body.data.attributes.test_mode).toBe(true);
    expect(body.data.relationships.store.data.id).toBe("393386");
    expect(body.data.relationships.variant.data.id).toBe("123");
  });

  it("does not call Lemon when checkout is explicitly disabled", async () => {
    process.env.LEMON_SQUEEZY_STORE_ID = "393386";
    process.env.LEMONSQUEEZY_API_KEY = "test-key";
    process.env.LEMON_STARTER_VARIANT_ID = "123";
    process.env.LEMON_SQUEEZY_CHECKOUT_ENABLED = "false";
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const result = await createLemonSqueezyCheckout(starterPlan, "https://shiftevidence.com/billing/checkout/starter");

    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.reason).toBe("checkout_disabled");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("defaults to test checkout mode unless live mode is explicit", () => {
    delete process.env.LEMON_SQUEEZY_CHECKOUT_MODE;
    expect(getLemonSqueezyCheckoutMode()).toBe("test");

    process.env.LEMON_SQUEEZY_CHECKOUT_MODE = "live";
    expect(getLemonSqueezyCheckoutMode()).toBe("live");
  });
});
