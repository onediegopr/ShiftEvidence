"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../../../lib/auth";
import { createAssessment } from "../../../../server/assessments/assessmentService";
import { ensureDefaultWorkspace } from "../../../../server/workspace/workspaceService";
import { upsertUserProfileFromSession } from "../../../../server/user/userProfileService";
import {
  parseBooleanField,
  parseOptionalString,
  parseRequiredString,
  safeRedirectError,
} from "../../../../server/assessments/formUtils";
import { INPUT_LIMITS } from "../../../../server/validation/inputLimits";
import { assertNotDemoMode } from "../../../../server/demo/demoGuards";

export async function createAssessmentAction(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  let redirectTarget: string;

  try {
    assertNotDemoMode({
      email: session.user.email,
      kind: "create_assessment",
    });

    const title = parseRequiredString(formData.get("title"), "Assessment title", {
      maxLength: INPUT_LIMITS.assessmentTitle,
    });
    const clientLabel = parseOptionalString(formData.get("clientLabel"), {
      fieldName: "Client / company label",
      maxLength: INPUT_LIMITS.companyName,
    });
    const storageReadinessEnabled = parseBooleanField(formData.get("storageReadinessEnabled"));

    await upsertUserProfileFromSession({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      imageUrl: session.user.image ?? null,
      authProvider: "better-auth",
    });

    const workspace = await ensureDefaultWorkspace({
      userId: session.user.id,
      userDisplayName: session.user.name,
    });

    const assessment = await createAssessment({
      userId: session.user.id,
      workspaceId: workspace.id,
      title,
      clientLabel,
      storageReadinessEnabled,
    });

    redirectTarget = `/dashboard/assessments/${assessment.id}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create assessment.";
    redirectTarget = `/dashboard/assessments/new?error=${safeRedirectError(message)}`;
  }

  redirect(redirectTarget);
}
