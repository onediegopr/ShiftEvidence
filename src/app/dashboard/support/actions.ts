"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../../lib/auth";
import { safeRedirectError } from "../../../server/assessments/formUtils";
import { createDashboardSupportRequest } from "../../../server/support/supportRequestService";
import { upsertUserProfileFromSession } from "../../../server/user/userProfileService";
import { ensureDefaultWorkspace } from "../../../server/workspace/workspaceService";

export async function createDashboardSupportRequestAction(formData: FormData) {
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

  const workspace = await ensureDefaultWorkspace({
    userId: session.user.id,
    userDisplayName: session.user.name,
  });
  let redirectTarget = "/dashboard?support=sent";

  try {
    await createDashboardSupportRequest({
      userId: session.user.id,
      userEmail: session.user.email,
      workspaceId: workspace.id,
      formData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send support request.";
    redirectTarget = `/dashboard?supportError=${safeRedirectError(message)}`;
  }

  redirect(redirectTarget);
}
