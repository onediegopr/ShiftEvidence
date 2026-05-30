import { describe, expect, it } from "vitest";
import {
  containsObviousRawFileContent,
  sanitizeAdvisorMemoryMetadata,
  sanitizeAdvisorMemorySummary,
  sanitizeAdvisorMemoryTags,
  sanitizeAdvisorMemoryTitle,
} from "../../src/server/advisor/advisorMemorySecurity";

describe("advisor memory security", () => {
  it("redacts secrets, tokens and private paths before persistence", () => {
    const sanitized = sanitizeAdvisorMemorySummary(
      "Use password=supersecret and Bearer abcdefghijklmnopqrstuvwxyz123456 from C:\\Users\\diego\\secret.txt",
    );

    expect(sanitized).toContain("password=[REDACTED]");
    expect(sanitized).toContain("Bearer [REDACTED]");
    expect(sanitized).toContain("[REDACTED_PATH]");
    expect(sanitized).not.toContain("supersecret");
  });

  it("normalizes title and tag whitespace", () => {
    expect(sanitizeAdvisorMemoryTitle("  Confirm   target   cluster  ")).toBe("Confirm target cluster");
    expect(sanitizeAdvisorMemoryTags([" Risk ", "risk", "Decision "])).toEqual(["risk", "decision"]);
  });

  it("detects obvious raw file content patterns", () => {
    expect(containsObviousRawFileContent("VM,Powerstate,CPUs,Memory,Provisioned")).toBe(true);
    expect(sanitizeAdvisorMemorySummary("VM,Powerstate,CPUs,Memory,Provisioned")).toBe("[REDACTED_RAW_FILE_CONTENT]");
  });

  it("drops unsafe metadata keys", () => {
    expect(
      sanitizeAdvisorMemoryMetadata({
        module: "storage",
        rawContent: "should not persist",
        apiKey: "secret",
        score: 70,
      }),
    ).toEqual({ module: "storage", score: 70 });
  });
});
