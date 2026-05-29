import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  ensureAssessmentOwnership,
  type AssessmentDetail,
} from "./assessmentService";
import {
  buildInventoryDrivenCostRiskContext,
  type InventoryDrivenCostRiskContext,
  type InventoryDrivenCostRiskSource,
} from "../risk/riskContext";
import {
  computeMigrationContextCoverage,
  getMigrationContextFromAssessment,
  getMigrationContextMissingEvidence,
} from "./migrationContextService";
import { INPUT_LIMITS, normalizeOptionalTextInput } from "../validation/inputLimits";

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

function decimalFromNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  return new Prisma.Decimal(value);
}

export async function getCostRiskAssumptions(params: {
  userId: string;
  assessmentId: string;
}) {
  const assessment = await ensureAssessmentOwnership(params);
  return prisma.costRiskAssumptions.findUnique({
    where: {
      assessmentId: assessment.id,
    },
  });
}

export async function upsertCostRiskAssumptions(params: {
  userId: string;
  assessmentId: string;
  input: {
    vmwareLicenseModel?: string | null;
    socketCount?: number | null;
    coreCount?: number | null;
    vmCount?: number | null;
    annualVmwareCost?: number | null;
    estimatedProxmoxCost?: number | null;
    currency?: string | null;
    years?: number | null;
    migrationComplexity?: string | null;
    businessCriticality?: string | null;
    riskTolerance?: string | null;
    assumptionsJson?: Prisma.InputJsonValue | null;
  };
}) {
  const assessment = await ensureAssessmentOwnership(params);

  const years = params.input.years ?? 3;
  if (!Number.isInteger(years) || years < 1 || years > 10) {
    throw new Error("Years must be an integer between 1 and 10.");
  }

  const socketCount = params.input.socketCount ?? null;
  const coreCount = params.input.coreCount ?? null;
  const vmCount = params.input.vmCount ?? null;
  const vmwareLicenseModel = normalizeOptionalTextInput(
    params.input.vmwareLicenseModel,
    "VMware license model",
    INPUT_LIMITS.shortText,
  );
  const currency = normalizeOptionalTextInput(params.input.currency, "Currency", 12) ?? "USD";
  const migrationComplexity = normalizeOptionalTextInput(
    params.input.migrationComplexity,
    "Migration complexity",
    INPUT_LIMITS.shortText,
  );
  const businessCriticality = normalizeOptionalTextInput(
    params.input.businessCriticality,
    "Business criticality",
    INPUT_LIMITS.shortText,
  );
  const riskTolerance = normalizeOptionalTextInput(params.input.riskTolerance, "Risk tolerance", INPUT_LIMITS.shortText);

  for (const [label, value] of [
    ["Socket count", socketCount],
    ["Core count", coreCount],
    ["VM count", vmCount],
    ["Annual VMware cost", params.input.annualVmwareCost ?? null],
    ["Estimated Proxmox cost", params.input.estimatedProxmoxCost ?? null],
  ] as const) {
    if (value !== null && value < 0) {
      throw new Error(`${label} cannot be negative.`);
    }
  }

  const assumptions = await prisma.costRiskAssumptions.upsert({
    where: {
      assessmentId: assessment.id,
    },
    create: {
      assessmentId: assessment.id,
      vmwareLicenseModel,
      socketCount,
      coreCount,
      vmCount,
      annualVmwareCost: decimalFromNumber(params.input.annualVmwareCost),
      estimatedProxmoxCost: decimalFromNumber(params.input.estimatedProxmoxCost),
      currency,
      years,
      migrationComplexity,
      businessCriticality,
      riskTolerance,
      assumptionsJson: params.input.assumptionsJson ?? undefined,
    },
    update: {
      vmwareLicenseModel,
      socketCount,
      coreCount,
      vmCount,
      annualVmwareCost: decimalFromNumber(params.input.annualVmwareCost),
      estimatedProxmoxCost: decimalFromNumber(params.input.estimatedProxmoxCost),
      currency,
      years,
      migrationComplexity,
      businessCriticality,
      riskTolerance,
      assumptionsJson: params.input.assumptionsJson ?? undefined,
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId: params.userId,
      workspaceId: assessment.workspaceId,
      assessmentId: assessment.id,
      eventType: "cost_risk_assumptions_updated",
      message: "Updated Cost / Risk assumptions.",
      metadataJson: {
        years,
        hasVmwareCost: params.input.annualVmwareCost !== null && params.input.annualVmwareCost !== undefined,
        hasProxmoxCost: params.input.estimatedProxmoxCost !== null && params.input.estimatedProxmoxCost !== undefined,
      },
    },
  });

  return assumptions;
}

