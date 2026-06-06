import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  Gauge,
  Layers3,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getCurrentAdminUserForConsole } from "../../../../server/admin/adminAuth";
import {
  buildMethodologyContextForAdvisor,
  getMethodologyAdminSnapshot,
  validateMethodologyClaims,
} from "../../../../server/methodology";

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

function formatCount(value: number) {
  return new Intl.NumberFormat("es-AR").format(value);
}

function toneForStatus(value: string) {
  switch (value) {
    case "active":
    case "indexed":
    case "indexado":
    case "preparado":
    case "seed":
    case "incorporated":
    case "good":
      return "good";
    case "draft":
    case "pending":
    case "skipped":
    case "no indexado":
    case "open":
    case "parcial":
      return "warning";
    case "archived":
    case "dismissed":
      return "neutral";
    case "failed":
    case "critical":
      return "danger";
    default:
      return "neutral";
  }
}

function toneForSeverity(value: string) {
  switch (value) {
    case "blocking":
    case "critical":
      return "danger";
    case "high":
    case "medium":
      return "warning";
    default:
      return "neutral";
  }
}

function severityLabel(value: string) {
  const labels: Record<string, string> = {
    blocking: "Bloqueante",
    critical: "Crítica",
    high: "Alta",
    medium: "Media",
    low: "Baja",
    info: "Info",
  };
  return labels[value] ?? value;
}

