import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  Archive,
  ArrowRight,
  BadgePercent,
  CircleAlert,
  Database,
  Download,
  FileText,
  Layers3,
  RefreshCcw,
  ShieldCheck,
  Server,
  Trash2,
  Upload,
} from "lucide-react";
import { auth } from "../../../../lib/auth";
import { upsertUserProfileFromSession } from "../../../../server/user/userProfileService";
import { ensureDefaultWorkspace } from "../../../../server/workspace/workspaceService";
import {
  findAssessmentForUser,
  type AssessmentDetail,
} from "../../../../server/assessments/assessmentService";
import {
  getInfrastructureInputSummary,
} from "../../../../server/assessments/infrastructureInputService";
import {
  getCostRiskStatus,
  getPreliminaryCostRiskPreview,
} from "../../../../server/assessments/costRiskService";
import {
  getAssessmentCompletionStatus,
  getMissingEvidenceSummary,
  getNextStepsSummary,
} from "../../../../server/assessments/assessmentCompletionService";
import {
  getEvidenceUploadStatus,
  getLatestRvtoolsEvidence,
} from "../../../../server/evidence/evidenceFileService";
import { getMaxUploadSizeBytes } from "../../../../server/evidence/uploadValidation";
import {
  getEvidenceConfidenceLabel,
  getInventoryStatusLabel,
  getParsedInventorySnapshot,
} from "../../../../server/rvtools/rvtoolsInventoryService";
import { getCommercialStatusForAssessment } from "../../../../server/unlocks/unlockRequestService";
import {
  generateInventoryRiskAction,
} from "./risk/actions";
import {
  archiveAssessmentAction,
  saveCostRiskAssumptionsAction,
  saveInfrastructureInputAction,
  toggleStorageReadinessAction,
  updateAssessmentBasicsAction,
} from "./actions";
import {
  deleteEvidenceAction,
  parseRvtoolsEvidenceAction,
  uploadEvidenceAction,
} from "./evidence/actions";
import {
  getFindingCountsBySeverity,
  getTopFindings,
  getVisibleFindingsForFreePlan,
  getVmRiskMatrixRows,
} from "../../../../server/risk/riskFindingService";

type AssessmentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: {
    error?: string;
    saved?: string;
    risk?: string;
    power?: string;
  };
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

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
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

function renderStatusPill(label: string, tone: "neutral" | "good" | "warning" | "danger") {
  return <span className={`assessment-chip assessment-chip-${tone}`}>{label}</span>;
}

