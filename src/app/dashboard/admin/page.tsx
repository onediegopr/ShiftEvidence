import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  BadgePercent,
  Bot,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  Gauge,
  HardDrive,
  LifeBuoy,
  Lock,
  Server,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getCurrentAdminUserForConsole } from "../../../server/admin/adminAuth";
import { getAdminConsoleData } from "../../../server/admin/adminConsoleService";
import { logger } from "../../../server/logging/logger";
import {
  createUserEntitlementAction,
  revokeUserEntitlementAction,
  setAiRuntimeModeFormAction,
  updateAiBudgetAction,
  updateCommercialOpportunityAction,
  updateOperationalRuntimeSettingsAction,
  updateSupportRequestAction,
} from "./actions";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "No disponible";
  const date = new Date(value);
  if (date.getTime() === 0 || Number.isNaN(date.getTime())) return "No disponible";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(value: number | null | undefined) {
  return typeof value === "number" ? `${value} ms` : "No disponible";
}

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" ? new Intl.NumberFormat("es-AR").format(value) : "No disponible";
}

function formatCurrency(value: number | null | undefined) {
  return typeof value === "number"
    ? new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 6,
      }).format(value)
    : "No disponible";
}

function formatPercent(value: number | null | undefined) {
  return typeof value === "number" ? `${value}%` : "No configurado";
}

function formatAiEventType(value: string) {
  const labels: Record<string, string> = {
    ai_advisory_requested: "Solicitud IA",
    ai_advisory_success: "IA exitosa",
    ai_advisory_failed: "IA con error",
    ai_advisory_timeout: "Timeout IA",
    ai_advisory_fallback_used: "Fallback usado",
  };
  return labels[value] ?? value;
}

function formatSupportStatus(value: string) {
  const labels: Record<string, string> = {
    open: "Abierta",
    triage: "En triage",
    waiting_on_user: "Esperando usuario",
    resolved: "Resuelta",
    closed: "Cerrada",
  };
  return labels[value] ?? formatStatusLabel(value);
}

function formatSupportPriority(value: string) {
  const labels: Record<string, string> = {
    low: "Baja",
    normal: "Normal",
    high: "Alta",
    urgent: "Urgente",
  };
  return labels[value] ?? formatStatusLabel(value);
}

function formatStatusLabel(value: string | null | undefined) {
  if (!value) return "No disponible";

  const labels: Record<string, string> = {
    active: "Activo",
    admin: "Administrador",
    admin_test: "Prueba admin",
    blueprint: "Blueprint",
    disabled: "Desactivado",
    disabled_runtime: "Desactivado por runtime",
    env: "Entorno",
    error: "Error",
    expired: "Vencido",
    fallback: "Fallback",
    free_preview: "Vista previa gratuita",
    gemini: "Google AI Studio Gemini",
    opencode_go: "OpenCode Go",
    internal_qa: "QA interno",
    lost: "Perdido",
    manual: "Manual",
    mock: "Simulación",
    msp_partner: "MSP Partner",
    needs_follow_up: "Requiere seguimiento",
    new_lead: "Nuevo lead",
    partner_candidate: "Candidato partner",
    paid: "Pagado",
    pending_payment: "Pago pendiente",
    professional: "Professional",
    proposal_sent: "Propuesta enviada",
    revoked: "Revocado",
    included: "Incluido",
    starter: "Starter",
    success: "Exitoso",
    timeout: "Timeout",
    trial: "Prueba",
    unavailable: "No disponible",
    unknown: "Desconocido",
    // Storage Readiness
    not_started: "No iniciado",
    draft: "Borrador",
    submitted: "Enviado",
    ready_for_analysis: "Listo para análisis",
    analysis_pending: "Análisis pendiente",
    analyzed: "Analizado",
    skipped: "Omitido",
    stale: "Desactualizado",
    failed: "Fallido",
    // Storage Modes
    agnostic: "Agnóstico",
    zfs_local: "ZFS Local",
    nfs_san: "NFS/SAN",
    ceph_candidate: "Candidato Ceph",
    // Storage Preferences
    nfs: "NFS",
    san: "SAN",
    ceph: "Ceph",
    pbs: "Proxmox Backup Server",
    not_decided: "No decidido",
    // Ceph Suitability
    ceph_applies: "Aplica Ceph",
    ceph_does_not_apply: "No aplica Ceph",
    ceph_conditional: "Ceph Condicional",
    ceph_overkill: "Ceph Overkill",
    ceph_underdesigned: "Ceph Subdimensionado",
    not_enough_evidence: "Evidencia insuficiente",
    deferred_storage_2: "Diferido (Storage 2)",
    not_evaluated_storage_1: "No evaluado (Storage 1)",
    // Evidence Expansion
    vmware_enrichment: "VMware enrichment",
    proxmox_target: "Validacion Proxmox",
    backup_evidence: "Evidencia backup",
    storage_san: "Storage / SAN",
    application_dependency: "Dependencias app",
    migration_plan_readiness: "Plan migracion",
    not_provided: "No provisto",
    template_downloaded: "Template descargado",
    collector_downloaded: "Collector descargado",
    uploaded: "Cargado",
    queued: "En cola",
    parsing: "Parseando",
    parsed: "Parseado",
    parsed_with_warnings: "Completado con advertencias",
    reviewed: "Revisado",
    collector_output: "Collector output",
  };

  return labels[value] ?? value;
}

function statusTone(status: string) {
  switch (status) {
    case "Operativo":
    case "Configurada":
    case "Verificado":
    case "Activa":
    case "Info":
      return "good";
    case "Atención":
    case "Pendiente":
    case "Desconocido":
      return "warning";
    case "Atencion":
      return "warning";
    case "Degradado":
      return "danger";
    case "Critico":
      return "danger";
    case "Crítico":
      return "danger";
    default:
      return "neutral";
  }
}

