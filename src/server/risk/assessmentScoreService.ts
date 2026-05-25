import { Prisma, PrismaClient, type AssessmentScore as AssessmentScoreRecord, type RiskSeverity } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { AssessmentDetail } from "../assessments/assessmentService";
import { getCostRiskStatus } from "../assessments/costRiskService";
import {
  buildInventoryDrivenCostRiskContext,
  type InventoryDrivenCostRiskContext,
} from "./riskContext";

type ScoreFindingLike = {
  severity: RiskSeverity;
  category: string;
};

function countFindingsBySeverity(findings: ScoreFindingLike[]) {
  return findings.reduce(
    (acc, finding) => {
      acc[finding.severity] += 1;
      return acc;
    },
    {
      info: 0,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    } satisfies Record<RiskSeverity, number>,
  );
}

function countFindingsByCategory(findings: ScoreFindingLike[]) {
  return findings.reduce(
    (acc, finding) => {
      acc[finding.category] = (acc[finding.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getLatestEvidenceStatus(assessment: AssessmentDetail, context: InventoryDrivenCostRiskContext) {
  if (!context.parsedInventory?.latestEvidence) {
    return "not_uploaded_yet" as const;
  }

  return context.parsedInventory.latestEvidence.processingStatus;
}

function getWarningsCount(context: InventoryDrivenCostRiskContext) {
  return context.parsedInventory?.parseWarnings?.length ?? 0;
}

export function getEvidenceConfidenceScore(params: {
  assessment: AssessmentDetail;
  context?: InventoryDrivenCostRiskContext;
}) {
  const context = params.context ?? buildInventoryDrivenCostRiskContext(params.assessment);
  const evidenceStatus = getLatestEvidenceStatus(params.assessment, context);
  const costRiskStatus = getCostRiskStatus(params.assessment);
  const warningsCount = getWarningsCount(context);
  const parsed = context.parsedInventory;

  if (evidenceStatus === "not_uploaded_yet" || evidenceStatus === "deleted") {
    return 30;
  }

  if (evidenceStatus === "failed") {
    return 35;
  }

  if (evidenceStatus === "uploaded" || evidenceStatus === "queued" || evidenceStatus === "processing") {
    return 40;
  }

  if (!parsed?.summary) {
    return 45;
  }

  if (parsed.inventoryStatus === "partial") {
    return 55;
  }

  const hasVmOnly = parsed.vms.length > 0 && parsed.hosts.length === 0 && parsed.datastores.length === 0;
  const hasSupportSheets = parsed.vms.length > 0 && (parsed.hosts.length > 0 || parsed.datastores.length > 0);
  const hasCoreInventory = parsed.vms.length > 0 && parsed.hosts.length > 0 && parsed.datastores.length > 0;

  let score = 60;
  if (hasSupportSheets) {
    score = 70;
  }

  if (hasVmOnly) {
    score = 60;
  }

  if (hasCoreInventory) {
    score = 70;
  }

  if (costRiskStatus === "complete") {
    score = Math.max(score, 80);
  }

  if (costRiskStatus === "complete" && warningsCount <= 1 && hasCoreInventory) {
    score = 85;
  }

  return clamp(score, 0, 85);
}

export function getInventoryScore(params: {
  assessment: AssessmentDetail;
  context?: InventoryDrivenCostRiskContext;
}) {
  const context = params.context ?? buildInventoryDrivenCostRiskContext(params.assessment);
  const evidenceStatus = getLatestEvidenceStatus(params.assessment, context);
  const parsed = context.parsedInventory;
  const warningsCount = getWarningsCount(context);

  if (evidenceStatus === "not_uploaded_yet" || evidenceStatus === "deleted") {
    return 0;
  }

  if (evidenceStatus === "failed") {
    return 10;
  }

  if (evidenceStatus === "uploaded" || evidenceStatus === "queued" || evidenceStatus === "processing") {
    return 20;
  }

  if (!parsed?.summary) {
    return 30;
  }

  let score = parsed.inventoryStatus === "partial" ? 55 : 70;

  if (parsed.vms.length > 0 && parsed.hosts.length > 0 && parsed.datastores.length > 0) {
    score = 80;
  }

  if (parsed.vms.length > 0 && parsed.hosts.length > 0 && parsed.datastores.length > 0 && parsed.snapshots.length > 0) {
    score = 85;
  }

  if (warningsCount > 0) {
    score = Math.max(45, score - Math.min(warningsCount * 2, 10));
  }

  return clamp(score, 0, 90);
}

export function getCostRiskScore(params: {
  assessment: AssessmentDetail;
  context?: InventoryDrivenCostRiskContext;
}) {
  const context = params.context ?? buildInventoryDrivenCostRiskContext(params.assessment);
  const assumptions = params.assessment.costRiskAssumptions;
  const costRiskStatus = getCostRiskStatus(params.assessment);

  if (costRiskStatus === "missing") {
    return 0;
  }

  if (costRiskStatus === "partial") {
    return 40;
  }

  let score = 70;
  if (assumptions?.annualVmwareCost && assumptions?.estimatedProxmoxCost) {
    score = 80;
  }

  if (context.hasParsedInventory) {
    score = Math.max(score, 85);
  }

  if (context.mismatchWarnings.length > 0) {
    score = Math.max(60, score - Math.min(context.mismatchWarnings.length * 2, 5));
  }

  return clamp(score, 0, 90);
}

export function calculateAssessmentScore(params: {
  assessment: AssessmentDetail;
  findings: ScoreFindingLike[];
  context?: InventoryDrivenCostRiskContext;
}) {
  const context = params.context ?? buildInventoryDrivenCostRiskContext(params.assessment);
  const findingCounts = countFindingsBySeverity(params.findings);
  const categoryCounts = countFindingsByCategory(params.findings);

  const inventoryScore = getInventoryScore({ assessment: params.assessment, context });
  const costRiskScore = getCostRiskScore({ assessment: params.assessment, context });
  const confidenceScore = getEvidenceConfidenceScore({ assessment: params.assessment, context });
  const storageScore = params.assessment.storageReadinessEnabled ? 50 : null;

  let readinessScore = 100;
  readinessScore -= Math.min(findingCounts.low * 2, 10);
  readinessScore -= Math.min(findingCounts.medium * 5, 25);
  readinessScore -= Math.min(findingCounts.high * 10, 40);
  readinessScore -= findingCounts.critical * 20;

  if (getCostRiskStatus(params.assessment) !== "complete") {
    readinessScore -= 10;
  }

  if (confidenceScore < 60) {
    readinessScore -= 10;
  } else if (confidenceScore < 70) {
    readinessScore -= 5;
  }

  if (!params.assessment.storageReadinessEnabled && (context.referenceCounts.storageFootprintTb ?? 0) > 50) {
    readinessScore -= 10;
  }

  if (!context.hasParsedInventory || context.parsedInventory?.inventoryStatus === "failed") {
    readinessScore -= 10;
  }

  readinessScore = clamp(readinessScore, 0, 100);

  let riskLevel: RiskSeverity = "low";
  if (readinessScore < 50) {
    riskLevel = "high";
  } else if (readinessScore < 75) {
    riskLevel = "medium";
  }

  const metadataJson: Prisma.InputJsonValue = {
    source: context.source,
    sourceLabel: context.sourceLabel,
    findingCounts,
    categoryCounts,
    penalties: {
      lowFindingPenalty: Math.min(findingCounts.low * 2, 10),
      mediumFindingPenalty: Math.min(findingCounts.medium * 5, 25),
      highFindingPenalty: Math.min(findingCounts.high * 10, 40),
      criticalFindingPenalty: findingCounts.critical * 20,
      costPenalty: getCostRiskStatus(params.assessment) !== "complete" ? 10 : 0,
      confidencePenalty: confidenceScore < 60 ? 10 : confidenceScore < 70 ? 5 : 0,
      storagePenalty: !params.assessment.storageReadinessEnabled && (context.referenceCounts.storageFootprintTb ?? 0) > 50 ? 10 : 0,
      inventoryPenalty: !context.hasParsedInventory || context.parsedInventory?.inventoryStatus === "failed" ? 10 : 0,
    },
    confidenceInputs: {
      evidenceStatus: context.parsedInventory?.latestEvidence?.processingStatus ?? "not_uploaded_yet",
      inventoryStatus: context.parsedInventory?.inventoryStatus ?? "not_available",
      warningsCount: context.parsedInventory?.parseWarnings?.length ?? 0,
      costRiskStatus: getCostRiskStatus(params.assessment),
    },
    inventoryCounts: context.referenceCounts,
    mismatchWarnings: context.mismatchWarnings,
    sourceCounts: {
      manual: context.manualCounts,
      parsed: context.parsedCounts,
      reference: context.referenceCounts,
    },
  };

  return {
    readinessScore,
    confidenceScore,
    inventoryScore,
    costRiskScore,
    storageScore,
    riskLevel,
    calculatedAt: new Date(),
    metadataJson,
  };
}

export async function upsertAssessmentScore(params: {
  assessmentId: string;
  score: ReturnType<typeof calculateAssessmentScore>;
  tx?: PrismaClient | Prisma.TransactionClient;
}) {
  const db = params.tx ?? prisma;
  return db.assessmentScore.upsert({
    where: {
      assessmentId: params.assessmentId,
    },
    create: {
      assessmentId: params.assessmentId,
      readinessScore: params.score.readinessScore,
      confidenceScore: params.score.confidenceScore,
      inventoryScore: params.score.inventoryScore,
      costRiskScore: params.score.costRiskScore,
      storageScore: params.score.storageScore,
      riskLevel: params.score.riskLevel,
      calculatedAt: params.score.calculatedAt,
      metadataJson: params.score.metadataJson,
    },
    update: {
      readinessScore: params.score.readinessScore,
      confidenceScore: params.score.confidenceScore,
      inventoryScore: params.score.inventoryScore,
      costRiskScore: params.score.costRiskScore,
      storageScore: params.score.storageScore,
      riskLevel: params.score.riskLevel,
      calculatedAt: params.score.calculatedAt,
      metadataJson: params.score.metadataJson,
    },
  });
}

export function getAssessmentScore(assessment: AssessmentDetail): AssessmentScoreRecord | null {
  return assessment.assessmentScore ?? null;
}
