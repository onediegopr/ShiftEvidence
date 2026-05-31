import { getActiveMethodologyBlocks } from "./methodologyRegistry";
import type {
  MethodologyBlock,
  MethodologyExposureLevel,
  MethodologyRetrievalInput,
  MethodologyRetrievalReason,
  MethodologyRetrievalResult,
} from "./methodologyTypes";

const DEFAULT_MAX_BLOCKS = 3;
const HARD_MAX_BLOCKS = 5;
const DEFAULT_EXPOSURE_LEVELS: MethodologyExposureLevel[] = ["public", "advisor_internal"];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeList(values: readonly string[] | undefined) {
  return new Set((values ?? []).map(normalizeText).filter(Boolean));
}

function textContainsPhrase(haystack: string, needle: string) {
  const normalizedNeedle = normalizeText(needle);
  if (!normalizedNeedle) return false;

  if (haystack.includes(normalizedNeedle)) {
    return true;
  }

  const words = normalizedNeedle.split(" ").filter((word) => word.length > 2);
  return words.length > 1 && words.every((word) => haystack.includes(word));
}

function getAllowedExposureLevels(input: MethodologyRetrievalInput) {
  const explicit = input.allowedExposureLevels ?? DEFAULT_EXPOSURE_LEVELS;
  if (!input.includeRestricted || explicit.includes("restricted")) {
    return explicit;
  }
  return [...explicit, "restricted"];
}

function scoreBlock(params: {
  block: MethodologyBlock;
  normalizedQuery: string;
  tags: Set<string>;
  useCases: Set<string>;
  domains: Set<string>;
}): MethodologyRetrievalReason | null {
  const matchedTags = params.block.tags.filter((tag) => {
    const normalized = normalizeText(tag);
    return params.tags.has(normalized) || textContainsPhrase(params.normalizedQuery, normalized);
  });
  const matchedKeywords = params.block.keywords.filter((keyword) =>
    textContainsPhrase(params.normalizedQuery, keyword),
  );
  const matchedUseCases = params.block.allowedUse.filter((useCase) =>
    params.useCases.has(normalizeText(useCase)),
  );
  const matchedDomains = params.domains.has(normalizeText(params.block.domain))
    ? [params.block.domain]
    : [];

  const score =
    matchedTags.length * 8 +
    matchedKeywords.length * 3 +
    matchedUseCases.length * 6 +
    matchedDomains.length * 5;

  if (score <= 0) {
    return null;
  }

  return {
    blockId: params.block.id,
    matchedTags,
    matchedKeywords,
    matchedUseCases,
    matchedDomains,
    score,
  };
}

export function selectMethodologyBlocks(
  input: MethodologyRetrievalInput,
): MethodologyRetrievalResult {
  const warnings: string[] = [];
  const requestedMaxBlocks = input.maxBlocks ?? DEFAULT_MAX_BLOCKS;
  const maxBlocks = Math.min(Math.max(requestedMaxBlocks, 0), HARD_MAX_BLOCKS);
  if (requestedMaxBlocks > HARD_MAX_BLOCKS) {
    warnings.push(`maxBlocks capped at ${HARD_MAX_BLOCKS}.`);
  }

  if (!input.query.trim() && !input.tags?.length && !input.useCases?.length && !input.domains?.length) {
    return {
      selectedBlocks: [],
      reasons: [],
      warnings: ["No query, tags, domains or use cases were provided."],
    };
  }

  const allowedExposureLevels = getAllowedExposureLevels(input);
  const normalizedQuery = normalizeText(input.query);
  const tags = normalizeList(input.tags);
  const useCases = normalizeList(input.useCases);
  const domains = normalizeList(input.domains);
  const blocks = getActiveMethodologyBlocks().filter((block) =>
    allowedExposureLevels.includes(block.exposureLevel),
  );
  const scored = blocks
    .map((block) => {
      const reason = scoreBlock({
        block,
        normalizedQuery,
        tags,
        useCases,
        domains,
      });
      return reason ? { block, reason } : null;
    })
    .filter((item): item is { block: MethodologyBlock; reason: MethodologyRetrievalReason } => item !== null)
    .sort((a, b) => {
      if (b.reason.score !== a.reason.score) {
        return b.reason.score - a.reason.score;
      }
      return a.block.id.localeCompare(b.block.id);
    })
    .slice(0, maxBlocks);

  return {
    selectedBlocks: scored.map((item) => item.block),
    reasons: scored.map((item) => item.reason),
    warnings,
  };
}
