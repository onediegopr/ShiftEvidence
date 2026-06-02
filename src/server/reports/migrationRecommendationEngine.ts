import type {
  MigrationPlanEvidenceSummary,
  MigrationPlanGate,
  MigrationPlanLevel,
  MigrationRecommendationPlan,
  MigrationRecommendationSection,
} from "./migrationPlanTypes";
import { buildMigrationPlanNarrative } from "./migrationPlanNarrativeService";

function gateLimitations(gates: MigrationPlanGate[]) {
  return gates
    .filter((gate) => gate.status !== "pass")
    .map((gate) => gate.explanation);
}

function recommendationsFromGates(gates: MigrationPlanGate[]) {
  return [...new Set(gates.filter((gate) => gate.status !== "pass").map((gate) => gate.recommendation))];
}

function confidenceForLevel(level: MigrationPlanLevel, evidence: MigrationPlanEvidenceSummary) {
  if (level === "advanced_plan") return "high" as const;
  if (level === "technical_plan") return "medium" as const;
  return evidence.confidence === "high" ? "medium" : evidence.confidence;
}

function executiveDecision(level: MigrationPlanLevel, gates: MigrationPlanGate[]) {
  if (level === "plan_not_available") return "Plan not available: base inventory is missing.";
  if (gates.some((gate) => gate.blocksProductionWave && gate.status === "fail")) {
    return "Do not proceed to production waves until critical gates are remediated.";
  }
  if (level === "advanced_plan") return "Proceed with a controlled migration planning track, subject to go/no-go checks.";
  if (level === "technical_plan") return "Proceed with technical planning only; production execution remains conditional.";
  return "Use this as a preliminary plan only; key evidence is missing.";
}

export function buildMigrationRecommendationPlan(params: {
  evidence: MigrationPlanEvidenceSummary;
  gates: MigrationPlanGate[];
  planLevel: MigrationPlanLevel;
  generatedAt?: Date;
}): MigrationRecommendationPlan {
  const { evidence, gates, planLevel } = params;
  const limitations = gateLimitations(gates);
  const gateRecommendations = recommendationsFromGates(gates);
  const confidence = confidenceForLevel(planLevel, evidence);
  const sections: MigrationRecommendationSection[] = [
    {
      key: "evidence_coverage",
      title: "Evidence coverage",
      confidence,
      evidenceUsed: Object.entries(evidence.evidenceCoverage).filter(([, present]) => present).map(([key]) => key),
      limitations,
      recommendations: gateRecommendations,
      actionItems: evidence.remediationItems,
    },
    {
      key: "critical_blockers",
      title: "Critical blockers",
      confidence,
      evidenceUsed: gates.filter((gate) => gate.status === "fail").map((gate) => gate.evidenceSource),
      limitations: evidence.blockers,
      recommendations: gates.filter((gate) => gate.status === "fail").map((gate) => gate.recommendation),
      actionItems: evidence.blockers.length > 0 ? evidence.blockers : ["No critical deterministic blocker was found, but warnings remain conditional."],
    },
    {
      key: "required_remediation",
      title: "Required remediation",
      confidence,
      evidenceUsed: gates.filter((gate) => gate.status !== "pass").map((gate) => gate.evidenceSource),
      limitations,
      recommendations: gateRecommendations,
      actionItems: evidence.remediationItems.length > 0 ? evidence.remediationItems : ["Review all warning gates before cutover."],
    },
    {
      key: "migration_approach",
      title: "Recommended migration approach",
      confidence,
      evidenceUsed: ["rvtools", "risk_findings", "optional_evidence_gates"],
      limitations,
      recommendations: [
        "Start with a non-critical pilot wave.",
        "Keep production migration gated by backup, target, storage and dependency evidence.",
        "Use deterministic go/no-go checks before every wave.",
      ],
      actionItems: ["Define pilot candidates, rollback owner, maintenance window and validation checklist."],
    },
    {
      key: "wave_strategy",
      title: "Wave strategy",
      confidence: evidence.waveInputs[0]?.mode === "functional_validated" ? "high" : "medium",
      evidenceUsed: ["application_dependency", "rvtools", "vmware_enrichment"],
      limitations: evidence.waveInputs[0]?.mode === "technical_only"
        ? ["Technical-only wave candidates. Not validated as functional application waves."]
        : ["Functional wave candidates require customer review before execution."],
      recommendations: [
        evidence.waveInputs[0]?.mode === "technical_only"
          ? "Do not treat infrastructure grouping as functional wave validation."
          : "Review functional wave candidates with application owners.",
      ],
      actionItems: ["Confirm owners, dependencies, maintenance windows and rollback dependencies for each wave."],
    },
    {
      key: "backup_rollback",
      title: "Backup and rollback plan",
      confidence: evidence.evidenceCoverage.backupEvidence ? "medium" : "low",
      evidenceUsed: ["backup_evidence"],
      limitations: ["Backup presence does not prove restore success."],
      recommendations: ["Run restore validation and document rollback criteria before production cutover."],
      actionItems: ["Validate restore points, failed jobs, stale backups and rollback communications."],
    },
    {
      key: "go_no_go",
      title: "Go/no-go checklist",
      confidence,
      evidenceUsed: gates.map((gate) => gate.evidenceSource),
      limitations,
      recommendations: ["Proceed only when production-blocking gates are pass or explicitly accepted as controlled risk."],
      actionItems: [
        "Backup restore test complete.",
        "Target capacity and HA/networking reviewed.",
        "Storage performance windows reviewed.",
        "Application owners approve wave sequencing.",
        "Rollback plan and maintenance window approved.",
      ],
    },
    {
      key: "open_evidence_requests",
      title: "Open evidence requests",
      confidence: "medium",
      evidenceUsed: [],
      limitations,
      recommendations: gateRecommendations,
      actionItems: gateRecommendations,
    },
    {
      key: "next_steps",
      title: "Next 30/60/90 days",
      confidence,
      evidenceUsed: ["migration_plan_gates"],
      limitations,
      recommendations: [
        "30 days: close missing evidence and remediate critical blockers.",
        "60 days: run pilot wave and restore validation.",
        "90 days: execute controlled production waves only if go/no-go criteria pass.",
      ],
      actionItems: ["Assign owners and dates to each remediation item."],
    },
  ];

  const basePlan: Omit<MigrationRecommendationPlan, "aiNarrative"> = {
    assessmentId: evidence.assessmentId,
    generatedAt: (params.generatedAt ?? new Date()).toISOString(),
    planLevel,
    confidence,
    executiveDecision: executiveDecision(planLevel, gates),
    evidenceSummary: evidence,
    gates,
    sections,
  };

  return {
    ...basePlan,
    aiNarrative: buildMigrationPlanNarrative(basePlan),
  };
}
