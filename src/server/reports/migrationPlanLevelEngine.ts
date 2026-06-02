import type { MigrationPlanEvidenceSummary, MigrationPlanGate, MigrationPlanLevel } from "./migrationPlanTypes";

export function decideMigrationPlanLevel(
  evidence: MigrationPlanEvidenceSummary,
  gates: MigrationPlanGate[],
): MigrationPlanLevel {
  if (!evidence.evidenceCoverage.baseInventory) {
    return "plan_not_available";
  }

  const advancedBlocked = gates.some((gate) => gate.blocksAdvancedPlan && gate.status !== "pass");
  const criticalFail = gates.some((gate) => gate.status === "fail" && gate.severity === "critical");
  const technicalEvidence =
    evidence.evidenceCoverage.proxmoxTarget ||
    evidence.evidenceCoverage.storageSanEvidence ||
    evidence.evidenceCoverage.backupEvidence ||
    evidence.evidenceCoverage.vmwareEnrichment;

  if (
    !advancedBlocked &&
    !criticalFail &&
    evidence.evidenceCoverage.backupEvidence &&
    evidence.evidenceCoverage.proxmoxTarget &&
    evidence.evidenceCoverage.storageSanEvidence &&
    evidence.evidenceCoverage.applicationDependencies &&
    evidence.waveInputs[0]?.mode !== "technical_only"
  ) {
    return "advanced_plan";
  }

  if (technicalEvidence && evidence.evidenceCoverage.backupEvidence && evidence.evidenceCoverage.proxmoxTarget) {
    return "technical_plan";
  }

  return "preliminary_plan";
}
