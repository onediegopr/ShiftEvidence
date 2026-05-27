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

function getAssessmentRedirectPath(assessmentId: string, query?: string, tab?: string) {
  const params = [];
  if (query) params.push(query);
  if (tab) params.push(`tab=${tab}`);
  const queryString = params.length > 0 ? `?${params.join("&")}` : "";
  return `/dashboard/assessments/${assessmentId}${queryString}`;
}

export async function generateInventoryRiskAction(assessmentId: string) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1", "report");

  try {
    await generateInventoryRiskInsights({
      userId: session.user.id,
      assessmentId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate risk insights.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`, "report");
  }

  redirect(redirectTarget);
}
