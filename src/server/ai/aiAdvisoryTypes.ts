export type AiAdvisoryProvider = "none" | "disabled" | "mock" | "gemini" | "opencode_go" | "openai";

export type AiAdvisoryProviderStatus = "success" | "unavailable" | "error" | "disabled" | "mock";

export type AiAdvisoryConfig = {
  enabled: boolean;
  provider: AiAdvisoryProvider;
  model: string | null;
  fallbackProvider: AiAdvisoryProvider | null;
  fallbackModel: string | null;
  opencodeGoBaseUrl: string | null;
  timeoutMs: number;
  maxInputChars: number;
  maxOutputChars: number;
};

export type AiMissingContextQuestion = {
  question: string;
  whyItMatters: string;
  priority: "high" | "medium" | "low";
};

export type AiAdvisoryOutput = {
  executiveSummaryNotes: string[];
  technicalNotes: string[];
  missingContextQuestions: AiMissingContextQuestion[];
  confidenceImpact: string;
  recommendedNextActions: string[];
  limitations: string[];
  providerStatus: AiAdvisoryProviderStatus;
  generatedAt: string;
  provider: AiAdvisoryProvider;
  model: string | null;
};

export type AiAdvisoryContextPayload = {
  assessment: {
    safeReference: string;
    type: string;
    sourcePlatform: string;
    targetPlatform: string;
    status: string;
    storageReadinessEnabled: boolean;
  };
  rvtoolsSummary: {
    vmCount: number;
    hostCount: number;
    datastoreCount: number;
    snapshotCount: number;
    poweredOnVmCount: number;
    poweredOffVmCount: number;
    totalProvisionedGb: number | null;
    totalUsedGb: number | null;
  } | null;
  scores: {
    readinessScore: number | null;
    confidenceScore: number | null;
    inventoryScore: number | null;
    costRiskScore: number | null;
    riskLevel: string | null;
  };
  riskFindings: Array<{
    category: string;
    severity: string;
    entityType: string | null;
    entityName: string | null;
    title: string;
    description: string;
    recommendation: string | null;
    source: string;
  }>;
  manualMigrationContext: {
    coverage: {
      overallPercent: number;
      status: string;
      missingKeyContext: string[];
      sections: Array<{
        id: string;
        title: string;
        percent: number;
        status: string;
        missing: string[];
      }>;
    };
    statusCounts: {
      answered: number;
      unknown: number;
      not_applicable: number;
      skipped: number;
    };
    importantContext: string[];
    missingContext: string[];
    answers: Array<{
      question: string;
      status: string;
      source: string;
      value: string | string[] | null;
    }>;
  };
  assumptions: {
    costRisk: {
      annualSubscriptionDelta: number | null;
      threeYearSubscriptionDelta: number | null;
      savingsPercent: number | null;
      riskLevel: string | null;
      readinessLabel: string | null;
      dataSourceLabel: string | null;
    };
    mismatchWarnings: string[];
    referenceCounts: Record<string, number | null>;
  };
  evidenceReceived: Array<{
    evidenceType: string;
    safeFilenameLabel: string;
    processingStatus: string;
    sizeBytes: number;
    uploadedAt: string;
  }>;
  evidenceMissing: string[];
  excluded: string[];
};