export function calculatePreliminaryCostRisk(params: {
  assessment: AssessmentDetail;
}) {
  const { assessment } = params;
  const assumptions = assessment.costRiskAssumptions;
  const storageEnabled = assessment.storageReadinessEnabled;
  const context = buildInventoryDrivenCostRiskContext(assessment);

  const annualVmwareCost = assumptions?.annualVmwareCost ? toNumber(assumptions.annualVmwareCost) : null;
  const estimatedProxmoxCost = assumptions?.estimatedProxmoxCost ? toNumber(assumptions.estimatedProxmoxCost) : null;
  const years = assumptions?.years ?? 3;

  const annualSubscriptionDelta =
    annualVmwareCost !== null && estimatedProxmoxCost !== null
      ? annualVmwareCost - estimatedProxmoxCost
      : null;
  const threeYearSubscriptionDelta =
    annualSubscriptionDelta !== null ? annualSubscriptionDelta * years : null;
  const savingsPercent =
    annualVmwareCost && annualVmwareCost > 0 && annualSubscriptionDelta !== null
      ? (annualSubscriptionDelta / annualVmwareCost) * 100
      : null;

  let riskScore = 0;
  const recommendations: string[] = [];
  const missingEvidence: string[] = [];
  const migrationContext = getMigrationContextFromAssessment(assessment);
  const migrationContextCoverage = computeMigrationContextCoverage(migrationContext);

  const vmCount = context.referenceCounts.vmCount;
  const hostCount = context.referenceCounts.hostCount;
  const storageFootprintTb = context.referenceCounts.storageFootprintTb;
  const snapshotCount = context.referenceCounts.snapshotCount;
  const criticalWorkloadCount = assessment.infrastructureInput?.criticalWorkloadCount ?? null;

  if (vmCount === null) {
    missingEvidence.push("VM count is missing.");
  } else if (vmCount > 200) {
    riskScore += 20;
  } else if (vmCount > 50) {
    riskScore += 10;
  }

  if (storageFootprintTb === null) {
    missingEvidence.push("Storage footprint is missing.");
  } else if (storageFootprintTb > 100) {
    riskScore += 15;
  } else if (storageFootprintTb > 20) {
    riskScore += 10;
  }

  if (criticalWorkloadCount === null) {
    missingEvidence.push("Critical workload count is missing.");
  } else if (criticalWorkloadCount > 20) {
    riskScore += 15;
  }

  if (snapshotCount === null) {
    missingEvidence.push("Snapshot count is missing.");
  } else if (snapshotCount > 25) {
    riskScore += 10;
  }

  if (hostCount === null) {
    missingEvidence.push("Host count is missing.");
  } else if (hostCount > 10) {
    riskScore += 10;
  }

  if (!storageEnabled && storageFootprintTb !== null && storageFootprintTb > 50) {
    riskScore += 10;
  }

  if (context.mismatchWarnings.length > 0) {
    riskScore += Math.min(context.mismatchWarnings.length * 3, 10);
  }

  if (annualVmwareCost === null) {
    missingEvidence.push("Annual VMware cost is missing.");
  }

  if (estimatedProxmoxCost === null) {
    missingEvidence.push("Estimated Proxmox subscription is missing.");
  }

  if (migrationContextCoverage.status !== "strong") {
    getMigrationContextMissingEvidence(migrationContextCoverage)
      .filter((item) => item !== "No key migration context gaps are currently open.")
      .slice(0, 5)
      .forEach((item) => missingEvidence.push(item));
  }

  if (annualVmwareCost === null || estimatedProxmoxCost === null) {
    recommendations.push("Add cost assumptions to estimate subscription delta.");
  }

  if (!storageEnabled && storageFootprintTb !== null && storageFootprintTb > 50) {
    recommendations.push("Consider adding Storage Destination Readiness.");
  }

  if (snapshotCount !== null && snapshotCount > 25) {
    recommendations.push("Review snapshot cleanup before migration planning.");
  }

  if (criticalWorkloadCount !== null && criticalWorkloadCount > 20) {
    recommendations.push("Prioritize dependency mapping and rollback planning.");
  }

  if (vmCount !== null && vmCount > 50) {
    recommendations.push("Segment workloads into migration waves.");
  }

  if (context.mismatchWarnings.length > 0) {
    recommendations.push("Reconcile manual assumptions with parsed RVTools inventory.");
  }

  if (migrationContextCoverage.status === "missing" || migrationContextCoverage.status === "limited") {
    recommendations.push("Add migration context to improve advisory quality and evidence confidence.");
  } else if (migrationContextCoverage.status === "partial") {
    recommendations.push("Complete the missing key migration context before final wave planning.");
  }

  let riskLevel: "low" | "medium" | "high" = "low";
  if (riskScore >= 60) {
    riskLevel = "high";
  } else if (riskScore >= 30) {
    riskLevel = "medium";
  }

  const readinessLabel =
    riskLevel === "low"
      ? "Early signal looks manageable"
      : riskLevel === "medium"
        ? "Needs technical review"
        : "High-risk migration candidate";

  if (missingEvidence.length === 0 && recommendations.length === 0) {
    recommendations.push("The preliminary signal looks consistent, but still needs validation.");
  }

  const dataSource = context.source as InventoryDrivenCostRiskSource;

  return {
    annualSubscriptionDelta,
    threeYearSubscriptionDelta,
    savingsPercent,
    riskScore,
    riskLevel,
    readinessLabel,
    missingEvidence,
    recommendations,
    dataSource,
    dataSourceLabel: context.sourceLabel,
    mismatchWarnings: context.mismatchWarnings,
    referenceCounts: context.referenceCounts,
    parsedCounts: context.parsedCounts,
    manualCounts: context.manualCounts,
    migrationContextCoverage,
  };
}

