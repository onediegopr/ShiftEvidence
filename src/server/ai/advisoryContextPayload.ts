import type { AssessmentDetail } from "../assessments/assessmentService";
import {
  computeMigrationContextCoverage,
  getImportantMigrationContext,
  getMigrationContextFromAssessment,
  getMigrationContextMissingEvidence,
  migrationContextQuestions,
} from "../assessments/migrationContextService";
import { getPreliminaryCostRiskPreview } from "../assessments/costRiskService";
import { buildInventoryDrivenCostRiskContext } from "../risk/riskContext";
import { sanitizeAiPayload, truncateLongText } from "./aiAdvisorySanitizer";
import type { AiAdvisoryContextPayload } from "./aiAdvisoryTypes";

function safeReference(id: string) {
  return `assessment-${id.slice(0, 8)}`;
}

function safeEvidenceFilename(value: string) {
  return truncateLongText(value.replace(/\.[a-z0-9]+$/i, "").replace(/[^a-zA-Z0-9._ -]/g, "_"), 80);
}

function getContextStatusCounts(answers: ReturnType<typeof getMigrationContextFromAssessment>["answers"]) {
  return Object.values(answers).reduce(
    (counts, answer) => ({
      ...counts,
      [answer.status]: counts[answer.status] + 1,
    }),
    {
      answered: 0,
      unknown: 0,
      not_applicable: 0,
      skipped: 0,
    },
  );
}

export function buildAiAdvisoryContextPayload(assessment: AssessmentDetail): AiAdvisoryContextPayload {
  const inventoryContext = buildInventoryDrivenCostRiskContext(assessment);
  const migrationContext = getMigrationContextFromAssessment(assessment);
  const contextCoverage = computeMigrationContextCoverage(migrationContext);
  const costRisk = getPreliminaryCostRiskPreview(assessment);
  const activeEvidence = (assessment.evidenceFiles ?? []).filter((file) => !file.deletedAt);

  const payload = {
    assessment: {
      safeReference: safeReference(assessment.id),
      type: assessment.assessmentType,
      sourcePlatform: assessment.sourcePlatform,
      targetPlatform: assessment.targetPlatform,
      status: assessment.status,
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
      entityName: finding.entityName ? truncateLongText(finding.entityName, 120) : null,
      title: truncateLongText(finding.title, 160),
      description: truncateLongText(finding.description, 500),
      recommendation: finding.recommendation ? truncateLongText(finding.recommendation, 500) : null,
      source: finding.source,
    })),
    manualMigrationContext: {
      coverage: {
        overallPercent: contextCoverage.overallPercent,
        status: contextCoverage.status,
        missingKeyContext: contextCoverage.missingKeyContext,
        sections: contextCoverage.sections,
      },
      statusCounts: getContextStatusCounts(migrationContext.answers),
      importantContext: getImportantMigrationContext(migrationContext, 20),
      missingContext: getMigrationContextMissingEvidence(contextCoverage),
      answers: migrationContextQuestions.map((question) => {
        const answer = migrationContext.answers[question.id];
        return {
          question: question.label,
          status: answer.status,
          source: answer.source,
          value: answer.status === "answered" ? answer.value : null,
        };
      }),
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
      safeFilenameLabel: safeEvidenceFilename(file.originalFilename),
      processingStatus: file.processingStatus,
      sizeBytes: file.sizeBytes,
      uploadedAt: file.uploadedAt.toISOString(),
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
      "absolute or relative private storage paths",
      "full uploaded filenames if they contain sensitive customer terms",
    ],
  } satisfies AiAdvisoryContextPayload;

  return sanitizeAiPayload(payload) as AiAdvisoryContextPayload;
}
