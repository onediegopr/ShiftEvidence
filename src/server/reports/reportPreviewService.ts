import type { AssessmentDetail } from "../assessments/assessmentService";
import { getAssessmentCompletionStatus, getMissingEvidenceSummary } from "../assessments/assessmentCompletionService";
import { getCostRiskStatus, getPreliminaryCostRiskPreview } from "../assessments/costRiskService";
import { buildInventoryDrivenCostRiskContext } from "../risk/riskContext";
import {
  getFindingCountsBySeverity,
  getTopFindings,
  getVisibleFindingsForFreePlan,
  getVmRiskMatrixRows,
} from "../risk/riskFindingService";
import { getCommercialStatusForAssessment } from "../unlocks/unlockRequestService";
import { getEvidenceConfidenceLabel } from "../rvtools/rvtoolsInventoryService";
import { getReportStatusLabel } from "./reportHistoryService";
import {
  getPlanRank,
  getSectionAccess,
  reportSectionConfigs,
  type ReportPreviewTriggerType,
  type ReportSectionConfig,
  type ReportSectionAccess,
} from "./reportSections";

type ReportPreviewStatus = "available" | "partial" | "locked";

export type ReportPreviewSection = ReportSectionConfig & {
  access: ReportSectionAccess;
};

export type ReportPreviewCard = {
  label: string;
  value: string;
  tone: "neutral" | "good" | "warning" | "danger";
  note: string;
};

export type ReportEvidenceOverview = {
  received: string[];
  missing: string[];
  sourceIndicator: "manual" | "parsed" | "mixed" | "limited";
  confidenceImplication: string;
};

export type ReportPreviewData = {
  assessmentId: string;
  assessmentTitle: string;
  workspaceName: string;
  clientLabel: string | null;
  planLabel: string;
  planRank: number;
  reportPreviewStatus: ReportPreviewStatus;
  fullReportStatus: "locked";
  pdfStatus: string;
  commercialStatus: ReturnType<typeof getCommercialStatusForAssessment>;
  completionScore: number;
  completionStatus: string;
  evidenceConfidence: string;
  evidenceConfidenceLabel: string;
  sourceLabel: string;
  costRiskPreview: ReturnType<typeof getPreliminaryCostRiskPreview>;
  costRiskStatus: string;
  readinessScore: number | null;
  confidenceScore: number | null;
  recommendedDecision: string;
  evidenceOverview: ReportEvidenceOverview;
  environmentSummary: {
    vmCount: number;
    hostCount: number;
    datastoreCount: number;
    snapshotCount: number;
    poweredOnVmCount: number;
    poweredOffVmCount: number;
    totalProvisionedGb: number | null;
    totalUsedGb: number | null;
  };
  executiveSummary: string[];
  technicalSummary: string[];
  missingEvidence: string[];
  topFindings: ReturnType<typeof getTopFindings>;
  visibleFindings: ReturnType<typeof getVisibleFindingsForFreePlan>;
  vmMatrixPreview: ReturnType<typeof getVmRiskMatrixRows>;
  findingCounts: ReturnType<typeof getFindingCountsBySeverity>;
  reportCards: ReportPreviewCard[];
  sections: ReportPreviewSection[];
  lockedSections: ReportPreviewSection[];
  upgradeRecommendations: string[];
  upgradeButtons: Array<{
    triggerType: ReportPreviewTriggerType;
    title: string;
    description: string;
    ctaLabel: string;
  }>;
};

function getPlanLabel(plan: string | null | undefined) {
  switch (plan) {
    case "readiness_report":
      return "Readiness Report";
    case "readiness_report_pro":
      return "Readiness Report Pro";
    case "custom_blueprint":
      return "Custom Blueprint";
    case "partner":
      return "Partner";
    default:
      return "Free Preview";
  }
}

