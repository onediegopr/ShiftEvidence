"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeRedirectError } from "../../server/assessments/formUtils";
import { logger } from "../../server/logging/logger";
import { getClientIpFromHeaders } from "../../server/security/rateLimit";

export async function createTechnicalReviewRequestAction(formData: FormData) {
  const source = typeof formData.get("source") === "string" ? String(formData.get("source")) : "direct";
  let redirectTarget = `/technical-review?sent=1&source=${encodeURIComponent(source)}`;

  try {
    const requestHeaders = await headers();
    const { createTechnicalReviewSupportRequest } = await import("../../server/support/supportRequestService");
    const { sendTechnicalReviewNotificationEmail } = await import("../../server/support/supportNotificationService");
    const request = await createTechnicalReviewSupportRequest(formData, {
      clientIp: getClientIpFromHeaders(requestHeaders),
      sourceLabel: source,
    });
    try {
      await sendTechnicalReviewNotificationEmail({
        request,
        sourceLabel: source,
      });
    } catch (notificationError) {
      logger.warn("technical_review_notification_failed", {
        supportRequestId: request.id,
        source,
        notificationError,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send technical review request.";
    redirectTarget = `/technical-review?error=${safeRedirectError(message)}&source=${encodeURIComponent(source)}`;
  }

  redirect(redirectTarget);
}
