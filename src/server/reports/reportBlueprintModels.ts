import type { MigrationRecommendationPlan } from "./migrationPlanTypes";

export type BlueprintDecisionSummary = {
  headline: string;
  subtitle: string;
  decisionNote: string;
  blocker: string;
  nextAction: string;
  recommendation: string;
};

export type BlueprintTargetBlueprint = {
  recommendedNodes: string;
  storageLanding: string;
  haAssumption: string;
  pbsBackupStance: string;
  networkReadinessStatus: string;
  caveat: string;
};

export type BlueprintValidationMatrixRow = {
  evidenceArea: string;
  requiredValidation: string;
  currentStatus: string;
  ownerAction: string;
  gateImpact: string;
  tone: "info" | "warning" | "critical" | "good";
};

export type BlueprintRunbookTimelineStep = {
  phase: string;
  focus: string;
  ownerAction: string;
  gate: string;
  tone: "info" | "warning" | "critical" | "good";
};

export type BlueprintRollbackDecisionNode = {
  trigger: string;
  mode: string;
  evidenceThreshold: string;
  decisionOwner: string;
  nextAction: string;
  tone: "info" | "warning" | "critical" | "good";
};

export type BlueprintClientActionPlanItem = {
  action: string;
  priority: "P0" | "P1" | "P2";
  owner: string;
  evidenceRequired: string;
  beforeWave: string;
  tone: "info" | "warning" | "critical" | "good";
};

export type BlueprintSectionPack = {
  summary: BlueprintDecisionSummary;
  target: BlueprintTargetBlueprint;
  validationMatrix: BlueprintValidationMatrixRow[];
  runbookTimeline: BlueprintRunbookTimelineStep[];
  rollbackDecisionTree: BlueprintRollbackDecisionNode[];
  clientActionPlan: BlueprintClientActionPlanItem[];
};

function priorityFromTone(tone: BlueprintValidationMatrixRow["tone"]): BlueprintClientActionPlanItem["priority"] {
  if (tone === "critical") return "P0";
  if (tone === "warning") return "P1";
  return "P2";
}

function statusTone(value: boolean | string, fallback: BlueprintValidationMatrixRow["tone"] = "warning") {
  if (typeof value === "boolean") {
    return value ? "good" : fallback;
  }

  const normalized = value.toLowerCase();
  if (normalized.includes("complete") || normalized.includes("ready") || normalized.includes("pass")) {
    return "good";
  }
  if (normalized.includes("conditional") || normalized.includes("partial")) {
    return "warning";
  }
  if (normalized.includes("missing") || normalized.includes("hold") || normalized.includes("fail")) {
    return "critical";
  }
  return fallback;
}

function buildStatusLabel(value: boolean, presentLabel: string, missingLabel: string) {
  return value ? presentLabel : missingLabel;
}

function buildEvidenceStatusLabel(value: boolean, presentLabel: string, missingLabel: string) {
  return buildStatusLabel(value, presentLabel, missingLabel);
}

function buildTargetNodesLabel(plan: MigrationRecommendationPlan) {
  const hostCount = plan.evidenceSummary.inventory.hostCount;
  if (hostCount >= 6) {
    return "4-node HA target with failure-domain headroom";
  }
  if (hostCount >= 4) {
    return "3-node HA target with scoped expansion room";
  }
  return "3-node minimum with strict failure-domain discipline";
}

function buildOwnerAction(fallback: string, fallbackIndex: number, plan: MigrationRecommendationPlan) {
  return plan.evidenceSummary.remediationItems[fallbackIndex] ?? fallback;
}

function buildBeforeWaveLabel(index: number, critical = false) {
  if (critical) {
    return "Before critical waves";
  }

  if (index === 0) return "Before Wave 0";
  if (index === 1) return "Before Wave 1";
  if (index === 2) return "Before Wave 2";
  return "Before final approval";
}

export function buildBlueprintDecisionSummary(plan: MigrationRecommendationPlan): BlueprintDecisionSummary {
  const blocker = plan.evidenceSummary.blockers[0] ?? plan.gates.find((gate) => gate.blocksProductionWave)?.explanation ?? "Evidence gaps remain unresolved.";
  const nextAction = plan.evidenceSummary.remediationItems[0] ?? plan.aiNarrative.nextStepsNarrative[0] ?? "Close the open validation gates before critical waves.";

  return {
    headline: "This is a planning and execution-qualification package.",
    subtitle: "Execution readiness depends on closing validation gates.",
    decisionNote: "Missing evidence limits confidence and must be resolved before critical waves.",
    blocker,
    nextAction,
    recommendation: plan.executiveDecision,
  };
}

