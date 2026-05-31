import { prisma } from "../../lib/prisma";
import { getEffectiveUserEntitlement } from "../admin/runtimeSettingsService";
import type { AssessmentDetail } from "../assessments/assessmentService";
import { resolveAdvisorMemoryPlanLimits } from "./advisorMemoryPlanLimits";
import { createAdvisorMemoryItem } from "./advisorMemoryService";
import {
  containsObviousRawFileContent,
  sanitizeAdvisorMemorySummary,
  sanitizeAdvisorMemoryTitle,
} from "./advisorMemorySecurity";
import type {
  AdvisorMemoryCreateInput,
  AdvisorMemoryItemType,
  AdvisorMemorySourceType,
  AdvisorMemoryTruthStatus,
} from "./advisorMemoryTypes";
import { inspectSeniorAdvisorMessage } from "./seniorAdvisorSecurity";

export type AdvisorMemoryExtractionRole = "user" | "assistant";
export type AdvisorMemoryExtractionStatus =
  | "disabled"
  | "skipped_no_signal"
  | "created"
  | "limit_reached"
  | "failed";

export type AdvisorMemoryExtractionCandidate = AdvisorMemoryCreateInput & {
  extractionRule: string;
};

export type AdvisorMemoryAutoExtractionResult = {
  status: AdvisorMemoryExtractionStatus;
  generated: number;
  skipped: number;
  failed: number;
  reasons: string[];
};

type ExtractionScope = {
  assessmentId: string;
  workspaceId: string;
  conversationId?: string | null;
  sourceMessageId?: string | null;
  createdByUserId?: string | null;
};

type ExistingMemoryItem = {
  id: string;
  type: AdvisorMemoryItemType;
  title: string;
  summary: string;
  sourceMessageId: string | null;
};

const MAX_USER_CANDIDATES = 2;
const MAX_ASSISTANT_CANDIDATES = 3;
const MAX_SEND_CANDIDATES = 4;

const TRIVIAL_MESSAGES = new Set([
  "ok",
  "okay",
  "dale",
  "gracias",
  "thanks",
  "si",
  "sí",
  "no",
  "yes",
  "hello",
  "hola",
]);

