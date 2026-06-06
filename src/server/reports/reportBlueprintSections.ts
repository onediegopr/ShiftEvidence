import type { ReportNarrativeModel } from "./reportNarrativeModel";
import { buildBlueprintDecisionSummaryFromNarrative, buildBlueprintSectionPack } from "./reportBlueprintModels";
import type { MigrationRecommendationPlan } from "./migrationPlanTypes";

export function buildBlueprintDecisionSummaryForNarrative(model: ReportNarrativeModel) {
  return buildBlueprintDecisionSummaryFromNarrative({
    decisionRecommendation: model.decisionStatus,
    blocker: model.holdItems[0] ?? model.topRisks[0]?.title ?? model.missingEvidence[0]?.area ?? "Evidence gaps remain unresolved.",
    nextAction: model.nextSteps[0] ?? model.requiredValidations[0] ?? "Close the open validation gates before critical waves.",
    decisionNarrative: model.decisionNarrative,
  });
}

export function buildBlueprintSectionPackForPlan(plan: MigrationRecommendationPlan) {
  return buildBlueprintSectionPack(plan);
}

export function buildBlueprintDecisionSummaryBulletsForNarrative(model: ReportNarrativeModel) {
  return [
    "This is a planning and execution-qualification package.",
    "Execution readiness depends on closing validation gates.",
    "Missing evidence limits confidence and must be resolved before critical waves.",
    `Main blocker: ${model.holdItems[0] ?? model.topRisks[0]?.title ?? model.missingEvidence[0]?.area ?? "Evidence gaps remain unresolved."}`,
    `Next action: ${model.nextSteps[0] ?? model.requiredValidations[0] ?? "Close the open validation gates before critical waves."}`,
  ];
}
