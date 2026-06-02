import Link from "next/link";
import type { UnlockRequestStatus, UnlockRequestType } from "@prisma/client";
import { ArrowLeft, BadgePercent, CheckCircle2, CircleAlert, ClipboardList, ShieldCheck, XCircle } from "lucide-react";
import { requireAdminSession } from "../../../../server/admin/adminAuth";
import {
  getUnlockRequestStatusTone,
  listPendingUnlockRequestsForAdmin,
  listRecentUnlockRequestsForAdmin,
} from "../../../../server/unlocks/unlockRequestService";
import { getBillingAdminStatus } from "../../../../server/billing/billingConfiguration";
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

  return new Intl.DateTimeFormat("es-AR", {
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

function getStatusLabelEs(status: UnlockRequestStatus) {
  const labels: Record<UnlockRequestStatus, string> = {
    pending: "Pendiente",
    approved: "Aprobada",
    rejected: "Rechazada",
    fulfilled: "Completada",
    cancelled: "Cancelada",
  };
  return labels[status];
}

function getTypeLabelEs(type: UnlockRequestType) {
  const labels: Record<UnlockRequestType, string> = {
    readiness_report: "Reporte completo",
    readiness_report_pro: "Reporte Pro",
    storage_addon: "Addon de storage",
    technical_review: "Revision tecnica",
  };
  return labels[type];
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
          <span className="assessment-preview-label">{getTypeLabelEs(request.requestedType)}</span>
          <h3>{request.assessment.title}</h3>
        </div>
        {renderStatusPill(getStatusLabelEs(request.status), getUnlockRequestStatusTone(request.status))}
      </div>

      <div className="report-history-meta">
        <span>Workspace: {request.workspace.name}</span>
        <span>Usuario: {request.user.email ?? "-"}</span>
        <span>Creada: {formatDate(request.createdAt)}</span>
      </div>
      <div className="report-history-meta">
        <span>Monto: {formatMoneyCents(request.amountCents, request.currency)}</span>
        <span>Contacto: {request.contactEmail ?? "-"}</span>
      </div>
      {request.notes ? <p className="report-history-error">{request.notes}</p> : null}
      {request.adminNotes ? <p className="assessment-inline-note">Notas internas: {request.adminNotes}</p> : null}

      <div className="assessment-inline-actions report-history-actions">
        <Link href={assessmentHref} className="btn btn-secondary">
          Abrir reporte
        </Link>
      </div>

      {request.status === "pending" ? (
        <form className="unlock-admin-form">
          <div className="dashboard-banner dashboard-banner-warning" role="alert">
            Accion manual: revisar antes de confirmar. No completar si no verificaste el pago fuera de la
            plataforma, el assessment, el usuario y el alcance solicitado. Aprobar no debe prometer fulfillment
            automatico.
          </div>
          <label className="form-label">
            Notas internas
            <textarea
              name="adminNotes"
              className="form-input form-textarea"
              rows={3}
              placeholder="Nota interna opcional. No guardar secretos, passwords, API keys ni datos de tarjeta."
            />
          </label>
          <div className="assessment-inline-actions">
            <button type="submit" className="btn btn-primary btn-glow" formAction={approveUnlockRequestAction.bind(null, request.id)}>
              <CheckCircle2 size={16} />
              Aprobar
            </button>
            <button type="submit" className="btn btn-secondary" formAction={fulfillUnlockRequestAction.bind(null, request.id)}>
              <ShieldCheck size={16} />
              Completar
            </button>
            <button type="submit" className="btn btn-secondary" formAction={rejectUnlockRequestAction.bind(null, request.id)}>
              <XCircle size={16} />
              Rechazar
            </button>
            <button type="submit" className="btn btn-secondary" formAction={cancelUnlockRequestAction.bind(null, request.id)}>
              <CircleAlert size={16} />
              Cancelar
            </button>
          </div>
        </form>
      ) : request.status === "approved" ? (
        <form className="unlock-admin-form">
          <div className="dashboard-banner dashboard-banner-warning" role="alert">
            Accion manual: completar puede habilitar acceso real. No ejecutar si no verificaste el pago fuera de la
            plataforma y el match usuario/workspace/assessment.
          </div>
          <label className="form-label">
            Notas internas
            <textarea
              name="adminNotes"
              className="form-input form-textarea"
              rows={3}
              placeholder="Nota interna opcional. No guardar secretos, passwords, API keys ni datos de tarjeta."
            />
          </label>
          <div className="assessment-inline-actions">
            <button type="submit" className="btn btn-primary btn-glow" formAction={fulfillUnlockRequestAction.bind(null, request.id)}>
              <ShieldCheck size={16} />
              Marcar como completada
            </button>
            <button type="submit" className="btn btn-secondary" formAction={cancelUnlockRequestAction.bind(null, request.id)}>
              <CircleAlert size={16} />
              Cancelar
            </button>
            <button type="submit" className="btn btn-secondary" formAction={rejectUnlockRequestAction.bind(null, request.id)}>
              <XCircle size={16} />
              Rechazar
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
  const billingStatus = getBillingAdminStatus();
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
          <div className="badge badge-cyan">Administracion</div>
          <h1>Solicitudes manuales de desbloqueo</h1>
          <p>
            Aprobacion manual interna. El pago no esta automatizado y el fulfillment sigue siendo manual.
            Stripe: {billingStatus.providers[0].status}.
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <Link href="/dashboard" className="btn btn-secondary">
            <ArrowLeft size={16} />
            Volver al panel
          </Link>
        </div>
      </section>

      {saved ? <div className="dashboard-banner dashboard-banner-success" role="status" aria-live="polite">Acción administrativa guardada.</div> : null}
      {error ? <div className="dashboard-banner dashboard-banner-error" role="alert">{error}</div> : null}

      <div className="dashboard-banner dashboard-banner-warning" role="alert">
        <strong>Operacion interna sensible.</strong> Accion manual: revisar antes de confirmar. No concede acceso
        automaticamente salvo que la accion lo indique. No ejecutar si no verificaste el pago fuera de la plataforma.
        No guardar secretos, passwords, API keys ni datos de tarjeta en notas internas.
      </div>

      <section className="assessment-summary-grid">
        <article className="glass-card assessment-summary-card">
          <ClipboardList size={22} />
          <span className="assessment-summary-label">Pendientes</span>
          <strong>{pendingRequests.length}</strong>
          <p>Solicitudes esperando revision manual</p>
        </article>
        <article className="glass-card assessment-summary-card">
          <BadgePercent size={22} />
          <span className="assessment-summary-label">Aprobadas</span>
          <strong>{getStatusCount(recentRequests, "approved")}</strong>
          <p>Solicitudes aprobadas pero no completadas</p>
        </article>
        <article className="glass-card assessment-summary-card">
          <ShieldCheck size={22} />
          <span className="assessment-summary-label">Completadas</span>
          <strong>{getStatusCount(recentRequests, "fulfilled")}</strong>
          <p>Entitlements otorgados manualmente</p>
        </article>
        <article className="glass-card assessment-summary-card">
          <XCircle size={22} />
          <span className="assessment-summary-label">Rechazadas</span>
          <strong>{getStatusCount(recentRequests, "rejected")}</strong>
          <p>Solicitudes cerradas sin entitlement</p>
        </article>
      </section>

      <section className="assessment-section glass-card">
        <div className="assessment-section-title">
          <div className="assessment-section-eyebrow">
            <CircleAlert size={18} />
            <span>Cola</span>
          </div>
          <h2>Cola de solicitudes</h2>
          <p>Aprobar, completar, rechazar o cancelar solicitudes desde esta vista protegida.</p>
        </div>
        <div className="admin-filter-row" aria-label="Filtros de solicitudes">
          {statusFilters.map((filter) => (
            <Link
              key={filter}
              href={filter === "all" ? "/dashboard/admin/unlock-requests" : `/dashboard/admin/unlock-requests?status=${filter}`}
              className={`assessment-chip ${activeFilter === filter ? "assessment-chip-good" : "assessment-chip-neutral"}`}
            >
              {filter === "all" ? "Todas" : getStatusLabelEs(filter as UnlockRequestStatus)}
            </Link>
          ))}
        </div>
        {filteredRequests.length === 0 ? (
          <p className="assessment-empty-note">No hay solicitudes que coincidan con este filtro.</p>
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
