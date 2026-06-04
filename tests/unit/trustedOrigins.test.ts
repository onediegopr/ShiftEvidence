import { afterEach, describe, expect, it } from "vitest";
import {
  getAuthTrustedOrigins,
  isTrustedAppOrigin,
  normalizeOrigin,
  parseOriginList,
} from "../../src/server/security/trustedOrigins";

const originalPreviewTrustedOrigins = process.env.PREVIEW_TRUSTED_ORIGINS;

afterEach(() => {
  if (originalPreviewTrustedOrigins === undefined) {
    delete process.env.PREVIEW_TRUSTED_ORIGINS;
  } else {
    process.env.PREVIEW_TRUSTED_ORIGINS = originalPreviewTrustedOrigins;
  }
});

describe("trusted origins policy", () => {
  it("parses empty env as an empty preview allowlist", () => {
    expect(parseOriginList(undefined)).toEqual([]);
    expect(parseOriginList("")).toEqual([]);
  });

  it("parses a single explicit preview origin", () => {
    expect(parseOriginList("https://preview-shiftevidence.vercel.app")).toEqual([
      "https://preview-shiftevidence.vercel.app",
    ]);
  });

  it("parses multiple origins with trimming and de-duplication", () => {
    expect(
      parseOriginList(
        " https://one-shiftevidence.vercel.app,https://two-shiftevidence.vercel.app, https://one-shiftevidence.vercel.app ",
      ),
    ).toEqual(["https://one-shiftevidence.vercel.app", "https://two-shiftevidence.vercel.app"]);
  });

  it("rejects wildcards, invalid URLs, paths, and non-localhost http", () => {
    expect(normalizeOrigin("https://*.vercel.app")).toBeNull();
    expect(normalizeOrigin("not a url")).toBeNull();
    expect(normalizeOrigin("https://preview-shiftevidence.vercel.app/path")).toBeNull();
    expect(normalizeOrigin("http://preview-shiftevidence.vercel.app")).toBeNull();
  });

  it("allows localhost http origins for local development only", () => {
    expect(normalizeOrigin("http://localhost:3000")).toBe("http://localhost:3000");
    expect(normalizeOrigin("http://127.0.0.1:3000")).toBe("http://127.0.0.1:3000");
  });

  it("includes production, localhost, and explicit preview origins for auth", () => {
    process.env.PREVIEW_TRUSTED_ORIGINS = "https://infrashift-r2-recovery-l9ouu5d5g-shift-evidence.vercel.app";

    expect(getAuthTrustedOrigins()).toEqual(
      expect.arrayContaining([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://shiftevidence.com",
        "https://www.shiftevidence.com",
        "https://infrashift-r2-recovery-l9ouu5d5g-shift-evidence.vercel.app",
      ]),
    );
  });

  it("trusts only explicitly listed preview origins", () => {
    process.env.PREVIEW_TRUSTED_ORIGINS = "https://allowed-shiftevidence.vercel.app";

    expect(isTrustedAppOrigin("https://allowed-shiftevidence.vercel.app")).toBe(true);
    expect(isTrustedAppOrigin("https://random-attacker.vercel.app")).toBe(false);
    expect(isTrustedAppOrigin("https://evil.example")).toBe(false);
  });
});
