import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, AlertTriangle, CheckCircle2, Database, FileText, Gauge, Settings, ShieldCheck } from "lucide-react";
import { getCurrentAdminUserForConsole } from "../../../../server/admin/adminAuth";
import {
  getPricingIntelligenceSummary,
  listPendingPricingSnapshots,
  listPricingSnapshots,
} from "../../../../server/pricing/licensingPricingSnapshotService";
import {
  approvePricingSnapshotAction,
  archivePricingSnapshotAction,
  rejectPricingSnapshotAction,
  runManualPricingRefreshAction,
} from "./actions";

type PricingAdminPageProps = {
  searchParams?:
    | {
        saved?: string;
        error?: string;
      }
    | Promise<{
        saved?: string;
        error?: string;
      }>;
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "No disponible";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatUsd(value: unknown) {
  if (value === null || value === undefined) return "Pendiente";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "Pendiente";

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(parsed);
}

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    archived: "Archivado",
    approved: "Aprobado",
    completed: "Completado",
    completed_with_warnings: "Completado con advertencias",
    draft: "Borrador",
    failed: "Fallido",
    no_changes: "Sin cambios",
    pending_review: "Pendiente de revision",
    rejected: "Rechazado",
    running: "En ejecucion",
  };
  return labels[value] ?? value;
}

