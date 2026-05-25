import {
  Prisma,
  type RiskFinding as RiskFindingRecord,
  type RiskSeverity,
} from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { findAssessmentForUser, type AssessmentDetail } from "../assessments/assessmentService";
import {
  generateRiskFindingsForAssessment,
  type RiskFindingDraft,
} from "./riskFindingEngine";
import {
  calculateAssessmentScore,
  upsertAssessmentScore,
} from "./assessmentScoreService";

const severityRank: Record<RiskSeverity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function compareSeverity(left: RiskSeverity, right: RiskSeverity) {
  return severityRank[right] - severityRank[left];
}

function normalizePowerState(value: string | null | undefined) {
  return value?.toLowerCase().replace(/\s+/g, " ") ?? "";
}

export async function deleteExistingGeneratedFindings(params: {
  tx?: Prisma.TransactionClient;
  assessmentId: string;
}) {
  const db = params.tx ?? prisma;
  return db.riskFinding.deleteMany({
    where: {
      assessmentId: params.assessmentId,
      source: {
        in: ["parser", "cost_risk", "system"],
      },
    },
  });
}

export async function persistRiskFindings(params: {
  tx?: Prisma.TransactionClient;
  findings: RiskFindingDraft[];
}) {
  if (params.findings.length === 0) {
    return { count: 0 };
  }

  const db = params.tx ?? prisma;
  return db.riskFinding.createMany({
    data: params.findings.map((finding) => ({
      assessmentId: finding.assessmentId,
      evidenceFileId: finding.evidenceFileId,
      category: finding.category,
      severity: finding.severity,
      entityType: finding.entityType,
      entityName: finding.entityName,
      title: finding.title,
      description: finding.description,
      recommendation: finding.recommendation,
      visibleInFree: finding.visibleInFree,
      requiresPlan: finding.requiresPlan,
      source: finding.source,
      metadataJson: finding.metadataJson as Prisma.InputJsonValue | undefined,
    })),
  });
}

export async function generateInventoryRiskInsights(params: {
  userId: string;
  assessmentId: string;
}) {
  const assessment = await findAssessmentForUser({
    userId: params.userId,
    assessmentId: params.assessmentId,
  });

  if (!assessment) {
    throw new Error("Assessment not found or access denied.");
  }

  const generated = generateRiskFindingsForAssessment(assessment);
  const score = calculateAssessmentScore({
    assessment,
    findings: generated.findings,
    context: generated.context,
  });

  await prisma.$transaction(async (tx) => {
    const deleted = await deleteExistingGeneratedFindings({
      tx,
      assessmentId: assessment.id,
    });

    await persistRiskFindings({
      tx,
      findings: generated.findings,
    });

    await upsertAssessmentScore({
      tx,
      assessmentId: assessment.id,
      score,
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "risk_findings_generated",
        message: "Generated inventory-driven risk findings.",
        metadataJson: {
          totalFindings: generated.summary.totalFindings,
          bySeverity: generated.summary.bySeverity,
          byCategory: generated.summary.byCategory,
          source: generated.summary.source,
          mismatchWarnings: generated.summary.mismatchWarnings,
          deletedGeneratedFindings: deleted.count,
        },
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "assessment_score_calculated",
        message: "Calculated inventory-driven readiness score.",
        metadataJson: {
          readinessScore: score.readinessScore,
          confidenceScore: score.confidenceScore,
          inventoryScore: score.inventoryScore,
          costRiskScore: score.costRiskScore,
          riskLevel: score.riskLevel,
        },
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "inventory_cost_risk_updated",
        message: "Updated inventory-driven Cost / Risk insights.",
        metadataJson: {
          source: generated.summary.source,
          mismatchWarnings: generated.summary.mismatchWarnings,
          totalFindings: generated.summary.totalFindings,
        },
      },
    });
  });

  return {
    findings: generated.findings,
    score,
    summary: generated.summary,
  };
}

