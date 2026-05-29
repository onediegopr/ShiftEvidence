import type {
  AssessmentCompletionPrimaryCta,
  AssessmentCompletionSummary,
  AssessmentModuleKey,
  AssessmentModuleStatus,
} from "../../server/assessments/assessmentCompletionService";

export type CompletionVisualTone = "neutral" | "good" | "warning" | "danger";

export function getCompletionStatusLabel(status: AssessmentModuleStatus) {
  switch (status) {
    case "complete":
      return "Complete";
    case "in_progress":
      return "In progress";
    case "partial":
      return "Partial";
    case "not_started":
      return "Not started";
    case "skipped":
      return "Skipped";
    case "not_applicable":
      return "Not applicable";
    case "blocked":
      return "Blocked";
    case "failed":
      return "Needs attention";
    default:
      return "Unknown";
  }
}

export function getCompletionStatusTone(status: AssessmentModuleStatus): CompletionVisualTone {
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

export function getCompletionPrimaryCtaLabel(primaryCta: AssessmentCompletionPrimaryCta) {
  switch (primaryCta) {
    case "upload_rvtools":
      return "Upload RVTools";
    case "generate_report":
      return "Generate report now";
    case "improve_report":
      return "Improve report confidence";
    case "review_modules":
      return "Review modules";
  }
}

export function getCompletionModuleHref(assessmentId: string, key: AssessmentModuleKey) {
  switch (key) {
    case "rvtools_inventory":
      return `/dashboard/assessments/${assessmentId}?tab=evidence#evidence-upload`;
    case "infrastructure_risk":
      return `/dashboard/assessments/${assessmentId}?tab=report#risk-overview`;
    case "migration_questions":
      return `/dashboard/assessments/${assessmentId}?tab=context`;
    case "storage_analysis":
      return `/dashboard/assessments/${assessmentId}?tab=basics#storage-readiness`;
    case "licensing_cost_exposure":
      return `/dashboard/assessments/${assessmentId}?tab=basics#cost-risk-assumptions`;
    case "client_context_intelligence":
      return `/dashboard/assessments/${assessmentId}?tab=client-context#client-context-additional-evidence`;
    case "manual_assumptions":
      return `/dashboard/assessments/${assessmentId}?tab=basics#infrastructure-intake`;
    case "ai_advisory":
    case "report_generation":
      return `/dashboard/assessments/${assessmentId}/report`;
  }
}

export function getCompletionPrimaryCtaHref(
  assessmentId: string,
  summary: Pick<AssessmentCompletionSummary, "primaryCta" | "missingRecommended">,
) {
  switch (summary.primaryCta) {
    case "upload_rvtools":
      return getCompletionModuleHref(assessmentId, "rvtools_inventory");
    case "generate_report":
      return getCompletionModuleHref(assessmentId, "report_generation");
    case "improve_report": {
      const firstRecommended = summary.missingRecommended[0];
      return firstRecommended
        ? getCompletionModuleHref(assessmentId, firstRecommended.key)
        : getCompletionModuleHref(assessmentId, "migration_questions");
    }
    case "review_modules":
      return `/dashboard/assessments/${assessmentId}`;
  }
}

export function getCompletionCenterNotice(summary: AssessmentCompletionSummary) {
  if (!summary.canGenerateReport) {
    return "Upload and parse RVTools inventory first. Optional modules can be completed later to improve precision.";
  }

  const recommended = summary.missingRecommended
    .filter((completionModule) =>
      ["storage_analysis", "licensing_cost_exposure", "migration_questions"].includes(
        completionModule.key,
      ) ||
      completionModule.key === "client_context_intelligence",
    )
    .slice(0, 2)
    .map((completionModule) => completionModule.label);

  if (recommended.length === 0) {
    return "You can generate the report now. Remaining optional modules do not block progress.";
  }

  return `You can generate the report now. Completing ${recommended.join(" and ")} will improve precision.`;
}
