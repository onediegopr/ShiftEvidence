import { afterEach, describe, expect, it, vi } from "vitest";

const requireAdminSessionMock = vi.hoisted(() => vi.fn());
const getStripeLiveDiagnosticsMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/server/admin/adminAuth", () => ({
  requireAdminSession: requireAdminSessionMock,
}));

vi.mock("../../src/server/billing/stripeLiveDiagnostics", () => ({
  getStripeLiveDiagnostics: getStripeLiveDiagnosticsMock,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("Stripe live diagnostic admin route", () => {
  it("requires admin session before returning diagnostics", async () => {
    const { GET } = await import("../../src/app/api/admin/billing/diagnostics/stripe-live/route");
    requireAdminSessionMock.mockRejectedValueOnce(new Error("redirect:/sign-in"));

    await expect(GET()).rejects.toThrow("redirect:/sign-in");
    expect(getStripeLiveDiagnosticsMock).not.toHaveBeenCalled();
  });

  it("returns safe JSON with no-store cache headers for admins", async () => {
    const { GET } = await import("../../src/app/api/admin/billing/diagnostics/stripe-live/route");
    requireAdminSessionMock.mockResolvedValueOnce({ user: { id: "admin", email: "admin@example.invalid" } });
    getStripeLiveDiagnosticsMock.mockResolvedValueOnce({
      checkedAt: "2026-06-01T00:00:00.000Z",
      runtimeEnv: {
        secretKeyPresent: true,
        secretKeyMode: "live",
        webhookSecretPresent: true,
        starterPricePresent: true,
        professionalPricePresent: true,
        mspPricePresent: true,
        checkoutMode: "live",
        livePaymentsApproved: true,
        checkoutEnabled: false,
        appUrlPresent: true,
      },
      stripeApi: {
        canAuthenticate: true,
        stripeAccountReachable: true,
        errorCode: null,
        errorType: null,
      },
      prices: {
        starter: { priceIdMasked: "price_sa...1111", sane: true },
        professional: { priceIdMasked: "price_pr...2222", sane: true },
        msp: { priceIdMasked: "price_ms...3333", sane: true },
      },
      overall: {
        readyForLiveCheckoutPrepaymentSmoke: true,
        blockers: [],
        warnings: ["STRIPE_CHECKOUT_ENABLED=false"],
      },
    });

    const response = await GET();
    const json = await response.json();
    const serialized = JSON.stringify(json);

    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(json.runtimeEnv.secretKeyMode).toBe("live");
    expect(serialized).not.toContain("sk_");
    expect(serialized).not.toContain("whsec");
    expect(serialized).not.toContain("price_safe_starter_full");
  });
});
