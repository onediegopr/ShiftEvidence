"use server";

import { redirect } from "next/navigation";
import { requireAdminSession } from "../../../../server/admin/adminAuth";
import { safeRedirectError } from "../../../../server/assessments/formUtils";
import {
  approvePricingSnapshot,
  archivePricingSnapshot,
  rejectPricingSnapshot,
  runManualPricingRefresh,
} from "../../../../server/pricing/licensingPricingSnapshotService";

function pricingRedirect(params: string) {
  redirect(`/dashboard/admin/pricing?${params}`);
}

export async function runManualPricingRefreshAction() {
  const session = await requireAdminSession();

  try {
    await runManualPricingRefresh({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
    });
    pricingRedirect("saved=refresh");
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar Pricing Intelligence.";
    pricingRedirect(`error=${safeRedirectError(message)}`);
  }
}

export async function approvePricingSnapshotAction(snapshotId: string) {
  const session = await requireAdminSession();

  try {
    await approvePricingSnapshot({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      snapshotId,
    });
    pricingRedirect("saved=approved");
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo aprobar el snapshot.";
    pricingRedirect(`error=${safeRedirectError(message)}`);
  }
}

export async function rejectPricingSnapshotAction(snapshotId: string, formData: FormData) {
  const session = await requireAdminSession();

  try {
    await rejectPricingSnapshot({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      snapshotId,
      rejectionReason: String(formData.get("rejectionReason") ?? ""),
    });
    pricingRedirect("saved=rejected");
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo rechazar el snapshot.";
    pricingRedirect(`error=${safeRedirectError(message)}`);
  }
}

export async function archivePricingSnapshotAction(snapshotId: string) {
  const session = await requireAdminSession();

  try {
    await archivePricingSnapshot({
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      snapshotId,
    });
    pricingRedirect("saved=archived");
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo archivar el snapshot.";
    pricingRedirect(`error=${safeRedirectError(message)}`);
  }
}
