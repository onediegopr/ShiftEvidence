import type { AiAdvisoryProvider } from "../ai/aiAdvisoryTypes";
import type { AdvisorMemoryPanelState } from "./advisorMemoryTypes";

export const SENIOR_ADVISOR_CONTEXT_VERSION = "advisor-context-v1";
export const SENIOR_ADVISOR_PROMPT_VERSION = "advisor-prompt-v1";
export const SENIOR_ADVISOR_OPERATION_TYPE = "senior_advisor_message" as const;

export type SeniorAdvisorPlanKey =
  | "starter"
  | "internal_qa"
  | "readiness_report"
  | "pro"
  | "blueprint"
  | "partner";

export type SeniorAdvisorCreditMode = "contact_us" | "coming_soon";

export type SeniorAdvisorPlanLimits = {
  planKey: SeniorAdvisorPlanKey;
  label: string;
  enabled: boolean;
  messageLimit: number;
  maxUserMessageChars: number;
  maxPromptInputChars: number;
  maxResponseTokens: number;
  warningAtPercent: number;
  deepSynthesisEnabled: boolean;
  executiveBriefEnabled: boolean;
  canRequestMoreCredits: boolean;
  requestMoreCreditsEnabled: boolean;
  requestMoreCreditsMode: SeniorAdvisorCreditMode;
};

export type SeniorAdvisorUsageState = {
  enabled: boolean;
  planLabel: string;
  messageLimit: number;
  messagesUsed: number;
  messagesRemaining: number;
  percentUsed: number;
  warningReached: boolean;
  exhausted: boolean;
  canRequestMoreCredits: boolean;
  requestMoreCreditsEnabled: boolean;
  requestMoreCreditsMode: SeniorAdvisorCreditMode;
};

export type SeniorAdvisorSafetyFlag = {
  flag: string;
  severity: "high" | "medium" | "low";
  explanation: string;
};

export type SeniorAdvisorContextSource =
  | "confirmed"
  | "customer_reported"
  | "inferred"
  | "missing"
  | "system_generated";

export type SeniorAdvisorContextItem = {
  label: string;
  value: string | number | boolean | null;
  source: SeniorAdvisorContextSource;
};

export type SeniorAdvisorContextPayload = {
  contextVersion: string;
  assessment: {
    id: string;
    title: string;
    clientLabel: string | null;
    status: string;
    planLevel: string;
    workspacePlan: string;
    sourcePlatform: string;
    targetPlatform: string;
  };
  completion: {
    completionScore: number;
    completionStatus: string;
    modules: Array<{
      key: string;
      label: string;
      status: string;
      optional: boolean;
      source: SeniorAdvisorContextSource;
    }>;
    missingEvidence: string[];
    nextSteps: string[];
  };
  inventory: {
    vmCount: number | null;
    hostCount: number | null;
    datastoreCount: number | null;
    snapshotCount: number | null;
    poweredOnVmCount: number | null;
    poweredOffVmCount: number | null;
    totalProvisionedGb: number | null;
    totalUsedGb: number | null;
    evidenceConfidence: string | null;
    inventoryStatus: string | null;
  };
  scores: {
    readinessScore: number | null;
    confidenceScore: number | null;
    inventoryScore: number | null;
    costRiskScore: number | null;
    storageScore: number | null;
    riskLevel: string | null;
  };
  topRisks: Array<{
    severity: string;
    category: string;
    title: string;
    recommendation: string | null;
    source: SeniorAdvisorContextSource;
  }>;
  licensing: {
    status: string | null;
    mode: string | null;
    financialConfidenceScore: number | null;
    financialConfidenceLabel: string | null;
    executiveRecommendation: string | null;
    missingEvidence: string[];
    disclaimer: string;
  };
  clientContext: {
    status: string | null;
    analysisStatus: string | null;
    interpretedSummary: string | null;
    confidence: string | null;
    completenessScore: number | null;
    nextQuestions: string[];
    source: SeniorAdvisorContextSource;
  };
  storage: {
    status: string | null;
    currentStorageType: string | null;
    targetStoragePreference: string | null;
    storageReadinessScore: number | null;
    storageEvidenceConfidence: number | null;
    interpretedSummary: string | null;
    missingEvidence: string[];
    cephStatus: string | null;
    cephSummary: string | null;
    cephRecommendedNextStep: string | null;
    disclaimer: string;
  };
  evidence: {
    filesCount: number;
    activeFilesCount: number;
    receivedTypes: string[];
    metadataOnly: boolean;
    rawFileContentsExcluded: boolean;
  };
  reports: {
    generatedCount: number;
    latestReportType: string | null;
    latestReportStatus: string | null;
  };
  boundaries: string[];
};

export type SeniorAdvisorMessageView = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  status: "completed" | "failed" | "blocked";
  provider: AiAdvisoryProvider | string | null;
  model: string | null;
  creditCost: number;
  createdAt: Date;
  safetyFlags: SeniorAdvisorSafetyFlag[];
};

export type SeniorAdvisorPanelState = {
  assessmentId: string;
  conversationId: string | null;
  usage: SeniorAdvisorUsageState;
  messages: SeniorAdvisorMessageView[];
  memory: AdvisorMemoryPanelState;
  lockedReason: string | null;
  helper: {
    title: string;
    shortDescription: string;
    canDo: string[];
    cannotDo: string[];
    suggestedPrompts: string[];
  };
};

export type SeniorAdvisorSendResult =
  | {
      ok: true;
      assistantMessage: SeniorAdvisorMessageView;
      usage: SeniorAdvisorUsageState;
    }
  | {
      ok: false;
      code:
        | "plan_restricted"
        | "credits_exhausted"
        | "validation_failed"
        | "ai_disabled"
        | "budget_blocked"
        | "provider_unavailable"
        | "provider_failed";
      message: string;
      usage?: SeniorAdvisorUsageState;
    };
