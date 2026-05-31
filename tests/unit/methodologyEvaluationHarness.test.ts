import { describe, expect, it } from "vitest";
import {
  GLOBAL_FORBIDDEN_OVERCLAIM_PHRASES,
  GOLDEN_QUESTIONS,
  runMethodologyEvaluationSuite,
} from "../../src/server/advisor/methodology/evaluation";
import { METHODOLOGY_BLOCK_IDS } from "../../src/server/advisor/methodology";

describe("methodology evaluation harness unit entrypoint", () => {
  it("keeps the golden question suite inside the default unit test run", () => {
    const suite = runMethodologyEvaluationSuite();

    expect(GOLDEN_QUESTIONS).toHaveLength(20);
    expect(suite.ok, suite.results.filter((result) => !result.ok).map((result) => result.summary).join("\n")).toBe(true);
    expect(suite.passed).toBe(20);
    expect(suite.failed).toBe(0);
  });

  it("covers every methodology block with at least one golden question expectation", () => {
    const expectedBlockIds = new Set(GOLDEN_QUESTIONS.flatMap((testCase) => testCase.expectedBlockIds));

    expect([...METHODOLOGY_BLOCK_IDS].filter((blockId) => !expectedBlockIds.has(blockId))).toEqual([]);
  });

  it("keeps global anti-overclaiming patterns out of actionable preview guidance", () => {
    const suite = runMethodologyEvaluationSuite();

    expect(GLOBAL_FORBIDDEN_OVERCLAIM_PHRASES.length).toBeGreaterThanOrEqual(10);
    expect(
      suite.results.flatMap((result) =>
        result.globalForbiddenPhraseHits.map((phrase) => `${result.caseId}: ${phrase}`),
      ),
    ).toEqual([]);
  });
});
