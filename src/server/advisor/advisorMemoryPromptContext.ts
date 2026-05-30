import { prisma } from "../../lib/prisma";
import { getEffectiveUserEntitlement } from "../admin/runtimeSettingsService";
import type { AssessmentDetail } from "../assessments/assessmentService";
import { resolveAdvisorMemoryPlanLimits } from "./advisorMemoryPlanLimits";
import { buildAdvisorMemoryContext } from "./advisorMemoryService";
import type {
  AdvisorMemoryContextItem,
  AdvisorMemoryItemType,
  AdvisorMemorySourceType,
  AdvisorMemoryTruthStatus,
} from "./advisorMemoryTypes";
import { sanitizeSeniorAdvisorText } from "./seniorAdvisorSecurity";
import type { SeniorAdvisorPlanKey } from "./seniorAdvisorTypes";

export type AdvisorMemoryPromptItem = {
  id: string;
  type: string;
  title: string;
  summary: string;
  truthStatus: string;
  sourceType: string;
  confidence?: number | null;
};

export type AdvisorMemoryPromptContext = {
  enabled: boolean;
  included: boolean;
  reason?: string;
  limits: AdvisorMemoryPromptLimits;
  summary?: string;
  itemCount: number;
  contextChars: number;
  decisions: AdvisorMemoryPromptItem[];
  openQuestions: AdvisorMemoryPromptItem[];
  nextSteps: AdvisorMemoryPromptItem[];
  constraints: AdvisorMemoryPromptItem[];
  risks: AdvisorMemoryPromptItem[];
  other: AdvisorMemoryPromptItem[];
};

export type AdvisorMemoryPromptLimits = {
  maxChars: number;
  decisions: number;
  openQuestions: number;
  nextSteps: number;
  constraints: number;
  risks: number;
  other: number;
};

type PromptCategory =
  | "decisions"
  | "openQuestions"
  | "nextSteps"
  | "constraints"
  | "risks"
  | "other";

type OtherMemoryRecord = {
  id: string;
  type: AdvisorMemoryItemType;
  title: string;
  summary: string;
  sourceType: AdvisorMemorySourceType;
  truthStatus: AdvisorMemoryTruthStatus;
  confidence: number | null;
};

const EMPTY_LIMITS: AdvisorMemoryPromptLimits = {
  maxChars: 0,
  decisions: 0,
  openQuestions: 0,
  nextSteps: 0,
  constraints: 0,
  risks: 0,
  other: 0,
};

const MEMORY_PROMPT_LIMITS: Record<SeniorAdvisorPlanKey, AdvisorMemoryPromptLimits> = {
  starter: EMPTY_LIMITS,
  readiness_report: {
    maxChars: 4_000,
    decisions: 3,
    openQuestions: 3,
    nextSteps: 3,
    constraints: 3,
    risks: 3,
    other: 1,
  },
  pro: {
    maxChars: 5_000,
    decisions: 4,
    openQuestions: 4,
    nextSteps: 4,
    constraints: 4,
    risks: 4,
    other: 2,
  },
  internal_qa: {
    maxChars: 6_000,
    decisions: 5,
    openQuestions: 5,
    nextSteps: 5,
    constraints: 5,
    risks: 5,
    other: 3,
  },
  blueprint: {
    maxChars: 6_000,
    decisions: 5,
    openQuestions: 5,
    nextSteps: 5,
    constraints: 5,
    risks: 5,
    other: 3,
  },
  partner: {
    maxChars: 5_000,
    decisions: 4,
    openQuestions: 4,
    nextSteps: 4,
    constraints: 4,
    risks: 4,
    other: 2,
  },
};

const CONTEXT_MEMORY_TYPES = [
  "decision",
  "open_question",
  "next_step",
  "constraint",
  "risk_interpretation",
] satisfies AdvisorMemoryItemType[];

const EMPTY_CATEGORIES = {
  decisions: [],
  openQuestions: [],
  nextSteps: [],
  constraints: [],
  risks: [],
  other: [],
} satisfies Record<PromptCategory, AdvisorMemoryPromptItem[]>;

function countItems(context: Pick<AdvisorMemoryPromptContext, PromptCategory>) {
  return (
    context.decisions.length +
    context.openQuestions.length +
    context.nextSteps.length +
    context.constraints.length +
    context.risks.length +
    context.other.length
  );
}

function measureContextChars(context: Omit<AdvisorMemoryPromptContext, "contextChars">) {
  return JSON.stringify({ ...context, contextChars: 0 }).length;
}

function mapPromptItem(item: AdvisorMemoryContextItem | OtherMemoryRecord): AdvisorMemoryPromptItem {
  return {
    id: item.id,
    type: item.type,
    title: sanitizeSeniorAdvisorText(item.title, 180),
    summary: sanitizeSeniorAdvisorText(item.summary, 500),
    truthStatus: item.truthStatus,
    sourceType: item.sourceType,
    confidence: item.confidence,
  };
}

function buildEmptyPromptContext(params: {
  enabled: boolean;
  included: boolean;
  reason: string;
  limits: AdvisorMemoryPromptLimits;
}): AdvisorMemoryPromptContext {
  const base = {
    enabled: params.enabled,
    included: params.included,
    reason: params.reason,
    limits: params.limits,
    itemCount: 0,
    ...EMPTY_CATEGORIES,
  };

  return {
    ...base,
    contextChars: measureContextChars(base),
  };
}

export function buildUnavailableAdvisorMemoryPromptContext(
  reason = "memory_unavailable",
): AdvisorMemoryPromptContext {
  return buildEmptyPromptContext({
    enabled: true,
    included: false,
    reason,
    limits: EMPTY_LIMITS,
  });
}

