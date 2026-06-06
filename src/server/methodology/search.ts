import { listMethodologyKnowledgeChunks, listMethodologyRules } from "./registry";
import type {
  MethodologyKnowledgeChunk,
  MethodologyKnowledgeSearchFilters,
  MethodologyKnowledgeSearchResult,
  MethodologyRule,
  MethodologyRuleSearchFilters,
  MethodologyRuleSearchResult,
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
  if (index < 0) return token;
  const start = Math.max(0, index - 35);
  const end = Math.min(content.length, index + token.length + 55);
  return content.slice(start, end).replace(/\s+/g, " ").trim();
}

function scoreExactMatch(value: string, query: string, exactScore: number, partialScore: number) {
  const normalizedValue = normalizeText(value);
  const normalizedQuery = normalizeText(query);
  const compactValue = normalizeCompact(value);
  const compactQuery = normalizeCompact(query);

  if (!normalizedValue || !normalizedQuery) {
    return 0;
  }

  if (compactQuery && compactValue === compactQuery) {
    return exactScore;
  }

  if (normalizedQuery === normalizedValue || normalizedValue.includes(normalizedQuery) || normalizedQuery.includes(normalizedValue)) {
    return partialScore;
  }

  return 0;
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

  if (scoreExactMatch(chunk.title, query, 18, 10) > 0) {
    score += scoreExactMatch(chunk.title, query, 18, 10);
    matchedTerms.add(chunk.title);
  }

  if (scoreExactMatch(chunk.chunkKey, query, 16, 8) > 0) {
    score += scoreExactMatch(chunk.chunkKey, query, 16, 8);
    matchedTerms.add(chunk.chunkKey);
  }

  if (compactQuery && normalizeCompact(chunk.chunkKey) === compactQuery) {
    score += 18;
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
    score += 14;
    matchedTerms.add(chunk.relatedRuleCodes[0] ?? "rule-code");
  }

  const matchedRuleCodes = (chunk.relatedRuleCodes ?? []).filter((ruleCode) => {
    const compactRule = normalizeCompact(ruleCode);
    return compactQuery === compactRule || tokens.some((token) => normalizeText(ruleCode).includes(token));
  });

  const matchedText = [...matchedTerms][0] ?? normalizedQuery;
  const reason =
    matchedTerms.size > 0
      ? `Matched ${matchedTerms.size} term${matchedTerms.size === 1 ? "" : "s"} around "${snippetFromContent(chunk.content, matchedText)}".`
      : "No direct textual match.";

  return {
    score,
    matchedTerms: [...matchedTerms],
    matchedRuleCodes,
    reason,
  };
}

function scoreRule(rule: MethodologyRule, query: string) {
  const normalizedQuery = normalizeText(query);
  const compactQuery = normalizeCompact(query);
  const tokens = tokenize(query);
  const haystack = normalizeText(
    [
      rule.ruleCode,
      rule.title,
      rule.conditionText,
      rule.impact,
      rule.remediation,
      rule.scoringImpact,
      rule.confidenceImpact,
      rule.automationPotential,
      rule.sourceSection,
      rule.evidenceRequired.join(" "),
      rule.domainId,
      rule.topicId ?? "",
    ].join(" "),
  );

  if (!normalizedQuery) {
    return {
      score: 0,
      matchedTerms: [] as string[],
      reason: "Default ordered rule.",
    };
  }

  let score = 0;
  const matchedTerms = new Set<string>();

  const codeScore = scoreExactMatch(rule.ruleCode, query, 50, 24);
  if (codeScore > 0) {
    score += codeScore;
    matchedTerms.add(rule.ruleCode);
  }

  const titleScore = scoreExactMatch(rule.title, query, 22, 12);
  if (titleScore > 0) {
    score += titleScore;
    matchedTerms.add(rule.title);
  }

  const domainScore = scoreExactMatch(rule.domainId, query, 12, 6);
  if (domainScore > 0) {
    score += domainScore;
    matchedTerms.add(rule.domainId);
  }

  const severityScore = scoreExactMatch(rule.severity, query, 8, 4);
  if (severityScore > 0) {
    score += severityScore;
    matchedTerms.add(rule.severity);
  }

  for (const token of tokens) {
    if (!haystack.includes(token)) {
      continue;
    }

    score += 2;
    matchedTerms.add(token);

    if (normalizeText(rule.title).includes(token)) {
      score += 2;
    }

    if (rule.evidenceRequired.some((evidence) => normalizeText(evidence).includes(token))) {
      score += 2;
    }

    if (normalizeText(rule.conditionText).includes(token)) {
      score += 1;
    }

    if (normalizeText(rule.impact).includes(token)) {
      score += 1;
    }
  }

  if (compactQuery && normalizeCompact(rule.ruleCode) === compactQuery) {
    score += 30;
    matchedTerms.add(rule.ruleCode);
  }

  const matchedText = [...matchedTerms][0] ?? normalizedQuery;
  const reason =
    matchedTerms.size > 0
      ? `Matched ${matchedTerms.size} term${matchedTerms.size === 1 ? "" : "s"} around "${matchedText}".`
      : "No direct textual match.";

  return {
    score,
    matchedTerms: [...matchedTerms],
    reason,
  };
}