function normalizeForDedupe(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSimilarity(a: string, b: string) {
  const left = new Set(normalizeForDedupe(a).split(" ").filter((token) => token.length > 2));
  const right = new Set(normalizeForDedupe(b).split(" ").filter((token) => token.length > 2));
  if (left.size === 0 || right.size === 0) return 0;

  const intersection = [...left].filter((token) => right.has(token)).length;
  return intersection / Math.max(left.size, right.size);
}

function looksTrivial(value: string) {
  const normalized = normalizeForDedupe(value);
  if (normalized.length < 8) return true;
  if (TRIVIAL_MESSAGES.has(normalized)) return true;
  if (/^[a-z]{3,8}$/.test(normalized) && !/\s/.test(normalized)) return true;
  return false;
}

function shouldSkipForSafety(value: string) {
  if (containsObviousRawFileContent(value)) return true;
  const inspection = inspectSeniorAdvisorMessage(value, 2_000);
  return inspection.safetyFlags.some((flag) =>
    ["possible_secret_redacted", "prompt_injection_attempt"].includes(flag.flag),
  );
}

function titleFromSummary(prefix: string, value: string) {
  const firstSentence = value.split(/[.!?\n]/).find((part) => part.trim()) ?? value;
  const sanitized = sanitizeAdvisorMemoryTitle(firstSentence);
  return sanitized.length > 0 ? sanitized.slice(0, 120) : prefix;
}

function candidate(params: ExtractionScope & {
  type: AdvisorMemoryItemType;
  sourceType: AdvisorMemorySourceType;
  truthStatus: AdvisorMemoryTruthStatus;
  title: string;
  summary: string;
  confidence: number;
  extractionRule: string;
  tags?: string[];
}): AdvisorMemoryExtractionCandidate | null {
  const title = sanitizeAdvisorMemoryTitle(params.title).slice(0, 120);
  const summary = sanitizeAdvisorMemorySummary(params.summary).slice(0, 700);
  if (!title || !summary || containsObviousRawFileContent(summary)) {
    return null;
  }

  return {
    assessmentId: params.assessmentId,
    workspaceId: params.workspaceId,
    conversationId: params.conversationId ?? null,
    sourceMessageId: params.sourceMessageId ?? null,
    createdByUserId: params.createdByUserId ?? null,
    type: params.type,
    status: "needs_review",
    sourceType: params.sourceType,
    truthStatus: params.truthStatus,
    title,
    summary,
    confidence: params.confidence,
    tags: ["auto-suggested", params.extractionRule, ...(params.tags ?? [])],
    details: {
      autoExtracted: true,
      extractionRule: params.extractionRule,
    },
    extractionRule: params.extractionRule,
  };
}

function uniqueCandidates(candidates: AdvisorMemoryExtractionCandidate[]) {
  const output: AdvisorMemoryExtractionCandidate[] = [];
  for (const item of candidates) {
    if (
      output.some(
        (existing) =>
          existing.type === item.type &&
          (tokenSimilarity(existing.title, item.title) >= 0.8 ||
            tokenSimilarity(existing.summary, item.summary) >= 0.75),
      )
    ) {
      continue;
    }
    output.push(item);
  }
  return output;
}

export function isDuplicateAdvisorMemoryCandidate(
  candidateItem: AdvisorMemoryExtractionCandidate,
  existingItems: ExistingMemoryItem[],
) {
  return existingItems.some((item) => {
    if (item.type !== candidateItem.type) return false;
    if (candidateItem.sourceMessageId && item.sourceMessageId === candidateItem.sourceMessageId) {
      return true;
    }
    return (
      normalizeForDedupe(item.title) === normalizeForDedupe(candidateItem.title) ||
      tokenSimilarity(item.title, candidateItem.title) >= 0.8 ||
      tokenSimilarity(item.summary, candidateItem.summary) >= 0.75
    );
  });
}

export function extractAdvisorMemoryCandidates(params: ExtractionScope & {
  role: AdvisorMemoryExtractionRole;
  content: string;
  assistantStatus?: "completed" | "failed" | "blocked";
}) {
  const content = params.content.trim();
  if (looksTrivial(content) || shouldSkipForSafety(content)) {
    return [];
  }

  if (params.role === "assistant" && params.assistantStatus !== "completed") {
    return [];
  }

  const sourceType: AdvisorMemorySourceType =
    params.role === "user" ? "user_message" : "advisor_message";
  const userTruth: AdvisorMemoryTruthStatus = "customer_reported";
  const candidates: Array<AdvisorMemoryExtractionCandidate | null> = [];

  if (params.role === "user") {
    if (
      /\b(decidimos|vamos a|lo damos por valido|lo damos por válido|aceptamos|dejamos pendiente|no vamos a|postergamos|cerramos|aprobado|no avanzar|we decided|we will|approved|accepted|defer)\b/i.test(content)
    ) {
      candidates.push(
        candidate({
          ...params,
          type: "decision",
          sourceType,
          truthStatus: userTruth,
          title: titleFromSummary("Decision captured", content),
          summary: content,
          confidence: 80,
          extractionRule: "user_decision",
        }),
      );
    }

    if (
      content.endsWith("?") ||
      /\b(falta saber|tenemos que confirmar|no se si|no sé si|hay que validar|que falta|qué falta|podemos avanzar|conviene)\b/i.test(content)
    ) {
      candidates.push(
        candidate({
          ...params,
          type: "open_question",
          sourceType,
          truthStatus: content.endsWith("?") ? userTruth : "missing",
          title: titleFromSummary("Open question", content),
          summary: content,
          confidence: 70,
          extractionRule: "user_open_question",
        }),
      );
    }

    if (/\b(next step|proximo paso|próximo paso|tenemos que|hay que|subir rvtools|validar|cargar|revisar|hacer smoke|confirmar)\b/i.test(content)) {
      candidates.push(
        candidate({
          ...params,
          type: "next_step",
          sourceType,
          truthStatus: userTruth,
          title: titleFromSummary("Next step", content),
          summary: content,
          confidence: 75,
          extractionRule: "user_next_step",
        }),
      );
    }

    if (
      /\b(no tocar db|no deploy|sin migraciones|no full launch|no enviar secrets|no usar openai|solo gemini|opencode go fallback)\b/i.test(content)
    ) {
      candidates.push(
        candidate({
          ...params,
          type: "constraint",
          sourceType,
          truthStatus: userTruth,
          title: titleFromSummary("Project constraint", content),
          summary: content,
          confidence: 80,
          extractionRule: "user_constraint",
        }),
      );
    }
  } else {
    if (
      /\b(rvtools missing|no rvtools evidence|missing evidence|storage destination readiness not provided|licensing data missing|client context missing)\b/i.test(content)
    ) {
      candidates.push(
        candidate({
          ...params,
          type: "evidence_note",
          sourceType,
          truthStatus: "missing",
          title: titleFromSummary("Missing evidence", content),
          summary: content,
          confidence: 80,
          extractionRule: "assistant_missing_evidence",
          tags: ["missing-evidence"],
        }),
      );
    }

    const recommendationLines = content
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*•\d.\s]+/, "").trim())
      .filter(Boolean);
    const hasRecommendationSection = /\b(next actions|recommended|recommendation|next steps)\b/i.test(content);
    for (const line of recommendationLines) {
      if (
        hasRecommendationSection &&
        /\b(upload|validate|confirm|review|collect|run|check|prepare|next|recommend)\b/i.test(line)
      ) {
        candidates.push(
          candidate({
            ...params,
            type: "next_step",
            sourceType,
            truthStatus: "advisor_generated",
            title: titleFromSummary("Advisor recommendation", line),
            summary: line,
            confidence: 65,
            extractionRule: "assistant_next_actions",
            tags: ["advisor-recommendation"],
          }),
        );
      }
    }
  }

  const filtered = candidates.filter((item): item is AdvisorMemoryExtractionCandidate => item !== null);
  const limited = uniqueCandidates(filtered).slice(
    0,
    params.role === "user" ? MAX_USER_CANDIDATES : MAX_ASSISTANT_CANDIDATES,
  );
  return limited;
}