export function getFindingCountsBySeverity(findings: Array<Pick<RiskFindingRecord, "severity">>) {
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

export function getTopFindings(assessment: AssessmentDetail, limit = 8) {
  const findings = [...(assessment.riskFindings ?? [])].sort((left, right) => {
    const severityDiff = compareSeverity(left.severity, right.severity);
    if (severityDiff !== 0) {
      return severityDiff;
    }

    return right.updatedAt.getTime() - left.updatedAt.getTime();
  });

  return findings.slice(0, limit);
}

export function getVisibleFindingsForFreePlan(assessment: AssessmentDetail) {
  return (assessment.riskFindings ?? []).filter((finding) => finding.visibleInFree);
}

export type VmRiskMatrixRow = {
  vmName: string;
  powerState: string | null;
  guestOs: string | null;
  cpuCount: number | null;
  memoryMb: number | null;
  provisionedGb: number | null;
  usedGb: number | null;
  datastoreName: string | null;
  hostName: string | null;
  riskLevel: RiskSeverity;
  mainReason: string;
  recommendation: string | null;
};

export function getVmRiskMatrixRows(params: {
  assessment: AssessmentDetail;
  risk?: string | null;
  power?: string | null;
  limit?: number;
}) {
  const limit = params.limit ?? 50;
  const filterRisk = params.risk?.trim().toLowerCase() ?? "all";
  const filterPower = params.power?.trim().toLowerCase() ?? "all";

  const vmFindings = (params.assessment.riskFindings ?? []).filter((finding) => finding.category === "vm");
  const findingsByVm = new Map<string, RiskFindingRecord>();

  for (const finding of vmFindings) {
    const entityName = finding.entityName?.trim();
    if (!entityName) {
      continue;
    }

    const existing = findingsByVm.get(entityName);
    if (!existing || compareSeverity(existing.severity, finding.severity) > 0) {
      findingsByVm.set(entityName, finding);
    }
  }

  const rows = [...(params.assessment.parsedVMs ?? [])]
    .map<VmRiskMatrixRow>((row) => {
      const matchedFinding = findingsByVm.get(row.vmName);
      const parserRiskLevel = (row.riskLevel ?? "info") as RiskSeverity;
      const highestRisk = matchedFinding ? matchedFinding.severity : parserRiskLevel;
      const mainReason =
        matchedFinding?.title ??
        row.recommendation ??
        (highestRisk === "high"
          ? "Parser flagged this VM as high risk."
          : highestRisk === "medium"
            ? "Parser flagged this VM for review."
            : row.powerState && normalizePowerState(row.powerState).includes("off")
              ? "VM is powered off."
              : "No major risk signal captured yet.");

      return {
        vmName: row.vmName,
        powerState: row.powerState,
        guestOs: row.guestOs,
        cpuCount: row.cpuCount,
        memoryMb: row.memoryMb,
        provisionedGb: row.provisionedGb,
        usedGb: row.usedGb,
        datastoreName: row.datastoreName,
        hostName: row.hostName,
        riskLevel: highestRisk,
        mainReason,
        recommendation: matchedFinding?.recommendation ?? row.recommendation ?? null,
      };
    })
    .filter((row) => {
      if (filterRisk !== "all" && row.riskLevel !== filterRisk) {
        return false;
      }

      if (filterPower === "powered_on") {
        return !normalizePowerState(row.powerState).includes("off") && !normalizePowerState(row.powerState).includes("stopped");
      }

      if (filterPower === "powered_off") {
        return normalizePowerState(row.powerState).includes("off") || normalizePowerState(row.powerState).includes("stopped");
      }

      return true;
    })
    .sort((left, right) => {
      const severityDiff = severityRank[right.riskLevel] - severityRank[left.riskLevel];
      if (severityDiff !== 0) {
        return severityDiff;
      }

      const leftSize = left.provisionedGb ?? left.usedGb ?? 0;
      const rightSize = right.provisionedGb ?? right.usedGb ?? 0;
      if (rightSize !== leftSize) {
        return rightSize - leftSize;
      }

      return left.vmName.localeCompare(right.vmName);
    });

  return {
    rows: rows.slice(0, limit),
    total: rows.length,
    limit,
    filterRisk,
    filterPower,
  };
}
