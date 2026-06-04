import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getCheckoutPublicOrigin, normalizeCheckoutOrigin } from "../../src/server/billing/checkoutOrigin";

const trackedEnvNames = ["NEXT_PUBLIC_APP_URL", "BETTER_AUTH_URL", "PREVIEW_TRUSTED_ORIGINS"] as const;
const originalEnv = Object.fromEntries(trackedEnvNames.map((name) => [name, process.env[name]]));

function headers(values: Record<string, string>) {
  return new Headers(values);
}

beforeEach(() => {
  trackedEnvNames.forEach((name) => {
    delete process.env[name];
  });
});

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

describe("checkout public origin", () => {
  it("uses NEXT_PUBLIC_APP_URL before forwarded headers", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://www.shiftevidence.com";

    expect(getCheckoutPublicOrigin(headers({ "x-forwarded-host": "shiftevidence.com" }))).toBe(
      "https://www.shiftevidence.com",
    );
  });

  it("uses BETTER_AUTH_URL when app url is absent", () => {
    process.env.BETTER_AUTH_URL = "https://shiftevidence.com/auth";

    expect(getCheckoutPublicOrigin(headers({}))).toBe("https://shiftevidence.com");
  });

  it("uses sanitized forwarded host and proto", () => {
    expect(
      getCheckoutPublicOrigin(
        headers({
          "x-forwarded-host": "shiftevidence.com",
          "x-forwarded-proto": "https",
          host: "0.0.0.0:3000",
        }),
      ),
    ).toBe("https://shiftevidence.com");
  });

  it("falls back to public origin instead of internal hosts", () => {
    expect(getCheckoutPublicOrigin(headers({ host: "0.0.0.0:3000" }))).toBe("https://shiftevidence.com");
    expect(normalizeCheckoutOrigin("https://0.0.0.0:3000")).toBeNull();
    expect(normalizeCheckoutOrigin("http://localhost:3000")).toBe("http://localhost:3000");
  });

  it("rejects untrusted host header values", () => {
    expect(getCheckoutPublicOrigin(headers({ "x-forwarded-host": "evil.example" }))).toBe(
      "https://shiftevidence.com",
    );
  });

  it("accepts an explicitly configured preview origin", () => {
    process.env.PREVIEW_TRUSTED_ORIGINS = "https://infrashift-r2-recovery-l9ouu5d5g-shift-evidence.vercel.app";
    process.env.NEXT_PUBLIC_APP_URL = "https://infrashift-r2-recovery-l9ouu5d5g-shift-evidence.vercel.app";

    expect(getCheckoutPublicOrigin(headers({}))).toBe(
      "https://infrashift-r2-recovery-l9ouu5d5g-shift-evidence.vercel.app",
    );
  });

  it("does not trust random Vercel preview URLs by default", () => {
    process.env.PREVIEW_TRUSTED_ORIGINS = "https://allowed-shiftevidence.vercel.app";

    expect(normalizeCheckoutOrigin("https://random-attacker.vercel.app")).toBeNull();
    expect(getCheckoutPublicOrigin(headers({ "x-forwarded-host": "random-attacker.vercel.app" }))).toBe(
      "https://shiftevidence.com",
    );
  });

  it("rejects preview origins with paths in the explicit allowlist", () => {
    process.env.PREVIEW_TRUSTED_ORIGINS = "https://allowed-shiftevidence.vercel.app/path";
    process.env.NEXT_PUBLIC_APP_URL = "https://allowed-shiftevidence.vercel.app";

    expect(getCheckoutPublicOrigin(headers({}))).toBe("https://shiftevidence.com");
  });
});
