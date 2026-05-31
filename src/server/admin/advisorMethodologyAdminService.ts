import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  ADVISOR_METHODOLOGY_CONTEXT_FLAG,
  isAdvisorMethodologyContextEnabled,
} from "../advisor/seniorAdvisorMethodologyContext";
import {
  getAllMethodologyBlocks,
  validateMethodologyRegistry,
  type MethodologyBlock,
} from "../advisor/methodology";

export type AdvisorMethodologyRuntimeStatus = {
  enabled: boolean;
  flagName: typeof ADVISOR_METHODOLOGY_CONTEXT_FLAG;
  activationMode: "env";
  defaultEnabled: false;
  rawValuePresent: boolean;
  valueDescription: "enabled_explicit_true" | "disabled_default" | "disabled_non_true_value";
  productionSafeSummary: string;
};

export type AdvisorMethodologyKbHealth = {
  ok: boolean;
  totalBlocks: number;
  activeBlocks: number;
  draftBlocks: number;
  deprecatedBlocks: number;
  exposureCounts: Record<string, number>;
  activeBlockIds: string[];
  versions: Array<{ id: string; version: string }>;
  validationErrorsCount: number;
  validationWarningsCount: number;
  restrictedCount: number;
  lastCheckedAt: Date;
  blockSummaries: Array<{
    id: string;
    title: string;
    version: string;
    status: string;
    exposureLevel: string;
    domain: string;
    lastReviewedAt: string;
  }>;
};

export type AdvisorMethodologyUsageStats = {
  windowDays: number;
  since: Date;
  totalAdvisorEvents: number;
  methodologyTrackedEvents: number;
  methodologyEnabledEvents: number;
  includedCount: number;
  skippedCount: number;
  errorCount: number;
  disabledCount: number;
  lastMethodologyEventAt: Date | null;
  averageBlockCount: number;
  totalWarnings: number;
  totalBlockedReasons: number;
  topBlockIds: Array<{ id: string; count: number }>;
  limitations: string[];
};

export type AdvisorMethodologyAdminSnapshot = {
  runtime: AdvisorMethodologyRuntimeStatus;
  kbHealth: AdvisorMethodologyKbHealth;
  usageStats: AdvisorMethodologyUsageStats;
};

export type AdvisorMethodologyUsageEvent = {
  createdAt: Date;
  status: string;
  metadataJson: Prisma.JsonValue | null;
};

function asMetadataObject(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Prisma.JsonValue>;
}

