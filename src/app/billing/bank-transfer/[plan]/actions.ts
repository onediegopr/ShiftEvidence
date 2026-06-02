"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../../../lib/auth";
import { safeRedirectError } from "../../../../server/assessments/formUtils";
import { createBillingInvoiceRequest } from "../../../../server/billing/invoiceRequestService";
import { upsertUserProfileFromSession } from "../../../../server/user/userProfileService";
import { ensureDefaultWorkspace } from "../../../../server/workspace/workspaceService";

export async function createBillingInvoiceRequestAction(planSlug: string, formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  let userId: string | null = null;
  let workspaceId: string | null = null;
  let redirectTarget = `/billing/bank-transfer/${planSlug}?requested=1`;

  try {
    if (session) {
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
      userId = session.user.id;
      workspaceId = workspace.id;
    }

    await createBillingInvoiceRequest({
      planSlug,
      formData,
      userId,
      workspaceId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create the invoice request.";
    redirectTarget = `/billing/bank-transfer/${planSlug}?error=${safeRedirectError(message)}`;
  }

  redirect(redirectTarget);
}