export async function runAdvisorMemoryAutoExtraction(params: {
  userId: string;
  assessment: AssessmentDetail;
  conversationId: string;
  userMessage: { id: string; content: string; status: "completed" | "failed" | "blocked" };
  assistantMessage?: {
    id: string;
    content: string;
    status: "completed" | "failed" | "blocked";
  };
}): Promise<AdvisorMemoryAutoExtractionResult> {
  try {
    const entitlement = await getEffectiveUserEntitlement(params.userId);
    const limits = resolveAdvisorMemoryPlanLimits({
      userEntitlementPlanKey: entitlement?.planKey,
      assessmentPlanLevel: params.assessment.planLevel,
      workspacePlan: params.assessment.workspace.plan,
    });

    if (!limits.enabled || !limits.canUseMemory) {
      return {
        status: "disabled",
        generated: 0,
        skipped: 0,
        failed: 0,
        reasons: ["memory_disabled_for_plan"],
      };
    }

    const existingItems = await prisma.assessmentAdvisorMemoryItem.findMany({
      where: {
        assessmentId: params.assessment.id,
        workspaceId: params.assessment.workspaceId,
        status: { notIn: ["archived", "rejected"] },
      },
      select: {
        id: true,
        type: true,
        title: true,
        summary: true,
        sourceMessageId: true,
      },
      take: limits.maxItemsPerAssessment,
    });

    if (existingItems.length >= limits.maxItemsPerAssessment) {
      return {
        status: "limit_reached",
        generated: 0,
        skipped: 0,
        failed: 0,
        reasons: ["memory_limit_reached"],
      };
    }

    const candidates = [
      ...extractAdvisorMemoryCandidates({
        assessmentId: params.assessment.id,
        workspaceId: params.assessment.workspaceId,
        conversationId: params.conversationId,
        sourceMessageId: params.userMessage.id,
        createdByUserId: params.userId,
        role: "user",
        content: params.userMessage.content,
      }),
      ...(params.assistantMessage
        ? extractAdvisorMemoryCandidates({
            assessmentId: params.assessment.id,
            workspaceId: params.assessment.workspaceId,
            conversationId: params.conversationId,
            sourceMessageId: params.assistantMessage.id,
            createdByUserId: params.userId,
            role: "assistant",
            content: params.assistantMessage.content,
            assistantStatus: params.assistantMessage.status,
          })
        : []),
    ].slice(0, MAX_SEND_CANDIDATES);

    if (candidates.length === 0) {
      return {
        status: "skipped_no_signal",
        generated: 0,
        skipped: 0,
        failed: 0,
        reasons: ["no_signal"],
      };
    }

    let generated = 0;
    let skipped = 0;
    let failed = 0;
    const reasons: string[] = [];
    const createdOrExisting = [...existingItems];

    for (const item of candidates) {
      if (createdOrExisting.length >= limits.maxItemsPerAssessment) {
        skipped += 1;
        reasons.push("memory_limit_reached");
        continue;
      }

      if (isDuplicateAdvisorMemoryCandidate(item, createdOrExisting)) {
        skipped += 1;
        reasons.push("duplicate");
        continue;
      }

      try {
        const created = await createAdvisorMemoryItem({
          userId: params.userId,
          input: item,
        });
        generated += 1;
        createdOrExisting.push({
          id: created.id,
          type: created.type,
          title: created.title,
          summary: created.summary,
          sourceMessageId: created.sourceMessageId,
        });
      } catch {
        failed += 1;
        reasons.push("create_failed");
      }
    }

    return {
      status: generated > 0 ? "created" : reasons.includes("memory_limit_reached") ? "limit_reached" : "skipped_no_signal",
      generated,
      skipped,
      failed,
      reasons: [...new Set(reasons)],
    };
  } catch {
    return {
      status: "failed",
      generated: 0,
      skipped: 0,
      failed: 1,
      reasons: ["extraction_failed"],
    };
  }
}

