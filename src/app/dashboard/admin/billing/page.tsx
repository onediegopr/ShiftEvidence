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
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  fulfillBillingOrderAction,
  matchBillingOrderAction,
  matchBillingSubscriptionAction,
  revokeBillingGrantedEntitlementAction,
} from "./actions";
import { requireAdminSession } from "../../../../server/admin/adminAuth";
import {
  getBillingAdminLedgerSnapshot,
  getBillingLedgerFallback,
  type BillingAdminLedgerEvent,
  type BillingAdminLedgerOrder,
  type BillingAdminLedgerPayment,
  type BillingAdminLedgerSubscription,
} from "../../../../server/billing/admin/billingAdminLedgerService";
import {
  formatBillingRiskLevel,
  formatBooleanPresence,
  formatBooleanYesNo,
  getBillingCommercialStatusTone,
  getBillingEventStatusLabel,
  getBillingEventStatusTone,
  getBillingGrantReviewStatusLabel,
  getBillingGrantReviewStatusTone,
  getBillingGrantStatusLabel,
  getBillingGrantStatusTone,
  getBillingMatchStatusLabel,
  getBillingMatchStatusTone,
  getBillingOrderStatusLabel,
  getBillingPaymentStatusLabel,
  getBillingSubscriptionStatusLabel,
} from "../../../../server/billing/admin/billingAdminLabels";
import {
  getBillingAdminMatchCandidates,
  type BillingAdminMatchCandidates,
} from "../../../../server/billing/admin/billingAdminMatchSearchService";
import {
  previewBillingOrdersFulfillment,
  type BillingFulfillmentPreview,
} from "../../../../server/billing/admin/billingManualFulfillmentService";
import {
  getBillingOrderMatchStatus,
  getBillingSubscriptionMatchStatus,
} from "../../../../server/billing/admin/billingManualMatchService";
import {
  getBillingRefundCancelReviewItems,
  type BillingGrantReviewItem,
} from "../../../../server/billing/admin/billingRefundCancelReviewService";
import {
  getBillingProviderStatusSnapshot,
  getCheckoutPlanLinks,
} from "../../../../server/billing/admin/billingProviderStatusService";

type AdminBillingPageProps = {
  searchParams?: Promise<{
    error?: string;
    saved?: string;
    matchSearch?: string;
  }>;
};

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

function formatPlan(value: string) {
  const labels: Record<string, string> = {
    starter_readiness: "Starter Readiness",
    professional_assessment: "Professional Assessment",
    migration_blueprint: "Migration Blueprint",
    msp_partner: "MSP Partner",
  };

  return labels[value] ?? value;
}