export function buildBlueprintTargetBlueprint(plan: MigrationRecommendationPlan): BlueprintTargetBlueprint {
  const coverage = plan.evidenceSummary.evidenceCoverage;
  const targetReady = coverage.proxmoxTarget;
  const backupReady = coverage.backupEvidence;
  const dependencyReady = coverage.applicationDependencies;
  const storageReady = coverage.storageSanEvidence;
  const networkReady = coverage.clientContext || coverage.vmwareEnrichment;

  return {
    recommendedNodes: buildTargetNodesLabel(plan),
    storageLanding: storageReady
      ? "Target storage can be validated as part of the architecture decision."
      : "Storage landing remains provisional until target evidence closes.",
    haAssumption: targetReady && backupReady
      ? "HA is a planning assumption, not a guarantee, until pilot and restore gates close."
      : "HA remains conditional because destination and restore evidence are incomplete.",
    pbsBackupStance: backupReady
      ? "Backup evidence supports pilot qualification, but restore drills still need owner sign-off."
      : "PBS and backup stance remain unproven; restore evidence is still required.",
    networkReadinessStatus: networkReady && dependencyReady
      ? "Network readiness is directional, but application coupling still needs validation."
      : "Network readiness is incomplete and remains tied to dependency mapping.",
    caveat: targetReady
      ? "Target evidence is partial; treat this as a planning diagram, not a cutover certificate."
      : "Target evidence is missing; do not treat this diagram as execution-ready.",
  };
}

export function buildBlueprintValidationMatrix(plan: MigrationRecommendationPlan): BlueprintValidationMatrixRow[] {
  const coverage = plan.evidenceSummary.evidenceCoverage;
  const readiness = plan.evidenceSummary.readiness;

  const rows: BlueprintValidationMatrixRow[] = [
    {
      evidenceArea: "Proxmox target architecture",
      requiredValidation: "Confirm nodes, storage landing and HA assumptions.",
      currentStatus: buildStatusLabel(coverage.proxmoxTarget, "Conditional", "Missing"),
      ownerAction: buildOwnerAction("Confirm the target platform before wave approval.", 0, plan),
      gateImpact: coverage.proxmoxTarget ? "Limits confidence until pilot proof exists." : "Blocks production wave planning.",
      tone: statusTone(coverage.proxmoxTarget),
    },
    {
      evidenceArea: "Backup restore readiness",
      requiredValidation: "Validate restore points, retention and job status.",
      currentStatus: buildStatusLabel(coverage.backupEvidence, "Complete", "Missing"),
      ownerAction: buildOwnerAction("Validate restore evidence before critical workloads move.", 1, plan),
      gateImpact: coverage.backupEvidence ? "Supports pilot qualification." : "Blocks critical waves.",
      tone: statusTone(coverage.backupEvidence, "critical"),
    },
    {
      evidenceArea: "Network and VLAN mapping",
      requiredValidation: "Validate bridges, VLANs and firewall paths.",
      currentStatus: buildEvidenceStatusLabel(coverage.clientContext || coverage.vmwareEnrichment, "Partial", "Missing"),
      ownerAction: buildOwnerAction("Confirm network landing before scheduling production waves.", 2, plan),
      gateImpact: "Impacts pilot scope and wave ordering.",
      tone: statusTone(coverage.clientContext || coverage.vmwareEnrichment),
    },
    {
      evidenceArea: "Application dependencies",
      requiredValidation: "Confirm application owners and dependency groups.",
      currentStatus: buildStatusLabel(coverage.applicationDependencies, "Complete", "Missing"),
      ownerAction: buildOwnerAction("Map application ownership before sequencing shared workloads.", 3, plan),
      gateImpact: readiness.dependencies.includes("missing") ? "Can reorder critical waves." : "Protects sequencing confidence.",
      tone: statusTone(coverage.applicationDependencies, "critical"),
    },
    {
      evidenceArea: "Performance history",
      requiredValidation: "Collect representative CPU, memory and I/O baselines.",
      currentStatus: readiness.storage === "good" || readiness.businessContinuity === "good" ? "Partial" : "Missing",
      ownerAction: buildOwnerAction("Collect capacity history before final architecture approval.", 4, plan),
      gateImpact: "Improves sizing and rollback confidence.",
      tone: statusTone(readiness.storage),
    },
    {
      evidenceArea: "Pilot governance",
      requiredValidation: "Define success criteria, rollback criteria and owner sign-off.",
      currentStatus: plan.planLevel === "advanced_plan" ? "Ready" : "Conditional",
      ownerAction: buildOwnerAction("Lock the pilot exit criteria before Wave 0.", 0, plan),
      gateImpact: "Required before any critical wave.",
      tone: plan.planLevel === "advanced_plan" ? "good" : "warning",
    },
  ];

  return rows;
}

