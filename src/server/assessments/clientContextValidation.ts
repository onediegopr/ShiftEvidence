import type { ClientContextPlanLimits } from "./clientContextPlanLimits";

export const CLIENT_CONTEXT_ALLOWED_EVIDENCE_EXTENSIONS = [
  ".txt",
  ".csv",
  ".xlsx",
  ".xls",
  ".pdf",
  ".docx",
  ".png",
  ".jpg",
  ".jpeg",
] as const;

export const CLIENT_CONTEXT_ADDITIONAL_EVIDENCE_PURPOSES = [
  "client_context",
  "business_context",
  "technical_evidence",
  "financial_evidence",
  "architecture_diagram",
  "contract_renewal_evidence",
  "unknown_needs_review",
] as const;

export const CLIENT_CONTEXT_ADDITIONAL_EVIDENCE_CLASSIFICATIONS = [
  "business_context",
  "technical_evidence",
  "financial_evidence",
  "architecture_diagram",
  "contract_renewal_evidence",
  "unknown_needs_review",
] as const;

export type ClientContextAdditionalEvidencePurpose =
  (typeof CLIENT_CONTEXT_ADDITIONAL_EVIDENCE_PURPOSES)[number];

export type ClientContextAdditionalEvidenceClassification =
  (typeof CLIENT_CONTEXT_ADDITIONAL_EVIDENCE_CLASSIFICATIONS)[number];

export type ValidatedClientContextText = {
  rawText: string;
  wordCount: number;
  characterCount: number;
  truncated: false;
};

function normalizeWhitespaceForCount(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeClientContextRawText(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

export function countClientContextWords(value: string) {
  const normalized = normalizeWhitespaceForCount(value);
  if (!normalized) {
    return 0;
  }

  return normalized.split(" ").filter(Boolean).length;
}

export function countClientContextCharacters(value: string) {
  return value.length;
}

export function validateClientContextText(params: {
  rawText: FormDataEntryValue | string | null | undefined;
  limits: ClientContextPlanLimits;
  allowEmpty?: boolean;
}): ValidatedClientContextText {
  const rawText = normalizeClientContextRawText(params.rawText);
  const wordCount = countClientContextWords(rawText);
  const characterCount = countClientContextCharacters(rawText);

  if (!params.allowEmpty && wordCount === 0) {
    throw new Error("Client context cannot be empty. Add context or skip this optional module.");
  }

  if (wordCount > params.limits.maxWords) {
    throw new Error(
      `Client context is over the ${params.limits.maxWords.toLocaleString("en-US")} word limit for this plan.`,
    );
  }

  if (characterCount > params.limits.maxCharacters) {
    throw new Error(
      `Client context is over the ${params.limits.maxCharacters.toLocaleString("en-US")} character limit for this plan.`,
    );
  }

  return {
    rawText,
    wordCount,
    characterCount,
    truncated: false,
  };
}

function normalizeEnumValue(value: FormDataEntryValue | string | null | undefined) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function parseAdditionalEvidencePurpose(
  value: FormDataEntryValue | string | null | undefined,
): ClientContextAdditionalEvidencePurpose {
  const normalized = normalizeEnumValue(value) || "client_context";
  if (!CLIENT_CONTEXT_ADDITIONAL_EVIDENCE_PURPOSES.includes(normalized as ClientContextAdditionalEvidencePurpose)) {
    throw new Error("Unsupported additional evidence purpose.");
  }

  return normalized as ClientContextAdditionalEvidencePurpose;
}

export function parseAdditionalEvidenceClassification(
  value: FormDataEntryValue | string | null | undefined,
): ClientContextAdditionalEvidenceClassification {
  const normalized = normalizeEnumValue(value) || "unknown_needs_review";
  if (!CLIENT_CONTEXT_ADDITIONAL_EVIDENCE_CLASSIFICATIONS.includes(normalized as ClientContextAdditionalEvidenceClassification)) {
    throw new Error("Unsupported additional evidence classification.");
  }

  return normalized as ClientContextAdditionalEvidenceClassification;
}

export function isClientContextAllowedExtension(extension: string) {
  return CLIENT_CONTEXT_ALLOWED_EVIDENCE_EXTENSIONS.includes(
    extension.trim().toLowerCase() as (typeof CLIENT_CONTEXT_ALLOWED_EVIDENCE_EXTENSIONS)[number],
  );
}

export function validateAdditionalEvidenceFileLimit(params: {
  existingFileCount: number;
  limits: ClientContextPlanLimits;
}) {
  if (!params.limits.additionalEvidenceEnabled || params.limits.maxFiles <= 0) {
    throw new Error("Additional evidence files are not enabled for this plan.");
  }

  if (params.existingFileCount >= params.limits.maxFiles) {
    throw new Error(
      `This plan allows up to ${params.limits.maxFiles} additional evidence file${params.limits.maxFiles === 1 ? "" : "s"}.`,
    );
  }
}

export function validateAdditionalEvidenceExtension(extension: string) {
  if (!isClientContextAllowedExtension(extension)) {
    throw new Error("Unsupported additional evidence file type for client context.");
  }
}

export function buildClientContextAuditMetadata(params: {
  wordCount?: number | null;
  characterCount?: number | null;
  status?: string | null;
  planLimitWords?: number | null;
  planLimitFiles?: number | null;
  additionalEvidenceId?: string | null;
  evidenceFileId?: string | null;
  classification?: string | null;
  includedInContextAnalysis?: boolean | null;
}) {
  return {
    wordCount: params.wordCount ?? 0,
    characterCount: params.characterCount ?? 0,
    status: params.status ?? null,
    planLimitWords: params.planLimitWords ?? null,
    planLimitFiles: params.planLimitFiles ?? null,
    additionalEvidenceId: params.additionalEvidenceId ?? null,
    evidenceFileId: params.evidenceFileId ?? null,
    classification: params.classification ?? null,
    includedInContextAnalysis: params.includedInContextAnalysis ?? null,
  };
}
