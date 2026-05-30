"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../../../../lib/auth";
import { ensureAssessmentOwnership } from "../../../../../server/assessments/assessmentService";
import {
  archiveAdvisorMemoryItem,
  confirmAdvisorMemoryItem,
  createAdvisorMemoryItem,
  getAdvisorMemoryPanelState,
  rejectAdvisorMemoryItem,
  resolveAdvisorMemoryItem,
  supersedeAdvisorMemoryItem,
} from "../../../../../server/advisor/advisorMemoryService";
import type {
  AdvisorMemoryActionResult,
  AdvisorMemoryCreateInput,
  AdvisorMemoryItemType,
  AdvisorMemoryPanelState,
  AdvisorMemoryTruthStatus,
} from "../../../../../server/advisor/advisorMemoryTypes";
import { upsertUserProfileFromSession } from "../../../../../server/user/userProfileService";

async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  await upsertUserProfileFromSession({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    imageUrl: session.user.image ?? null,
    authProvider: "better-auth",
  });

  return session;
}

function revalidateAssessment(assessmentId: string) {
  revalidatePath(`/dashboard/assessments/${assessmentId}`);
}

function safeMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "Project Memory action could not be completed.";
}

async function loadMemory(assessmentId: string, userId: string): Promise<AdvisorMemoryPanelState> {
  return getAdvisorMemoryPanelState({ assessmentId, userId });
}

async function runMemoryAction(
  assessmentId: string,
  action: (userId: string) => Promise<string>,
): Promise<AdvisorMemoryActionResult> {
  const session = await requireSession();

  try {
    const message = await action(session.user.id);
    const memory = await loadMemory(assessmentId, session.user.id);
    revalidateAssessment(assessmentId);
    return { ok: true, message, memory };
  } catch (error) {
    let memory: AdvisorMemoryPanelState | undefined;
    try {
      memory = await loadMemory(assessmentId, session.user.id);
    } catch {
      memory = undefined;
    }

    return {
      ok: false,
      message: safeMessage(error),
      memory,
    };
  }
}

export async function listAdvisorMemoryItemsAction(
  assessmentId: string,
): Promise<AdvisorMemoryActionResult> {
  return runMemoryAction(assessmentId, async () => "Project Memory refreshed.");
}

export async function confirmAdvisorMemoryItemAction(
  assessmentId: string,
  memoryItemId: string,
): Promise<AdvisorMemoryActionResult> {
  return runMemoryAction(assessmentId, async (userId) => {
    await confirmAdvisorMemoryItem(memoryItemId, userId);
    return "Memory item confirmed.";
  });
}

export async function rejectAdvisorMemoryItemAction(
  assessmentId: string,
  memoryItemId: string,
): Promise<AdvisorMemoryActionResult> {
  return runMemoryAction(assessmentId, async (userId) => {
    await rejectAdvisorMemoryItem(memoryItemId, userId);
    return "Memory item rejected.";
  });
}

export async function resolveAdvisorMemoryItemAction(
  assessmentId: string,
  memoryItemId: string,
): Promise<AdvisorMemoryActionResult> {
  return runMemoryAction(assessmentId, async (userId) => {
    await resolveAdvisorMemoryItem(memoryItemId, userId);
    return "Memory item resolved.";
  });
}

export async function archiveAdvisorMemoryItemAction(
  assessmentId: string,
  memoryItemId: string,
): Promise<AdvisorMemoryActionResult> {
  return runMemoryAction(assessmentId, async (userId) => {
    await archiveAdvisorMemoryItem(memoryItemId, userId);
    return "Memory item archived.";
  });
}

export async function createAdvisorMemoryItemAction(params: {
  assessmentId: string;
  type: AdvisorMemoryItemType;
  truthStatus: AdvisorMemoryTruthStatus;
  title: string;
  summary: string;
}): Promise<AdvisorMemoryActionResult> {
  return runMemoryAction(params.assessmentId, async (userId) => {
    const assessment = await ensureAssessmentOwnership({
      userId,
      assessmentId: params.assessmentId,
    });
    await createAdvisorMemoryItem({
      userId,
      input: {
        assessmentId: assessment.id,
        workspaceId: assessment.workspaceId,
        type: params.type,
        sourceType: "user_message",
        truthStatus: params.truthStatus,
        title: params.title,
        summary: params.summary,
        confidence: params.truthStatus === "user_confirmed" ? 90 : 70,
      },
    });
    return "Memory note saved.";
  });
}

export async function saveAdvisorRecommendationAsMemoryAction(params: {
  assessmentId: string;
  title: string;
  summary: string;
  sourceMessageId?: string | null;
}): Promise<AdvisorMemoryActionResult> {
  return runMemoryAction(params.assessmentId, async (userId) => {
    const assessment = await ensureAssessmentOwnership({
      userId,
      assessmentId: params.assessmentId,
    });
    await createAdvisorMemoryItem({
      userId,
      input: {
        assessmentId: assessment.id,
        workspaceId: assessment.workspaceId,
        sourceMessageId: params.sourceMessageId ?? null,
        type: "advisor_recommendation",
        sourceType: "advisor_message",
        truthStatus: "advisor_generated",
        title: params.title,
        summary: params.summary,
        confidence: 65,
      },
    });
    return "Advisor recommendation saved to Project Memory.";
  });
}

export async function supersedeAdvisorMemoryItemAction(params: {
  assessmentId: string;
  memoryItemId: string;
  type: AdvisorMemoryItemType;
  truthStatus: AdvisorMemoryTruthStatus;
  title: string;
  summary: string;
}): Promise<AdvisorMemoryActionResult> {
  return runMemoryAction(params.assessmentId, async (userId) => {
    const assessment = await ensureAssessmentOwnership({
      userId,
      assessmentId: params.assessmentId,
    });
    const newInput: AdvisorMemoryCreateInput = {
      assessmentId: assessment.id,
      workspaceId: assessment.workspaceId,
      type: params.type,
      sourceType: "user_message",
      truthStatus: params.truthStatus,
      title: params.title,
      summary: params.summary,
      confidence: params.truthStatus === "user_confirmed" ? 90 : 70,
    };
    await supersedeAdvisorMemoryItem({
      oldId: params.memoryItemId,
      userId,
      newInput,
    });
    return "Memory item superseded.";
  });
}