export function buildDecisionMemoryItem(params: ExtractionScope & { decision: string }): AdvisorMemoryCreateInput {
  return {
    ...candidate({
      ...params,
      type: "decision",
      sourceType: "user_message",
      truthStatus: "customer_reported",
      title: "Decision captured",
      summary: params.decision,
      confidence: 80,
      extractionRule: "user_decision",
    })!,
  };
}

export function buildOpenQuestionMemoryItem(params: ExtractionScope & { question: string }): AdvisorMemoryCreateInput {
  return {
    ...candidate({
      ...params,
      type: "open_question",
      sourceType: "user_message",
      truthStatus: "missing",
      title: "Open question",
      summary: params.question,
      confidence: 70,
      extractionRule: "user_open_question",
    })!,
  };
}

export function buildNextStepMemoryItem(params: ExtractionScope & {
  nextStep: string;
  sourceType?: AdvisorMemoryCreateInput["sourceType"];
}): AdvisorMemoryCreateInput {
  return {
    ...candidate({
      ...params,
      type: "next_step",
      sourceType: params.sourceType ?? "advisor_message",
      truthStatus: params.sourceType === "user_message" ? "customer_reported" : "advisor_generated",
      title: "Next step",
      summary: params.nextStep,
      confidence: 65,
      extractionRule: "next_step",
    })!,
  };
}

export function buildMemoryCandidateFromUserStatement(params: ExtractionScope & {
  statement: string;
}): AdvisorMemoryCreateInput | null {
  return extractAdvisorMemoryCandidates({
    ...params,
    role: "user",
    content: params.statement,
  })[0] ?? null;
}
