import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../../../../../../../lib/auth";
import { upsertUserProfileFromSession } from "../../../../../../../server/user/userProfileService";
import { getReportForDownload } from "../../../../../../../server/reports/reportGenerationService";
import { getReportTypeLabel } from "../../../../../../../server/reports/reportHistoryService";
import { readReportFile } from "../../../../../../../server/reports/reportStorageService";
import { prisma } from "../../../../../../../lib/prisma";
import { getPublicUrl } from "../../../../../../../server/url/publicAppUrl";

export const runtime = "nodejs";

function sanitizeDownloadName(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; reportId: string }> },
) {
  const { id: assessmentId, reportId } = await context.params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.redirect(getPublicUrl("/sign-in"));
  }

  await upsertUserProfileFromSession({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    imageUrl: session.user.image ?? null,
    authProvider: "better-auth",
  });

  let report: Awaited<ReturnType<typeof getReportForDownload>>;

  try {
    report = await getReportForDownload({
      userId: session.user.id,
      assessmentId,
      reportId,
    });
  } catch {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  try {
    const buffer = await readReportFile(report.relativePath);

    await prisma.auditEvent.create({
      data: {
        userId: session.user.id,
        workspaceId: report.workspaceId,
        assessmentId: report.assessmentId,
        eventType: "report_downloaded",
        message: `Downloaded ${getReportTypeLabel(report.reportType)}.`,
        metadataJson: {
          reportId: report.id,
          reportType: report.reportType,
          status: report.status,
          sizeBytes: report.sizeBytes,
          fileHash: report.fileHash?.slice(0, 12) ?? null,
        },
      },
    });

    const downloadName = sanitizeDownloadName(report.originalFilename || "shiftreadiness-report.pdf");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${downloadName}"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to download the report.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