function statusTone(status: string) {
  switch (status) {
    case "approved":
    case "completed":
    case "no_changes":
      return "good";
    case "pending_review":
    case "draft":
    case "completed_with_warnings":
    case "running":
      return "warning";
    case "rejected":
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

function vendorLabel(value: string) {
  return value === "vmware" ? "VMware/Broadcom" : "Proxmox";
}

function sourceTypeLabel(value: string) {
  const labels: Record<string, string> = {
    official: "Oficial",
    manual_admin: "Manual admin",
    market_estimate: "Estimacion de mercado",
    placeholder: "Placeholder",
  };
  return labels[value] ?? value;
}

function StatusPill({ status }: { status: string }) {
  return <span className={`assessment-chip assessment-chip-${statusTone(status)}`}>{formatStatus(status)}</span>;
}

function SectionTitle({
  id,
  icon,
  label,
  title,
  description,
}: {
  id: string;
  icon: ReactNode;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div id={id} className="assessment-section-title">
      <div className="assessment-section-eyebrow">
        {icon}
        <span>{label}</span>
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  note,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  note: string;
}) {
  return (
    <article className="glass-card assessment-summary-card">
      {icon}
      <span className="assessment-summary-label">{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

function AccessDenied() {
  return (
    <main className="dashboard-page">
      <section className="dashboard-hero glass-card">
        <div>
          <div className="badge badge-cyan">Pricing Intelligence</div>
          <h1>No tenes permisos para acceder a esta consola.</h1>
          <p>Esta ruta usa el guard admin existente y no expone datos de pricing fuera de la consola interna.</p>
        </div>
        <Link href="/dashboard" className="btn btn-secondary">
          Volver al panel
        </Link>
      </section>
    </main>
  );
}

function SnapshotTable({
  title,
  snapshots,
}: {
  title: string;
  snapshots: Awaited<ReturnType<typeof listPricingSnapshots>>;
}) {
  return (
    <article className="glass-card report-history-card">
      <div className="report-history-header">
        <h3>{title}</h3>
        <span className="assessment-preview-label">{snapshots.length} snapshots</span>
      </div>
      {snapshots.length === 0 ? (
        <p className="assessment-empty-note">No hay snapshots para mostrar.</p>
      ) : (
        <div className="assessment-table-wrap">
          <table className="assessment-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Edicion</th>
                <th>Metrica</th>
                <th>Valor USD</th>
                <th>Estado</th>
                <th>Fuente</th>
                <th>Ultimo check</th>
                <th>Aprobado</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.flatMap((snapshot) => {
                const rows = snapshot.items.length > 0 ? snapshot.items : [null];
                return rows.map((item, index) => (
                  <tr key={`${snapshot.id}-${item?.id ?? "empty"}-${index}`}>
                    <td>{item?.productName ?? snapshot.sourceName}</td>
                    <td>{item?.edition ?? "No disponible"}</td>
                    <td>{item?.metric ?? "manual"}</td>
                    <td>{formatUsd(item?.unitPriceUsd)}</td>
                    <td><StatusPill status={snapshot.status} /></td>
                    <td>{sourceTypeLabel(snapshot.sourceType)}</td>
                    <td>{formatDate(snapshot.lastCheckedAt)}</td>
                    <td>{formatDate(snapshot.approvedAt)}</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function PendingSnapshots({
  snapshots,
}: {
  snapshots: Awaited<ReturnType<typeof listPendingPricingSnapshots>>;
}) {
  return (
    <section className="assessment-section glass-card">
      <SectionTitle
        id="pendientes"
        icon={<AlertTriangle size={18} />}
        label="Revision admin"
        title="Snapshots pendientes"
        description="Los borradores y pendientes no son usables para calculos. Aprobar requiere USD, fuente validada y al menos un item con precio."
      />
      {snapshots.length === 0 ? (
        <p className="assessment-empty-note">No hay snapshots pendientes de revision.</p>
      ) : (
        <div className="report-history-grid">
          {snapshots.map((snapshot) => (
            <article key={snapshot.id} className="glass-card report-history-card">
              <div className="report-history-header">
                <h3>{vendorLabel(snapshot.vendor)}</h3>
                <StatusPill status={snapshot.status} />
              </div>
              <p>{snapshot.sourceName}</p>
              <div className="report-history-meta">
                <span>Moneda: {snapshot.currency}</span>
                <span>Fuente: {sourceTypeLabel(snapshot.sourceType)}</span>
                <span>Items: {snapshot.items.length}</span>
                <span>Ultimo check: {formatDate(snapshot.lastCheckedAt)}</span>
              </div>
              <div className="assessment-inline-actions" style={{ marginTop: "14px" }}>
                <form action={approvePricingSnapshotAction.bind(null, snapshot.id)}>
                  <button className="btn btn-primary" type="submit">Aprobar</button>
                </form>
                <form action={archivePricingSnapshotAction.bind(null, snapshot.id)}>
                  <button className="btn btn-secondary" type="submit">Archivar</button>
                </form>
              </div>
              <form className="unlock-admin-form" action={rejectPricingSnapshotAction.bind(null, snapshot.id)} style={{ marginTop: "14px" }}>
                <label htmlFor={`rejection-${snapshot.id}`}>Motivo de rechazo</label>
                <textarea
                  id={`rejection-${snapshot.id}`}
                  name="rejectionReason"
                  className="form-input"
                  rows={3}
                  placeholder="Ej: fuente no validada, precio incompleto o dato fuera de alcance."
                />
                <button className="btn btn-secondary" type="submit">Rechazar</button>
              </form>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function PricingAdminPage({ searchParams }: PricingAdminPageProps) {
  const { session, isAdmin } = await getCurrentAdminUserForConsole();

  if (!isAdmin) {
    return <AccessDenied />;
  }

  const query = await Promise.resolve(searchParams);
  const saved = query?.saved;
  const error = query?.error ? decodeURIComponent(query.error) : null;
  const savedMessages: Record<string, string> = {
    archived: "Snapshot archivado correctamente.",
    approved: "Snapshot aprobado correctamente.",
    refresh: "Refresh manual ejecutado.",
    rejected: "Snapshot rechazado correctamente.",
  };
  const savedMessage = saved ? (savedMessages[saved] ?? "Accion administrativa guardada.") : null;

  const [summary, vmwareSnapshots, proxmoxSnapshots, pendingSnapshots] = await Promise.all([
    getPricingIntelligenceSummary(),
    listPricingSnapshots({ vendor: "vmware" }),
    listPricingSnapshots({ vendor: "proxmox" }),
    listPendingPricingSnapshots(),
  ]);

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero glass-card">
        <div>
          <div className="badge badge-cyan">Consola admin</div>
          <h1>Inteligencia de Precios</h1>
          <p>
            Base administrativa para snapshots VMware/Broadcom vs Proxmox. Todo precio se normaliza en USD y requiere
            aprobacion manual antes de ser usable en futuros calculos.
          </p>
          <p className="assessment-inline-note">Sesion admin: {session.user.email}</p>
        </div>
        <div className="dashboard-hero-actions">
          <Link href="/dashboard/admin" className="btn btn-secondary">
            Volver a admin
          </Link>
          <form action={runManualPricingRefreshAction}>
            <button className="btn btn-primary" type="submit">
              Actualizar ahora
            </button>
          </form>
        </div>
      </section>

      {savedMessage ? <div className="dashboard-banner dashboard-banner-success" role="status" aria-live="polite">{savedMessage}</div> : null}
      {error ? <div className="dashboard-banner dashboard-banner-error" role="alert">{error}</div> : null}

      <section id="resumen" className="assessment-summary-grid">
        <MetricCard icon={<CheckCircle2 size={22} />} label="Snapshots aprobados" value={summary.approvedCount} note="Unicos usables en futuros calculos." />
        <MetricCard icon={<AlertTriangle size={22} />} label="Pendientes" value={summary.pendingCount} note="Borradores o pendientes de revision." />
        <MetricCard icon={<Gauge size={22} />} label="Freshness" value={summary.staleSourcesCount} note={`Fuentes vencidas o sin check en ${summary.freshnessDays} dias.`} />
        <MetricCard icon={<ShieldCheck size={22} />} label="Confianza baja" value={summary.lowConfidenceSourcesCount} note="Placeholder o estimaciones de mercado." />
        <MetricCard icon={<Database size={22} />} label="VMware/Broadcom" value={formatDate(summary.vmwareLastChecked?.lastCheckedAt)} note={summary.vmwareLastChecked?.sourceName ?? "Sin check registrado."} />
        <MetricCard icon={<FileText size={22} />} label="Proxmox" value={formatDate(summary.proxmoxLastChecked?.lastCheckedAt)} note={summary.proxmoxLastChecked?.sourceName ?? "Sin check registrado."} />
        <MetricCard icon={<Settings size={22} />} label="Feature flag" value={summary.enabled ? "Activa" : "Inactiva"} note="pricing_intelligence.enabled en SystemSetting." />
        <MetricCard icon={<Activity size={22} />} label="Refresh manual" value={summary.refreshRuns[0] ? formatStatus(summary.refreshRuns[0].status) : "Sin ejecuciones"} note={summary.refreshRuns[0]?.summary ?? "No hay historial de refresh."} />
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          id="control"
          icon={<ShieldCheck size={18} />}
          label="Control de cambios"
          title="Refresh manual controlado"
          description="El refresh manual deja preparado el flujo de actualizacion y revision. Las fuentes deben ser validadas antes de aprobar snapshots."
        />
        <p className="assessment-table-note">
          No hay scraping fragil en COST-1A. Un snapshot draft, pending_review o rejected no puede ser usado por calculos productivos.
        </p>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          id="vendors"
          icon={<Database size={18} />}
          label="Catalogo USD"
          title="VMware/Broadcom y Proxmox"
          description="Catalogo administrativo separado del assessment del cliente. No modifica CostRiskAssumptions, SavingsCalculator ni PDF."
        />
        <div className="report-history-grid">
          <SnapshotTable title="VMware/Broadcom" snapshots={vmwareSnapshots} />
          <SnapshotTable title="Proxmox" snapshots={proxmoxSnapshots} />
        </div>
      </section>

      <PendingSnapshots snapshots={pendingSnapshots} />

      <section className="assessment-section glass-card">
        <SectionTitle
          id="historial"
          icon={<Activity size={18} />}
          label="Historial"
          title="Refresh runs y changelog"
          description="Acciones recientes registradas para auditoria administrativa segura."
        />
        <div className="report-history-grid">
          <article className="glass-card report-history-card">
            <div className="report-history-header">
              <h3>Refresh runs</h3>
              <span className="assessment-preview-label">{summary.refreshRuns.length}</span>
            </div>
            {summary.refreshRuns.length === 0 ? (
              <p className="assessment-empty-note">No hay refresh runs todavia.</p>
            ) : (
              summary.refreshRuns.map((run) => (
                <div key={run.id} className="report-history-meta" style={{ marginBottom: "12px" }}>
                  <span>{formatStatus(run.status)}</span>
                  <span>{formatDate(run.createdAt)}</span>
                  <span>{run.summary ?? "Sin resumen"}</span>
                </div>
              ))
            )}
          </article>
          <article className="glass-card report-history-card">
            <div className="report-history-header">
              <h3>Changelog</h3>
              <span className="assessment-preview-label">{summary.changeLogs.length}</span>
            </div>
            {summary.changeLogs.length === 0 ? (
              <p className="assessment-empty-note">No hay cambios registrados todavia.</p>
            ) : (
              summary.changeLogs.map((item) => (
                <div key={item.id} className="report-history-meta" style={{ marginBottom: "12px" }}>
                  <span>{item.action}</span>
                  <span>{item.entityType}</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              ))
            )}
          </article>
        </div>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          id="storage"
          icon={<Settings size={18} />}
          label="Storage"
          title="Storage - En desarrollo"
          description="El analisis de costos de storage todavia esta en desarrollo. Esta seccion existe para futura captura y modelado de storage origen/destino, pero actualmente no modifica calculos financieros ni recomendaciones del assessment."
        />
        <p className="assessment-table-note">
          COST-1A no agrega formularios, modelos ni calculos de storage. Storage no afecta scores, reportes ni recomendaciones.
        </p>
      </section>
    </main>
  );
}
