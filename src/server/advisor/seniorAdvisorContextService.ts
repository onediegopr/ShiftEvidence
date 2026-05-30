import {
  computeAssessmentCompletionSummary,
  getAssessmentCompletionStatus,
  getMissingEvidenceSummary,
  getNextStepsSummary,
} from "../assessments/assessmentCompletionService";
import type { AssessmentDetail } from "../assessments/assessmentService";
import { getParsedInventorySnapshot } from "../rvtools/rvtoolsInventoryService";
import { sanitizeSeniorAdvisorText } from "./seniorAdvisorSecurity";
import {
  SENIOR_ADVISOR_CONTEXT_VERSION,
  type SeniorAdvisorContextPayload,
} from "./seniorAdvisorTypes";

const MAX_LIST_ITEMS = 8;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeString(value: unknown, maxChars = 600) {
  return typeof value === "string" && value.trim()
    ? sanitizeSeniorAdvisorText(value.trim(), maxChars)
    : null;
}

function stringListFromUnknown(value: unknown, maxItems = MAX_LIST_ITEMS): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return safeString(item, 300);
      }

      if (isRecord(item)) {
        return (
          safeString(item.item, 200) ??
          safeString(item.question, 200) ??
          safeString(item.title, 200) ??
          safeString(item.constraint, 200) ??
          safeString(item.risk, 200)
        );
      }

      return null;
    })
    .filter((item): item is string => Boolean(item))
    .slice(0, maxItems);
}

function getStorageAnalysisObject(assessment: AssessmentDetail) {
  const recommendationsJson = assessment.storageAnalysis?.recommendationsJson;
  return isRecord(recommendationsJson) ? recommendationsJson : null;
}

function getCephReadinessObject(assessment: AssessmentDetail) {
  const storageAnalysis = getStorageAnalysisObject(assessment);
  const cephReadiness = storageAnalysis?.cephReadiness;
  return isRecord(cephReadiness) ? cephReadiness : null;
}

function getStorageMissingEvidence(assessment: AssessmentDetail) {
  const analysisMissing = stringListFromUnknown(assessment.storageAnalysis?.missingEvidenceJson);
  if (analysisMissing.length > 0) {
    return analysisMissing;
  }

  const storageAnalysis = getStorageAnalysisObject(assessment);
  return stringListFromUnknown(storageAnalysis?.missingEvidence);
}

function getClientContextQuestions(assessment: AssessmentDetail) {
  return stringListFromUnknown(assessment.clientContextAnalysis?.nextQuestionsJson);
}

function getLicensingMissingEvidence(assessment: AssessmentDetail) {
  return stringListFromUnknown(assessment.licensingAnalysis?.missingEvidenceJson);
}

function getReceivedEvidenceTypes(assessment: AssessmentDetail) {
  const types = new Set<string>();
  for (const file of assessment.evidenceFiles ?? []) {
    if (file.deletedAt === null && file.processingStatus !== "deleted") {
      types.add(file.evidenceType);
    }
  }
  return [...types].sort().slice(0, MAX_LIST_ITEMS);
}

function getLatestReport(assessment: AssessmentDetail) {
  return (assessment.reports ?? []).find((report) => report.deletedAt === null) ?? null;
}

