import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BadgePercent,
  BookOpen,
  CircleAlert,
  FileText,
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
import { prisma } from "../../../../../lib/prisma";
import { findAssessmentForUser, assessmentDetailInclude, type AssessmentDetail } from "../../../../../server/assessments/assessmentService";
import { getAssessmentCompletionStatus } from "../../../../../server/assessments/assessmentCompletionService";
import { getReportPreviewData, type ReportPreviewData } from "../../../../../server/reports/reportPreviewService";
import { getReportStatusLabel, getReportStatusTone, getReportTypeLabel } from "../../../../../server/reports/reportHistoryService";
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
      deleted?: string;
      unlock?: string;
    }
    | Promise<{
        upgrade?: string;
        error?: string;
        generated?: string;
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
    case "fulfilled":
    case "strong":
      return "good" as const;
    case "partial":
    case "pending":
    case "approved":
    case "locked":
    case "not_available_yet":
    case "not_generated":
    case "generating":
    case "limited":
    case "limited_with_warnings":
    case "missing":
      return "warning" as const;
    case "rejected":
      return "danger" as const;
    case "failed":
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
        title: "Unlock Readiness Report",
        description: "Open the full report structure for executive-ready output and deeper technical narrative.",
      };
    case "unlock_pro_clicked":
      return {
        title: "Unlock Pro Report",
        description: "Unlock the full VM-by-VM matrix and the deeper operational sections reserved for larger assessments.",
      };
    case "storage_addon_clicked":
      return {
        title: "Add Storage Readiness",
        description: "Request the storage-specific add-on when target architecture validation needs more depth.",
      };
    case "review_call_clicked":
      return {
        title: "Book Technical Review",
        description: "Record interest in a technical review path for assumptions and next-step guidance.",
      };
    default:
      return {
        title: "Upgrade intent recorded",
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
    assessment = await prisma.assessment.findFirst({
      where: {
        id: parsedId,
        archivedAt: null,
      },
      include: assessmentDetailInclude,
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
      <span className={`assessment-chip assessment-chip-${tone}`}>{label}</span>
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
  const query = await Promise.resolve(searchParams);
  const upgrade = query?.upgrade === "1";
  const error = query?.error ? decodeURIComponent(query.error) : null;
  const generated = query?.generated === "1";
  const deleted = query?.deleted === "1";
  const unlock = query?.unlock ?? null;
  const upgradeMessage = upgrade ? "Upgrade intent captured. Checkout is not available yet." : null;
  const generatedMessage = generated ? "PDF Preview generated and stored privately." : null;
  const deletedMessage = deleted ? "PDF Preview deleted and removed from private storage." : null;
  const unlockMessage =
    unlock === "created" || unlock === "existing"
      ? "Request received. We’ll contact you to complete payment and unlock this report."
      : unlock === "already_unlocked"
        ? "This report path is already unlocked."
        : null;
  const matrixRows = report.vmMatrixPreview.rows;
  const reportHistory = (assessment.reports ?? []).filter((entry) => entry.deletedAt === null);
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

      {upgradeMessage ? <div className="dashboard-banner dashboard-banner-success">{upgradeMessage}</div> : null}
      {generatedMessage ? <div className="dashboard-banner dashboard-banner-success">{generatedMessage}</div> : null}
      {deletedMessage ? <div className="dashboard-banner dashboard-banner-success">{deletedMessage}</div> : null}
      {unlockMessage ? <div className="dashboard-banner dashboard-banner-success">{unlockMessage}</div> : null}
      {error ? <div className="dashboard-banner dashboard-banner-error">{error}</div> : null}

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
          description="Manual unlock requests, entitlements and current access state are tracked here. No checkout is active yet."
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

      <section className="assessment-section glass-card">
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
          title="Upgrade options"
          description="The CTAs below track upgrade intent only. No checkout or billing flow is active yet."
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
