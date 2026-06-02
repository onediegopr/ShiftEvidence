import { EvidenceModuleKey, EvidenceParseResultStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type { AssessmentDetail } from "../../src/server/assessments/assessmentService";
import { buildMigrationPlanEvidenceSummary } from "../../src/server/reports/migrationPlanEvidenceAggregator";
import { buildMigrationPlanGates } from "../../src/server/reports/migrationPlanGatesEngine";
import { decideMigrationPlanLevel } from "../../src/server/reports/migrationPlanLevelEngine";
import { renderMigrationPlanPdfBuffer } from "../../src/server/reports/migrationPlanPdfRenderer";
import { buildMigrationRecommendationPlanForAssessment } from "../../src/server/reports/migrationPlanService";

function parsedModule(moduleKey: EvidenceModuleKey, summaryJson: Record<string, unknown>) {
  return {
    moduleKey,
    lastParseResult: {
      status: EvidenceParseResultStatus.parsed,
      summaryJson,
    },
  };
}

function assessmentMock(overrides: Partial<AssessmentDetail> = {}) {
  return {
    id: "assessment-1",
    title: "Northbridge Migration",
    clientLabel: "Northbridge Industrial Group",
    workspace: {
      name: "QA Workspace",
    },
    parsedInventorySummaries: [],
    parsedSnapshots: [],
    evidenceModules: [],
    licensingAnalysis: null,
    additionalEvidence: [],
    storageContext: null,
    storageAnalysis: null,
    ...overrides,
  } as unknown as AssessmentDetail;
}

function inventory() {
  return {
    vmCount: 126,
    hostCount: 6,
    datastoreCount: 12,
  };
}

const strongModules = [
  parsedModule(EvidenceModuleKey.proxmox_target, {
    proxmoxTargetSummary: { nodeCount: 3, onlineNodeCount: 3 },
    readiness: { targetStatus: "target_ready", confidence: "high" },
  }),
  parsedModule(EvidenceModuleKey.backup_evidence, {
    backupEvidenceSummary: { jobCount: 10, protectedObjectCount: 126 },
    readiness: { backupReadinessStatus: "backup_validated", confidence: "high" },
  }),
  parsedModule(EvidenceModuleKey.storage_san, {
    storageSanSummary: { arrayCount: 2, datastoreMappingCount: 12 },
    readiness: { storageReadinessStatus: "storage_ready", confidence: "high" },
  }),
  parsedModule(EvidenceModuleKey.application_dependency, {
    applicationDependencySummary: { applicationCount: 8, dependencyCount: 21, migrationGroupCount: 3 },
    readiness: {
      dependencyReadinessStatus: "dependency_ready",
      confidence: "high",
      wavePlanningMode: "functional_validated",
    },
  }),
  parsedModule(EvidenceModuleKey.vmware_enrichment, {
    vmwareEnrichmentSummary: { matchedVmCount: 126, oldSnapshotCount: 0 },
    readiness: { confidence: "high" },
  }),
];

describe("Migration Recommendation Plan", () => {
  it("does not offer a plan without parsed RVTools inventory", () => {
    const evidence = buildMigrationPlanEvidenceSummary(assessmentMock());
    const gates = buildMigrationPlanGates(evidence);

    expect(decideMigrationPlanLevel(evidence, gates)).toBe("plan_not_available");
    expect(gates.find((gate) => gate.key === "base_inventory_gate")?.status).toBe("fail");
  });

  it("builds a technical plan when backup and target evidence exist", () => {
    const assessment = assessmentMock({
      parsedInventorySummaries: [inventory()],
      evidenceModules: strongModules.filter((module) =>
        [EvidenceModuleKey.proxmox_target, EvidenceModuleKey.backup_evidence].includes(module.moduleKey),
      ),
    });

    const evidence = buildMigrationPlanEvidenceSummary(assessment);
    const gates = buildMigrationPlanGates(evidence);

    expect(decideMigrationPlanLevel(evidence, gates)).toBe("technical_plan");
    expect(evidence.evidenceCoverage.storageSanEvidence).toBe(false);
    expect(gates.find((gate) => gate.key === "dependency_mapping_gate")?.status).toBe("insufficient_evidence");
  });

  it("builds an advanced plan only when advanced evidence and functional waves are present", () => {
    const assessment = assessmentMock({
      parsedInventorySummaries: [inventory()],
      parsedSnapshots: [{ id: "snapshot-1" }],
      evidenceModules: strongModules,
      licensingAnalysis: { id: "licensing-1" },
      additionalEvidence: [{ id: "additional-1" }],
    });

    const plan = buildMigrationRecommendationPlanForAssessment(assessment);

    expect(plan.planLevel).toBe("advanced_plan");
    expect(plan.evidenceSummary.evidenceCoverage.applicationDependencies).toBe(true);
    expect(plan.gates.find((gate) => gate.key === "wave_planning_gate")?.status).toBe("pass");
    expect(plan.aiNarrative.providerStatus).toBe("deterministic_fallback");
  });

  it("renders the standalone migration plan PDF", async () => {
    const plan = buildMigrationRecommendationPlanForAssessment(assessmentMock({
      parsedInventorySummaries: [inventory()],
      evidenceModules: strongModules,
    }));

    const buffer = await renderMigrationPlanPdfBuffer(plan);

    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(1000);
  });
});
