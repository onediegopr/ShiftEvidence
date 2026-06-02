export type MigrationPlanLevel =
  | "plan_not_available"
  | "preliminary_plan"
  | "technical_plan"
  | "advanced_plan";

export type MigrationPlanGateStatus =
  | "pass"
  | "warning"
  | "fail"
  | "not_applicable"
  | "insufficient_evidence";

export type MigrationPlanGateSeverity = "info" | "low" | "medium" | "high" | "critical";

export type MigrationPlanGate = {
  key: string;
  status: MigrationPlanGateStatus;
  severity: MigrationPlanGateSeverity;
  evidenceSource: string;
  explanation: string;
  recommendation: string;
  blocksAdvancedPlan: boolean;
  blocksProductionWave: boolean;
};

export type MigrationPlanEvidenceCoverage = {
  baseInventory: boolean;
  vmwareEnrichment: boolean;
  proxmoxTarget: boolean;
  backupEvidence: boolean;
  storageSanEvidence: boolean;
  applicationDependencies: boolean;
  licensing: boolean;
  clientContext: boolean;
  aiAdvisory: boolean;
};

export type MigrationPlanEvidenceSummary = {
  assessmentId: string;
  assessmentTitle: string;
  clientLabel: string | null;
  workspaceName: string;
  evidenceCoverage: MigrationPlanEvidenceCoverage;
  inventory: {
    vmCount: number;
    hostCount: number;
    datastoreCount: number;
    snapshotCount: number;
    parsed: boolean;
  };
  readiness: {
    infrastructure: string;
    target: string;
    backup: string;
    storage: string;
    dependencies: string;
    businessContinuity: string;
    licensing: string;
  };
  summaries: {
    vmwareEnrichment: Record<string, unknown> | null;
    proxmoxTarget: Record<string, unknown> | null;
    backupEvidence: Record<string, unknown> | null;
    storageSan: Record<string, unknown> | null;
    applicationDependencies: Record<string, unknown> | null;
  };
  blockers: string[];
  remediationItems: string[];
  waveInputs: Array<{
    mode: "technical_only" | "functional_candidate" | "functional_validated";
    label: string;
    explanation: string;
  }>;
  confidence: "low" | "medium" | "high";
};

export type MigrationRecommendationSection = {
  key: string;
  title: string;
  confidence: "low" | "medium" | "high";
  evidenceUsed: string[];
  limitations: string[];
  recommendations: string[];
  actionItems: string[];
};

export type MigrationRecommendationPlan = {
  assessmentId: string;
  generatedAt: string;
  planLevel: MigrationPlanLevel;
  confidence: "low" | "medium" | "high";
  executiveDecision: string;
  evidenceSummary: MigrationPlanEvidenceSummary;
  gates: MigrationPlanGate[];
  sections: MigrationRecommendationSection[];
  aiNarrative: {
    used: boolean;
    providerStatus: "deterministic_fallback" | "ai_success" | "ai_unavailable";
    executiveSummary: string[];
    remediationNarrative: string[];
    waveStrategyNarrative: string[];
    nextStepsNarrative: string[];
  };
};
