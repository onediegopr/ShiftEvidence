import { describe, expect, it } from "vitest";
import {
  assertMaxLength,
  INPUT_LIMITS,
  normalizeOptionalTextInput,
  normalizeRequiredTextInput,
  normalizeTextInput,
} from "../../src/server/validation/inputLimits";

describe("input length guards", () => {
  it("defines expected generous text limits", () => {
    expect(INPUT_LIMITS.companyName).toBe(216);
    expect(INPUT_LIMITS.assessmentTitle).toBe(288);
    expect(INPUT_LIMITS.description).toBe(3600);
    expect(INPUT_LIMITS.notes).toBe(3600);
    expect(INPUT_LIMITS.comment).toBe(3600);
    expect(INPUT_LIMITS.manualTechnicalContext).toBe(9000);
    expect(INPUT_LIMITS.email).toBe(320);
    expect(INPUT_LIMITS.url).toBe(2048);
    expect(INPUT_LIMITS.currency).toBe(12);
  });

  it("normalizes strings with trim and safely handles non-strings", () => {
    expect(normalizeTextInput("  ACME  ")).toBe("ACME");
    expect(normalizeTextInput(null)).toBe("");
    expect(normalizeTextInput(123)).toBe("");
  });

  it("allows text below and equal to the max length", () => {
    expect(() => assertMaxLength("a".repeat(10), 10, "Field")).not.toThrow();
    expect(() => assertMaxLength("a".repeat(9), 10, "Field")).not.toThrow();
  });

  it("rejects text above the max length with a safe error", () => {
    expect(() => assertMaxLength("a".repeat(11), 10, "Field")).toThrow(
      "Field must be 10 characters or less.",
    );
  });

  it("normalizes optional and required text inputs", () => {
    expect(normalizeOptionalTextInput("  ", "Notes", INPUT_LIMITS.notes)).toBeNull();
    expect(normalizeOptionalTextInput("  hello  ", "Notes", INPUT_LIMITS.notes)).toBe("hello");
    expect(normalizeRequiredTextInput("  title  ", "Assessment title", INPUT_LIMITS.assessmentTitle)).toBe("title");
    expect(() => normalizeRequiredTextInput("  ", "Assessment title", INPUT_LIMITS.assessmentTitle)).toThrow(
      "Assessment title is required.",
    );
  });
});
