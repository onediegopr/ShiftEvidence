import { listMethodologyKnowledgeChunks } from "./registry";
import type {
  MethodologyKnowledgeChunk,
  MethodologyKnowledgeSearchFilters,
  MethodologyKnowledgeSearchResult,
} from "./types";

const DEFAULT_MAX_RESULTS = 5;
const HARD_MAX_RESULTS = 12;

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCompact(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function tokenize(value: string) {
  return [...new Set(normalizeText(value).split(" ").filter((token) => token.length >= 2))];
}

function snippetFromContent(content: string, token: string) {
  const index = content.indexOf(token);
  if (index < 0) {
    return token;
  }
  const start = Math.max(0, index - 35);
  const end = Math.min(content.length, index + token.length + 55);
  return content.slice(start, end).replace(/\s+/g, " ").trim();
}

function scoreChunk(chunk: MethodologyKnowledgeChunk, query: string) {
  const normalizedQuery = normalizeText(query);
  const compactQuery = normalizeCompact(query);
  const tokens = tokenize(query);
  const haystack = normalizeText(
    [
      chunk.title,
      chunk.content,
      chunk.tags.join(" "),
      chunk.relatedRuleCodes?.join(" ") ?? "",
      chunk.chunkKey,
    ].join(" "),
  );

  if (!normalizedQuery) {
    return {
      score: 0,
      matchedTerms: [] as string[],
      matchedRuleCodes: [...(chunk.relatedRuleCodes ?? [])],
      reason: "Default ordered chunk.",
    };
  }

  let score = 0;
  const matchedTerms = new Set<string>();

  if (normalizeText(chunk.title) && normalizedQuery.includes(normalizeText(chunk.title))) {
    score += 12;
    matchedTerms.add(chunk.title);
  }

  if (normalizeText(chunk.chunkKey) && normalizedQuery.includes(normalizeText(chunk.chunkKey))) {
    score += 10;
    matchedTerms.add(chunk.chunkKey);
  }

  if (compactQuery && normalizeCompact(chunk.chunkKey) === compactQuery) {
    score += 14;
    matchedTerms.add(chunk.chunkKey);
  }

  for (const token of tokens) {
    if (!haystack.includes(token)) {
      continue;
    }
    score += 2;
    matchedTerms.add(token);

    if (normalizeText(chunk.title).includes(token)) {
      score += 2;
    }

    if (chunk.tags.some((tag) => normalizeText(tag).includes(token))) {
      score += 3;
    }

    if (chunk.content.toLowerCase().includes(token)) {
      score += 1;
    }

    if (chunk.relatedRuleCodes?.some((ruleCode) => normalizeCompact(ruleCode) === compactQuery || normalizeText(ruleCode).includes(token))) {
      score += 4;
    }
  }

  if (chunk.relatedRuleCodes?.some((ruleCode) => compactQuery && normalizeCompact(ruleCode) === compactQuery)) {
    score += 12;
    matchedTerms.add(chunk.relatedRuleCodes[0] ?? "rule-code");
  }

  const matchedRuleCodes = (chunk.relatedRuleCodes ?? []).filter((ruleCode) => {
    const compactRule = normalizeCompact(ruleCode);
    return compactQuery === compactRule || tokens.some((token) => normalizeText(ruleCode).includes(token));
  });

  const matchedText = [...matchedTerms][0] ?? normalizedQuery;
  const reason = matchedTerms.size > 0
    ? `Matched ${matchedTerms.size} term${matchedTerms.size === 1 ? "" : "s"} around "${snippetFromContent(chunk.content, matchedText)}".`
    : "No direct textual match.";

  return {
    score,
    matchedTerms: [...matchedTerms],
    matchedRuleCodes,
    reason,
  };
}

export function searchMethodologyKnowledge(
  query: string,
  filters: MethodologyKnowledgeSearchFilters = {},
): MethodologyKnowledgeSearchResult {
  const maxResults = Math.min(
    Math.max(filters.maxResults ?? DEFAULT_MAX_RESULTS, 0),
    HARD_MAX_RESULTS,
  );
  const chunks = listMethodologyKnowledgeChunks({
    ...filters,
    maxResults: undefined,
  });

  if (!query.trim()) {
    const hits = chunks.slice(0, maxResults).map((chunk) => ({
      chunk,
      score: 0,
      matchedTerms: [],
      matchedRuleCodes: [...(chunk.relatedRuleCodes ?? [])],
      reason: "Default ordered chunk.",
    }));

    return {
      query,
      total: chunks.length,
      hits,
    };
  }

  const scored = chunks
    .map((chunk) => ({
      chunk,
      ...scoreChunk(chunk, query),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id))
    .slice(0, maxResults);

  return {
    query,
    total: scored.length,
    hits: scored.map(({ chunk, score, matchedTerms, matchedRuleCodes, reason }) => ({
      chunk,
      score,
      matchedTerms,
      matchedRuleCodes: [...new Set([...(chunk.relatedRuleCodes ?? []), ...matchedRuleCodes])],
      reason,
    })),
  };
}
