import type { AdvisorMemoryPlanLimits } from "./advisorMemoryPlanLimits";
import {
  containsObviousRawFileContent,
  sanitizeAdvisorMemorySummary,
  sanitizeAdvisorMemoryTitle,
} from "./advisorMemorySecurity";
import type {
  AdvisorMemoryCreateInput,
  AdvisorMemoryItemStatus,
  AdvisorMemoryItemType,
  AdvisorMemorySourceType,
  AdvisorMemoryTruthStatus,
} from "./advisorMemoryTypes";

export const ADVISOR_MEMORY_ITEM_TYPES = [
  "decision",
  "open_question",
  "resolved_question",
  "assumption",
  "risk_interpretation",
  "customer_preference",
  "evidence_note",
  "next_step",
  "advisor_recommendation",
  "constraint",
  "summary",
] as const satisfies readonly AdvisorMemoryItemType[];

export const ADVISOR_MEMORY_ITEM_STATUSES = [
  "active",
  "resolved",
  "superseded",
  "rejected",
  "needs_review",
  "archived",
] as const satisfies readonly AdvisorMemoryItemStatus[];

export const ADVISOR_MEMORY_SOURCE_TYPES = [
  "user_message",
  "advisor_message",
  "system_generated",
  "assessment_state",
  "client_context",
  "storage_analysis",
  "licensing_analysis",
  "manual_admin",
] as const satisfies readonly AdvisorMemorySourceType[];

export const ADVISOR_MEMORY_TRUTH_STATUSES = [
  "confirmed",
  "customer_reported",
  "inferred",
  "missing",
  "advisor_generated",
  "user_confirmed",
] as const satisfies readonly AdvisorMemoryTruthStatus[];

const STATUS_TRANSITIONS: Record<AdvisorMemoryItemStatus, AdvisorMemoryItemStatus[]> = {
  needs_review: ["active", "rejected", "archived"],
  active: ["resolved", "superseded", "archived"],
  resolved: ["archived"],
  rejected: ["archived"],
  superseded: ["archived"],
  archived: [],
};

function includesValue<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && values.includes(value as T);
}

export type AdvisorMemoryValidationResult =
  | {
      ok: true;
      normalized: AdvisorMemoryCreateInput & {
        title: string;
        summary: string;
        confidence?: number | null;
      };
    }
  | { ok: false; code: string; message: string };

export function canTransitionAdvisorMemoryStatus(
  current: AdvisorMemoryItemStatus,
  next: AdvisorMemoryItemStatus,
) {
  return STATUS_TRANSITIONS[current].includes(next);
}

export function validateAdvisorMemoryCreateInput(params: {
  input: AdvisorMemoryCreateInput;
  limits: AdvisorMemoryPlanLimits;
  existingItemCount: number;
}): AdvisorMemoryValidationResult {
  if (!params.limits.canUseMemory || !params.limits.enabled) {
    return {
      ok: false,
      code: "memory_plan_restricted",
      message: "Project Memory Vault is not included in this plan.",
    };
  }

  if (params.existingItemCount >= params.limits.maxItemsPerAssessment) {
    return {
      ok: false,
      code: "memory_limit_reached",
      message: "Project Memory Vault item limit reached for this assessment.",
    };
  }

  if (!params.input.assessmentId.trim() || !params.input.workspaceId.trim()) {
    return {
      ok: false,
      code: "missing_scope",
      message: "Assessment and workspace are required for Advisor memory.",
    };
  }

  if (!includesValue(ADVISOR_MEMORY_ITEM_TYPES, params.input.type)) {
    return { ok: false, code: "invalid_type", message: "Invalid Advisor memory type." };
  }

  if (!includesValue(ADVISOR_MEMORY_SOURCE_TYPES, params.input.sourceType)) {
    return {
      ok: false,
      code: "invalid_source_type",
      message: "Invalid Advisor memory source type.",
    };
  }

  if (!includesValue(ADVISOR_MEMORY_TRUTH_STATUSES, params.input.truthStatus)) {
    return {
      ok: false,
      code: "invalid_truth_status",
      message: "Invalid Advisor memory truth status.",
    };
  }

  if (
    params.input.status !== undefined &&
    !includesValue(ADVISOR_MEMORY_ITEM_STATUSES, params.input.status)
  ) {
    return {
      ok: false,
      code: "invalid_status",
      message: "Invalid Advisor memory status.",
    };
  }

  const title = sanitizeAdvisorMemoryTitle(params.input.title);
  const summary = sanitizeAdvisorMemorySummary(params.input.summary);

  if (!title) {
    return { ok: false, code: "missing_title", message: "Memory title is required." };
  }

  if (!summary) {
    return { ok: false, code: "missing_summary", message: "Memory summary is required." };
  }

  if (containsObviousRawFileContent(params.input.summary)) {
    return {
      ok: false,
      code: "raw_file_content_detected",
      message: "Memory summary cannot store raw file contents.",
    };
  }

  if (
    params.input.confidence !== undefined &&
    params.input.confidence !== null &&
    (!Number.isInteger(params.input.confidence) ||
      params.input.confidence < 0 ||
      params.input.confidence > 100)
  ) {
    return {
      ok: false,
      code: "invalid_confidence",
      message: "Memory confidence must be an integer from 0 to 100.",
    };
  }

  return {
    ok: true,
    normalized: {
      ...params.input,
      assessmentId: params.input.assessmentId.trim(),
      workspaceId: params.input.workspaceId.trim(),
      title,
      summary,
      status: params.input.status,
      confidence: params.input.confidence ?? null,
    },
  };
}

export function validateAdvisorMemoryStatusTransition(params: {
  current: AdvisorMemoryItemStatus;
  next: AdvisorMemoryItemStatus;
}) {
  if (!canTransitionAdvisorMemoryStatus(params.current, params.next)) {
    return {
      ok: false as const,
      code: "invalid_status_transition",
      message: `Cannot transition Advisor memory from ${params.current} to ${params.next}.`,
    };
  }

  return { ok: true as const };
}