export function buildSeniorAdvisorContextPayload(
  assessment: AssessmentDetail,
): SeniorAdvisorContextPayload {
  const completion = getAssessmentCompletionStatus(assessment);
  const completionSummary = computeAssessmentCompletionSummary(assessment);
  const parsedInventory = getParsedInventorySnapshot(assessment);
  const latestSummary = assessment.parsedInventorySummaries?.[0] ?? null;
  const latestReport = getLatestReport(assessment);
  const storageAnalysisObject = getStorageAnalysisObject(assessment);
  const cephReadiness = getCephReadinessObject(assessment);
  const activeEvidenceCount = (assessment.evidenceFiles ?? []).filter(
    (file) => file.deletedAt === null && file.processingStatus !== "deleted",
  ).length;

  return {
    contextVersion: SENIOR_ADVISOR_CONTEXT_VERSION,
    assessment: {
      id: assessment.id,
      title: safeString(assessment.title, 160) ?? "Assessment",
      clientLabel: safeString(assessment.clientLabel, 160),
      status: assessment.status,
      planLevel: assessment.planLevel,
      workspacePlan: assessment.workspace.plan,
      sourcePlatform: assessment.sourcePlatform,
      targetPlatform: assessment.targetPlatform,
    },
    completion: {
      completionScore: completion.completionScore,
      completionStatus: completion.completionStatus,
      modules: completionSummary.modules.slice(0, 12).map((module) => ({
        key: module.key,
        label: module.label,
        status: module.status,
        optional: !module.required,
        source: "system_generated",
      })),
      missingEvidence: getMissingEvidenceSummary(assessment).slice(0, MAX_LIST_ITEMS),
      nextSteps: getNextStepsSummary(assessment).slice(0, MAX_LIST_ITEMS),
    },
    inventory: {
      vmCount: parsedInventory?.summary?.vmCount ?? latestSummary?.vmCount ?? null,
      hostCount: parsedInventory?.summary?.hostCount ?? latestSummary?.hostCount ?? null,
      datastoreCount:
        parsedInventory?.summary?.datastoreCount ?? latestSummary?.datastoreCount ?? null,
      snapshotCount:
        parsedInventory?.summary?.snapshotCount ?? latestSummary?.snapshotCount ?? null,
      poweredOnVmCount:
        parsedInventory?.summary?.poweredOnVmCount ?? latestSummary?.poweredOnVmCount ?? null,
      poweredOffVmCount:
        parsedInventory?.summary?.poweredOffVmCount ?? latestSummary?.poweredOffVmCount ?? null,
      totalProvisionedGb:
        parsedInventory?.summary?.totalProvisionedGb ?? latestSummary?.totalProvisionedGb ?? null,
      totalUsedGb: parsedInventory?.summary?.totalUsedGb ?? latestSummary?.totalUsedGb ?? null,
      evidenceConfidence: parsedInventory?.evidenceConfidence ?? null,
      inventoryStatus: parsedInventory?.inventoryStatus ?? null,
    },
    scores: {
      readinessScore: assessment.assessmentScore?.readinessScore ?? null,
      confidenceScore: assessment.assessmentScore?.confidenceScore ?? null,
      inventoryScore: assessment.assessmentScore?.inventoryScore ?? null,
      costRiskScore: assessment.assessmentScore?.costRiskScore ?? null,
      storageScore: assessment.assessmentScore?.storageScore ?? null,
      riskLevel: assessment.assessmentScore?.riskLevel ?? null,
    },
    topRisks: (assessment.riskFindings ?? []).slice(0, 10).map((finding) => ({
      severity: finding.severity,
      category: finding.category,
      title: safeString(finding.title, 240) ?? "Risk finding",
      recommendation: safeString(finding.recommendation, 320),
      source: "confirmed",
    })),
    licensing: {
      status: assessment.licensingAnalysis?.status ?? null,
      mode: assessment.licensingAnalysis?.mode ?? null,
      financialConfidenceScore:
        assessment.licensingAnalysis?.financialConfidenceScore ?? null,
      financialConfidenceLabel:
        safeString(assessment.licensingAnalysis?.financialConfidenceLabel, 120),
      executiveRecommendation:
        safeString(assessment.licensingAnalysis?.executiveRecommendation, 600),
      missingEvidence: getLicensingMissingEvidence(assessment),
      disclaimer:
        "Licensing outputs are assessment estimates, not vendor quotes. Missing pricing evidence lowers confidence.",
    },
    clientContext: {
      status: assessment.clientContext?.status ?? null,
      analysisStatus: assessment.clientContextAnalysis?.status ?? null,
      interpretedSummary:
        safeString(assessment.clientContextAnalysis?.interpretedSummary, 700),
      confidence:
        safeString(assessment.clientContextAnalysis?.businessContextConfidence, 120),
      completenessScore:
        assessment.clientContextAnalysis?.contextCompletenessScore ?? null,
      nextQuestions: getClientContextQuestions(assessment),
      source: assessment.clientContextAnalysis ? "system_generated" : "missing",
    },
    storage: {
      status: assessment.storageDestinationReadiness?.status ?? null,
      currentStorageType: assessment.storageDestinationReadiness?.currentStorageType ?? null,
      targetStoragePreference:
        assessment.storageDestinationReadiness?.targetStoragePreference ?? null,
      storageReadinessScore: assessment.storageAnalysis?.storageReadinessScore ?? null,
      storageEvidenceConfidence:
        assessment.storageAnalysis?.storageEvidenceConfidence ?? null,
      interpretedSummary:
        safeString(assessment.storageAnalysis?.interpretedSummary, 700) ??
        safeString(storageAnalysisObject?.interpretedStorageSummary, 700),
      missingEvidence: getStorageMissingEvidence(assessment),
      cephStatus:
        safeString(cephReadiness?.status, 120) ??
        safeString(assessment.storageAnalysis?.cephSuitabilityStatus, 120),
      cephSummary: safeString(cephReadiness?.summary, 700),
      cephRecommendedNextStep:
        safeString(cephReadiness?.recommendedNextStep, 200),
      disclaimer:
        "Ceph is not recommended by default. The advisor must explain the deterministic Ceph result and cannot override it.",
    },
    evidence: {
      filesCount: assessment.evidenceFiles?.length ?? 0,
      activeFilesCount: activeEvidenceCount,
      receivedTypes: getReceivedEvidenceTypes(assessment),
      metadataOnly: true,
      rawFileContentsExcluded: true,
    },
    reports: {
      generatedCount: (assessment.reports ?? []).filter(
        (report) => report.deletedAt === null && report.status === "generated",
      ).length,
      latestReportType: latestReport?.reportType ?? null,
      latestReportStatus: latestReport?.status ?? null,
    },
    boundaries: [
      "Use only this assessment context.",
      "Do not use raw uploaded file contents.",
      "Do not reproduce raw client or storage free text.",
      "Do not override deterministic readiness, Licensing or Ceph engines.",
      "Do not guarantee migration success, capacity, performance or zero downtime.",
    ],
  };
}

export function summarizeSeniorAdvisorContextSections(
  context: SeniorAdvisorContextPayload,
) {
  return {
    completion: true,
    inventory: context.inventory.vmCount !== null || context.inventory.hostCount !== null,
    riskFindings: context.topRisks.length,
    licensing: Boolean(context.licensing.status),
    clientContext: Boolean(context.clientContext.interpretedSummary),
    storage: Boolean(context.storage.status || context.storage.interpretedSummary),
    ceph: Boolean(context.storage.cephStatus),
    evidenceMetadata: context.evidence.filesCount,
    reports: context.reports.generatedCount,
  };
}

export function extractQuestionLikeItems(context: SeniorAdvisorContextPayload) {
  return [
    ...context.completion.missingEvidence,
    ...context.licensing.missingEvidence,
    ...context.clientContext.nextQuestions,
    ...context.storage.missingEvidence,
  ].slice(0, MAX_LIST_ITEMS);
}
