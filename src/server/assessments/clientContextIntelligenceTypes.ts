export const CLIENT_CONTEXT_ANALYSIS_VERSION = "context-intelligence-v1";
export const CLIENT_CONTEXT_PROMPT_VERSION = "context-intelligence-prompt-v1";

export type ClientContextAnalysisStatus =
  | "not_started"
  | "pending"
  | "completed"
  | "failed"
  | "stale"
  | "ai_disabled"
  | "budget_blocked"
  | "plan_restricted";

export type ContextEvidenceSource =
  | "raw_text"
  | "additional_evidence_summary"
  | "assessment_metadata"
  | "customer_reported";

export type ConfidenceLevel = "high" | "medium" | "low";
export type PriorityLevel = "high" | "medium" | "low";
export type BusinessContextConfidence = "high" | "medium" | "limited" | "low";
export type SafetySeverity = "high" | "medium" | "low";

export type CustomerContextIntelligenceResult = {
  interpretedSummary: string;
  businessPriorities: Array<{
    priority: string;
    evidence: string;
    confidence: ConfidenceLevel;
    source: "customer_reported" | "inferred";
  }>;
  migrationConstraints: Array<{
    constraint: string;
    type: "timeline" | "downtime" | "staffing" | "technical" | "business" | "compliance" | "unknown";
    impact: string;
    source: "customer_reported" | "inferred";
  }>;
  criticalWorkloads: Array<{
    name: string;
    reason: string;
    validationNeeded: boolean;
    source: "customer_reported" | "inferred";
  }>;
  customerReportedRisks: Array<{
    risk: string;
    severity: "critical" | "high" | "medium" | "low" | "unknown";
    rationale: string;
    validationNeeded: boolean;
  }>;
  aiExtractedInsights: Array<{
    insight: string;
    impact: string;
    confidence: ConfidenceLevel;
  }>;
  contradictions: Array<{
    title: string;
    description: string;
    evidenceA: string;
    evidenceB?: string;
    validationRecommendation: string;
  }>;
  validationItems: Array<{
    item: string;
    whyItMatters: string;
    recommendedOwner?: string;
    priority: PriorityLevel;
  }>;
  reportImpact: Array<{
    area:
      | "readiness"
      | "confidence"
      | "migration_waves"
      | "licensing_cost"
      | "backup"
      | "storage"
      | "network"
      | "applications"
      | "other";
    impact: string;
    shouldAffectScore: boolean;
    note: string;
  }>;
  nextQuestions: Array<{
    question: string;
    reason: string;
    priority: PriorityLevel;
  }>;
  contextCompletenessScore: number;
  businessContextConfidence: BusinessContextConfidence;
  safetyFlags: Array<{
    flag: string;
    severity: SafetySeverity;
    explanation: string;
  }>;
};

export type ClientContextSafetyFlag = CustomerContextIntelligenceResult["safetyFlags"][number];

export type ClientContextAnalysisMetadata = {
  analysisVersion: string;
  promptVersion: string;
  modelUsed: string | null;
  provider: string;
  fallbackUsed: boolean;
  chunkCount: number;
  sanitizedInputChars: number;
};
