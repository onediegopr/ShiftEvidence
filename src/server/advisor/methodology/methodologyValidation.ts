import {
  METHODOLOGY_BLOCK_IDS,
  METHODOLOGY_BLOCK_STATUSES,
  METHODOLOGY_DOMAINS,
  METHODOLOGY_EXPOSURE_LEVELS,
  METHODOLOGY_USE_CASES,
  type MethodologyBlock,
  type MethodologyRegistryValidationResult,
} from "./methodologyTypes";

const SEMVER_LIKE_PATTERN = /^\d+\.\d+\.\d+$/;

export const METHODOLOGY_BANNED_CONTENT_PATTERNS = [
  /\bAPI\s*key\b/i,
  /\bpassword\s*=/i,
  /\bsecret\s*=/i,
  /\bprivate\s+key\b/i,
  /\btoken\s*=/i,
  /\braw\s+customer\b/i,
  /\bclient\s+confidential\b/i,
  /\bconnection\s+string\b/i,
  /\bDATABASE_URL\b/i,
  /\bGEMINI_API_KEY\b/i,
  /\bOPENCODE_API_KEY\b/i,
] as const;

const VALID_IDS = new Set<string>(METHODOLOGY_BLOCK_IDS);
const VALID_EXPOSURE_LEVELS = new Set<string>(METHODOLOGY_EXPOSURE_LEVELS);
const VALID_DOMAINS = new Set<string>(METHODOLOGY_DOMAINS);
const VALID_USE_CASES = new Set<string>(METHODOLOGY_USE_CASES);
const VALID_STATUSES = new Set<string>(METHODOLOGY_BLOCK_STATUSES);

function hasText(value: string) {
  return value.trim().length > 0;
}

function normalizedArray(values: string[]) {
  return values.map((value) => value.trim().toLowerCase()).filter(Boolean);
}

function pushBannedContentErrors(params: {
  errors: string[];
  block: MethodologyBlock;
}) {
  const searchable = [
    params.block.title,
    params.block.summary,
    params.block.content,
    params.block.source,
    params.block.tags.join(" "),
    params.block.keywords.join(" "),
  ].join("\n");

  for (const pattern of METHODOLOGY_BANNED_CONTENT_PATTERNS) {
    if (pattern.test(searchable)) {
      params.errors.push(`Block ${params.block.id} contains banned content pattern ${pattern}.`);
    }
  }
}

export function validateMethodologyRegistry(
  blocks: readonly MethodologyBlock[],
): MethodologyRegistryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();
  const blockIds = new Set(blocks.map((block) => block.id));

  for (const block of blocks) {
    if (!VALID_IDS.has(block.id)) {
      errors.push(`Unknown methodology block id: ${block.id}.`);
    }

    if (seenIds.has(block.id)) {
      errors.push(`Duplicate methodology block id: ${block.id}.`);
    }
    seenIds.add(block.id);

    if (!SEMVER_LIKE_PATTERN.test(block.version)) {
      errors.push(`Block ${block.id} has invalid version ${block.version}.`);
    }

    if (!hasText(block.title)) {
      errors.push(`Block ${block.id} is missing title.`);
    }

    if (!hasText(block.summary)) {
      errors.push(`Block ${block.id} is missing summary.`);
    }

    if (!hasText(block.content)) {
      errors.push(`Block ${block.id} is missing content.`);
    }

    if (!VALID_DOMAINS.has(block.domain)) {
      errors.push(`Block ${block.id} has invalid domain ${block.domain}.`);
    }

    if (!VALID_EXPOSURE_LEVELS.has(block.exposureLevel)) {
      errors.push(`Block ${block.id} has invalid exposure level ${block.exposureLevel}.`);
    }

    if (!VALID_STATUSES.has(block.status)) {
      errors.push(`Block ${block.id} has invalid status ${block.status}.`);
    }

    const tags = normalizedArray(block.tags);
    const keywords = normalizedArray(block.keywords);

    if (tags.length === 0) {
      errors.push(`Block ${block.id} must define at least one tag.`);
    }

    if (keywords.length === 0) {
      errors.push(`Block ${block.id} must define at least one keyword.`);
    }

    if (new Set(tags).size !== tags.length) {
      warnings.push(`Block ${block.id} has duplicate tags after normalization.`);
    }

    if (new Set(keywords).size !== keywords.length) {
      warnings.push(`Block ${block.id} has duplicate keywords after normalization.`);
    }

    for (const useCase of block.allowedUse) {
      if (!VALID_USE_CASES.has(useCase)) {
        errors.push(`Block ${block.id} has invalid use case ${useCase}.`);
      }
    }

    for (const relatedBlockId of block.relatedBlockIds) {
      if (!blockIds.has(relatedBlockId)) {
        errors.push(`Block ${block.id} references missing related block ${relatedBlockId}.`);
      }
    }

    if (block.exposureLevel === "restricted" && block.status === "active") {
      warnings.push(`Block ${block.id} is active and restricted; retrieval must explicitly allow it.`);
    }

    pushBannedContentErrors({ errors, block });
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    blockCount: blocks.length,
    activeBlockCount: blocks.filter((block) => block.status === "active").length,
  };
}
