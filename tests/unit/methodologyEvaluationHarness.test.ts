import { describe, expect, it } from "vitest";
import {
  GOLDEN_QUESTIONS,
  runMethodologyEvaluationSuite,
} from "../../src/server/advisor/methodology/evaluation";

describe("methodology evaluation harness unit entrypoint", () => {
  it("keeps the golden question suite inside the default unit test run", () => {
    const suite = runMethodologyEvaluationSuite();

    expect(GOLDEN_QUESTIONS).toHaveLength(12);
    expect(suite.ok, suite.results.filter((result) => !result.ok).map((result) => result.summary).join("\n")).toBe(true);
    expect(suite.passed).toBe(12);
    expect(suite.failed).toBe(0);
  });
});
