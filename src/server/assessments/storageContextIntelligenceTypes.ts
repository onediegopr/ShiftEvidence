export const STORAGE_CONTEXT_ANALYSIS_VERSION = "storage-context-intelligence-v1";
export const STORAGE_CONTEXT_PROMPT_VERSION = "storage-context-prompt-v1";

export type StorageContextAnalysisStatus =
  | "not_started"
  | "pending"
  | "completed"
  | "failed"
  | "stale"
  | "ai_disabled"
  | "budget_blocked"
  | "plan_restricted";

export type StorageDestinationOption =
  | "zfs_local"
  | "nfs_san"
  | "ceph_candidate"
  | "pbs_related"
  | "existing_shared_storage"
  | "unknown";

export type StorageConfidenceLevel = "high" | "medium" | "low";
export type StorageContextConfidence = "high" | "medium" | "limited" | "low";
export type StoragePriorityLevel = "high" | "medium" | "low";
export type StorageSafetySeverity = "high" | "medium" | "low";

export type StorageContextIntelligenceResult = {
  interpretedStorageSummary: string;
  sourceStorageSummary: Array<{
    item: string;
    evidence: string;
    confidence: StorageConfidenceLevel;
    source: "rvtools" | "customer_reported" | "additional_evidence" | "inferred";
  }>;
  targetStoragePreference: {
    preference: string;
    rationale: string;
    confidence: StorageConfidenceLevel;
    source: "customer_reported" | "structured_input" | "inferred";
  } | null;
  destinationOptions: Array<{
    option: StorageDestinationOption;
    suitability: "possible" | "risky" | "not_enough_evidence" | "not_recommended_yet";
    rationale: string;
    missingEvidence: string[];
  }>;
  storageConstraints: Array<{
    constraint: string;
    type:
      | "capacity"
      | "network"
      | "downtime"
      | "backup"
      | "ha"
      | "growth"
      | "operations"
      | "unknown";
    impact: string;
    source: "customer_reported" | "structured_input" | "inferred";
  }>;
  cephSignals: {
    customerInterested: boolean;
    signalSummary: string;
    positiveSignals: string[];
    riskSignals: string[];
    missingEvidence: string[];
    finalDecisionDeferred: true;
  };
  operationalReadinessSignals: Array<{
    signal: string;
    impact: string;
    confidence: StorageConfidenceLevel;
  }>;
  missingEvidence: Array<{
    item: string;
    whyItMatters: string;
    priority: StoragePriorityLevel;
  }>;
  contradictions: Array<{
    title: string;
    description: string;
    validationRecommendation: string;
  }>;
  nextQuestions: Array<{
    question: string;
    reason: string;
    priority: StoragePriorityLevel;
  }>;
  recommendationImpact: Array<{
    area:
      | "storage_destination"
      | "ceph"
      | "backup"
      | "network"
      | "migration_waves"
      | "capacity"
      | "operations";
    impact: string;
    shouldAffectScore: boolean;
    note: string;
  }>;
  scores: {
    storageCompletenessScore: number;
    storageEvidenceConfidence: number;
    storageDestinationReadiness: number;
    storageMigrationRisk: number;
    preliminaryCephConfidence: number | null;
  };
  confidenceLabels: {
    storageContextConfidence: StorageContextConfidence;
    storageEvidenceConfidenceLabel: StorageContextConfidence;
  };
  safetyFlags: Array<{
    flag: string;
    severity: StorageSafetySeverity;
    explanation: string;
  }>;
};

export type StorageContextSafetyFlag =
  StorageContextIntelligenceResult["safetyFlags"][number];
