import type { AssessmentDetail } from "../assessments/assessmentService";
import {
  computeMigrationContextCoverage,
  getImportantMigrationContext,
  getMigrationContextFromAssessment,
  getMigrationContextMissingEvidence,
} from "../assessments/migrationContextService";
import { getPreliminaryCostRiskPreview } from "../assessments/costRiskService";
import { buildInventoryDrivenCostRiskContext } from "../risk/riskContext";

export function buildAiAdvisoryContextPayload(assessment: AssessmentDetail) {
  const inventoryContext = buildInventoryDrivenCostRiskContext(assessment);
  const migrationContext = getMigrationContextFromAssessment(assessment);
  const contextCoverage = computeMigrationContextCoverage(migrationContext);
  const costRisk = getPreliminaryCostRiskPreview(assessment);
  const activeEvidence = (assessment.evidenceFiles ?? []).filter((file) => !file.deletedAt);

  return {
    assessment: {
      id: assessment.id,
      title: assessment.title,
      type: assessment.assessmentType,
      sourcePlatform: assessment.sourcePlatform,
      targetPlatform: assessment.targetPlatform,
      storageReadinessEnabled: assessment.storageReadinessEnabled,
    },
    rvtoolsSummary: inventoryContext.parsedInventory?.summary
      ? {
          vmCount: inventoryContext.parsedInventory.summary.vmCount,
          hostCount: inventoryContext.parsedInventory.summary.hostCount,
          datastoreCount: inventoryContext.parsedInventory.summary.datastoreCount,
          snapshotCount: inventoryContext.parsedInventory.summary.snapshotCount,
          poweredOnVmCount: inventoryContext.parsedInventory.summary.poweredOnVmCount,
          poweredOffVmCount: inventoryContext.parsedInventory.summary.poweredOffVmCount,
          totalProvisionedGb: inventoryContext.parsedInventory.summary.totalProvisionedGb,
          totalUsedGb: inventoryContext.parsedInventory.summary.totalUsedGb,
        }
      : null,
    scores: {
      readinessScore: assessment.assessmentScore?.readinessScore ?? null,
      confidenceScore: assessment.assessmentScore?.confidenceScore ?? null,
      inventoryScore: assessment.assessmentScore?.inventoryScore ?? null,
      costRiskScore: assessment.assessmentScore?.costRiskScore ?? null,
      riskLevel: assessment.assessmentScore?.riskLevel ?? null,
    },
    riskFindings: (assessment.riskFindings ?? []).slice(0, 25).map((finding) => ({
      category: finding.category,
      severity: finding.severity,
      entityType: finding.entityType,
      entityName: finding.entityName,
      title: finding.title,
      description: finding.description,
      recommendation: finding.recommendation,
      source: finding.source,
    })),
    manualMigrationContext: {
      coverage: contextCoverage,
      importantContext: getImportantMigrationContext(migrationContext, 20),
      missingContext: getMigrationContextMissingEvidence(contextCoverage),
      answers: migrationContext.answers,
    },
    assumptions: {
      costRisk: {
        annualSubscriptionDelta: costRisk.annualSubscriptionDelta,
        threeYearSubscriptionDelta: costRisk.threeYearSubscriptionDelta,
        savingsPercent: costRisk.savingsPercent,
        riskLevel: costRisk.riskLevel,
        readinessLabel: costRisk.readinessLabel,
        dataSourceLabel: costRisk.dataSourceLabel,
      },
      mismatchWarnings: costRisk.mismatchWarnings,
      referenceCounts: costRisk.referenceCounts,
    },
    evidenceReceived: activeEvidence.map((file) => ({
      evidenceType: file.evidenceType,
      originalFilename: file.originalFilename,
      processingStatus: file.processingStatus,
      sizeBytes: file.sizeBytes,
      uploadedAt: file.uploadedAt,
    })),
    evidenceMissing: [
      ...costRisk.missingEvidence,
      ...getMigrationContextMissingEvidence(contextCoverage),
    ],
    excluded: [
      "secrets",
      "environment variables",
      "session cookies",
      "password reset tokens",
      "raw uploaded file contents",
    ],
  };
}
