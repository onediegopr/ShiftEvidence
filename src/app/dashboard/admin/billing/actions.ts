"use server";

import { redirect } from "next/navigation";
import { requireAdminSession } from "../../../../server/admin/adminAuth";
import { safeRedirectError } from "../../../../server/assessments/formUtils";
import {
  matchBillingOrder,
  matchBillingSubscription,
} from "../../../../server/billing/admin/billingManualMatchService";

function getBillingRedirect(params: string) {
  redirect(`/dashboard/admin/billing?${params}`);
}

function readOptionalFormText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function matchBillingOrderAction(formData: FormData) {
  const session = await requireAdminSession();

  try {
    await matchBillingOrder({
      adminUserId: session.user.id,
      adminEmail: session.user.email,
      billingOrderId: String(formData.get("billingOrderId") ?? ""),
      userId: readOptionalFormText(formData, "userId"),
      workspaceId: readOptionalFormText(formData, "workspaceId"),
      assessmentId: readOptionalFormText(formData, "assessmentId"),
      note: readOptionalFormText(formData, "note"),
    });
    getBillingRedirect("saved=order-match");
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar el match de la orden.";
    getBillingRedirect(`error=${safeRedirectError(message)}`);
  }
}

export async function matchBillingSubscriptionAction(formData: FormData) {
  const session = await requireAdminSession();

  try {
    await matchBillingSubscription({
      adminUserId: session.user.id,
      adminEmail: session.user.email,
      billingSubscriptionId: String(formData.get("billingSubscriptionId") ?? ""),
      userId: readOptionalFormText(formData, "userId"),
      workspaceId: readOptionalFormText(formData, "workspaceId"),
      note: readOptionalFormText(formData, "note"),
    });
    getBillingRedirect("saved=subscription-match");
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar el match de la suscripcion.";
    getBillingRedirect(`error=${safeRedirectError(message)}`);
  }
}
