import { describe, expect, it } from "vitest";
import { buildBlueprintDecisionSummaryForNarrative, buildBlueprintSectionPackForPlan } from "../../src/server/reports/reportBlueprintSections";
import type { MigrationRecommendationPlan } from "../../src/server/reports/migrationPlanTypes";
import type { ReportNarrativeModel } from "../../src/server/reports/reportNarrativeModel";

function makeNarrativeModel(): ReportNarrativeModel {
  return {
    reportType: "migration_blueprint_report",
    clientName: "Northbridge",
    assessmentName: "Northbridge Blueprint",
    generatedAt: "2026-06-06T00:00:00.000Z",
    readinessScore: 68,
    confidenceScore: 52,
    decisionStatus: "Pilot First",
    decisionNarrative:
      "Decision: Pilot First. Proceed only with a constrained pilot while backup evidence and target validation remain incomplete.",
    evidenceCoverage: {
      rvtools: "complete",
      questionnaire: "partial",
      backup: "missing",
      proxmoxTarget: "partial",
      network: "partial",
      cmdb: "missing",
      performance: "not_provided",
    },
    topRisks: [],
    missingEvidence: [
      {
        area: "backup evidence",
        status: "missing",
        impact: "Confidence remains limited until restore evidence exists.",
        recommendation: "Validate restore evidence before production waves.",
        narrative: "No validated backup evidence was provided.",
      },
    ],
    vmRiskDistribution: {
      critical: 1,
      high: 4,
      medium: 6,
      low: 12,
      info: 3,
      totalAnalyzed: 26,
    },
    migrationWaves: [],
    pilotCandidates: ["web-01"],
    holdItems: ["backup evidence"],
    requiredValidations: ["Validate restore evidence before production waves."],
    nextSteps: ["Confirm the target landing zone before broad sequencing."],
    assumptions: [],
    methodologyNotes: [],
  };
}

function makePlan(): MigrationRecommendationPlan {
  return {
    assessmentId: "plan-1",
    generatedAt: "2026-06-06T00:00:00.000Z",
    planLevel: "advanced_plan",
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
      remediationItems: [
        "Validate backup platform export.",
        "Validate application dependency mapping.",
        "Confirm target node and storage assumptions.",
      ],
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

describe("report blueprint sections", () => {
  it("builds a narrative blueprint summary without promising execution certainty", () => {
    const summary = buildBlueprintDecisionSummaryForNarrative(makeNarrativeModel());

    expect(summary.headline).toContain("planning");
    expect(summary.subtitle).toContain("validation gates");
    expect(summary.blocker).toContain("backup");
    expect(summary.nextAction).toContain("target");
  });

  it("builds blueprint section packs that keep missing evidence visible", () => {
    const pack = buildBlueprintSectionPackForPlan(makePlan());

    expect(pack.validationMatrix.length).toBeGreaterThanOrEqual(4);
    expect(pack.validationMatrix.some((row) => row.evidenceArea === "Backup restore readiness")).toBe(true);
    expect(pack.rollbackDecisionTree.some((node) => node.trigger.toLowerCase().includes("backup"))).toBe(true);
    expect(pack.clientActionPlan.some((item) => item.priority === "P0")).toBe(true);
  });
});