function getSectionAccessForAssessment(assessment: AssessmentDetail, section: ReportSectionConfig): ReportSectionAccess {
  const access = getSectionAccess({
    assessmentPlan: assessment.workspace?.plan ?? null,
    section,
  });

  if (section.key === "storage_readiness" && assessment.storageReadinessEnabled) {
    return "preview" as const;
  }

  const entitlements = assessment.entitlements ?? [];
  const hasEntitlement = (key: string) =>
    entitlements.some((entitlement) => entitlement.entitlementKey === key && entitlement.status !== "locked");

  if (section.key === "vm_risk_matrix" && hasEntitlement("pro_matrix_unlocked")) {
    return "preview" as const;
  }

  if (section.key === "storage_readiness" && hasEntitlement("storage_readiness_unlocked")) {
    return "preview" as const;
  }

  if (section.key === "technical_report" && hasEntitlement("full_report_unlocked")) {
    return "preview" as const;
  }

  if (section.key === "review_call" && hasEntitlement("review_call_unlocked")) {
    return "preview" as const;
  }

  if (section.key === "pdf_export" && hasEntitlement("full_report_unlocked")) {
    return "preview" as const;
  }

  return access;
}

export function buildExecutiveSummaryPreview(assessment: AssessmentDetail) {
  const completion = getAssessmentCompletionStatus(assessment);
  const preview = getPreliminaryCostRiskPreview(assessment);
  const parsed = buildInventoryDrivenCostRiskContext(assessment).parsedInventory;
  const inventorySummary = parsed?.summary ?? null;
  const topFindings = getTopFindings(assessment, 3);

  const sentences = [
    `This assessment currently shows a ${completion.completionStatus} preliminary migration signal.`,
    parsed?.inventoryStatus
      ? `RVTools inventory is ${parsed.inventoryStatus} and evidence confidence is ${completion.evidenceConfidence}.`
      : "RVTools evidence has not yet produced a parsed inventory.",
    inventorySummary
      ? `The environment currently includes ${inventorySummary.vmCount} VMs, ${inventorySummary.hostCount} hosts, ${inventorySummary.datastoreCount} datastores and ${inventorySummary.snapshotCount} snapshots.`
      : "No parsed inventory summary is available yet.",
    topFindings.length > 0
      ? `Top concerns include ${topFindings
          .slice(0, 3)
          .map((finding) => finding.title)
          .join(", ")}.`
      : "No high-priority findings have been generated yet.",
    preview.readinessLabel
      ? `The current Cost / Risk preview indicates that ${preview.readinessLabel.toLowerCase()}.`
      : "The Cost / Risk preview still needs more evidence before it can be interpreted.",
  ];

  return sentences;
}

export function buildTechnicalSummaryPreview(assessment: AssessmentDetail) {
  const context = buildInventoryDrivenCostRiskContext(assessment);
  const parsed = context.parsedInventory;
  const preview = getPreliminaryCostRiskPreview(assessment);
  const completion = getAssessmentCompletionStatus(assessment);
  const findings = getTopFindings(assessment, 5);

  const bullets = [
    `Source: ${context.sourceLabel}.`,
    parsed?.summary
      ? `Parsed inventory summary: ${parsed.summary.vmCount} VMs, ${parsed.summary.hostCount} hosts, ${parsed.summary.datastoreCount} datastores and ${parsed.summary.snapshotCount} snapshots.`
      : "Parsed inventory summary is not available yet.",
    findings.length > 0
      ? `Top findings currently skew toward ${findings[0].category} / ${findings[0].severity} signals.`
      : "No risk findings have been generated yet.",
    preview.missingEvidence.length > 0
      ? `Missing evidence still includes ${preview.missingEvidence.slice(0, 3).join(", ")}.`
      : "No key evidence is missing for the current preview.",
    completion.evidenceConfidence
      ? `Evidence confidence is ${completion.evidenceConfidence}.`
      : "Evidence confidence is not available yet.",
  ];

  return bullets;
}

export function buildEnvironmentSummary(assessment: AssessmentDetail) {
  const context = buildInventoryDrivenCostRiskContext(assessment);
  const parsed = context.parsedInventory;
  const summary = parsed?.summary ?? null;

  return {
    vmCount: summary?.vmCount ?? context.referenceCounts.vmCount ?? assessment.infrastructureInput?.vmCount ?? null,
    hostCount: summary?.hostCount ?? context.referenceCounts.hostCount ?? assessment.infrastructureInput?.hostCount ?? null,
    datastoreCount: summary?.datastoreCount ?? context.referenceCounts.datastoreCount ?? null,
    snapshotCount: summary?.snapshotCount ?? context.referenceCounts.snapshotCount ?? assessment.infrastructureInput?.snapshotCount ?? null,
    poweredOnVmCount: summary?.poweredOnVmCount ?? null,
    poweredOffVmCount: summary?.poweredOffVmCount ?? null,
    totalProvisionedGb: summary?.totalProvisionedGb ?? null,
    totalUsedGb: summary?.totalUsedGb ?? null,
  };
}

