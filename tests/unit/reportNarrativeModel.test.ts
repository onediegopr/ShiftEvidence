import { describe, expect, it } from "vitest";
import { buildReportExecutiveCommandCenter } from "../../src/server/reports/reportExecutiveCommandCenter";
import {
  buildReportNarrativeModelFromMigrationPlan,
  buildReportNarrativeModelFromPreview,
} from "../../src/server/reports/reportNarrativeModel";
import type { MigrationRecommendationPlan } from "../../src/server/reports/migrationPlanTypes";
import type { ReportPreviewData } from "../../src/server/reports/reportPreviewService";

function makePreview(): ReportPreviewData {
  return {
    assessmentId: "preview-1",
    assessmentTitle: "Northbridge Synthetic Preview",
    workspaceName: "QA Workspace",
    clientLabel: "Northbridge",
    planLabel: "Professional Assessment",
    planRank: 2,
    reportPreviewStatus: "available",
    fullReportStatus: "unlocked",
    pdfStatus: "generated",
    commercialStatus: { status: "unlocked", label: "Unlocked" },
    completionScore: 74,
    completionStatus: "Ready",
    assessmentCoverage: {
      title: "Assessment Coverage",
      intro: "Synthetic coverage section",
      completionPercent: 74,
      reportConfidencePercent: 58,
      requiredModulesLabel: "Partial",
      reportGenerationLabel: "Generated",
      rows: [],
      limitations: ["Backup evidence missing."],
      hasLimitations: true,
      usdNote: "All costs modeled in USD.",
    },
    evidenceConfidence: "moderate",
    evidenceConfidenceLabel: "Moderate",
    sourceLabel: "Parsed RVTools + guided context",
    costRiskPreview: {
      riskLevel: "high",
      annualSubscriptionDelta: -9000,
      threeYearSubscriptionDelta: -27000,
      savingsPercent: 22,
      recommendations: ["Validate backup posture before Wave 1."],
      missingEvidence: ["Backup platform export"],
      dataSourceLabel: "Parsed RVTools + guided context",
      readinessLabel: "Pilot first",
    },
    costRiskStatus: "available",
    licensingCostExposure: {
      included: false,
      status: "not_included",
      mode: "directional_estimate",
      currency: "USD",
      financialConfidenceScore: null,
      financialConfidenceLabel: "Not available",
      savingsQuality: "low",
      pricingFreshnessStatus: "unknown",
      executiveRecommendation: null,
      vmwareScenario: null,
      proxmoxScenario: null,
      comparison: null,
      costOfStaying: null,
      contractTimingRisk: null,
      licensingTraps: [],
      missingEvidence: [],
      assumptions: [],
      pricingSnapshotUsed: [],
      disclaimers: [],
      warnings: [],
    },
    customerContextIntelligence: {
      included: false,
      status: "not_included",
      analysisStatus: "not_started",
      contextCompletenessScore: null,
      businessContextConfidence: "low",
      interpretedSummary: "Context not yet enriched.",
      businessPriorities: [],
      migrationConstraints: [],
      criticalWorkloads: [],
      customerReportedRisks: [],
      aiExtractedInsights: [],
      contradictions: [],
      validationItems: [],
      reportImpact: [],
      nextQuestions: [],
      safetyFlags: [],
      additionalEvidenceSummary: [],
      assumptions: [],
      disclaimers: [],
      generatedAt: null,
      modelUsed: null,
      promptVersion: null,
    },
    storageDestinationReadiness: {
      included: true,
      status: "completed",
      currentStorageType: "vmfs",
      targetStoragePreference: "zfs",
      storageReadinessScore: 61,
      storageEvidenceConfidence: 54,
      storageDestinationReadiness: 61,
      storageMigrationRisk: 52,
      interpretedStorageSummary: "Target storage can be modeled, but backup evidence is missing.",
      sourceStorageSummary: [],
      destinationOptions: [],
      storageConstraints: [],
      missingStorageEvidence: [],
      storageContradictions: [],
      nextStorageQuestions: [],
      ceph: {
        requestedOrConsidered: false,
        status: "not_requested",
        summary: "Ceph was not requested.",
        suitabilityScore: null,
        operationsReadinessScore: null,
        evidenceConfidenceScore: null,
        capacityFitScore: null,
        networkReadinessScore: null,
        failureDomainReadinessScore: null,
        backupReadinessScore: null,
        operationalSkillsScore: null,
        findings: [],
        remediations: [],
        missingEvidence: [],
        recommendedNextStep: "not_applicable",
      },
      additionalStorageEvidence: [],
      assumptions: ["Target storage assumptions remain directional."],
      disclaimers: [],
    },
    readinessScore: 72,
    confidenceScore: 48,
    recommendedDecision: "Pilot First",
    evidenceOverview: {
      received: ["RVTools inventory", "Target sizing assumptions"],
      missing: ["Backup evidence", "Application dependency map", "Performance history"],
      sourceIndicator: "mixed",
      confidenceImplication: "Missing evidence reduces confidence for critical workloads.",
    },
    environmentSummary: {
      vmCount: 48,
      hostCount: 4,
      datastoreCount: 6,
      snapshotCount: 5,
      poweredOnVmCount: 39,
      poweredOffVmCount: 9,
      totalProvisionedGb: 12000,
      totalUsedGb: 8200,
    },
    migrationContext: {
      coverage: { overallPercent: 50, status: "partial", missingKeyContext: ["Dependency ownership"] },
      importantContext: ["Broadcom pressure exists."],
      missingContext: ["Application dependency evidence"],
      confidenceImpact: "Business context is partial.",
    },
    aiAdvisory: {
      providerStatus: "disabled",
      provider: "none",
      model: null,
      executiveSummaryNotes: [],
      technicalNotes: [],
      missingContextQuestions: [],
      limitations: [],
      confidenceImpact: "Not used in this unit test.",
    },
    executiveSummary: ["Synthetic preview for narrative model tests."],
    technicalSummary: ["Backup evidence missing lowers confidence."],
    missingEvidence: ["Backup evidence", "Application dependency evidence", "Performance history"],
    topFindings: [
      {
        severity: "high",
        category: "backup",
        source: "inventory",
        title: "Backup evidence is missing for critical workloads",
        description: "No restore evidence was provided for critical systems.",
        recommendation: "Validate restore points before approving Wave 1.",
        entityName: "ERP-01",
      },
    ],
    visibleFindings: [],
    vmMatrixPreview: {
      rows: [
        { vmName: "APP-01", riskLevel: "low", summary: "Low risk", recommendedAction: "Pilot" },
        { vmName: "ERP-01", riskLevel: "high", summary: "High risk", recommendedAction: "Hold" },
      ],
    },
    findingCounts: { critical: 0, high: 2, medium: 3, low: 5, info: 1 },
    reportCards: [],
    sections: [],
    lockedSections: [],
    upgradeRecommendations: ["Collect backup evidence.", "Validate dependencies."],
    upgradeButtons: [
      {
        triggerType: "review_call_clicked",
        title: "Technical Review",
        description: "Review blockers with a senior consultant.",
        ctaLabel: "Book Technical Review",
      },
    ],
  } as unknown as ReportPreviewData;
}

