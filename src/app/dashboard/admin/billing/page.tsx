import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgePercent,
  Banknote,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  Gauge,
  LinkIcon,
  ShieldCheck,
} from "lucide-react";
import { requireAdminSession } from "../../../../server/admin/adminAuth";
import {
  getBillingAdminLedgerSnapshot,
  getBillingLedgerFallback,
  type BillingAdminLedgerEvent,
} from "../../../../server/billing/admin/billingAdminLedgerService";
import {
  formatBillingRiskLevel,
  formatBooleanPresence,
  formatBooleanYesNo,
  getBillingEventStatusLabel,
  getBillingEventStatusTone,
} from "../../../../server/billing/admin/billingAdminLabels";
import {
  getBillingProviderStatusSnapshot,
  getCheckoutPlanLinks,
} from "../../../../server/billing/admin/billingProviderStatusService";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Sin eventos";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin eventos";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatProvider(value: string) {
  const labels: Record<string, string> = {
    lemon_squeezy: "Lemon Squeezy",
    wise: "Wise",
    stripe: "Stripe",
  };

  return labels[value] ?? value;
}

function formatLemonStatus(value: string) {
  const labels: Record<string, string> = {
    no_configurado: "No configurado",
    configurado_test: "Configurado test",
    configurado_live: "Configurado live",
    error: "Error",
    desactivado: "Desactivado",
  };

  return labels[value] ?? value;
}

function formatWiseStatus(value: string) {
  const labels: Record<string, string> = {
    factura_manual: "Factura manual",
    api_no_configurada: "API no configurada",
    api_sandbox_configurada: "API sandbox configurada",
    api_produccion_configurada: "API produccion configurada",
    error: "Error",
  };

  return labels[value] ?? value;
}

function formatCheckoutMode(value: string) {
  const labels: Record<string, string> = {
    test: "Test",
    live: "Live",
    unknown: "Desconocido",
  };

  return labels[value] ?? value;
}

function formatWiseApiMode(value: string) {
  const labels: Record<string, string> = {
    sandbox: "Sandbox",
    production: "Produccion",
    not_configured: "No configurada",
  };

  return labels[value] ?? value;
}

function statusTone(value: string) {
  if (value.includes("live") || value.includes("alto") || value === "failed") return "danger";
  if (value.includes("test") || value.includes("ok") || value === "processed") return "good";
  if (value.includes("manual") || value.includes("pendiente") || value.includes("medio")) return "warning";
  return "neutral";
}