export function buildCostRiskSummary(assessment: AssessmentDetail) {
  const preview = getPreliminaryCostRiskPreview(assessment);
  const context = buildInventoryDrivenCostRiskContext(assessment);

  return {
    sourceLabel: context.sourceLabel,
    annualSubscriptionDelta: preview.annualSubscriptionDelta,
    threeYearSubscriptionDelta: preview.threeYearSubscriptionDelta,
    savingsPercent: preview.savingsPercent,
    riskLevel: preview.riskLevel,
    readinessLabel: preview.readinessLabel,
    missingEvidence: preview.missingEvidence,
  };
}

export function getReportSections(assessment: AssessmentDetail) {
  return reportSectionConfigs.map((section) => ({
    ...section,
    access: getSectionAccessForAssessment(assessment, section),
  }));
}

export function getLockedSections(assessment: AssessmentDetail) {
  return getReportSections(assessment).filter((section) => section.access === "locked");
}

export function getUpgradeRecommendations(assessment: AssessmentDetail) {
  const recommendations = new Set<string>();
  const completion = getAssessmentCompletionStatus(assessment);
  const preview = getPreliminaryCostRiskPreview(assessment);
  const parsed = buildInventoryDrivenCostRiskContext(assessment).parsedInventory;
  const commercialStatus = getCommercialStatusForAssessment(assessment);

  if (completion.reportPreviewStatus !== "available") {
    recommendations.add("Open the report preview to review the locked sections.");
  }

  if (preview.missingEvidence.length > 0) {
    recommendations.add("Complete the missing evidence before requesting a full report.");
  }

  if (!parsed?.summary) {
    recommendations.add("Parse RVTools evidence to unlock inventory-driven findings.");
  }

  if (!assessment.storageReadinessEnabled) {
    recommendations.add("Add Storage Destination Readiness if target storage needs deeper validation.");
  }

  if ((assessment.riskFindings?.length ?? 0) > 0) {
    recommendations.add("Use the preliminary findings to decide whether a Readiness Report Pro is justified.");
  }

  if (!commercialStatus.hasFullReportUnlocked) {
    recommendations.add("Request a manual unlock to open the full readiness report.");
  }

  return [...recommendations];
}

export function getMissingEvidenceForReport(assessment: AssessmentDetail) {
  const completion = getAssessmentCompletionStatus(assessment);
  const missingEvidence = new Set(getMissingEvidenceSummary(assessment));
  const preview = getPreliminaryCostRiskPreview(assessment);

  if (completion.reportPreviewStatus === "locked") {
    missingEvidence.add("Open the report preview to see the structured report sections.");
  }

  if (!assessment.assessmentScore) {
    missingEvidence.add("Generate inventory-driven risk insights before treating the preview as evidence-based.");
  }

  if (preview.missingEvidence.length > 0) {
    preview.missingEvidence.forEach((item) => missingEvidence.add(item));
  }

  return [...missingEvidence];
}

function getSourceIndicator(assessment: AssessmentDetail): ReportEvidenceOverview["sourceIndicator"] {
  const context = buildInventoryDrivenCostRiskContext(assessment);

  if (context.hasParsedInventory && context.hasManualInputs) {
    return "mixed";
  }

  if (context.hasParsedInventory) {
    return "parsed";
  }

  if (context.hasManualInputs) {
    return "manual";
  }

  return "limited";
}

