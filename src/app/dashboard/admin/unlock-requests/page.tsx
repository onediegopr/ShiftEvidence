import Link from "next/link";
import type { UnlockRequestStatus } from "@prisma/client";
import { ArrowLeft, BadgePercent, CheckCircle2, CircleAlert, ClipboardList, ShieldCheck, XCircle } from "lucide-react";
import { requireAdminSession } from "../../../../server/admin/adminAuth";
import {
  getUnlockRequestStatusLabel,
  getUnlockRequestStatusTone,
  getUnlockRequestTypeLabel,
  listPendingUnlockRequestsForAdmin,
  listRecentUnlockRequestsForAdmin,
} from "../../../../server/unlocks/unlockRequestService";
import {
  approveUnlockRequestAction,
  cancelUnlockRequestAction,
  fulfillUnlockRequestAction,
  rejectUnlockRequestAction,
} from "./actions";

function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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

function renderStatusPill(label: string, tone: "neutral" | "good" | "warning" | "danger") {
  return <span className={`assessment-chip assessment-chip-${tone}`}>{label}</span>;
}

function redactEmail(email: string | null | undefined) {
  if (!email || !email.includes("@")) {
    return "-";
  }

  const [name, domain] = email.split("@");
  const visibleName = name.length <= 2 ? `${name[0] ?? ""}*` : `${name.slice(0, 2)}***`;
  return `${visibleName}@${domain}`;
}

function getStatusCount(
  requests: Awaited<ReturnType<typeof listRecentUnlockRequestsForAdmin>>,
  status: UnlockRequestStatus,
) {
  return requests.filter((request) => request.status === status).length;
}

function RequestCard({
  request,
}: {
  request: Awaited<ReturnType<typeof listRecentUnlockRequestsForAdmin>>[number];
}) {
  const assessmentHref = `/dashboard/assessments/${request.assessment.id}/report`;

  return (
    <article className="glass-card report-history-card">
      <div className="report-history-header">
        <div>
          <span className="assessment-preview-label">{getUnlockRequestTypeLabel(request.requestedType)}</span>
          <h3>{request.assessment.title}</h3>
        </div>
        {renderStatusPill(getUnlockRequestStatusLabel(request.status), getUnlockRequestStatusTone(request.status))}
      </div>

      <div className="report-history-meta">
        <span>Workspace: {request.workspace.name}</span>
        <span>User: {redactEmail(request.user.email)}</span>
        <span>Created: {formatDate(request.createdAt)}</span>
      </div>
      <div className="report-history-meta">
        <span>Amount: {formatMoneyCents(request.amountCents, request.currency)}</span>
        <span>Contact: {redactEmail(request.contactEmail)}</span>
      </div>
      {request.notes ? <p className="report-history-error">{request.notes}</p> : null}
      {request.adminNotes ? <p className="assessment-inline-note">Admin notes: {request.adminNotes}</p> : null}

      <div className="assessment-inline-actions report-history-actions">
        <Link href={assessmentHref} className="btn btn-secondary">
          Open report
        </Link>
      </div>

      {request.status === "pending" ? (
        <form className="unlock-admin-form">
          <label className="form-label">
            Admin notes
            <textarea name="adminNotes" className="form-input form-textarea" rows={3} placeholder="Optional internal note" />
          </label>
          <div className="assessment-inline-actions">
            <button type="submit" className="btn btn-primary btn-glow" formAction={approveUnlockRequestAction.bind(null, request.id)}>
              <CheckCircle2 size={16} />
              Approve
            </button>
            <button type="submit" className="btn btn-secondary" formAction={fulfillUnlockRequestAction.bind(null, request.id)}>
              <ShieldCheck size={16} />
              Fulfill
            </button>
            <button type="submit" className="btn btn-secondary" formAction={rejectUnlockRequestAction.bind(null, request.id)}>
              <XCircle size={16} />
              Reject
            </button>
            <button type="submit" className="btn btn-secondary" formAction={cancelUnlockRequestAction.bind(null, request.id)}>
              <CircleAlert size={16} />
              Cancel
            </button>
          </div>
        </form>
      ) : request.status === "approved" ? (
        <form className="unlock-admin-form">
          <label className="form-label">
            Admin notes
            <textarea name="adminNotes" className="form-input form-textarea" rows={3} placeholder="Optional internal note" />
          </label>
          <div className="assessment-inline-actions">
            <button type="submit" className="btn btn-primary btn-glow" formAction={fulfillUnlockRequestAction.bind(null, request.id)}>
              <ShieldCheck size={16} />
              Mark fulfilled
            </button>
            <button type="submit" className="btn btn-secondary" formAction={cancelUnlockRequestAction.bind(null, request.id)}>
              <CircleAlert size={16} />
              Cancel
            </button>
            <button type="submit" className="btn btn-secondary" formAction={rejectUnlockRequestAction.bind(null, request.id)}>
              <XCircle size={16} />
              Reject
            </button>
          </div>
        </form>
      ) : null}
    </article>
  );
}

