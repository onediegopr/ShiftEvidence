import {
  buildAdvisorMethodologyContextPreview,
  type AdvisorMethodologyContextPreview,
  type AdvisorMethodologyContextPreviewInput,
} from "./methodology";
import type { AdvisorMemoryPromptContext, AdvisorMemoryPromptItem } from "./advisorMemoryPromptContext";
import type { SeniorAdvisorContextPayload } from "./seniorAdvisorTypes";

export const ADVISOR_METHODOLOGY_CONTEXT_FLAG = "ADVISOR_METHODOLOGY_CONTEXT_ENABLED";

export type SeniorAdvisorMethodologyContextStatus =
  | "disabled"
  | "included"
  | "skipped"
  | "error";

export type SeniorAdvisorMethodologyContextResult = {
  enabled: boolean;
  status: SeniorAdvisorMethodologyContextStatus;
  promptSection: string | null;
  blockIds: string[];
  blockVersions: string[];
  blockCount: number;
  tokenEstimate: number;
  warningsCount: number;
  blockedReasonsCount: number;
  errorCode?: "preview_failed";
};

type PreviewBuilder = (
  input: AdvisorMethodologyContextPreviewInput,
) => AdvisorMethodologyContextPreview;

type BuildSeniorAdvisorMethodologyContextParams = {
  context: SeniorAdvisorContextPayload;
  userQuestion: string;
  enabled?: boolean;
  previewBuilder?: PreviewBuilder;
};

const EMPTY_RESULT: SeniorAdvisorMethodologyContextResult = {
  enabled: false,
  status: "disabled",
  promptSection: null,
  blockIds: [],
  blockVersions: [],
  blockCount: 0,
  tokenEstimate: 0,
  warningsCount: 0,
  blockedReasonsCount: 0,
};

export function isAdvisorMethodologyContextEnabled(
  env: Record<string, string | undefined> = process.env,
) {
  return env[ADVISOR_METHODOLOGY_CONTEXT_FLAG] === "true";
}

function pushMemoryItems(
  target: AdvisorMethodologyContextPreviewInput["confirmedMemoryItems"],
  items: AdvisorMemoryPromptItem[],
) {
  for (const item of items) {
    target?.push({
      id: item.id,
      title: item.title,
      content: item.summary,
      type: item.type,
      status: "active",
    });
  }
}

function getConfirmedMemoryItems(memory: AdvisorMemoryPromptContext | undefined) {
  const items: NonNullable<AdvisorMethodologyContextPreviewInput["confirmedMemoryItems"]> = [];
  if (!memory?.included) {
    return items;
  }

  pushMemoryItems(items, memory.decisions);
  pushMemoryItems(items, memory.openQuestions);
  pushMemoryItems(items, memory.nextSteps);
  pushMemoryItems(items, memory.constraints);
  pushMemoryItems(items, memory.risks);
  pushMemoryItems(items, memory.other);
  return items;
}

function deriveMigrationDecision(
  context: SeniorAdvisorContextPayload,
): NonNullable<AdvisorMethodologyContextPreviewInput["assessmentSummary"]>["migrationDecision"] {
  const readiness = context.scores.readinessScore;
  const confidence = context.scores.confidenceScore;
  const missingEvidenceCount =
    context.completion.missingEvidence.length +
    context.licensing.missingEvidence.length +
    context.storage.missingEvidence.length;

  if ((typeof readiness === "number" && readiness < 45) || context.topRisks.some((risk) => risk.severity === "critical")) {
    return "no_go";
  }

  if (
    missingEvidenceCount > 0 ||
    (typeof confidence === "number" && confidence < 70) ||
    context.storage.cephStatus?.toLowerCase().includes("conditional")
  ) {
    return "conditional_go";
  }

  if (typeof readiness === "number" && readiness >= 75 && typeof confidence === "number" && confidence >= 75) {
    return "go";
  }

  return "unknown";
}

function buildEnvironmentSummary(context: SeniorAdvisorContextPayload) {
  return [
    `${context.assessment.title} (${context.assessment.sourcePlatform} to ${context.assessment.targetPlatform})`,
    typeof context.inventory.vmCount === "number" ? `${context.inventory.vmCount} VMs` : null,
    typeof context.inventory.hostCount === "number" ? `${context.inventory.hostCount} hosts` : null,
    context.storage.status ? `storage status: ${context.storage.status}` : null,
  ]
    .filter(Boolean)
    .join("; ");
}