function StatusPill({ status }: { status: string }) {
  return <span className={`assessment-chip assessment-chip-${statusTone(status)}`}>{formatStatusLabel(status)}</span>;
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

function getAdminTabSectionKeys(activeTab: string) {
  const allSections = [
    "owner_lookup",
    "summary_metrics",
    "users",
    "assessments",
    "audit_events",
    "entitlements",
    "commercial_opportunities",
    "ai_budget",
    "advanced_audit",
    "runtime_settings",
    "advisor_methodology",
    "owner_emails",
    "ai_status",
    "ai_usage",
    "support_requests",
  ];

  const sectionKeysByTab: Record<string, string[]> = {
    resumen: allSections,
    "estado-sistema": ["summary_metrics", "runtime_settings", "ai_status"],
    usuarios: ["users", "entitlements", "commercial_opportunities", "ai_usage", "summary_metrics"],
    evaluaciones: ["owner_lookup", "assessments", "owner_emails", "commercial_opportunities", "ai_usage", "summary_metrics"],
    licenciamiento: ["assessments", "owner_emails"],
    "contexto-evidencias": ["assessments", "owner_emails"],
    "ia-consumo": ["ai_status", "ai_usage", "ai_budget"],
    "advisor-metodologia": ["advisor_methodology", "ai_usage"],
    "configuracion-operativa": ["runtime_settings", "ai_status"],
    "accesos-planes": ["users", "entitlements"],
    oportunidades: ["commercial_opportunities"],
    soporte: ["support_requests"],
    configuracion: ["runtime_settings"],
    auditoria: ["audit_events", "advanced_audit"],
  };

  return sectionKeysByTab[activeTab] ?? allSections;
}

function SectionFallbackNotice({
  activeTab,
  failures,
}: {
  activeTab: string;
  failures: Array<{ sectionKey: string; title: string; errorKey: string; message: string }>;
}) {
  const activeKeys = new Set(getAdminTabSectionKeys(activeTab));
  const visibleFailures = failures.filter((failure) => activeKeys.has(failure.sectionKey));

  if (visibleFailures.length === 0) return null;

  return (
    <div className="dashboard-banner dashboard-banner-warning" role="status">
      <strong>Seccion admin parcialmente degradada.</strong>{" "}
      Una o mas metricas opcionales no pudieron cargarse; la consola principal sigue disponible.
      <ul style={{ margin: "8px 0 0", paddingLeft: "18px" }}>
        {visibleFailures.map((failure) => (
          <li key={`${failure.sectionKey}-${failure.errorKey}`}>
            <strong>{failure.title}</strong>: {failure.message} <span className="assessment-inline-note">({failure.errorKey})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AccessDenied() {
  return (
    <main className="dashboard-page">
      <section className="dashboard-hero glass-card">
        <div>
          <div className="badge badge-cyan">Consola interna</div>
          <h1>No tenés permisos para acceder a esta consola.</h1>
          <p>Tu sesión está activa, pero tu usuario no está autorizado como administrador.</p>
        </div>
        <Link href="/dashboard" className="btn btn-secondary">
          Volver al panel
        </Link>
      </section>
      <section className="assessment-section glass-card">
        <SectionTitle
          id="acceso-denegado"
          icon={<Lock size={18} />}
          label="Acceso protegido"
          title="Permisos insuficientes"
          description="El acceso inicial se controla con ADMIN_EMAILS. Si necesitás acceso, pedile al operador que agregue tu email en la configuración segura."
        />
      </section>
    </main>
  );
}

function AdminConsoleUnavailable({ adminEmail }: { adminEmail: string }) {
  return (
    <main className="dashboard-page">
      <section className="dashboard-hero glass-card">
        <div>
          <div className="badge badge-cyan">Panel de Administración</div>
          <h1>La consola admin está en modo degradado.</h1>
          <p>
            No pudimos cargar los datos operativos en este runtime. La sesión admin sigue activa, pero
            evitamos romper la página mientras se corrige el runtime o se regenera el cliente Prisma.
          </p>
          <p className="assessment-inline-note">Sesión admin: {adminEmail}</p>
        </div>
        <div className="dashboard-hero-actions">
          <Link href="/dashboard" className="btn btn-secondary">
            Volver al panel
          </Link>
          <Link href="/dashboard/admin/pricing" className="btn btn-secondary">
            <Gauge size={16} />
            Inteligencia de Precios
          </Link>
        </div>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          id="admin-runtime-degradado"
          icon={<AlertTriangle size={18} />}
          label="Fallback seguro"
          title="Datos admin temporalmente no disponibles"
          description="El panel captura el error de carga y muestra este fallback para evitar un error 500/Server Components en producción."
        />
        <div className="dashboard-banner dashboard-banner-warning" role="status">
          La consola admin no pudo cargar una o mas secciones operativas. El resto del producto sigue disponible. Revisa los logs sanitizados para identificar la seccion afectada.
        </div>
      </section>
    </main>
  );
}

type AdminConsolePageProps = {
  searchParams?:
    | {
        tab?: string;
        usersSearch?: string;
        usersPage?: string;
        assessmentsSearch?: string;
        assessmentsPage?: string;
        editOpportunityId?: string;
        saved?: string;
        error?: string;
      }
    | Promise<{
        tab?: string;
        usersSearch?: string;
        usersPage?: string;
        assessmentsSearch?: string;
        assessmentsPage?: string;
        editOpportunityId?: string;
        saved?: string;
        error?: string;
      }>;
};

export default async function AdminConsolePage({ searchParams }: AdminConsolePageProps) {
  const { session, isAdmin } = await getCurrentAdminUserForConsole();

  if (!isAdmin) {
    return <AccessDenied />;
  }

  const query = await Promise.resolve(searchParams);
  const activeTab = query?.tab ?? "resumen";
  const usersPage = query?.usersPage ? parseInt(query.usersPage, 10) : 1;
  const usersSearch = query?.usersSearch ?? "";
  const assessmentsPage = query?.assessmentsPage ? parseInt(query.assessmentsPage, 10) : 1;
  const assessmentsSearch = query?.assessmentsSearch ?? "";
  const editOpportunityId = query?.editOpportunityId;

  const data = await getAdminConsoleData({
    usersPage,
    usersSearch,
    assessmentsPage,
    assessmentsSearch,
  }).catch((error: unknown) => {
    logger.error("admin_console_data_unavailable", {
      error,
      usersPage,
      assessmentsPage,
      usersSearchActive: Boolean(usersSearch),
      assessmentsSearchActive: Boolean(assessmentsSearch),
    });

    return null;
  });

  if (!data) {
    return <AdminConsoleUnavailable adminEmail={session.user.email} />;
  }

  const ai = data.aiStatus;
  const aiUsage = data.aiConsumption.persistentUsage;

  const saved = query?.saved;
  const error = query?.error ? decodeURIComponent(query.error) : null;
  const savedMessages: Record<string, string> = {
    budget: "Presupuesto IA actualizado correctamente.",
    entitlement: "Acceso manual de usuario guardado.",
    revoked: "Acceso revocado correctamente.",
    opportunity: "Oportunidad comercial actualizada.",
    runtime: "Configuración operativa en runtime actualizada.",
    support: "Solicitud de soporte actualizada.",
  };
  const savedMessage = saved ? (savedMessages[saved] ?? "Acción administrativa guardada.") : null;

  const navItems = [
    ["Resumen", "resumen"],
    ["Estado del Sistema", "estado-sistema"],
    ["Usuarios", "usuarios"],
    ["Evaluaciones", "evaluaciones"],
    ["Licenciamiento", "licenciamiento"],
    ["Contexto y Evidencias", "contexto-evidencias"],
    ["Storage/Ceph", "storage-ceph"],
    ["IA y Consumo", "ia-consumo"],
    ["Advisor Metodologia", "advisor-metodologia"],
    ["Configuración Operativa", "configuracion-operativa"],
    ["Accesos y Planes", "accesos-planes"],
    ["Oportunidades", "oportunidades"],
    ["Soporte", "soporte"],
    ["Configuración", "configuracion"],
    ["Auditoría", "auditoria"],
  ];

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero glass-card">
        <div>
          <div className="badge badge-cyan">Panel de Administración</div>
          <h1>Centro Operativo interno</h1>
          <p>
            Consola privada para operar ShiftReadiness, revisar salud del sistema, IA, usuarios,
            evaluaciones y señales administrativas sin exponer secretos.
          </p>
          <p className="assessment-inline-note">Sesión admin: {session.user.email}</p>
        </div>
        <div className="dashboard-hero-actions">
          <Link href="/dashboard/admin/pricing" className="btn btn-secondary">
            <Gauge size={16} />
            Inteligencia de Precios
          </Link>
          <Link href="/dashboard/admin/unlock-requests" className="btn btn-secondary">
            <ClipboardList size={16} />
            Solicitudes de desbloqueo
          </Link>
          <Link href="/dashboard/admin/billing" className="btn btn-secondary">
            <BadgePercent size={16} />
            Billing y proveedores
          </Link>
        </div>
      </section>

      <nav className="tabs-container" aria-label="Navegación de administración">
        {navItems.map(([label, key]) => (
          <Link key={key} href={`?tab=${key}`} className={`tab-btn ${activeTab === key ? "active" : ""}`}>
            {label}
          </Link>
        ))}
      </nav>

      {savedMessage ? <div className="dashboard-banner dashboard-banner-success" role="status" aria-live="polite">{savedMessage}</div> : null}
      {error ? <div className="dashboard-banner dashboard-banner-error" role="alert">{error}</div> : null}
      <SectionFallbackNotice activeTab={activeTab} failures={data.sectionFailures} />

      {activeTab === "resumen" && (
        <section id="resumen" className="assessment-summary-grid">
          <MetricCard icon={<Users size={22} />} label="Usuarios totales" value={data.summary.totalUsers} note="Cuentas registradas" />
          <MetricCard icon={<Database size={22} />} label="Evaluaciones totales" value={data.summary.totalAssessments} note="No archivadas" />
          <MetricCard icon={<Activity size={22} />} label="Últimos 7 días" value={data.summary.assessmentsLast7Days} note="Evaluaciones creadas" />
          <MetricCard icon={<FileText size={22} />} label="PDF generados" value={data.summary.totalReports} note="Reportes no borrados" />
          <MetricCard icon={<Bot size={22} />} label="IA Advisory" value={ai.iaActiva ? "Activa" : "No activa"} note={`Primario: ${formatStatusLabel(ai.proveedor)}; fallback: ${ai.proveedorFallback ? formatStatusLabel(ai.proveedorFallback) : "No configurado"}`} />
          <MetricCard icon={<Gauge size={22} />} label="Estado general" value={data.summary.generalStatus} note="Señal operativa agregada" />
          <MetricCard icon={<ShieldCheck size={22} />} label="Beta limitada" value={data.summary.betaStatus} note="Lanzamiento controlado" />
          <MetricCard icon={<AlertTriangle size={22} />} label="Full public launch" value={data.summary.fullPublicLaunch} note="No declarado" />
          <MetricCard icon={<Bot size={22} />} label="Advisor metodologia" value={data.advisorMethodology.runtime.enabled ? "Activa" : "No activa"} note={`${data.advisorMethodology.kbHealth.activeBlocks} bloques activos; ${data.advisorMethodology.usageStats.includedCount} inclusiones 30d`} />
          <MetricCard icon={<HardDrive size={22} />} label="Storage Activo" value={data.storageCeph?.activeStorageAssessments ?? 0} note="Con módulo storage" />
          <MetricCard icon={<Server size={22} />} label="Ceph Solicitado" value={data.storageCeph?.cephRequested ?? 0} note="Preferencia Ceph o candidate" />
          <MetricCard icon={<AlertTriangle size={22} />} label="Fallos IA Storage" value={(data.storageCeph?.aiAnalysisStatus?.failed ?? 0) + (data.storageCeph?.aiAnalysisStatus?.budget_blocked ?? 0) + (data.storageCeph?.aiAnalysisStatus?.plan_restricted ?? 0)} note="Fallados, bloqueados o restringidos" />
          <MetricCard icon={<LifeBuoy size={22} />} label="Soporte abierto" value={(data.supportRequests?.summary.open ?? 0) + (data.supportRequests?.summary.triage ?? 0)} note="Solicitudes abiertas o en triage" />
          <MetricCard icon={<BadgePercent size={22} />} label="Billing Provider" value={`Stripe (${data.billingStatus.providers[0].status})`} note="Checkout test-safe, fulfillment manual" />
        </section>
      )}

      {activeTab === "soporte" && (
        <section className="assessment-section glass-card">
          <SectionTitle
            id="soporte"
            icon={<LifeBuoy size={18} />}
            label="Soporte"
            title="Solicitudes de soporte"
            description="Bandeja interna para clasificar, priorizar, resolver o cerrar pedidos publicos y autenticados. No muestra secretos ni archivos crudos."
          />
          <section className="assessment-summary-grid">
            <MetricCard icon={<LifeBuoy size={22} />} label="Abiertas" value={data.supportRequests.summary.open} note="Pendientes de primera revision" />
            <MetricCard icon={<Activity size={22} />} label="En triage" value={data.supportRequests.summary.triage} note="En revision interna" />
            <MetricCard icon={<Users size={22} />} label="Esperando usuario" value={data.supportRequests.summary.waitingOnUser} note="Bloqueadas por respuesta externa" />
            <MetricCard icon={<CheckCircle2 size={22} />} label="Resueltas" value={data.supportRequests.summary.resolved} note="Marcadas como resueltas" />
            <MetricCard icon={<Lock size={22} />} label="Cerradas" value={data.supportRequests.summary.closed} note="Cierre administrativo" />
            <MetricCard icon={<AlertTriangle size={22} />} label="Alta prioridad" value={data.supportRequests.summary.highPriority} note="Alta o urgente sin cierre" />
          </section>

          <div className="report-history-grid">
            {data.supportRequests.recent.length === 0 ? (
              <article className="glass-card report-history-card">
                <h3>No hay solicitudes de soporte.</h3>
                <p className="assessment-inline-note">Cuando un usuario envie un pedido, aparecera en esta bandeja.</p>
              </article>
            ) : (
              data.supportRequests.recent.map((request) => (
                <article key={request.id} className="glass-card report-history-card">
                  <div className="report-history-header">
                    <div>
                      <h3>{request.subject}</h3>
                      <p className="assessment-inline-note">
                        {formatDate(request.createdAt)} · {formatStatusLabel(request.category)} · {formatStatusLabel(request.source)}
                      </p>
                    </div>
                    <StatusPill status={formatSupportStatus(request.status)} />
                  </div>
                  <p>{request.message}</p>
                  <div className="assessment-preview-grid">
                    <div>
                      <span className="assessment-preview-label">Contacto</span>
                      <strong>{request.contactEmail ?? request.user?.email ?? "No disponible"}</strong>
                      <p className="assessment-inline-note">{request.contactName ?? request.user?.name ?? request.companyName ?? "Sin nombre declarado"}</p>
                    </div>
                    <div>
                      <span className="assessment-preview-label">Assessment</span>
                      <strong>{request.assessment?.title ?? "No asociado"}</strong>
                      <p className="assessment-inline-note">{request.assessment?.clientLabel ?? request.workspace?.companyName ?? request.workspace?.name ?? "Sin contexto adicional"}</p>
                    </div>
                    <div>
                      <span className="assessment-preview-label">Prioridad</span>
                      <strong>{formatSupportPriority(request.priority)}</strong>
                      <p className="assessment-inline-note">Estado: {formatSupportStatus(request.status)}</p>
                    </div>
                  </div>
                  <form action={updateSupportRequestAction} className="unlock-admin-form">
                    <input type="hidden" name="supportRequestId" value={request.id} />
                    <label className="form-label">
                      Estado
                      <select name="status" className="form-input" defaultValue={request.status}>
                        <option value="open">Abierta</option>
                        <option value="triage">En triage</option>
                        <option value="waiting_on_user">Esperando usuario</option>
                        <option value="resolved">Resuelta</option>
                        <option value="closed">Cerrada</option>
                      </select>
                    </label>
                    <label className="form-label">
                      Prioridad
                      <select name="priority" className="form-input" defaultValue={request.priority}>
                        <option value="low">Baja</option>
                        <option value="normal">Normal</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </label>
                    <label className="form-label" style={{ gridColumn: "1 / -1" }}>
                      Notas internas
                      <textarea name="adminNotes" className="form-input assessment-textarea" defaultValue={request.adminNotes ?? ""} />
                    </label>
                    <button type="submit" className="btn btn-secondary">Guardar soporte</button>
                  </form>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === "configuracion-operativa" && (
        <section className="assessment-section glass-card">
          <SectionTitle
            id="configuracion-operativa"
            icon={<Settings size={18} />}
            label="Configuración Operativa"
            title="Configuración runtime y aplicación de límites"
            description="Overrides operativos seguros desde DB. No editan Hostinger, no muestran secretos y requieren confirmación."
          />
          <section className="assessment-summary-grid">
            <MetricCard icon={<Bot size={22} />} label="Modo IA runtime" value={data.runtimeSettings.aiRuntimeMode} note={`Primario: ${formatStatusLabel(ai.proveedor)}`} />
            <MetricCard icon={<ShieldCheck size={22} />} label="Aplicación de límites IA" value={data.runtimeSettings.aiEnforceBudget ? "Activo" : "Inactivo"} note={data.runtimeSettings.aiBlockOnBudgetExceeded ? "Bloquea al superar presupuesto" : "Solo informativo"} />
            <MetricCard icon={<FileText size={22} />} label="Generación PDF" value={data.runtimeSettings.reportsPdfGenerationEnabled ? "Activa" : "Bloqueada"} note="Control operativo global" />
            <MetricCard icon={<FileText size={22} />} label="Descargas" value={data.runtimeSettings.reportsDownloadEnabled ? "Activas" : "Bloqueadas"} note="Control operativo global" />
            <MetricCard icon={<Database size={22} />} label="Nuevas evaluaciones" value={data.runtimeSettings.assessmentsCreationEnabled ? "Activas" : "Bloqueadas"} note="Aplica antes de crear evaluaciones" />
            <MetricCard icon={<AlertTriangle size={22} />} label="Mantenimiento" value={data.runtimeSettings.maintenanceMode ? "Activo" : "Inactivo"} note="Informativo en ADMIN-4" />
          </section>
          <div className="assessment-preview-grid">
            <article className="glass-card report-history-card">
              <h3>Acciones rápidas IA</h3>
              <p className="assessment-inline-note">Cada acción usa `SystemSetting`, queda auditada y no toca variables Hostinger.</p>
              <div className="assessment-preview-grid">
                {[
                  ["disabled", "Apagar IA", "La IA queda desactivada por runtime setting."],
                  ["mock", "Volver a simulación", "Usa proveedor simulado para QA/control operativo."],
                  ["env", "Usar configuración env", "Vuelve a AI_ADVISORY_* de Hostinger/runtime."],
                  ["gemini", "Forzar Gemini", "Usa Google AI Studio Gemini como proveedor primario si la credencial existe en el entorno."],
                ].map(([mode, label, help]) => (
                  <form key={mode} className="unlock-admin-form" action={setAiRuntimeModeFormAction}>
                    <input type="hidden" name="mode" value={mode} />
                    <p className="assessment-inline-note">{help}</p>
                    <label className="assessment-inline-note">
                      <input name="confirmRuntimeChange" type="checkbox" required /> Confirmo este cambio operativo.
                    </label>
                    <button type="submit" className="btn btn-secondary">{label}</button>
                  </form>
                ))}
              </div>
            </article>
            <article className="glass-card report-history-card">
              <h3>Configuración completa</h3>
              <form className="unlock-admin-form" action={updateOperationalRuntimeSettingsAction}>
                <label className="form-label">
                  Modo IA runtime
                  <select name="aiRuntimeMode" className="form-input" defaultValue={data.runtimeSettings.aiRuntimeMode}>
                    <option value="env">Usar env</option>
                    <option value="disabled">Desactivada</option>
                    <option value="mock">Simulación</option>
                    <option value="gemini">Gemini</option>
                  </select>
                </label>
                <div className="assessment-preview-grid">
                  <label className="assessment-inline-note"><input name="aiEnforceBudget" type="checkbox" defaultChecked={data.runtimeSettings.aiEnforceBudget} /> Aplicar presupuesto IA</label>
                  <label className="assessment-inline-note"><input name="aiBlockOnBudgetExceeded" type="checkbox" defaultChecked={data.runtimeSettings.aiBlockOnBudgetExceeded} /> Bloquear IA al superar presupuesto</label>
                  <label className="assessment-inline-note"><input name="reportsPdfGenerationEnabled" type="checkbox" defaultChecked={data.runtimeSettings.reportsPdfGenerationEnabled} /> Generación PDF activa</label>
                  <label className="assessment-inline-note"><input name="reportsDownloadEnabled" type="checkbox" defaultChecked={data.runtimeSettings.reportsDownloadEnabled} /> Descargas de reportes activas</label>
                  <label className="assessment-inline-note"><input name="assessmentsCreationEnabled" type="checkbox" defaultChecked={data.runtimeSettings.assessmentsCreationEnabled} /> Creación de evaluaciones activa</label>
                  <label className="assessment-inline-note"><input name="uploadsEnabled" type="checkbox" defaultChecked={data.runtimeSettings.uploadsEnabled} /> Uploads activos</label>
                  <label className="assessment-inline-note"><input name="publicRegistrationEnabled" type="checkbox" defaultChecked={data.runtimeSettings.publicRegistrationEnabled} /> Registro público activo</label>
                  <label className="assessment-inline-note"><input name="maintenanceMode" type="checkbox" defaultChecked={data.runtimeSettings.maintenanceMode} /> Modo mantenimiento informativo</label>
                </div>
                <label className="assessment-inline-note">
                  <input name="confirmRuntimeChange" type="checkbox" required /> Confirmo que este cambio puede afectar operación.
                </label>
                <button type="submit" className="btn btn-primary btn-glow">Guardar configuración operativa</button>
              </form>
            </article>
          </div>
        </section>
      )}

      {activeTab === "estado-sistema" && (
        <section className="assessment-section glass-card">
          <SectionTitle
            id="estado-sistema"
            icon={<Gauge size={18} />}
            label="Centro Operativo"
            title="Estado del Sistema"
            description="Luces operativas derivadas de configuración segura, métricas existentes y señales persistidas."
          />
          <div className="report-history-grid">
            {data.systemHealth.map((item) => (
              <article key={item.title} className="glass-card report-history-card">
                <div className="report-history-header">
                  <h3>{item.title}</h3>
                  <StatusPill status={item.status} />
                </div>
                <p>{item.description}</p>
                <p className="assessment-inline-note">Acción recomendada: {item.recommendation}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === "ia-consumo" && (
        <section className="assessment-section glass-card">
          <SectionTitle
            id="ia-consumo"
            icon={<Bot size={18} />}
            label="IA y Consumo"
            title="Estado de Gemini + OpenCode Go Advisory"
            description="Estado seguro de proveedores. Gemini es primario; OpenCode Go queda como fallback. No muestra keys, prompts ni respuestas crudas."
          />
          <section className="assessment-summary-grid">
            <MetricCard icon={<Bot size={22} />} label="IA activa" value={ai.iaActiva ? "Sí" : "No"} note={`Proveedor: ${ai.proveedor}`} />
            <MetricCard icon={<Settings size={22} />} label="Modelo primario" value={ai.modelo ?? "No configurado"} note="Gemini operativo esperado" />
            <MetricCard icon={<Settings size={22} />} label="Fallback IA" value={ai.proveedorFallback ? formatStatusLabel(ai.proveedorFallback) : "No configurado"} note={ai.modeloFallback ?? "Sin modelo fallback"} />
            <MetricCard icon={<CheckCircle2 size={22} />} label="Último estado" value={ai.ultimoEstado} note={`Último error: ${ai.ultimoError}`} />
            <MetricCard icon={<ShieldCheck size={22} />} label="Fallback" value={ai.fallbackDisponible ? "Disponible" : "No disponible"} note="Preview/PDF no deben romperse" />
            <MetricCard icon={<Activity size={22} />} label="Llamadas en memoria" value={data.aiConsumption.callsInMemory} note="Se reinician con deploy/restart" />
            <MetricCard icon={<Gauge size={22} />} label="Duración promedio" value={formatDuration(data.aiConsumption.averageDurationMs)} note="Sobre eventos en memoria" />
            <MetricCard icon={<AlertTriangle size={22} />} label="Errores" value={data.aiConsumption.errorsInMemory} note={`Timeouts: ${data.aiConsumption.timeoutsInMemory}`} />
            <MetricCard icon={<FileText size={22} />} label="Costos y tokens" value={formatCurrency(aiUsage.summary.estimatedCostUsd)} note={`${formatNumber(aiUsage.summary.estimatedTotalTokens)} tokens estimados`} />
            <MetricCard icon={<Activity size={22} />} label="Llamadas 24h" value={aiUsage.summary.calls24h} note="Eventos IA persistidos" />
            <MetricCard icon={<Activity size={22} />} label="Llamadas 7 dias" value={aiUsage.summary.calls7d} note="Eventos IA persistidos" />
            <MetricCard icon={<Activity size={22} />} label="Llamadas 30 dias" value={aiUsage.summary.calls30d} note="Eventos IA persistidos" />
            <MetricCard icon={<CheckCircle2 size={22} />} label="Exitos persistidos" value={aiUsage.summary.successCount} note={`Fallbacks: ${aiUsage.summary.fallbackCount}`} />
            <MetricCard icon={<AlertTriangle size={22} />} label="Errores persistidos" value={aiUsage.summary.errorCount} note={`Timeouts: ${aiUsage.summary.timeoutCount}`} />
            <MetricCard icon={<Gauge size={22} />} label="Duracion persistente" value={formatDuration(aiUsage.summary.averageDurationMs)} note={`Ultima llamada: ${formatDate(aiUsage.summary.lastEventAt)}`} />
          </section>
          <div className="assessment-preview-grid">
            <article className="glass-card report-history-card">
              <h3>Configuración segura de IA</h3>
              <div className="report-history-meta">
                <span>Credencial Gemini: {ai.geminiConfigurado ? "Configurada" : "No configurada"}</span>
                <span>Credencial OpenCode Go: {ai.opencodeGoConfigurado ? "Configurada" : "No configurada"}</span>
                <span>OpenAI: no expuesto como proveedor operativo</span>
                <span>Secretos expuestos: {ai.secretosExpuestos ? "Sí" : "No"}</span>
                <span>Archivos crudos enviados: {ai.archivosCrudosEnviados ? "Sí" : "No"}</span>
                <span>Timeout: {ai.timeoutMs} ms</span>
                <span>Entrada máxima: {ai.maxInputChars} caracteres</span>
                <span>Salida máxima: {ai.maxOutputChars} caracteres</span>
              </div>
              <p className="assessment-inline-note">Las credenciales no se muestran ni se editan desde esta consola.</p>
            </article>
            <article className="glass-card report-history-card">
              <h3>Métricas en memoria</h3>
              <div className="report-history-meta">
                <span>Solicitudes: {ai.metricas.solicitudes}</span>
                <span>Éxitos: {ai.metricas.exitos}</span>
                <span>Errores: {ai.metricas.errores}</span>
                <span>Timeouts: {ai.metricas.timeouts}</span>
                <span>Fallback usado: {ai.metricas.fallbackUsado}</span>
                <span>Última duración: {formatDuration(ai.ultimaDuracionMs)}</span>
                <span>Promedio: {formatDuration(ai.duracionPromedioMs)}</span>
              </div>
              <p className="assessment-inline-note">Las métricas en memoria pueden perderse con un deploy. Los eventos persistentes y costos siguen siendo estimados; no hay facturación automática real.</p>
            </article>
            <article className="glass-card report-history-card">
              <h3>Alertas operativas</h3>
              <div className="report-history-grid">
                {data.aiConsumption.alerts.map((alert) => (
                  <div key={alert.title} className="assessment-inline-note">
                    <StatusPill status={alert.status} /> <strong>{alert.title}</strong>: {alert.message}
                  </div>
                ))}
              </div>
            </article>
            <article className="glass-card report-history-card">
              <h3>Costos estimados</h3>
              <p>{data.aiConsumption.costStatus}</p>
              <p className="assessment-inline-note">{data.aiConsumption.costDescription}</p>
              <p className="assessment-inline-note">No se guardan prompts completos ni respuestas crudas. No es facturación automática.</p>
            </article>
            <article className="glass-card report-history-card">
              <h3>Uso persistente 30 dias</h3>
              <div className="report-history-meta">
                <span>Llamadas: {aiUsage.summary.totalCalls}</span>
                <span>Tokens input: {formatNumber(aiUsage.summary.estimatedInputTokens)}</span>
                <span>Tokens output: {formatNumber(aiUsage.summary.estimatedOutputTokens)}</span>
                <span>Tokens totales: {formatNumber(aiUsage.summary.estimatedTotalTokens)}</span>
                <span>Costo estimado: {formatCurrency(aiUsage.summary.estimatedCostUsd)}</span>
                <span>Ultima llamada: {formatDate(aiUsage.summary.lastEventAt)}</span>
              </div>
            </article>
            <article className="glass-card report-history-card">
              <h3>Presupuesto IA</h3>
              <div className="report-history-meta">
                <span>Presupuesto mensual: {formatCurrency(data.aiConsumption.budget.monthlyBudgetUsd)}</span>
                <span>Consumido mes actual: {formatCurrency(data.aiConsumption.budget.spentMonthUsd)}</span>
                <span>Uso: {formatPercent(data.aiConsumption.budget.percentUsed)}</span>
                <span>Restante: {formatCurrency(data.aiConsumption.budget.remainingMonthUsd)}</span>
                <span>Límite diario: {formatCurrency(data.aiConsumption.budget.settings.dailyBudgetUsd)}</span>
                <span>Límite usuario: {formatCurrency(data.aiConsumption.budget.settings.perUserMonthlyBudgetUsd)}</span>
                <span>Límite por evaluación: {formatCurrency(data.aiConsumption.budget.settings.perAssessmentBudgetUsd)}</span>
              </div>
              <p className="assessment-inline-note">El bloqueo automático se activa desde Configuración Operativa con aplicación de límites IA y bloqueo por presupuesto.</p>
            </article>
            <article className="glass-card report-history-card">
              <h3>Configurar presupuesto IA</h3>
              <form className="unlock-admin-form" action={updateAiBudgetAction}>
                <div className="assessment-preview-grid">
                  <label className="form-label">
                    Presupuesto mensual USD
                    <input name="monthlyBudgetUsd" type="number" step="0.01" min="0" className="form-input" defaultValue={data.aiConsumption.budget.settings.monthlyBudgetUsd ?? ""} />
                  </label>
                  <label className="form-label">
                    Límite diario USD
                    <input name="dailyBudgetUsd" type="number" step="0.01" min="0" className="form-input" defaultValue={data.aiConsumption.budget.settings.dailyBudgetUsd ?? ""} />
                  </label>
                  <label className="form-label">
                    Límite por usuario USD
                    <input name="perUserMonthlyBudgetUsd" type="number" step="0.01" min="0" className="form-input" defaultValue={data.aiConsumption.budget.settings.perUserMonthlyBudgetUsd ?? ""} />
                  </label>
                  <label className="form-label">
                    Límite por evaluación USD
                    <input name="perAssessmentBudgetUsd" type="number" step="0.01" min="0" className="form-input" defaultValue={data.aiConsumption.budget.settings.perAssessmentBudgetUsd ?? ""} />
                  </label>
                </div>
                <div className="assessment-inline-actions">
                  <label className="assessment-inline-note"><input name="alertThreshold50" type="checkbox" defaultChecked={data.aiConsumption.budget.settings.alertThreshold50} /> Alerta 50%</label>
                  <label className="assessment-inline-note"><input name="alertThreshold80" type="checkbox" defaultChecked={data.aiConsumption.budget.settings.alertThreshold80} /> Alerta 80%</label>
                  <label className="assessment-inline-note"><input name="alertThreshold100" type="checkbox" defaultChecked={data.aiConsumption.budget.settings.alertThreshold100} /> Alerta 100%</label>
                </div>
                <button type="submit" className="btn btn-primary btn-glow">Guardar presupuesto IA</button>
              </form>
            </article>
          </div>
          <div className="report-history-grid">
            {data.aiConsumption.budget.alerts.map((alert) => (
              <div key={alert.title} className="assessment-inline-note">
                <StatusPill status={alert.status} /> <strong>{alert.title}</strong>: {alert.message}
              </div>
            ))}
          </div>
          <div className="assessment-table-wrap">
            <table className="assessment-table">
              <thead>
                <tr>
                  <th>Evento persistente</th>
                  <th>Usuario</th>
                  <th>Evaluacion</th>
                  <th>Proveedor</th>
                  <th>Operacion</th>
                  <th>Estado</th>
                  <th>Tokens</th>
                  <th>Costo</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {aiUsage.recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan={9}>Todavia no hay eventos IA persistidos.</td>
                  </tr>
                ) : (
                  aiUsage.recentEvents.map((event) => (
                    <tr key={event.id}>
                      <td>{event.id.slice(0, 8)}</td>
                      <td>{event.userEmail ?? "No disponible"}</td>
                      <td>{event.assessmentTitle ?? event.assessmentId ?? "No disponible"}</td>
                      <td>{event.provider}</td>
                      <td>{event.operationType}</td>
                      <td>{formatStatusLabel(event.status)}</td>
                      <td>{formatNumber(event.estimatedTotalTokens)}</td>
                      <td>{formatCurrency(event.estimatedCostUsd)}</td>
                      <td>{formatDate(event.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="assessment-preview-grid">
            <article className="glass-card report-history-card">
              <h3>Consumo por usuario</h3>
              <div className="assessment-table-wrap">
                <table className="assessment-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Llamadas</th>
                      <th>Tokens</th>
                      <th>Costo</th>
                      <th>Errores</th>
                      <th>Ultimo uso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiUsage.byUser.length === 0 ? (
                      <tr>
                        <td colSpan={6}>Sin consumo IA por usuario todavia.</td>
                      </tr>
                    ) : (
                      aiUsage.byUser.map((item) => (
                        <tr key={item.userId ?? item.email}>
                          <td>{item.email}</td>
                          <td>{item.calls}</td>
                          <td>{formatNumber(item.tokens)}</td>
                          <td>{formatCurrency(item.cost)}</td>
                          <td>{item.errors}</td>
                          <td>{formatDate(item.lastEventAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </article>
            <article className="glass-card report-history-card">
              <h3>Consumo por evaluacion</h3>
              <div className="assessment-table-wrap">
                <table className="assessment-table">
                  <thead>
                    <tr>
                      <th>Evaluacion</th>
                      <th>Llamadas</th>
                      <th>Estado</th>
                      <th>Tokens</th>
                      <th>Costo</th>
                      <th>Errores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiUsage.byAssessment.length === 0 ? (
                      <tr>
                        <td colSpan={6}>Sin consumo IA por evaluacion todavia.</td>
                      </tr>
                    ) : (
                      aiUsage.byAssessment.map((item) => (
                        <tr key={item.assessmentId ?? item.title}>
                          <td>{item.title}</td>
                          <td>{item.calls}</td>
                          <td>{formatStatusLabel(item.lastStatus)}</td>
                          <td>{formatNumber(item.tokens)}</td>
                          <td>{formatCurrency(item.cost)}</td>
                          <td>{item.errors}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </article>
            <article className="glass-card report-history-card">
              <h3>Errores IA recientes</h3>
              <div className="report-history-grid">
                {aiUsage.recentErrors.length === 0 ? (
                  <p className="assessment-inline-note">No hay errores IA persistidos en el rango seleccionado.</p>
                ) : (
                  aiUsage.recentErrors.map((event) => (
                    <div key={event.id} className="assessment-inline-note">
                      <strong>{formatStatusLabel(event.status)}</strong> / {event.errorCategory ?? "sin categoría"} - {event.assessmentTitle ?? "sin evaluación"} - {formatDate(event.createdAt)}
                    </div>
                  ))
                )}
              </div>
            </article>
            <article className="glass-card report-history-card">
              <h3>Alertas persistentes</h3>
              <div className="report-history-grid">
                {aiUsage.alerts.map((alert) => (
                  <div key={alert.title} className="assessment-inline-note">
                    <StatusPill status={alert.status} /> <strong>{alert.title}</strong>: {alert.message}
                  </div>
                ))}
              </div>
            </article>
          </div>
          <div className="assessment-table-wrap">
            <table className="assessment-table">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Proveedor</th>
                  <th>Modelo</th>
                  <th>Estado</th>
                  <th>Error</th>
                  <th>Duración</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {ai.eventosRecientes.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No hay eventos IA recientes en memoria.</td>
                  </tr>
                ) : (
                  ai.eventosRecientes.map((event) => (
                    <tr key={`${event.createdAt}-${event.eventType}`}>
                      <td>{formatAiEventType(event.eventType)}</td>
                      <td>{event.provider}</td>
                      <td>{event.model ?? "No disponible"}</td>
                      <td>{formatStatusLabel(event.status)}</td>
                      <td>{event.errorCategory}</td>
                      <td>{formatDuration(event.durationMs)}</td>
                      <td>{formatDate(event.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "advisor-metodologia" && (
        <section className="assessment-section glass-card">
          <SectionTitle
            id="advisor-metodologia"
            icon={<Bot size={18} />}
            label="Senior Advisor"
            title="Observabilidad de contexto metodologico"
            description="Vista interna read-only del flag, salud de la KB y uso agregado. No expone prompts, secretos, bloques crudos ni evidencia de clientes."
          />
          <section className="assessment-summary-grid">
            <MetricCard
              icon={<Settings size={22} />}
              label="Flag runtime"
              value={data.advisorMethodology.runtime.enabled ? "Activo" : "Inactivo"}
              note={`${data.advisorMethodology.runtime.flagName}; default off`}
            />
            <MetricCard
              icon={<ShieldCheck size={22} />}
              label="KB health"
              value={data.advisorMethodology.kbHealth.ok ? "OK" : "Atencion"}
              note={`${data.advisorMethodology.kbHealth.activeBlocks}/${data.advisorMethodology.kbHealth.totalBlocks} bloques activos`}
            />
            <MetricCard
              icon={<FileText size={22} />}
              label="Inclusiones 30d"
              value={data.advisorMethodology.usageStats.includedCount}
              note={`${data.advisorMethodology.usageStats.methodologyTrackedEvents} eventos con metadata metodologica`}
            />
            <MetricCard
              icon={<Activity size={22} />}
              label="Advisor 30d"
              value={data.advisorMethodology.usageStats.totalAdvisorEvents}
              note={`${data.advisorMethodology.usageStats.methodologyEnabledEvents} con flag habilitado`}
            />
            <MetricCard
              icon={<AlertTriangle size={22} />}
              label="Errores metodologia"
              value={data.advisorMethodology.usageStats.errorCount}
              note={`Warnings: ${data.advisorMethodology.usageStats.totalWarnings}; bloqueos: ${data.advisorMethodology.usageStats.totalBlockedReasons}`}
            />
            <MetricCard
              icon={<Gauge size={22} />}
              label="Bloques promedio"
              value={data.advisorMethodology.usageStats.averageBlockCount}
              note={`Ultimo evento: ${formatDate(data.advisorMethodology.usageStats.lastMethodologyEventAt)}`}
            />
          </section>

          <div className="assessment-preview-grid">
            <article className="glass-card report-history-card">
              <h3>Activacion controlada</h3>
              <div className="report-history-meta">
                <span>Modo: {data.advisorMethodology.runtime.activationMode}</span>
                <span>Valor presente: {data.advisorMethodology.runtime.rawValuePresent ? "Si" : "No"}</span>
                <span>Estado seguro: {formatStatusLabel(data.advisorMethodology.runtime.valueDescription)}</span>
                <span>Full public launch: No declarado</span>
              </div>
              <p className="assessment-inline-note">{data.advisorMethodology.runtime.productionSafeSummary}</p>
              <p className="assessment-inline-note">Esta consola no cambia env vars, Hostinger ni deploys.</p>
            </article>

            <article className="glass-card report-history-card">
              <h3>Salud de Knowledge Base</h3>
              <div className="report-history-meta">
                <span>Total: {data.advisorMethodology.kbHealth.totalBlocks}</span>
                <span>Activos: {data.advisorMethodology.kbHealth.activeBlocks}</span>
                <span>Draft: {data.advisorMethodology.kbHealth.draftBlocks}</span>
                <span>Deprecated: {data.advisorMethodology.kbHealth.deprecatedBlocks}</span>
                <span>Restricted: {data.advisorMethodology.kbHealth.restrictedCount}</span>
                <span>Errores validacion: {data.advisorMethodology.kbHealth.validationErrorsCount}</span>
                <span>Warnings validacion: {data.advisorMethodology.kbHealth.validationWarningsCount}</span>
                <span>Ultimo chequeo: {formatDate(data.advisorMethodology.kbHealth.lastCheckedAt)}</span>
              </div>
              <p className="assessment-inline-note">Se listan IDs, titulos, versiones y exposicion; el contenido de bloques no se muestra.</p>
            </article>

            <article className="glass-card report-history-card">
              <h3>Uso agregado</h3>
              <div className="report-history-meta">
                <span>Ventana: {data.advisorMethodology.usageStats.windowDays} dias</span>
                <span>Desde: {formatDate(data.advisorMethodology.usageStats.since)}</span>
                <span>Incluidos: {data.advisorMethodology.usageStats.includedCount}</span>
                <span>Omitidos: {data.advisorMethodology.usageStats.skippedCount}</span>
                <span>Desactivados: {data.advisorMethodology.usageStats.disabledCount}</span>
              </div>
              <div className="report-history-grid">
                {data.advisorMethodology.usageStats.limitations.map((limitation) => (
                  <p key={limitation} className="assessment-inline-note">{limitation}</p>
                ))}
              </div>
            </article>

            <article className="glass-card report-history-card">
              <h3>Bloques mas usados</h3>
              {data.advisorMethodology.usageStats.topBlockIds.length === 0 ? (
                <p className="assessment-inline-note">Sin bloques metodologicos registrados en el rango.</p>
              ) : (
                <div className="report-history-meta">
                  {data.advisorMethodology.usageStats.topBlockIds.map((item) => (
                    <span key={item.id}>{item.id}: {item.count}</span>
                  ))}
                </div>
              )}
            </article>
          </div>

          <div className="assessment-table-wrap">
            <table className="assessment-table">
              <thead>
                <tr>
                  <th>Bloque</th>
                  <th>Titulo</th>
                  <th>Version</th>
                  <th>Estado</th>
                  <th>Exposicion</th>
                  <th>Dominio</th>
                  <th>Revision</th>
                </tr>
              </thead>
              <tbody>
                {data.advisorMethodology.kbHealth.blockSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={7}>La KB metodologica no esta disponible en este runtime.</td>
                  </tr>
                ) : (
                  data.advisorMethodology.kbHealth.blockSummaries.map((block) => (
                    <tr key={block.id}>
                      <td>{block.id}</td>
                      <td>{block.title}</td>
                      <td>{block.version}</td>
                      <td>{formatStatusLabel(block.status)}</td>
                      <td>{formatStatusLabel(block.exposureLevel)}</td>
                      <td>{formatStatusLabel(block.domain)}</td>
                      <td>{block.lastReviewedAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "accesos-planes" && (
        <section className="assessment-section glass-card">
          <SectionTitle
            id="accesos-planes"
            icon={<ShieldCheck size={18} />}
            label="Accesos y Planes"
            title="Derechos de acceso y accesos manuales"
            description="Gestión interna de sólo lectura o confirmada para planes, accesos, IA y reportes. No hay facturación automática ni borrado duro."
          />
          <div className="assessment-preview-grid">
            <article className="glass-card report-history-card">
              <h3>Crear acceso manual</h3>
              <form className="unlock-admin-form" action={createUserEntitlementAction}>
                <label className="form-label">
                  Usuario
                  <select name="userId" className="form-input" required>
                    <option value="">Seleccionar usuario</option>
                    {data.recentUsers.map((user) => (
                      <option key={user.id} value={user.id}>{user.email}</option>
                    ))}
                  </select>
                </label>
                <div className="assessment-preview-grid">
                  <label className="form-label">
                    Plan
                    <select name="planKey" className="form-input" defaultValue="professional">
                      <option value="free_preview">Vista previa gratuita</option>
                      <option value="starter">Starter</option>
                      <option value="professional">Professional</option>
                      <option value="blueprint">Blueprint</option>
                      <option value="msp_partner">MSP Partner</option>
                      <option value="internal_qa">QA interno</option>
                    </select>
                  </label>
                  <label className="form-label">
                    Estado
                    <select name="status" className="form-input" defaultValue="manual">
                      <option value="active">Activo</option>
                      <option value="pending_payment">Pendiente de pago</option>
                      <option value="trial">Prueba</option>
                      <option value="manual">Manual</option>
                      <option value="expired">Expirado</option>
                    </select>
                  </label>
                  <label className="form-label">
                    Origen
                    <select name="source" className="form-input" defaultValue="admin">
                      <option value="admin">Administrador</option>
                      <option value="manual">Manual</option>
                      <option value="bank_transfer_invoice">Bank transfer invoice</option>
                      <option value="business_invoice">Business invoice</option>
                      <option value="card_checkout_future">Card checkout future</option>
                      <option value="unknown">Desconocido</option>
                    </select>
                  </label>
                  <label className="form-label">
                    Vence
                    <input name="expiresAt" type="date" className="form-input" />
                  </label>
                  <label className="form-label">
                    Máximo de evaluaciones
                    <input name="maxAssessments" type="number" min="0" className="form-input" />
                  </label>
                  <label className="form-label">
                    Max PDFs
                    <input name="maxPdfReports" type="number" min="0" className="form-input" />
                  </label>
                </div>
                <label className="form-label">
                  Notas internas
                  <textarea name="notesInternal" className="form-input form-textarea" rows={3} placeholder="Nota interna, sin secretos" />
                </label>
                <div className="assessment-inline-actions">
                  <label className="assessment-inline-note"><input name="aiEnabled" type="checkbox" /> IA habilitada</label>
                  <label className="assessment-inline-note"><input name="fullReportEnabled" type="checkbox" /> Reporte completo/PDF habilitado</label>
                </div>
                <button type="submit" className="btn btn-primary btn-glow">Confirmar cambio de acceso</button>
              </form>
            </article>
            <article className="glass-card report-history-card">
              <h3>Acciones operativas IA</h3>
              <p className="assessment-inline-note">Estas acciones son instrucciones, no botones destructivos. ADMIN-3 no edita variables Hostinger.</p>
              <div className="report-history-meta">
                <span>Apagar IA: configurar AI_ADVISORY_ENABLED=false en Hostinger.</span>
                <span>Volver a simulación: configurar AI_ADVISORY_PROVIDER=mock.</span>
                <span>Reactivar Gemini: validar proveedor, credencial configurada y prueba de humo antes de exponerlo.</span>
              </div>
            </article>
          </div>
          <div className="assessment-table-wrap">
            <table className="assessment-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Plan</th>
                  <th>Estado</th>
                  <th>Origen</th>
                  <th>Vence</th>
                  <th>IA</th>
                  <th>Reporte completo</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.userEntitlements.length === 0 ? (
                  <tr><td colSpan={9}>Todavia no hay accesos manuales configurados.</td></tr>
                ) : (
                  data.userEntitlements.map((entitlement) => (
                    <tr key={entitlement.id}>
                      <td>{entitlement.user.email}</td>
                      <td>{formatStatusLabel(entitlement.planKey)}</td>
                      <td>{formatStatusLabel(entitlement.status)}</td>
                      <td>{formatStatusLabel(entitlement.source)}</td>
                      <td>{formatDate(entitlement.expiresAt)}</td>
                      <td>{entitlement.aiEnabled ? "Sí" : "No"}</td>
                      <td>{entitlement.fullReportEnabled ? "Sí" : "No"}</td>
                      <td>{entitlement.notesInternal ?? "Sin notas"}</td>
                      <td>
                        <form action={revokeUserEntitlementAction.bind(null, entitlement.id)}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                            <label className="assessment-inline-note" style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                              <input type="checkbox" name="confirmRevocation" required /> Confirmar
                            </label>
                            <button type="submit" className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "12px" }}>
                              Revocar acceso
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "oportunidades" && (
        <section className="assessment-section glass-card">
          <SectionTitle
            id="oportunidades"
            icon={<Gauge size={18} />}
            label="Oportunidades"
            title="Oportunidades comerciales y próxima acción"
            description="Score determinístico inicial para seguimiento comercial relacionado con la evaluación. No usa IA como autoridad."
          />
          <section className="assessment-summary-grid">
            <MetricCard icon={<Gauge size={22} />} label="Alto potencial" value={data.commercialOpportunities.filter((item) => item.score >= 70).length} note="Score >= 70" />
            <MetricCard icon={<AlertTriangle size={22} />} label="Requieren seguimiento" value={data.commercialOpportunities.filter((item) => item.tags.includes("Requiere seguimiento")).length} note="Customer success" />
            <MetricCard icon={<FileText size={22} />} label="Candidatos Blueprint" value={data.commercialOpportunities.filter((item) => item.tags.includes("Candidato Blueprint")).length} note="Diseño destino" />
            <MetricCard icon={<Users size={22} />} label="Pendientes de pago" value={data.commercialOpportunities.filter((item) => item.status === "pending_payment").length} note="Estado comercial" />
          </section>

          {(() => {
            const activeOpportunity = editOpportunityId
              ? data.commercialOpportunities.find((o) => o.assessmentId === editOpportunityId)
              : null;
            if (!activeOpportunity) return null;
            return (
              <article className="glass-card" style={{ marginBottom: "24px", padding: "20px", border: "1px solid var(--border-cyan)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0 }}>Editar Oportunidad Comercial: {activeOpportunity.client}</h3>
                  <Link href="?tab=oportunidades" className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "12px" }}>Cerrar editor</Link>
                </div>
                <form action={updateCommercialOpportunityAction} className="unlock-admin-form" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <input type="hidden" name="assessmentId" value={activeOpportunity.assessmentId ?? ""} />
                  <input type="hidden" name="userId" value={activeOpportunity.userId ?? ""} />
                  <input type="hidden" name="score" value={activeOpportunity.score} />
                  
                  <div>
                    <label className="form-label" style={{ marginBottom: "12px", display: "block" }}>
                      Estado Comercial
                      <select name="status" className="form-input" defaultValue={activeOpportunity.status} style={{ width: "100%", marginTop: "4px" }}>
                        <option value="new_lead">Nuevo lead</option>
                        <option value="needs_follow_up">Requiere seguimiento</option>
                        <option value="proposal_sent">Propuesta enviada</option>
                        <option value="paid">Pagado</option>
                        <option value="lost">Perdido</option>
                        <option value="dormant">Dormido</option>
                        <option value="partner_candidate">Candidato partner</option>
                      </select>
                    </label>

                    <label className="form-label" style={{ marginBottom: "12px", display: "block" }}>
                      Plan Sugerido
                      <input name="suggestedPlan" className="form-input" defaultValue={activeOpportunity.suggestedPlan ?? ""} style={{ width: "100%", marginTop: "4px" }} />
                    </label>
                  </div>

                  <div>
                    <label className="form-label" style={{ marginBottom: "12px", display: "block" }}>
                      Próxima Acción Comercial
                      <input name="nextBestAction" className="form-input" defaultValue={activeOpportunity.nextBestAction ?? ""} style={{ width: "100%", marginTop: "4px" }} />
                    </label>

                    <label className="form-label" style={{ marginBottom: "12px", display: "block" }}>
                      Notas Internas (sin secretos)
                      <textarea name="notesInternal" className="form-input form-textarea" rows={3} defaultValue={activeOpportunity.notesInternal ?? ""} style={{ width: "100%", marginTop: "4px" }} />
                    </label>
                  </div>

                  <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end" }}>
                    <button type="submit" className="btn btn-primary btn-glow">Guardar Oportunidad</button>
                  </div>
                </form>
              </article>
            );
          })()}

          <div className="assessment-table-wrap">
            <table className="assessment-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Evaluación</th>
                  <th>Score</th>
                  <th>Etiquetas</th>
                  <th>Próxima acción</th>
                  <th>Plan sugerido</th>
                  <th>Estado</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.commercialOpportunities.length === 0 ? (
                  <tr><td colSpan={9}>No hay oportunidades detectadas todavia.</td></tr>
                ) : (
                  data.commercialOpportunities.map((opportunity) => (
                    <tr key={opportunity.id}>
                      <td>{opportunity.client}</td>
                      <td>
                        <Link href={`/dashboard/assessments/${opportunity.assessmentId}`} className="dashboard-card-link">
                          {opportunity.assessmentTitle}
                        </Link>
                      </td>
                      <td>{opportunity.score}</td>
                      <td>{opportunity.tags.join(", ")}</td>
                      <td>{opportunity.nextBestAction}</td>
                      <td>{opportunity.suggestedPlan}</td>
                      <td>{formatStatusLabel(opportunity.status)}</td>
                      <td>{opportunity.notesInternal ?? "Sin notas"}</td>
                      <td>
                        <Link
                          href={`?tab=oportunidades&editOpportunityId=${opportunity.assessmentId ?? ""}`}
                          className="btn btn-secondary"
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "configuracion" && (
        <section className="assessment-section glass-card">
          <SectionTitle
            id="configuracion"
            icon={<Settings size={18} />}
            label="Configuración"
            title="Health de configuración segura"
            description="Sólo estados seguros. No se muestran secretos, tokens, URLs privadas completas ni API keys."
          />
          <p className="assessment-inline-note">Las credenciales no se muestran ni se editan desde esta consola.</p>
          <div className="assessment-table-wrap">
            <table className="assessment-table">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Estado / valor seguro</th>
                  <th>Secreto</th>
                </tr>
              </thead>
              <tbody>
                {data.configHealth.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>{item.value}</td>
                    <td>{item.secret ? "Oculto" : "Visible seguro"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "usuarios" && (
        <section className="assessment-section glass-card">
          <SectionTitle
            id="usuarios"
            icon={<Users size={18} />}
            label="Usuarios"
            title="Usuarios recientes"
            description="Vista de sólo lectura. Acciones destructivas y suplantación quedan fuera de ADMIN-1."
          />
          
          <form method="GET" className="admin-filter-row" style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <input type="hidden" name="tab" value="usuarios" />
            <input
              name="usersSearch"
              className="form-input"
              style={{ maxWidth: "300px" }}
              placeholder="Buscar por email o nombre..."
              defaultValue={usersSearch}
            />
            <button type="submit" className="btn btn-primary">Buscar</button>
            {usersSearch && (
              <Link href="?tab=usuarios" className="btn btn-secondary">Limpiar</Link>
            )}
          </form>

          <div className="assessment-table-wrap">
            <table className="assessment-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Alta</th>
                  <th>Último acceso</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Evaluaciones</th>
                  <th>Plan</th>
                  <th>Llamadas IA</th>
                  <th>Tokens IA</th>
                  <th>Costo IA</th>
                  <th>Ultimo uso IA</th>
                  <th>Acceso</th>
                  <th>Oportunidad</th>
                  <th>Proxima accion</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.recentUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{formatDate(user.lastAccess)}</td>
                    <td>{user.role}</td>
                    <td><StatusPill status={user.status} /></td>
                    <td>{user.assessments}</td>
                    <td>{formatStatusLabel(user.plan)}</td>
                    <td>{user.aiCalls}</td>
                    <td>{formatNumber(user.aiTokens)}</td>
                    <td>{formatCurrency(user.aiCost)}</td>
                    <td>{formatDate(user.lastAiUsage)}</td>
                    <td>{formatStatusLabel(user.entitlementPlan)} / {formatStatusLabel(user.entitlementStatus)}</td>
                    <td>{user.opportunityScore} - {formatStatusLabel(user.commercialStatus)}</td>
                    <td>{user.nextBestAction}</td>
                    <td>
                      <Link href={`?tab=evaluaciones&assessmentsSearch=${encodeURIComponent(user.email)}`} className="dashboard-card-link">
                        Ver evaluaciones
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="assessment-section-title" style={{ marginTop: "24px" }}>
            <div className="assessment-section-eyebrow">
              <FileText size={18} />
              <span>Evidencia avanzada</span>
            </div>
            <h3>Estado de modulos opcionales</h3>
            <p>Lectura basica por evaluacion: estado del modulo, ultima carga, parser, advertencias y errores.</p>
          </div>

          <div className="assessment-table-wrap">
            <table className="assessment-table">
              <thead>
                <tr>
                  <th>Evaluacion</th>
                  <th>Modulo</th>
                  <th>Estado del modulo</th>
                  <th>Confianza</th>
                  <th>Ultima carga</th>
                  <th>Metrica VMware</th>
                  <th>Resultado del parser</th>
                  <th>Advertencias</th>
                  <th>Errores</th>
                  <th>Revision</th>
                </tr>
              </thead>
              <tbody>
                {data.recentAssessments.flatMap((assessment) =>
                  assessment.advancedEvidence.modules.map((module) => (
                    <tr key={`${assessment.id}-${module.moduleKey}`}>
                      <td>{assessment.title}</td>
                      <td>{formatStatusLabel(module.moduleKey)}</td>
                      <td>
                        <span className={`assessment-chip assessment-chip-${module.requiresReview ? "warning" : "neutral"}`}>
                          {formatStatusLabel(module.status)}
                        </span>
                      </td>
                      <td>{formatStatusLabel(module.confidenceLevel)} / {module.completionPercent}%</td>
                      <td>
                        {module.lastUpload
                          ? `${module.lastUpload.originalFilename} (${formatStatusLabel(module.lastUpload.uploadKind)})`
                          : "Sin carga"}
                      </td>
                      <td>
                        {module.vmwareMetrics
                          ? `VMs ${module.vmwareMetrics.vmCount ?? "-"} / matched ${module.vmwareMetrics.matchedVmCount ?? "-"} / unmatched ${module.vmwareMetrics.unmatchedVmCount ?? "-"} / snapshots viejos ${module.vmwareMetrics.oldSnapshotCount ?? "-"} / tags ${module.vmwareMetrics.tagAssignmentCount ?? "-"} / DRS ${module.vmwareMetrics.drsRuleCount ?? "-"}`
                          : "-"}
                      </td>
                      <td>
                        {module.lastParseResult
                          ? `${formatStatusLabel(module.lastParseResult.status)} - ${module.lastParseResult.parserKey} v${module.lastParseResult.parserVersion}`
                          : "Sin parser"}
                      </td>
                      <td>{module.lastParseResult?.warnings ?? 0}</td>
                      <td>{module.lastParseResult?.errors ?? 0}</td>
                      <td>{module.requiresReview ? "Requiere revision" : module.reviewedAt ? "Revisado" : "-"}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-filter-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
            <span className="assessment-inline-note">
              Mostrando {data.pagination.users.pageSize * (data.pagination.users.page - 1) + 1} - {Math.min(data.pagination.users.pageSize * data.pagination.users.page, data.pagination.users.totalCount)} de {data.pagination.users.totalCount} usuarios
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <Link
                href={`?tab=usuarios&usersSearch=${encodeURIComponent(usersSearch)}&usersPage=${usersPage - 1}`}
                className={`btn btn-secondary ${usersPage <= 1 ? "btn-disabled" : ""}`}
                style={{ pointerEvents: usersPage <= 1 ? "none" : "auto", opacity: usersPage <= 1 ? 0.5 : 1 }}
              >
                Anterior
              </Link>
              <span className="assessment-inline-note" style={{ alignSelf: "center" }}>
                Página {usersPage} de {data.pagination.users.totalPages || 1}
              </span>
              <Link
                href={`?tab=usuarios&usersSearch=${encodeURIComponent(usersSearch)}&usersPage=${usersPage + 1}`}
                className={`btn btn-secondary ${usersPage >= data.pagination.users.totalPages ? "btn-disabled" : ""}`}
                style={{ pointerEvents: usersPage >= data.pagination.users.totalPages ? "none" : "auto", opacity: usersPage >= data.pagination.users.totalPages ? 0.5 : 1 }}
              >
                Siguiente
              </Link>
            </div>
          </div>
        </section>
      )}

      {activeTab === "evaluaciones" && (
        <section className="assessment-section glass-card">
          <SectionTitle
            id="evaluaciones"
            icon={<Database size={18} />}
            label="Evaluaciones"
            title="Evaluaciones recientes"
            description="Vista de sólo lectura para revisar estado, evidencia, contexto, PDF e IA."
          />

          <form method="GET" className="admin-filter-row" style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <input type="hidden" name="tab" value="evaluaciones" />
            <input
              name="assessmentsSearch"
              className="form-input"
              style={{ maxWidth: "300px" }}
              placeholder="Buscar por título o cliente..."
              defaultValue={assessmentsSearch}
            />
            <button type="submit" className="btn btn-primary">Buscar</button>
            {assessmentsSearch && (
              <Link href="?tab=evaluaciones" className="btn btn-secondary">Limpiar</Link>
            )}
          </form>

          <div className="assessment-table-wrap">
            <table className="assessment-table">
              <thead>
                <tr>
                  <th>Evaluación</th>
                  <th>Cliente/usuario</th>
                  <th>Estado</th>
                  <th>Evidencia</th>
                  <th>Evidencia avanzada</th>
                  <th>Contexto</th>
                  <th>PDF</th>
                  <th>IA</th>
                  <th>Readiness</th>
                  <th>Confianza</th>
                  <th>Llamadas IA</th>
                  <th>Tokens IA</th>
                  <th>Costo IA</th>
                  <th>Errores IA</th>
                  <th>Ultimo estado IA</th>
                  <th>Oportunidad</th>
                  <th>Etiquetas</th>
                  <th>Próxima acción</th>
                  <th>Actualizado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.recentAssessments.map((assessment) => (
                  <tr key={assessment.id}>
                    <td>{assessment.title}</td>
                    <td>{assessment.clientLabel ?? assessment.ownerEmail}</td>
                    <td>{formatStatusLabel(assessment.status)}</td>
                    <td>
                      {assessment.storage.enabled ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span
                            className={`assessment-chip assessment-chip-${
                              ["submitted", "ready_for_analysis", "analyzed"].includes(assessment.storage.readinessStatus)
                                ? "good"
                                : assessment.storage.readinessStatus === "failed"
                                  ? "danger"
                                  : ["skipped", "not_started"].includes(assessment.storage.readinessStatus)
                                    ? "neutral"
                                    : "warning"
                            }`}
                          >
                            {formatStatusLabel(assessment.storage.readinessStatus)}
                          </span>
                          <span className="assessment-inline-note" style={{ fontSize: "10px" }}>
                            {formatStatusLabel(assessment.storage.readinessMode)} / {formatStatusLabel(assessment.storage.cephSuitabilityStatus)}
                          </span>
                        </div>
                      ) : (
                        <span className="assessment-chip assessment-chip-neutral">Inactivo</span>
                      )}
                    </td>
                    <td>{assessment.evidence}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span className="assessment-chip assessment-chip-neutral">
                          {assessment.advancedEvidence.parsed}/{assessment.advancedEvidence.total} modulos
                        </span>
                        <span className="assessment-inline-note" style={{ fontSize: "10px" }}>
                          {assessment.advancedEvidence.warnings} advertencias / {assessment.advancedEvidence.errors} errores
                        </span>
                      </div>
                    </td>
                    <td>{assessment.context}</td>
                    <td>{assessment.pdf}</td>
                    <td>{assessment.ai}</td>
                    <td>{assessment.readiness ?? "No disponible"}</td>
                    <td>{assessment.confidence ?? "No disponible"}</td>
                    <td>{assessment.aiCalls}</td>
                    <td>{formatNumber(assessment.aiTokens)}</td>
                    <td>{formatCurrency(assessment.aiCost)}</td>
                    <td>{assessment.aiErrors}</td>
                    <td>{formatStatusLabel(assessment.lastAiStatus)}</td>
                    <td>{assessment.opportunityScore} - {formatStatusLabel(assessment.commercialStatus)}</td>
                    <td>{assessment.opportunityTags.join(", ") || "Sin etiquetas"}</td>
                    <td>{assessment.nextBestAction}</td>
                    <td>{formatDate(assessment.updatedAt)}</td>
                    <td>
                      <Link href={`/dashboard/assessments/${assessment.id}`} className="dashboard-card-link">Ver detalle</Link>
                      {" / "}
                      <Link href={`/dashboard/assessments/${assessment.id}/report`} className="dashboard-card-link">Ver reporte</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-filter-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
            <span className="assessment-inline-note">
              Mostrando {data.pagination.assessments.pageSize * (data.pagination.assessments.page - 1) + 1} - {Math.min(data.pagination.assessments.pageSize * data.pagination.assessments.page, data.pagination.assessments.totalCount)} de {data.pagination.assessments.totalCount} evaluaciones
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <Link
                href={`?tab=evaluaciones&assessmentsSearch=${encodeURIComponent(assessmentsSearch)}&assessmentsPage=${assessmentsPage - 1}`}
                className={`btn btn-secondary ${assessmentsPage <= 1 ? "btn-disabled" : ""}`}
                style={{ pointerEvents: assessmentsPage <= 1 ? "none" : "auto", opacity: assessmentsPage <= 1 ? 0.5 : 1 }}
              >
                Anterior
              </Link>
              <span className="assessment-inline-note" style={{ alignSelf: "center" }}>
                Página {assessmentsPage} de {data.pagination.assessments.totalPages || 1}
              </span>
              <Link
                href={`?tab=evaluaciones&assessmentsSearch=${encodeURIComponent(assessmentsSearch)}&assessmentsPage=${assessmentsPage + 1}`}
                className={`btn btn-secondary ${assessmentsPage >= data.pagination.assessments.totalPages ? "btn-disabled" : ""}`}
                style={{ pointerEvents: assessmentsPage >= data.pagination.assessments.totalPages ? "none" : "auto", opacity: assessmentsPage >= data.pagination.assessments.totalPages ? 0.5 : 1 }}
              >
                Siguiente
              </Link>
            </div>
          </div>
        </section>
      )}

      {activeTab === "licenciamiento" && (
        <section className="assessment-section glass-card">
          <SectionTitle
            id="licenciamiento"
            icon={<BadgePercent size={18} />}
            label="Análisis de Licenciamiento"
            title="Seguimiento de Licensing & Cost Exposure"
            description="Revisión de configuraciones de licenciamiento, modos, fechas de renovación, disclaimers y notas cargadas por los clientes."
          />
          <div className="assessment-table-wrap">
            <table className="assessment-table">
              <thead>
                <tr>
                  <th>Evaluación</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Modo de Análisis</th>
                  <th>Confianza Financiera</th>
                  <th>Calidad Ahorros</th>
                  <th>Renovación</th>
                  <th>Escalación YoY</th>
                  <th>Inversión Migración</th>
                  <th>Soporte Proxmox</th>
                  <th>Contrato / Oferta</th>
                  <th>Notas del cliente</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.recentAssessments.map((assessment) => {
                  const lic = assessment.licensing;
                  return (
                    <tr key={assessment.id}>
                      <td>{assessment.title}</td>
                      <td>{assessment.clientLabel ?? assessment.ownerEmail}</td>
                      <td>
                        {lic ? (
                          <span className={`assessment-chip assessment-chip-${lic.status === "ready" ? "good" : "warning"}`}>
                            {formatStatusLabel(lic.status)}
                          </span>
                        ) : (
                          <span className="assessment-chip assessment-chip-neutral">No incluido</span>
                        )}
                      </td>
                      <td>{lic ? formatStatusLabel(lic.mode) : "-"}</td>
                      <td>{lic && lic.financialConfidenceScore !== null ? `${lic.financialConfidenceScore}/100 (${lic.financialConfidenceLabel})` : "-"}</td>
                      <td>{lic ? formatStatusLabel(lic.savingsQuality) : "-"}</td>
                      <td>{lic?.renewalDate ? formatDate(lic.renewalDate) : "-"}</td>
                      <td>{lic ? (lic.includeEscalation ? "Sí (10%)" : "No") : "-"}</td>
                      <td>{lic && lic.migrationInvestment !== null ? formatCurrency(lic.migrationInvestment) : "-"}</td>
                      <td>{lic ? formatStatusLabel(lic.proxmoxSupportScenario) : "-"}</td>
                      <td>
                        {lic ? (
                          <span>
                            {lic.hasContract ? "Contrato: Sí" : "Contrato: No"}
                            <br />
                            {lic.hasRenewalQuote ? "Oferta: Sí" : "Oferta: No"}
                          </span>
                        ) : "-"}
                      </td>
                      <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={lic?.notes ?? ""}>
                        {lic?.notes ?? "-"}
                      </td>
                      <td>
                        <Link href={`/dashboard/assessments/${assessment.id}`} className="dashboard-card-link">Ver detalle</Link>
                        {" / "}
                        <Link href={`/dashboard/assessments/${assessment.id}/report`} className="dashboard-card-link">Ver reporte</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "contexto-evidencias" && (
        <section className="assessment-section glass-card">
          <SectionTitle
            id="contexto-evidencias"
            icon={<FileText size={18} />}
            label="Contexto y Evidencias Adicionales"
            title="Seguimiento de Client Context & Additional Evidence"
            description="Revisión del contexto libre ingresado por el cliente, estado de análisis de IA y archivos de evidencia clasificados."
          />
          <div className="assessment-table-wrap">
            <table className="assessment-table">
              <thead>
                <tr>
                  <th>Evaluación</th>
                  <th>Cliente/usuario</th>
                  <th>Estado Contexto</th>
                  <th>Largo Contexto</th>
                  <th>Estado Análisis IA</th>
                  <th>Resumen Interpretado</th>
                  <th>Archivos Adicionales (Clasificación)</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.recentAssessments.map((assessment) => {
                  const ctx = assessment.clientContext;
                  const files = assessment.additionalEvidence || [];
                  return (
                    <tr key={assessment.id}>
                      <td>{assessment.title}</td>
                      <td>{assessment.clientLabel ?? assessment.ownerEmail}</td>
                      <td>
                        {ctx ? (
                          <span className={`assessment-chip assessment-chip-${ctx.status === "submitted" ? "good" : ctx.status === "draft" ? "warning" : "neutral"}`}>
                            {formatStatusLabel(ctx.status)}
                          </span>
                        ) : (
                          <span className="assessment-chip assessment-chip-neutral">No provisto</span>
                        )}
                      </td>
                      <td>
                        {ctx && ctx.wordCount > 0 ? (
                          <span>{ctx.wordCount} pal. / {ctx.characterCount} car.</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {ctx ? (
                          <span className={`assessment-chip assessment-chip-${ctx.analysisStatus === "completed" ? "good" : ctx.analysisStatus === "stale" ? "warning" : "neutral"}`}>
                            {formatStatusLabel(ctx.analysisStatus)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={ctx?.interpretedSummary ?? ""}>
                        {ctx?.interpretedSummary ?? "-"}
                      </td>
                      <td>
                        {files.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11px", listStyleType: "disc" }}>
                            {files.map((file) => (
                              <li key={file.id} title={`Propósito: ${file.purpose || "Sin propósito"}. Estado parser: ${file.processingStatus}`}>
                                <strong>{file.filename}</strong> ({Math.round(file.fileSize / 1024)} KB)
                                <br />
                                <span className="assessment-inline-note">Tipo: {formatStatusLabel(file.classification)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="assessment-inline-note">Sin archivos</span>
                        )}
                      </td>
                      <td>
                        <Link href={`/dashboard/assessments/${assessment.id}`} className="dashboard-card-link">Ver detalle</Link>
                        {" / "}
                        <Link href={`/dashboard/assessments/${assessment.id}/report`} className="dashboard-card-link">Ver reporte</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "storage-ceph" && (
        <section className="assessment-section glass-card">
          <SectionTitle
            id="storage-ceph"
            icon={<HardDrive size={18} />}
            label="Storage y Ceph"
            title="Consola Operativa de Storage / Ceph"
            description="Métricas agregadas, distribución de clasificaciones de evidencia, estados del motor Ceph y auditoría de IA de Storage."
          />

          <div className="assessment-summary-grid" style={{ marginBottom: "24px" }}>
            <MetricCard
              icon={<HardDrive size={22} />}
              label="Storage Activo"
              value={data.storageCeph.activeStorageAssessments}
              note="Evaluaciones con módulo activo"
            />
            <MetricCard
              icon={<Server size={22} />}
              label="Ceph Solicitado"
              value={data.storageCeph.cephRequested}
              note="Preferencia o candidato Ceph"
            />
            <MetricCard
              icon={<AlertTriangle size={22} />}
              label="Falta Evidencia"
              value={data.storageCeph.activeWithoutEvidence}
              note="Storage activo sin archivos"
            />
            <MetricCard
              icon={<Activity size={22} />}
              label="Evidencia Clasificada"
              value={
                Object.values(data.storageCeph.evidenceClassification || {}).reduce(
                  (a: number, b: number) => a + b,
                  0
                ) as number
              }
              note="Total de archivos subidos"
            />
          </div>

          <div className="grid-2-columns" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            <div className="glass-card" style={{ padding: "16px" }}>
              <h3 style={{ marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "6px" }}>
                Estados de Readiness (Progreso)
              </h3>
              <table className="assessment-table" style={{ fontSize: "12px" }}>
                <thead>
                  <tr>
                    <th>Estado de Flujo</th>
                    <th style={{ textAlign: "right" }}>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {["not_started", "draft", "submitted", "ready_for_analysis", "analysis_pending", "analyzed", "skipped", "stale", "failed"].map((status) => {
                    const count = data.storageCeph.readinessStatus[status] ?? 0;
                    return (
                      <tr key={status}>
                        <td>
                          <span className={`assessment-chip assessment-chip-${status === "failed" ? "danger" : ["submitted", "ready_for_analysis", "analyzed"].includes(status) ? "good" : ["skipped", "not_started"].includes(status) ? "neutral" : "warning"}`}>
                            {formatStatusLabel(status)}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>{count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="glass-card" style={{ padding: "16px" }}>
              <h3 style={{ marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "6px" }}>
                Evaluaciones Ceph por Resultado
              </h3>
              <table className="assessment-table" style={{ fontSize: "12px" }}>
                <thead>
                  <tr>
                    <th>Resultado Ceph</th>
                    <th style={{ textAlign: "right" }}>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {["ceph_applies", "ceph_does_not_apply", "ceph_conditional", "ceph_overkill", "ceph_underdesigned", "not_enough_evidence", "deferred_storage_2", "not_evaluated_storage_1"].map((status) => {
                    const count = data.storageCeph.cephSuitability[status] ?? 0;
                    return (
                      <tr key={status}>
                        <td>
                          <span className={`assessment-chip assessment-chip-${status === "ceph_applies" ? "good" : status === "ceph_underdesigned" ? "danger" : ["ceph_does_not_apply", "not_evaluated_storage_1"].includes(status) ? "neutral" : "warning"}`}>
                            {formatStatusLabel(status)}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>{count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid-2-columns" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            <div className="glass-card" style={{ padding: "16px" }}>
              <h3 style={{ marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "6px" }}>
                Evidencias de Storage por Clasificación
              </h3>
              <table className="assessment-table" style={{ fontSize: "12px" }}>
                <thead>
                  <tr>
                    <th>Clasificación Técnica</th>
                    <th style={{ textAlign: "right" }}>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    "source_storage_export",
                    "target_storage_design",
                    "hardware_bom",
                    "network_diagram",
                    "ceph_status",
                    "ceph_osd_tree",
                    "ceph_df",
                    "pbs_backup_info",
                    "vsan_summary",
                    "san_nas_export",
                    "architecture_diagram",
                    "quote_or_bill_of_materials",
                    "unknown_needs_review"
                  ].map((classification) => {
                    const count = data.storageCeph.evidenceClassification[classification] ?? 0;
                    return (
                      <tr key={classification}>
                        <td>{formatStatusLabel(classification)}</td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>{count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="glass-card" style={{ padding: "16px" }}>
              <h3 style={{ marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "6px" }}>
                Auditoría IA (Estado Análisis Storage)
              </h3>
              <table className="assessment-table" style={{ fontSize: "12px" }}>
                <thead>
                  <tr>
                    <th>Estado de Análisis IA</th>
                    <th style={{ textAlign: "right" }}>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {["not_started", "pending", "completed", "failed", "stale", "ai_disabled", "budget_blocked", "plan_restricted"].map((status) => {
                    const count = data.storageCeph.aiAnalysisStatus[status] ?? 0;
                    return (
                      <tr key={status}>
                        <td>
                          <span className={`assessment-chip assessment-chip-${status === "completed" ? "good" : ["failed", "budget_blocked", "plan_restricted"].includes(status) ? "danger" : "warning"}`}>
                            {formatStatusLabel(status)}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>{count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <h3 style={{ marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "6px" }}>
            Detalle de Evaluaciones con Storage Habilitado
          </h3>
          <div className="assessment-table-wrap">
            <table className="assessment-table">
              <thead>
                <tr>
                  <th>Evaluación</th>
                  <th>Cliente/Usuario</th>
                  <th>Flujo Readiness</th>
                  <th>Modo Destino</th>
                  <th>Preferencia Destino</th>
                  <th>Suitability Ceph</th>
                  <th>Puntaje</th>
                  <th>Confianza</th>
                  <th>Evidencias</th>
                </tr>
              </thead>
              <tbody>
                {data.recentAssessments
                  .filter((assessment) => assessment.storage.enabled)
                  .map((assessment) => {
                    const st = assessment.storage;
                    return (
                      <tr key={assessment.id}>
                        <td>
                          <Link href={`/dashboard/assessments/${assessment.id}?tab=storage`} className="dashboard-card-link" style={{ fontWeight: "bold" }}>
                            {assessment.title}
                          </Link>
                        </td>
                        <td>{assessment.clientLabel ?? assessment.ownerEmail}</td>
                        <td>
                          <span className={`assessment-chip assessment-chip-${st.readinessStatus === "failed" ? "danger" : ["submitted", "ready_for_analysis", "analyzed"].includes(st.readinessStatus) ? "good" : ["skipped", "not_started"].includes(st.readinessStatus) ? "neutral" : "warning"}`}>
                            {formatStatusLabel(st.readinessStatus)}
                          </span>
                        </td>
                        <td>{formatStatusLabel(st.readinessMode)}</td>
                        <td>{formatStatusLabel(st.targetPreference)}</td>
                        <td>
                          <span className={`assessment-chip assessment-chip-${st.cephSuitabilityStatus === "ceph_applies" ? "good" : st.cephSuitabilityStatus === "ceph_underdesigned" ? "danger" : ["ceph_does_not_apply", "not_evaluated_storage_1"].includes(st.cephSuitabilityStatus) ? "neutral" : "warning"}`}>
                            {formatStatusLabel(st.cephSuitabilityStatus)}
                          </span>
                        </td>
                        <td>{st.readinessScore !== null ? `${st.readinessScore}/100` : "-"}</td>
                        <td>{st.evidenceConfidence !== null ? `${st.evidenceConfidence}/100` : "-"}</td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                            {st.evidenceFilesCount > 0 ? (
                              <span className="assessment-chip assessment-chip-good" style={{ alignSelf: "flex-start" }}>
                                {st.evidenceFilesCount} archivos
                              </span>
                            ) : (
                              <span className="assessment-chip assessment-chip-danger" style={{ alignSelf: "flex-start" }}>
                                Sin archivos
                              </span>
                            )}
                            {(() => {
                              const destEvidence = st.evidence?.filter((item: { classification: string }) =>
                                ["ceph_status", "ceph_osd_tree", "ceph_df", "pbs_backup_info"].includes(item.classification)
                              ) || [];
                              if (destEvidence.length > 0) {
                                return (
                                  <span style={{ fontSize: "0.7rem", color: "#22d3ee" }}>
                                    Evidencia de destino cargada ({destEvidence.length})
                                  </span>
                                );
                              }
                              if (st.evidenceFilesCount > 0) {
                                return (
                                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                    Evidencia manual del collector pendiente
                                  </span>
                                );
                              }
                              return (
                                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                  Sin evidencia de collector de destino
                                </span>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                {data.recentAssessments.filter((assessment) => assessment.storage.enabled).length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center" }} className="assessment-empty-note">
                      No hay evaluaciones con módulo Storage habilitado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "auditoria" && (
        <section className="assessment-section glass-card">
          <SectionTitle
            id="auditoria"
            icon={<Activity size={18} />}
            label="Auditoría y errores"
            title="Últimos eventos"
            description="Eventos persistidos disponibles. La consola avanzada de errores se mantiene como monitoreo operativo interno."
          />
          {data.advancedAuditEvents.length === 0 ? (
            <p className="assessment-empty-note">No hay eventos recientes para mostrar. La auditoría persistente registra cambios admin, IA, PDF, accesos y eventos operativos cuando existen.</p>
          ) : (
            <div className="report-history-grid">
              {data.advancedAuditEvents.map((event) => (
                <article key={event.id} className="glass-card report-history-card">
                  <div className="report-history-header">
                    <h3>{event.eventType}</h3>
                    <span className="assessment-preview-label">{formatDate(event.createdAt)}</span>
                  </div>
                  <p>{event.message}</p>
                  <div className="report-history-meta">
                    <span>Usuario: {event.user?.email ?? "No disponible"}</span>
                    <span>Evaluación: {event.assessment?.title ?? "No disponible"}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
