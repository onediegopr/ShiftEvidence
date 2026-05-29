import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ensureAssessmentOwnership, type AssessmentDetail } from "./assessmentService";
import {
  buildLicensingAnalysisInput,
  buildLicensingAssumptionsJson,
  getLicensingAnalysisPreferencesFromAssessment,
  parseLicensingAnalysisPreferencesFormData,
} from "./licensingCostExposureDataService";
import { runLicensingCostExposureAnalysis } from "./licensingCostExposureEngine";
import type {
  AssessmentLicensingAnalysisStatus,
  LicensingAnalysisMode,
  LicensingAnalysisPreferences,
  LicensingAnalysisResult,
} from "./licensingCostExposureTypes";

type ActorParams = {
  userId: string;
  assessmentId: string;
};

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function statusAfterPreferenceSave(params: {
  mode: LicensingAnalysisMode;
  annualVmwareCostUsd: number | null;
  hasContract: boolean;
  hasRenewalQuote: boolean;
}) {
  if (params.mode === "skipped") return "not_included" as const;
  if (params.mode === "actual_costs" && params.annualVmwareCostUsd === null) return "needs_input" as const;
  if (params.mode === "actual_costs" && !params.hasContract && !params.hasRenewalQuote) return "needs_input" as const;
  return "ready" as const;
}

function executiveRecommendationText(result: LicensingAnalysisResult) {
  return `${result.executiveRecommendation.title}: ${result.executiveRecommendation.description}`;
}

export async function buildAssessmentLicensingAnalysisSummary(assessment: AssessmentDetail) {
  const preferences = getLicensingAnalysisPreferencesFromAssessment(assessment);
  const input = await buildLicensingAnalysisInput(assessment);

  return {
    analysis: assessment.licensingAnalysis ?? null,
    preferences,
    pricing: {
      vmwareApprovedAvailable: input.approvedVmwareSnapshots.length > 0,
      proxmoxApprovedAvailable: input.approvedProxmoxSnapshots.length > 0,
      freshnessStatus: input.pricingFreshnessStatus,
      vmwareSnapshots: input.approvedVmwareSnapshots,
      proxmoxSnapshots: input.approvedProxmoxSnapshots,
    },
    detected: {
      hostCount: input.hostCount,
      socketCount: input.socketCount,
      coreCount: input.coreCount,
      vmCount: input.vmCount,
      hasParsedInventory: input.hasParsedInventory,
    },
    currentInput: input,
  };
}

export async function getAssessmentLicensingAnalysisSummary(params: ActorParams) {
  const assessment = await ensureAssessmentOwnership(params);
  return buildAssessmentLicensingAnalysisSummary(assessment);
}

export async function upsertAssessmentLicensingPreferences(params: ActorParams & {
  formData: FormData;
}) {
  const assessment = await ensureAssessmentOwnership(params);
  const parsed = parseLicensingAnalysisPreferencesFormData(params.formData);
  const preferences: LicensingAnalysisPreferences = {
    version: parsed.version,
    mode: parsed.mode,
    renewalDate: parsed.renewalDate,
    hasContract: parsed.hasContract,
    hasRenewalQuote: parsed.hasRenewalQuote,
    migrationInvestmentEstimateUsd: parsed.migrationInvestmentEstimateUsd,
    selectedProxmoxSupportScenario: parsed.selectedProxmoxSupportScenario,
    notes: parsed.notes,
    updatedAt: parsed.updatedAt,
  };
  const assumptionsJson = buildLicensingAssumptionsJson({ assessment, preferences });
  const status = statusAfterPreferenceSave({
    mode: preferences.mode,
    annualVmwareCostUsd: parsed.annualVmwareCostUsd,
    hasContract: preferences.hasContract,
    hasRenewalQuote: preferences.hasRenewalQuote,
  });

  await prisma.$transaction(async (tx) => {
    await tx.costRiskAssumptions.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        annualVmwareCost: parsed.annualVmwareCostUsd === null ? null : new Prisma.Decimal(parsed.annualVmwareCostUsd),
        currency: "USD",
        years: assessment.costRiskAssumptions?.years ?? 3,
        assumptionsJson,
      },
      update: {
        annualVmwareCost: parsed.annualVmwareCostUsd === null ? null : new Prisma.Decimal(parsed.annualVmwareCostUsd),
        currency: "USD",
        assumptionsJson,
      },
    });

    await tx.assessmentLicensingAnalysis.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        status,
        mode: preferences.mode,
        currency: "USD",
        assumptionsJson: json(preferences),
      },
      update: {
        status,
        mode: preferences.mode,
        currency: "USD",
        assumptionsJson: json(preferences),
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "assessment_licensing_analysis_input_updated",
        message: "Updated optional Licensing & Cost Exposure analysis inputs.",
        metadataJson: {
          mode: preferences.mode,
          status,
          currency: "USD",
          hasAnnualVmwareCost: parsed.annualVmwareCostUsd !== null,
          hasRenewalDate: Boolean(preferences.renewalDate),
          hasContract: preferences.hasContract,
          hasRenewalQuote: preferences.hasRenewalQuote,
          hasMigrationInvestment: preferences.migrationInvestmentEstimateUsd !== null,
        },
      },
    });
  });

  return { preferences, status };
}

