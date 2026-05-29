"use server";

import { headers } from "next/headers";
import { ReportType } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "../../../../../lib/auth";
import { findAssessmentForUser } from "../../../../../server/assessments/assessmentService";
import { parseOptionalString, parseRequiredString, safeRedirectError } from "../../../../../server/assessments/formUtils";
import { upsertUserProfileFromSession } from "../../../../../server/user/userProfileService";
import { createUnlockRequest, getCommercialStatusForAssessment } from "../../../../../server/unlocks/unlockRequestService";
import { trackReportUpgradeIntent } from "../../../../../server/reports/upgradeEventService";
import { INPUT_LIMITS } from "../../../../../server/validation/inputLimits";
import {
  generatePdfReportForAssessment,
  softDeleteReport,
} from "../../../../../server/reports/reportGenerationService";

async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  await upsertUserProfileFromSession({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    imageUrl: session.user.image ?? null,
    authProvider: "better-auth",
  });

  return session;
}

function getReportRedirectPath(assessmentId: string, query?: string) {
  return query
    ? `/dashboard/assessments/${assessmentId}/report?${query}`
    : `/dashboard/assessments/${assessmentId}/report`;
}

export async function generatePdfReportAction(assessmentId: string) {
  const session = await requireSession();
  let redirectTarget = getReportRedirectPath(assessmentId, "generated=1");

  try {
    const assessment = await findAssessmentForUser({
      userId: session.user.id,
      assessmentId,
    });

    if (!assessment) {
      throw new Error("Assessment not found or access denied.");
    }

    const commercialStatus = getCommercialStatusForAssessment(assessment);
    const reportType = commercialStatus.hasFullReportUnlocked
      ? ReportType.readiness_report
      : ReportType.free_preview;

    await generatePdfReportForAssessment({
      userId: session.user.id,
      assessmentId,
      reportType,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate the PDF preview.";
    redirectTarget = getReportRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function deleteReportAction(assessmentId: string, reportId: string) {
  const session = await requireSession();
  let redirectTarget = getReportRedirectPath(assessmentId, "deleted=1");

  try {
    await softDeleteReport({
      userId: session.user.id,
      assessmentId,
      reportId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete the report preview.";
    redirectTarget = getReportRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

function mapUnlockTriggerToType(triggerType: string) {
  switch (triggerType) {
    case "unlock_pro_clicked":
      return "readiness_report_pro" as const;
    case "storage_addon_clicked":
      return "storage_addon" as const;
    case "review_call_clicked":
      return "technical_review" as const;
    case "unlock_report_clicked":
    default:
      return "readiness_report" as const;
  }
}

export async function requestUnlockAction(assessmentId: string, formData: FormData) {
  const session = await requireSession();
  let redirectTarget: string;

  try {
    const triggerType = parseRequiredString(formData.get("triggerType"), "Upgrade trigger", {
      maxLength: INPUT_LIMITS.shortText,
    });
    const message = parseRequiredString(formData.get("message"), "Upgrade message", {
      maxLength: INPUT_LIMITS.description,
    });
    const notes = parseOptionalString(formData.get("notes"), {
      fieldName: "Upgrade notes",
      maxLength: INPUT_LIMITS.notes,
    });

    await trackReportUpgradeIntent({
      userId: session.user.id,
      assessmentId,
      triggerType: triggerType as Parameters<typeof trackReportUpgradeIntent>[0]["triggerType"],
      message,
      clicked: true,
    });

    const unlockRequest = await createUnlockRequest({
      userId: session.user.id,
      assessmentId,
      requestedType: mapUnlockTriggerToType(triggerType),
      contactEmail: session.user.email,
      notes,
    });

    redirectTarget = getReportRedirectPath(
      assessmentId,
      unlockRequest.outcome === "already_unlocked"
        ? "unlock=already_unlocked"
        : unlockRequest.outcome === "reused_pending"
          ? "unlock=existing"
          : "unlock=created",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to request an unlock.";
    redirectTarget = getReportRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function trackReportUpgradeIntentAction(
  assessmentId: string,
  formData: FormData,
) {
  const session = await requireSession();
  let redirectTarget = getReportRedirectPath(assessmentId, "upgrade=1");

  try {
    const triggerType = parseRequiredString(formData.get("triggerType"), "Upgrade trigger", {
      maxLength: INPUT_LIMITS.shortText,
    });
    const message = parseRequiredString(formData.get("message"), "Upgrade message", {
      maxLength: INPUT_LIMITS.description,
    });

    await trackReportUpgradeIntent({
      userId: session.user.id,
      assessmentId,
      triggerType: triggerType as Parameters<typeof trackReportUpgradeIntent>[0]["triggerType"],
      message,
      clicked: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to track upgrade intent.";
    redirectTarget = getReportRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}
