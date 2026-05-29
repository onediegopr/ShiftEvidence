import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Gauge,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import type {
  AssessmentCompletionModule,
  AssessmentCompletionSummary,
  AssessmentModuleStatus,
} from "../../server/assessments/assessmentCompletionService";
import {
  getCompletionCenterNotice,
  getCompletionModuleHref,
  getCompletionPrimaryCtaHref,
  getCompletionPrimaryCtaLabel,
  getCompletionStatusLabel,
  getCompletionStatusTone,
} from "./assessmentCompletionPresentation";

type AssessmentCompletionCenterProps = {
  assessmentId: string;
  summary: AssessmentCompletionSummary;
};

function StatusIcon({ status }: { status: AssessmentModuleStatus }) {
  switch (status) {
    case "complete":
    case "not_applicable":
      return <CheckCircle2 size={16} aria-hidden="true" />;
    case "partial":
    case "in_progress":
    case "skipped":
      return <CircleDashed size={16} aria-hidden="true" />;
    case "blocked":
    case "failed":
      return <AlertTriangle size={16} aria-hidden="true" />;
    default:
      return <CircleDashed size={16} aria-hidden="true" />;
  }
}

function MetricCard({
  icon,
  label,
  value,
  text,
  tone = "neutral",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  text: string;
  tone?: "neutral" | "good" | "warning" | "danger";
}) {
  return (
    <article className={`completion-center-metric completion-center-metric-${tone}`}>
      <div className="completion-center-metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{text}</p>
    </article>
  );
}

function ModuleCard({
  assessmentId,
  completionModule,
}: {
  assessmentId: string;
  completionModule: AssessmentCompletionModule;
}) {
  const tone = getCompletionStatusTone(completionModule.status);
  const href = getCompletionModuleHref(assessmentId, completionModule.key);

  return (
    <article className={`completion-module-card completion-module-card-${tone}`}>
      <div className="completion-module-card-top">
        <div className={`completion-module-status-icon completion-module-status-icon-${tone}`}>
          <StatusIcon status={completionModule.status} />
        </div>
        <div>
          <h3>{completionModule.label}</h3>
          <p>{completionModule.description}</p>
        </div>
      </div>

      <div className="completion-module-meta">
        <span className={`assessment-chip assessment-chip-${tone}`}>
          {getCompletionStatusLabel(completionModule.status)}
        </span>
        <span className="assessment-chip assessment-chip-neutral">
          {completionModule.required ? "Required" : "Recommended"}
        </span>
        <span className="assessment-chip assessment-chip-neutral">
          Weight {completionModule.weight}
        </span>
      </div>

      <div className="completion-module-impact">
        <span>Impact if missing</span>
        <p>{completionModule.limitationText ?? completionModule.impactIfMissing}</p>
      </div>

      <Link href={href} className="completion-module-action">
        {completionModule.actionLabel ?? "Review"}
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </article>
  );
}

export function AssessmentCompletionCenter({
  assessmentId,
  summary,
}: AssessmentCompletionCenterProps) {
  const primaryHref = getCompletionPrimaryCtaHref(assessmentId, summary);
  const notice = getCompletionCenterNotice(summary);
  const reportStatus = summary.canGenerateReport
    ? "Ready to generate"
    : "RVTools inventory required";
  const reportStatusTone = summary.canGenerateReport ? "good" : "warning";

  return (
    <section className="assessment-completion-center glass-card" aria-labelledby="assessment-completion-title">
      <div className="completion-center-shell">
        <div className="completion-center-header">
          <div>
            <div className="assessment-section-eyebrow">
              <Target size={18} aria-hidden="true" />
              <span>Completion Center</span>
            </div>
            <h2 id="assessment-completion-title">Assessment Completion Center</h2>
            <p>
              Build a stronger migration readiness report by completing optional modules.
              RVTools inventory is required; the rest improves precision.
            </p>
          </div>
          <div className="completion-center-actions">
            <Link href={primaryHref} className="btn btn-primary btn-glow">
              {getCompletionPrimaryCtaLabel(summary.primaryCta)}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            {summary.canGenerateReport ? (
              <Link
                href={getCompletionModuleHref(assessmentId, "migration_questions")}
                className="btn btn-secondary"
              >
                Improve report
              </Link>
            ) : null}
          </div>
        </div>

        <div className="completion-center-metrics">
          <MetricCard
            icon={<Gauge size={20} aria-hidden="true" />}
            label="Completion"
            value={`${summary.completionPercent}%`}
            text="Operational progress across assessment modules."
            tone={summary.completionPercent >= 70 ? "good" : "warning"}
          />
          <MetricCard
            icon={<TrendingUp size={20} aria-hidden="true" />}
            label="Report Confidence"
            value={`${summary.reportConfidencePercent}%`}
            text="Estimated confidence based on available evidence and context."
            tone={summary.reportConfidencePercent >= 70 ? "good" : "warning"}
          />
          <MetricCard
            icon={<ShieldCheck size={20} aria-hidden="true" />}
            label="Report Status"
            value={reportStatus}
            text={
              summary.requiredComplete
                ? "Required modules are complete."
                : "Required modules still need attention."
            }
            tone={reportStatusTone}
          />
        </div>

        <div className={`completion-center-notice completion-center-notice-${reportStatusTone}`}>
          <ShieldCheck size={18} aria-hidden="true" />
          <p>{notice}</p>
        </div>

        <div className="completion-module-grid">
          {summary.modules.map((completionModule) => (
            <ModuleCard
              key={completionModule.key}
              assessmentId={assessmentId}
              completionModule={completionModule}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