function numberFromMetadata(value: Prisma.JsonValue | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringFromMetadata(value: Prisma.JsonValue | undefined) {
  return typeof value === "string" ? value : null;
}

function stringArrayFromMetadata(value: Prisma.JsonValue | undefined) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function countBy<T extends string>(items: readonly T[]) {
  return items.reduce<Record<string, number>>((counts, item) => {
    counts[item] = (counts[item] ?? 0) + 1;
    return counts;
  }, {});
}

function getBlockSummaries(blocks: MethodologyBlock[]) {
  return blocks
    .map((block) => ({
      id: block.id,
      title: block.title,
      version: block.version,
      status: block.status,
      exposureLevel: block.exposureLevel,
      domain: block.domain,
      lastReviewedAt: block.lastReviewedAt,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function getAdvisorMethodologyRuntimeStatus(
  env: Record<string, string | undefined> = process.env,
): AdvisorMethodologyRuntimeStatus {
  const rawValue = env[ADVISOR_METHODOLOGY_CONTEXT_FLAG];
  const rawValuePresent = typeof rawValue === "string" && rawValue.trim().length > 0;
  const enabled = isAdvisorMethodologyContextEnabled(env);
  const valueDescription = enabled
    ? "enabled_explicit_true"
    : rawValuePresent
      ? "disabled_non_true_value"
      : "disabled_default";

  return {
    enabled,
    flagName: ADVISOR_METHODOLOGY_CONTEXT_FLAG,
    activationMode: "env",
    defaultEnabled: false,
    rawValuePresent,
    valueDescription,
    productionSafeSummary: enabled
      ? "Methodology context is enabled by explicit env flag."
      : "Methodology context is disabled unless the env flag is exactly true.",
  };
}

export function getAdvisorMethodologyKbHealth(): AdvisorMethodologyKbHealth {
  const blocks = getAllMethodologyBlocks({ activeOnly: false });
  const validation = validateMethodologyRegistry(blocks);
  const activeBlocks = blocks.filter((block) => block.status === "active");
  const draftBlocks = blocks.filter((block) => block.status === "draft");
  const deprecatedBlocks = blocks.filter((block) => block.status === "deprecated");
  const restrictedBlocks = blocks.filter((block) => block.exposureLevel === "restricted");

  return {
    ok: validation.ok,
    totalBlocks: blocks.length,
    activeBlocks: activeBlocks.length,
    draftBlocks: draftBlocks.length,
    deprecatedBlocks: deprecatedBlocks.length,
    exposureCounts: countBy(blocks.map((block) => block.exposureLevel)),
    activeBlockIds: activeBlocks.map((block) => block.id).sort(),
    versions: blocks.map((block) => ({ id: block.id, version: block.version })).sort((a, b) => a.id.localeCompare(b.id)),
    validationErrorsCount: validation.errors.length,
    validationWarningsCount: validation.warnings.length,
    restrictedCount: restrictedBlocks.length,
    lastCheckedAt: new Date(),
    blockSummaries: getBlockSummaries(blocks),
  };
}

export function buildAdvisorMethodologyUsageStatsFromEvents(
  events: AdvisorMethodologyUsageEvent[],
  windowDays = 30,
): AdvisorMethodologyUsageStats {
  const since = new Date();
  since.setDate(since.getDate() - windowDays);

  let methodologyTrackedEvents = 0;
  let methodologyEnabledEvents = 0;
  let includedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let disabledCount = 0;
  let blockCountTotal = 0;
  let blockCountSamples = 0;
  let totalWarnings = 0;
  let totalBlockedReasons = 0;
  let lastMethodologyEventAt: Date | null = null;
  const blockCounts = new Map<string, number>();

  for (const event of events) {
    const metadata = asMetadataObject(event.metadataJson);
    if (!metadata || !("methodologyContextStatus" in metadata || "methodologyContextEnabled" in metadata)) {
      continue;
    }

    methodologyTrackedEvents += 1;
    if (!lastMethodologyEventAt || event.createdAt > lastMethodologyEventAt) {
      lastMethodologyEventAt = event.createdAt;
    }

    const enabled = metadata.methodologyContextEnabled === true;
    const contextStatus = stringFromMetadata(metadata.methodologyContextStatus);
    if (enabled) methodologyEnabledEvents += 1;
    if (contextStatus === "included") includedCount += 1;
    if (contextStatus === "skipped") skippedCount += 1;
    if (contextStatus === "error" || event.status === "error" || event.status === "timeout") errorCount += 1;
    if (contextStatus === "disabled" || !enabled) disabledCount += 1;

    const blockCount = numberFromMetadata(metadata.methodologyBlockCount);
    if (blockCount > 0) {
      blockCountTotal += blockCount;
      blockCountSamples += 1;
    }
    totalWarnings += numberFromMetadata(metadata.methodologyWarningsCount);
    totalBlockedReasons += numberFromMetadata(metadata.methodologyBlockedReasonsCount);

    for (const blockId of stringArrayFromMetadata(metadata.methodologyBlockIds)) {
      blockCounts.set(blockId, (blockCounts.get(blockId) ?? 0) + 1);
    }
  }

  return {
    windowDays,
    since,
    totalAdvisorEvents: events.length,
    methodologyTrackedEvents,
    methodologyEnabledEvents,
    includedCount,
    skippedCount,
    errorCount,
    disabledCount,
    lastMethodologyEventAt,
    averageBlockCount: blockCountSamples > 0 ? Number((blockCountTotal / blockCountSamples).toFixed(2)) : 0,
    totalWarnings,
    totalBlockedReasons,
    topBlockIds: [...blockCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([id, count]) => ({ id, count })),
    limitations: [
      "Usage stats are derived from sanitized AiUsageEvent metadata only.",
      "No prompts, responses, file contents, cookies, secrets, or customer raw evidence are returned.",
    ],
  };
}

export async function getAdvisorMethodologyUsageStats(params?: {
  windowDays?: number;
}): Promise<AdvisorMethodologyUsageStats> {
  const windowDays = params?.windowDays && params.windowDays > 0 ? params.windowDays : 30;
  const since = new Date();
  since.setDate(since.getDate() - windowDays);

  const events = await prisma.aiUsageEvent.findMany({
    where: {
      operationType: "senior_advisor_message",
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: 1_000,
    select: {
      createdAt: true,
      status: true,
      metadataJson: true,
    },
  });

  return buildAdvisorMethodologyUsageStatsFromEvents(events, windowDays);
}

export async function getAdvisorMethodologyAdminSnapshot(params?: {
  windowDays?: number;
  env?: Record<string, string | undefined>;
}): Promise<AdvisorMethodologyAdminSnapshot> {
  const [kbHealth, usageStats] = await Promise.all([
    Promise.resolve(getAdvisorMethodologyKbHealth()),
    getAdvisorMethodologyUsageStats({ windowDays: params?.windowDays ?? 30 }),
  ]);

  return {
    runtime: getAdvisorMethodologyRuntimeStatus(params?.env ?? process.env),
    kbHealth,
    usageStats,
  };
}