function selectEvidenceMissingForMethodology(params: {
  context: SeniorAdvisorContextPayload;
  userQuestion: string;
}) {
  const allMissing = [
    ...params.context.completion.missingEvidence,
    ...params.context.licensing.missingEvidence,
    ...params.context.storage.missingEvidence,
    ...params.context.clientContext.nextQuestions,
  ];
  const normalizedQuestion = params.userQuestion.toLowerCase();
  const backupFocused = /\bbackup|restore|rpo|rto|pbs|veeam\b/i.test(normalizedQuestion);

  if (!backupFocused) {
    return allMissing;
  }

  const backupMissing = allMissing.filter((item) =>
    /\bbackup|restore|rpo|rto|pbs|veeam\b/i.test(item),
  );
  return backupMissing.length > 0 ? backupMissing : allMissing;
}

function buildMethodologyPreviewInput(params: {
  context: SeniorAdvisorContextPayload;
  userQuestion: string;
}): AdvisorMethodologyContextPreviewInput {
  const context = params.context;
  return {
    userQuestion: params.userQuestion,
    assessmentSummary: {
      assessmentId: context.assessment.id,
      environmentSummary: buildEnvironmentSummary(context),
      evidenceReceived: context.evidence.receivedTypes,
      evidenceMissing: selectEvidenceMissingForMethodology({
        context,
        userQuestion: params.userQuestion,
      }),
      keyRisks: context.topRisks.map((risk) =>
        [risk.severity, risk.category, risk.title, risk.recommendation].filter(Boolean).join(": "),
      ),
      readinessScore: context.scores.readinessScore,
      confidenceScore: context.scores.confidenceScore,
      migrationDecision: deriveMigrationDecision(context),
    },
    confirmedMemoryItems: getConfirmedMemoryItems(context.projectMemory),
    options: {
      maxMethodologyBlocks: 3,
      maxMethodologyTokens: 1_200,
      maxTotalPreviewTokens: 2_200,
    },
  };
}

function buildPromptSection(preview: AdvisorMethodologyContextPreview) {
  return [
    "METHODOLOGY GUIDANCE CONTEXT",
    "Use the following curated Shift Evidence methodology guidance only as advisory context.",
    "Do not treat methodology as customer evidence.",
    "Separate confirmed assessment facts from methodology guidance and missing evidence.",
    "",
    preview.sections.methodologyContext,
    "",
    preview.sections.guardrails,
  ].join("\n");
}

export function buildSeniorAdvisorMethodologyContext(
  params: BuildSeniorAdvisorMethodologyContextParams,
): SeniorAdvisorMethodologyContextResult {
  const enabled = params.enabled ?? isAdvisorMethodologyContextEnabled();
  if (!enabled) {
    return EMPTY_RESULT;
  }

  try {
    const previewBuilder = params.previewBuilder ?? buildAdvisorMethodologyContextPreview;
    const preview = previewBuilder(
      buildMethodologyPreviewInput({
        context: params.context,
        userQuestion: params.userQuestion,
      }),
    );

    if (preview.selectedBlocks.length === 0 || !preview.sections.methodologyContext.trim()) {
      return {
        ...EMPTY_RESULT,
        enabled: true,
        status: "skipped",
        warningsCount: preview.warnings.length,
        blockedReasonsCount: preview.blockedReasons.length,
      };
    }

    return {
      enabled: true,
      status: "included",
      promptSection: buildPromptSection(preview),
      blockIds: preview.selectedBlocks.map((block) => block.id),
      blockVersions: preview.selectedBlocks.map((block) => block.version),
      blockCount: preview.selectedBlocks.length,
      tokenEstimate: preview.tokenEstimate.methodology + preview.tokenEstimate.guardrails,
      warningsCount: preview.warnings.length,
      blockedReasonsCount: preview.blockedReasons.length,
    };
  } catch {
    return {
      ...EMPTY_RESULT,
      enabled: true,
      status: "error",
      errorCode: "preview_failed",
    };
  }
}

export function buildSeniorAdvisorMethodologyUsageMetadata(
  result: SeniorAdvisorMethodologyContextResult,
) {
  return {
    methodologyContextEnabled: result.enabled,
    methodologyContextStatus: result.status,
    methodologyBlockIds: result.blockIds,
    methodologyBlockVersions: result.blockVersions,
    methodologyBlockCount: result.blockCount,
    methodologyTokenEstimate: result.tokenEstimate,
    methodologyWarningsCount: result.warningsCount,
    methodologyBlockedReasonsCount: result.blockedReasonsCount,
    methodologyContextErrorCode: result.errorCode ?? null,
  };
}

export function buildSeniorAdvisorMethodologyAuditMetadata(
  result: SeniorAdvisorMethodologyContextResult,
) {
  return {
    methodologyContextEnabled: result.enabled,
    methodologyContextStatus: result.status,
    methodologyBlockCount: result.blockCount,
    methodologyWarningsCount: result.warningsCount,
    methodologyBlockedReasonsCount: result.blockedReasonsCount,
    methodologyContextErrorCode: result.errorCode ?? null,
  };
}
