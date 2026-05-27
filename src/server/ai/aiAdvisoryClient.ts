import { getAiAdvisoryConfig } from "./aiAdvisoryConfig";
import { buildAiAdvisoryContextPayload } from "./advisoryContextPayload";
import type { AssessmentDetail } from "../assessments/assessmentService";
import type {
  AiAdvisoryConfig,
  AiAdvisoryContextPayload,
  AiAdvisoryOutput,
  AiAdvisoryProviderStatus,
} from "./aiAdvisoryTypes";

function emptyOutput(config: AiAdvisoryConfig, providerStatus: AiAdvisoryProviderStatus): AiAdvisoryOutput {
  return {
    executiveSummaryNotes: [],
    technicalNotes: [],
    missingContextQuestions: [],
    confidenceImpact:
      providerStatus === "disabled"
        ? "AI advisory is disabled by configuration. Deterministic report sections remain available."
        : "AI advisory is unavailable. Deterministic report sections remain available.",
    recommendedNextActions: [],
    limitations: ["AI advisory is an optional layer and does not replace deterministic readiness/confidence scoring."],
    providerStatus,
    generatedAt: new Date().toISOString(),
    provider: config.provider,
    model: config.model,
  };
}

function priorityFromIndex(index: number): "high" | "medium" | "low" {
  if (index < 3) return "high";
  if (index < 6) return "medium";
  return "low";
}

function buildMockAdvisory(payload: AiAdvisoryContextPayload, config: AiAdvisoryConfig): AiAdvisoryOutput {
  const topFindings = payload.riskFindings.slice(0, 3);
  const missingContext = payload.manualMigrationContext.missingContext.slice(0, 7);
  const missingEvidence = payload.evidenceMissing.slice(0, 5);
  const vmCount = payload.rvtoolsSummary?.vmCount ?? null;
  const coverage = payload.manualMigrationContext.coverage;

  return {
    executiveSummaryNotes: [
      `Advisory mode is running with sanitized ${config.provider} provider output. Treat this as guidance, not as a deterministic score.`,
      vmCount === null
        ? "No parsed RVTools VM summary is available yet, so migration scale should remain preliminary."
        : `The current sanitized inventory basis includes ${vmCount} VMs and ${payload.rvtoolsSummary?.hostCount ?? 0} hosts.`,
      `Migration context coverage is ${coverage.overallPercent}% (${coverage.status}); missing context should be handled as evidence gaps.`,
    ],
    technicalNotes:
      topFindings.length > 0
        ? topFindings.map((finding) => `${finding.severity.toUpperCase()}: ${finding.title}. Validate before production wave planning.`)
        : ["No high-priority risk findings are available in the sanitized advisory payload yet."],
    missingContextQuestions: missingContext.slice(0, 7).map((item, index) => ({
      question: item.replace(" was not provided or was marked unknown/skipped.", "?"),
      whyItMatters: "This missing context can change confidence, migration sequencing or rollback planning.",
      priority: priorityFromIndex(index),
    })),
    confidenceImpact:
      coverage.status === "strong"
        ? "Context is strong enough to support advisory quality, but deterministic scores remain the source of truth."
        : "Context gaps limit advisory quality. Do not treat AI notes as confirmed evidence.",
    recommendedNextActions: [
      ...missingEvidence.map((item) => `Collect or confirm: ${item}`),
      "Review backup/restore proof before scheduling production workloads.",
      "Confirm application owners and maintenance windows for critical systems.",
    ].slice(0, 7),
    limitations: [
      "No raw RVTools files, storage paths, cookies, tokens or secrets are included.",
      "AI advisory does not replace readiness score, evidence confidence score or internal risk findings.",
      "Missing evidence is not inferred. It remains explicitly marked as missing.",
    ],
    providerStatus: "mock",
    generatedAt: new Date().toISOString(),
    provider: config.provider,
    model: config.model,
  };
}

export function generateAiAdvisory(assessment: AssessmentDetail): AiAdvisoryOutput {
  const config = getAiAdvisoryConfig();

  if (!config.enabled || config.provider === "none") {
    return emptyOutput(config, "disabled");
  }

  try {
    const payload = buildAiAdvisoryContextPayload(assessment);

    if (config.provider === "mock") {
      return buildMockAdvisory(payload, config);
    }

    return {
      ...emptyOutput(config, "unavailable"),
      limitations: [
        "Real AI providers are configured as guarded stubs in AI-1.",
        "Enable a follow-up hito before making external provider calls.",
      ],
    };
  } catch {
    return emptyOutput(config, "error");
  }
}
