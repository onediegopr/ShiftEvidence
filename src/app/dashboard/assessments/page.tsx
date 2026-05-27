import { headers } from "next/headers";
import Link from "next/link";
import { ArrowRight, Plus, ShieldCheck, CircleAlert, BadgePercent } from "lucide-react";
import { auth } from "../../../lib/auth";
import { upsertUserProfileFromSession } from "../../../server/user/userProfileService";
import { ensureDefaultWorkspace } from "../../../server/workspace/workspaceService";
import { listAssessmentsForCurrentWorkspace } from "../../../server/assessments/assessmentService";
import { getEvidenceUploadStatus } from "../../../server/evidence/evidenceFileService";
import type { AssessmentListItem } from "../../../server/assessments/assessmentService";

type AssessmentsPageProps = {
  searchParams: Promise<{
    archived?: string;
  }>;
};

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getLifecycleStatus(assessment: AssessmentListItem) {
  const activeEvidenceFiles = assessment.evidenceFiles.filter((file) => file.deletedAt === null);
  const hasIntake = Boolean(assessment.infrastructureInput);
  const hasCostRiskSignals = Boolean(
    assessment.costRiskAssumptions?.vmwareLicenseModel ||
      assessment.costRiskAssumptions?.vmCount ||
      assessment.costRiskAssumptions?.annualVmwareCost ||
      assessment.costRiskAssumptions?.estimatedProxmoxCost ||
      assessment.costRiskAssumptions?.migrationComplexity ||
      assessment.costRiskAssumptions?.businessCriticality ||
      assessment.costRiskAssumptions?.riskTolerance,
  );
  const hasGeneratedReport = assessment.reports.some(
    (report) => report.deletedAt === null && report.status === "generated",
  );
  const hasFullReportUnlocked = assessment.entitlements.some(
    (entitlement) =>
      entitlement.entitlementKey === "full_report_unlocked" &&
      ["available", "purchased", "granted"].includes(entitlement.status),
  );
  const hasParsedEvidence = activeEvidenceFiles.some((file) => file.processingStatus === "parsed");

  if (assessment.archivedAt || assessment.status === "archived") {
    return { label: "Archived", tone: "neutral" as const };
  }

  if (hasFullReportUnlocked || hasGeneratedReport) {
    return { label: "Report ready", tone: "good" as const };
  }

  if (hasParsedEvidence) {
    return { label: "Inventory ready", tone: "good" as const };
  }

  if (activeEvidenceFiles.length > 0) {
    return { label: "Evidence uploaded", tone: "good" as const };
  }

  if (hasIntake && hasCostRiskSignals) {
    return { label: "Basics complete", tone: "good" as const };
  }

  if (hasIntake || hasCostRiskSignals || assessment.preliminaryResult) {
    return { label: "In progress", tone: "warning" as const };
  }

  return { label: "Draft", tone: "neutral" as const };
}

export default async function AssessmentsPage({ searchParams }: AssessmentsPageProps) {
  const resolvedSearchParams = await searchParams;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
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
  }

  const assessments = session
    ? await listAssessmentsForCurrentWorkspace({
        userId: session.user.id,
      })
    : [];

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero glass-card">
        <div>
          <div className="badge badge-cyan">Assessments</div>
          <h1>Assessment workspace</h1>
          <p>
            Your assessments are saved in this workspace. Return anytime to continue in-progress
            work, upload more evidence, or generate reports when ready.
          </p>
        </div>
        <Link href="/dashboard/assessments/new" className="btn btn-primary btn-glow">
          <Plus size={16} />
          New assessment
        </Link>
      </section>

      {resolvedSearchParams?.archived === "1" ? (
        <div className="dashboard-banner dashboard-banner-success">
          Assessment archived successfully.
        </div>
      ) : null}

      {assessments.length === 0 ? (
        <section className="glass-card dashboard-empty">
          <ShieldCheck size={22} />
          <h2>No assessments yet</h2>
          <p>
            Start with a draft assessment. Your progress is saved, so you can come back later,
            continue intake, upload evidence, and generate reports when ready.
          </p>
          <Link href="/dashboard/assessments/new" className="btn btn-secondary">
            Create first assessment
          </Link>
        </section>
      ) : (
        <section className="dashboard-grid assessments-list">
          {assessments.map((assessment) => {
            const preview = assessment.preliminaryResult;
            const riskLevel = preview?.riskLevel ?? "unknown";
            const rvtoolsStatus = getEvidenceUploadStatus(assessment);
            const lifecycleStatus = getLifecycleStatus(assessment);
            const storageLabel = assessment.storageReadinessEnabled
              ? assessment.storageReadinessStatus === "selected"
                ? "Selected"
                : "Pending"
              : "Not selected";
            const completion = preview ? "Preview ready" : "Preview missing";

            return (
              <article key={assessment.id} className="glass-card dashboard-card assessment-card">
                <div className="assessment-card-top">
                  <ShieldCheck size={22} />
                  <div className="assessment-card-headline">
                    <h2>{assessment.title}</h2>
                    <p>{assessment.clientLabel ?? "No client label yet"}</p>
                  </div>
                </div>

                <div className="assessment-meta">
                  <span className={`assessment-chip assessment-chip-${lifecycleStatus.tone}`}>
                    {lifecycleStatus.label}
                  </span>
                  <span className="assessment-chip">DB status: {assessment.status}</span>
                  <span className="assessment-chip">Storage: {storageLabel}</span>
                  <span className="assessment-chip">Plan: {assessment.planLevel}</span>
                  <span className="assessment-chip">RVTools: {rvtoolsStatus === "uploaded" ? "Uploaded" : rvtoolsStatus === "parsed" ? "Parsed" : rvtoolsStatus === "deleted" ? "Deleted" : rvtoolsStatus === "failed" ? "Failed" : "Not uploaded yet"}</span>
                  <span className="assessment-chip">Updated: {formatDate(assessment.updatedAt)}</span>
                </div>

                <div className="assessment-preview-strip">
                  <div>
                    <span className="assessment-preview-label">Risk</span>
                    <strong>{riskLevel === "unknown" ? "Not calculated" : String(riskLevel)}</strong>
                  </div>
                  <div>
                    <span className="assessment-preview-label">Annual delta</span>
                    <strong>{formatMoney(preview?.annualSubscriptionDelta ?? null)}</strong>
                  </div>
                  <div>
                    <span className="assessment-preview-label">Completion</span>
                    <strong>{completion}</strong>
                  </div>
                </div>

                <div className="assessment-card-footer">
                  <span className="assessment-card-note">
                    {preview?.readinessLabel ?? "Manual intake and assumptions required"}
                  </span>
                  <Link href={`/dashboard/assessments/${assessment.id}`} className="dashboard-card-link">
                    Continue assessment <ArrowRight size={16} />
                  </Link>
                </div>

                {preview && Array.isArray(preview.missingEvidenceJson) && preview.missingEvidenceJson.length > 0 ? (
                  <div className="assessment-warning">
                    <CircleAlert size={16} />
                    <span>Missing evidence remains before this moves beyond a preliminary signal.</span>
                  </div>
                ) : null}
                {assessment.preliminaryResult ? (
                  <div className="assessment-warning assessment-warning-success">
                    <BadgePercent size={16} />
                    <span>Preliminary preview saved in Neon.</span>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
