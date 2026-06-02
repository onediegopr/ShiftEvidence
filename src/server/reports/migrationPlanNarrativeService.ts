import type { MigrationRecommendationPlan } from "./migrationPlanTypes";

export function buildMigrationPlanNarrative(
  plan: Omit<MigrationRecommendationPlan, "aiNarrative">,
): MigrationRecommendationPlan["aiNarrative"] {
  const topWarnings = plan.gates.filter((gate) => gate.status !== "pass").slice(0, 4);
  return {
    used: false,
    providerStatus: "deterministic_fallback",
    executiveSummary: [
      plan.executiveDecision,
      `Plan level is ${plan.planLevel}; confidence is ${plan.confidence}.`,
      "Deterministic gates control this plan. Narrative cannot override missing or failed evidence.",
    ],
    remediationNarrative: topWarnings.length > 0
      ? topWarnings.map((gate) => `${gate.key}: ${gate.recommendation}`)
      : ["No non-pass gates were detected, but final owner review is still required."],
    waveStrategyNarrative: plan.evidenceSummary.waveInputs.map((wave) => `${wave.label}: ${wave.explanation}`),
    nextStepsNarrative: [
      "Close missing evidence first.",
      "Run a non-critical pilot before production waves.",
      "Use the go/no-go checklist before each cutover.",
    ],
  };
}
