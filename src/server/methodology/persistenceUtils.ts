import { prisma } from "../../lib/prisma";
import { getActiveMethodologyVersion, getRuleByCode } from "./registry";
import { INPUT_LIMITS, normalizeOptionalTextInput, normalizeRequiredTextInput } from "../validation/inputLimits";
import type {
  MethodologyNotePriority,
  MethodologyNoteStatus,
  MethodologyReviewItemType,
  MethodologyReviewStatus,
} from "./types";

const SECRET_LIKE_PATTERN =
  /(-----BEGIN|DATABASE_URL|OPENAI_API_KEY|GEMINI_API_KEY|RESEND_API_KEY|HOSTINGER|password\s*=|token\s*=|api[_-]?key\s*=|secret\s*=)/i;
const HTML_LIKE_PATTERN = /<\s*\/?\s*[a-z!]/i;
const SCRIPT_LIKE_PATTERN = /javascript:|data:text\/html/i;

const NOTE_PRIORITY_RANK: Record<MethodologyNotePriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const NOTE_STATUS_RANK: Record<MethodologyNoteStatus, number> = {
  open: 0,
  incorporated: 1,
  dismissed: 2,
  archived: 3,
};

const REVIEW_STATUS_RANK: Record<MethodologyReviewStatus, number> = {
  proposed: 0,
  approved: 1,
  rejected: 2,
  implemented: 3,
  archived: 4,
};

const NOTE_PRIORITIES = new Set<MethodologyNotePriority>(["low", "normal", "high", "critical"]);
const NOTE_STATUSES = new Set<MethodologyNoteStatus>(["open", "incorporated", "dismissed", "archived"]);
const REVIEW_ITEM_TYPES = new Set<MethodologyReviewItemType>([
  "rule",
  "chunk",
  "topic",
  "domain",
  "claim_validator",
  "scoring",
  "advisor",
  "report",
  "checklist",
  "other",
]);
const REVIEW_STATUSES = new Set<MethodologyReviewStatus>([
  "proposed",
  "approved",
  "rejected",
  "implemented",
  "archived",
]);

function assertNoMarkup(value: string, fieldLabel: string) {
  if (HTML_LIKE_PATTERN.test(value) || SCRIPT_LIKE_PATTERN.test(value)) {
    throw new Error(`${fieldLabel} no puede contener HTML ni scripts.`);
  }
}

function assertNoSecrets(value: string, fieldLabel: string) {
  if (SECRET_LIKE_PATTERN.test(value)) {
    throw new Error(`${fieldLabel} appears to include a secret, token, password, or raw credential.`);
  }
}

export function normalizeMethodologyRequiredText(
  value: unknown,
  fieldLabel: string,
  maxLength: number,
): string {
  const normalized = normalizeRequiredTextInput(value, fieldLabel, maxLength);
  assertNoMarkup(normalized, fieldLabel);
  assertNoSecrets(normalized, fieldLabel);
  return normalized;
}

export function normalizeMethodologyOptionalText(
  value: unknown,
  fieldLabel: string,
  maxLength: number,
): string | null {
  const normalized = normalizeOptionalTextInput(value, fieldLabel, maxLength);
  if (!normalized) {
    return null;
  }

  assertNoMarkup(normalized, fieldLabel);
  assertNoSecrets(normalized, fieldLabel);
  return normalized;
}

export function normalizeMethodologyVersionLabel(value?: unknown) {
  return normalizeMethodologyOptionalText(
    value,
    "Version label",
    INPUT_LIMITS.shortText,
  ) ?? getActiveMethodologyVersion().versionLabel;
}

export function normalizeMethodologyTitle(value: unknown) {
  return normalizeMethodologyRequiredText(value, "Title", INPUT_LIMITS.shortText);
}

export function normalizeMethodologyContent(value: unknown) {
  return normalizeMethodologyRequiredText(value, "Content", INPUT_LIMITS.description);
}

export function normalizeMethodologyAssociationKey(value: unknown, fieldLabel: string) {
  return normalizeMethodologyOptionalText(value, fieldLabel, INPUT_LIMITS.shortText);
}

export function normalizeMethodologyRationale(value: unknown, fieldLabel = "Rationale") {
  return normalizeMethodologyOptionalText(value, fieldLabel, INPUT_LIMITS.description);
}

export function normalizeMethodologyChangeSummary(value: unknown) {
  return normalizeMethodologyRequiredText(value, "Summary", INPUT_LIMITS.description);
}

export function normalizeMethodologyChangeType(value: unknown) {
  return normalizeMethodologyRequiredText(value, "Change type", INPUT_LIMITS.shortText);
}

export function normalizeMethodologyEntityType(value: unknown) {
  return normalizeMethodologyRequiredText(value, "Entity type", INPUT_LIMITS.shortText);
}

export function normalizeMethodologyCreatedBy(value: unknown) {
  return normalizeMethodologyOptionalText(value, "Created by", INPUT_LIMITS.shortText);
}

