import type {
  AssessmentAdvisorMemoryItemStatus,
  AssessmentAdvisorMemoryItemType,
  AssessmentAdvisorMemorySourceType,
  AssessmentAdvisorMemoryTruthStatus,
  Prisma,
} from "@prisma/client";

export const ADVISOR_MEMORY_CONTEXT_VERSION = "advisor-memory-context-v1" as const;

export type AdvisorMemoryItemType = AssessmentAdvisorMemoryItemType;
export type AdvisorMemoryItemStatus = AssessmentAdvisorMemoryItemStatus;
export type AdvisorMemorySourceType = AssessmentAdvisorMemorySourceType;
export type AdvisorMemoryTruthStatus = AssessmentAdvisorMemoryTruthStatus;

export type AdvisorMemoryCreateInput = {
  assessmentId: string;
  workspaceId: string;
  conversationId?: string | null;
  sourceMessageId?: string | null;
  createdByUserId?: string | null;
  type: AdvisorMemoryItemType;
  sourceType: AdvisorMemorySourceType;
  truthStatus: AdvisorMemoryTruthStatus;
  status?: AdvisorMemoryItemStatus;
  title: string;
  summary: string;
  details?: Record<string, unknown> | null;
  tags?: string[] | null;
  relatedEntity?: Record<string, unknown> | null;
  confidence?: number | null;
};

export type AdvisorMemoryListFilters = {
  assessmentId: string;
  workspaceId: string;
  statuses?: AdvisorMemoryItemStatus[];
  types?: AdvisorMemoryItemType[];
  limit?: number;
};

export type AdvisorMemoryStatusUpdateInput = {
  id: string;
  userId: string;
  status: AdvisorMemoryItemStatus;
  reason?: string | null;
};

export type AdvisorMemoryItemView = {
  id: string;
  assessmentId: string;
  workspaceId: string;
  conversationId: string | null;
  sourceMessageId: string | null;
  createdByUserId: string | null;
  type: AdvisorMemoryItemType;
  status: AdvisorMemoryItemStatus;
  sourceType: AdvisorMemorySourceType;
  truthStatus: AdvisorMemoryTruthStatus;
  title: string;
  summary: string;
  details: Prisma.JsonValue | null;
  tags: Prisma.JsonValue | null;
  relatedEntity: Prisma.JsonValue | null;
  confidence: number | null;
  version: number;
  supersedesId: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AdvisorMemoryContextItem = {
  id: string;
  type: AdvisorMemoryItemType;
  title: string;
  summary: string;
  sourceType: AdvisorMemorySourceType;
  truthStatus: AdvisorMemoryTruthStatus;
  confidence: number | null;
  createdAt: Date;
};

export type AdvisorMemoryContext = {
  version: typeof ADVISOR_MEMORY_CONTEXT_VERSION;
  decisions: AdvisorMemoryContextItem[];
  openQuestions: AdvisorMemoryContextItem[];
  nextSteps: AdvisorMemoryContextItem[];
  constraints: AdvisorMemoryContextItem[];
  risks: AdvisorMemoryContextItem[];
  excludedCounts: {
    rejected: number;
    superseded: number;
    archived: number;
    needsReview: number;
  };
};

export type AdvisorMemoryCounts = {
  total: number;
  active: number;
  needsReview: number;
  resolved: number;
  rejected: number;
  superseded: number;
  archived: number;
  decisions: number;
  openQuestions: number;
  nextSteps: number;
};

export type AdvisorMemorySummary = {
  counts: AdvisorMemoryCounts;
  context: AdvisorMemoryContext;
  summary: string;
};

export type AdvisorMemoryPanelState = {
  enabled: boolean;
  available: boolean;
  lockedReason: string | null;
  planLabel: string;
  maxItemsPerAssessment: number;
  counts: AdvisorMemoryCounts;
  summary: string;
  previewItems: AdvisorMemoryItemView[];
  items: AdvisorMemoryItemView[];
};

export type AdvisorMemoryActionResult =
  | {
      ok: true;
      message: string;
      memory: AdvisorMemoryPanelState;
    }
  | {
      ok: false;
      message: string;
      memory?: AdvisorMemoryPanelState;
    };
