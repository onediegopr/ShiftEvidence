import {
  METHODOLOGY_SEED,
  getMethodologySeedVersionId,
  isMethodologyRecordStatus,
} from "./seed";
import type {
  MethodologyAdminNote,
  MethodologyAdminSnapshot,
  MethodologyChangeLogEntry,
  MethodologyDomain,
  MethodologyEmbeddingStatus,
  MethodologyIntendedUse,
  MethodologyKnowledgeChunk,
  MethodologyKnowledgeSearchFilters,
  MethodologyRecordStatus,
  MethodologyRule,
  MethodologyRuleFilters,
  MethodologySourceDocument,
  MethodologyTopic,
  MethodologyVersion,
  MethodologyVersionStatus,
} from "./types";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeList(values?: string[]) {
  return new Set((values ?? []).filter((value) => typeof value === "string" && value.trim().length > 0));
}

function filterByVersion<T extends { versionId: string }>(items: readonly T[], versionId?: string) {
  if (!versionId) {
    return items;
  }
  return items.filter((item) => item.versionId === versionId);
}

function filterByStatuses<T extends { status: MethodologyRecordStatus }>(items: readonly T[], statuses?: MethodologyRecordStatus[]) {
  if (!statuses?.length) {
    return items;
  }
  const allowed = new Set(statuses);
  return items.filter((item) => allowed.has(item.status));
}

function filterByVersionStatus(items: readonly MethodologyVersion[], statuses?: MethodologyVersionStatus[]) {
  if (!statuses?.length) return items;
  const allowed = new Set(statuses);
  return items.filter((item) => allowed.has(item.status));
}

function filterByRuleCodes(items: readonly MethodologyRule[], ruleCodes?: string[]) {
  if (!ruleCodes?.length) return items;
  const allowed = normalizeList(ruleCodes);
  return items.filter((item) => allowed.has(item.ruleCode) || allowed.has(item.id));
}

function filterByTopicIds<T extends { topicId?: string | null }>(items: readonly T[], topicIds?: string[]) {
  if (!topicIds?.length) return items;
  const allowed = normalizeList(topicIds);
  return items.filter((item) => item.topicId && allowed.has(item.topicId));
}

function filterByDomainIds<T extends { domainId?: string | null }>(items: readonly T[], domainIds?: string[]) {
  if (!domainIds?.length) return items;
  const allowed = normalizeList(domainIds);
  return items.filter((item) => item.domainId && allowed.has(item.domainId));
}

function filterBySurface<T extends { usageSurface?: string[] }>(items: readonly T[], surfaces?: string[]) {
  if (!surfaces?.length) return items;
  const allowed = normalizeList(surfaces);
  return items.filter((item) => (item.usageSurface ?? []).some((surface) => allowed.has(surface)));
}

function filterByArrayMembership<T extends { intendedUse?: string; embeddingStatus?: string }>(
  items: readonly T[],
  filters: {
    intendedUses?: MethodologyIntendedUse[];
    embeddingStatuses?: MethodologyEmbeddingStatus[];
  },
) {
  let next = [...items];
  if (filters.intendedUses?.length) {
    const allowedUses = new Set(filters.intendedUses);
    next = next.filter((item) => item.intendedUse && allowedUses.has(item.intendedUse as MethodologyIntendedUse));
  }
  if (filters.embeddingStatuses?.length) {
    const allowedStatuses = new Set(filters.embeddingStatuses);
    next = next.filter((item) => item.embeddingStatus && allowedStatuses.has(item.embeddingStatus as MethodologyEmbeddingStatus));
  }
  return next;
}

export function getActiveMethodologyVersion(): MethodologyVersion {
  return clone(METHODOLOGY_SEED.version);
}

export function listMethodologyVersions(filters?: { statuses?: MethodologyVersionStatus[] }): MethodologyVersion[] {
  return clone([...filterByVersionStatus([METHODOLOGY_SEED.version], filters?.statuses)]);
}

export function listMethodologyDomains(versionId = getMethodologySeedVersionId()): MethodologyDomain[] {
  return clone([...filterByVersion(METHODOLOGY_SEED.domains, versionId)]);
}

export function listMethodologyTopics(versionId = getMethodologySeedVersionId()): MethodologyTopic[] {
  return clone([...filterByVersion(METHODOLOGY_SEED.topics, versionId)]);
}