function resolveSearchQuery(query: string, text?: string) {
  return [query, text].filter(Boolean).join(" ").trim();
}

export function searchMethodologyKnowledge(
  query: string,
  filters: MethodologyKnowledgeSearchFilters = {},
): MethodologyKnowledgeSearchResult {
  const searchQuery = resolveSearchQuery(query, filters.text);
  const maxResults = Math.min(Math.max(filters.maxResults ?? DEFAULT_MAX_RESULTS, 0), HARD_MAX_RESULTS);
  const chunks = listMethodologyKnowledgeChunks({
    ...filters,
    maxResults: undefined,
  });

  if (!searchQuery) {
    const hits = chunks.slice(0, maxResults).map((chunk) => ({
      chunk,
      score: 0,
      matchedTerms: [],
      matchedRuleCodes: [...(chunk.relatedRuleCodes ?? [])],
      reason: "Default ordered chunk.",
    }));

    return {
      query: searchQuery,
      total: chunks.length,
      hits,
    };
  }

  const scored = chunks
    .map((chunk) => ({
      chunk,
      ...scoreChunk(chunk, searchQuery),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id))
    .slice(0, maxResults);

  return {
    query: searchQuery,
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

export function searchMethodologyRules(
  query: string,
  filters: MethodologyRuleSearchFilters = {},
): MethodologyRuleSearchResult {
  const searchQuery = resolveSearchQuery(query, filters.text);
  const maxResults = Math.min(Math.max(filters.maxResults ?? DEFAULT_MAX_RESULTS, 0), HARD_MAX_RESULTS);
  const rules = listMethodologyRules({
    versionId: filters.versionId,
    domainIds: filters.domainIds,
    topicIds: filters.topicIds,
    severities: filters.severities,
    status: filters.status,
    ruleCodes: filters.ruleCodes,
    usageSurfaces: filters.usageSurfaces,
    maxResults: undefined,
  });

  if (!searchQuery) {
    const hits = rules.slice(0, maxResults).map((rule) => ({
      rule,
      score: 0,
      matchedTerms: [],
      reason: "Default ordered rule.",
    }));

    return {
      query: searchQuery,
      total: rules.length,
      hits,
    };
  }

  const scored = rules
    .map((rule) => ({
      rule,
      ...scoreRule(rule, searchQuery),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.rule.ruleCode.localeCompare(b.rule.ruleCode))
    .slice(0, maxResults);

  return {
    query: searchQuery,
    total: scored.length,
    hits: scored.map(({ rule, score, matchedTerms, reason }) => ({
      rule,
      score,
      matchedTerms,
      reason,
    })),
  };
}