function Chip({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "good" | "warning" | "danger" }) {
  return <span className={`assessment-chip assessment-chip-${tone}`}>{label}</span>;
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

function FieldList({ rows }: { rows: Array<[string, string | number | ReactNode]> }) {
  return (
    <dl className="report-history-meta" style={{ display: "grid", gap: "10px" }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
          <dt>{label}</dt>
          <dd style={{ margin: 0, textAlign: "right" }}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ProviderCard({
  icon,
  title,
  status,
  risk,
  children,
}: {
  icon: ReactNode;
  title: string;
  status: string;
  risk: string;
  children: ReactNode;
}) {
  return (
    <article className="glass-card report-history-card">
      <div className="report-history-header">
        <div>
          <span className="assessment-preview-label">{title}</span>
          <h3>{status}</h3>
        </div>
        <Chip label={`Riesgo ${risk}`} tone={statusTone(risk)} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        {icon}
        <span className="assessment-inline-note">Estado operativo seguro, sin secretos.</span>
      </div>
      {children}
    </article>
  );
}

function EventsTable({ events }: { events: BillingAdminLedgerEvent[] }) {
  if (events.length === 0) {
    return <p className="assessment-empty-note">No hay eventos webhook registrados todavia.</p>;
  }

  return (
    <div className="assessment-table-wrap">
      <table className="assessment-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Provider</th>
            <th>Evento</th>
            <th>Estado</th>
            <th>Provider Event ID</th>
            <th>Error</th>
            <th>Procesado</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{formatDate(event.receivedAt)}</td>
              <td>{formatProvider(event.provider)}</td>
              <td>{event.eventType}</td>
              <td>
                <Chip label={getBillingEventStatusLabel(event.status)} tone={getBillingEventStatusTone(event.status)} />
              </td>
              <td>{event.providerEventId}</td>
              <td>{event.errorMessage ?? "-"}</td>
              <td>{formatDate(event.processedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminBillingPage() {
  const session = await requireAdminSession();
  let ledger;

  try {
    ledger = await getBillingAdminLedgerSnapshot(25);
  } catch {
    ledger = getBillingLedgerFallback();
  }

  const status = getBillingProviderStatusSnapshot(ledger);
  const checkoutLinks = getCheckoutPlanLinks();

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero glass-card">
        <div>
          <div className="badge badge-cyan">Administracion</div>
          <h1>Billing y proveedores</h1>
          <p>Estado operativo de checkout, proveedores, fulfillment manual, webhooks, ledger y entitlements.</p>
          <p className="assessment-inline-note">Sesion admin: {session.user.email}</p>
        </div>
        <div className="dashboard-hero-actions">
          <Link href="/dashboard/admin" className="btn btn-secondary">
            <ArrowLeft size={16} />
            Volver a admin
          </Link>
          <Link href="/dashboard/admin/unlock-requests" className="btn btn-secondary">
            <ClipboardList size={16} />
            Solicitudes
          </Link>
        </div>
      </section>

      <section className="assessment-summary-grid">
        <MetricCard icon={<CheckCircle2 size={22} />} label="Checkout test-mode" value={status.operations.checkoutTestMode ? "OK" : "NO"} note="Modo seguro esperado" />
        <MetricCard icon={<AlertTriangle size={22} />} label="Live payments" value={status.operations.livePayments ? "ON" : "OFF"} note="No activar sin hito separado" />
        <MetricCard icon={<ShieldCheck size={22} />} label="Manual fulfillment" value={status.operations.manualFulfillment ? "ON" : "OFF"} note="Runbook manual activo" />
        <MetricCard icon={<LinkIcon size={22} />} label="Webhooks" value={status.operations.webhooks ? "ON" : "OFF"} note="Endpoint disponible, secret separado" />
        <MetricCard icon={<Database size={22} />} label="Ledger" value={status.operations.ledger ? "ON" : "OFF"} note="BillingEvent solamente" />
        <MetricCard icon={<BadgePercent size={22} />} label="Entitlements automaticos" value={status.operations.automaticEntitlements ? "ON" : "OFF"} note="Sin grants automaticos" />
        <MetricCard icon={<Gauge size={22} />} label="Reconciliacion" value="Manual" note="Sin ordenes/pagos/suscripciones" />
        <MetricCard icon={<AlertTriangle size={22} />} label="Eventos fallidos" value={status.operations.failedEventsCount} note="Requieren revision segura" />
      </section>

      <section className="report-history-grid">
        <ProviderCard
          icon={<BadgePercent size={22} />}
          title="Lemon Squeezy"
          status={formatLemonStatus(status.lemon.status)}
          risk={formatBillingRiskLevel(status.lemon.riskLevel)}
        >
          <FieldList
            rows={[
              ["Store ID", formatBooleanPresence(status.lemon.storeIdPresent)],
              ["API key", formatBooleanPresence(status.lemon.apiKeyPresent)],
              ["API key alias MCP", formatBooleanPresence(status.lemon.apiKeyAliasPresent)],
              ["Starter Variant ID", formatBooleanPresence(status.lemon.starterVariantPresent)],
              ["Professional Variant ID", formatBooleanPresence(status.lemon.professionalVariantPresent)],
              ["MSP Variant ID", formatBooleanPresence(status.lemon.mspVariantPresent)],
              ["Checkout mode", formatCheckoutMode(status.lemon.checkoutMode)],
              ["Checkout habilitado", formatBooleanYesNo(status.lemon.checkoutEnabled)],
              ["Webhook secret", formatBooleanPresence(status.lemon.webhookSecretPresent)],
              ["Endpoint webhook", status.lemon.webhookEndpointAvailable ? "Disponible" : "No disponible"],
              ["Eventos recibidos", status.operations.recentEventsCount],
              ["Eventos fallidos", status.operations.failedEventsCount],
              ["Ultimo evento", formatDate(status.operations.lastEventAt)],
            ]}
          />
          <p className="assessment-inline-note">{status.lemon.recommendedAction}</p>
        </ProviderCard>

        <ProviderCard
          icon={<Banknote size={22} />}
          title="Wise"
          status={formatWiseStatus(status.wise.status)}
          risk={formatBillingRiskLevel(status.wise.riskLevel)}
        >
          <FieldList
            rows={[
              ["Token", formatBooleanPresence(status.wise.tokenPresent)],
              ["API URL", formatWiseApiMode(status.wise.apiUrlMode)],
              ["Profile ID", formatBooleanPresence(status.wise.profileIdPresent)],
              ["Uso actual", status.wise.currentUse],
              ["Automatizacion", "Desactivada"],
              ["Ultima verificacion", status.wise.lastVerification],
            ]}
          />
          <p className="assessment-inline-note">{status.wise.recommendedAction}</p>
        </ProviderCard>

        <ProviderCard
          icon={<ShieldCheck size={22} />}
          title="Stripe"
          status="Diferido / desactivado"
          risk={formatBillingRiskLevel(status.stripe.riskLevel)}
        >
          <FieldList
            rows={[
              ["Visible publicamente", "No"],
              ["Checkout activo", "No"],
              ["Motivo", status.stripe.reason],
              ["Accion recomendada", status.stripe.recommendedAction],
            ]}
          />
        </ProviderCard>

        <ProviderCard
          icon={<Database size={22} />}
          title="Operaciones Billing"
          status="Lectura operativa"
          risk={status.operations.failedEventsCount > 0 ? "Medio" : "Bajo"}
        >
          <FieldList
            rows={[
              ["Checkout test-mode", status.operations.checkoutTestMode ? "OK" : "NO"],
              ["Live payments", status.operations.livePayments ? "ON" : "OFF"],
              ["Fulfillment manual", status.operations.manualFulfillment ? "ON" : "OFF"],
              ["Webhooks", status.operations.webhooks ? "ON" : "OFF"],
              ["Ledger", status.operations.ledger ? "ON" : "OFF"],
              ["Entitlements automaticos", "OFF"],
              ["Reconciliacion", "Manual"],
              ["Ordenes persistidas", "Futuro / No implementado"],
              ["Pagos persistidos", "Futuro / No implementado"],
              ["Suscripciones persistidas", "Futuro / No implementado"],
              ["Manual fulfillment runbook", "Activo"],
            ]}
          />
          <div className="assessment-inline-actions" style={{ marginTop: "14px" }}>
            <Link href="/dashboard/admin/unlock-requests" className="btn btn-secondary">Abrir solicitudes</Link>
            {checkoutLinks.map((link) => (
              <Link key={link.href} href={link.href} className="btn btn-secondary">{link.label}</Link>
            ))}
          </div>
        </ProviderCard>
      </section>

      <section className="assessment-section glass-card">
        <div className="assessment-section-title">
          <div className="assessment-section-eyebrow">
            <Database size={18} />
            <span>Ledger</span>
          </div>
          <h2>Eventos webhook recientes</h2>
          <p>
            Capturado significa que el evento fue verificado y persistido tecnicamente. No significa que una orden,
            pago, suscripcion o acceso haya sido procesado.
          </p>
        </div>
        <section className="assessment-summary-grid">
          <MetricCard icon={<Database size={22} />} label="Eventos recientes" value={ledger.recentEventsCount} note="Ultimos eventos visibles" />
          <MetricCard icon={<AlertTriangle size={22} />} label="Fallidos" value={ledger.failedEventsCount} note="Revisar antes de actuar" />
          <MetricCard icon={<Gauge size={22} />} label="Pendientes" value={ledger.pendingEventsCount} note="Persistidos sin cierre tecnico" />
          <MetricCard icon={<CheckCircle2 size={22} />} label="Ignorados" value={ledger.ignoredEventsCount} note="Duplicados o reintentos" />
        </section>
        <EventsTable events={ledger.recentEvents} />
      </section>

      <section className="assessment-section glass-card">
        <div className="assessment-section-title">
          <div className="assessment-section-eyebrow">
            <FileText size={18} />
            <span>Diagnostico rapido</span>
          </div>
          <h2>Soporte y problemas frecuentes</h2>
          <p>Guia operativa para triage sin automatizar cobros ni accesos.</p>
        </div>
        <div className="report-history-grid">
          {[
            ["Checkout devuelve not_configured", "Revisar API key, Store ID, Variant IDs, checkout disabled y redeploy pendiente."],
            ["Cliente pago pero no tiene acceso", "No hay grant automatico. Verificar Lemon, usar runbook manual y revisar solicitudes de desbloqueo."],
            ["Webhook no llega", "Revisar secret, URL configurada en Lemon, deploy del endpoint y firma invalida."],
            ["Evento fallido", "Revisar error safe. No otorgar acceso manual sin verificar Lemon."],
            ["Refund o cancelacion", "No borrar datos. Marcar revision manual y usar runbook."],
          ].map(([title, description]) => (
            <article key={title} className="glass-card report-history-card">
              <h3>{title}</h3>
              <p className="assessment-inline-note">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
