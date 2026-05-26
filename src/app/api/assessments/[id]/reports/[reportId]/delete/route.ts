import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../../../../../../../lib/auth";
import { safeRedirectError } from "../../../../../../../server/assessments/formUtils";
import { softDeleteReport } from "../../../../../../../server/reports/reportGenerationService";
import { upsertUserProfileFromSession } from "../../../../../../../server/user/userProfileService";

export const runtime = "nodejs";

function getReportUrl(request: Request, assessmentId: string, query?: string) {
  const suffix = query ? `?${query}` : "";
  return new URL(`/dashboard/assessments/${assessmentId}/report${suffix}`, request.url);
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
    await softDeleteReport({
      userId: session.user.id,
      assessmentId,
      reportId,
    });

    return NextResponse.redirect(getReportUrl(request, assessmentId, "deleted=1"), {
      status: 303,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete the report preview.";

    return NextResponse.redirect(
      getReportUrl(request, assessmentId, `error=${safeRedirectError(message)}`),
      { status: 303 },
    );
  }
}
