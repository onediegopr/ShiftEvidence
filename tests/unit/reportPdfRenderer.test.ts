import { describe, expect, it } from "vitest";
import type { AssessmentCompletionModule, AssessmentCompletionSummary } from "../../src/server/assessments/assessmentCompletionService";
import { buildAssessmentCoverageSection } from "../../src/server/reports/reportCoverageSection";
import { buildLicensingCostExposureReportSection } from "../../src/server/reports/reportLicensingCostExposureSection";
import { renderPdfReportBuffer } from "../../src/server/reports/reportPdfRenderer";
import type { ReportPreviewData } from "../../src/server/reports/reportPreviewService";

function coverageModule(
  overrides: Partial<AssessmentCompletionModule> & Pick<AssessmentCompletionModule, "key" | "label" | "required" | "status" | "weight">,
): AssessmentCompletionModule {
  return {
    description: `${overrides.label} description`,
    confidenceContribution: overrides.status === "complete" ? overrides.weight : 0,
    completionContribution: overrides.status === "complete" ? overrides.weight : 0,
    impactIfMissing: `${overrides.label} impact if missing.`,
    ...overrides,
  };
}

function makeCoverageSummary(): AssessmentCompletionSummary {
  const modules: AssessmentCompletionModule[] = [
    coverageModule({
      key: "rvtools_inventory",
      label: "RVTools Inventory",
      required: true,
      status: "complete",
      weight: 35,
    }),
    coverageModule({
      key: "infrastructure_risk",
      label: "Infrastructure Risk Analysis",
      required: true,
      status: "complete",
      weight: 15,
    }),
    coverageModule({
      key: "migration_questions",
      label: "Migration Questions",
      required: false,
      status: "partial",
      weight: 10,
      limitationText: "Migration questions are partial; executive recommendations may lack business context.",
    }),
    coverageModule({
      key: "storage_analysis",
      label: "Storage Analysis",
      required: false,
      status: "skipped",
      weight: 15,
      limitationText:
        "Storage context was skipped; recommendations may be estimated from datastore evidence and should be reviewed before architecture decisions.",
    }),
    coverageModule({
      key: "licensing_cost_exposure",
      label: "Licensing & Cost Exposure",
      required: false,
      status: "complete",
      weight: 15,
    }),
    coverageModule({
      key: "manual_assumptions",
      label: "Manual Assumptions",
      required: false,
      status: "not_started",
      weight: 5,
    }),
    coverageModule({
      key: "ai_advisory",
      label: "AI Advisory",
      required: false,
      status: "not_started",
      weight: 3,
    }),
    coverageModule({
      key: "report_generation",
      label: "Report Generation",
      required: true,
      status: "complete",
      weight: 2,
    }),
  ];

  return {
    completionPercent: 87,
    reportConfidencePercent: 72,
    requiredComplete: true,
    canGenerateReport: true,
    modules,
    missingRequired: [],
    missingRecommended: modules.filter((item) => !item.required && item.status !== "complete"),
    limitations: modules.flatMap((item) => (item.limitationText ? [item.limitationText] : [])),
    primaryCta: "improve_report",
  };
}

function makeReportPreview(): ReportPreviewData {
  return {
    assessmentId: "acc-pdf-fix-1-synthetic",
    assessmentTitle: "ACC PDF Fix Synthetic Smoke",
    workspaceName: "Local QA",
    clientLabel: null,
    planLabel: "Readiness Report",
    planRank: 2,
    reportPreviewStatus: "available",
    fullReportStatus: "unlocked",
    pdfStatus: "Available",
    commercialStatus: { status: "unlocked", label: "Unlocked" },
    completionScore: 87,
    completionStatus: "Ready",
    assessmentCoverage: buildAssessmentCoverageSection(makeCoverageSummary()),
    evidenceConfidence: "high",
    evidenceConfidenceLabel: "High",
    sourceLabel: "Parsed RVTools + optional context",
    costRiskPreview: {
      riskLevel: "medium",
      annualSubscriptionDelta: -12000,
      threeYearSubscriptionDelta: -36000,
      savingsPercent: 28,
      recommendations: ["Validate target storage architecture.", "Confirm USD renewal exposure."],
    },
    costRiskStatus: "Available",
    licensingCostExposure: buildLicensingCostExposureReportSection(null),
    readinessScore: 78,
    confidenceScore: 72,
    recommendedDecision: "Proceed with pilot",
    evidenceOverview: {
      received: ["RVTools inventory", "Licensing context"],
      missing: ["Full storage context", "Complete migration questions"],
      sourceIndicator: "mixed",
      confidenceImplication: "Optional context improves precision but does not block report generation.",
    },
    environmentSummary: {
      vmCount: 42,
      hostCount: 4,
      datastoreCount: 6,
      snapshotCount: 3,
      poweredOnVmCount: 36,
      poweredOffVmCount: 6,
      totalProvisionedGb: 12000,
      totalUsedGb: 7400,
    },
    migrationContext: {
      coverage: { overallPercent: 55, status: "partial", missingKeyContext: ["Storage preference"] },
      importantContext: ["Target platform under evaluation.", "Cost exposure should be modeled in USD."],
      missingContext: ["Storage preference is not confirmed."],
      confidenceImpact: "Partial context limits executive precision.",
    },
    aiAdvisory: {
      providerStatus: "disabled",
      provider: "none",
      model: null,
      executiveSummaryNotes: [],
      technicalNotes: [],
      missingContextQuestions: [],
      limitations: [],
      confidenceImpact: "AI advisory was not used for this synthetic smoke test.",
    },
    executiveSummary: ["Synthetic smoke report for ACC PDF layout QA."],
    technicalSummary: ["PDF renderer should include coverage section without runtime failures."],
    missingEvidence: ["Complete storage context."],
    topFindings: [],
    visibleFindings: [],
    vmMatrixPreview: { rows: [] },
    findingCounts: { critical: 0, high: 1, medium: 2, low: 3, info: 0 },
    reportCards: [],
    sections: [],
    lockedSections: [],
    upgradeRecommendations: [],
    upgradeButtons: [],
  } as unknown as ReportPreviewData;
}