function renderStatusTone(value: string) {
  switch (value) {
    case "complete":
    case "selected":
    case "skipped":
    case "uploaded":
    case "parsed":
    case "fulfilled":
      return "good" as const;
    case "partial":
    case "pending":
    case "approved":
    case "deleted":
    case "failed":
      return "warning" as const;
    case "rejected":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

function statusLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

function formatBytes(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  const kib = value / 1024;
  if (kib < 1024) {
    return `${kib.toFixed(1)} KiB`;
  }

  const mib = kib / 1024;
  if (mib < 1024) {
    return `${mib.toFixed(1)} MiB`;
  }

  return `${(mib / 1024).toFixed(1)} GiB`;
}

function evidenceTypeLabel(value: string) {
  switch (value) {
    case "rvtools":
      return "RVTools export";
    case "manual_csv":
      return "Manual CSV";
    case "veeam":
      return "Veeam";
    case "proxmox":
      return "Proxmox";
    case "network":
      return "Network";
    case "cmdb":
      return "CMDB";
    default:
      return "Other";
  }
}

function riskSeverityLabel(value: string) {
  switch (value) {
    case "critical":
      return "Critical";
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return "Info";
  }
}

function riskSeverityTone(value: string) {
  switch (value) {
    case "critical":
    case "high":
      return "danger" as const;
    case "medium":
      return "warning" as const;
    case "low":
      return "good" as const;
    default:
      return "neutral" as const;
  }
}

function riskCategoryLabel(value: string) {
  switch (value) {
    case "vm":
      return "VM";
    case "host":
      return "Host";
    case "datastore":
      return "Datastore";
    case "snapshot":
      return "Snapshot";
    case "evidence":
      return "Evidence";
    case "storage":
      return "Storage";
    case "cost":
      return "Cost";
    case "readiness":
      return "Readiness";
    default:
      return value;
  }
}

function dataSourceLabel(value: string) {
  switch (value) {
    case "parsed_inventory":
      return "Parsed RVTools inventory";
    case "mixed":
      return "Parsed RVTools inventory + manual assumptions";
    default:
      return "Manual input";
  }
}

function buildMatrixHref(params: {
  assessmentId: string;
  risk?: string | null;
  power?: string | null;
}) {
  const url = new URL(`/dashboard/assessments/${params.assessmentId}`, "http://localhost");
  if (params.risk && params.risk !== "all") {
    url.searchParams.set("risk", params.risk);
  }
  if (params.power && params.power !== "all") {
    url.searchParams.set("power", params.power);
  }
  return `${url.pathname}${url.search}`;
}

type InventoryColumn<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
};

function InventoryTable<T>({
  title,
  rows,
  columns,
  emptyMessage,
  limit = 25,
  note,
}: {
  title: string;
  rows: T[];
  columns: InventoryColumn<T>[];
  emptyMessage: string;
  limit?: number;
  note?: string;
}) {
  const visibleRows = rows.slice(0, limit);

  return (
    <article className="glass-card assessment-subcard assessment-inventory-table-card">
      <div className="assessment-inventory-table-head">
        <h3>{title}</h3>
        <span className="assessment-inline-note">
          Showing {visibleRows.length}
          {rows.length > limit ? ` of ${rows.length}` : ""} rows
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="assessment-empty-note">{emptyMessage}</p>
      ) : (
        <>
          <div className="assessment-table-wrap">
            <table className="assessment-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className={column.className}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, index) => (
                  <tr key={index}>
                    {columns.map((column) => (
                      <td key={column.key} className={column.className}>
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {note ? <p className="assessment-table-note">{note}</p> : null}
        </>
      )}
    </article>
  );
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

async function getAssessment(params: AssessmentDetailPageProps["params"]) {
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

  const assessment = await findAssessmentForUser({
    userId: session.user.id,
    assessmentId: id,
  });

  if (!assessment) {
    notFound();
  }

  return assessment;
}

function getEditBasicsDefaults(assessment: AssessmentDetail) {
  return {
    title: assessment.title,
    clientLabel: assessment.clientLabel ?? "",
  };
}

export default async function AssessmentDetailPage({
  params,
  searchParams,
}: AssessmentDetailPageProps) {
  const assessment = await getAssessment(params);
  const completion = getAssessmentCompletionStatus(assessment);
  const preview = getPreliminaryCostRiskPreview(assessment);
  const infraSummary = getInfrastructureInputSummary(assessment);
  const missingEvidence = getMissingEvidenceSummary(assessment);
  const nextSteps = getNextStepsSummary(assessment);
  const costRiskStatus = getCostRiskStatus(assessment);
  const error = searchParams?.error ? decodeURIComponent(searchParams.error) : null;
  const saved = searchParams?.saved === "1";
  const storageStatus = assessment.storageReadinessEnabled
    ? assessment.storageReadinessStatus === "selected"
      ? "Selected"
      : "Pending"
    : "Not selected";
  const rvtoolsStatus = getEvidenceUploadStatus(assessment);
  const latestRvtoolsEvidence = getLatestRvtoolsEvidence(assessment);
  const parsedInventory = getParsedInventorySnapshot(assessment);
  const inventoryStatus = parsedInventory?.inventoryStatus ?? "not_available";
  const evidenceConfidence = parsedInventory?.evidenceConfidence ?? "limited";
  const riskFindings = assessment.riskFindings ?? [];
  const assessmentScore = assessment.assessmentScore ?? null;
  const riskCounts = getFindingCountsBySeverity(riskFindings);
  const topRiskFindings = getTopFindings(assessment, 8);
  const visibleRiskFindings = getVisibleFindingsForFreePlan(assessment);
  const vmRiskMatrix = getVmRiskMatrixRows({
    assessment,
    risk: searchParams?.risk ?? "all",
    power: searchParams?.power ?? "all",
    limit: 50,
  });
  const riskSourceLabel = preview.dataSourceLabel ?? dataSourceLabel(preview.dataSource ?? "manual");
  const commercialStatus = getCommercialStatusForAssessment(assessment);
  const canGenerateRiskInsights = Boolean(latestRvtoolsEvidence || parsedInventory?.summary);
  const maxUploadSizeMb = Math.round(getMaxUploadSizeBytes() / 1024 / 1024);
  const evidenceFiles = assessment.evidenceFiles ?? [];

  const editDefaults = getEditBasicsDefaults(assessment);

  return (
    <main className="dashboard-page assessment-detail-page">
      <section className="dashboard-hero glass-card">
        <div>
          <div className="badge badge-cyan">Assessment detail</div>
          <h1>{assessment.title}</h1>
          <p>
            {assessment.clientLabel ?? "No client label yet"} ? {assessment.assessmentType} ?{" "}
            {assessment.planLevel}
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <Link href="/dashboard/assessments/new" className="btn btn-primary btn-glow">
            <ArrowRight size={16} />
            Create another
          </Link>
          <form action={archiveAssessmentAction.bind(null, assessment.id)}>
            <button type="submit" className="btn btn-secondary">
              <Archive size={16} />
              Archive
            </button>
          </form>
        </div>
      </section>

      {saved ? <div className="dashboard-banner dashboard-banner-success">Changes saved.</div> : null}
      {error ? <div className="dashboard-banner dashboard-banner-error">{error}</div> : null}

      <section className="assessment-summary-grid">
        <article className="glass-card assessment-summary-card">
          <ShieldCheck size={22} />
          <span className="assessment-summary-label">Completion</span>
          <strong>{formatNumber(completion.completionScore)}%</strong>
          <p>{statusLabel(completion.completionStatus)}</p>
        </article>
        <article className="glass-card assessment-summary-card">
          <BadgePercent size={22} />
          <span className="assessment-summary-label">Risk</span>
          <strong>{preview.riskLevel ? statusLabel(preview.riskLevel) : "Not calculated"}</strong>
          <p>{preview.readinessLabel ?? "Preliminary signal pending"}</p>
        </article>
        <article className="glass-card assessment-summary-card">
          <Database size={22} />
          <span className="assessment-summary-label">Storage</span>
          <strong>{storageStatus}</strong>
          <p>{assessment.storageReadinessEnabled ? "Optional module selected" : "Optional module skipped"}</p>
        </article>
        <article className="glass-card assessment-summary-card">
          <Activity size={22} />
          <span className="assessment-summary-label">Preview</span>
          <strong>{formatMoney(preview.annualSubscriptionDelta)}</strong>
          <p>Annual subscription delta</p>
        </article>
        <article className="glass-card assessment-summary-card">
          <FileText size={22} />
          <span className="assessment-summary-label">Commercial</span>
          <strong>{commercialStatus.primaryLabel}</strong>
          <p>{commercialStatus.primaryDetail}</p>
        </article>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<FileText size={18} />}
          eyebrow="Report preview"
          title="Preview the report before unlocking it"
          description="The report preview packages the current evidence into a structured preview, while the full report and export remain locked."
        />
        <div className="assessment-status-row">
          {renderStatusPill(`Preview: ${statusLabel(completion.reportPreviewStatus)}`, renderStatusTone(completion.reportPreviewStatus))}
          {renderStatusPill(`Full report: ${statusLabel(completion.fullReportStatus)}`, "neutral")}
          {renderStatusPill(`PDF Preview: ${statusLabel(completion.pdfStatus)}`, "neutral")}
        </div>
        <div className="assessment-preview-columns">
          <article className="glass-card assessment-subcard">
            <h3>What the preview includes</h3>
            <ul className="assessment-bullet-list">
              <li>Executive summary preview</li>
              <li>Technical summary preview</li>
              <li>Environment summary</li>
              <li>Cost / Risk summary</li>
              <li>Top findings and a limited matrix sample</li>
            </ul>
          </article>
          <article className="glass-card assessment-subcard">
            <h3>What stays locked</h3>
            <ul className="assessment-bullet-list">
              <li>Full VM-by-VM matrix</li>
              <li>Migration waves</li>
              <li>Proxmox sizing</li>
              <li>Storage strategy</li>
              <li>Executive PDF export</li>
            </ul>
          </article>
          <article className="glass-card assessment-subcard">
            <h3>Upgrade intent</h3>
            <p>Upgrade CTA clicks are tracked, but billing and checkout are not active yet.</p>
            <Link href={`/dashboard/assessments/${assessment.id}/report`} className="btn btn-primary btn-glow">
              <FileText size={16} />
              View Report Preview
            </Link>
          </article>
          <article className="glass-card assessment-subcard">
            <h3>Commercial status</h3>
            <p>{commercialStatus.primaryDetail}</p>
            <div className="assessment-status-row">
              {commercialStatus.chips.map((chip) => (
                <span key={chip.key} className={`assessment-chip assessment-chip-${chip.tone}`} title={chip.detail}>
                  {chip.label}
                </span>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<Layers3 size={18} />}
          eyebrow="Overview"
          title="Assessment overview"
          description="Keep the title and client label aligned with the migration decision context."
        />
        <form action={updateAssessmentBasicsAction.bind(null, assessment.id)} className="assessment-form-grid">
          <label className="form-label">
            Assessment title
            <input
              name="title"
              className="form-input"
              type="text"
              defaultValue={editDefaults.title}
            />
          </label>
          <label className="form-label">
            Client / company label
            <input
              name="clientLabel"
              className="form-input"
              type="text"
              defaultValue={editDefaults.clientLabel}
              placeholder="Optional enterprise or client label"
            />
          </label>

          <div className="assessment-inline-actions">
            <button type="submit" className="btn btn-primary btn-glow">
              Save overview
              <RefreshCcw size={16} />
            </button>
            <span className="assessment-inline-note">
              Last updated {dateLabel(assessment.updatedAt)}
            </span>
          </div>
        </form>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<Server size={18} />}
          eyebrow="Infrastructure Intake"
          title="Manual infrastructure intake"
          description="Manual intake lets you create a preliminary signal before RVTools upload is available."
        />

        <div className="assessment-status-row">
          {renderStatusPill(`State: ${statusLabel(infraSummary.status)}`, renderStatusTone(infraSummary.status))}
          {renderStatusPill(`Workspace: ${assessment.workspace.name}`, "neutral")}
        </div>

        <form action={saveInfrastructureInputAction.bind(null, assessment.id)} className="assessment-form-grid assessment-form-grid-wide">
          <label className="form-label">
            VM count
            <input name="vmCount" className="form-input" type="number" min="0" step="1" defaultValue={assessment.infrastructureInput?.vmCount ?? ""} />
          </label>
          <label className="form-label">
            Host count
            <input name="hostCount" className="form-input" type="number" min="0" step="1" defaultValue={assessment.infrastructureInput?.hostCount ?? ""} />
          </label>
          <label className="form-label">
            Cluster count
            <input name="clusterCount" className="form-input" type="number" min="0" step="1" defaultValue={assessment.infrastructureInput?.clusterCount ?? ""} />
          </label>
          <label className="form-label">
            Socket count
            <input name="socketCount" className="form-input" type="number" min="0" step="1" defaultValue={assessment.infrastructureInput?.socketCount ?? assessment.costRiskAssumptions?.socketCount ?? ""} />
          </label>
          <label className="form-label">
            Core count
            <input name="coreCount" className="form-input" type="number" min="0" step="1" defaultValue={assessment.infrastructureInput?.coreCount ?? assessment.costRiskAssumptions?.coreCount ?? ""} />
          </label>
          <label className="form-label">
            Total RAM GB
            <input name="totalRamGb" className="form-input" type="number" min="0" step="0.1" defaultValue={assessment.infrastructureInput?.totalRamGb ?? ""} />
          </label>
          <label className="form-label">
            Storage footprint TB
            <input name="storageFootprintTb" className="form-input" type="number" min="0" step="0.1" defaultValue={assessment.infrastructureInput?.storageFootprintTb ?? ""} />
          </label>
          <label className="form-label">
            Used storage TB
            <input name="usedStorageTb" className="form-input" type="number" min="0" step="0.1" defaultValue={assessment.infrastructureInput?.usedStorageTb ?? ""} />
          </label>
          <label className="form-label">
            Snapshot count
            <input name="snapshotCount" className="form-input" type="number" min="0" step="1" defaultValue={assessment.infrastructureInput?.snapshotCount ?? ""} />
          </label>
          <label className="form-label">
            Critical workload count
            <input name="criticalWorkloadCount" className="form-input" type="number" min="0" step="1" defaultValue={assessment.infrastructureInput?.criticalWorkloadCount ?? ""} />
          </label>
          <label className="form-label">
            Large VM count
            <input name="largeVmCount" className="form-input" type="number" min="0" step="1" defaultValue={assessment.infrastructureInput?.largeVmCount ?? ""} />
          </label>
          <label className="form-label">
            Powered-off VM count
            <input name="poweredOffVmCount" className="form-input" type="number" min="0" step="1" defaultValue={assessment.infrastructureInput?.poweredOffVmCount ?? ""} />
          </label>
          <label className="form-label assessment-form-span-2">
            Notes
            <textarea
              name="notes"
              className="form-input assessment-textarea"
              defaultValue={assessment.infrastructureInput?.notes ?? ""}
              placeholder="Optional intake notes, assumptions or constraints."
            />
          </label>

          <div className="assessment-inline-actions assessment-form-span-2">
            <button type="submit" className="btn btn-primary btn-glow">
              Save intake
              <RefreshCcw size={16} />
            </button>
            <span className="assessment-inline-note">
              Status: {statusLabel(infraSummary.status)}
            </span>
          </div>
        </form>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<BadgePercent size={18} />}
          eyebrow="Cost / Risk Assumptions"
          title="Cost / Risk Engine assumptions"
          description="Cost / Risk is preliminary and based on provided assumptions."
        />

        <div className="assessment-status-row">
          {renderStatusPill(`State: ${statusLabel(costRiskStatus)}`, renderStatusTone(costRiskStatus))}
          {renderStatusPill(`Currency: ${assessment.costRiskAssumptions?.currency ?? "USD"}`, "neutral")}
          {renderStatusPill(`Years: ${assessment.costRiskAssumptions?.years ?? 3}`, "neutral")}
        </div>

        <form action={saveCostRiskAssumptionsAction.bind(null, assessment.id)} className="assessment-form-grid assessment-form-grid-wide">
          <label className="form-label">
            Currency
            <input
              name="currency"
              className="form-input"
              type="text"
              defaultValue={assessment.costRiskAssumptions?.currency ?? "USD"}
            />
          </label>
          <label className="form-label">
            Years
            <input
              name="years"
              className="form-input"
              type="number"
              min="1"
              max="10"
              step="1"
              defaultValue={assessment.costRiskAssumptions?.years ?? 3}
            />
          </label>
          <label className="form-label">
            VMware license model
            <input
              name="vmwareLicenseModel"
              className="form-input"
              type="text"
              defaultValue={assessment.costRiskAssumptions?.vmwareLicenseModel ?? ""}
              placeholder="Example: subscription, perpetual, bundle"
            />
          </label>
          <label className="form-label">
            VM count
            <input
              name="vmCount"
              className="form-input"
              type="number"
              min="0"
              step="1"
              defaultValue={assessment.costRiskAssumptions?.vmCount ?? assessment.infrastructureInput?.vmCount ?? ""}
            />
          </label>
          <label className="form-label">
            Socket count
            <input
              name="socketCount"
              className="form-input"
              type="number"
              min="0"
              step="1"
              defaultValue={assessment.costRiskAssumptions?.socketCount ?? assessment.infrastructureInput?.socketCount ?? ""}
            />
          </label>
          <label className="form-label">
            Core count
            <input
              name="coreCount"
              className="form-input"
              type="number"
              min="0"
              step="1"
              defaultValue={assessment.costRiskAssumptions?.coreCount ?? assessment.infrastructureInput?.coreCount ?? ""}
            />
          </label>
          <label className="form-label">
            Annual VMware cost
            <input
              name="annualVmwareCost"
              className="form-input"
              type="number"
              min="0"
              step="0.01"
              defaultValue={assessment.costRiskAssumptions?.annualVmwareCost ? Number(assessment.costRiskAssumptions.annualVmwareCost) : ""}
            />
          </label>
          <label className="form-label">
            Estimated Proxmox cost
            <input
              name="estimatedProxmoxCost"
              className="form-input"
              type="number"
              min="0"
              step="0.01"
              defaultValue={assessment.costRiskAssumptions?.estimatedProxmoxCost ? Number(assessment.costRiskAssumptions.estimatedProxmoxCost) : ""}
            />
          </label>
          <label className="form-label">
            Migration complexity
            <input
              name="migrationComplexity"
              className="form-input"
              type="text"
              defaultValue={assessment.costRiskAssumptions?.migrationComplexity ?? ""}
              placeholder="Low / medium / high"
            />
          </label>
          <label className="form-label">
            Business criticality
            <input
              name="businessCriticality"
              className="form-input"
              type="text"
              defaultValue={assessment.costRiskAssumptions?.businessCriticality ?? ""}
              placeholder="Low / medium / high"
            />
          </label>
          <label className="form-label">
            Risk tolerance
            <input
              name="riskTolerance"
              className="form-input"
              type="text"
              defaultValue={assessment.costRiskAssumptions?.riskTolerance ?? ""}
              placeholder="Conservative / balanced / aggressive"
            />
          </label>

          <div className="assessment-inline-actions assessment-form-span-2">
            <button type="submit" className="btn btn-primary btn-glow">
              Save assumptions
              <RefreshCcw size={16} />
            </button>
            <span className="assessment-inline-note">
              Cost / Risk remains an included module.
            </span>
          </div>
        </form>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<ShieldCheck size={18} />}
          eyebrow="Preliminary preview"
          title="Preliminary Cost / Risk preview"
          description="This is a preliminary signal, not a final migration report."
        />

        <div className="assessment-preview-grid">
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Annual subscription delta</span>
            <strong>{formatMoney(preview.annualSubscriptionDelta)}</strong>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">3-year delta</span>
            <strong>{formatMoney(preview.threeYearSubscriptionDelta)}</strong>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Estimated savings</span>
            <strong>{formatPercent(preview.savingsPercent)}</strong>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Risk score</span>
            <strong>{preview.riskScore ?? "—"}</strong>
          </article>
        </div>

        <div className="assessment-preview-columns">
          <article className="glass-card assessment-subcard">
            <h3>Risk level</h3>
            <p>{preview.riskLevel ? statusLabel(preview.riskLevel) : "Not calculated yet"}</p>
            <span className="assessment-chip assessment-chip-neutral">
              {preview.readinessLabel ?? "Add assumptions to calculate a preliminary signal"}
            </span>
          </article>
          <article className="glass-card assessment-subcard">
            <h3>Missing evidence</h3>
            {preview.missingEvidence.length > 0 ? (
              <ul className="assessment-bullet-list">
                {preview.missingEvidence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No key evidence is missing for the current preview.</p>
            )}
          </article>
          <article className="glass-card assessment-subcard">
            <h3>Recommendations</h3>
            <ul className="assessment-bullet-list">
              {preview.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<Database size={18} />}
          eyebrow="Storage Readiness"
          title="Storage Destination Readiness is optional"
          description="The core readiness assessment works without Storage Destination Readiness. Add it only when the target architecture needs deeper validation."
        />

        <div className="assessment-status-row">
          {renderStatusPill(`Status: ${storageStatus}`, renderStatusTone(assessment.storageReadinessStatus))}
          {renderStatusPill(
            assessment.storageReadinessEnabled ? "Add-on enabled" : "Core assessment only",
            assessment.storageReadinessEnabled ? "good" : "neutral",
          )}
        </div>

        <div className="assessment-storage-grid">
          <div className="assessment-storage-copy">
            <p>
              You can run the VMware → Proxmox assessment without storage analysis. Add Storage
              Destination Readiness only when you need a deeper view of the target architecture.
            </p>
            {!assessment.storageReadinessEnabled ? (
              <form action={toggleStorageReadinessAction.bind(null, assessment.id)}>
                <input type="hidden" name="storageReadinessEnabled" value="true" />
                <button type="submit" className="btn btn-secondary">
                  Enable Storage Readiness
                </button>
              </form>
            ) : (
              <>
                <p className="assessment-storage-note">
                  Storage readiness inputs will be expanded in a later milestone.
                </p>
                <form action={toggleStorageReadinessAction.bind(null, assessment.id)}>
                  <input type="hidden" name="storageReadinessEnabled" value="false" />
                  <button type="submit" className="btn btn-secondary">
                    Disable Storage Readiness
                  </button>
                </form>
              </>
            )}
          </div>

          <article className="glass-card assessment-subcard">
            <h3>Current storage evidence</h3>
            <p>Selected: {assessment.storageReadinessEnabled ? "yes" : "no"}</p>
            <p>Module: {assessment.storageReadinessEnabled ? "selected" : "locked"}</p>
            <p>Entitlement: {assessment.storageReadinessEnabled ? "available" : "locked"}</p>
          </article>
        </div>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<Upload size={18} />}
          eyebrow="Evidence upload"
          title="RVTools evidence upload"
          description="Upload RVTools or CSV evidence. Files are stored privately and attached to this assessment. Parsing will be added in a later milestone."
        />

        <div className="assessment-status-row">
          {renderStatusPill(`RVTools: ${statusLabel(rvtoolsStatus)}`, renderStatusTone(rvtoolsStatus))}
          {renderStatusPill(`Max size: ${maxUploadSizeMb} MB`, "neutral")}
          {renderStatusPill(`Evidence files: ${evidenceFiles.length}`, evidenceFiles.length > 0 ? "good" : "neutral")}
        </div>

        <div className="assessment-evidence-grid">
          <form action={uploadEvidenceAction.bind(null, assessment.id)} encType="multipart/form-data" className="assessment-evidence-form assessment-subcard">
            <label className="form-label">
              Evidence type
              <select name="evidenceType" className="form-input">
                <option value="rvtools">RVTools export</option>
                <option value="manual_csv">Manual CSV</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="form-label">
              Evidence file
              <input
                name="file"
                className="form-input"
                type="file"
                accept=".xlsx,.xls,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain,application/octet-stream"
              />
            </label>
            <p className="assessment-storage-note">
              Uploaded evidence is not parsed yet. This milestone only stores the file privately and
              prepares the parser-ready workflow.
            </p>
            <div className="assessment-inline-actions">
              <button type="submit" className="btn btn-primary btn-glow">
                <Upload size={16} />
                Upload evidence
              </button>
              <span className="assessment-inline-note">
                Allowed types: .xlsx, .xls, .csv, .txt. Max {maxUploadSizeMb} MB.
              </span>
            </div>
          </form>

          <article className="glass-card assessment-subcard">
            <h3>Evidence history</h3>
            {evidenceFiles.length === 0 ? (
              <p className="assessment-empty-note">No evidence uploaded yet.</p>
            ) : (
              <div className="assessment-evidence-list">
                {evidenceFiles.map((file) => {
                  const deleted = Boolean(file.deletedAt) || file.processingStatus === "deleted";
                  return (
                    <article key={file.id} className={`assessment-evidence-item${deleted ? " is-deleted" : ""}`}>
                      <div className="assessment-evidence-main">
                        <div className="assessment-evidence-icon">
                          <FileText size={18} />
                        </div>
                        <div className="assessment-evidence-meta">
                          <strong>{file.originalFilename}</strong>
                          <span>{evidenceTypeLabel(file.evidenceType)}</span>
                          <span>{formatBytes(file.sizeBytes)}</span>
                        </div>
                      </div>

                      <div className="assessment-evidence-stats">
                        <span className="assessment-chip assessment-chip-neutral">
                          {deleted ? "Deleted" : statusLabel(file.processingStatus)}
                        </span>
                        <span className="assessment-chip assessment-chip-neutral">
                          Uploaded {dateLabel(file.uploadedAt)}
                        </span>
                        <span className="assessment-chip assessment-chip-neutral">
                          Hash {file.fileHash.slice(0, 12)}
                        </span>
                      </div>

                      {!deleted ? (
                        <div className="assessment-evidence-actions">
                          <a
                            href={`/api/assessments/${assessment.id}/files/${file.id}/download`}
                            className="btn btn-secondary"
                          >
                            <Download size={16} />
                            Download
                          </a>
                          <form action={deleteEvidenceAction.bind(null, assessment.id, file.id)}>
                            <button type="submit" className="btn btn-secondary assessment-danger-button">
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </form>
                        </div>
                      ) : (
                        <p className="assessment-evidence-deleted-note">
                          Deleted evidence stays in history for auditability, but it is no longer downloadable.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </article>
        </div>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<FileText size={18} />}
          eyebrow="Parsed inventory"
          title="Basic RVTools inventory extraction"
          description="RVTools evidence can be parsed into preliminary inventory data. The parser is basic, tolerant and may return warnings or partial extraction."
        />

        <div className="assessment-status-row">
          {renderStatusPill(`Inventory: ${getInventoryStatusLabel(inventoryStatus)}`, renderStatusTone(inventoryStatus))}
          {renderStatusPill(`Evidence confidence: ${getEvidenceConfidenceLabel(evidenceConfidence)}`, renderStatusTone(inventoryStatus === "parsed" ? "complete" : inventoryStatus))}
          {renderStatusPill(
            latestRvtoolsEvidence ? `Source: ${latestRvtoolsEvidence.originalFilename}` : "No active RVTools evidence",
            latestRvtoolsEvidence ? "good" : "neutral",
          )}
        </div>

        <div className="assessment-inventory-hero">
          <div className="assessment-inventory-copy glass-card assessment-subcard">
            {latestRvtoolsEvidence ? (
              <>
                <p>
                  RVTools evidence is stored privately and can now be parsed into a preliminary
                  inventory summary.
                </p>
                <p className="assessment-storage-note">
                  Parsing is basic. It extracts VMs, hosts, datastores and snapshots when the file
                  exposes recognizable sheets and headers.
                </p>
                {latestRvtoolsEvidence.processingStatus === "processing" ? (
                  <div className="assessment-inline-note">Parsing inventory...</div>
                ) : (
                  <form
                    action={parseRvtoolsEvidenceAction.bind(null, assessment.id, latestRvtoolsEvidence.id)}
                  >
                    <button type="submit" className="btn btn-primary btn-glow">
                      {latestRvtoolsEvidence.processingStatus === "parsed"
                        ? "Reparse RVTools"
                        : latestRvtoolsEvidence.processingStatus === "failed"
                          ? "Retry parse"
                          : "Parse RVTools"}
                    </button>
                  </form>
                )}
              </>
            ) : (
              <>
                <p>Upload RVTools evidence to extract a preliminary inventory.</p>
                <p className="assessment-storage-note">
                  The parser runs only after evidence is uploaded and attached to this assessment.
                </p>
              </>
            )}
          </div>

          <div className="assessment-summary-mini-grid">
            <article className="assessment-preview-card">
              <span className="assessment-preview-label">VMs</span>
              <strong>{parsedInventory?.summary?.vmCount ?? 0}</strong>
            </article>
            <article className="assessment-preview-card">
              <span className="assessment-preview-label">Hosts</span>
              <strong>{parsedInventory?.summary?.hostCount ?? 0}</strong>
            </article>
            <article className="assessment-preview-card">
              <span className="assessment-preview-label">Datastores</span>
              <strong>{parsedInventory?.summary?.datastoreCount ?? 0}</strong>
            </article>
            <article className="assessment-preview-card">
              <span className="assessment-preview-label">Snapshots</span>
              <strong>{parsedInventory?.summary?.snapshotCount ?? 0}</strong>
            </article>
            <article className="assessment-preview-card">
              <span className="assessment-preview-label">Powered on</span>
              <strong>{parsedInventory?.summary?.poweredOnVmCount ?? 0}</strong>
            </article>
            <article className="assessment-preview-card">
              <span className="assessment-preview-label">Powered off</span>
              <strong>{parsedInventory?.summary?.poweredOffVmCount ?? 0}</strong>
            </article>
            <article className="assessment-preview-card">
              <span className="assessment-preview-label">Provisioned</span>
              <strong>{formatNumber(parsedInventory?.summary?.totalProvisionedGb)} GB</strong>
            </article>
            <article className="assessment-preview-card">
              <span className="assessment-preview-label">Used</span>
              <strong>{formatNumber(parsedInventory?.summary?.totalUsedGb)} GB</strong>
            </article>
          </div>
        </div>

        {parsedInventory?.parseWarnings.length ? (
          <article className="glass-card assessment-subcard assessment-warning-box">
            <h3>Parser warnings</h3>
            <ul className="assessment-bullet-list">
              {parsedInventory.parseWarnings.map((warning) => (
                <li key={`${warning.code}-${warning.message}`}>{warning.message}</li>
              ))}
            </ul>
          </article>
        ) : null}

        {parsedInventory?.summary ? (
          <div className="assessment-inventory-tables">
            <InventoryTable
              title="VMs"
              rows={parsedInventory.vms}
              emptyMessage="No parsed VMs available yet."
              note="Showing a limited sample of the parsed inventory."
              columns={[
                { key: "vm", label: "VM", render: (row) => row.vmName },
                { key: "state", label: "Power", render: (row) => row.powerState ?? "â€”" },
                { key: "cpu", label: "CPU", render: (row) => row.cpuCount ?? "â€”" },
                { key: "memory", label: "Memory MB", render: (row) => row.memoryMb ?? "â€”" },
                { key: "prov", label: "Provisioned GB", render: (row) => formatNumber(row.provisionedGb) },
                { key: "used", label: "Used GB", render: (row) => formatNumber(row.usedGb) },
                { key: "ds", label: "Datastore", render: (row) => row.datastoreName ?? "â€”" },
                { key: "host", label: "Host", render: (row) => row.hostName ?? "â€”" },
                { key: "risk", label: "Risk", render: (row) => row.riskLevel ?? "â€”" },
              ]}
            />

            <InventoryTable
              title="Hosts"
              rows={parsedInventory.hosts}
              emptyMessage="No parsed hosts available yet."
              note="Showing a limited sample of the parsed inventory."
              columns={[
                { key: "host", label: "Host", render: (row) => row.hostName },
                { key: "cluster", label: "Cluster", render: (row) => row.clusterName ?? "â€”" },
                { key: "model", label: "CPU model", render: (row) => row.cpuModel ?? "â€”" },
                { key: "sockets", label: "Sockets", render: (row) => row.cpuSockets ?? "â€”" },
                { key: "cores", label: "Cores", render: (row) => row.cpuCores ?? "â€”" },
                { key: "memory", label: "Memory GB", render: (row) => formatNumber(row.memoryGb) },
                { key: "version", label: "Version", render: (row) => row.version ?? "â€”" },
              ]}
            />

            <InventoryTable
              title="Datastores"
              rows={parsedInventory.datastores}
              emptyMessage="No parsed datastores available yet."
              note="Showing a limited sample of the parsed inventory."
              columns={[
                { key: "name", label: "Datastore", render: (row) => row.datastoreName },
                { key: "type", label: "Type", render: (row) => row.datastoreType ?? "â€”" },
                { key: "capacity", label: "Capacity GB", render: (row) => formatNumber(row.capacityGb) },
                { key: "used", label: "Used GB", render: (row) => formatNumber(row.usedGb) },
                { key: "free", label: "Free GB", render: (row) => formatNumber(row.freeGb) },
                { key: "usage", label: "Usage %", render: (row) => formatPercent(row.usagePercent) },
                { key: "risk", label: "Risk", render: (row) => row.riskLevel ?? "â€”" },
              ]}
            />

            <InventoryTable
              title="Snapshots"
              rows={parsedInventory.snapshots}
              emptyMessage="No parsed snapshots available yet."
              note="Showing a limited sample of the parsed inventory."
              columns={[
                { key: "vm", label: "VM", render: (row) => row.vmName ?? "â€”" },
                { key: "name", label: "Snapshot", render: (row) => row.snapshotName ?? "â€”" },
                { key: "created", label: "Created", render: (row) => dateLabel(row.createdAtSource) },
                { key: "age", label: "Age days", render: (row) => row.ageDays ?? "â€”" },
                { key: "size", label: "Size GB", render: (row) => formatNumber(row.sizeGb) },
                { key: "risk", label: "Risk", render: (row) => row.riskLevel ?? "â€”" },
              ]}
            />
          </div>
        ) : (
          <article className="glass-card assessment-subcard assessment-inventory-empty">
            <h3>Inventory not available yet</h3>
            <p>
              Upload RVTools evidence and run the parser to generate the preliminary inventory
              summary.
            </p>
          </article>
        )}
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<ShieldCheck size={18} />}
          eyebrow="Risk overview"
          title="Inventory-driven risk and readiness"
          description="Scores are preliminary and based on the evidence currently available."
        />

        <div className="assessment-status-row">
          {renderStatusPill(`Source: ${riskSourceLabel}`, "neutral")}
          {renderStatusPill(
            `Readiness: ${
              assessmentScore ? `${formatNumber(assessmentScore.readinessScore)}%` : "Not calculated"
            }`,
            assessmentScore
              ? assessmentScore.readinessScore >= 75
                ? "good"
                : assessmentScore.readinessScore >= 50
                  ? "warning"
                  : "danger"
              : "neutral",
          )}
          {renderStatusPill(
            `Confidence: ${
              assessmentScore ? `${formatNumber(assessmentScore.confidenceScore)}%` : "Not calculated"
            }`,
            assessmentScore
              ? assessmentScore.confidenceScore >= 70
                ? "good"
                : assessmentScore.confidenceScore >= 55
                  ? "warning"
                  : "danger"
              : "neutral",
          )}
        </div>

        <div className="assessment-preview-grid assessment-risk-grid">
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Readiness score</span>
            <strong>{assessmentScore ? formatNumber(assessmentScore.readinessScore) : "â€”"}</strong>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Confidence score</span>
            <strong>{assessmentScore ? formatNumber(assessmentScore.confidenceScore) : "â€”"}</strong>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Risk level</span>
            <strong>{assessmentScore ? riskSeverityLabel(assessmentScore.riskLevel ?? "info") : "â€”"}</strong>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">High findings</span>
            <strong>{riskCounts.high + riskCounts.critical}</strong>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Medium findings</span>
            <strong>{riskCounts.medium}</strong>
          </article>
          <article className="assessment-preview-card">
            <span className="assessment-preview-label">Evidence source</span>
            <strong>{riskSourceLabel}</strong>
          </article>
        </div>

        <div className="assessment-inline-actions">
          <form action={generateInventoryRiskAction.bind(null, assessment.id)}>
            <button type="submit" className="btn btn-primary btn-glow" disabled={!canGenerateRiskInsights}>
              {assessmentScore ? "Refresh risk insights" : "Generate risk insights"}
            </button>
          </form>
          <Link href="/shiftreadiness" className="btn btn-secondary">
            Explore plans
          </Link>
          {assessmentScore?.calculatedAt ? (
            <span className="assessment-inline-note">
              Last calculated {dateLabel(assessmentScore.calculatedAt)}
            </span>
          ) : null}
        </div>

        {preview.mismatchWarnings.length > 0 ? (
          <div className="assessment-warning-box">
            <h3>Manual vs parsed mismatch</h3>
            <ul className="assessment-bullet-list">
              {preview.mismatchWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="assessment-subsection">
          <h3>Top findings</h3>
          <p className="assessment-table-note">
            These are the highest-signal preliminary findings derived from parsed inventory and
            manual assumptions.
          </p>
        </div>

        {visibleRiskFindings.length === 0 ? (
          <article className="assessment-subcard assessment-risk-empty">
            <h3>No generated findings yet</h3>
            <p>
              Generate inventory-driven risk insights to see findings derived from parsed RVTools
              evidence and manual assumptions.
            </p>
          </article>
        ) : (
          <div className="assessment-findings-list">
            {topRiskFindings.map((finding) => {
              const isLocked = finding.requiresPlan !== null;
              return (
                <article key={finding.id} className={`glass-card assessment-subcard assessment-finding-card${isLocked ? " is-locked" : ""}`}>
                  <div className="assessment-finding-head">
                    {renderStatusPill(riskSeverityLabel(finding.severity), riskSeverityTone(finding.severity))}
                    {renderStatusPill(riskCategoryLabel(finding.category), "neutral")}
                    {finding.entityName ? renderStatusPill(finding.entityName, "neutral") : null}
                    {isLocked && finding.requiresPlan ? renderStatusPill(`Locked ${finding.requiresPlan}`, "warning") : null}
                  </div>
                  <h3>{finding.title}</h3>
                  <p>{finding.description}</p>
                  {finding.recommendation ? (
                    <p className="assessment-storage-note">{finding.recommendation}</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<Layers3 size={18} />}
          eyebrow="VM risk matrix"
          title="VM-by-VM preliminary risk matrix"
          description="This matrix is based on parsed inventory and preliminary risk findings. It is limited and not a final migration plan."
        />

        <div className="assessment-status-row">
          {renderStatusPill(`Risk filter: ${vmRiskMatrix.filterRisk === "all" ? "All" : vmRiskMatrix.filterRisk}`, "neutral")}
          {renderStatusPill(
            `Power filter: ${vmRiskMatrix.filterPower === "all" ? "All" : vmRiskMatrix.filterPower === "powered_on" ? "Powered on" : "Powered off"}`,
            "neutral",
          )}
          {renderStatusPill(`Showing: ${vmRiskMatrix.rows.length}${vmRiskMatrix.total > vmRiskMatrix.rows.length ? ` of ${vmRiskMatrix.total}` : ""}`, "good")}
        </div>

        <div className="assessment-filter-row">
          <span className="assessment-inline-note">Risk</span>
          {(["all", "info", "low", "medium", "high", "critical"] as const).map((value) => (
            <Link
              key={value}
              href={buildMatrixHref({
                assessmentId: assessment.id,
                risk: value,
                power: searchParams?.power ?? "all",
              })}
              className={`assessment-filter-chip${vmRiskMatrix.filterRisk === value ? " is-active" : ""}`}
            >
              {value === "all" ? "All" : riskSeverityLabel(value)}
            </Link>
          ))}
        </div>

        <div className="assessment-filter-row">
          <span className="assessment-inline-note">Power</span>
          {([
            { key: "all", label: "All" },
            { key: "powered_on", label: "Powered on" },
            { key: "powered_off", label: "Powered off" },
          ] as const).map((value) => (
            <Link
              key={value.key}
              href={buildMatrixHref({
                assessmentId: assessment.id,
                risk: searchParams?.risk ?? "all",
                power: value.key,
              })}
              className={`assessment-filter-chip${vmRiskMatrix.filterPower === value.key ? " is-active" : ""}`}
            >
              {value.label}
            </Link>
          ))}
        </div>

        {vmRiskMatrix.rows.length === 0 ? (
          <article className="assessment-subcard assessment-risk-empty">
            <h3>No VM rows match the current filters</h3>
            <p>Adjust the filters or generate risk insights after parsing RVTools evidence.</p>
          </article>
        ) : (
          <div className="assessment-table-wrap">
            <table className="assessment-table assessment-risk-table">
              <thead>
                <tr>
                  <th>VM</th>
                  <th>Power</th>
                  <th>Guest OS</th>
                  <th>CPU</th>
                  <th>Memory MB</th>
                  <th>Provisioned GB</th>
                  <th>Used GB</th>
                  <th>Datastore</th>
                  <th>Host</th>
                  <th>Risk</th>
                  <th>Main reason</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {vmRiskMatrix.rows.map((row) => (
                  <tr key={row.vmName}>
                    <td>{row.vmName}</td>
                    <td>{row.powerState ?? "â€”"}</td>
                    <td>{row.guestOs ?? "â€”"}</td>
                    <td>{row.cpuCount ?? "â€”"}</td>
                    <td>{row.memoryMb ?? "â€”"}</td>
                    <td>{formatNumber(row.provisionedGb)}</td>
                    <td>{formatNumber(row.usedGb)}</td>
                    <td>{row.datastoreName ?? "â€”"}</td>
                    <td>{row.hostName ?? "â€”"}</td>
                    <td>
                      {renderStatusPill(riskSeverityLabel(row.riskLevel), riskSeverityTone(row.riskLevel))}
                    </td>
                    <td>{row.mainReason}</td>
                    <td>{row.recommendation ?? "â€”"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="assessment-table-note">
          Showing a limited sample of the parsed inventory. Use the filters to review risk by
          state or severity.
        </p>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<CircleAlert size={18} />}
          eyebrow="Locked insights"
          title="Upgrade hooks for the full readiness report"
          description="These insights stay locked until a fuller report path exists. They are visual hooks only; no checkout is implemented."
        />

        <div className="assessment-locked-grid">
          {[
            "Full VM-by-VM risk export",
            "Migration waves",
            "Proxmox sizing",
            "Storage strategy",
            "Executive PDF",
            "Technical report",
          ].map((item) => (
            <article key={item} className="assessment-locked-card glass-card assessment-subcard">
              <span className="assessment-locked-label">Locked insight</span>
              <strong>{item}</strong>
              <p>Unlock the full readiness report to turn these findings into a migration decision plan.</p>
              <Link href="/shiftreadiness" className="dashboard-card-link">
                Explore plans <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          icon={<CircleAlert size={18} />}
          eyebrow="Evidence & completion"
          title="Evidence and completion status"
          description="Use this section to see what is missing before you unlock a fuller migration decision."
        />

        <div className="assessment-status-row">
          {renderStatusPill(`Infrastructure: ${statusLabel(completion.infrastructureStatus)}`, renderStatusTone(completion.infrastructureStatus))}
          {renderStatusPill(`Cost assumptions: ${statusLabel(completion.costAssumptionsStatus)}`, renderStatusTone(completion.costAssumptionsStatus))}
          {renderStatusPill(`Storage: ${statusLabel(completion.storageStatus)}`, renderStatusTone(completion.storageStatus))}
          {renderStatusPill(`RVTools: ${statusLabel(rvtoolsStatus)}`, renderStatusTone(rvtoolsStatus))}
          {renderStatusPill(`Report preview: ${statusLabel(completion.reportPreviewStatus)}`, renderStatusTone(completion.reportPreviewStatus))}
          {renderStatusPill(`Full report: ${statusLabel(completion.fullReportStatus)}`, "neutral")}
          {renderStatusPill(`PDF Preview: ${statusLabel(completion.pdfStatus)}`, "neutral")}
        </div>

        <div className="assessment-completion-grid">
          <article className="assessment-completion-card">
            <span className="assessment-preview-label">Completion score</span>
            <strong>{completion.completionScore}%</strong>
          </article>
          <article className="assessment-completion-card">
            <span className="assessment-preview-label">Module coverage</span>
            <strong>
              {assessment.modules.filter((module) => module.includedInPlan).length} included /{" "}
              {assessment.modules.length} total
            </strong>
          </article>
          <article className="assessment-completion-card">
            <span className="assessment-preview-label">Last calculated</span>
            <strong>{dateLabel(assessment.preliminaryResult?.calculatedAt)}</strong>
          </article>
        </div>

        <div className="assessment-lists-grid">
          <article className="glass-card assessment-subcard">
            <h3>Missing evidence</h3>
            <ul className="assessment-bullet-list">
              {missingEvidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="glass-card assessment-subcard">
            <h3>Next steps</h3>
            <ul className="assessment-bullet-list">
              {nextSteps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="assessment-section glass-card assessment-final-cta">
        <SectionTitle
          icon={<ArrowRight size={18} />}
          eyebrow="Next steps"
          title="Move from preliminary signal to better evidence"
          description="Start with manual intake and assumptions. RVTools upload and deeper automation come in the next milestone."
        />
        <div className="assessment-inline-actions">
          <Link href="/dashboard/assessments/new" className="btn btn-primary btn-glow">
            New draft
            <ArrowRight size={16} />
          </Link>
          <Link href="/dashboard/assessments" className="btn btn-secondary">
            Back to assessments
          </Link>
        </div>
      </section>
    </main>
  );
}
