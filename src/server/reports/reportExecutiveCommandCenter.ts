import {
  buildEvidenceCoverageMatrix,
  buildMigrationReadinessRadar,
  buildRiskHeatmap,
  buildWaveTimeline,
} from "./reportChartModels";
import type { ReportNarrativeModel } from "./reportNarrativeModel";

export type ReportExecutiveCommandCenter = {
  migrationReadinessScore: number | null;
  evidenceConfidenceScore: number | null;
  decisionRecommendation: string;
  totalVmsAnalyzed: number;
  mainBlocker: string;
  bestNextAction: string;
  evidenceStatusSummary: string;
  riskDistributionSummary: string;
  summaryParagraph: string;
  decisionSummary: string[];
  radar: ReturnType<typeof buildMigrationReadinessRadar>;
  heatmap: ReturnType<typeof buildRiskHeatmap>;
  evidenceMatrix: ReturnType<typeof buildEvidenceCoverageMatrix>;
  waveTimeline: ReturnType<typeof buildWaveTimeline>;
};

function statusCountLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function evidenceSummary(model: ReportNarrativeModel) {
  const counts = Object.values(model.evidenceCoverage).reduce(
    (acc, status) => {
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return [
    counts.complete ? statusCountLabel(counts.complete, "confirmed evidence stream") : null,
    counts.partial ? statusCountLabel(counts.partial, "partial evidence stream") : null,
    counts.missing ? statusCountLabel(counts.missing, "missing evidence stream") : null,
    counts.not_provided ? statusCountLabel(counts.not_provided, "unprovided evidence stream") : null,
  ]
    .filter(Boolean)
    .join(", ");
}

function riskSummary(model: ReportNarrativeModel) {
  const distribution = model.vmRiskDistribution;
  if (
    distribution.totalAnalyzed > 0 &&
    distribution.critical === 0 &&
    distribution.high === 0 &&
    distribution.medium === 0 &&
    distribution.low === 0 &&
    distribution.info === 0
  ) {
    return "VM-level distribution is not yet quantified in the current evidence package";
  }
  return [
    `Critical ${distribution.critical}`,
    `High ${distribution.high}`,
    `Medium ${distribution.medium}`,
    `Low ${distribution.low}`,
  ].join(" | ");
}

export function buildReportExecutiveCommandCenter(model: ReportNarrativeModel): ReportExecutiveCommandCenter {
  const mainBlocker =
    model.holdItems[0] ??
    model.topRisks[0]?.title ??
    model.missingEvidence[0]?.area ??
    "No dominant blocker identified yet";
  const bestNextAction =
    model.nextSteps[0] ??
    model.requiredValidations[0] ??
    "Validate missing evidence before approving production migration waves.";
  const evidenceStatusSummary = evidenceSummary(model);
  const riskDistributionSummary = riskSummary(model);
  const summaryParagraph = [
    model.decisionNarrative,
    `Evidence status: ${evidenceStatusSummary || "No evidence summary available."}`,
    `Risk distribution: ${riskDistributionSummary}.`,
  ].join(" ");

  return {
    migrationReadinessScore: model.readinessScore,
    evidenceConfidenceScore: model.confidenceScore,
    decisionRecommendation: model.decisionStatus,
    totalVmsAnalyzed: model.vmRiskDistribution.totalAnalyzed,
    mainBlocker,
    bestNextAction,
    evidenceStatusSummary,
    riskDistributionSummary,
    summaryParagraph,
    decisionSummary: [
      `Decision recommendation: ${model.decisionStatus}`,
      `Main blocker: ${mainBlocker}`,
      `Best next action: ${bestNextAction}`,
    ],
    radar: buildMigrationReadinessRadar(model),
    heatmap: buildRiskHeatmap(model),
    evidenceMatrix: buildEvidenceCoverageMatrix(model),
    waveTimeline: buildWaveTimeline(model),
  };
}