export async function skipAssessmentLicensingAnalysis(params: ActorParams) {
  const assessment = await ensureAssessmentOwnership(params);
  const preferences: LicensingAnalysisPreferences = {
    version: 1,
    mode: "skipped",
    renewalDate: null,
    hasContract: false,
    hasRenewalQuote: false,
    migrationInvestmentEstimateUsd: null,
    selectedProxmoxSupportScenario: null,
    notes: null,
    updatedAt: new Date().toISOString(),
  };
  const assumptionsJson = buildLicensingAssumptionsJson({ assessment, preferences });

  const result = await prisma.$transaction(async (tx) => {
    await tx.costRiskAssumptions.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        currency: "USD",
        years: 3,
        assumptionsJson,
      },
      update: {
        assumptionsJson,
      },
    });

    const analysis = await tx.assessmentLicensingAnalysis.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        status: "not_included",
        mode: "skipped",
        currency: "USD",
        assumptionsJson: json(preferences),
        generatedAt: null,
      },
      update: {
        status: "not_included",
        mode: "skipped",
        currency: "USD",
        assumptionsJson: json(preferences),
        generatedAt: null,
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "assessment_licensing_analysis_skipped",
        message: "Skipped optional Licensing & Cost Exposure analysis.",
        metadataJson: { mode: "skipped", currency: "USD" },
      },
    });

    return analysis;
  });

  return result;
}

export async function runAssessmentLicensingAnalysis(params: ActorParams & {
  mode?: LicensingAnalysisMode;
}) {
  const assessment = await ensureAssessmentOwnership(params);
  const input = await buildLicensingAnalysisInput(assessment);
  const mode = params.mode ?? input.mode;

  if (mode === "skipped") {
    throw new Error("Licensing analysis is skipped. Enable the module before running analysis.");
  }

  try {
    const result = runLicensingCostExposureAnalysis({ ...input, mode });

    const saved = await prisma.assessmentLicensingAnalysis.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        status: result.status,
        mode: result.mode,
        currency: "USD",
        financialConfidenceScore: result.financialConfidenceScore,
        financialConfidenceLabel: result.financialConfidenceLabel,
        savingsQuality: result.savingsQuality.value,
        pricingFreshnessStatus: result.pricingFreshnessStatus,
        vmwareScenarioJson: json(result.vmwareScenarios),
        proxmoxScenarioJson: json(result.proxmoxScenarios),
        comparisonJson: json(result.comparison),
        costOfStayingJson: json(result.costOfStaying),
        contractTimingRiskJson: json(result.contractTimingRisk),
        licensingTrapsJson: json(result.licensingTraps),
        missingEvidenceJson: json(result.missingEvidence),
        assumptionsJson: json(result.assumptions),
        pricingSnapshotRefsJson: json(result.pricingSnapshotRefs),
        executiveRecommendation: executiveRecommendationText(result),
        generatedAt: new Date(),
      },
      update: {
        status: result.status,
        mode: result.mode,
        currency: "USD",
        financialConfidenceScore: result.financialConfidenceScore,
        financialConfidenceLabel: result.financialConfidenceLabel,
        savingsQuality: result.savingsQuality.value,
        pricingFreshnessStatus: result.pricingFreshnessStatus,
        vmwareScenarioJson: json(result.vmwareScenarios),
        proxmoxScenarioJson: json(result.proxmoxScenarios),
        comparisonJson: json(result.comparison),
        costOfStayingJson: json(result.costOfStaying),
        contractTimingRiskJson: json(result.contractTimingRisk),
        licensingTrapsJson: json(result.licensingTraps),
        missingEvidenceJson: json(result.missingEvidence),
        assumptionsJson: json(result.assumptions),
        pricingSnapshotRefsJson: json(result.pricingSnapshotRefs),
        executiveRecommendation: executiveRecommendationText(result),
        generatedAt: new Date(),
      },
    });

    await prisma.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "assessment_licensing_analysis_generated",
        message: "Generated Licensing & Cost Exposure analysis.",
        metadataJson: {
          mode: result.mode,
          status: result.status,
          confidence: result.financialConfidenceScore,
          savingsQuality: result.savingsQuality.value,
          pricingFreshnessStatus: result.pricingFreshnessStatus,
          missingEvidenceCount: result.missingEvidence.length,
          trapCount: result.licensingTraps.length,
          currency: "USD",
        },
      },
    });

    return { saved, result };
  } catch (error) {
    await prisma.assessmentLicensingAnalysis.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        status: "blocked",
        mode,
        currency: "USD",
      },
      update: {
        status: "blocked",
        mode,
        currency: "USD",
      },
    });

    await prisma.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "assessment_licensing_analysis_failed",
        message: "Licensing & Cost Exposure analysis failed.",
        metadataJson: {
          mode,
          error: error instanceof Error ? error.message.slice(0, 180) : "Unknown error",
        },
      },
    });

    throw error;
  }
}

export function getLicensingAnalysisStatusLabel(status: AssessmentLicensingAnalysisStatus | string | null | undefined) {
  const labels: Record<string, string> = {
    blocked: "Blocked",
    completed: "Completed",
    needs_input: "Needs input",
    not_included: "Not included",
    ready: "Ready to analyze",
    stale_pricing: "Stale pricing",
  };

  return status ? labels[status] ?? status : "Not included";
}
