"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "../../../../../lib/auth";
import {
  requestMoreAdvisorCredits,
  sendSeniorAdvisorMessage,
} from "../../../../../server/advisor/seniorAdvisorService";
import type { SeniorAdvisorSendResult } from "../../../../../server/advisor/seniorAdvisorTypes";
import { upsertUserProfileFromSession } from "../../../../../server/user/userProfileService";
import {
  assertNotDemoMode,
  DEMO_ADVISOR_BLOCK_MESSAGE,
  DemoModeMutationError,
} from "../../../../../server/demo/demoGuards";

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

export async function sendSeniorAdvisorMessageAction(
  assessmentId: string,
  message: string,
): Promise<SeniorAdvisorSendResult> {
  const session = await requireSession();
  try {
    assertNotDemoMode({
      email: session.user.email,
      assessmentId,
      kind: "live_advisor",
    });
  } catch (error) {
    if (error instanceof DemoModeMutationError) {
      return {
        ok: false,
        code: "ai_disabled",
        message: DEMO_ADVISOR_BLOCK_MESSAGE,
      };
    }

    throw error;
  }

  const result = await sendSeniorAdvisorMessage({
    userId: session.user.id,
    assessmentId,
    message,
  });

  revalidateAssessment(assessmentId);
  return result;
}

export async function requestSeniorAdvisorCreditsAction(assessmentId: string) {
  const session = await requireSession();
  assertNotDemoMode({
    email: session.user.email,
    assessmentId,
    kind: "live_advisor",
  });

  const result = await requestMoreAdvisorCredits({
    userId: session.user.id,
    assessmentId,
  });

  revalidateAssessment(assessmentId);
  return result;
}
