import type {
  AssessmentCompletionModule,
  AssessmentCompletionSummary,
  AssessmentModuleStatus,
} from "../assessments/assessmentCompletionService";

export type ReportCoverageTone = "neutral" | "good" | "warning" | "danger" | "info";

export type ReportCoverageRow = {
  area: string;
  status: string;
  required: "Required" | "Optional";
  impact: string;
  tone: ReportCoverageTone;
};

export type ReportCoverageSectionData = {
  title: "Assessment Coverage & Assumptions";
  intro: string;
  completionPercent: number;
  reportConfidencePercent: number;
  requiredModulesLabel: "Complete" | "Incomplete";
  reportGenerationLabel: string;
  rows: ReportCoverageRow[];
  limitations: string[];
  hasLimitations: boolean;
  usdNote: string;
};

export const ASSESSMENT_COVERAGE_INTRO =
  "This section summarizes the evidence and optional context used to generate the report. Missing optional modules do not block report generation, but they may reduce precision in the affected areas.";

export const ASSESSMENT_COVERAGE_NO_MAJOR_LIMITATIONS =
  "No major coverage limitations were detected for this assessment.";

export const ASSESSMENT_COVERAGE_USD_NOTE =
  "All licensing and subscription values are modeled in USD unless explicitly stated otherwise.";

function statusLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusTone(status: AssessmentModuleStatus): ReportCoverageTone {
  switch (status) {
    case "complete":
    case "not_applicable":
      return "good";
    case "partial":
    case "in_progress":
    case "skipped":
      return "warning";
    case "blocked":
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

function getCompletedModuleImpact(module: AssessmentCompletionModule) {
  switch (module.key) {
    case "rvtools_inventory":
      return "High-confidence infrastructure inventory is available.";
    case "infrastructure_risk":
      return "Infrastructure risk findings are available for sequencing decisions.";
    case "migration_questions":
      return "Business context is available for executive recommendations.";
    case "storage_analysis":
      return "Storage context is available for architecture recommendations.";
    case "licensing_cost_exposure":
      return "USD cost exposure is included in the report assumptions.";
    case "manual_assumptions":
      return "Manual constraints and assumptions are documented.";
    case "ai_advisory":
      return "AI advisory was available as a non-blocking narrative layer.";
    case "report_generation":
      return "Report artifact generation evidence is available.";
  }
}

function getModuleImpact(module: AssessmentCompletionModule) {
  if (module.status === "complete") {
    return getCompletedModuleImpact(module);
  }

  if (module.status === "not_applicable") {
    return `${module.label} was marked not applicable and is not treated as a report blocker.`;
  }

  if (module.limitationText) {
    return module.limitationText;
  }

  return module.impactIfMissing ?? module.description;
}

function getReportGenerationLabel(modules: AssessmentCompletionModule[]) {
  const reportModule = modules.find((module) => module.key === "report_generation");
  if (!reportModule) {
    return "Unknown";
  }

  if (reportModule.status === "complete") {
    return "Generated";
  }

  if (reportModule.status === "in_progress") {
    return "Generating";
  }

  return statusLabel(reportModule.status);
}

export function buildAssessmentCoverageSection(
  summary: AssessmentCompletionSummary,
): ReportCoverageSectionData {
  const rows = summary.modules.map((module) => ({
    area: module.label,
    status: statusLabel(module.status),
    required: module.required ? "Required" as const : "Optional" as const,
    impact: getModuleImpact(module),
    tone: statusTone(module.status),
  }));
  const hasLimitations = summary.limitations.length > 0;

  return {
    title: "Assessment Coverage & Assumptions",
    intro: ASSESSMENT_COVERAGE_INTRO,
    completionPercent: summary.completionPercent,
    reportConfidencePercent: summary.reportConfidencePercent,
    requiredModulesLabel: summary.requiredComplete ? "Complete" : "Incomplete",
    reportGenerationLabel: getReportGenerationLabel(summary.modules),
    rows,
    limitations: hasLimitations ? summary.limitations : [ASSESSMENT_COVERAGE_NO_MAJOR_LIMITATIONS],
    hasLimitations,
    usdNote: ASSESSMENT_COVERAGE_USD_NOTE,
  };
}
