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

  const navItems = [
    ["Resumen", "#resumen"],
    ["Estado del Sistema", "#estado-sistema"],
    ["Usuarios", "#usuarios"],
    ["Evaluaciones", "#assessments"],
    ["IA y Consumo", "#ia-consumo"],
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
          <MetricCard icon={<FileText size={22} />} label="Costos y tokens" value="Pendiente" note="Se implementa con persistencia en ADMIN-2B" />
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
            <p className="assessment-inline-note">Las credenciales no se muestran ni se editan desde esta consola en ADMIN-2A.</p>
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
            <p className="assessment-inline-note">No se inventan tokens ni costos sin eventos persistentes.</p>
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
          id="configuracion"
          icon={<Settings size={18} />}
          label="Configuración"
          title="Health de configuración segura"
          description="Sólo estados seguros. No se muestran secretos, tokens, URLs privadas completas ni API keys."
        />
        <p className="assessment-inline-note">Las credenciales no se muestran ni se editan desde esta consola en ADMIN-2A.</p>
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
        {data.recentAuditEvents.length === 0 ? (
          <p className="assessment-empty-note">Auditoría persistente pendiente o sin eventos recientes. Se ampliará en ADMIN-2 junto con eventos de usuario, IA, PDF y pagos.</p>
        ) : (
          <div className="report-history-grid">
            {data.recentAuditEvents.map((event) => (
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