type UnlockRequestsAdminPageProps = {
  searchParams?:
    | {
        status?: string;
        saved?: string;
        error?: string;
      }
    | Promise<{
        status?: string;
        saved?: string;
        error?: string;
      }>;
};

const statusFilters = ["all", "pending", "approved", "fulfilled", "rejected", "cancelled"] as const;

function normalizeStatusFilter(value: string | null | undefined) {
  return statusFilters.includes(value as (typeof statusFilters)[number])
    ? (value as (typeof statusFilters)[number])
    : "all";
}

export default async function UnlockRequestsAdminPage({
  searchParams,
}: UnlockRequestsAdminPageProps) {
  await requireAdminSession();
  const query = await Promise.resolve(searchParams);
  const activeFilter = normalizeStatusFilter(query?.status);

  const pendingRequests = await listPendingUnlockRequestsForAdmin();
  const recentRequests = await listRecentUnlockRequestsForAdmin(40);
  const filteredRequests =
    activeFilter === "all"
      ? recentRequests
      : recentRequests.filter((request) => request.status === activeFilter);
  const saved = query?.saved === "1";
  const error = query?.error ? decodeURIComponent(query.error) : null;

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero glass-card">
        <div>
          <div className="badge badge-cyan">Admin</div>
          <h1>Manual unlock requests</h1>
          <p>
            Admin-only manual approval. Payment is not automated and no checkout flow is active.
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <Link href="/dashboard" className="btn btn-secondary">
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
        </div>
      </section>

      {saved ? <div className="dashboard-banner dashboard-banner-success">Admin unlock action saved.</div> : null}
      {error ? <div className="dashboard-banner dashboard-banner-error">{error}</div> : null}

      <section className="assessment-summary-grid">
        <article className="glass-card assessment-summary-card">
          <ClipboardList size={22} />
          <span className="assessment-summary-label">Pending</span>
          <strong>{pendingRequests.length}</strong>
          <p>Unlock requests waiting for manual review</p>
        </article>
        <article className="glass-card assessment-summary-card">
          <BadgePercent size={22} />
          <span className="assessment-summary-label">Approved</span>
          <strong>{getStatusCount(recentRequests, "approved")}</strong>
          <p>Requests approved but not fulfilled</p>
        </article>
        <article className="glass-card assessment-summary-card">
          <ShieldCheck size={22} />
          <span className="assessment-summary-label">Fulfilled</span>
          <strong>{getStatusCount(recentRequests, "fulfilled")}</strong>
          <p>Entitlements manually granted</p>
        </article>
        <article className="glass-card assessment-summary-card">
          <XCircle size={22} />
          <span className="assessment-summary-label">Rejected</span>
          <strong>{getStatusCount(recentRequests, "rejected")}</strong>
          <p>Requests closed without entitlement</p>
        </article>
      </section>

      <section className="assessment-section glass-card">
        <div className="assessment-section-title">
          <div className="assessment-section-eyebrow">
            <CircleAlert size={18} />
            <span>Queue</span>
          </div>
          <h2>Unlock request queue</h2>
          <p>Approve, fulfill, reject or cancel a request from this protected admin view.</p>
        </div>
        <div className="admin-filter-row" aria-label="Unlock request filters">
          {statusFilters.map((filter) => (
            <Link
              key={filter}
              href={filter === "all" ? "/dashboard/admin/unlock-requests" : `/dashboard/admin/unlock-requests?status=${filter}`}
              className={`assessment-chip ${activeFilter === filter ? "assessment-chip-good" : "assessment-chip-neutral"}`}
            >
              {filter === "all" ? "All" : getUnlockRequestStatusLabel(filter as UnlockRequestStatus)}
            </Link>
          ))}
        </div>
        {filteredRequests.length === 0 ? (
          <p className="assessment-empty-note">No unlock requests match this filter.</p>
        ) : (
          <div className="report-history-grid">
            {filteredRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
