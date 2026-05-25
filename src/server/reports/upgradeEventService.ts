import { prisma } from "../../lib/prisma";
import { ensureAssessmentOwnership } from "../assessments/assessmentService";
import type { ReportPreviewTriggerType } from "./reportSections";

export async function trackReportPreviewViewed(params: {
  userId: string;
  assessmentId: string;
}) {
  const assessment = await ensureAssessmentOwnership({
    userId: params.userId,
    assessmentId: params.assessmentId,
  });

  return prisma.upgradeEvent.create({
    data: {
      userId: params.userId,
      workspaceId: assessment.workspaceId,
      assessmentId: assessment.id,
      triggerType: "report_preview_viewed",
      message: "Viewed the report preview.",
      clicked: false,
    },
  });
}

export async function trackReportUpgradeIntent(params: {
  userId: string;
  assessmentId: string;
  triggerType: ReportPreviewTriggerType;
  message: string;
  clicked?: boolean;
}) {
  const assessment = await ensureAssessmentOwnership({
    userId: params.userId,
    assessmentId: params.assessmentId,
  });

  return prisma.upgradeEvent.create({
    data: {
      userId: params.userId,
      workspaceId: assessment.workspaceId,
      assessmentId: assessment.id,
      triggerType: params.triggerType,
      message: params.message,
      clicked: params.clicked ?? true,
    },
  });
}

