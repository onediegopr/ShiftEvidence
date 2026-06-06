import { Prisma, ReportStatus, ReportType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ensureAssessmentOwnership } from "../assessments/assessmentService";
import { getReportPreviewData } from "./reportPreviewService";
import { getReportTypeLabel } from "./reportHistoryService";
import {
  deletePhysicalReportIfExists,
  prepareReportFileLocation,
  writeReportFile,
} from "./reportStorageService";
import { renderPdfReportBuffer } from "./reportPdfRenderer";
import { sanitizeOriginalFilename } from "../evidence/uploadValidation";
import {
  assertCanDownloadReport,
  assertCanGeneratePdf,
} from "../admin/runtimeSettingsService";
import { logger } from "../logging/logger";
import { assertRateLimit } from "../security/rateLimit";
import type { PdfReportBrandingInput } from "./reportPdfRenderer";

function buildOriginalReportFilename(assessmentTitle: string, reportType: ReportType) {
  const safeTitle = sanitizeOriginalFilename(assessmentTitle)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 60);
  const typeLabel = getReportTypeLabel(reportType).replace(/[^a-zA-Z0-9._-]/g, "_");
  return `ShiftEvidence_${safeTitle}_${typeLabel}.pdf`;
}

async function createAuditEvent(params: {
  userId: string;
  workspaceId: string;
  assessmentId: string;
  eventType: string;
  message: string;
  metadataJson?: Prisma.InputJsonValue;
}) {
  return prisma.auditEvent.create({
    data: {
      userId: params.userId,
      workspaceId: params.workspaceId,
      assessmentId: params.assessmentId,
      eventType: params.eventType,
      message: params.message,
      metadataJson: params.metadataJson ?? undefined,
    },
  });
}

export async function getReportsForAssessment(params: {
  userId: string;
  assessmentId: string;
}) {
  const assessment = await ensureAssessmentOwnership(params);

  return prisma.report.findMany({
    where: {
      assessmentId: assessment.id,
      deletedAt: null,
    },
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
  });
}

export async function getReportForDownload(params: {
  userId: string;
  assessmentId: string;
  reportId: string;
}) {
  const assessment = await ensureAssessmentOwnership(params);
  const report = await prisma.report.findFirst({
    where: {
      id: params.reportId,
      assessmentId: assessment.id,
      deletedAt: null,
      status: ReportStatus.generated,
    },
  });

  if (report) {
    const fullReportUnlocked = assessment.entitlements.some(
      (item) => item.entitlementKey === "full_report_unlocked" && (item.status === "available" || item.status === "granted" || item.status === "purchased"),
    );
    await assertCanDownloadReport({
      userId: params.userId,
      assessmentId: assessment.id,
      workspaceId: assessment.workspaceId,
      reportType: report.reportType,
      assessmentFullReportUnlocked: fullReportUnlocked,
    });
  }

  return report;
}