function makePlan(): MigrationRecommendationPlan {
  return {
    assessmentId: "plan-1",
    generatedAt: "2026-06-06T00:00:00.000Z",
    planLevel: "technical_plan",
    confidence: "medium",
    executiveDecision: "Pilot First",
    evidenceSummary: {
      assessmentId: "plan-1",
      assessmentTitle: "Northbridge Technical Plan",
      clientLabel: "Northbridge",
      workspaceName: "QA Workspace",
      evidenceCoverage: {
        baseInventory: true,
        vmwareEnrichment: true,
        proxmoxTarget: true,
        backupEvidence: false,
        storageSanEvidence: true,
        applicationDependencies: false,
        licensing: false,
        clientContext: true,
        aiAdvisory: false,
      },
      inventory: {
        vmCount: 126,
        hostCount: 6,
        datastoreCount: 12,
        snapshotCount: 4,
        parsed: true,
      },
      readiness: {
        infrastructure: "good",
        target: "conditional",
        backup: "missing",
        storage: "good",
        dependencies: "missing",
        businessContinuity: "partial",
        licensing: "not_included",
      },
      summaries: {
        vmwareEnrichment: null,
        proxmoxTarget: null,
        backupEvidence: null,
        storageSan: null,
        applicationDependencies: null,
      },
      blockers: ["Backup evidence is still missing."],
      remediationItems: ["Validate backup platform export.", "Validate application dependency mapping."],
      waveInputs: [
        { mode: "technical_only", label: "Wave 0 pilot set", explanation: "Low-risk pilot after backup validation." },
        { mode: "functional_candidate", label: "Wave 1 business systems", explanation: "Wait for dependency validation." },
      ],
      confidence: "medium",
    },
    gates: [
      {
        key: "backup_gate",
        status: "fail",
        severity: "high",
        evidenceSource: "backup",
        explanation: "No validated backup evidence is present.",
        recommendation: "Collect restore evidence before production waves.",
        blocksAdvancedPlan: true,
        blocksProductionWave: true,
      },
    ],
    sections: [
      {
        key: "go_no_go",
        title: "Go / No-Go",
        confidence: "medium",
        evidenceUsed: ["RVTools"],
        limitations: ["Backup evidence is missing."],
        recommendations: ["Pilot only."],
        actionItems: ["Collect backup evidence."],
      },
    ],
    aiNarrative: {
      used: false,
      providerStatus: "deterministic_fallback",
      executiveSummary: ["Pilot only until backup evidence is validated."],
      remediationNarrative: ["Validate backup platform export."],
      waveStrategyNarrative: ["Low-risk pilot first."],
      nextStepsNarrative: ["Collect restore evidence.", "Re-run the migration plan."],
    },
  };
}

