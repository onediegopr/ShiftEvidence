import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
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
  updateAiBudgetAction,
  updateCommercialOpportunityAction,
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
  return <span className={`assessment-chip assessment-chip-${statusTone(status)}`}>{status}</span>;
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
          Volver al dashboard
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

export default async function AdminConsolePage() {
  const { session, isAdmin } = await getCurrentAdminUserForConsole();

  if (!isAdmin) {
    return <AccessDenied />;
  }

  const data = await getAdminConsoleData();
  const ai = data.aiStatus;
  const aiUsage = data.aiConsumption.persistentUsage;

  const navItems = [
    ["Resumen", "#resumen"],
    ["Estado del Sistema", "#estado-sistema"],
    ["Usuarios", "#usuarios"],
    ["Evaluaciones", "#assessments"],
    ["IA y Consumo", "#ia-consumo"],
    ["Accesos y Planes", "#accesos-planes"],
    ["Oportunidades", "#oportunidades"],
    ["Configuración", "#configuracion"],
    ["Auditoría", "#auditoria"],
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
          <Link href="/dashboard/admin/unlock-requests" className="btn btn-secondary">
            <ClipboardList size={16} />
            Solicitudes de desbloqueo
          </Link>
        </div>
      </section>

      <nav className="tabs-container" aria-label="Navegación de administración">
        {navItems.map(([label, href]) => (
          <a key={href} href={href} className="tab-btn">
            {label}
          </a>
        ))}
      </nav>

      <section id="resumen" className="assessment-summary-grid">
        <MetricCard icon={<Users size={22} />} label="Usuarios totales" value={data.summary.totalUsers} note="Cuentas registradas" />
        <MetricCard icon={<Database size={22} />} label="Evaluaciones totales" value={data.summary.totalAssessments} note="No archivadas" />
        <MetricCard icon={<Activity size={22} />} label="Últimos 7 días" value={data.summary.assessmentsLast7Days} note="Evaluaciones creadas" />
        <MetricCard icon={<FileText size={22} />} label="PDF generados" value={data.summary.totalReports} note="Reportes no borrados" />
        <MetricCard icon={<Bot size={22} />} label="IA Gemini" value={ai.iaActiva ? "Activa" : "No activa"} note={`Proveedor: ${ai.proveedor}`} />
        <MetricCard icon={<Gauge size={22} />} label="Estado general" value={data.summary.generalStatus} note="Señal operativa agregada" />
        <MetricCard icon={<ShieldCheck size={22} />} label="Beta limitada" value={data.summary.betaStatus} note="Controlled launch" />
        <MetricCard icon={<AlertTriangle size={22} />} label="Full public launch" value={data.summary.fullPublicLaunch} note="No declarado" />
      </section>

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
              <span>Gemini API Key: {ai.geminiConfigurado ? "Configurada" : "No configurada"}</span>
              <span>OpenAI API Key: {ai.openaiConfigurado ? "Configurada" : "No configurada"}</span>
              <span>Secretos expuestos: {ai.secretosExpuestos ? "Sí" : "No"}</span>
              <span>Archivos crudos enviados: {ai.archivosCrudosEnviados ? "Sí" : "No"}</span>
              <span>Timeout: {ai.timeoutMs} ms</span>
              <span>Input máximo: {ai.maxInputChars} chars</span>
              <span>Output máximo: {ai.maxOutputChars} chars</span>
            </div>
            <p className="assessment-inline-note">Las credenciales no se muestran ni se editan desde esta consola en ADMIN-2B.</p>
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
            <p className="assessment-inline-note">Las métricas son temporales y pueden perderse con un deploy. No hay billing real en ADMIN-2A.</p>
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
            <p className="assessment-inline-note">No se guardan prompts completos ni respuestas crudas. No es billing automatico.</p>
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
              <span>Limite diario: {formatCurrency(data.aiConsumption.budget.settings.dailyBudgetUsd)}</span>
              <span>Limite usuario: {formatCurrency(data.aiConsumption.budget.settings.perUserMonthlyBudgetUsd)}</span>
              <span>Limite assessment: {formatCurrency(data.aiConsumption.budget.settings.perAssessmentBudgetUsd)}</span>
            </div>
            <p className="assessment-inline-note">Limites informativos. El bloqueo automatico se implementara en ADMIN-4.</p>
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
                  Limite diario USD
                  <input name="dailyBudgetUsd" type="number" step="0.01" min="0" className="form-input" defaultValue={data.aiConsumption.budget.settings.dailyBudgetUsd ?? ""} />
                </label>
                <label className="form-label">
                  Limite por usuario USD
                  <input name="perUserMonthlyBudgetUsd" type="number" step="0.01" min="0" className="form-input" defaultValue={data.aiConsumption.budget.settings.perUserMonthlyBudgetUsd ?? ""} />
                </label>
                <label className="form-label">
                  Limite por assessment USD
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
                    <td>{event.status}</td>
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
                        <td>{item.lastStatus}</td>
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
                    <strong>{event.status}</strong> / {event.errorCategory ?? "sin categoria"} - {event.assessmentTitle ?? "sin evaluacion"} - {formatDate(event.createdAt)}
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
                    <td>{event.status}</td>
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

      <section className="assessment-section glass-card">
        <SectionTitle
          id="accesos-planes"
          icon={<ShieldCheck size={18} />}
          label="Accesos y Planes"
          title="Entitlements y accesos manuales"
          description="Gestion interna read-only/confirmada para planes, accesos, IA y reportes. No hay billing automatico ni hard delete."
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
                    <option value="free_preview">Free Preview</option>
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="blueprint">Blueprint</option>
                    <option value="msp_partner">MSP Partner</option>
                    <option value="internal_qa">Internal QA</option>
                  </select>
                </label>
                <label className="form-label">
                  Estado
                  <select name="status" className="form-input" defaultValue="manual">
                    <option value="active">Activo</option>
                    <option value="pending_payment">Pendiente de pago</option>
                    <option value="trial">Trial</option>
                    <option value="manual">Manual</option>
                    <option value="expired">Expirado</option>
                  </select>
                </label>
                <label className="form-label">
                  Origen
                  <select name="source" className="form-input" defaultValue="admin">
                    <option value="admin">Admin</option>
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
                  Max assessments
                  <input name="maxAssessments" type="number" min="0" className="form-input" />
                </label>
                <label className="form-label">
                  Max PDFs
                  <input name="maxPdfReports" type="number" min="0" className="form-input" />
                </label>
              </div>
              <label className="form-label">
                Notas internas
                <textarea name="notesInternal" className="form-input form-textarea" rows={3} placeholder="Nota interna, sin secrets" />
              </label>
              <div className="assessment-inline-actions">
                <label className="assessment-inline-note"><input name="aiEnabled" type="checkbox" /> IA habilitada</label>
                <label className="assessment-inline-note"><input name="fullReportEnabled" type="checkbox" /> Full report/PDF habilitado</label>
              </div>
              <button type="submit" className="btn btn-primary btn-glow">Confirmar cambio de acceso</button>
            </form>
          </article>
          <article className="glass-card report-history-card">
            <h3>Acciones operativas IA</h3>
            <p className="assessment-inline-note">Estas acciones son instrucciones, no botones destructivos. ADMIN-3 no edita Hostinger env vars.</p>
            <div className="report-history-meta">
              <span>Apagar IA: configurar AI_ADVISORY_ENABLED=false en Hostinger.</span>
              <span>Volver a mock: configurar AI_ADVISORY_PROVIDER=mock.</span>
              <span>Reactivar Gemini: validar provider, key y smoke antes de exponerlo.</span>
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
                <th>Full report</th>
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
                    <td>{entitlement.planKey}</td>
                    <td>{entitlement.status}</td>
                    <td>{entitlement.source}</td>
                    <td>{formatDate(entitlement.expiresAt)}</td>
                    <td>{entitlement.aiEnabled ? "Si" : "No"}</td>
                    <td>{entitlement.fullReportEnabled ? "Si" : "No"}</td>
                    <td>{entitlement.notesInternal ?? "Sin notas"}</td>
                    <td>
                      <form>
                        <button type="submit" className="btn btn-secondary" formAction={revokeUserEntitlementAction.bind(null, entitlement.id)}>
                          Revocar acceso
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          id="oportunidades"
          icon={<Gauge size={18} />}
          label="Oportunidades"
          title="Oportunidades comerciales y proxima accion"
          description="Scoring deterministico inicial para seguimiento comercial relacionado al assessment. No usa IA como autoridad."
        />
        <section className="assessment-summary-grid">
          <MetricCard icon={<Gauge size={22} />} label="Alto potencial" value={data.commercialOpportunities.filter((item) => item.score >= 70).length} note="Score >= 70" />
          <MetricCard icon={<AlertTriangle size={22} />} label="Requieren seguimiento" value={data.commercialOpportunities.filter((item) => item.tags.includes("Requiere seguimiento")).length} note="Customer success" />
          <MetricCard icon={<FileText size={22} />} label="Candidatos Blueprint" value={data.commercialOpportunities.filter((item) => item.tags.includes("Candidato Blueprint")).length} note="DiseÃ±o destino" />
          <MetricCard icon={<Users size={22} />} label="Pendientes de pago" value={data.commercialOpportunities.filter((item) => item.status === "pending_payment").length} note="Estado comercial" />
        </section>
        <div className="assessment-table-wrap">
          <table className="assessment-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Assessment</th>
                <th>Score</th>
                <th>Tags</th>
                <th>Proxima accion</th>
                <th>Plan sugerido</th>
                <th>Estado</th>
                <th>Notas</th>
                <th>Actualizar</th>
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
                    <td>{opportunity.status}</td>
                    <td>{opportunity.notesInternal ?? "Sin notas"}</td>
                    <td>
                      <form className="unlock-admin-form" action={updateCommercialOpportunityAction}>
                        <input type="hidden" name="assessmentId" value={opportunity.assessmentId ?? ""} />
                        <input type="hidden" name="userId" value={opportunity.userId ?? ""} />
                        <input type="hidden" name="score" value={opportunity.score} />
                        <label className="form-label">
                          Estado
                          <select name="status" className="form-input" defaultValue={opportunity.status}>
                            <option value="new_lead">Nuevo lead</option>
                            <option value="needs_follow_up">Requiere seguimiento</option>
                            <option value="proposal_sent">Propuesta enviada</option>
                            <option value="paid">Pagado</option>
                            <option value="lost">Perdido</option>
                            <option value="dormant">Dormido</option>
                            <option value="partner_candidate">Candidato partner</option>
                          </select>
                        </label>
                        <input name="nextBestAction" className="form-input" defaultValue={opportunity.nextBestAction ?? ""} />
                        <input name="suggestedPlan" className="form-input" defaultValue={opportunity.suggestedPlan ?? ""} />
                        <textarea name="notesInternal" className="form-input form-textarea" rows={2} defaultValue={opportunity.notesInternal ?? ""} />
                        <button type="submit" className="btn btn-secondary">Guardar</button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          id="configuracion"
          icon={<Settings size={18} />}
          label="Configuración"
          title="Health de configuración segura"
          description="Sólo estados seguros. No se muestran secretos, tokens, URLs privadas completas ni API keys."
        />
        <p className="assessment-inline-note">Las credenciales no se muestran ni se editan desde esta consola en ADMIN-2B.</p>
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

      <section className="assessment-section glass-card">
        <SectionTitle
          id="usuarios"
          icon={<Users size={18} />}
          label="Usuarios"
          title="Usuarios recientes"
          description="Vista read-only. Acciones destructivas y suplantacion quedan fuera de ADMIN-1."
        />
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
                  <td>{user.plan}</td>
                  <td>{user.aiCalls}</td>
                  <td>{formatNumber(user.aiTokens)}</td>
                  <td>{formatCurrency(user.aiCost)}</td>
                  <td>{formatDate(user.lastAiUsage)}</td>
                  <td>{user.entitlementPlan} / {user.entitlementStatus}</td>
                  <td>{user.opportunityScore} - {user.commercialStatus}</td>
                  <td>{user.nextBestAction}</td>
                  <td>Ver usuario / Ver evaluaciones</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          id="assessments"
          icon={<Database size={18} />}
          label="Evaluaciones"
          title="Evaluaciones recientes"
          description="Vista read-only para revisar estado, evidencia, contexto, PDF e IA."
        />
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
                <th>Confidence</th>
                <th>Llamadas IA</th>
                <th>Tokens IA</th>
                <th>Costo IA</th>
                <th>Errores IA</th>
                <th>Ultimo estado IA</th>
                <th>Oportunidad</th>
                <th>Tags</th>
                <th>Proxima accion</th>
                <th>Actualizado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.recentAssessments.map((assessment) => (
                <tr key={assessment.id}>
                  <td>{assessment.title}</td>
                  <td>{assessment.clientLabel ?? assessment.ownerEmail}</td>
                  <td>{assessment.status}</td>
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
                  <td>{assessment.lastAiStatus}</td>
                  <td>{assessment.opportunityScore} - {assessment.commercialStatus}</td>
                  <td>{assessment.opportunityTags.join(", ") || "Sin tags"}</td>
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
      </section>

      <section className="assessment-section glass-card">
        <SectionTitle
          id="auditoria"
          icon={<Activity size={18} />}
          label="Auditoría y errores"
          title="Últimos eventos"
          description="Eventos persistidos disponibles. Consola avanzada de errores queda para ADMIN-2."
        />
        {data.advancedAuditEvents.length === 0 ? (
          <p className="assessment-empty-note">Auditoría persistente pendiente o sin eventos recientes. Se ampliará en ADMIN-2 junto con eventos de usuario, IA, PDF y pagos.</p>
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
    </main>
  );
}