export async function upsertPreliminaryResult(params: {
  userId: string;
  assessmentId: string;
}) {
  const assessment = await ensureAssessmentOwnership(params);
  const result = calculatePreliminaryCostRisk({ assessment });

  const preliminaryResult = await prisma.assessmentPreliminaryResult.upsert({
    where: {
      assessmentId: assessment.id,
    },
    create: {
      assessmentId: assessment.id,
      annualSubscriptionDelta: result.annualSubscriptionDelta,
      threeYearSubscriptionDelta: result.threeYearSubscriptionDelta,
      savingsPercent: result.savingsPercent,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      readinessLabel: result.readinessLabel,
      missingEvidenceJson: result.missingEvidence,
      recommendationsJson: result.recommendations,
      calculatedAt: new Date(),
    },
    update: {
      annualSubscriptionDelta: result.annualSubscriptionDelta,
      threeYearSubscriptionDelta: result.threeYearSubscriptionDelta,
      savingsPercent: result.savingsPercent,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      readinessLabel: result.readinessLabel,
      missingEvidenceJson: result.missingEvidence,
      recommendationsJson: result.recommendations,
      calculatedAt: new Date(),
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId: params.userId,
      workspaceId: assessment.workspaceId,
      assessmentId: assessment.id,
      eventType: "preliminary_result_calculated",
      message: "Calculated preliminary cost and risk preview.",
      metadataJson: {
        riskLevel: result.riskLevel,
        riskScore: result.riskScore,
      },
    },
  });

  return preliminaryResult;
}

export function getRiskBadgeLabel(riskLevel?: "low" | "medium" | "high" | null) {
  switch (riskLevel) {
    case "high":
      return "High risk";
    case "medium":
      return "Medium risk";
    case "low":
      return "Low risk";
    default:
      return "Unknown";
  }
}

export function getPreliminaryCostRiskPreview(assessment: AssessmentDetail) {
  const result = calculatePreliminaryCostRisk({ assessment });

  return {
    annualSubscriptionDelta: result.annualSubscriptionDelta,
    threeYearSubscriptionDelta: result.threeYearSubscriptionDelta,
    savingsPercent: result.savingsPercent,
    riskScore: result.riskScore,
    riskLevel: result.riskLevel,
    readinessLabel: result.readinessLabel,
    missingEvidence: result.missingEvidence,
    recommendations: result.recommendations,
    dataSource: result.dataSource,
    dataSourceLabel: result.dataSourceLabel,
    mismatchWarnings: result.mismatchWarnings,
    referenceCounts: result.referenceCounts,
    parsedCounts: result.parsedCounts,
    manualCounts: result.manualCounts,
    migrationContextCoverage: result.migrationContextCoverage,
  };
}

export function getCostRiskStatus(assessment: AssessmentDetail) {
  const assumptions = assessment.costRiskAssumptions;
  const context = buildInventoryDrivenCostRiskContext(assessment);
  const hasVmwareCost = assumptions?.annualVmwareCost !== null && assumptions?.annualVmwareCost !== undefined;
  const hasProxmoxCost = assumptions?.estimatedProxmoxCost !== null && assumptions?.estimatedProxmoxCost !== undefined;
  const hasCoreAssumptions =
    assumptions?.currency &&
    assumptions?.years &&
    context.referenceCounts.vmCount !== null &&
    context.referenceCounts.vmCount !== undefined;

  if (!hasVmwareCost && !hasProxmoxCost && !hasCoreAssumptions) {
    return "missing" as const;
  }

  if (hasVmwareCost && hasProxmoxCost && hasCoreAssumptions) {
    return "complete" as const;
  }

  return "partial" as const;
}

export function getMissingCostRiskEvidence(assessment: AssessmentDetail) {
  const result = calculatePreliminaryCostRisk({ assessment });
  return result.missingEvidence;
}

export function getCostRiskDataSource(assessment: AssessmentDetail) {
  return buildInventoryDrivenCostRiskContext(assessment).source;
}

export function getCostRiskDataSourceLabel(assessment: AssessmentDetail) {
  return buildInventoryDrivenCostRiskContext(assessment).sourceLabel;
}

export function getCostRiskContext(assessment: AssessmentDetail): InventoryDrivenCostRiskContext {
  return buildInventoryDrivenCostRiskContext(assessment);
}