describe("report narrative model", () => {
  it("builds a preview narrative model that keeps readiness and confidence separate", () => {
    const model = buildReportNarrativeModelFromPreview(makePreview(), {
      generatedAt: "2026-06-06T00:00:00.000Z",
    });

    expect(model.reportType).toBe("professional_assessment_report");
    expect(model.readinessScore).toBe(72);
    expect(model.confidenceScore).toBe(48);
    expect(model.decisionStatus).toBe("Pilot First");
    expect(model.evidenceCoverage.rvtools).toBe("complete");
    expect(model.evidenceCoverage.backup).not.toBe("complete");
    expect(model.missingEvidence.some((item) => item.area === "backup evidence")).toBe(true);
  });

  it("builds an executive command center with reusable summaries and chart data", () => {
    const model = buildReportNarrativeModelFromPreview(makePreview(), {
      generatedAt: "2026-06-06T00:00:00.000Z",
    });
    const commandCenter = buildReportExecutiveCommandCenter(model);

    expect(commandCenter.totalVmsAnalyzed).toBe(48);
    expect(commandCenter.decisionRecommendation).toBe("Pilot First");
    expect(commandCenter.summaryParagraph).toContain("Evidence status:");
    expect(commandCenter.radar).toHaveLength(8);
    expect(commandCenter.evidenceMatrix.length).toBeGreaterThan(0);
  });

  it("builds a migration plan narrative model without inventing VM-level certainty", () => {
    const model = buildReportNarrativeModelFromMigrationPlan(makePlan(), {
      generatedAt: "2026-06-06T00:00:00.000Z",
    });

    expect(model.reportType).toBe("professional_assessment_report");
    expect(model.decisionStatus).toBe("Pilot First");
    expect(model.evidenceCoverage.backup).toBe("missing");
    expect(model.holdItems[0]).toContain("backup");
    expect(model.vmRiskDistribution.totalAnalyzed).toBe(126);
  });
});