export function parseMethodologyNotePriority(value: unknown, fallback: MethodologyNotePriority = "normal") {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  return NOTE_PRIORITIES.has(raw as MethodologyNotePriority) ? (raw as MethodologyNotePriority) : fallback;
}

export function parseMethodologyNoteStatus(value: unknown, fallback: MethodologyNoteStatus = "open") {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  return NOTE_STATUSES.has(raw as MethodologyNoteStatus) ? (raw as MethodologyNoteStatus) : fallback;
}

export function parseMethodologyReviewItemType(
  value: unknown,
  fallback: MethodologyReviewItemType = "other",
) {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  return REVIEW_ITEM_TYPES.has(raw as MethodologyReviewItemType) ? (raw as MethodologyReviewItemType) : fallback;
}

export function parseMethodologyReviewStatus(value: unknown, fallback: MethodologyReviewStatus = "proposed") {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  return REVIEW_STATUSES.has(raw as MethodologyReviewStatus) ? (raw as MethodologyReviewStatus) : fallback;
}

export const normalizeMethodologyReviewStatus = parseMethodologyReviewStatus;

export function getNoteStatusRank(status: MethodologyNoteStatus) {
  return NOTE_STATUS_RANK[status] ?? NOTE_STATUS_RANK.archived;
}

export function getNotePriorityRank(priority: MethodologyNotePriority) {
  return NOTE_PRIORITY_RANK[priority] ?? NOTE_PRIORITY_RANK.normal;
}

export function getReviewStatusRank(status: MethodologyReviewStatus) {
  return REVIEW_STATUS_RANK[status] ?? REVIEW_STATUS_RANK.archived;
}

export function getMethodologyRuleAssociation(ruleCode?: string | null) {
  if (!ruleCode) {
    return {
      state: "none" as const,
      label: "Sin regla asociada",
      rule: null,
    };
  }

  const rule = getRuleByCode(ruleCode);
  if (!rule) {
    return {
      state: "external" as const,
      label: `${ruleCode} - externa / no encontrada`,
      rule: null,
    };
  }

  return {
    state: "internal" as const,
    label: `${rule.ruleCode} - ${rule.title}`,
    rule,
  };
}

export function getMethodologyNoteAssociationLabel(note: {
  versionLabel?: string | null;
  domainKey?: string | null;
  topicKey?: string | null;
  ruleCode?: string | null;
}) {
  const parts = [
    note.versionLabel ? `Version ${note.versionLabel}` : null,
    note.domainKey ? `Dominio ${note.domainKey}` : null,
    note.topicKey ? `Tema ${note.topicKey}` : null,
    note.ruleCode ? getMethodologyRuleAssociation(note.ruleCode).label : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : "Sin asociacion";
}

export function toIsoString(value: Date | string | null | undefined) {
  if (!value) return "";
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function withMethodologyTransaction<T>(
  db: MethodologyPersistenceDb,
  callback: (tx: MethodologyPersistenceDb) => Promise<T>,
) {
  if ("$transaction" in db && typeof db.$transaction === "function") {
    return db.$transaction((tx) => callback(tx as MethodologyPersistenceDb)) as Promise<T>;
  }

  return callback(db);
}

export function summarizeAssociationFromInput(input: {
  versionLabel?: string | null;
  domainKey?: string | null;
  topicKey?: string | null;
  ruleCode?: string | null;
}) {
  return getMethodologyNoteAssociationLabel(input);
}

export function buildMethodologyChangeKey(input: {
  entityId?: string | null;
  entityKey?: string | null;
  versionLabel: string;
}) {
  return input.entityKey ?? input.entityId ?? input.versionLabel;
}

export function buildMethodologyChangeSummary(summary: string, rationale?: string | null) {
  return rationale ? `${summary} - ${rationale}` : summary;
}

export function getMethodologyReviewDefaultType(note: {
  domainKey?: string | null;
  topicKey?: string | null;
  ruleCode?: string | null;
}) {
  if (note.ruleCode) return "rule" as const;
  if (note.topicKey) return "topic" as const;
  if (note.domainKey) return "domain" as const;
  return "other" as const;
}

export function normalizeMethodologyEntityKey(value: unknown) {
  return normalizeMethodologyOptionalText(value, "Entity key", INPUT_LIMITS.shortText);
}

export function normalizeMethodologyDecisionReason(value: unknown) {
  return normalizeMethodologyOptionalText(value, "Decision reason", INPUT_LIMITS.description);
}

export type MethodologyPersistenceDb = Pick<
  typeof prisma,
  "methodologyAdminNote" | "methodologyReviewItem" | "methodologyChangeLog"
> & {
  $transaction?: (callback: (tx: MethodologyPersistenceDb) => Promise<unknown>) => Promise<unknown>;
};

export function normalizeMethodologyItemKey(value: unknown) {
  return normalizeMethodologyOptionalText(value, "Item key", INPUT_LIMITS.shortText);
}
