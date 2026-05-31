import { METHODOLOGY_BLOCKS } from "./methodologyBlocks";
import { validateMethodologyRegistry } from "./methodologyValidation";
import type {
  MethodologyBlock,
  MethodologyBlockId,
  MethodologyDomain,
  MethodologyExposureLevel,
  MethodologyRegistryListOptions,
} from "./methodologyTypes";

function normalizeToken(value: string) {
  return value.trim().toLowerCase();
}

function applyListOptions(
  blocks: readonly MethodologyBlock[],
  options: MethodologyRegistryListOptions = {},
) {
  return blocks.filter((block) => {
    if (options.activeOnly !== false && block.status !== "active") {
      return false;
    }

    if (options.exposureLevels && !options.exposureLevels.includes(block.exposureLevel)) {
      return false;
    }

    return true;
  });
}

export function getAllMethodologyBlocks(
  options: MethodologyRegistryListOptions = {},
): MethodologyBlock[] {
  return applyListOptions(METHODOLOGY_BLOCKS, options).map((block) => ({ ...block }));
}

export function getActiveMethodologyBlocks() {
  return getAllMethodologyBlocks({ activeOnly: true });
}

export function getMethodologyBlockById(id: MethodologyBlockId) {
  return METHODOLOGY_BLOCKS.find((block) => block.id === id) ?? null;
}

export function getMethodologyBlocksByDomain(
  domain: MethodologyDomain,
  options: MethodologyRegistryListOptions = {},
) {
  return getAllMethodologyBlocks(options).filter((block) => block.domain === domain);
}

export function getMethodologyBlocksByTags(
  tags: string[],
  options: MethodologyRegistryListOptions = {},
) {
  const normalizedTags = new Set(tags.map(normalizeToken).filter(Boolean));
  return getAllMethodologyBlocks(options).filter((block) =>
    block.tags.some((tag) => normalizedTags.has(normalizeToken(tag))),
  );
}

export function getMethodologyBlocksByExposure(
  exposure: MethodologyExposureLevel,
  options: Omit<MethodologyRegistryListOptions, "exposureLevels"> = {},
) {
  return getAllMethodologyBlocks({
    ...options,
    exposureLevels: [exposure],
  });
}

export function assertMethodologyRegistryValid() {
  const result = validateMethodologyRegistry(METHODOLOGY_BLOCKS);
  if (!result.ok) {
    throw new Error(`Methodology registry is invalid: ${result.errors.join("; ")}`);
  }
  return result;
}
