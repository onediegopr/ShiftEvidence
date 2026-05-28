"use server";

import { redirect } from "next/navigation";
import { requireAdminSession } from "../../../server/admin/adminAuth";
import {
  parseAiBudgetForm,
  revokeUserEntitlement,
  updateAiBudgetSettings,
  updateCommercialOpportunityFromForm,
  upsertUserEntitlementFromForm,
} from "../../../server/admin/adminOpsService";
import { safeRedirectError } from "../../../server/assessments/formUtils";

function adminRedirect(params: string) {
  redirect(`/dashboard/admin?${params}`);
}

export async function updateAiBudgetAction(formData: FormData) {
  const session = await requireAdminSession();

  try {
    await updateAiBudgetSettings({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      settings: parseAiBudgetForm(formData),
    });
    adminRedirect("saved=budget#ia-consumo");
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el presupuesto IA.";
    adminRedirect(`error=${safeRedirectError(message)}#ia-consumo`);
  }
}

export async function createUserEntitlementAction(formData: FormData) {
  const session = await requireAdminSession();

  try {
    await upsertUserEntitlementFromForm({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      formData,
    });
    adminRedirect("saved=entitlement#accesos-planes");
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el acceso manual.";
    adminRedirect(`error=${safeRedirectError(message)}#accesos-planes`);
  }
}

export async function revokeUserEntitlementAction(entitlementId: string) {
  const session = await requireAdminSession();

  try {
    await revokeUserEntitlement({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      entitlementId,
    });
    adminRedirect("saved=revoked#accesos-planes");
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo revocar el acceso.";
    adminRedirect(`error=${safeRedirectError(message)}#accesos-planes`);
  }
}

export async function updateCommercialOpportunityAction(formData: FormData) {
  const session = await requireAdminSession();

  try {
    await updateCommercialOpportunityFromForm({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      formData,
    });
    adminRedirect("saved=opportunity#oportunidades");
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la oportunidad.";
    adminRedirect(`error=${safeRedirectError(message)}#oportunidades`);
  }
}
