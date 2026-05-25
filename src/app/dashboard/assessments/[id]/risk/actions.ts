"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../../../../lib/auth";
import { upsertUserProfileFromSession } from "../../../../../server/user/userProfileService";
import { generateInventoryRiskInsights } from "../../../../../server/risk/riskFindingService";
import { safeRedirectError } from "../../../../../server/assessments/formUtils";

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

function getAssessmentRedirectPath(assessmentId: string, query?: string) {
  return query ? `/dashboard/assessments/${assessmentId}?${query}` : `/dashboard/assessments/${assessmentId}`;
}

export async function generateInventoryRiskAction(assessmentId: string) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1");

  try {
    await generateInventoryRiskInsights({
      userId: session.user.id,
      assessmentId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate risk insights.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}