function buildEvidenceOverview(assessment: AssessmentDetail): ReportEvidenceOverview {
  const received = new Set<string>();
  const completion = getAssessmentCompletionStatus(assessment);
  const sourceIndicator = getSourceIndicator(assessment);
  const activeEvidenceFiles = (assessment.evidenceFiles ?? []).filter((file) => !file.deletedAt);

  if (assessment.infrastructureInput) {
    received.add("Manual infrastructure intake");
  }

  if (assessment.costRiskAssumptions) {
    received.add("Cost / Risk assumptions");
  }

  if (activeEvidenceFiles.length > 0) {
    const fileTypes = new Set(activeEvidenceFiles.map((file) => file.evidenceType));
    fileTypes.forEach((type) => received.add(`${type} evidence upload`));
  }

  if ((assessment.parsedInventorySummaries ?? []).length > 0) {
    received.add("Parsed inventory summary");
  }

  if ((assessment.parsedVMs ?? []).length > 0) {
    received.add("Parsed VM inventory");
  }

  if ((assessment.riskFindings ?? []).length > 0) {
    received.add("Inventory-driven risk findings");
  }

  if (assessment.assessmentScore) {
    received.add("Assessment readiness and confidence score");
  }

  if (assessment.storageReadinessEnabled) {
    received.add("Storage Destination Readiness selected");
  }

  const missing = new Set(getMissingEvidenceForReport(assessment));

  [
    "Backup platform export or restore evidence",
    "Proxmox target cluster sizing or read-only export",
    "Application dependency map",
    "Performance history for critical workloads",
    "Maintenance window and rollback requirements",
    "Business criticality confirmation by application owner",
  ].forEach((item) => missing.add(item));

  const confidenceImplication =
    completion.evidenceConfidence === "moderate"
        ? "Evidence supports a directional recommendation, but missing inputs may change migration sequence and risk."
        : completion.evidenceConfidence === "limited_with_warnings"
          ? "Evidence has parser or completeness warnings. Validate source exports before sequencing production workloads."
        : "Evidence is limited. Treat recommendations as preliminary until missing evidence is collected.";

  return {
    received: received.size > 0 ? [...received] : ["No structured evidence has been confirmed yet"],
    missing: [...missing],
    sourceIndicator,
    confidenceImplication,
  };
}

function getRecommendedDecision(params: {
  readinessScore: number | null;
  confidenceScore: number | null;
  criticalFindings: number;
  highFindings: number;
}) {
  const readiness = params.readinessScore ?? 0;
  const confidence = params.confidenceScore ?? 0;

  if (params.criticalFindings > 0 || readiness < 35) {
    return "Remediate First";
  }

  if (params.highFindings > 2) {
    return "Pilot First";
  }

  if (readiness >= 75 && confidence >= 70) {
    return "Conditional Go";
  }

  if (readiness >= 60 && confidence >= 50) {
    return "Pilot First";
  }

  return "Manual Review Required";
}

export function getReportPlanVisibility(assessment: AssessmentDetail) {
  const sections = getReportSections(assessment);
  const unlocked = sections.filter((section) => section.access !== "locked");
  const locked = sections.filter((section) => section.access === "locked");

  return {
    planLabel: getPlanLabel(assessment.workspace?.plan ?? null),
    planRank: getPlanRank(assessment.workspace?.plan ?? null),
    unlockedSections: unlocked,
    lockedSections: locked,
  };
}