export function buildBlueprintRunbookTimeline(plan: MigrationRecommendationPlan): BlueprintRunbookTimelineStep[] {
  const coverage = plan.evidenceSummary.evidenceCoverage;
  const criticalTone = coverage.backupEvidence && coverage.proxmoxTarget ? "good" : "warning";

  return [
    {
      phase: "Pre-flight",
      focus: "Close target, backup and dependency gates before the first pilot.",
      ownerAction: "Validate the open evidence requests and freeze the pilot entry criteria.",
      gate: coverage.backupEvidence && coverage.proxmoxTarget ? "Ready to sequence" : "Still gated by evidence gaps",
      tone: coverage.backupEvidence && coverage.proxmoxTarget ? "good" : "critical",
    },
    {
      phase: "Pilot",
      focus: "Run a constrained pilot on the lowest-risk candidates.",
      ownerAction: "Use the pilot to prove import, restore and rollback mechanics.",
      gate: coverage.backupEvidence ? "Proceed only after backup proof" : "Hold until restore evidence exists",
      tone: coverage.backupEvidence ? "warning" : "critical",
    },
    {
      phase: "Wave 1",
      focus: "Migrate low-complexity workloads with validated ownership.",
      ownerAction: "Confirm owner sign-off and dependency mapping for the selected workloads.",
      gate: coverage.applicationDependencies ? "Wave 1 can be qualified" : "Wave 1 remains conditional",
      tone: coverage.applicationDependencies ? "warning" : "critical",
    },
    {
      phase: "Wave 2",
      focus: "Expand to standard production once pilot gates stay stable.",
      ownerAction: "Re-check storage fit and network landing before expanding the wave set.",
      gate: coverage.storageSanEvidence ? "Conditional expansion" : "Storage still blocks confidence",
      tone: coverage.storageSanEvidence ? "info" : "warning",
    },
    {
      phase: "Critical wave",
      focus: "Gate identity, ERP and other business-critical workloads behind owner review.",
      ownerAction: "Require explicit approval and rollback proof before scheduling cutover.",
      gate: criticalTone === "good" ? "Still requires owner approval" : "Hold until all gates close",
      tone: criticalTone,
    },
    {
      phase: "Hypercare",
      focus: "Monitor post-cutover behavior and exception handling.",
      ownerAction: "Assign an owner to capture incidents, backout criteria and cleanup actions.",
      gate: "Only after successful pilot and wave completion.",
      tone: "good",
    },
    {
      phase: "Rollback checkpoints",
      focus: "Confirm rollback criteria at each wave boundary.",
      ownerAction: "Keep restore evidence and rollback owners visible at every decision point.",
      gate: "Required at pilot, wave and critical stages.",
      tone: "warning",
    },
  ];
}

export function buildBlueprintRollbackDecisionTree(plan: MigrationRecommendationPlan): BlueprintRollbackDecisionNode[] {
  const coverage = plan.evidenceSummary.evidenceCoverage;

  return [
    {
      trigger: "Pilot restore fails or backup evidence is absent.",
      mode: "Mode A - Pilot rollback",
      evidenceThreshold: "Restore proof, backup retention and owner approval.",
      decisionOwner: "Infrastructure owner",
      nextAction: coverage.backupEvidence
        ? "Stop the pilot, restore the workload and re-run the matrix."
        : "Hold the pilot until restore evidence is supplied.",
      tone: coverage.backupEvidence ? "warning" : "critical",
    },
    {
      trigger: "Production wave exposes dependency or application-owner concerns.",
      mode: "Mode B - Production rollback",
      evidenceThreshold: "Dependency map, business owner sign-off and rollback window.",
      decisionOwner: "Migration lead",
      nextAction: coverage.applicationDependencies
        ? "Pause the wave and return to the last validated state if needed."
        : "Do not schedule the wave until owners sign off.",
      tone: coverage.applicationDependencies ? "warning" : "critical",
    },
    {
      trigger: "Target fit or storage landing diverges from the approved plan.",
      mode: "Mode A / Mode B",
      evidenceThreshold: "Target evidence, storage evidence and capacity baseline.",
      decisionOwner: "Platform owner",
      nextAction: coverage.proxmoxTarget && coverage.storageSanEvidence
        ? "Revalidate architecture before restarting sequencing."
        : "Rework the target model before any cutover date is set.",
      tone: coverage.proxmoxTarget && coverage.storageSanEvidence ? "info" : "warning",
    },
  ];
}