describe("PDF report renderer", () => {
  it("renders the assessment coverage section smoke PDF with long limitations", async () => {
    const buffer = await renderPdfReportBuffer({
      assessmentTitle: "ACC PDF Fix Synthetic Smoke",
      clientLabel: null,
      workspaceName: "Local QA",
      reportTypeLabel: "Readiness Report",
      generatedAt: new Date("2026-05-29T00:00:00Z"),
      generatedByLabel: "ACC PDF fix local smoke",
      reportPreview: makeReportPreview(),
    });

    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(20_000);
  });

  it("renders a full licensing cost exposure section without throwing", async () => {
    const preview = makeReportPreview();
    preview.licensingCostExposure = {
      included: true,
      status: "completed",
      mode: "actual_costs",
      currency: "USD",
      financialConfidenceScore: 82,
      financialConfidenceLabel: "High",
      savingsQuality: "high",
      pricingFreshnessStatus: "fresh",
      executiveRecommendation: {
        title: "Proceed to financial review",
        description: "Evidence is strong enough for procurement validation.",
      },
      vmwareScenario: {
        label: "VMware/Broadcom customer renewal",
        source: "customer_provided",
        confidence: "high",
        annualUsd: 100000,
        threeYearUsd: 300000,
        fiveYearUsd: 500000,
        assumptions: ["Customer-provided VMware/Broadcom renewal quote was used."],
        warnings: [],
      },
      proxmoxScenario: {
        label: "Proxmox supported subscription",
        source: "approved_pricing_snapshot",
        confidence: "medium",
        annualUsd: 28000,
        threeYearUsd: 84000,
        fiveYearUsd: 140000,
        assumptions: ["Approved Proxmox snapshot was used."],
        warnings: ["Validate support tier with reseller."],
      },
      comparison: {
        annualDeltaUsd: 72000,
        threeYearDeltaUsd: 216000,
        fiveYearDeltaUsd: 360000,
        grossSavingsPercent: 72,
        paybackMonths: 9,
        notes: ["Migration investment is included."],
      },
      costOfStaying: {
        summary: "Cost of staying uses the selected VMware/Broadcom annual scenario.",
        annualUsd: 100000,
        threeYearUsd: 300000,
        fiveYearUsd: 500000,
        opportunityLossThreeYearUsd: 216000,
        risks: ["Delay can compress renewal negotiation windows."],
      },
      contractTimingRisk: {
        label: "High",
        severity: "high",
        daysToRenewal: 120,
        recommendation: "Validate renewal quote and supported Proxmox scenario immediately.",
      },
      licensingTraps: Array.from({ length: 8 }, (_, index) => ({
        severity: index % 2 === 0 ? "high" : "medium",
        title: `Potential exposure ${index + 1}`,
        description: "Long licensing trap text should wrap safely without clipping in the PDF renderer.",
        recommendation: "Validate the assumption before executive presentation.",
      })),
      missingEvidence: Array.from({ length: 9 }, (_, index) => ({
        label: `Missing evidence ${index + 1}`,
        impact: "Financial confidence may be limited.",
        recommendation: "Collect this evidence before final financial review.",
      })),
      assumptions: [
        "All values are modeled in USD.",
        "Approved snapshots only.",
        "No third-party licensing is included.",
        "Storage cost modeling is still in development and is not included.",
      ],
      pricingSnapshotUsed: [
        {
          vendor: "vmware",
          snapshotId: "snap-vmware",
          sourceName: "Manual VMware QA snapshot",
          lastCheckedAt: "2026-05-20T00:00:00.000Z",
          status: "approved",
          notes: "Items: 1",
        },
        {
          vendor: "proxmox",
          snapshotId: "snap-proxmox",
          sourceName: "Manual Proxmox QA snapshot",
          lastCheckedAt: "2026-05-20T00:00:00.000Z",
          status: "approved",
          notes: "Items: 1",
        },
      ],
      disclaimers: [
        "This is not a vendor quote.",
        "Taxes, local fees, reseller discounts and third-party software licensing are not included unless explicitly provided.",
        "Storage cost modeling is still in development and is not included in this analysis.",
      ],
      warnings: [],
    };

    const buffer = await renderPdfReportBuffer({
      assessmentTitle: "COST-1C PDF Synthetic Smoke",
      clientLabel: null,
      workspaceName: "Local QA",
      reportTypeLabel: "Readiness Report",
      generatedAt: new Date("2026-05-29T00:00:00Z"),
      generatedByLabel: "COST-1C local smoke",
      reportPreview: preview,
    });

    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(24_000);
  });
});