export function getReportPreviewData(assessment: AssessmentDetail): ReportPreviewData {
  const completion = getAssessmentCompletionStatus(assessment);
  const preview = getPreliminaryCostRiskPreview(assessment);
  const context = buildInventoryDrivenCostRiskContext(assessment);
  const parsed = context.parsedInventory;
  const summary = parsed?.summary ?? null;
  const topFindings = getTopFindings(assessment, 8);
  const visibleFindings = getVisibleFindingsForFreePlan(assessment);
  const vmMatrixPreview = getVmRiskMatrixRows({
    assessment,
    limit: 10,
  });
  const reportPlan = getReportPlanVisibility(assessment);
  const commercialStatus = getCommercialStatusForAssessment(assessment);
  const sections = getReportSections(assessment);
  const executiveSummary = buildExecutiveSummaryPreview(assessment);
  const technicalSummary = buildTechnicalSummaryPreview(assessment);
  const missingEvidence = getMissingEvidenceForReport(assessment);
  const upgradeRecommendations = getUpgradeRecommendations(assessment);
  const findingCounts = getFindingCountsBySeverity(assessment.riskFindings ?? []);
  const readinessScore = assessment.assessmentScore?.readinessScore ?? completion.completionScore ?? null;
  const confidenceScore = assessment.assessmentScore?.confidenceScore ?? null;
  const evidenceOverview = buildEvidenceOverview(assessment);
  const recommendedDecision = getRecommendedDecision({
    readinessScore,
    confidenceScore,
    criticalFindings: findingCounts.critical,
    highFindings: findingCounts.high,
  });

  const reportPreviewStatus = completion.reportPreviewStatus as ReportPreviewStatus;
  const costRiskStatus = getCostRiskStatus(assessment);
  const reportCards = [
    {
      label: "Report preview",
      value: completion.reportPreviewStatus === "available" ? "Available" : completion.reportPreviewStatus === "partial" ? "Partial" : "Locked",
      tone: completion.reportPreviewStatus === "available" ? "good" : completion.reportPreviewStatus === "partial" ? "warning" : "neutral",
      note: "Structured preview only. Full report remains locked.",
    },
    {
      label: "Full report",
      value: "Locked",
      tone: "neutral",
      note: "A full export-ready report is not available yet.",
    },
    {
      label: "PDF Preview",
      value: getReportStatusLabel(completion.pdfStatus),
      tone:
        completion.pdfStatus === "generated"
          ? "good"
          : completion.pdfStatus === "failed"
            ? "danger"
            : completion.pdfStatus === "generating"
              ? "warning"
              : "neutral",
      note: "Preliminary PDF generation is available from the report page.",
    },
    {
      label: "Commercial status",
      value: commercialStatus.primaryLabel,
      tone: commercialStatus.primaryTone,
      note: commercialStatus.primaryDetail,
    },
    {
      label: "Top findings",
      value: `${topFindings.length}`,
      tone: topFindings.length > 0 ? "warning" : "neutral",
      note: `Showing ${Math.min(5, topFindings.length)} in the preview.`,
    },
  ] satisfies ReportPreviewCard[];

  return {
    assessmentId: assessment.id,
    assessmentTitle: assessment.title,
    workspaceName: assessment.workspace.name,
    clientLabel: assessment.clientLabel ?? null,
    planLabel: reportPlan.planLabel,
    planRank: reportPlan.planRank,
    reportPreviewStatus,
    fullReportStatus: "locked",
    pdfStatus: completion.pdfStatus,
    commercialStatus,
    completionScore: completion.completionScore,
    completionStatus: completion.completionStatus,
    evidenceConfidence: completion.evidenceConfidence,
    evidenceConfidenceLabel: getEvidenceConfidenceLabel(completion.evidenceConfidence),
    sourceLabel: preview.dataSourceLabel ?? context.sourceLabel,
    costRiskPreview: preview,
    costRiskStatus,
    readinessScore,
    confidenceScore,
    recommendedDecision,
    evidenceOverview,
    environmentSummary: {
      vmCount: summary?.vmCount ?? context.referenceCounts.vmCount ?? assessment.infrastructureInput?.vmCount ?? 0,
      hostCount: summary?.hostCount ?? context.referenceCounts.hostCount ?? assessment.infrastructureInput?.hostCount ?? 0,
      datastoreCount: summary?.datastoreCount ?? context.referenceCounts.datastoreCount ?? 0,
      snapshotCount: summary?.snapshotCount ?? context.referenceCounts.snapshotCount ?? assessment.infrastructureInput?.snapshotCount ?? 0,
      poweredOnVmCount: summary?.poweredOnVmCount ?? 0,
      poweredOffVmCount: summary?.poweredOffVmCount ?? 0,
      totalProvisionedGb: summary?.totalProvisionedGb ?? null,
      totalUsedGb: summary?.totalUsedGb ?? null,
    },
    executiveSummary,
    technicalSummary,
    missingEvidence,
    topFindings,
    visibleFindings,
    vmMatrixPreview,
    findingCounts,
    reportCards,
    sections,
    lockedSections: reportPlan.lockedSections,
    upgradeRecommendations,
    upgradeButtons: [
      {
        triggerType: "unlock_report_clicked",
        title: "Readiness Report",
        description: "Unlock the full readiness report to turn the preview into a shareable migration narrative.",
        ctaLabel: "Unlock Readiness Report",
      },
      {
        triggerType: "unlock_pro_clicked",
        title: "Readiness Report Pro",
        description: "Unlock the full VM matrix and deeper technical sections for larger assessments.",
        ctaLabel: "Unlock Pro Report",
      },
      {
        triggerType: "storage_addon_clicked",
        title: "Storage Add-on",
        description: "Add deeper Storage Destination Readiness for target architecture validation.",
        ctaLabel: "Add Storage Readiness",
      },
      {
        triggerType: "review_call_clicked",
        title: "Technical Review",
        description: "Request a human review path for assumptions, findings and next-step guidance.",
        ctaLabel: "Book Technical Review",
      },
    ],
  };
}
