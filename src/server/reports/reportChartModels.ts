import type { ReportNarrativeEvidenceCoverage, ReportNarrativeModel, ReportNarrativeRisk, ReportNarrativeWave } from "./reportNarrativeModel";

export type RadarAxis =
  | "Compute"
  | "Storage"
  | "Network"
  | "Backup"
  | "Proxmox Target"
  | "Application Dependencies"
  | "Operations"
  | "Evidence Quality";

export type RadarPoint = {
  axis: RadarAxis;
  score: number;
  status: "strong" | "moderate" | "weak";
};

export type HeatmapPoint = {
  label: string;
  impact: number;
  probability: number;
  severity: ReportNarrativeRisk["severity"];
};

export type EvidenceCoverageCell = {
  area: keyof ReportNarrativeEvidenceCoverage;
  status: ReportNarrativeEvidenceCoverage[keyof ReportNarrativeEvidenceCoverage];
};

export type WaveTimelineNode = {
  label: string;
  stage: ReportNarrativeWave["stage"];
  riskBand: ReportNarrativeWave["riskBand"];
  rationale: string;
};

function statusScore(status: ReportNarrativeEvidenceCoverage[keyof ReportNarrativeEvidenceCoverage]) {
  switch (status) {
    case "complete":
      return 82;
    case "partial":
      return 58;
    case "not_applicable":
      return 70;
    case "not_provided":
      return 34;
    case "missing":
    default:
      return 22;
  }
}

function scoreStatus(score: number): RadarPoint["status"] {
  if (score >= 75) return "strong";
  if (score >= 45) return "moderate";
  return "weak";
}

export function buildMigrationReadinessRadar(model: ReportNarrativeModel): RadarPoint[] {
  const readiness = model.readinessScore ?? 48;
  const confidence = model.confidenceScore ?? 42;
  const coverage = model.evidenceCoverage;

  const points: Array<[RadarAxis, number]> = [
    ["Compute", readiness],
    ["Storage", statusScore(coverage.performance)],
    ["Network", statusScore(coverage.network)],
    ["Backup", statusScore(coverage.backup)],
    ["Proxmox Target", statusScore(coverage.proxmoxTarget)],
    ["Application Dependencies", statusScore(coverage.cmdb)],
    ["Operations", Math.round((statusScore(coverage.questionnaire) + statusScore(coverage.backup)) / 2)],
    ["Evidence Quality", confidence],
  ];

  return points.map(([axis, score]) => ({
    axis,
    score,
    status: scoreStatus(score),
  }));
}

export function buildRiskHeatmap(model: ReportNarrativeModel): HeatmapPoint[] {
  return model.topRisks.slice(0, 8).map((risk) => {
    const impact =
      risk.severity === "critical" ? 95 : risk.severity === "high" ? 82 : risk.severity === "medium" ? 60 : risk.severity === "low" ? 38 : 22;
    const probability =
      risk.severity === "critical" ? 88 : risk.severity === "high" ? 74 : risk.severity === "medium" ? 55 : risk.severity === "low" ? 33 : 20;

    return {
      label: risk.title,
      impact,
      probability,
      severity: risk.severity,
    };
  });
}

export function buildEvidenceCoverageMatrix(model: ReportNarrativeModel): EvidenceCoverageCell[] {
  return Object.entries(model.evidenceCoverage).map(([area, status]) => ({
    area: area as keyof ReportNarrativeEvidenceCoverage,
    status,
  }));
}

export function buildWaveTimeline(model: ReportNarrativeModel): WaveTimelineNode[] {
  return model.migrationWaves.map((wave) => ({
    label: wave.label,
    stage: wave.stage,
    riskBand: wave.riskBand,
    rationale: wave.rationale,
  }));
}
