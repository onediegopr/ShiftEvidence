import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BadgePercent,
  BookOpen,
  Building2,
  CircleAlert,
  FileText,
  HardDrive,
  Image as ImageIcon,
  Lock,
  PanelTop,
  RefreshCcw,
  Sparkles,
  SquareArrowOutUpRight,
  Table2,
  Users,
} from "lucide-react";
import { auth } from "../../../../../lib/auth";
import { upsertUserProfileFromSession } from "../../../../../server/user/userProfileService";
import { ensureDefaultWorkspace } from "../../../../../server/workspace/workspaceService";
import { isAdminEmail } from "../../../../../server/admin/adminAuth";
import { findAssessmentForAdmin, findAssessmentForUser, type AssessmentDetail } from "../../../../../server/assessments/assessmentService";
import { getAssessmentCompletionStatus } from "../../../../../server/assessments/assessmentCompletionService";
import { getReportPreviewData, type ReportPreviewData } from "../../../../../server/reports/reportPreviewService";
import { getReportStatusLabel, getReportStatusTone, getReportTypeLabel } from "../../../../../server/reports/reportHistoryService";
import { buildMigrationRecommendationPlanForAssessment } from "../../../../../server/reports/migrationPlanService";
import { trackReportPreviewViewed } from "../../../../../server/reports/upgradeEventService";
import {
  getUnlockRequestStatusLabel,
  getUnlockRequestStatusTone,
  getUnlockRequestTypeLabel,
} from "../../../../../server/unlocks/unlockRequestService";
import { requestUnlockAction } from "./actions";

type ReportPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?:
    | {
      upgrade?: string;
      error?: string;
      generated?: string;
      migrationPlan?: string;
      deleted?: string;
      unlock?: string;
    }
    | Promise<{
        upgrade?: string;
        error?: string;
        generated?: string;
        migrationPlan?: string;
        deleted?: string;
        unlock?: string;
      }>;
};

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMoneyCents(value: number | null | undefined, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value / 100);
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);
}

