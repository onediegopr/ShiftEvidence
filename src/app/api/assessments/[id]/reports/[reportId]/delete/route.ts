import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../../../../../../../lib/auth";
import { safeRedirectError } from "../../../../../../../server/assessments/formUtils";
import { softDeleteReport } from "../../../../../../../server/reports/reportGenerationService";
import { upsertUserProfileFromSession } from "../../../../../../../server/user/userProfileService";
import { getPublicUrl } from "../../../../../../../server/url/publicAppUrl";
import { logger } from "../../../../../../../server/logging/logger";

export const runtime = "nodejs";

function getReportUrl(assessmentId: string, query?: string) {
  const suffix = query ? `?${query}` : "";
  return getPublicUrl(`/dashboard/assessments/${assessmentId}/report${suffix}`);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; reportId: string }> },
) {
  const { id: assessmentId, reportId } = await context.params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.redirect(getPublicUrl("/sign-in"), { status: 303 });
  }

  await upsertUserProfileFromSession({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    imageUrl: session.user.image ?? null,
    authProvider: "better-auth",
  });

  try {
    await softDeleteReport({
      userId: session.user.id,
      assessmentId,
      reportId,
    });

    return NextResponse.redirect(getReportUrl(assessmentId, "deleted=1"), {
      status: 303,
    });
  } catch (error) {
    logger.warn("report_delete_failed", {
      userId: session.user.id,
      assessmentId,
      reportId,
      error,
    });
    const message = error instanceof Error ? error.message : "Unable to delete the report preview.";

    return NextResponse.redirect(
      getReportUrl(assessmentId, `error=${safeRedirectError(message)}`),
      { status: 303 },
    );
  }
}
