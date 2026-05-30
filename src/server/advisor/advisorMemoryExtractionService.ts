import type { AdvisorMemoryCreateInput } from "./advisorMemoryTypes";

function baseCandidate(params: {
  assessmentId: string;
  workspaceId: string;
  conversationId?: string | null;
  sourceMessageId?: string | null;
  createdByUserId?: string | null;
  title: string;
  summary: string;
}): Pick<
  AdvisorMemoryCreateInput,
  | "assessmentId"
  | "workspaceId"
  | "conversationId"
  | "sourceMessageId"
  | "createdByUserId"
  | "title"
  | "summary"
> {
  return {
    assessmentId: params.assessmentId,
    workspaceId: params.workspaceId,
    conversationId: params.conversationId ?? null,
    sourceMessageId: params.sourceMessageId ?? null,
    createdByUserId: params.createdByUserId ?? null,
    title: params.title,
    summary: params.summary,
  };
}

export function buildDecisionMemoryItem(params: {
  assessmentId: string;
  workspaceId: string;
  conversationId?: string | null;
  sourceMessageId?: string | null;
  createdByUserId?: string | null;
  decision: string;
}): AdvisorMemoryCreateInput {
  return {
    ...baseCandidate({
      ...params,
      title: "Decision captured",
      summary: params.decision,
    }),
    type: "decision",
    sourceType: "user_message",
    truthStatus: "customer_reported",
    confidence: 80,
  };
}

export function buildOpenQuestionMemoryItem(params: {
  assessmentId: string;
  workspaceId: string;
  conversationId?: string | null;
  sourceMessageId?: string | null;
  createdByUserId?: string | null;
  question: string;
}): AdvisorMemoryCreateInput {
  return {
    ...baseCandidate({
      ...params,
      title: "Open question",
      summary: params.question,
    }),
    type: "open_question",
    sourceType: "user_message",
    truthStatus: "missing",
    confidence: 70,
  };
}

export function buildNextStepMemoryItem(params: {
  assessmentId: string;
  workspaceId: string;
  conversationId?: string | null;
  sourceMessageId?: string | null;
  createdByUserId?: string | null;
  nextStep: string;
  sourceType?: AdvisorMemoryCreateInput["sourceType"];
}): AdvisorMemoryCreateInput {
  return {
    ...baseCandidate({
      ...params,
      title: "Next step",
      summary: params.nextStep,
    }),
    type: "next_step",
    sourceType: params.sourceType ?? "advisor_message",
    truthStatus: "advisor_generated",
    confidence: 65,
  };
}

export function buildMemoryCandidateFromUserStatement(params: {
  assessmentId: string;
  workspaceId: string;
  conversationId?: string | null;
  sourceMessageId?: string | null;
  createdByUserId?: string | null;
  statement: string;
}): AdvisorMemoryCreateInput | null {
  const statement = params.statement.trim();
  if (!statement) return null;

  if (/\b(we decided|decision|we will|approved|accepted)\b/i.test(statement)) {
    return buildDecisionMemoryItem({ ...params, decision: statement });
  }

  if (statement.endsWith("?")) {
    return buildOpenQuestionMemoryItem({ ...params, question: statement });
  }

  if (/\b(next step|todo|follow up|upload|validate|confirm)\b/i.test(statement)) {
    return buildNextStepMemoryItem({
      ...params,
      nextStep: statement,
      sourceType: "user_message",
    });
  }

  return null;
}