export function buildBlueprintClientActionPlan(plan: MigrationRecommendationPlan): BlueprintClientActionPlanItem[] {
  const gates = plan.gates.filter((gate) => gate.blocksProductionWave || gate.status !== "pass");
  const sourceItems = [...plan.evidenceSummary.remediationItems, ...gates.map((gate) => gate.recommendation)];
  const uniqueItems = [...new Set(sourceItems.map((item) => item.trim()).filter(Boolean))];

  const fallbackItems: BlueprintClientActionPlanItem[] = [
    {
      action: "Validate backup restore readiness for representative workloads.",
      priority: "P0",
      owner: "Backup owner",
      evidenceRequired: "Backup jobs, restore points and retention proof.",
      beforeWave: "Before Wave 0",
      tone: "critical",
    },
    {
      action: "Confirm the Proxmox target architecture and network landing.",
      priority: "P0",
      owner: "Platform owner",
      evidenceRequired: "Node count, storage landing, HA assumptions and VLAN mapping.",
      beforeWave: "Before Wave 1",
      tone: "critical",
    },
    {
      action: "Map application owners and dependency groups.",
      priority: "P0",
      owner: "Application owners",
      evidenceRequired: "Dependency map and business criticality confirmation.",
      beforeWave: "Before Wave 1",
      tone: "critical",
    },
    {
      action: "Collect performance history for capacity validation.",
      priority: "P1",
      owner: "Operations",
      evidenceRequired: "CPU, memory, storage and throughput history.",
      beforeWave: "Before Wave 2",
      tone: "warning",
    },
    {
      action: "Lock pilot success criteria and rollback triggers.",
      priority: "P1",
      owner: "Migration lead",
      evidenceRequired: "Pilot acceptance criteria and rollback decision tree.",
      beforeWave: "Before Wave 0",
      tone: "warning",
    },
  ];

  if (uniqueItems.length === 0) {
    return fallbackItems;
  }

  return uniqueItems.slice(0, 5).map((action, index) => {
    const tone: BlueprintClientActionPlanItem["tone"] = index === 0 ? "critical" : index < 3 ? "warning" : "info";
    const priority = priorityFromTone(tone);
    return {
      action,
      priority,
      owner: index === 0 ? "Infrastructure owner" : index === 1 ? "Platform owner" : index === 2 ? "Application owners" : "Operations",
      evidenceRequired:
        index === 0
          ? "Backup restore proof and retention coverage."
          : index === 1
            ? "Target nodes, storage landing and HA assumptions."
            : index === 2
              ? "Dependency map and business sign-off."
              : "Performance history and runbook details.",
      beforeWave: buildBeforeWaveLabel(index, index === 0 || index === 1),
      tone,
    };
  });
}

export function buildBlueprintSectionPack(plan: MigrationRecommendationPlan): BlueprintSectionPack {
  return {
    summary: buildBlueprintDecisionSummary(plan),
    target: buildBlueprintTargetBlueprint(plan),
    validationMatrix: buildBlueprintValidationMatrix(plan),
    runbookTimeline: buildBlueprintRunbookTimeline(plan),
    rollbackDecisionTree: buildBlueprintRollbackDecisionTree(plan),
    clientActionPlan: buildBlueprintClientActionPlan(plan),
  };
}

export function buildBlueprintDecisionSummaryFromNarrative({
  decisionRecommendation,
  blocker,
  nextAction,
  decisionNarrative,
}: {
  decisionRecommendation: string;
  blocker: string;
  nextAction: string;
  decisionNarrative: string;
}): BlueprintDecisionSummary {
  return {
    headline: "This is a planning and execution-qualification package.",
    subtitle: "Execution readiness depends on closing validation gates.",
    decisionNote: "Missing evidence limits confidence and must be resolved before critical waves.",
    blocker,
    nextAction,
    recommendation: decisionNarrative || decisionRecommendation,
  };
}