function noteLabel(value: string) {
  const labels: Record<string, string> = {
    open: "Abierta",
    incorporated: "Incorporada",
    dismissed: "Descartada",
    archived: "Archivada",
  };
  return labels[value] ?? value;
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    active: "Activa",
    draft: "Borrador",
    archived: "Archivada",
    indexed: "Indexado",
    pending: "Pendiente",
    skipped: "Omitido",
    failed: "Fallido",
    indexado: "Indexado",
    "no indexado": "No indexado",
    preparado: "Preparado",
    seed: "Seed",
    open: "Abierta",
    incorporated: "Incorporada",
    dismissed: "Descartada",
    parcial: "Parcial",
  };
  return labels[value] ?? value;
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
    <article className="glass-card assessment-summary-card methodology-summary-card">
      {icon}
      <span className="assessment-summary-label">{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

function StatusPill({ status, label }: { status: string; label: string }) {
  return <span className={`assessment-chip assessment-chip-${toneForStatus(status)}`}>{label}</span>;
}

function AccessDenied() {
  return (
    <main className="dashboard-page methodology-page">
      <section className="dashboard-hero glass-card methodology-hero">
        <div>
          <div className="badge badge-cyan">Methodology KB</div>
          <h1>No tenés permisos para esta consola.</h1>
          <p>La vista de metodología queda reservada al admin interno y sigue siendo read-only.</p>
        </div>
        <Link href="/dashboard/admin" className="btn btn-secondary">
          <ArrowLeft size={16} />
          Volver al admin
        </Link>
      </section>
    </main>
  );
}

export default async function MethodologyAdminPage() {
  const { isAdmin } = await getCurrentAdminUserForConsole();

  if (!isAdmin) {
    return <AccessDenied />;
  }

  const snapshot = getMethodologyAdminSnapshot();
  const contextPreview = buildMethodologyContextForAdvisor({
    question: "VMware backup restore, Proxmox capacity y rollback",
    assessmentContext: {
      environmentSummary: "Escenario de foundation metodologica para consola admin.",
      missingEvidence: ["restore test fechado", "headroom de capacidad"],
      keyRisks: ["ventana de cutover estrecha"],
    },
    maxChunks: 4,
  });
  const validationExample = validateMethodologyClaims(
    "La migracion esta garantizada sin downtime. RVTools confirma el backup restore y el target esta listo para migrar.",
    {
      activeBlockingRules: contextPreview.rules.filter((rule) => rule.severity === "blocking").slice(0, 3),
      missingEvidence: ["restore test fechado", "headroom de capacidad"],
      assessmentSummary: "Ejemplo de validacion para la consola admin.",
    },
  );

  const navItems = [
    ["Versiones", "versiones"],
    ["Dominios", "dominios"],
    ["Reglas", "reglas"],
    ["Conocimiento / RAG", "rag"],
    ["Notas internas", "notas"],
    ["Changelog", "changelog"],
    ["Proximas mejoras", "roadmap"],
  ];

  return (
    <main className="dashboard-page methodology-page">
      <section className="dashboard-hero glass-card methodology-hero">
        <div className="methodology-hero-copy">
          <div className="badge badge-cyan">Metodología Shift Evidence</div>
          <div className="hero-route-line methodology-route-line">
            <span className="hero-route-brand hero-route-brand-vmware">
              <Database size={16} />
              KB
            </span>
            <span className="hero-route-separator">→</span>
            <span className="hero-route-brand hero-route-brand-proxmox">
              <Layers3 size={16} />
              Admin
            </span>
          </div>
          <h1>Knowledge Base versionada para Advisor, scoring y consola interna</h1>
          <p>
            Esta consola muestra el seed v2.1, los dominios metodológicos, las reglas activas, la
            preparación de RAG y la validación de claims sin tocar producción, pagos, Wise ni datos reales.
          </p>
          <div className="methodology-hero-signals">
            <span>
              <ShieldCheck size={14} />
              Read-only
            </span>
            <span>
              <BookOpen size={14} />
              Versionada
            </span>
            <span>
              <Sparkles size={14} />
              Lista para METHODOLOGY-2
            </span>
          </div>
        </div>
        <div className="dashboard-hero-actions methodology-hero-actions">
          <Link href="/dashboard/admin" className="btn btn-secondary">
            <ArrowLeft size={16} />
            Volver al admin
          </Link>
          <Link href="/dashboard/admin#advisor-metodologia" className="btn btn-secondary">
            <ClipboardList size={16} />
            Ver Advisor legado
          </Link>
        </div>
      </section>

      <section className="assessment-summary-grid methodology-summary-grid">
        <MetricCard
          icon={<FileText size={22} />}
          label="Versión activa"
          value={snapshot.version.versionLabel}
          note={snapshot.version.sourceDocumentName}
        />
        <MetricCard
          icon={<Database size={22} />}
          label="Dominios"
          value={formatCount(snapshot.domainCount)}
          note="Once dominios cubiertos por el seed v2.1"
        />
        <MetricCard
          icon={<BookOpen size={22} />}
          label="Reglas activas"
          value={formatCount(snapshot.ruleCount)}
          note="Bloqueos, governance y reglas operativas"
        />
        <MetricCard
          icon={<Layers3 size={22} />}
          label="Chunks RAG"
          value={formatCount(snapshot.chunkCount)}
          note={`Estado ${statusLabel(snapshot.ragState)}`}
        />
        <MetricCard
          icon={<CheckCircle2 size={22} />}
          label="Notas abiertas"
          value={formatCount(snapshot.openNoteCount)}
          note="La escritura sigue deshabilitada"
        />
        <MetricCard
          icon={<Gauge size={22} />}
          label="Scoring"
          value={statusLabel(snapshot.scoringState)}
          note="Foundation seed, sin wire-up productivo"
        />
        <MetricCard
          icon={<Activity size={22} />}
          label="Advisor"
          value={statusLabel(snapshot.advisorState)}
          note="Preparado para consumo futuro"
        />
        <MetricCard
          icon={<Lock size={22} />}
          label="PDF"
          value={statusLabel(snapshot.pdfState)}
          note="Sin cambios sobre el renderer actual"
        />
      </section>

      <nav className="tabs-container" aria-label="Navegación de metodología">
        {navItems.map(([label, key]) => (
          <Link key={key} href={`#${key}`} className="tab-btn">
            {label}
          </Link>
        ))}
      </nav>

      <section id="versiones" className="assessment-section glass-card methodology-panel">
        <SectionTitle
          id="methodology-versiones"
          icon={<FileText size={18} />}
          label="Versiones"
          title="Versión activa y reglas de publicación"
          description="La KB se mantiene como seed determinístico. No hay Prisma migration ni escritura automática en esta etapa."
        />
        <div className="methodology-version-grid">
          <article className="glass-card report-history-card methodology-version-card">
            <div className="report-history-header">
              <div>
                <div className="assessment-section-eyebrow">
                  <Sparkles size={16} />
                  <span>Active release</span>
                </div>
                <h3>{snapshot.version.versionLabel}</h3>
                <p className="assessment-inline-note">{snapshot.version.notes}</p>
              </div>
              <StatusPill status={snapshot.version.status} label={statusLabel(snapshot.version.status)} />
            </div>
            <div className="report-history-meta">
              <span>Effective from: {formatDate(snapshot.version.effectiveFrom)}</span>
              <span>Created: {formatDate(snapshot.version.createdAt)}</span>
              <span>Updated: {formatDate(snapshot.version.updatedAt)}</span>
            </div>
          </article>
          <article className="glass-card report-history-card methodology-version-card">
            <h3>Reglas de publicación segura</h3>
            <div className="methodology-bullet-list">
              {snapshot.featureNotes.map((note) => (
                <div key={note} className="methodology-bullet">
                  <CheckCircle2 size={16} />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section id="dominios" className="assessment-section glass-card methodology-panel">
        <SectionTitle
          id="methodology-dominios"
          icon={<Database size={18} />}
          label="Dominios"
          title="Once dominios metodológicos cubren la base v2.1"
          description="Cada dominio agrupa reglas y temas para que el Advisor y la consola hablen el mismo lenguaje."
        />
        <div className="report-history-grid methodology-domain-grid">
          {snapshot.domains.map((domain) => (
            <article key={domain.id} className="glass-card report-history-card methodology-domain-card">
              <div className="report-history-header">
                <div>
                  <h3>{domain.label}</h3>
                  <p className="assessment-inline-note">{domain.description}</p>
                </div>
                <span className="assessment-chip assessment-chip-neutral">#{domain.order}</span>
              </div>
              <div className="report-history-meta">
                <span>{domain.key}</span>
                <span>{snapshot.topics.filter((topic) => topic.domainId === domain.id).length} temas</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="reglas" className="assessment-section glass-card methodology-panel">
        <SectionTitle
          id="methodology-reglas"
          icon={<BookOpen size={18} />}
          label="Reglas"
          title="Catálogo de reglas activas"
          description="Se listan severidad, evidencia requerida y superficie de uso para poder reutilizar el mismo criterio en Advisor, scoring, PDF y admin."
        />
        <div className="assessment-table-wrap methodology-table-wrap">
          <table className="assessment-table methodology-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Regla</th>
                <th>Severidad</th>
                <th>Dominio</th>
                <th>Evidence</th>
                <th>Superficie</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.rules.map((rule) => {
                const domain = snapshot.domains.find((item) => item.id === rule.domainId);
                return (
                  <tr key={rule.id}>
                    <td>{rule.ruleCode}</td>
                    <td>
                      <strong>{rule.title}</strong>
                      <p className="assessment-inline-note">{rule.conditionText}</p>
                    </td>
                    <td>
                      <span className={`assessment-chip assessment-chip-${toneForSeverity(rule.severity)}`}>
                        {severityLabel(rule.severity)}
                      </span>
                    </td>
                    <td>{domain?.label ?? rule.domainId}</td>
                    <td>
                      <div className="methodology-inline-tags">
                        {rule.evidenceRequired.map((item) => (
                          <span key={item} className="assessment-chip assessment-chip-neutral">
                            {item}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="methodology-inline-tags">
                        {rule.usageSurface?.map((surface) => (
                          <span key={surface} className="assessment-chip assessment-chip-neutral">
                            {surface}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section id="rag" className="assessment-section glass-card methodology-panel">
        <SectionTitle
          id="methodology-rag"
          icon={<Layers3 size={18} />}
          label="Conocimiento / RAG"
          title="Preview de contexto y preparación de chunks"
          description="La búsqueda es local y determinística. Esto deja listo el terreno para embeddings o retrieval posterior sin exponer prompts reales."
        />
        <div className="assessment-preview-grid methodology-preview-grid">
          <article className="glass-card report-history-card methodology-preview-card">
            <h3>Context preview</h3>
            <div className="report-history-meta">
              <span>Search query: {contextPreview.searchQuery}</span>
              <span>Version: {contextPreview.version.versionLabel}</span>
              <span>Rules selected: {contextPreview.limits.selectedRules}</span>
              <span>Chunks selected: {contextPreview.limits.selectedChunks}</span>
            </div>
            {contextPreview.missingEvidenceWarnings.length > 0 ? (
              <div className="methodology-warning-box">
                {contextPreview.missingEvidenceWarnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            ) : null}
            <div className="methodology-inline-tags">
              {contextPreview.rules.map((rule) => (
                <span key={rule.ruleCode} className="assessment-chip assessment-chip-neutral">
                  {rule.ruleCode}
                </span>
              ))}
            </div>
          </article>
          <article className="glass-card report-history-card methodology-preview-card">
            <h3>Ejemplo de validación de claims</h3>
            <p className="assessment-inline-note">
              Afirmación de ejemplo: “La migración está garantizada sin downtime. RVTools confirma el backup restore y el target está listo para migrar.”
            </p>
            <div className="methodology-validation-summary">
              <StatusPill
                status={validationExample.shouldBlock ? "critical" : "active"}
                label={validationExample.shouldBlock ? "Bloquea" : "Pasa"}
              />
              <span>{validationExample.summary}</span>
            </div>
            {validationExample.findings.length > 0 ? (
              <div className="methodology-findings-list">
                {validationExample.findings.map((finding) => (
                  <article key={finding.code} className="methodology-finding-card">
                    <div className="report-history-header">
                      <div>
                        <h4>{finding.code}</h4>
                        <p className="assessment-inline-note">{finding.message}</p>
                      </div>
                      <span className={`assessment-chip assessment-chip-${toneForSeverity(finding.severity)}`}>
                        {finding.severity}
                      </span>
                    </div>
                    <div className="report-history-meta">
                      <span>Matched: {finding.matchedText}</span>
                      <span>Rules: {finding.relatedRuleCodes.join(", ")}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </article>
        </div>
        <div className="report-history-grid methodology-chunk-grid">
          {contextPreview.chunks.map((chunk) => (
            <article key={chunk.id} className="glass-card report-history-card methodology-chunk-card">
              <div className="report-history-header">
                <div>
                  <h3>{chunk.title}</h3>
                  <p className="assessment-inline-note">{chunk.chunkKey}</p>
                </div>
                <StatusPill status={chunk.embeddingStatus} label={statusLabel(chunk.embeddingStatus)} />
              </div>
              <p>{chunk.content}</p>
              <div className="methodology-inline-tags">
                {chunk.tags.map((tag) => (
                  <span key={tag} className="assessment-chip assessment-chip-neutral">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
        <div className="assessment-table-wrap methodology-table-wrap">
          <table className="assessment-table methodology-table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Checksum</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.sourceDocuments.map((document) => (
                <tr key={document.id}>
                  <td>{document.title}</td>
                  <td>{document.documentType}</td>
                  <td>
                    <StatusPill status={document.status} label={statusLabel(document.status)} />
                  </td>
                  <td>{document.checksum ?? "No disponible"}</td>
                  <td>{formatDate(document.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="notas" className="assessment-section glass-card methodology-panel">
        <SectionTitle
          id="methodology-notas"
          icon={<ShieldCheck size={18} />}
          label="Notas internas"
          title="La escritura sigue deshabilitada"
          description="METHODOLOGY-2 habilitará persistencia de notas cuando exista un workflow auditable para edición, revisión y aprobación."
        />
        <div className="assessment-preview-grid methodology-notes-grid">
          <article className="glass-card report-history-card methodology-note-panel">
            <h3>Nota de escritura</h3>
            <p className="assessment-inline-note">
              La escritura de notas se habilitará en METHODOLOGY-2 para evitar cambios de DB no auditados.
            </p>
            <form className="unlock-admin-form methodology-note-form">
              <label className="form-label">
                Título
                <input className="form-input" disabled placeholder="Write path disabled" />
              </label>
              <label className="form-label">
                Contenido
                <textarea className="form-input assessment-textarea" disabled placeholder="Read-only foundation" />
              </label>
              <button type="button" className="btn btn-secondary" disabled>
                Escritura deshabilitada
              </button>
            </form>
          </article>
          <article className="glass-card report-history-card methodology-note-panel">
            <h3>Notas abiertas</h3>
            <div className="methodology-notes-list">
              {snapshot.notes.map((note) => (
                <article key={note.id} className="methodology-mini-note">
                  <div className="report-history-header">
                    <div>
                      <h4>{note.title}</h4>
                      <p className="assessment-inline-note">{note.content}</p>
                    </div>
                    <span className={`assessment-chip assessment-chip-${toneForStatus(note.status)}`}>
                      {noteLabel(note.status)}
                    </span>
                  </div>
                  <div className="report-history-meta">
                    <span>Priority: {note.priority}</span>
                    <span>Created: {formatDate(note.createdAt)}</span>
                    <span>Updated: {formatDate(note.updatedAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section id="changelog" className="assessment-section glass-card methodology-panel">
        <SectionTitle
          id="methodology-changelog"
          icon={<ClipboardList size={18} />}
          label="Changelog"
          title="Historial de cambios de la versión"
          description="Las entradas son sanitizadas y sirven para explicar la evolución de la KB sin mostrar datos sensibles."
        />
        <div className="methodology-changelog-list">
          {snapshot.changeLog.map((entry) => (
            <article key={entry.id} className="glass-card report-history-card methodology-changelog-card">
              <div className="report-history-header">
                <div>
                  <h3>{entry.summary}</h3>
                  <p className="assessment-inline-note">{entry.rationale}</p>
                </div>
                <span className="assessment-chip assessment-chip-neutral">{entry.changeType}</span>
              </div>
              <div className="report-history-meta">
                <span>Entity: {entry.entityType}</span>
                <span>Entity ID: {entry.entityId}</span>
                <span>By: {entry.createdBy ?? "system"}</span>
                <span>When: {formatDate(entry.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="roadmap" className="assessment-section glass-card methodology-panel">
        <SectionTitle
          id="methodology-roadmap"
          icon={<AlertTriangle size={18} />}
          label="Próximas mejoras"
          title="Camino seguro para METHODOLOGY-2"
          description="La idea es sumar escritura auditable, persistencia y embeddings, pero solo después de que la base read-only quede bien verificada."
        />
        <div className="methodology-roadmap-grid">
          {snapshot.featureNotes.map((note) => (
            <article key={note} className="glass-card report-history-card methodology-roadmap-card">
              <p>{note}</p>
            </article>
          ))}
        </div>
        <div className="dashboard-banner dashboard-banner-warning methodology-roadmap-banner" role="alert">
          <strong>Scope intentionally limited.</strong> Esta consola no toca producción, pagos, Wise, DNS,
          Vercel cutover ni datos reales. El siguiente paso es persistencia segura, no cambios de arquitectura de riesgo.
        </div>
      </section>
    </main>
  );
}
