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

function translateAdminUnlockError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const knownErrors: Record<string, string> = {
    "Unlock request not found.": "Solicitud no encontrada.",
    "This unlock request is already closed.": "Esta solicitud ya esta cerrada.",
    "This unlock request is already fulfilled.": "Esta solicitud ya fue completada.",
    "Only pending or approved unlock requests can be rejected.":
      "Solo se pueden rechazar solicitudes pendientes o aprobadas.",
  };

  return knownErrors[message] ?? message;
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
    const message = translateAdminUnlockError(error, "No se pudo aprobar la solicitud.");
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
    const message = translateAdminUnlockError(error, "No se pudo completar la solicitud.");
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
    const message = translateAdminUnlockError(error, "No se pudo rechazar la solicitud.");
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
    const message = translateAdminUnlockError(error, "No se pudo cancelar la solicitud.");
    redirectTarget = getAdminRedirectPath(`error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}
