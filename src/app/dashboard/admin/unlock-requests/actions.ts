"use server";

import { redirect } from "next/navigation";
import { requireAdminSession } from "../../../../server/admin/adminAuth";
import { parseOptionalString, safeRedirectError } from "../../../../server/assessments/formUtils";
import {
  approveUnlockRequest,
  cancelUnlockRequest,
  fulfillUnlockRequest,
  rejectUnlockRequest,
} from "../../../../server/unlocks/unlockRequestService";

function getAdminRedirectPath(query?: string) {
  return query
    ? `/dashboard/admin/unlock-requests?${query}`
    : `/dashboard/admin/unlock-requests`;
}

export async function approveUnlockRequestAction(unlockRequestId: string, formData: FormData) {
  const session = await requireAdminSession();
  let redirectTarget = getAdminRedirectPath("saved=1");

  try {
    const adminNotes = parseOptionalString(formData.get("adminNotes"));
    await approveUnlockRequest({
      adminUserId: session.user.id,
      unlockRequestId,
      adminNotes,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to approve the unlock request.";
    redirectTarget = getAdminRedirectPath(`error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function fulfillUnlockRequestAction(unlockRequestId: string, formData: FormData) {
  const session = await requireAdminSession();
  let redirectTarget = getAdminRedirectPath("saved=1");

  try {
    const adminNotes = parseOptionalString(formData.get("adminNotes"));
    await fulfillUnlockRequest({
      adminUserId: session.user.id,
      unlockRequestId,
      adminNotes,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fulfill the unlock request.";
    redirectTarget = getAdminRedirectPath(`error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function rejectUnlockRequestAction(unlockRequestId: string, formData: FormData) {
  const session = await requireAdminSession();
  let redirectTarget = getAdminRedirectPath("saved=1");

  try {
    const adminNotes = parseOptionalString(formData.get("adminNotes"));
    await rejectUnlockRequest({
      adminUserId: session.user.id,
      unlockRequestId,
      adminNotes,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reject the unlock request.";
    redirectTarget = getAdminRedirectPath(`error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function cancelUnlockRequestAction(unlockRequestId: string, formData: FormData) {
  const session = await requireAdminSession();
  let redirectTarget = getAdminRedirectPath("saved=1");

  try {
    const adminNotes = parseOptionalString(formData.get("adminNotes"));
    await cancelUnlockRequest({
      adminUserId: session.user.id,
      unlockRequestId,
      adminNotes,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to cancel the unlock request.";
    redirectTarget = getAdminRedirectPath(`error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}
