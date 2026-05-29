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
  Lock,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getCurrentAdminUserForConsole } from "../../../server/admin/adminAuth";
import { getAdminConsoleData } from "../../../server/admin/adminConsoleService";
import {
  createUserEntitlementAction,
  revokeUserEntitlementAction,
  setAiRuntimeModeFormAction,
  updateAiBudgetAction,
  updateCommercialOpportunityAction,
  updateOperationalRuntimeSettingsAction,
} from "./actions";

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
    gemini: "Gemini",
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
    starter: "Starter",
    success: "Exitoso",
    timeout: "Timeout",
    trial: "Prueba",
    unavailable: "No disponible",
    unknown: "Desconocido",
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
  });

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
  };
  const savedMessage = saved ? (savedMessages[saved] ?? "Acción administrativa guardada.") : null;

  const navItems = [
    ["Resumen", "resumen"],
    ["Estado del Sistema", "estado-sistema"],
    ["Usuarios", "usuarios"],
    ["Evaluaciones", "evaluaciones"],
    ["Licenciamiento", "licenciamiento"],
    ["Contexto y Evidencias", "contexto-evidencias"],
    ["IA y Consumo", "ia-consumo"],
    ["Configuración Operativa", "configuracion-operativa"],
    ["Accesos y Planes", "accesos-planes"],
    ["Oportunidades", "oportunidades"],
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

      {activeTab === "resumen" && (
        <section id="resumen" className="assessment-summary-grid">
          <MetricCard icon={<Users size={22} />} label="Usuarios totales" value={data.summary.totalUsers} note="Cuentas registradas" />
          <MetricCard icon={<Database size={22} />} label="Evaluaciones totales" value={data.summary.totalAssessments} note="No archivadas" />
          <MetricCard icon={<Activity size={22} />} label="Últimos 7 días" value={data.summary.assessmentsLast7Days} note="Evaluaciones creadas" />
          <MetricCard icon={<FileText size={22} />} label="PDF generados" value={data.summary.totalReports} note="Reportes no borrados" />
          <MetricCard icon={<Bot size={22} />} label="IA Gemini" value={ai.iaActiva ? "Activa" : "No activa"} note={`Proveedor: ${ai.proveedor}`} />
          <MetricCard icon={<Gauge size={22} />} label="Estado general" value={data.summary.generalStatus} note="Señal operativa agregada" />
          <MetricCard icon={<ShieldCheck size={22} />} label="Beta limitada" value={data.summary.betaStatus} note="Lanzamiento controlado" />
          <MetricCard icon={<AlertTriangle size={22} />} label="Full public launch" value={data.summary.fullPublicLaunch} note="No declarado" />
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
            <MetricCard icon={<Bot size={22} />} label="Modo IA runtime" value={data.runtimeSettings.aiRuntimeMode} note={`Efectivo: ${ai.proveedor}`} />
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
                  ["gemini", "Forzar Gemini", "Usa Gemini si la credencial existe en el entorno."],
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
            title="Estado de Gemini AI Advisory"
            description="Estado seguro del proveedor. No muestra keys, prompts ni respuestas crudas."
          />
          <section className="assessment-summary-grid">
            <MetricCard icon={<Bot size={22} />} label="IA activa" value={ai.iaActiva ? "Sí" : "No"} note={`Proveedor: ${ai.proveedor}`} />
            <MetricCard icon={<Settings size={22} />} label="Modelo" value={ai.modelo ?? "No configurado"} note="Modelo activo o fallback" />
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
                <span>Credencial OpenAI: {ai.openaiConfigurado ? "Configurada" : "No configurada"}</span>
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
                      <option value="wise">Wise</option>
                      <option value="transfer">Transferencia</option>
                      <option value="stripe">Stripe</option>
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
                    <td>{assessment.evidence}</td>
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
