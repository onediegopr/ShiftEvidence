import { ReportStatus, ReportType } from "@prisma/client";

export type ReportLikeRecord = {
  id: string;
  reportType: ReportType;
  status: ReportStatus;
  originalFilename: string;
  storedFilename: string;
  relativePath: string;
  fileHash: string | null;
  mimeType: string;
  sizeBytes: number | null;
  planRequired: string | null;
  generatedAt: Date | null;
  deletedAt: Date | null;
  processingError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ReportLikeAssessment = {
  reports?: ReportLikeRecord[];
};

export function getLatestReportForAssessment(assessment: ReportLikeAssessment) {
  const reports = (assessment.reports ?? []).filter((report) => report.deletedAt === null);

  if (reports.length === 0) {
    return null;
  }

  return [...reports].sort((left, right) => {
    const leftTime = (left.generatedAt ?? left.createdAt).getTime();
    const rightTime = (right.generatedAt ?? right.createdAt).getTime();
    return rightTime - leftTime;
  })[0] ?? null;
}

export function getReportTypeLabel(reportType: ReportType) {
  switch (reportType) {
    case ReportType.readiness_report:
      return "Starter Readiness Report";
    case ReportType.readiness_report_pro:
      return "Professional Assessment Report";
    case ReportType.blueprint:
      return "Migration Blueprint";
    default:
      return "PDF Preview";
  }
}

export function getReportStatusLabel(status: ReportStatus | "not_generated") {
  switch (status) {
    case ReportStatus.generating:
      return "Generating";
    case ReportStatus.generated:
      return "Generated";
    case ReportStatus.failed:
      return "Failed";
    case ReportStatus.deleted:
      return "Deleted";
    default:
      return "Not generated";
  }
}

export function getReportStatusTone(status: ReportStatus | "not_generated") {
  switch (status) {
    case ReportStatus.generated:
      return "good" as const;
    case ReportStatus.generating:
    case "not_generated":
      return "warning" as const;
    case ReportStatus.failed:
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

export function getReportPreviewStatusFromReports(assessment: ReportLikeAssessment) {
  const latest = getLatestReportForAssessment(assessment);

  if (!latest) {
    return "not_generated" as const;
  }

  if (latest.status === ReportStatus.generated) {
    return "generated" as const;
  }

  if (latest.status === ReportStatus.generating) {
    return "generating" as const;
  }

  if (latest.status === ReportStatus.failed) {
    return "failed" as const;
  }

  return "not_generated" as const;
}
