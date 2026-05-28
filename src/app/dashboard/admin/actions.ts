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
import {
  parseOperationalRuntimeSettingsForm,
  setRuntimeMode,
  updateOperationalRuntimeSettings,
} from "../../../server/admin/runtimeSettingsService";
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

export async function updateOperationalRuntimeSettingsAction(formData: FormData) {
  const session = await requireAdminSession();

  try {
    if (formData.get("confirmRuntimeChange") !== "on") {
      throw new Error("Confirmacion requerida para aplicar cambios operativos.");
    }
    await updateOperationalRuntimeSettings({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      settings: parseOperationalRuntimeSettingsForm(formData),
    });
    adminRedirect("saved=runtime#configuracion-operativa");
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la configuracion operativa.";
    adminRedirect(`error=${safeRedirectError(message)}#configuracion-operativa`);
  }
}

export async function setAiRuntimeModeFormAction(formData: FormData) {
  const session = await requireAdminSession();

  try {
    if (formData.get("confirmRuntimeChange") !== "on") {
      throw new Error("Confirmacion requerida para cambiar el modo IA.");
    }
    const mode = formData.get("mode");
    if (mode !== "env" && mode !== "disabled" && mode !== "mock" && mode !== "gemini") {
      throw new Error("Modo IA invalido.");
    }
    await setRuntimeMode({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      mode,
    });
    adminRedirect("saved=runtime#configuracion-operativa");
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cambiar el modo runtime IA.";
    adminRedirect(`error=${safeRedirectError(message)}#configuracion-operativa`);
  }
}
