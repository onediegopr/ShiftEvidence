import type { MigrationPlanEvidenceSummary, MigrationPlanGate } from "./migrationPlanTypes";

function gate(params: MigrationPlanGate): MigrationPlanGate {
  return params;
}

export function buildMigrationPlanGates(evidence: MigrationPlanEvidenceSummary): MigrationPlanGate[] {
  const gates: MigrationPlanGate[] = [];

  gates.push(gate({
    key: "base_inventory_gate",
    status: evidence.evidenceCoverage.baseInventory ? "pass" : "fail",
    severity: evidence.evidenceCoverage.baseInventory ? "info" : "critical",
    evidenceSource: "rvtools",
    explanation: evidence.evidenceCoverage.baseInventory
      ? "Base RVTools inventory is available."
      : "Base RVTools inventory is missing or not parsed.",
    recommendation: evidence.evidenceCoverage.baseInventory
      ? "Use parsed inventory as the base for all recommendations."
      : "Upload and parse RVTools evidence before generating a migration recommendation plan.",
    blocksAdvancedPlan: !evidence.evidenceCoverage.baseInventory,
    blocksProductionWave: !evidence.evidenceCoverage.baseInventory,
  }));

  gates.push(gate({
    key: "backup_evidence_gate",
    status: evidence.evidenceCoverage.backupEvidence
      ? evidence.readiness.backup.includes("insufficient")
        ? "fail"
        : evidence.readiness.backup.includes("requires_remediation")
          ? "warning"
          : "pass"
      : "insufficient_evidence",
    severity: evidence.evidenceCoverage.backupEvidence ? "high" : "critical",
    evidenceSource: "backup_evidence",
    explanation: evidence.evidenceCoverage.backupEvidence
      ? `Backup readiness is ${evidence.readiness.backup}.`
      : "Backup evidence is missing or incomplete.",
    recommendation: "Upload backup evidence and validate recent restore points before production migration.",
    blocksAdvancedPlan: !evidence.evidenceCoverage.backupEvidence || evidence.readiness.backup.includes("insufficient"),
    blocksProductionWave: !evidence.evidenceCoverage.backupEvidence || !evidence.readiness.backup.includes("validated"),
  }));

  gates.push(gate({
    key: "restore_testing_gate",
    status: "warning",
    severity: "high",
    evidenceSource: "backup_evidence",
    explanation: "Backup presence does not prove restore success. No dedicated restore-test proof is currently modeled as a pass condition.",
    recommendation: "Perform restore validation for representative critical workloads before production cutover.",
    blocksAdvancedPlan: false,
    blocksProductionWave: true,
  }));

  gates.push(gate({
    key: "target_validation_gate",
    status: evidence.evidenceCoverage.proxmoxTarget
      ? evidence.readiness.target.includes("insufficient")
        ? "fail"
        : evidence.readiness.target.includes("requires_remediation")
          ? "warning"
          : "pass"
      : "insufficient_evidence",
    severity: evidence.evidenceCoverage.proxmoxTarget ? "high" : "critical",
    evidenceSource: "proxmox_target",
    explanation: evidence.evidenceCoverage.proxmoxTarget
      ? `Proxmox target readiness is ${evidence.readiness.target}.`
      : "Proxmox target evidence is missing.",
    recommendation: "Validate Proxmox nodes, storage, networking, HA/PBS/Ceph signals and sizing before target claims.",
    blocksAdvancedPlan: !evidence.evidenceCoverage.proxmoxTarget || evidence.readiness.target.includes("insufficient"),
    blocksProductionWave: !evidence.evidenceCoverage.proxmoxTarget || evidence.readiness.target.includes("insufficient"),
  }));

  gates.push(gate({
    key: "storage_evidence_gate",
    status: evidence.evidenceCoverage.storageSanEvidence
      ? evidence.readiness.storage.includes("insufficient")
        ? "fail"
        : evidence.readiness.storage.includes("requires_remediation")
          ? "warning"
          : "pass"
      : "insufficient_evidence",
    severity: evidence.evidenceCoverage.storageSanEvidence ? "medium" : "high",
    evidenceSource: "storage_san",
    explanation: evidence.evidenceCoverage.storageSanEvidence
      ? `Storage/SAN readiness is ${evidence.readiness.storage}.`
      : "Storage/SAN evidence is missing; performance and capacity claims must remain conditional.",
    recommendation: "Provide storage capacity, datastore mapping and performance samples with sample windows.",
    blocksAdvancedPlan: !evidence.evidenceCoverage.storageSanEvidence || evidence.readiness.storage.includes("insufficient"),
    blocksProductionWave: evidence.readiness.storage.includes("insufficient"),
  }));

  gates.push(gate({
    key: "dependency_mapping_gate",
    status: evidence.evidenceCoverage.applicationDependencies
      ? evidence.readiness.dependencies.includes("insufficient")
        ? "fail"
        : evidence.readiness.dependencies.includes("requires_remediation")
          ? "warning"
          : "pass"
      : "insufficient_evidence",
    severity: evidence.evidenceCoverage.applicationDependencies ? "medium" : "high",
    evidenceSource: "application_dependency",
    explanation: evidence.evidenceCoverage.applicationDependencies
      ? `Dependency readiness is ${evidence.readiness.dependencies}.`
      : "Application Dependency Mapping is missing; wave planning must remain technical-only or preliminary.",
    recommendation: "Map applications, owners, dependencies and maintenance windows before functional wave planning.",
    blocksAdvancedPlan: !evidence.evidenceCoverage.applicationDependencies || evidence.readiness.dependencies.includes("insufficient"),
    blocksProductionWave: evidence.readiness.dependencies.includes("insufficient"),
  }));

  gates.push(gate({
    key: "wave_planning_gate",
    status: evidence.waveInputs[0]?.mode === "functional_validated"
      ? "pass"
      : evidence.waveInputs[0]?.mode === "functional_candidate"
        ? "warning"
        : "insufficient_evidence",
    severity: evidence.waveInputs[0]?.mode === "functional_validated" ? "medium" : "high",
    evidenceSource: "application_dependency",
    explanation: evidence.waveInputs[0]?.explanation ?? "Wave planning evidence is not available.",
    recommendation: evidence.waveInputs[0]?.mode === "technical_only"
      ? "Treat waves as technical-only candidates, not validated application waves."
      : "Review functional wave candidates with application owners before execution.",
    blocksAdvancedPlan: evidence.waveInputs[0]?.mode === "technical_only",
    blocksProductionWave: evidence.waveInputs[0]?.mode !== "functional_validated",
  }));

  gates.push(gate({
    key: "business_continuity_gate",
    status: evidence.evidenceCoverage.backupEvidence ? "warning" : "insufficient_evidence",
    severity: "high",
    evidenceSource: "backup_evidence",
    explanation: "Business continuity depends on backup coverage, restore testing, rollback plans and maintenance windows.",
    recommendation: "Define rollback criteria, restore validation and communications for each pilot and production wave.",
    blocksAdvancedPlan: !evidence.evidenceCoverage.backupEvidence,
    blocksProductionWave: true,
  }));

  gates.push(gate({
    key: "licensing_cost_gate",
    status: evidence.evidenceCoverage.licensing ? "pass" : "warning",
    severity: evidence.evidenceCoverage.licensing ? "low" : "medium",
    evidenceSource: "licensing_cost_exposure",
    explanation: evidence.evidenceCoverage.licensing
      ? "Licensing/cost evidence is available."
      : "Licensing/cost evidence is missing or incomplete.",
    recommendation: "Confirm licensing and subscription impacts before final migration approval.",
    blocksAdvancedPlan: false,
    blocksProductionWave: false,
  }));

  return gates;
}