function formatAmount(amountCents: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

function formatMatchState(record: {
  userId?: string | null;
  workspaceId?: string | null;
  assessmentId?: string | null;
}) {
  const missing = [
    record.userId ? null : "usuario",
    record.workspaceId ? null : "workspace",
    "assessmentId" in record && record.assessmentId ? null : "assessment",
  ].filter(Boolean);

  return missing.length === 0 ? "Con match" : `Sin match: ${missing.join(", ")}`;
}

function formatQueryMessage(value: string | null | undefined) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
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

function CandidateSelect({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  options: Array<{ id: string; label: string }>;
}) {
  return (
    <label style={{ display: "grid", gap: "6px" }}>
      <span className="assessment-preview-label">{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className="admin-input">
        <option value="">Sin seleccionar</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function MatchSearchForm({ query }: { query: string }) {
  return (
    <form className="billing-match-form" style={{ display: "flex", gap: "12px", alignItems: "end" }}>
      <label style={{ display: "grid", gap: "6px", flex: 1 }}>
        <span className="assessment-preview-label">Buscar candidatos</span>
        <input
          className="admin-input"
          name="matchSearch"
          defaultValue={query}
          placeholder="email, nombre, workspace, assessment"
        />
      </label>
      <button className="btn btn-secondary" type="submit">
        <Search size={16} />
        Buscar
      </button>
    </form>
  );
}

function OrderMatchForm({
  order,
  candidates,
}: {
  order: BillingAdminLedgerOrder;
  candidates: BillingAdminMatchCandidates;
}) {
  return (
    <form action={matchBillingOrderAction} className="billing-match-form" style={{ marginTop: "12px" }}>
      <input type="hidden" name="billingOrderId" value={order.id} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>
        <CandidateSelect
          name="userId"
          label="Usuario"
          defaultValue={order.userId}
          options={candidates.users.map((user) => ({
            id: user.id,
            label: `${user.email} - ${user.name}`,
          }))}
        />
        <CandidateSelect
          name="workspaceId"
          label="Workspace"
          defaultValue={order.workspaceId}
          options={candidates.workspaces.map((workspace) => ({
            id: workspace.id,
            label: `${workspace.name} - ${workspace.ownerEmail}`,
          }))}
        />
        <CandidateSelect
          name="assessmentId"
          label="Assessment"
          defaultValue={order.assessmentId}
          options={candidates.assessments.map((assessment) => ({
            id: assessment.id,
            label: `${assessment.title} - ${assessment.workspaceName}`,
          }))}
        />
      </div>
      <label style={{ display: "grid", gap: "6px", marginTop: "12px" }}>
        <span className="assessment-preview-label">Nota interna</span>
        <textarea
          className="admin-input"
          name="note"
          rows={2}
          placeholder="Contexto operativo del match. No guardar secretos ni datos de tarjeta."
        />
      </label>
      <p className="assessment-inline-note">Guardar match no otorga acceso. El acceso se concede en un hito posterior de fulfillment.</p>
      <button className="btn btn-secondary" type="submit">Guardar match</button>
    </form>
  );
}

function SubscriptionMatchForm({
  subscription,
  candidates,
}: {
  subscription: BillingAdminLedgerSubscription;
  candidates: BillingAdminMatchCandidates;
}) {
  return (
    <form action={matchBillingSubscriptionAction} className="billing-match-form" style={{ marginTop: "12px" }}>
      <input type="hidden" name="billingSubscriptionId" value={subscription.id} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
        <CandidateSelect
          name="userId"
          label="Usuario"
          defaultValue={subscription.userId}
          options={candidates.users.map((user) => ({
            id: user.id,
            label: `${user.email} - ${user.name}`,
          }))}
        />
        <CandidateSelect
          name="workspaceId"
          label="Workspace"
          defaultValue={subscription.workspaceId}
          options={candidates.workspaces.map((workspace) => ({
            id: workspace.id,
            label: `${workspace.name} - ${workspace.ownerEmail}`,
          }))}
        />
      </div>
      <label style={{ display: "grid", gap: "6px", marginTop: "12px" }}>
        <span className="assessment-preview-label">Nota interna</span>
        <textarea
          className="admin-input"
          name="note"
          rows={2}
          placeholder="Contexto operativo del match. No guardar secretos ni datos de tarjeta."
        />
      </label>
      <p className="assessment-inline-note">Guardar match no activa acceso partner automaticamente.</p>
      <button className="btn btn-secondary" type="submit">Guardar match</button>
    </form>
  );
}

function BillingFulfillmentPanel({
  order,
  preview,
}: {
  order: BillingAdminLedgerOrder;
  preview?: BillingFulfillmentPreview;
}) {
  if (!preview) return null;

  const isAlreadyGranted = preview.status === "already_granted";
  const disabled = !preview.eligible;

  return (
    <article className="glass-card report-history-card">
      <div className="report-history-header">
        <div>
          <span className="assessment-preview-label">Fulfillment manual</span>
          <h3>{formatPlan(order.planId)}</h3>
        </div>
        <Chip
          label={isAlreadyGranted ? "Ya concedido" : preview.eligible ? "Elegible" : "No elegible"}
          tone={isAlreadyGranted ? "good" : preview.eligible ? "warning" : "neutral"}
        />
      </div>
      <FieldList
        rows={[
          ["Provider Order ID", order.providerOrderId ?? "-"],
          ["Estado pago", getBillingOrderStatusLabel(order.status)],
          ["Match", getBillingMatchStatusLabel(getBillingOrderMatchStatus(order))],
          ["Entitlements", preview.entitlementKeys.length > 0 ? preview.entitlementKeys.join(", ") : "Sin mapping soportado"],
          ["Grants existentes", preview.existingGrantKeys.length > 0 ? preview.existingGrantKeys.join(", ") : "Ninguno"],
        ]}
      />
      <div className="dashboard-banner dashboard-banner-warning" role="alert" style={{ marginTop: "14px" }}>
        Esta accion concede acceso real al assessment seleccionado.
      </div>
      {preview.reasons.length > 0 ? (
        <ul className="assessment-inline-note" style={{ marginTop: "12px" }}>
          {preview.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
      <form action={fulfillBillingOrderAction} className="billing-match-form" style={{ marginTop: "14px" }}>
        <input type="hidden" name="billingOrderId" value={order.id} />
        <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <input type="checkbox" name="confirmFulfillment" value="confirmed" disabled={disabled} />
          <span>Confirmo que verifique el pago y el match.</span>
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span className="assessment-preview-label">Nota interna</span>
          <textarea
            className="admin-input"
            name="note"
            rows={2}
            disabled={disabled}
            placeholder="Contexto operativo. No guardar secretos ni datos de tarjeta."
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={disabled}>
          Conceder acceso manual
        </button>
      </form>
    </article>
  );
}

function BillingRevocationReviewPanel({ reviewItems }: { reviewItems: BillingGrantReviewItem[] }) {
  if (reviewItems.length === 0) {
    return <p className="assessment-empty-note">No hay grants de billing para revisar todavia.</p>;
  }

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      {reviewItems.map((item) => (
        <article key={item.id} className="glass-card report-history-card">
          <div className="report-history-header">
            <div>
              <span className="assessment-preview-label">Grant de billing</span>
              <h3>{item.entitlementKey}</h3>
            </div>
            <Chip
              label={getBillingGrantReviewStatusLabel(item.reviewStatus)}
              tone={getBillingGrantReviewStatusTone(item.reviewStatus)}
            />
          </div>
          <FieldList
            rows={[
              ["Provider Order ID", item.providerOrderId ?? "-"],
              ["Order status", item.orderStatus ? getBillingOrderStatusLabel(item.orderStatus) : "-"],
              ["Provider Subscription ID", item.providerSubscriptionId ?? "-"],
              ["Subscription status", item.subscriptionStatus ? getBillingSubscriptionStatusLabel(item.subscriptionStatus) : "-"],
              ["Grant status", <Chip key="grant-status" label={getBillingGrantStatusLabel(item.grantStatus)} tone={getBillingGrantStatusTone(item.grantStatus)} />],
              ["Fuente", item.source],
              ["Usuario", item.userId ?? "-"],
              ["Workspace", item.workspaceId ?? "-"],
              ["Assessment", item.assessmentId ?? "-"],
              ["Concedido", formatDate(item.grantedAt)],
              ["Revocado", formatDate(item.revokedAt)],
            ]}
          />
          <p className="assessment-inline-note">{item.recommendedAction}</p>
          {item.canRevoke ? (
            <form action={revokeBillingGrantedEntitlementAction} className="billing-match-form" style={{ marginTop: "14px" }}>
              <input type="hidden" name="billingEntitlementGrantId" value={item.id} />
              <div className="dashboard-banner dashboard-banner-error" role="alert" style={{ marginBottom: "12px" }}>
                Esta accion puede quitar acceso real al assessment.
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <input type="checkbox" name="confirmRevocation" value="confirmed" />
                <span>Confirmo que revise el refund/cancel y quiero revocar este acceso.</span>
              </label>
              <label style={{ display: "grid", gap: "6px" }}>
                <span className="assessment-preview-label">Nota interna obligatoria</span>
                <textarea
                  className="admin-input"
                  name="note"
                  rows={2}
                  required
                  placeholder="Motivo operativo de la revocacion. No guardar secretos ni datos de tarjeta."
                />
              </label>
              <button className="btn btn-secondary" type="submit">Revocar acceso manual</button>
            </form>
          ) : (
            <p className="assessment-inline-note">
              No hay accion automatica. Las suscripciones, fuentes no manuales y grants ya revocados quedan solo para revision.
            </p>
          )}
        </article>
      ))}
    </div>
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

function OrdersTable({
  orders,
  candidates,
  fulfillmentPreviews,
  showMatchForm = false,
  showFulfillment = false,
}: {
  orders: BillingAdminLedgerOrder[];
  candidates?: BillingAdminMatchCandidates;
  fulfillmentPreviews?: Record<string, BillingFulfillmentPreview>;
  showMatchForm?: boolean;
  showFulfillment?: boolean;
}) {
  if (orders.length === 0) {
    return <p className="assessment-empty-note">No hay ordenes comerciales registradas todavia.</p>;
  }

  return (
    <div className="assessment-table-wrap">
      <table className="assessment-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Provider</th>
            <th>Plan</th>
            <th>Email cliente</th>
            <th>Estado</th>
            <th>Monto</th>
            <th>Match</th>
            <th>Estado match</th>
            <th>Provider Order ID</th>
            <th>Pago/Reembolso</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{formatDate(order.createdAt)}</td>
              <td>{formatProvider(order.provider)}</td>
              <td>{formatPlan(order.planId)}</td>
              <td>{order.customerEmail ?? "-"}</td>
              <td>
                <Chip
                  label={getBillingOrderStatusLabel(order.status)}
                  tone={getBillingCommercialStatusTone(order.status)}
                />
              </td>
              <td>{formatAmount(order.amountCents, order.currency)}</td>
              <td>{formatMatchState(order)}</td>
              <td>
                <Chip
                  label={getBillingMatchStatusLabel(getBillingOrderMatchStatus(order))}
                  tone={getBillingMatchStatusTone(getBillingOrderMatchStatus(order))}
                />
              </td>
              <td>{order.providerOrderId ?? "-"}</td>
              <td>{formatDate(order.refundedAt ?? order.paidAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {showMatchForm && candidates ? (
        <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
          {orders.map((order) => (
            <article key={`match-${order.id}`} className="glass-card report-history-card">
              <h3>Revisar match de orden</h3>
              <FieldList
                rows={[
                  ["Plan", formatPlan(order.planId)],
                  ["Email cliente", order.customerEmail ?? "-"],
                  ["Provider Order ID", order.providerOrderId ?? "-"],
                  ["Estado actual", getBillingMatchStatusLabel(getBillingOrderMatchStatus(order))],
                ]}
              />
              <OrderMatchForm order={order} candidates={candidates} />
            </article>
          ))}
        </div>
      ) : null}
      {showFulfillment && fulfillmentPreviews ? (
        <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
          {orders.map((order) => (
            <BillingFulfillmentPanel
              key={`fulfillment-${order.id}`}
              order={order}
              preview={fulfillmentPreviews[order.id]}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PaymentsTable({ payments }: { payments: BillingAdminLedgerPayment[] }) {
  if (payments.length === 0) {
    return <p className="assessment-empty-note">No hay pagos comerciales registrados todavia.</p>;
  }

  return (
    <div className="assessment-table-wrap">
      <table className="assessment-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Provider</th>
            <th>Monto</th>
            <th>Estado</th>
            <th>Provider Payment ID</th>
            <th>Orden provider</th>
            <th>Orden interna</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>{formatDate(payment.createdAt)}</td>
              <td>{formatProvider(payment.provider)}</td>
              <td>{formatAmount(payment.amountCents, payment.currency)}</td>
              <td>
                <Chip
                  label={getBillingPaymentStatusLabel(payment.status)}
                  tone={getBillingCommercialStatusTone(payment.status)}
                />
              </td>
              <td>{payment.providerPaymentId ?? "-"}</td>
              <td>{payment.providerOrderId ?? "-"}</td>
              <td>{payment.orderId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubscriptionsTable({
  subscriptions,
  candidates,
  showMatchForm = false,
}: {
  subscriptions: BillingAdminLedgerSubscription[];
  candidates?: BillingAdminMatchCandidates;
  showMatchForm?: boolean;
}) {
  if (subscriptions.length === 0) {
    return <p className="assessment-empty-note">No hay suscripciones comerciales registradas todavia.</p>;
  }

  return (
    <div className="assessment-table-wrap">
      <table className="assessment-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Provider</th>
            <th>Plan</th>
            <th>Email</th>
            <th>Estado</th>
            <th>Periodo actual</th>
            <th>Workspace</th>
            <th>Estado match</th>
            <th>Provider Subscription ID</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((subscription) => (
            <tr key={subscription.id}>
              <td>{formatDate(subscription.createdAt)}</td>
              <td>{formatProvider(subscription.provider)}</td>
              <td>{formatPlan(subscription.planId)}</td>
              <td>{subscription.customerEmail ?? "-"}</td>
              <td>
                <Chip
                  label={getBillingSubscriptionStatusLabel(subscription.status)}
                  tone={getBillingCommercialStatusTone(subscription.status)}
                />
              </td>
              <td>{formatDate(subscription.currentPeriodStart)} / {formatDate(subscription.currentPeriodEnd)}</td>
              <td>{subscription.workspaceId ? "Con workspace" : "Sin match"}</td>
              <td>
                <Chip
                  label={getBillingMatchStatusLabel(getBillingSubscriptionMatchStatus(subscription))}
                  tone={getBillingMatchStatusTone(getBillingSubscriptionMatchStatus(subscription))}
                />
              </td>
              <td>{subscription.providerSubscriptionId ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {showMatchForm && candidates ? (
        <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
          {subscriptions.map((subscription) => (
            <article key={`match-${subscription.id}`} className="glass-card report-history-card">
              <h3>Revisar match de suscripcion</h3>
              <FieldList
                rows={[
                  ["Plan", formatPlan(subscription.planId)],
                  ["Email cliente", subscription.customerEmail ?? "-"],
                  ["Provider Subscription ID", subscription.providerSubscriptionId ?? "-"],
                  ["Estado actual", getBillingMatchStatusLabel(getBillingSubscriptionMatchStatus(subscription))],
                ]}
              />
              <SubscriptionMatchForm subscription={subscription} candidates={candidates} />
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default async function AdminBillingPage({ searchParams }: AdminBillingPageProps) {
  const session = await requireAdminSession();
  const query = await Promise.resolve(searchParams);
  const matchSearch = query?.matchSearch ?? "";
  let ledger;

  try {
    ledger = await getBillingAdminLedgerSnapshot(25);
  } catch {
    ledger = getBillingLedgerFallback();
  }

  const status = getBillingProviderStatusSnapshot(ledger);
  const checkoutLinks = getCheckoutPlanLinks();
  const matchCandidates = await getBillingAdminMatchCandidates({
    query: matchSearch,
    customerEmail: ledger.unmatchedOrders[0]?.customerEmail ?? ledger.unmatchedSubscriptions[0]?.customerEmail ?? null,
  });
  const fulfillmentPreviews = await previewBillingOrdersFulfillment({
    billingOrderIds: ledger.recentOrders.map((order) => order.id),
  });
  const revocationReviewItems = await getBillingRefundCancelReviewItems(25);
  const savedMessage = query?.saved
    ? query.saved === "order-match"
      ? "Match de orden guardado."
      : query.saved === "subscription-match"
        ? "Match de suscripcion guardado."
        : query.saved === "fulfillment"
          ? "Acceso manual concedido o confirmado idempotentemente."
          : query.saved === "revocation"
            ? "Revocacion manual registrada o confirmada idempotentemente."
            : "Cambios guardados."
    : null;
  const errorMessage = formatQueryMessage(query?.error);

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero glass-card">
        <div>
          <div className="badge badge-cyan">Administracion</div>
          <h1>Billing y proveedores</h1>
          <p>Estado operativo de checkout, proveedores, fulfillment manual, webhooks, ledger y entitlements.</p>
          <p className="assessment-inline-note">Sesion admin: {session.user.email}</p>
          {savedMessage ? <div className="dashboard-banner dashboard-banner-success" role="status">{savedMessage}</div> : null}
          {errorMessage ? <div className="dashboard-banner dashboard-banner-error" role="alert">{errorMessage}</div> : null}
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
        <MetricCard icon={<Database size={22} />} label="Ledger" value={status.operations.ledger ? "ON" : "OFF"} note="Eventos y ledger comercial" />
        <MetricCard icon={<BadgePercent size={22} />} label="Entitlements automaticos" value={status.operations.automaticEntitlements ? "ON" : "OFF"} note="Sin grants automaticos" />
        <MetricCard icon={<Gauge size={22} />} label="Reconciliacion" value="Manual" note="Sin match automatico" />
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
              ["Ordenes persistidas", ledger.recentOrdersCount],
              ["Pagos persistidos", ledger.recentPaymentsCount],
              ["Suscripciones persistidas", ledger.recentSubscriptionsCount],
              ["Registros sin match", ledger.unmatchedOrdersCount + ledger.unmatchedSubscriptionsCount],
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
            <span>Ledger comercial</span>
          </div>
          <h2>Ordenes, pagos y suscripciones</h2>
          <p>
            Estos registros reflejan eventos comerciales capturados desde Lemon. No otorgan acceso y no reemplazan
            el fulfillment manual.
          </p>
        </div>
        <section className="assessment-summary-grid">
          <MetricCard icon={<Database size={22} />} label="Ordenes" value={ledger.recentOrdersCount} note="Creadas por eventos Lemon" />
          <MetricCard icon={<Banknote size={22} />} label="Pagos" value={ledger.recentPaymentsCount} note="Solo con ID estable" />
          <MetricCard icon={<BadgePercent size={22} />} label="Suscripciones" value={ledger.recentSubscriptionsCount} note="MSP y renewals futuros" />
          <MetricCard icon={<AlertTriangle size={22} />} label="Sin match" value={ledger.unmatchedOrdersCount + ledger.unmatchedSubscriptionsCount} note="Requiere revision manual" />
        </section>
        <h3>Ordenes recientes</h3>
        <OrdersTable
          orders={ledger.recentOrders}
          fulfillmentPreviews={fulfillmentPreviews}
          showFulfillment
        />
        <h3>Pagos recientes</h3>
        <PaymentsTable payments={ledger.recentPayments} />
        <h3>Suscripciones recientes</h3>
        <SubscriptionsTable subscriptions={ledger.recentSubscriptions} />
      </section>

      <section className="assessment-section glass-card">
        <div className="assessment-section-title">
          <div className="assessment-section-eyebrow">
            <AlertTriangle size={18} />
            <span>Refund/cancel boundary</span>
          </div>
          <h2>Riesgos y revocaciones</h2>
          <p>
            Esta vista muestra grants concedidos por fulfillment billing manual. Los refunds y cancelaciones solo
            marcan revision; no revocan acceso automaticamente.
          </p>
        </div>
        <div className="dashboard-banner dashboard-banner-warning" role="alert" style={{ marginBottom: "16px" }}>
          Esta accion puede quitar acceso real al assessment. Requiere confirmacion explicita y nota interna.
        </div>
        <BillingRevocationReviewPanel reviewItems={revocationReviewItems} />
      </section>

      <section className="assessment-section glass-card">
        <div className="assessment-section-title">
          <div className="assessment-section-eyebrow">
            <AlertTriangle size={18} />
            <span>Unmatched</span>
          </div>
          <h2>Registros sin match</h2>
          <p>Requiere revision manual. No otorga acceso automaticamente.</p>
        </div>
        <MatchSearchForm query={matchSearch} />
        <h3>Ordenes sin match completo</h3>
        <OrdersTable orders={ledger.unmatchedOrders} candidates={matchCandidates} showMatchForm />
        <h3>Suscripciones sin match</h3>
        <SubscriptionsTable subscriptions={ledger.unmatchedSubscriptions} candidates={matchCandidates} showMatchForm />
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
            ["Pago aparece en Lemon pero no en Shift Evidence", "Revisar entrega webhook, firma, evento fallido, ID estable y procesamiento comercial pendiente."],
            ["Orden sin match", "Verificar email, workspace y assessment. El match manual queda para un hito posterior."],
            ["Pago visible pero sin acceso", "Correcto por diseno: el ledger no concede acceso. Usar fulfillment manual."],
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