export function resolveAdvisorMemoryPromptLimits(planKey: SeniorAdvisorPlanKey) {
  return MEMORY_PROMPT_LIMITS[planKey];
}

function applyCharLimit(params: {
  limits: AdvisorMemoryPromptLimits;
  summary: string;
  grouped: Record<PromptCategory, AdvisorMemoryPromptItem[]>;
}) {
  const base: Omit<AdvisorMemoryPromptContext, "contextChars"> = {
    enabled: true,
    included: false,
    reason: "no_memory",
    limits: params.limits,
    itemCount: 0,
    decisions: [],
    openQuestions: [],
    nextSteps: [],
    constraints: [],
    risks: [],
    other: [],
  };

  const next = { ...base };
  const priority: PromptCategory[] = [
    "decisions",
    "openQuestions",
    "constraints",
    "risks",
    "nextSteps",
  ];

  for (const category of priority) {
    for (const item of params.grouped[category]) {
      const candidate = {
        ...next,
        [category]: [...next[category], item],
        included: true,
        reason: undefined,
      };
      if (measureContextChars(candidate) > params.limits.maxChars) {
        break;
      }
      next[category] = candidate[category];
      next.included = true;
      delete next.reason;
    }
  }

  if (next.included) {
    const withSummary = { ...next, summary: params.summary };
    if (measureContextChars(withSummary) <= params.limits.maxChars) {
      next.summary = params.summary;
    }
  }

  for (const item of params.grouped.other) {
    const candidate = {
      ...next,
      other: [...next.other, item],
      included: true,
      reason: undefined,
    };
    if (measureContextChars(candidate) > params.limits.maxChars) {
      break;
    }
    next.other = candidate.other;
    next.included = true;
    delete next.reason;
  }

  next.itemCount = countItems(next);
  if (next.itemCount === 0) {
    next.included = false;
    next.reason = "no_memory";
  }

  return {
    ...next,
    contextChars: measureContextChars(next),
  };
}

export function compactAdvisorMemoryPromptContext(
  memory: AdvisorMemoryPromptContext | undefined,
  perCategoryLimit: number,
): AdvisorMemoryPromptContext | undefined {
  if (!memory) {
    return undefined;
  }

  if (!memory.included) {
    return memory;
  }

  const compacted = {
    ...memory,
    summary: memory.summary ? sanitizeSeniorAdvisorText(memory.summary, 240) : undefined,
    decisions: memory.decisions.slice(0, perCategoryLimit),
    openQuestions: memory.openQuestions.slice(0, perCategoryLimit),
    nextSteps: memory.nextSteps.slice(0, perCategoryLimit),
    constraints: memory.constraints.slice(0, perCategoryLimit),
    risks: memory.risks.slice(0, perCategoryLimit),
    other: memory.other.slice(0, Math.min(1, perCategoryLimit)),
  };
  compacted.itemCount = countItems(compacted);
  compacted.contextChars = JSON.stringify(compacted).length;
  return compacted;
}

export async function buildAdvisorMemoryPromptContext(params: {
  userId: string;
  assessment: AssessmentDetail;
}): Promise<AdvisorMemoryPromptContext> {
  const entitlement = await getEffectiveUserEntitlement(params.userId);
  const memoryPlanLimits = resolveAdvisorMemoryPlanLimits({
    userEntitlementPlanKey: entitlement?.planKey,
    assessmentPlanLevel: params.assessment.planLevel,
    workspacePlan: params.assessment.workspace.plan,
  });
  const limits = resolveAdvisorMemoryPromptLimits(memoryPlanLimits.planKey);

  if (!memoryPlanLimits.enabled || !memoryPlanLimits.canUseMemory) {
    return buildEmptyPromptContext({
      enabled: false,
      included: false,
      reason: "memory_disabled_for_plan",
      limits,
    });
  }

  const context = await buildAdvisorMemoryContext(params.assessment.id, params.assessment.workspaceId, {
    perTypeLimit: Math.max(
      limits.decisions,
      limits.openQuestions,
      limits.nextSteps,
      limits.constraints,
      limits.risks,
    ),
  });
  const otherRecords = await prisma.assessmentAdvisorMemoryItem.findMany({
    where: {
      assessmentId: params.assessment.id,
      workspaceId: params.assessment.workspaceId,
      status: "active",
      type: { notIn: [...CONTEXT_MEMORY_TYPES] },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: limits.other,
    select: {
      id: true,
      type: true,
      title: true,
      summary: true,
      sourceType: true,
      truthStatus: true,
      confidence: true,
    },
  });
  const grouped = {
    decisions: context.decisions.slice(0, limits.decisions).map(mapPromptItem),
    openQuestions: context.openQuestions.slice(0, limits.openQuestions).map(mapPromptItem),
    nextSteps: context.nextSteps.slice(0, limits.nextSteps).map(mapPromptItem),
    constraints: context.constraints.slice(0, limits.constraints).map(mapPromptItem),
    risks: context.risks.slice(0, limits.risks).map(mapPromptItem),
    other: otherRecords.slice(0, limits.other).map(mapPromptItem),
  };
  const summary = [
    grouped.decisions.length ? `${grouped.decisions.length} active decisions` : null,
    grouped.openQuestions.length ? `${grouped.openQuestions.length} open questions` : null,
    grouped.constraints.length ? `${grouped.constraints.length} constraints` : null,
    grouped.risks.length ? `${grouped.risks.length} risks` : null,
    grouped.nextSteps.length ? `${grouped.nextSteps.length} next steps` : null,
  ]
    .filter(Boolean)
    .join("; ");

  return applyCharLimit({
    limits,
    summary,
    grouped,
  });
}
