import { type AssessmentDetail } from "./assessmentService";
import { getCostRiskStatus } from "./costRiskService";
import { buildInfrastructureStatus } from "./infrastructureInputService";
import { getEvidenceUploadStatus } from "../evidence/evidenceFileService";
import { getParsedInventorySnapshot } from "../rvtools/rvtoolsInventoryService";
import { getReportPreviewStatusFromReports } from "../reports/reportHistoryService";

export type CompletionStatus = "missing" | "partial" | "complete";

export function getAssessmentCompletionStatus(assessment: AssessmentDetail) {
  const infrastructureStatus = buildInfrastructureStatus(assessment.infrastructureInput);
  const costAssumptionsStatus = getCostRiskStatus(assessment);
  const storageStatus = assessment.storageReadinessEnabled
    ? assessment.storageReadinessInput
      ? "selected"
      : "pending"
    : "skipped";
  const rvtoolsStatus = getEvidenceUploadStatus(assessment);
  const inventorySnapshot = getParsedInventorySnapshot(assessment);
  const inventoryStatus = inventorySnapshot?.inventoryStatus ?? "not_available";
  const evidenceConfidence = inventorySnapshot?.evidenceConfidence ?? "limited";
  const previewReady = Boolean(assessment.preliminaryResult);
  const pdfStatus = getReportPreviewStatusFromReports(assessment);
  const hasReportPreviewSignals =
    previewReady ||
    inventoryStatus !== "not_available" ||
    Boolean(assessment.assessmentScore) ||
    (assessment.riskFindings?.length ?? 0) > 0;
  const reportPreviewStatus =
    hasReportPreviewSignals ? (inventoryStatus === "parsed" ? "available" : "partial") : "locked";

  const score =
    (infrastructureStatus === "complete" ? 35 : infrastructureStatus === "partial" ? 20 : 0) +
    (costAssumptionsStatus === "complete" ? 35 : costAssumptionsStatus === "partial" ? 20 : 0) +
    (previewReady ? 20 : 0) +
    (storageStatus === "skipped" || storageStatus === "selected" ? 10 : 0) +
    (rvtoolsStatus === "uploaded" || rvtoolsStatus === "parsed" ? 10 : 0) +
    (inventoryStatus === "parsed" ? 10 : inventoryStatus === "partial" ? 5 : 0);

  const completionStatus: CompletionStatus =
    score >= 80 ? "complete" : score >= 40 ? "partial" : "missing";

  return {
    infrastructureStatus,
    costAssumptionsStatus,
    storageStatus,
    rvtoolsStatus,
    inventoryStatus,
    evidenceConfidence,
    reportPreviewStatus,
    fullReportStatus: "locked" as const,
    pdfStatus,
    reportStatus: "locked" as const,
    completionScore: Math.min(score, 100),
    completionStatus,
  };
}

export function getMissingEvidenceSummary(assessment: AssessmentDetail) {
  const completion = getAssessmentCompletionStatus(assessment);
  const preview = assessment.preliminaryResult;
  const inventoryStatus = completion.inventoryStatus;

  const missing: string[] = [];

  if (completion.infrastructureStatus !== "complete") {
    missing.push("Complete the manual infrastructure intake.");
  }

  if (completion.costAssumptionsStatus !== "complete") {
    missing.push("Finish the Cost / Risk assumptions.");
  }

  if (completion.storageStatus === "pending") {
    missing.push("Decide whether Storage Destination Readiness is needed.");
  }

  if (!preview) {
    missing.push("Generate the preliminary cost and risk preview.");
  }

  if (inventoryStatus !== "not_available" && !assessment.assessmentScore) {
    missing.push("Generate inventory-driven risk insights.");
  }

  if (completion.rvtoolsStatus === "not_uploaded_yet") {
    missing.push("Upload RVTools evidence to prepare for the future parser.");
  } else if (completion.rvtoolsStatus === "deleted") {
    missing.push("Re-upload RVTools evidence if you need the parser-ready workflow.");
  } else if (completion.rvtoolsStatus === "uploaded") {
    missing.push("Parse RVTools evidence to create a preliminary inventory.");
  } else if (completion.rvtoolsStatus === "failed") {
    missing.push("Reparse RVTools evidence after fixing the parsing issue.");
  }

  return missing;
}

export function getNextStepsSummary(assessment: AssessmentDetail) {
  const completion = getAssessmentCompletionStatus(assessment);

  const steps = [
    "Upload RVTools evidence when you are ready for the next milestone.",
    completion.rvtoolsStatus === "uploaded"
      ? "Run the basic RVTools parser to create a preliminary inventory."
      : completion.rvtoolsStatus === "parsed"
        ? "Review the preliminary inventory and parser warnings."
        : "Review the preliminary inventory once parsing is complete.",
    inventoryStatusHasScore(assessment)
      ? "Review inventory-driven risk findings and readiness scores."
      : "Generate inventory-driven risk insights when the parsed inventory is ready.",
    "Complete Cost / Risk assumptions.",
    "Review missing evidence before making a migration decision.",
  ];

  if (completion.storageStatus === "pending") {
    steps.splice(1, 0, "Decide whether to add Storage Destination Readiness.");
  }

  if (completion.completionStatus === "complete") {
    steps.push("Use the preview as a preliminary signal, not a final report.");
  }

  return steps;
}

function inventoryStatusHasScore(assessment: AssessmentDetail) {
  return Boolean(getParsedInventorySnapshot(assessment)) && Boolean(assessment.assessmentScore);
}
