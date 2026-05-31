import type {
  AdvisorMethodologyContextPreview,
  AdvisorMethodologyContextPreviewInput,
} from "../methodologyPromptPreview";
import type { MethodologyBlockId } from "../methodologyTypes";

export type GoldenQuestionCase = {
  id: string;
  title: string;
  userQuestion: string;
  assessmentSummary?: AdvisorMethodologyContextPreviewInput["assessmentSummary"];
  confirmedMemoryItems?: AdvisorMethodologyContextPreviewInput["confirmedMemoryItems"];
  retrievalHints?: AdvisorMethodologyContextPreviewInput["retrievalHints"];
  expectedBlockIds: MethodologyBlockId[];
  expectedAnyBlockIds?: MethodologyBlockId[];
  forbiddenBlockIds?: MethodologyBlockId[];
  expectedGuardrailPhrases: string[];
  forbiddenPhrases: string[];
  expectedWarnings?: string[];
  maxBlocks?: number;
  maxTotalPreviewTokens?: number;
  shouldIncludeMethodologyContext: boolean;
  shouldTruncate?: boolean;
  notes?: string;
};

export type EvaluationResult = {
  caseId: string;
  ok: boolean;
  selectedBlockIds: MethodologyBlockId[];
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
  warnings: string[];
  blockedReasons: string[];
  summary: string;
  preview: AdvisorMethodologyContextPreview;
};

export type EvaluationSuiteResult = {
  ok: boolean;
  total: number;
  passed: number;
  failed: number;
  results: EvaluationResult[];
};
