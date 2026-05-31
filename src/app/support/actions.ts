"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createPublicSupportRequest } from "../../server/support/supportRequestService";
import { safeRedirectError } from "../../server/assessments/formUtils";
import { getClientIpFromHeaders } from "../../server/security/rateLimit";

export async function createPublicSupportRequestAction(formData: FormData) {
  let redirectTarget = "/support?sent=1";

  try {
    const requestHeaders = await headers();
    await createPublicSupportRequest(formData, {
      clientIp: getClientIpFromHeaders(requestHeaders),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send support request.";
    redirectTarget = `/support?error=${safeRedirectError(message)}`;
  }

  redirect(redirectTarget);
}
