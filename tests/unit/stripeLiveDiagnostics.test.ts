import { afterEach, describe, expect, it, vi } from "vitest";
import { getStripeLiveDiagnostics, maskStripeId } from "../../src/server/billing/stripeLiveDiagnostics";

const originalFetch = globalThis.fetch;
const trackedEnvNames = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_STARTER_PRICE_ID",
  "STRIPE_PROFESSIONAL_PRICE_ID",
  "STRIPE_MSP_PRICE_ID",
  "STRIPE_CHECKOUT_MODE",
  "STRIPE_CHECKOUT_ENABLED",
  "STRIPE_LIVE_PAYMENTS_APPROVED",
  "NEXT_PUBLIC_APP_URL",
] as const;
const originalEnv = Object.fromEntries(trackedEnvNames.map((name) => [name, process.env[name]]));

function resetEnv() {
  trackedEnvNames.forEach((name) => {
    const value = originalEnv[name];
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  });
}

function setBaseLiveEnv() {
  process.env.STRIPE_SECRET_KEY = `sk_${"live"}_safe_example`;
  process.env.STRIPE_WEBHOOK_SECRET = `wh${"sec"}_safe_example`;
  process.env.STRIPE_STARTER_PRICE_ID = "price_safe_starter_123456789";
  process.env.STRIPE_PROFESSIONAL_PRICE_ID = "price_safe_professional_123456789";
  process.env.STRIPE_MSP_PRICE_ID = "price_safe_msp_123456789";
  process.env.STRIPE_CHECKOUT_MODE = "live";
  process.env.STRIPE_CHECKOUT_ENABLED = "false";
  process.env.STRIPE_LIVE_PAYMENTS_APPROVED = "true";
  process.env.NEXT_PUBLIC_APP_URL = "https://shiftevidence.com";
}

function stripePrice(unitAmount: number, recurring: { interval: string } | null = null, livemode = true) {
  return {
    ok: true,
    json: async () => ({
      active: true,
      currency: "usd",
      livemode,
      unit_amount: unitAmount,
      recurring,
    }),
  };
}

function mockSaneStripeFetch(overrides: Record<string, unknown> = {}) {
  const fetchSpy = vi.fn(async (url: string) => {
    if (url.endsWith("/account")) {
      return { ok: true, json: async () => ({ id: "acct_safe" }) };
    }
    if (url.includes("starter")) return overrides.starter ?? stripePrice(49000);
    if (url.includes("professional")) return overrides.professional ?? stripePrice(150000);
    if (url.includes("msp")) return overrides.msp ?? stripePrice(79900, { interval: "month" });
    return { ok: false, status: 404, json: async () => ({}) };
  });
  globalThis.fetch = fetchSpy as unknown as typeof fetch;
  return fetchSpy;
}

afterEach(() => {
  resetEnv();
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("Stripe live diagnostics", () => {
  it("reports missing secret and does not authenticate", async () => {
    resetEnv();
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const diagnostics = await getStripeLiveDiagnostics();

    expect(diagnostics.runtimeEnv.secretKeyPresent).toBe(false);
    expect(diagnostics.runtimeEnv.secretKeyMode).toBe("missing");
    expect(diagnostics.stripeApi.canAuthenticate).toBe(false);
    expect(diagnostics.overall.blockers).toContain("STRIPE_SECRET_KEY debe ser sk_live_ para smoke live pre-payment.");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("blocks test keys in live mode", async () => {
    setBaseLiveEnv();
    process.env.STRIPE_SECRET_KEY = `sk_${"test"}_safe_example`;
    mockSaneStripeFetch();

    const diagnostics = await getStripeLiveDiagnostics();

    expect(diagnostics.runtimeEnv.secretKeyMode).toBe("test");
    expect(diagnostics.overall.readyForLiveCheckoutPrepaymentSmoke).toBe(false);
    expect(diagnostics.overall.blockers).toContain("STRIPE_SECRET_KEY debe ser sk_live_ para smoke live pre-payment.");
  });

  it("recognizes restricted live keys and keeps them blocked for checkout smoke", async () => {
    setBaseLiveEnv();
    process.env.STRIPE_SECRET_KEY = `rk_${"live"}_safe_example`;
    mockSaneStripeFetch();

    const diagnostics = await getStripeLiveDiagnostics();

    expect(diagnostics.runtimeEnv.secretKeyMode).toBe("restricted_live");
    expect(diagnostics.overall.readyForLiveCheckoutPrepaymentSmoke).toBe(false);
  });

  it("returns ready with a checkout-disabled warning when all live prices are sane", async () => {
    setBaseLiveEnv();
    mockSaneStripeFetch();

    const diagnostics = await getStripeLiveDiagnostics();

    expect(diagnostics.runtimeEnv.secretKeyMode).toBe("live");
    expect(diagnostics.stripeApi.stripeAccountReachable).toBe(true);
    expect(diagnostics.prices.starter.sane).toBe(true);
    expect(diagnostics.prices.professional.sane).toBe(true);
    expect(diagnostics.prices.msp.sane).toBe(true);
    expect(diagnostics.overall.readyForLiveCheckoutPrepaymentSmoke).toBe(true);
    expect(diagnostics.overall.warnings).toContain("STRIPE_CHECKOUT_ENABLED=false: checkout publico sigue deshabilitado, como se espera en FIX-3.");
  });

  it("reports missing price IDs as blockers", async () => {
    setBaseLiveEnv();
    delete process.env.STRIPE_STARTER_PRICE_ID;
    mockSaneStripeFetch();

    const diagnostics = await getStripeLiveDiagnostics();

    expect(diagnostics.runtimeEnv.starterPricePresent).toBe(false);
    expect(diagnostics.prices.starter.errorCode).toBe("missing_price_id");
    expect(diagnostics.overall.readyForLiveCheckoutPrepaymentSmoke).toBe(false);
  });

  it("reports wrong amount and test-mode prices as blockers", async () => {
    setBaseLiveEnv();
    mockSaneStripeFetch({
      starter: stripePrice(1000),
      professional: stripePrice(150000, null, false),
    });

    const diagnostics = await getStripeLiveDiagnostics();

    expect(diagnostics.prices.starter.unitAmountOk).toBe(false);
    expect(diagnostics.prices.professional.livemodeOk).toBe(false);
    expect(diagnostics.overall.readyForLiveCheckoutPrepaymentSmoke).toBe(false);
  });

  it("reports MSP non-recurring price as a blocker", async () => {
    setBaseLiveEnv();
    mockSaneStripeFetch({
      msp: stripePrice(79900),
    });

    const diagnostics = await getStripeLiveDiagnostics();

    expect(diagnostics.prices.msp.recurringOk).toBe(false);
    expect(diagnostics.overall.readyForLiveCheckoutPrepaymentSmoke).toBe(false);
  });

  it("masks Stripe IDs instead of returning full configured values", async () => {
    expect(maskStripeId("price_safe_starter_123456789")).toBe("price_sa...6789");
  });
});

