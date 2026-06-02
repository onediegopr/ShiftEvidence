import { Prisma, ReportStatus, ReportType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ensureAssessmentOwnership, type AssessmentDetail } from "../assessments/assessmentService";
import { sanitizeOriginalFilename } from "../evidence/uploadValidation";
import { logger } from "../logging/logger";
import { assertRateLimit } from "../security/rateLimit";
import { assertCanGeneratePdf } from "../admin/runtimeSettingsService";
import {
  deletePhysicalReportIfExists,
  prepareReportFileLocation,
  writeReportFile,
} from "./reportStorageService";
import { buildMigrationPlanEvidenceSummary } from "./migrationPlanEvidenceAggregator";
import { buildMigrationPlanGates } from "./migrationPlanGatesEngine";
import { decideMigrationPlanLevel } from "./migrationPlanLevelEngine";
import { buildMigrationRecommendationPlan } from "./migrationRecommendationEngine";
import { renderMigrationPlanPdfBuffer } from "./migrationPlanPdfRenderer";
import type { MigrationRecommendationPlan } from "./migrationPlanTypes";

function buildOriginalFilename(assessmentTitle: string) {
  const safeTitle = sanitizeOriginalFilename(assessmentTitle)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 60);
  return `ShiftReadiness_${safeTitle}_Migration_Recommendation_Plan.pdf`;
}

function createAuditEvent(params: {
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

export function buildMigrationRecommendationPlanForAssessment(
  assessment: AssessmentDetail,
  generatedAt = new Date(),
): MigrationRecommendationPlan {
  const evidence = buildMigrationPlanEvidenceSummary(assessment);
  const gates = buildMigrationPlanGates(evidence);
  const planLevel = decideMigrationPlanLevel(evidence, gates);
  return buildMigrationRecommendationPlan({ evidence, gates, planLevel, generatedAt });
}

export async function generateMigrationRecommendationPlanPdf(params: {
  userId: string;
  assessmentId: string;
}) {
  const assessment = await ensureAssessmentOwnership(params);
  const reportType = ReportType.blueprint;
  await assertRateLimit({
    limiter: "reportGenerateAssessment",
    keyParts: ["user", params.userId, "assessment", assessment.id, "migration-plan"],
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

  const generatedAt = new Date();
  const plan = buildMigrationRecommendationPlanForAssessment(assessment, generatedAt);
  const fileLocation = prepareReportFileLocation({
    userId: params.userId,
    workspaceId: assessment.workspaceId,
    assessmentId: assessment.id,
    reportType,
    assessmentTitle: assessment.title,
    extension: ".pdf",
  });

  const report = await prisma.report.create({
    data: {
      assessmentId: assessment.id,
      workspaceId: assessment.workspaceId,
      generatedByUserId: params.userId,
      reportType,
      status: ReportStatus.generating,
      originalFilename: buildOriginalFilename(assessment.title),
      storedFilename: fileLocation.storedFilename,
      relativePath: fileLocation.relativePath,
      mimeType: "application/pdf",
      planRequired: "custom_blueprint",
    },
  });

  await createAuditEvent({
    userId: params.userId,
    workspaceId: assessment.workspaceId,
    assessmentId: assessment.id,
    eventType: "migration_plan_generation_started",
    message: "Started generating Migration Recommendation Plan.",
    metadataJson: {
      reportId: report.id,
      reportType,
      planLevel: plan.planLevel,
      gateCount: plan.gates.length,
    },
  });

  try {
    const buffer = await renderMigrationPlanPdfBuffer(plan);
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
      where: { id: report.id },
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
      eventType: "migration_plan_generated",
      message: "Generated Migration Recommendation Plan.",
      metadataJson: {
        reportId: updated.id,
        reportType,
        planLevel: plan.planLevel,
        confidence: plan.confidence,
        gateCount: plan.gates.length,
        aiNarrative: plan.aiNarrative.providerStatus,
      },
    });

    return updated;
  } catch (error) {
    try {
      await deletePhysicalReportIfExists(fileLocation.relativePath);
    } catch (cleanupError) {
      logger.warn("migration_plan_generation_cleanup_failed", {
        reportId: report.id,
        assessmentId: assessment.id,
        workspaceId: assessment.workspaceId,
        error: cleanupError,
      });
    }

    const message = error instanceof Error ? error.message : "Unable to generate the Migration Recommendation Plan.";
    logger.error("migration_plan_generation_failed", {
      reportId: report.id,
      assessmentId: assessment.id,
      workspaceId: assessment.workspaceId,
      userId: params.userId,
      error,
    });

    await prisma.report.update({
      where: { id: report.id },
      data: {
        status: ReportStatus.failed,
        processingError: message,
      },
    });

    throw new Error(message, { cause: error });
  }
}