export async function generatePdfReportForAssessment(params: {
  userId: string;
  assessmentId: string;
  reportType?: ReportType;
  reportBranding?: PdfReportBrandingInput | null;
}) {
  const assessment = await ensureAssessmentOwnership(params);
  const reportType = params.reportType ?? ReportType.free_preview;
  await assertRateLimit({
    limiter: "reportGenerateAssessment",
    keyParts: ["user", params.userId, "assessment", assessment.id],
  });
  await assertRateLimit({
    limiter: "reportGenerateUser",
    keyParts: ["user", params.userId],
  });
  await assertCanGeneratePdf({
    userId: params.userId,
    assessmentId: assessment.id,
    workspaceId: assessment.workspaceId,
    reportType,
    assessmentFullReportUnlocked: assessment.entitlements.some(
      (item) => item.entitlementKey === "full_report_unlocked" && (item.status === "available" || item.status === "granted" || item.status === "purchased"),
    ),
  });
  const planRequired =
    reportType === ReportType.free_preview
      ? null
      : reportType === ReportType.readiness_report_pro
        ? "readiness_report_pro"
        : reportType === ReportType.blueprint
          ? "custom_blueprint"
          : "readiness_report";
  const generatedAt = new Date();
  const preview = await getReportPreviewData(assessment, {
    userId: params.userId,
    aiOperationType: "pdf",
  });
  const fileLocation = prepareReportFileLocation({
    userId: params.userId,
    workspaceId: assessment.workspaceId,
    assessmentId: assessment.id,
    reportType,
    assessmentTitle: assessment.title,
    extension: ".pdf",
  });
  const originalFilename = buildOriginalReportFilename(assessment.title, reportType);

  const report = await prisma.report.create({
    data: {
      assessmentId: assessment.id,
      workspaceId: assessment.workspaceId,
      generatedByUserId: params.userId,
      reportType,
      status: ReportStatus.generating,
      originalFilename,
      storedFilename: fileLocation.storedFilename,
      relativePath: fileLocation.relativePath,
      mimeType: "application/pdf",
      planRequired,
    },
  });

  await createAuditEvent({
    userId: params.userId,
    workspaceId: assessment.workspaceId,
    assessmentId: assessment.id,
    eventType: "report_generation_started",
    message: `Started generating ${getReportTypeLabel(reportType)}.`,
    metadataJson: {
      reportId: report.id,
      reportType,
      status: ReportStatus.generating,
    },
  });

  try {
    const buffer = await renderPdfReportBuffer({
      assessmentTitle: assessment.title,
      clientLabel: assessment.clientLabel ?? null,
      workspaceName: assessment.workspace.name,
      reportTypeLabel: getReportTypeLabel(reportType),
      generatedAt,
      generatedByLabel: params.userId ? "Generated by the current user" : "Generated by Shift Evidence",
      reportPreview: preview,
      reportBranding: params.reportBranding ?? null,
    });

    const stored = await writeReportFile({
      userId: params.userId,
      workspaceId: assessment.workspaceId,
      assessmentId: assessment.id,
      reportType,
      assessmentTitle: assessment.title,
      buffer,
      storedFilename: fileLocation.storedFilename,
    });

    const updated = await prisma.report.update({
      where: {
        id: report.id,
      },
      data: {
        status: ReportStatus.generated,
        generatedAt,
        fileHash: stored.fileHash,
        sizeBytes: stored.sizeBytes,
        mimeType: stored.mimeType,
        processingError: null,
        deletedAt: null,
      },
    });

    await createAuditEvent({
      userId: params.userId,
      workspaceId: assessment.workspaceId,
      assessmentId: assessment.id,
      eventType: "report_generated",
      message: `Generated ${getReportTypeLabel(reportType)}.`,
      metadataJson: {
        reportId: updated.id,
        reportType,
        status: updated.status,
        sizeBytes: updated.sizeBytes,
        fileHash: updated.fileHash?.slice(0, 12) ?? null,
      },
    });

    await createAuditEvent({
      userId: params.userId,
      workspaceId: assessment.workspaceId,
      assessmentId: assessment.id,
      eventType: "pdf_preview_generated",
      message: `Generated ${getReportTypeLabel(reportType)} PDF output.`,
      metadataJson: {
        reportId: updated.id,
        reportType,
        status: updated.status,
        sizeBytes: updated.sizeBytes,
      },
    });

    return updated;
  } catch (error) {
    try {
      await deletePhysicalReportIfExists(fileLocation.relativePath);
    } catch (cleanupError) {
      logger.warn("report_generation_cleanup_failed", {
        reportId: report.id,
        assessmentId: assessment.id,
        workspaceId: assessment.workspaceId,
        reportType,
        error: cleanupError,
      });
    }

    const message = error instanceof Error ? error.message : "Unable to generate the PDF preview.";

    logger.error("report_generation_failed", {
      reportId: report.id,
      assessmentId: assessment.id,
      workspaceId: assessment.workspaceId,
      userId: params.userId,
      reportType,
      error,
    });

    await prisma.report.update({
      where: {
        id: report.id,
      },
      data: {
        status: ReportStatus.failed,
        processingError: message,
      },
    });

    await createAuditEvent({
      userId: params.userId,
      workspaceId: assessment.workspaceId,
      assessmentId: assessment.id,
      eventType: "report_generation_failed",
      message: `${getReportTypeLabel(reportType)} generation failed.`,
      metadataJson: {
        reportId: report.id,
        reportType,
        status: ReportStatus.failed,
      },
    });

    throw new Error(message, {
      cause: error,
    });
  }
}

export async function softDeleteReport(params: {
  userId: string;
  assessmentId: string;
  reportId: string;
}) {
  const assessment = await ensureAssessmentOwnership(params);
  const existing = await prisma.report.findFirst({
    where: {
      id: params.reportId,
      assessmentId: assessment.id,
    },
  });

  if (!existing) {
    throw new Error("Report not found.");
  }

  if (existing.deletedAt || existing.status === ReportStatus.deleted) {
    throw new Error("Report is already deleted.");
  }

  return prisma.$transaction(async (tx) => {
    const deleted = await tx.report.update({
      where: {
        id: existing.id,
      },
      data: {
        status: ReportStatus.deleted,
        deletedAt: new Date(),
        processingError: null,
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "report_deleted",
        message: `Deleted generated ${getReportTypeLabel(existing.reportType)}.`,
        metadataJson: {
          reportId: existing.id,
          reportType: existing.reportType,
          originalFilename: existing.originalFilename,
        },
      },
    });

    return deleted;
  }).then(async (deleted) => {
    try {
      await deletePhysicalReportIfExists(deleted.relativePath);
    } catch (error) {
      logger.warn("report_physical_cleanup_failed", {
        reportId: deleted.id,
        assessmentId: deleted.assessmentId,
        workspaceId: deleted.workspaceId,
        reportType: deleted.reportType,
        error,
      });
    }

    return deleted;
  });
}
