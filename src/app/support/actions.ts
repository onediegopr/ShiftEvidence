"use server";

import { redirect } from "next/navigation";
import { createPublicSupportRequest } from "../../server/support/supportRequestService";
import { safeRedirectError } from "../../server/assessments/formUtils";

export async function createPublicSupportRequestAction(formData: FormData) {
  let redirectTarget = "/support?sent=1";

  try {
    await createPublicSupportRequest(formData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send support request.";
    redirectTarget = `/support?error=${safeRedirectError(message)}`;
  }

  redirect(redirectTarget);
}
