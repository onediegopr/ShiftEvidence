import { afterEach, describe, expect, it } from "vitest";
import { getCheckoutPublicOrigin, normalizeCheckoutOrigin } from "../../src/server/billing/checkoutOrigin";

const trackedEnvNames = ["NEXT_PUBLIC_APP_URL", "BETTER_AUTH_URL"] as const;
const originalEnv = Object.fromEntries(trackedEnvNames.map((name) => [name, process.env[name]]));

function headers(values: Record<string, string>) {
  return new Headers(values);
}

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
    expect(normalizeCheckoutOrigin("http://localhost:3000")).toBeNull();
  });

  it("rejects untrusted host header values", () => {
    expect(getCheckoutPublicOrigin(headers({ "x-forwarded-host": "evil.example" }))).toBe(
      "https://shiftevidence.com",
    );
  });
});
