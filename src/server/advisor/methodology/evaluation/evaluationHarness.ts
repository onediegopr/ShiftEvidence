import { buildAdvisorMethodologyContextPreview } from "../methodologyPromptPreview";
import type { MethodologyBlockId } from "../methodologyTypes";
import { GOLDEN_QUESTIONS } from "./goldenQuestions";
import type { EvaluationResult, EvaluationSuiteResult, GoldenQuestionCase } from "./evaluationTypes";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function containsPhrase(text: string, phrase: string) {
  if (phrase.length <= 2 || /[^a-z0-9\s_-]/i.test(phrase)) {
    return text.toLowerCase().includes(phrase.toLowerCase());
  }
  return normalizeText(text).includes(normalizeText(phrase));
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function getNeedsReviewContents(testCase: GoldenQuestionCase) {
  return (testCase.confirmedMemoryItems ?? [])
    .filter((item) => item.status && !["active", "confirmed", "user_confirmed"].includes(normalizeText(item.status)))
    .flatMap((item) => [item.title, item.content])
    .filter(Boolean);
}

function buildFailureSummary(params: {
  testCase: GoldenQuestionCase;
  missingExpectedBlockIds: MethodologyBlockId[];
  matchedExpectedAnyBlockIds: MethodologyBlockId[];
  unexpectedForbiddenBlockIds: MethodologyBlockId[];
  missingGuardrails: string[];
  forbiddenPhraseHits: string[];
  missingExpectedWarnings: string[];
  tokenBudgetOk: boolean;
  restrictedExposureOk: boolean;
  needsReviewExcluded: boolean;
  previewIncluded: boolean;
}) {
  const failures = [
    params.missingExpectedBlockIds.length
      ? `missing expected blocks: ${params.missingExpectedBlockIds.join(", ")}`
      : null,
    params.testCase.expectedAnyBlockIds?.length && params.matchedExpectedAnyBlockIds.length === 0
      ? `missing any-of blocks: ${params.testCase.expectedAnyBlockIds.join(", ")}`
      : null,
    params.unexpectedForbiddenBlockIds.length
      ? `forbidden blocks selected: ${params.unexpectedForbiddenBlockIds.join(", ")}`
      : null,
    params.missingGuardrails.length
      ? `missing guardrails: ${params.missingGuardrails.join(" | ")}`
      : null,
    params.forbiddenPhraseHits.length
      ? `forbidden phrases found: ${params.forbiddenPhraseHits.join(" | ")}`
      : null,
    params.missingExpectedWarnings.length
      ? `missing expected warnings: ${params.missingExpectedWarnings.join(" | ")}`
      : null,
    !params.tokenBudgetOk ? "token budget exceeded or truncation expectation failed" : null,
    !params.restrictedExposureOk ? "restricted block exposure selected" : null,
    !params.needsReviewExcluded ? "needs_review memory appeared in preview" : null,
    params.testCase.shouldIncludeMethodologyContext && !params.previewIncluded
      ? "methodology context was expected but not included"
      : null,
    !params.testCase.shouldIncludeMethodologyContext && params.previewIncluded
      ? "methodology context was included unexpectedly"
      : null,
  ].filter(Boolean);

  return failures.length
    ? `${params.testCase.id} failed: ${failures.join("; ")}`
    : `${params.testCase.id} passed`;
}

export function evaluateGoldenQuestionCase(testCase: GoldenQuestionCase): EvaluationResult {
  const maxTotalPreviewTokens = testCase.maxTotalPreviewTokens ?? 3_500;
  const preview = buildAdvisorMethodologyContextPreview({
    userQuestion: testCase.userQuestion,
    assessmentSummary: testCase.assessmentSummary,
    confirmedMemoryItems: testCase.confirmedMemoryItems,
    retrievalHints: testCase.retrievalHints,
    options: {
      maxMethodologyBlocks: testCase.maxBlocks ?? 3,
      maxTotalPreviewTokens,
    },
  });
  const selectedBlockIds = preview.selectedBlocks.map((block) => block.id);
  const selectedBlockSet = new Set(selectedBlockIds);
  const previewText = [
    preview.previewText,
    preview.sections.methodologyContext,
    preview.sections.guardrails,
  ].join("\n");

  const missingExpectedBlockIds = testCase.expectedBlockIds.filter(
    (blockId) => !selectedBlockSet.has(blockId),
  );
  const matchedExpectedAnyBlockIds = (testCase.expectedAnyBlockIds ?? []).filter((blockId) =>
    selectedBlockSet.has(blockId),
  );
  const unexpectedForbiddenBlockIds = (testCase.forbiddenBlockIds ?? []).filter((blockId) =>
    selectedBlockSet.has(blockId),
  );
  const missingGuardrails = testCase.expectedGuardrailPhrases.filter(
    (phrase) => !containsPhrase(previewText, phrase),
  );
  const forbiddenPhraseHits = testCase.forbiddenPhrases.filter((phrase) =>
    containsPhrase(previewText, phrase),
  );
  const missingExpectedWarnings = (testCase.expectedWarnings ?? []).filter(
    (warning) => !preview.warnings.some((candidate) => containsPhrase(candidate, warning)),
  );
  const tokenBudgetOk =
    preview.tokenEstimate.total <= maxTotalPreviewTokens &&
    (typeof testCase.shouldTruncate !== "boolean" ||
      preview.tokenEstimate.truncated === testCase.shouldTruncate);
  const restrictedExposureOk = preview.selectedBlocks.every(
    (block) => block.exposureLevel !== "restricted",
  );
  const needsReviewExcluded = getNeedsReviewContents(testCase).every(
    (content) => !containsPhrase(previewText, content),
  );
  const previewIncluded =
    preview.selectedBlocks.length > 0 &&
    preview.sections.methodologyContext.trim() !== "Selected methodology guidance: none selected.";

  const ok =
    missingExpectedBlockIds.length === 0 &&
    (!testCase.expectedAnyBlockIds?.length || matchedExpectedAnyBlockIds.length > 0) &&
    unexpectedForbiddenBlockIds.length === 0 &&
    missingGuardrails.length === 0 &&
    forbiddenPhraseHits.length === 0 &&
    missingExpectedWarnings.length === 0 &&
    tokenBudgetOk &&
    restrictedExposureOk &&
    needsReviewExcluded &&
    previewIncluded === testCase.shouldIncludeMethodologyContext;

  return {
    caseId: testCase.id,
    ok,
    selectedBlockIds: unique(selectedBlockIds),
    missingExpectedBlockIds,
    matchedExpectedAnyBlockIds,
    unexpectedForbiddenBlockIds,
    missingGuardrails,
    forbiddenPhraseHits,
    missingExpectedWarnings,
    tokenBudgetOk,
    restrictedExposureOk,
    needsReviewExcluded,
    previewIncluded,
    warnings: preview.warnings,
    blockedReasons: preview.blockedReasons,
    summary: buildFailureSummary({
      testCase,
      missingExpectedBlockIds,
      matchedExpectedAnyBlockIds,
      unexpectedForbiddenBlockIds,
      missingGuardrails,
      forbiddenPhraseHits,
      missingExpectedWarnings,
      tokenBudgetOk,
      restrictedExposureOk,
      needsReviewExcluded,
      previewIncluded,
    }),
    preview,
  };
}

export function runMethodologyEvaluationSuite(
  cases: readonly GoldenQuestionCase[] = GOLDEN_QUESTIONS,
): EvaluationSuiteResult {
  const results = cases.map(evaluateGoldenQuestionCase);
  const passed = results.filter((result) => result.ok).length;
  const failed = results.length - passed;

  return {
    ok: failed === 0,
    total: results.length,
    passed,
    failed,
    results,
  };
}