export function listMethodologyRules(filters: MethodologyRuleFilters = {}): MethodologyRule[] {
  let items = filterByVersion(METHODOLOGY_SEED.rules, filters.versionId ?? getMethodologySeedVersionId());
  items = filterByDomainIds(items, filters.domainIds);
  items = filterByTopicIds(items, filters.topicIds);
  items = filterByStatuses(items, filters.status);
  items = filterByRuleCodes(items, filters.ruleCodes);
  items = filterBySurface(items, filters.usageSurfaces);
  if (filters.severities?.length) {
    const allowed = new Set(filters.severities);
    items = items.filter((item) => allowed.has(item.severity));
  }

  const ordered = [...items].sort((a, b) => a.ruleCode.localeCompare(b.ruleCode));
  const capped = typeof filters.maxResults === "number" && filters.maxResults >= 0 ? ordered.slice(0, filters.maxResults) : ordered;
  return clone(capped);
}

export function getRuleByCode(ruleCode: string) {
  const rule = METHODOLOGY_SEED.rules.find((item) => item.ruleCode === ruleCode);
  return rule ? clone(rule) : null;
}

export function listMethodologyKnowledgeChunks(filters: MethodologyKnowledgeSearchFilters = {}): MethodologyKnowledgeChunk[] {
  let items = filterByVersion(METHODOLOGY_SEED.knowledgeChunks, filters.versionId ?? getMethodologySeedVersionId());
  items = filterByDomainIds(items, filters.domainIds);
  items = filterByTopicIds(items, filters.topicIds);
  items = filterByStatuses(items, filters.status);

  if (filters.sourceDocumentIds?.length) {
    const allowed = normalizeList(filters.sourceDocumentIds);
    items = items.filter((item) => item.sourceDocumentId && allowed.has(item.sourceDocumentId));
  }

  items = filterByArrayMembership(items, {
    intendedUses: filters.intendedUses,
    embeddingStatuses: filters.embeddingStatuses,
  });

  const ordered = [...items].sort((a, b) => a.id.localeCompare(b.id));
  const capped = typeof filters.maxResults === "number" && filters.maxResults >= 0 ? ordered.slice(0, filters.maxResults) : ordered;
  return clone([...capped]);
}

export function listMethodologySourceDocuments(versionId = getMethodologySeedVersionId()): MethodologySourceDocument[] {
  return clone([...filterByVersion(METHODOLOGY_SEED.sourceDocuments, versionId)]);
}

export function listMethodologyChangeLog(versionId = getMethodologySeedVersionId()): MethodologyChangeLogEntry[] {
  return clone(
    [...filterByVersion(METHODOLOGY_SEED.changeLog, versionId)].sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id),
    ),
  );
}

export function listMethodologyAdminNotes(versionId = getMethodologySeedVersionId()): MethodologyAdminNote[] {
  return clone(
    [...filterByVersion(METHODOLOGY_SEED.notes, versionId)].sort(
      (a, b) =>
        b.priority.localeCompare(a.priority) ||
        b.updatedAt.localeCompare(a.updatedAt) ||
        a.title.localeCompare(b.title),
    ),
  );
}

export function getMethodologyAdminSnapshot(): MethodologyAdminSnapshot {
  const version = getActiveMethodologyVersion();
  const domains = listMethodologyDomains(version.id);
  const topics = listMethodologyTopics(version.id);
  const rules = listMethodologyRules({ versionId: version.id, status: ["active"] });
  const knowledgeChunks = listMethodologyKnowledgeChunks({ versionId: version.id, status: ["active"] });
  const sourceDocuments = listMethodologySourceDocuments(version.id);
  const changeLog = listMethodologyChangeLog(version.id);
  const notes = listMethodologyAdminNotes(version.id);

  const embeddingStatuses = new Set(knowledgeChunks.map((chunk) => chunk.embeddingStatus));
  const ragState =
    embeddingStatuses.size === 0
      ? "preparado"
      : embeddingStatuses.has("failed") || embeddingStatuses.has("pending") || embeddingStatuses.has("skipped")
        ? "no indexado"
        : "indexado";

  return {
    version,
    domainCount: domains.length,
    topicCount: topics.length,
    ruleCount: rules.length,
    chunkCount: knowledgeChunks.length,
    sourceDocumentCount: sourceDocuments.length,
    openNoteCount: notes.filter((note) => note.status === "open").length,
    ragState,
    scoringState: "seed",
    advisorState: "preparado",
    pdfState: "preparado",
    domains,
    topics,
    rules,
    knowledgeChunks,
    sourceDocuments,
    changeLog,
    notes,
    featureNotes: [...METHODOLOGY_SEED.featureNotes],
  };
}

export function assertMethodologySeedShape() {
  const version = getActiveMethodologyVersion();
  const rules = listMethodologyRules({ versionId: version.id });
  const invalidCodes = rules.filter((rule) => !isMethodologyRecordStatus(rule.status)).map((rule) => rule.ruleCode);

  return {
    ok: invalidCodes.length === 0,
    invalidCodes,
    version,
  };
}
