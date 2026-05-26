import { ReportType } from "@prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../../../../../../lib/auth";
import { findAssessmentForUser } from "../../../../../../server/assessments/assessmentService";
import { safeRedirectError } from "../../../../../../server/assessments/formUtils";
import { generatePdfReportForAssessment } from "../../../../../../server/reports/reportGenerationService";
import { upsertUserProfileFromSession } from "../../../../../../server/user/userProfileService";
import { getCommercialStatusForAssessment } from "../../../../../../server/unlocks/unlockRequestService";

export const runtime = "nodejs";

function getReportUrl(request: Request, assessmentId: string, query?: string) {
  const suffix = query ? `?${query}` : "";
  return new URL(`/dashboard/assessments/${assessmentId}/report${suffix}`, request.url);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: assessmentId } = await context.params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url), { status: 303 });
  }

  await upsertUserProfileFromSession({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    imageUrl: session.user.image ?? null,
    authProvider: "better-auth",
  });

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

    return NextResponse.redirect(getReportUrl(request, assessmentId, "generated=1"), {
      status: 303,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate the PDF preview.";

    return NextResponse.redirect(
      getReportUrl(request, assessmentId, `error=${safeRedirectError(message)}`),
      { status: 303 },
    );
  }
}
