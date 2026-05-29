import { ReportType } from "@prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../../../../../../lib/auth";
import { findAssessmentForUser } from "../../../../../../server/assessments/assessmentService";
import { safeRedirectError } from "../../../../../../server/assessments/formUtils";
import { generatePdfReportForAssessment } from "../../../../../../server/reports/reportGenerationService";
import type { PdfReportBrandingInput, PdfReportBrandLogo } from "../../../../../../server/reports/reportPdfRenderer";
import { upsertUserProfileFromSession } from "../../../../../../server/user/userProfileService";
import { getCommercialStatusForAssessment } from "../../../../../../server/unlocks/unlockRequestService";
import { getPublicUrl } from "../../../../../../server/url/publicAppUrl";
import { INPUT_LIMITS, normalizeOptionalTextInput } from "../../../../../../server/validation/inputLimits";

export const runtime = "nodejs";
const MAX_LOGO_BYTES = 1024 * 1024;

function getReportUrl(assessmentId: string, query?: string) {
  const suffix = query ? `?${query}` : "";
  return getPublicUrl(`/dashboard/assessments/${assessmentId}/report${suffix}`);
}

function inferLogoMime(buffer: Buffer): PdfReportBrandLogo["mimeType"] | null {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  return null;
}

async function parseLogo(value: FormDataEntryValue | null, label: string): Promise<PdfReportBrandLogo | null> {
  if (!value || typeof value === "string" || value.size === 0) {
    return null;
  }

  if (value.size > MAX_LOGO_BYTES) {
    throw new Error(`${label} must be a PNG or JPG file under 1 MB.`);
  }

  const buffer = Buffer.from(await value.arrayBuffer());
  const mimeType = inferLogoMime(buffer);
  if (!mimeType) {
    throw new Error(`${label} must be a valid PNG or JPG file.`);
  }

  return {
    label,
    mimeType,
    buffer,
  };
}

async function parseReportBranding(request: Request): Promise<PdfReportBrandingInput | null> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return null;
  }

  const formData = await request.formData();
  const audience = formData.get("reportAudience") === "client" ? "client" : "own_company";
  const companyName = normalizeOptionalTextInput(formData.get("companyName"), "Company name", INPUT_LIMITS.companyName);
  const clientName = normalizeOptionalTextInput(formData.get("clientName"), "Client name", INPUT_LIMITS.companyName);
  const companyLogo = await parseLogo(formData.get("companyLogo"), "Company logo");
  const clientLogo = audience === "client" ? await parseLogo(formData.get("clientLogo"), "Client logo") : null;

  if (!companyName && !clientName && !companyLogo && !clientLogo) {
    return null;
  }

  return {
    audience,
    companyName,
    clientName,
    companyLogo,
    clientLogo,
    whiteLabel: true,
  };
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

    const reportBranding = await parseReportBranding(request);

    await generatePdfReportForAssessment({
      userId: session.user.id,
      assessmentId,
      reportType,
      reportBranding,
    });

    return NextResponse.redirect(getReportUrl(assessmentId, "generated=1"), {
      status: 303,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate the PDF preview.";

    return NextResponse.redirect(
      getReportUrl(assessmentId, `error=${safeRedirectError(message)}`),
      { status: 303 },
    );
  }
}
