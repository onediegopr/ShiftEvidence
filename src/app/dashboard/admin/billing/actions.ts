"use server";

import { redirect } from "next/navigation";
import { requireAdminSession } from "../../../../server/admin/adminAuth";
import { fulfillBillingOrderManually } from "../../../../server/billing/admin/billingManualFulfillmentService";
import { safeRedirectError } from "../../../../server/assessments/formUtils";
import {
  matchBillingOrder,
  matchBillingSubscription,
} from "../../../../server/billing/admin/billingManualMatchService";

function getBillingRedirect(params: string): never {
  redirect(`/dashboard/admin/billing?${params}`);
}

function readOptionalFormText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function matchBillingOrderAction(formData: FormData) {
  const session = await requireAdminSession();
  let redirectParams = "saved=order-match";

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
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar el match de la orden.";
    redirectParams = `error=${safeRedirectError(message)}`;
  }

  getBillingRedirect(redirectParams);
}

export async function matchBillingSubscriptionAction(formData: FormData) {
  const session = await requireAdminSession();
  let redirectParams = "saved=subscription-match";

  try {
    await matchBillingSubscription({
      adminUserId: session.user.id,
      adminEmail: session.user.email,
      billingSubscriptionId: String(formData.get("billingSubscriptionId") ?? ""),
      userId: readOptionalFormText(formData, "userId"),
      workspaceId: readOptionalFormText(formData, "workspaceId"),
      note: readOptionalFormText(formData, "note"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar el match de la suscripcion.";
    redirectParams = `error=${safeRedirectError(message)}`;
  }

  getBillingRedirect(redirectParams);
}

export async function fulfillBillingOrderAction(formData: FormData) {
  const session = await requireAdminSession();
  let redirectParams = "saved=fulfillment";

  try {
    await fulfillBillingOrderManually({
      adminUserId: session.user.id,
      adminEmail: session.user.email,
      billingOrderId: String(formData.get("billingOrderId") ?? ""),
      confirmationAccepted: formData.get("confirmFulfillment") === "confirmed",
      note: readOptionalFormText(formData, "note"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo conceder acceso manual.";
    redirectParams = `error=${safeRedirectError(message)}`;
  }

  getBillingRedirect(redirectParams);
}