function formatBytes(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: size >= 10 ? 0 : 1,
  }).format(size)} ${units[unit]}`;
}

function dateLabel(value: Date | string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function statusLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function evidenceCoverageLabel(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (part) => part.toUpperCase());
}

function renderStatusPill(label: string, tone: "neutral" | "good" | "warning" | "danger") {
  return <span className={`assessment-chip assessment-chip-${tone}`}>{label}</span>;
}

function renderStatusTone(value: string) {
  switch (value) {
    case "complete":
    case "selected":
    case "parsed":
    case "available":
    case "unlocked":
    case "moderate":
    case "generated":
    case "completed":
    case "pass":
    case "advanced_plan":
    case "functional_validated":
    case "fresh":
    case "high":
    case "fulfilled":
    case "strong":
    case "ceph_applies":
    case "ceph_does_not_apply":
      return "good" as const;
    case "partial":
    case "pending":
    case "approved":
    case "locked":
    case "not_available_yet":
    case "not_generated":
    case "generating":
    case "preliminary_plan":
    case "technical_plan":
    case "warning":
    case "insufficient_evidence":
    case "functional_candidate":
    case "technical_only":
    case "limited":
    case "limited_with_warnings":
    case "missing":
    case "needs_input":
    case "ready":
    case "stale":
    case "stale_pricing":
    case "medium":
    case "ai_disabled":
    case "budget_blocked":
    case "plan_restricted":
    case "ceph_conditional":
    case "ceph_overkill":
    case "not_enough_evidence":
      return "warning" as const;
    case "rejected":
      return "danger" as const;
    case "failed":
    case "fail":
    case "plan_not_available":
    case "blocked":
    case "low":
    case "ceph_underdesigned":
      return "danger" as const;
    case "deleted":
    case "cancelled":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

function getUpgradeCopy(triggerType: string) {
  switch (triggerType) {
    case "unlock_report_clicked":
      return {
        title: "Request Starter Readiness",
        description: "Request the Starter Readiness package for executive-ready output and a structured assessment baseline.",
      };
    case "unlock_pro_clicked":
      return {
        title: "Book Professional Assessment",
        description: "Request the Professional Assessment package for the full VM-by-VM matrix and deeper operational review.",
      };
    case "storage_addon_clicked":
      return {
        title: "Discuss Storage Scope",
        description: "Request a storage scope review when target architecture validation needs more depth.",
      };
    case "review_call_clicked":
      return {
        title: "Book Technical Review",
        description: "Record interest in a technical review path for assumptions and next-step guidance.",
      };
    default:
      return {
        title: "Package request recorded",
        description: "This request was tracked without activating checkout.",
      };
  }
}

function SectionTitle({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="assessment-section-title">
      <div className="assessment-section-eyebrow">
        {icon}
        <span>{eyebrow}</span>
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

async function getAssessment(params: ReportPageProps["params"]) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  await upsertUserProfileFromSession({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    imageUrl: session.user.image ?? null,
    authProvider: "better-auth",
  });

  await ensureDefaultWorkspace({
    userId: session.user.id,
    userDisplayName: session.user.name,
  });

  const parsedId = id.trim();
  if (!parsedId) {
    throw new Error("Assessment ID is required.");
  }

  let assessment;
  if (isAdminEmail(session.user.email)) {
    assessment = await findAssessmentForAdmin({
      assessmentId: parsedId,
    });
  } else {
    assessment = await findAssessmentForUser({
      userId: session.user.id,
      assessmentId: parsedId,
    });
  }

  if (!assessment) {
    notFound();
  }

  await trackReportPreviewViewed({
    userId: session.user.id,
    assessmentId: assessment.id,
  });

  return assessment;
}

function ReportMetricCard({
  label,
  value,
  note,
  tone,
}: ReportPreviewData["reportCards"][number]) {
  return (
    <article className="glass-card report-metric-card assessment-subcard">
      <span className="assessment-preview-label">{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
      <span className={`assessment-chip assessment-chip-${tone}`}>{value}</span>
    </article>
  );
}

function LockedSectionCard({
  title,
  description,
  whyItMatters,
  whatYouGet,
  ctaLabel,
  planLabel,
}: {
  title: string;
  description: string;
  whyItMatters: string;
  whatYouGet: string;
  ctaLabel: string;
  planLabel: string;
}) {
  return (
    <article className="glass-card report-locked-card">
      <div className="report-locked-header">
        <div>
          <span className="assessment-preview-label">Locked section</span>
          <h3>{title}</h3>
        </div>
        <Lock size={18} />
      </div>
      <p>{description}</p>
      <div className="report-locked-copy">
        <strong>Why it matters</strong>
        <p>{whyItMatters}</p>
      </div>
      <div className="report-locked-copy">
        <strong>What you get</strong>
        <p>{whatYouGet}</p>
      </div>
      <div className="report-locked-footer">
        <span className="assessment-chip assessment-chip-neutral">Requires {planLabel}</span>
        <span className="assessment-chip assessment-chip-warning">{ctaLabel}</span>
      </div>
    </article>
  );
}

function ReportHistoryCard({
  report,
  assessmentId,
}: {
  report: AssessmentDetail["reports"][number];
  assessmentId: string;
}) {
  const downloadHref = `/api/assessments/${assessmentId}/reports/${report.id}/download`;

  return (
    <article className="glass-card report-history-card">
      <div className="report-history-header">
        <div>
          <span className="assessment-preview-label">{getReportTypeLabel(report.reportType)}</span>
          <h3>{report.originalFilename}</h3>
        </div>
        {renderStatusPill(getReportStatusLabel(report.status), getReportStatusTone(report.status))}
      </div>
      <div className="report-history-meta">
        <span>Generated: {report.generatedAt ? dateLabel(report.generatedAt) : "Not yet"}</span>
        <span>Size: {formatBytes(report.sizeBytes)}</span>
        <span>Hash: {report.fileHash ? `${report.fileHash.slice(0, 12)}…` : "—"}</span>
      </div>
      {report.processingError ? (
        <p className="report-history-error">{report.processingError}</p>
      ) : null}
      <div className="assessment-inline-actions report-history-actions">
        {report.status === "generated" ? (
          <a href={downloadHref} className="btn btn-secondary">
            Download PDF
          </a>
        ) : (
          <span className="assessment-inline-note">Download available once generation completes.</span>
        )}
        <form action={`/api/assessments/${assessmentId}/reports/${report.id}/delete`} method="post">
          <button type="submit" className="btn btn-secondary">
            Delete
          </button>
        </form>
      </div>
    </article>
  );
}

function shouldShowAiAdvisory(report: ReportPreviewData) {
  return (
    (report.aiAdvisory.providerStatus === "mock" || report.aiAdvisory.providerStatus === "success") &&
    (report.aiAdvisory.executiveSummaryNotes.length > 0 ||
      report.aiAdvisory.technicalNotes.length > 0 ||
      report.aiAdvisory.missingContextQuestions.length > 0)
  );
}

export default async function ReportPreviewPage({
  params,
  searchParams,
}: ReportPageProps) {
  const assessment = await getAssessment(params);
  const completion = getAssessmentCompletionStatus(assessment);
  const report = await getReportPreviewData(assessment);
  const migrationPlan = buildMigrationRecommendationPlanForAssessment(assessment);
  const query = await Promise.resolve(searchParams);
  const upgrade = query?.upgrade === "1";
  const error = query?.error ? decodeURIComponent(query.error) : null;
  const generated = query?.generated === "1";
  const migrationPlanGenerated = query?.migrationPlan === "generated";
  const deleted = query?.deleted === "1";
  const unlock = query?.unlock ?? null;
  const upgradeMessage = upgrade ? "Package request captured. Checkout is not available yet." : null;
  const generatedMessage = generated ? "PDF Preview generated and stored privately." : null;
  const migrationPlanMessage = migrationPlanGenerated ? "Migration Recommendation Plan generated and stored privately." : null;
  const deletedMessage = deleted ? "PDF Preview deleted and removed from private storage." : null;
  const unlockMessage =
    unlock === "created" || unlock === "existing"
      ? "Request received. We’ll contact you to complete payment and unlock this report."
      : unlock === "already_unlocked"
        ? "This report path is already unlocked."
        : null;
  const matrixRows = report.vmMatrixPreview.rows;
  const reportHistory = (assessment.reports ?? []).filter((entry) => entry.deletedAt === null);
  const migrationPlanReports = reportHistory.filter((entry) => entry.reportType === "blueprint");
  const migrationBlockingGates = migrationPlan.gates.filter((gate) => gate.blocksAdvancedPlan || gate.blocksProductionWave);
  const migrationGatePreview = migrationPlan.gates.slice(0, 4);
  const migrationCoverageEntries = Object.entries(migrationPlan.evidenceSummary.evidenceCoverage);
  const generateButtonLabel = report.commercialStatus.hasFullReportUnlocked
    ? "Generate Readiness Report PDF"
    : "Generate PDF Preview";

  return (
    <main className="dashboard-page report-preview-page">
      <section className="dashboard-hero glass-card">
        <div>
          <div className="badge badge-cyan">Report Preview</div>
          <h1>{assessment.title}</h1>
          <p>
            Preliminary report preview for {assessment.clientLabel ?? "the current assessment"}.
            {" "}
            {report.commercialStatus.hasFullReportUnlocked
              ? "The full readiness report is unlocked for this assessment."
              : "The full report remains locked until a plan is unlocked."}
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <form action={`/api/assessments/${assessment.id}/reports/generate`} method="post">
            <button type="submit" className="btn btn-primary btn-glow">
              <FileText size={16} />
              {generateButtonLabel}
            </button>
          </form>
          <Link href={`/dashboard/assessments/${assessment.id}`} className="btn btn-secondary">
            <ArrowLeft size={16} />
            Back to assessment
          </Link>
          <Link href="/shiftreadiness" className="btn btn-secondary">
            <SquareArrowOutUpRight size={16} />
            Locked sections overview
          </Link>
        </div>
      </section>

      {upgradeMessage ? <div className="dashboard-banner dashboard-banner-success" role="status" aria-live="polite">{upgradeMessage}</div> : null}
      {generatedMessage ? <div className="dashboard-banner dashboard-banner-success" role="status" aria-live="polite">{generatedMessage}</div> : null}
      {migrationPlanMessage ? <div className="dashboard-banner dashboard-banner-success" role="status" aria-live="polite">{migrationPlanMessage}</div> : null}
      {deletedMessage ? <div className="dashboard-banner dashboard-banner-success" role="status" aria-live="polite">{deletedMessage}</div> : null}
      {unlockMessage ? <div className="dashboard-banner dashboard-banner-success" role="status" aria-live="polite">{unlockMessage}</div> : null}
      {error ? <div className="dashboard-banner dashboard-banner-error" role="alert">{error}</div> : null}

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<BookOpen size={18} />}
          eyebrow="Premium deliverable"
          title="Migration Recommendation Plan"
          description="A separate migration-planning PDF driven by deterministic evidence gates. AI narrative can support wording, but it cannot override missing evidence or readiness blockers."
        />
        <div className="assessment-preview-grid report-preview-grid">
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Plan level</span>
            <strong>{statusLabel(migrationPlan.planLevel)}</strong>
            <p>{migrationPlan.executiveDecision}</p>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Evidence confidence</span>
            <strong>{statusLabel(migrationPlan.evidenceSummary.confidence)}</strong>
            <p>{migrationCoverageEntries.filter(([, included]) => included).length}/{migrationCoverageEntries.length} inputs available</p>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Blocking gates</span>
            <strong>{migrationBlockingGates.length}</strong>
            <p>{migrationBlockingGates.length === 0 ? "No deterministic blockers detected." : "Remediation required before advanced claims."}</p>
          </article>
        </div>

        <div className="assessment-status-row">
          {migrationCoverageEntries.map(([key, included]) => (
            <span key={key} className={`assessment-chip assessment-chip-${included ? "good" : "warning"}`}>
              {evidenceCoverageLabel(key)}: {included ? "available" : "missing"}
            </span>
          ))}
        </div>

        <div className="report-findings-list">
          {migrationGatePreview.map((gate) => (
            <article key={gate.key} className="glass-card report-finding-card">
              <div className="report-finding-head">
                <div>
                  <span className="assessment-preview-label">{statusLabel(gate.severity)}</span>
                  <h3>{statusLabel(gate.key)}</h3>
                </div>
                {renderStatusPill(statusLabel(gate.status), renderStatusTone(gate.status))}
              </div>
              <p>{gate.explanation}</p>
              <p className="assessment-inline-note">{gate.recommendation}</p>
            </article>
          ))}
        </div>

        <div className="assessment-inline-actions">
          <form
            action={`/api/assessments/${assessment.id}/reports/generate`}
            method="post"
            encType="multipart/form-data"
          >
            <input type="hidden" name="reportKind" value="migration_plan" />
            <button type="submit" className="btn btn-primary btn-glow">
              <BookOpen size={16} />
              Generate Migration Plan PDF
            </button>
          </form>
          {migrationPlanReports.length > 0 ? (
            <a href={`#generated-reports`} className="btn btn-secondary">
              View generated plans
            </a>
          ) : null}
          <span className="assessment-inline-note">
            Stored in report history as a private premium deliverable. Full-report access is required before generation.
          </span>
        </div>
      </section>

      <section className="assessment-section glass-card report-branding-section">
        <SectionTitle
          icon={<ImageIcon size={18} />}
          eyebrow="Report branding"
          title="Optional logos for this PDF"
          description="Generate a branded deliverable for your own company, or a white-label report for an end client. Branding is embedded in the generated PDF and does not change assessment data."
        />
        <form
          action={`/api/assessments/${assessment.id}/reports/generate`}
          method="post"
          encType="multipart/form-data"
          className="report-branding-form"
        >
          <div className="report-branding-mode-grid" role="radiogroup" aria-label="Report recipient">
            <label className="report-branding-mode">
              <input type="radio" name="reportAudience" value="own_company" defaultChecked />
              <span>
                <Building2 size={16} />
                For my company
              </span>
              <small>Use one logo and keep Shift Evidence attribution in the PDF footer.</small>
            </label>
            <label className="report-branding-mode">
              <input type="radio" name="reportAudience" value="client" />
              <span>
                <Building2 size={16} />
                For my client
              </span>
              <small>Use partner + client logos for consultants, MSPs and integrators.</small>
            </label>
          </div>

          <div className="report-branding-fields">
            <label>
              <span>Your company / partner name</span>
              <input type="text" name="companyName" maxLength={216} placeholder="Example: Partner Infrastructure Group" />
            </label>
            <label>
              <span>Your company / partner logo</span>
              <input type="file" name="companyLogo" accept="image/png,image/jpeg" />
            </label>
            <label>
              <span>End client name</span>
              <input type="text" name="clientName" maxLength={216} defaultValue={assessment.clientLabel ?? ""} placeholder="Optional for client-facing reports" />
            </label>
            <label>
              <span>End client logo</span>
              <input type="file" name="clientLogo" accept="image/png,image/jpeg" />
            </label>
          </div>

          <div className="assessment-inline-actions report-branding-actions">
            <button type="submit" className="btn btn-primary btn-glow">
              <FileText size={16} />
              Generate branded PDF
            </button>
            <span className="assessment-inline-note">
              PNG or JPG only, up to 1 MB each. White-label reports include “Powered by Shift Evidence”.
            </span>
          </div>
        </form>
      </section>

      <section className="assessment-summary-grid report-summary-grid">
        {report.reportCards.map((card) => (
          <ReportMetricCard key={card.label} {...card} />
        ))}
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<BadgePercent size={18} />}
          eyebrow="Commercial status"
          title="Free vs paid boundaries"
          description="Manual requests, entitlements and current access state are tracked here. No checkout or automatic billing is active yet."
        />
        <div className="assessment-status-row">
          {report.commercialStatus.chips.map((chip) => (
            <span key={chip.key} className={`assessment-chip assessment-chip-${chip.tone}`} title={chip.detail}>
              {chip.label}
            </span>
          ))}
        </div>
        <p className="assessment-inline-note">{report.commercialStatus.primaryDetail}</p>
        {report.commercialStatus.activeRequests.length === 0 ? (
          <p className="assessment-empty-note">No unlock requests have been created yet.</p>
        ) : (
          <div className="report-unlock-grid">
            {report.commercialStatus.activeRequests.map((request) => (
              <article key={request.id} className="glass-card report-history-card">
                <div className="report-history-header">
                  <div>
                    <span className="assessment-preview-label">{getUnlockRequestTypeLabel(request.requestedType)}</span>
                    <h3>{getUnlockRequestStatusLabel(request.status)}</h3>
                  </div>
                  {renderStatusPill(getUnlockRequestStatusLabel(request.status), getUnlockRequestStatusTone(request.status))}
                </div>
                <div className="report-history-meta">
                  <span>Requested: {dateLabel(request.createdAt)}</span>
                  <span>Amount: {formatMoneyCents(request.amountCents, request.currency)}</span>
                  <span>Contact: {request.contactEmail ?? "-"}</span>
                </div>
                {request.notes ? <p className="report-history-error">{request.notes}</p> : null}
                {request.adminNotes ? (
                  <p className="assessment-inline-note">Admin notes: {request.adminNotes}</p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<FileText size={18} />}
          eyebrow="Executive summary"
          title="Executive Summary Preview"
          description="A short, stakeholder-friendly view of the current assessment signal."
        />
        <div className="report-preview-copy">
          {report.executiveSummary.map((sentence) => (
            <p key={sentence}>{sentence}</p>
          ))}
        </div>
        <div className="report-preview-footer">
          {renderStatusPill(`Preview: ${statusLabel(completion.reportPreviewStatus)}`, renderStatusTone(completion.reportPreviewStatus))}
          {renderStatusPill(`Full report: ${statusLabel(report.fullReportStatus)}`, renderStatusTone(report.fullReportStatus))}
          {renderStatusPill(`PDF: ${statusLabel(completion.pdfStatus)}`, "neutral")}
        </div>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<PanelTop size={18} />}
          eyebrow="Technical summary"
          title="Technical Summary Preview"
          description="A compact technical readout for engineers before the full report is unlocked."
        />
        <ul className="assessment-bullet-list report-bullet-list">
          {report.technicalSummary.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="assessment-status-row">
          {renderStatusPill(`Source: ${report.sourceLabel}`, "neutral")}
          {renderStatusPill(`Confidence: ${report.evidenceConfidenceLabel}`, renderStatusTone(completion.evidenceConfidence))}
          {renderStatusPill(`Readiness: ${statusLabel(completion.completionStatus)}`, renderStatusTone(completion.completionStatus))}
        </div>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<BookOpen size={18} />}
          eyebrow="Migration context"
          title="Migration Context Summary"
          description="Human project context improves advisory quality. Missing context is shown as an evidence gap, not treated as a form error."
        />
        <div className="assessment-status-row">
          {renderStatusPill(`Coverage: ${report.migrationContext.coverage.overallPercent}%`, renderStatusTone(report.migrationContext.coverage.status))}
          {renderStatusPill(`Status: ${statusLabel(report.migrationContext.coverage.status)}`, renderStatusTone(report.migrationContext.coverage.status))}
          {renderStatusPill(`Missing key items: ${report.migrationContext.coverage.missingKeyContext.length}`, "neutral")}
        </div>
        <div className="assessment-preview-columns">
          <article className="glass-card assessment-subcard">
            <h3>Important user-provided context</h3>
            {report.migrationContext.importantContext.length === 0 ? (
              <p>No migration context has been provided yet.</p>
            ) : (
              <ul className="assessment-bullet-list">
                {report.migrationContext.importantContext.slice(0, 8).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </article>
          <article className="glass-card assessment-subcard">
            <h3>Missing context</h3>
            <ul className="assessment-bullet-list">
              {report.migrationContext.missingContext.slice(0, 8).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="glass-card assessment-subcard">
            <h3>Impact on confidence</h3>
            <p>{report.migrationContext.confidenceImpact}</p>
          </article>
        </div>
      </section>

      {shouldShowAiAdvisory(report) ? (
        <section className="assessment-section glass-card">
          <SectionTitle
            icon={<Sparkles size={18} />}
            eyebrow="Advisory notes"
            title="AI Advisory Notes"
            description="Optional sanitized advisory guidance. Deterministic readiness, confidence and risk findings remain the source of truth."
          />
          <div className="assessment-status-row">
            {renderStatusPill(`Provider: ${statusLabel(report.aiAdvisory.providerStatus)}`, "neutral")}
            {renderStatusPill(`Model: ${report.aiAdvisory.model ?? "not configured"}`, "neutral")}
          </div>
          <div className="assessment-preview-columns">
            <article className="glass-card assessment-subcard">
              <h3>Executive advisory</h3>
              <ul className="assessment-bullet-list">
                {report.aiAdvisory.executiveSummaryNotes.slice(0, 5).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="glass-card assessment-subcard">
              <h3>Technical advisory</h3>
              <ul className="assessment-bullet-list">
                {report.aiAdvisory.technicalNotes.slice(0, 5).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="glass-card assessment-subcard">
              <h3>Confidence impact</h3>
              <p>{report.aiAdvisory.confidenceImpact}</p>
            </article>
          </div>
          {report.aiAdvisory.missingContextQuestions.length > 0 ? (
            <div className="report-findings-list">
              {report.aiAdvisory.missingContextQuestions.slice(0, 5).map((item) => (
                <article key={item.question} className="glass-card report-finding-card">
                  <div className="report-finding-head">
                    <div>
                      <span className="assessment-preview-label">Follow-up question</span>
                      <h3>{item.question}</h3>
                    </div>
                    {renderStatusPill(statusLabel(item.priority), renderStatusTone(item.priority))}
                  </div>
                  <p>{item.whyItMatters}</p>
                </article>
              ))}
            </div>
          ) : null}
          <p className="assessment-inline-note">
            AI notes are generated only from sanitized metadata, scores, findings and context. Raw uploaded files,
            secrets, cookies and tokens are excluded.
          </p>
        </section>
      ) : null}

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<PanelTop size={18} />}
          eyebrow="Client context"
          title="Customer Context Intelligence"
          description="Structured interpretation of customer-provided context. The raw free-text narrative is not printed in the report."
        />
        <div className="assessment-status-row">
          {renderStatusPill(`Status: ${statusLabel(report.customerContextIntelligence.status)}`, renderStatusTone(report.customerContextIntelligence.status))}
          {renderStatusPill(
            `Context completeness: ${
              report.customerContextIntelligence.contextCompletenessScore !== null
                ? `${report.customerContextIntelligence.contextCompletenessScore}/100`
                : "not scored"
            }`,
            renderStatusTone(report.customerContextIntelligence.businessContextConfidence ?? "unknown"),
          )}
          {renderStatusPill(`Business confidence: ${statusLabel(report.customerContextIntelligence.businessContextConfidence ?? "unknown")}`, renderStatusTone(report.customerContextIntelligence.businessContextConfidence ?? "unknown"))}
        </div>
        {!report.customerContextIntelligence.included ? (
          <p className="assessment-empty-note">
            Customer Context Intelligence is not included or has not been analyzed for this assessment. Report generation
            continues normally because this module is optional.
          </p>
        ) : (
          <>
            <div className="report-finding-note">
              <strong>Context Provided - Interpreted Summary</strong>
              <p>{report.customerContextIntelligence.interpretedSummary ?? "No interpreted summary was persisted."}</p>
            </div>
            <div className="assessment-preview-columns">
              <article className="glass-card assessment-subcard">
                <h3>Business priorities</h3>
                {report.customerContextIntelligence.businessPriorities.length === 0 ? (
                  <p>No business priorities were extracted.</p>
                ) : (
                  <ul className="assessment-bullet-list">
                    {report.customerContextIntelligence.businessPriorities.slice(0, 5).map((item) => (
                      <li key={`${item.priority}-${item.confidence ?? "unknown"}`}>
                        <strong>{item.priority}</strong>
                        {item.confidence ? ` (${statusLabel(item.confidence)})` : ""}: {item.evidence ?? "Customer-reported priority."}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
              <article className="glass-card assessment-subcard">
                <h3>Validation items</h3>
                {report.customerContextIntelligence.validationItems.length === 0 ? (
                  <p>No validation items were extracted.</p>
                ) : (
                  <ul className="assessment-bullet-list">
                    {report.customerContextIntelligence.validationItems.slice(0, 5).map((item) => (
                      <li key={item.item}>
                        <strong>{statusLabel(item.priority ?? "medium")}:</strong> {item.item}
                        {item.whyItMatters ? ` - ${item.whyItMatters}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
              <article className="glass-card assessment-subcard">
                <h3>Next questions</h3>
                {report.customerContextIntelligence.nextQuestions.length === 0 ? (
                  <p>No next questions were extracted.</p>
                ) : (
                  <ul className="assessment-bullet-list">
                    {report.customerContextIntelligence.nextQuestions.slice(0, 5).map((item) => (
                      <li key={item.question}>{item.question}</li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          </>
        )}
        <p className="assessment-table-note">
          Customer-provided context is advisory. It may contain assumptions or unverified claims and must be validated
          against RVTools, backup exports, Proxmox target validation or other structured sources.
        </p>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<HardDrive size={18} />}
          eyebrow="Storage destination"
          title="Storage Destination Readiness"
          description="Report-ready storage destination signals based on source datastore evidence, target storage inputs and customer-provided storage context."
        />
        <div className="assessment-status-row">
          {renderStatusPill(`Status: ${statusLabel(report.storageDestinationReadiness.status)}`, renderStatusTone(report.storageDestinationReadiness.status))}
          {renderStatusPill(
            `Storage confidence: ${
              report.storageDestinationReadiness.storageEvidenceConfidence !== null
                ? `${report.storageDestinationReadiness.storageEvidenceConfidence}/100`
                : "not scored"
            }`,
            renderStatusTone(
              report.storageDestinationReadiness.storageEvidenceConfidence !== null &&
                report.storageDestinationReadiness.storageEvidenceConfidence >= 75
                ? "high"
                : report.storageDestinationReadiness.storageEvidenceConfidence !== null &&
                    report.storageDestinationReadiness.storageEvidenceConfidence >= 50
                  ? "medium"
                  : "limited",
            ),
          )}
          {renderStatusPill(`Target: ${statusLabel(report.storageDestinationReadiness.targetStoragePreference ?? "not_decided")}`, "neutral")}
          {renderStatusPill(
            `Ceph: ${statusLabel(report.storageDestinationReadiness.ceph.status ?? (report.storageDestinationReadiness.ceph.requestedOrConsidered ? "not_evaluated" : "not_selected"))}`,
            renderStatusTone(report.storageDestinationReadiness.ceph.status ?? "not_available"),
          )}
        </div>
        {!report.storageDestinationReadiness.included ? (
          <p className="assessment-empty-note">
            Storage Destination Readiness is not included or has not been analyzed for this assessment. Report generation
            continues normally because this module is optional.
          </p>
        ) : (
          <>
            <div className="assessment-summary-grid report-summary-grid">
              <article className="assessment-preview-card">
                <span className="assessment-preview-label">Destination readiness</span>
                <strong>
                  {report.storageDestinationReadiness.storageDestinationReadiness !== null
                    ? `${report.storageDestinationReadiness.storageDestinationReadiness}/100`
                    : "-"}
                </strong>
                <p>Target storage clarity signal</p>
              </article>
              <article className="assessment-preview-card">
                <span className="assessment-preview-label">Storage evidence</span>
                <strong>
                  {report.storageDestinationReadiness.storageEvidenceConfidence !== null
                    ? `${report.storageDestinationReadiness.storageEvidenceConfidence}/100`
                    : "-"}
                </strong>
                <p>Separate from technical confidence</p>
              </article>
              <article className="assessment-preview-card">
                <span className="assessment-preview-label">Migration risk</span>
                <strong>
                  {report.storageDestinationReadiness.storageMigrationRisk !== null
                    ? `${report.storageDestinationReadiness.storageMigrationRisk}/100`
                    : "-"}
                </strong>
                <p>Higher means storage migration riskier</p>
              </article>
              <article className="assessment-preview-card">
                <span className="assessment-preview-label">Ceph status</span>
                <strong>{statusLabel(report.storageDestinationReadiness.ceph.status ?? "not_selected")}</strong>
                <p>{report.storageDestinationReadiness.ceph.recommendedNextStep ? statusLabel(report.storageDestinationReadiness.ceph.recommendedNextStep) : "No Ceph next step"}</p>
              </article>
            </div>
            <div className="report-finding-note">
              <strong>Storage interpretation</strong>
              <p>
                {report.storageDestinationReadiness.interpretedStorageSummary ??
                  "Storage inputs are available, but no interpreted storage summary has been persisted yet."}
              </p>
            </div>
            <div className="assessment-preview-columns">
              <article className="glass-card assessment-subcard">
                <h3>Destination options</h3>
                {report.storageDestinationReadiness.destinationOptions.length === 0 ? (
                  <p>No destination options were persisted.</p>
                ) : (
                  <ul className="assessment-bullet-list">
                    {report.storageDestinationReadiness.destinationOptions.slice(0, 4).map((item) => (
                      <li key={`${item.option}-${item.suitability}`}>
                        <strong>{statusLabel(item.option)}:</strong> {statusLabel(item.suitability)} - {item.rationale}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
              <article className="glass-card assessment-subcard">
                <h3>Missing storage evidence</h3>
                {report.storageDestinationReadiness.missingStorageEvidence.length === 0 ? (
                  <p>No major storage evidence gaps were persisted.</p>
                ) : (
                  <ul className="assessment-bullet-list">
                    {report.storageDestinationReadiness.missingStorageEvidence.slice(0, 5).map((item) => (
                      <li key={item.item}>
                        <strong>{statusLabel(item.priority)}:</strong> {item.item} - {item.whyItMatters}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
              <article className="glass-card assessment-subcard">
                <h3>Ceph readiness</h3>
                {!report.storageDestinationReadiness.ceph.requestedOrConsidered ? (
                  <p>Ceph was not selected or strongly signaled. Storage readiness remains agnostic.</p>
                ) : (
                  <ul className="assessment-bullet-list">
                    <li>Status: {statusLabel(report.storageDestinationReadiness.ceph.status ?? "not_evaluated")}</li>
                    <li>Suitability: {report.storageDestinationReadiness.ceph.suitabilityScore !== null ? `${report.storageDestinationReadiness.ceph.suitabilityScore}/100` : "not scored"}</li>
                    <li>Operations: {report.storageDestinationReadiness.ceph.operationsReadinessScore !== null ? `${report.storageDestinationReadiness.ceph.operationsReadinessScore}/100` : "not scored"}</li>
                    <li>Next step: {report.storageDestinationReadiness.ceph.recommendedNextStep ? statusLabel(report.storageDestinationReadiness.ceph.recommendedNextStep) : "not provided"}</li>
                  </ul>
                )}
              </article>
            </div>
          </>
        )}
        <p className="assessment-table-note">
          Storage readiness is evidence-based and conservative. Ceph is not recommended by default, and raw storage
          narrative or file contents are not printed in the preview or PDF.
        </p>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<Users size={18} />}
          eyebrow="Environment"
          title="Environment Summary"
          description="The report preview starts with the measured environment, not assumptions."
        />
        <div className="assessment-summary-grid report-summary-grid">
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">VMs</span>
            <strong>{formatNumber(report.environmentSummary.vmCount)}</strong>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Hosts</span>
            <strong>{formatNumber(report.environmentSummary.hostCount)}</strong>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Datastores</span>
            <strong>{formatNumber(report.environmentSummary.datastoreCount)}</strong>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Snapshots</span>
            <strong>{formatNumber(report.environmentSummary.snapshotCount)}</strong>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Powered on</span>
            <strong>{formatNumber(report.environmentSummary.poweredOnVmCount)}</strong>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Powered off</span>
            <strong>{formatNumber(report.environmentSummary.poweredOffVmCount)}</strong>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Provisioned</span>
            <strong>{formatNumber(report.environmentSummary.totalProvisionedGb)}</strong>
            <p>GB provisioned</p>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Used</span>
            <strong>{formatNumber(report.environmentSummary.totalUsedGb)}</strong>
            <p>GB used</p>
          </article>
        </div>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<BadgePercent size={18} />}
          eyebrow="Cost / Risk"
          title="Cost / Risk Summary"
          description="The preview uses manual assumptions, parsed inventory or both depending on what is available."
        />
        <div className="assessment-preview-grid report-preview-grid">
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Annual delta</span>
            <strong>{formatMoney(report.costRiskPreview.annualSubscriptionDelta)}</strong>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">3-year delta</span>
            <strong>{formatMoney(report.costRiskPreview.threeYearSubscriptionDelta)}</strong>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Savings</span>
            <strong>{formatPercent(report.costRiskPreview.savingsPercent)}</strong>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Readiness</span>
            <strong>{report.costRiskPreview.readinessLabel ?? "—"}</strong>
          </article>
        </div>
        <div className="assessment-status-row">
          {renderStatusPill(`Source: ${report.sourceLabel}`, "neutral")}
          {renderStatusPill(`Risk: ${statusLabel(report.costRiskPreview.riskLevel ?? "low")}`, renderStatusTone(report.costRiskPreview.riskLevel ?? "low"))}
          {renderStatusPill(`Cost / Risk: ${statusLabel(report.costRiskStatus)}`, renderStatusTone(report.costRiskStatus))}
        </div>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<BadgePercent size={18} />}
          eyebrow="Licensing analysis"
          title="Licensing & Cost Exposure Analysis"
          description="A report-ready summary of VMware/Broadcom renewal exposure versus Proxmox subscription scenarios."
        />
        <div className="assessment-status-row">
          {renderStatusPill(`Status: ${statusLabel(report.licensingCostExposure.status)}`, renderStatusTone(report.licensingCostExposure.status))}
          {renderStatusPill(`Mode: ${statusLabel(report.licensingCostExposure.mode ?? "not_included")}`, renderStatusTone(report.licensingCostExposure.mode ?? "not_included"))}
          {renderStatusPill(`Currency: ${report.licensingCostExposure.currency}`, "neutral")}
          {renderStatusPill(`Pricing: ${statusLabel(report.licensingCostExposure.pricingFreshnessStatus ?? "unknown")}`, renderStatusTone(report.licensingCostExposure.pricingFreshnessStatus ?? "unknown"))}
        </div>
        {!report.licensingCostExposure.included ? (
          <p className="assessment-empty-note">
            Licensing analysis is not included or has not been generated for this assessment. The PDF will continue to
            generate normally without treating this optional module as a blocker.
          </p>
        ) : (
          <>
            <div className="assessment-preview-grid report-preview-grid">
              <article className="assessment-preview-card">
                <span className="assessment-preview-label">Financial confidence</span>
                <strong>
                  {report.licensingCostExposure.financialConfidenceScore !== null
                    ? `${report.licensingCostExposure.financialConfidenceScore}/100`
                    : "-"}
                </strong>
                <p>{report.licensingCostExposure.financialConfidenceLabel ?? "Not calculated"}</p>
              </article>
              <article className="assessment-preview-card">
                <span className="assessment-preview-label">Savings quality</span>
                <strong>{statusLabel(report.licensingCostExposure.savingsQuality ?? "unknown")}</strong>
              </article>
              <article className="assessment-preview-card">
                <span className="assessment-preview-label">Contract timing</span>
                <strong>{report.licensingCostExposure.contractTimingRisk?.label ?? "Unknown"}</strong>
                <p>{report.licensingCostExposure.contractTimingRisk?.daysToRenewal ?? "Unknown"} days to renewal</p>
              </article>
              <article className="assessment-preview-card">
                <span className="assessment-preview-label">3-year delta</span>
                <strong>{formatMoney(report.licensingCostExposure.comparison?.threeYearDeltaUsd ?? null)}</strong>
              </article>
            </div>
            {report.licensingCostExposure.executiveRecommendation ? (
              <div className="report-finding-note">
                <strong>{report.licensingCostExposure.executiveRecommendation.title}</strong>
                <p>{report.licensingCostExposure.executiveRecommendation.description}</p>
              </div>
            ) : null}
            <div className="assessment-preview-columns">
              <article className="glass-card assessment-subcard">
                <h3>Cost exposure findings</h3>
                {report.licensingCostExposure.licensingTraps.length === 0 ? (
                  <p>No major cost exposure findings were persisted.</p>
                ) : (
                  <ul className="assessment-bullet-list">
                    {report.licensingCostExposure.licensingTraps.slice(0, 4).map((trap) => (
                      <li key={`${trap.severity}-${trap.title}`}>
                        <strong>{statusLabel(trap.severity)}:</strong> {trap.title}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
              <article className="glass-card assessment-subcard">
                <h3>Missing financial evidence</h3>
                {report.licensingCostExposure.missingEvidence.length === 0 ? (
                  <p>No major financial evidence gaps were persisted.</p>
                ) : (
                  <ul className="assessment-bullet-list">
                    {report.licensingCostExposure.missingEvidence.slice(0, 5).map((item) => (
                      <li key={item.label}>{item.label}: {item.impact}</li>
                    ))}
                  </ul>
                )}
              </article>
              <article className="glass-card assessment-subcard">
                <h3>Pricing snapshots</h3>
                {report.licensingCostExposure.pricingSnapshotUsed.length === 0 ? (
                  <p>No approved pricing snapshot reference was persisted with this analysis.</p>
                ) : (
                  <ul className="assessment-bullet-list">
                    {report.licensingCostExposure.pricingSnapshotUsed.slice(0, 4).map((snapshot) => (
                      <li key={`${snapshot.vendor}-${snapshot.snapshotId ?? snapshot.sourceName}`}>
                        {statusLabel(snapshot.vendor)}: {snapshot.sourceName ?? snapshot.snapshotId ?? "Approved snapshot"}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          </>
        )}
        <p className="assessment-table-note">
          This is not a vendor quote. Final pricing must be validated with the customer&apos;s vendor, reseller or
          procurement channel. Storage cost modeling is still in development and is not included.
        </p>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<CircleAlert size={18} />}
          eyebrow="Findings"
          title="Top Findings"
          description="The most relevant risk signals currently visible in the preview."
        />
        {report.topFindings.length === 0 ? (
          <p className="assessment-empty-note">No findings have been generated yet.</p>
        ) : (
          <div className="report-findings-list">
            {report.topFindings.slice(0, 5).map((finding) => (
              <article key={finding.id} className="glass-card report-finding-card">
                <div className="report-finding-head">
                  <div>
                    <span className="assessment-preview-label">{finding.entityName ?? "Assessment"}</span>
                    <h3>{finding.title}</h3>
                  </div>
                  {renderStatusPill(statusLabel(finding.severity), renderStatusTone(finding.severity))}
                </div>
                <p>{finding.description}</p>
                {finding.recommendation ? (
                  <div className="report-finding-note">
                    <strong>Recommendation</strong>
                    <p>{finding.recommendation}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<Table2 size={18} />}
          eyebrow="Matrix preview"
          title="VM Risk Matrix Preview"
          description="A limited sample of the VM-by-VM matrix is visible here. The full matrix is locked in the pro report."
        />
          {matrixRows.length === 0 ? (
            <p className="assessment-empty-note">No parsed VMs available for the preview yet.</p>
          ) : (
            <>
              <div className="assessment-table-wrap">
              <table className="assessment-table">
                <thead>
                  <tr>
                    <th>VM</th>
                    <th>Power</th>
                    <th>Guest OS</th>
                    <th>CPU</th>
                    <th>RAM</th>
                    <th>Provisioned GB</th>
                    <th>Used GB</th>
                    <th>Datastore</th>
                    <th>Host</th>
                    <th>Risk</th>
                    <th>Main reason</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.slice(0, 10).map((row) => (
                    <tr key={row.vmName}>
                      <td>{row.vmName}</td>
                      <td>{row.powerState ?? "—"}</td>
                      <td>{row.guestOs ?? "—"}</td>
                      <td>{formatNumber(row.cpuCount)}</td>
                      <td>{formatNumber(row.memoryMb)}</td>
                      <td>{formatNumber(row.provisionedGb)}</td>
                      <td>{formatNumber(row.usedGb)}</td>
                      <td>{row.datastoreName ?? "—"}</td>
                      <td>{row.hostName ?? "—"}</td>
                      <td>{statusLabel(row.riskLevel)}</td>
                      <td>{row.mainReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {report.vmMatrixPreview.total > matrixRows.length ? (
              <p className="assessment-table-note">
                Showing the first {matrixRows.length} VMs only. Unlock the Pro Report for the full matrix and deeper filtering.
              </p>
            ) : null}
          </>
        )}
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<BookOpen size={18} />}
          eyebrow="Evidence"
          title="Missing Evidence"
          description="The preview keeps track of the signals still needed for a fuller report."
        />
        {report.missingEvidence.length === 0 ? (
          <p className="assessment-empty-note">No key evidence is missing for the current preview.</p>
        ) : (
          <ul className="assessment-bullet-list report-bullet-list">
            {report.missingEvidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </section>

      <section id="generated-reports" className="assessment-section glass-card">
        <SectionTitle
          icon={<FileText size={18} />}
          eyebrow="PDF Preview"
          title="Generated Reports"
          description="Generate, download and remove preliminary PDF previews stored privately for this assessment."
        />
        {reportHistory.length === 0 ? (
          <p className="assessment-empty-note">No PDF previews have been generated yet.</p>
        ) : (
          <div className="report-history-grid">
            {reportHistory.map((item) => (
              <ReportHistoryCard key={item.id} report={item} assessmentId={assessment.id} />
            ))}
          </div>
        )}
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<Lock size={18} />}
          eyebrow="Locked sections"
          title="Locked sections and upgrade boundaries"
          description="These report sections remain visually locked until the matching plan or add-on is unlocked."
        />
        <div className="report-locked-grid">
          {report.lockedSections.map((section) => {
            const { key, ...sectionProps } = section;
            return <LockedSectionCard key={key} {...sectionProps} />;
          })}
        </div>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<Sparkles size={18} />}
          eyebrow="Upgrade"
          title="Assessment package requests"
          description="The CTAs below track assessment package interest only. No checkout or automatic billing flow is active yet."
        />
        <div className="report-upgrade-grid">
          {report.upgradeButtons.map((button) => {
            const copy = getUpgradeCopy(button.triggerType);
            return (
              <article key={button.triggerType} className="glass-card report-upgrade-card">
                <span className="assessment-preview-label">{button.title}</span>
                <h3>{copy.title}</h3>
                <p>{copy.description}</p>
                <form action={requestUnlockAction.bind(null, assessment.id)}>
                  <input type="hidden" name="triggerType" value={button.triggerType} />
                  <input type="hidden" name="message" value={copy.description} />
                  <button type="submit" className="btn btn-secondary">
                    {button.ctaLabel}
                  </button>
                </form>
              </article>
            );
          })}
        </div>
        <div className="assessment-inline-actions">
          <Link href={`/dashboard/assessments/${assessment.id}`} className="btn btn-primary btn-glow">
            <RefreshCcw size={16} />
            Back to assessment
          </Link>
          <span className="assessment-inline-note">
            Preview created on {dateLabel(assessment.updatedAt)}. Plan: {report.planLabel}.
          </span>
        </div>
      </section>
    </main>
  );
}
