import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { getEffectiveUserEntitlement } from "../admin/runtimeSettingsService";
import { ensureAssessmentOwnership, type AssessmentDetail } from "../assessments/assessmentService";
import { resolveAdvisorMemoryPlanLimits } from "./advisorMemoryPlanLimits";
import {
  sanitizeAdvisorMemoryMetadata,
  sanitizeAdvisorMemoryTags,
} from "./advisorMemorySecurity";
import type {
  AdvisorMemoryContext,
  AdvisorMemoryContextItem,
  AdvisorMemoryCounts,
  AdvisorMemoryCreateInput,
  AdvisorMemorySummary,
  AdvisorMemoryItemStatus,
  AdvisorMemoryItemView,
  AdvisorMemoryListFilters,
} from "./advisorMemoryTypes";
import { ADVISOR_MEMORY_CONTEXT_VERSION } from "./advisorMemoryTypes";
import {
  validateAdvisorMemoryCreateInput,
  validateAdvisorMemoryStatusTransition,
} from "./advisorMemoryValidation";

type ActorParams = {
  userId: string;
  assessmentId: string;
};

type MemoryRecord = {
  id: string;
  assessmentId: string;
  workspaceId: string;
  conversationId: string | null;
  sourceMessageId: string | null;
  createdByUserId: string | null;
  type: AdvisorMemoryItemView["type"];
  status: AdvisorMemoryItemView["status"];
  sourceType: AdvisorMemoryItemView["sourceType"];
  truthStatus: AdvisorMemoryItemView["truthStatus"];
  title: string;
  summary: string;
  detailsJson: Prisma.JsonValue | null;
  tagsJson: Prisma.JsonValue | null;
  relatedEntityJson: Prisma.JsonValue | null;
  confidence: number | null;
  version: number;
  supersedesId: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const CONTEXT_TYPES = [
  "decision",
  "open_question",
  "next_step",
  "constraint",
  "risk_interpretation",
] as const;

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function mapMemoryItem(item: MemoryRecord): AdvisorMemoryItemView {
  return {
    id: item.id,
    assessmentId: item.assessmentId,
    workspaceId: item.workspaceId,
    conversationId: item.conversationId,
    sourceMessageId: item.sourceMessageId,
    createdByUserId: item.createdByUserId,
    type: item.type,
    status: item.status,
    sourceType: item.sourceType,
    truthStatus: item.truthStatus,
    title: item.title,
    summary: item.summary,
    details: item.detailsJson,
    tags: item.tagsJson,
    relatedEntity: item.relatedEntityJson,
    confidence: item.confidence,
    version: item.version,
    supersedesId: item.supersedesId,
    resolvedAt: item.resolvedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function toContextItem(item: MemoryRecord): AdvisorMemoryContextItem {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    summary: item.summary,
    sourceType: item.sourceType,
    truthStatus: item.truthStatus,
    confidence: item.confidence,
    createdAt: item.createdAt,
  };
}

function safeAuditMetadata(item: {
  id: string;
  assessmentId: string;
  workspaceId: string;
  type: string;
  status: string;
  truthStatus: string;
  sourceType: string;
}) {
  return {
    memoryItemId: item.id,
    assessmentId: item.assessmentId,
    workspaceId: item.workspaceId,
    type: item.type,
    status: item.status,
    truthStatus: item.truthStatus,
    sourceType: item.sourceType,
  };
}

async function getMemoryLimits(params: {
  userId: string;
  assessment: AssessmentDetail;
}) {
  const entitlement = await getEffectiveUserEntitlement(params.userId);
  return resolveAdvisorMemoryPlanLimits({
    userEntitlementPlanKey: entitlement?.planKey,
    assessmentPlanLevel: params.assessment.planLevel,
    workspacePlan: params.assessment.workspace.plan,
  });
}

async function recordAdvisorMemoryAuditEvent(params: {
  userId: string;
  assessmentId: string;
  workspaceId: string;
  eventType: string;
  message: string;
  metadataJson: Record<string, string | number | boolean | null>;
}) {
  await prisma.auditEvent.create({
    data: {
      userId: params.userId,
      assessmentId: params.assessmentId,
      workspaceId: params.workspaceId,
      eventType: params.eventType,
      message: params.message,
      metadataJson: json(params.metadataJson),
    },
  });
}

async function ensureMemoryItemAccess(params: {
  id: string;
  userId: string;
}) {
  const item = await prisma.assessmentAdvisorMemoryItem.findUnique({
    where: { id: params.id },
  });

  if (!item) {
    throw new Error("Advisor memory item not found.");
  }

  const assessment = await ensureAssessmentOwnership({
    userId: params.userId,
    assessmentId: item.assessmentId,
  });

  if (assessment.workspaceId !== item.workspaceId) {
    throw new Error("Advisor memory item workspace mismatch.");
  }

  return { assessment, item };
}

async function countExistingForType(params: {
  assessmentId: string;
  workspaceId: string;
  type?: AdvisorMemoryItemView["type"];
}) {
  return prisma.assessmentAdvisorMemoryItem.count({
    where: {
      assessmentId: params.assessmentId,
      workspaceId: params.workspaceId,
      ...(params.type ? { type: params.type } : {}),
      status: { notIn: ["rejected", "archived"] },
    },
  });
}

function assertTypeLimit(params: {
  type: AdvisorMemoryItemView["type"];
  typeCount: number;
  maxOpenQuestions: number;
  maxDecisions: number;
  maxNextSteps: number;
}) {
  if (params.type === "open_question" && params.typeCount >= params.maxOpenQuestions) {
    throw new Error("Advisor memory open question limit reached.");
  }

  if (params.type === "decision" && params.typeCount >= params.maxDecisions) {
    throw new Error("Advisor memory decision limit reached.");
  }

  if (params.type === "next_step" && params.typeCount >= params.maxNextSteps) {
    throw new Error("Advisor memory next step limit reached.");
  }
}

export async function listAdvisorMemoryItems(
  params: ActorParams & Omit<AdvisorMemoryListFilters, "workspaceId">,
) {
  const assessment = await ensureAssessmentOwnership(params);
  const items = await prisma.assessmentAdvisorMemoryItem.findMany({
    where: {
      assessmentId: assessment.id,
      workspaceId: assessment.workspaceId,
      ...(params.statuses ? { status: { in: params.statuses } } : {}),
      ...(params.types ? { type: { in: params.types } } : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: params.limit ?? 100,
  });

  return items.map(mapMemoryItem);
}

export async function createAdvisorMemoryItem(params: {
  userId: string;
  input: AdvisorMemoryCreateInput;
}) {
  const assessment = await ensureAssessmentOwnership({
    userId: params.userId,
    assessmentId: params.input.assessmentId,
  });

  if (assessment.workspaceId !== params.input.workspaceId) {
    throw new Error("Advisor memory workspace mismatch.");
  }

  const limits = await getMemoryLimits({ userId: params.userId, assessment });
  const [existingItemCount, typeCount] = await Promise.all([
    countExistingForType({
      assessmentId: assessment.id,
      workspaceId: assessment.workspaceId,
    }),
    countExistingForType({
      assessmentId: assessment.id,
      workspaceId: assessment.workspaceId,
      type: params.input.type,
    }),
  ]);

  assertTypeLimit({
    type: params.input.type,
    typeCount,
    maxOpenQuestions: limits.maxOpenQuestions,
    maxDecisions: limits.maxDecisions,
    maxNextSteps: limits.maxNextSteps,
  });

  const validation = validateAdvisorMemoryCreateInput({
    input: params.input,
    limits,
    existingItemCount,
  });
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const normalized = validation.normalized;
  const created = await prisma.assessmentAdvisorMemoryItem.create({
    data: {
      assessmentId: assessment.id,
      workspaceId: assessment.workspaceId,
      conversationId: normalized.conversationId ?? null,
      sourceMessageId: normalized.sourceMessageId ?? null,
      createdByUserId: normalized.createdByUserId ?? params.userId,
      type: normalized.type,
      status:
        normalized.truthStatus === "confirmed" || normalized.truthStatus === "customer_reported"
          ? "active"
          : "needs_review",
      sourceType: normalized.sourceType,
      truthStatus: normalized.truthStatus,
      title: normalized.title,
      summary: normalized.summary,
      detailsJson: sanitizeAdvisorMemoryMetadata(normalized.details) ?? undefined,
      tagsJson: json(sanitizeAdvisorMemoryTags(normalized.tags)),
      relatedEntityJson: sanitizeAdvisorMemoryMetadata(normalized.relatedEntity) ?? undefined,
      confidence: normalized.confidence,
    },
  });

  await recordAdvisorMemoryAuditEvent({
    userId: params.userId,
    assessmentId: assessment.id,
    workspaceId: assessment.workspaceId,
    eventType: "advisor_memory_item_created",
    message: "Advisor memory item created.",
    metadataJson: safeAuditMetadata(created),
  });

  return mapMemoryItem(created);
}

async function updateAdvisorMemoryStatus(params: {
  id: string;
  userId: string;
  status: AdvisorMemoryItemStatus;
  eventType: string;
  message: string;
  resolvedAt?: Date | null;
}) {
  const { assessment, item } = await ensureMemoryItemAccess({
    id: params.id,
    userId: params.userId,
  });
  const transition = validateAdvisorMemoryStatusTransition({
    current: item.status,
    next: params.status,
  });

  if (!transition.ok) {
    throw new Error(transition.message);
  }

  const updated = await prisma.assessmentAdvisorMemoryItem.update({
    where: { id: item.id },
    data: {
      status: params.status,
      resolvedAt: params.resolvedAt,
    },
  });

  await recordAdvisorMemoryAuditEvent({
    userId: params.userId,
    assessmentId: assessment.id,
    workspaceId: assessment.workspaceId,
    eventType: params.eventType,
    message: params.message,
    metadataJson: safeAuditMetadata(updated),
  });

  return mapMemoryItem(updated);
}

export function confirmAdvisorMemoryItem(id: string, userId: string) {
  return updateAdvisorMemoryStatus({
    id,
    userId,
    status: "active",
    eventType: "advisor_memory_item_confirmed",
    message: "Advisor memory item confirmed.",
  });
}

export function rejectAdvisorMemoryItem(id: string, userId: string) {
  return updateAdvisorMemoryStatus({
    id,
    userId,
    status: "rejected",
    eventType: "advisor_memory_item_rejected",
    message: "Advisor memory item rejected.",
  });
}

export function resolveAdvisorMemoryItem(id: string, userId: string) {
  return updateAdvisorMemoryStatus({
    id,
    userId,
    status: "resolved",
    resolvedAt: new Date(),
    eventType: "advisor_memory_item_resolved",
    message: "Advisor memory item resolved.",
  });
}

export function archiveAdvisorMemoryItem(id: string, userId: string) {
  return updateAdvisorMemoryStatus({
    id,
    userId,
    status: "archived",
    eventType: "advisor_memory_item_archived",
    message: "Advisor memory item archived.",
  });
}

export async function supersedeAdvisorMemoryItem(params: {
  oldId: string;
  userId: string;
  newInput: AdvisorMemoryCreateInput;
}) {
  const { assessment, item } = await ensureMemoryItemAccess({
    id: params.oldId,
    userId: params.userId,
  });
  const transition = validateAdvisorMemoryStatusTransition({
    current: item.status,
    next: "superseded",
  });

  if (!transition.ok) {
    throw new Error(transition.message);
  }

  const replacement = await createAdvisorMemoryItem({
    userId: params.userId,
    input: {
      ...params.newInput,
      assessmentId: assessment.id,
      workspaceId: assessment.workspaceId,
    },
  });

  const superseded = await prisma.assessmentAdvisorMemoryItem.update({
    where: { id: item.id },
    data: {
      status: "superseded",
      resolvedAt: new Date(),
    },
  });
  const updatedReplacement = await prisma.assessmentAdvisorMemoryItem.update({
    where: { id: replacement.id },
    data: {
      supersedesId: item.id,
      version: item.version + 1,
    },
  });

  await recordAdvisorMemoryAuditEvent({
    userId: params.userId,
    assessmentId: assessment.id,
    workspaceId: assessment.workspaceId,
    eventType: "advisor_memory_item_superseded",
    message: "Advisor memory item superseded.",
    metadataJson: {
      ...safeAuditMetadata(superseded),
      replacementMemoryItemId: replacement.id,
    },
  });

  return {
    superseded: mapMemoryItem(superseded),
    replacement: mapMemoryItem(updatedReplacement),
  };
}

export async function getAdvisorMemoryCounts(
  assessmentId: string,
  workspaceId: string,
): Promise<AdvisorMemoryCounts> {
  const items = await prisma.assessmentAdvisorMemoryItem.findMany({
    where: { assessmentId, workspaceId },
    select: { status: true, type: true },
  });

  return {
    total: items.length,
    active: items.filter((item) => item.status === "active").length,
    needsReview: items.filter((item) => item.status === "needs_review").length,
    resolved: items.filter((item) => item.status === "resolved").length,
    rejected: items.filter((item) => item.status === "rejected").length,
    superseded: items.filter((item) => item.status === "superseded").length,
    archived: items.filter((item) => item.status === "archived").length,
    decisions: items.filter((item) => item.type === "decision").length,
    openQuestions: items.filter((item) => item.type === "open_question").length,
    nextSteps: items.filter((item) => item.type === "next_step").length,
  };
}

export async function buildAdvisorMemoryContext(
  assessmentId: string,
  workspaceId: string,
  options: { perTypeLimit?: number } = {},
): Promise<AdvisorMemoryContext> {
  const perTypeLimit = options.perTypeLimit ?? 5;
  const [items, counts] = await Promise.all([
    prisma.assessmentAdvisorMemoryItem.findMany({
      where: {
        assessmentId,
        workspaceId,
        status: "active",
        type: { in: [...CONTEXT_TYPES] },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: perTypeLimit * CONTEXT_TYPES.length,
    }),
    getAdvisorMemoryCounts(assessmentId, workspaceId),
  ]);

  const byType = (type: (typeof CONTEXT_TYPES)[number]) =>
    items.filter((item) => item.type === type).slice(0, perTypeLimit).map(toContextItem);

  return {
    version: ADVISOR_MEMORY_CONTEXT_VERSION,
    decisions: byType("decision"),
    openQuestions: byType("open_question"),
    nextSteps: byType("next_step"),
    constraints: byType("constraint"),
    risks: byType("risk_interpretation"),
    excludedCounts: {
      rejected: counts.rejected,
      superseded: counts.superseded,
      archived: counts.archived,
      needsReview: counts.needsReview,
    },
  };
}

export async function getAdvisorMemorySummary(
  assessmentId: string,
  workspaceId: string,
): Promise<AdvisorMemorySummary> {
  const [counts, context] = await Promise.all([
    getAdvisorMemoryCounts(assessmentId, workspaceId),
    buildAdvisorMemoryContext(assessmentId, workspaceId),
  ]);
  const summary = [
    `${counts.active} active memory items`,
    `${counts.needsReview} needing review`,
    `${counts.decisions} decisions`,
    `${counts.openQuestions} open questions`,
    `${counts.nextSteps} next steps`,
  ].join("; ");

  return { counts, context, summary };
}
