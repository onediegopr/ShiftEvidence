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
  buildMethodologyAdvisorContext,
  buildMethodologyContextForAdvisor,
  buildMethodologyReportContext,
  getMethodologyAdminSnapshot,
  validateMethodologyClaims,
} from "../../../../server/methodology";
import { getMethodologyNoteAssociationLabel, getMethodologyRuleAssociation } from "../../../../server/methodology/persistenceUtils";
import { listMethodologyBibleExtractionPlan } from "../../../../server/methodology/extractionPlan";
import { listMethodologyAdminNotes as listPersistedMethodologyAdminNotes } from "../../../../server/methodology/adminNotes";
import { listMethodologyChangeLog as listPersistedMethodologyChangeLog } from "../../../../server/methodology/changelog";
import { listMethodologyReviewItems as listPersistedMethodologyReviewItems } from "../../../../server/methodology/reviewWorkflow";
import {
  METHODOLOGY_NOTE_PRIORITIES,
  METHODOLOGY_REVIEW_STATUSES,
} from "../../../../server/methodology/types";
import { formatAdminDate } from "../../../../lib/adminDate";
import {
  archiveMethodologyAdminNoteAction,
  createMethodologyAdminNoteAction,
  createReviewItemFromNoteAction,
  updateMethodologyAdminNoteStatusAction,
  updateMethodologyReviewStatusAction,
} from "./actions";

function formatDate(value: Date | string | null | undefined) {
  return formatAdminDate(value);
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
    case "approved":
    case "implemented":
      return "good";
    case "draft":
    case "pending":
    case "skipped":
    case "no indexado":
    case "open":
    case "proposed":
    case "parcial":
      return "warning";
    case "archived":
    case "dismissed":
    case "rejected":
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
    critical: "Critica",
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

function priorityLabel(value: string) {
  const labels: Record<string, string> = {
    low: "Baja",
    normal: "Normal",
    high: "Alta",
    critical: "Critica",
  };
  return labels[value] ?? value;
}

function reviewTypeLabel(value: string) {
  const labels: Record<string, string> = {
    rule: "Regla",
    chunk: "Chunk",
    topic: "Tema",
    domain: "Dominio",
    claim_validator: "Validador de claims",
    scoring: "Scoring",
    advisor: "Advisor",
    report: "Reporte",
    checklist: "Checklist",
    other: "Otro",
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
    proposed: "Propuesto",
    approved: "Aprobado",
    rejected: "Rechazado",
    implemented: "Implementado",
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

type MethodologyAdminPageSearchParams =
  | {
      error?: string;
    }
  | Promise<{
      error?: string;
    }>;

type MethodologyAdminPageProps = {
  searchParams?: MethodologyAdminPageSearchParams;
};

type PersistedMethodologyData = {
  notes: Awaited<ReturnType<typeof listPersistedMethodologyAdminNotes>>;
  reviewItems: Awaited<ReturnType<typeof listPersistedMethodologyReviewItems>>;
  changeLog: Awaited<ReturnType<typeof listPersistedMethodologyChangeLog>>;
  warnings: string[];
};

function decodeErrorMessage(value?: string) {
  if (!value) return null;

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function resolveSearchParams(searchParams?: MethodologyAdminPageSearchParams) {
  if (!searchParams) {
    return {};
  }

  return typeof (searchParams as Promise<unknown>).then === "function" ? await searchParams : searchParams;
}

async function loadPersistedMethodologyData(): Promise<PersistedMethodologyData> {
  const results = await Promise.allSettled([
    listPersistedMethodologyAdminNotes({ limit: 24 }),
    listPersistedMethodologyReviewItems({ limit: 24 }),
    listPersistedMethodologyChangeLog({ limit: 24 }),
  ]);

  const warnings: string[] = [];
  const notesResult = results[0];
  const reviewResult = results[1];
  const changeLogResult = results[2];

  if (notesResult.status === "rejected") {
    warnings.push("Las notas persistidas no se pudieron cargar en este entorno.");
  }
  if (reviewResult.status === "rejected") {
    warnings.push("El workflow de revision persistido no se pudo cargar en este entorno.");
  }
  if (changeLogResult.status === "rejected") {
    warnings.push("El changelog persistido no se pudo cargar en este entorno.");
  }

  return {
    notes: notesResult.status === "fulfilled" ? notesResult.value : [],
    reviewItems: reviewResult.status === "fulfilled" ? reviewResult.value : [],
    changeLog: changeLogResult.status === "fulfilled" ? changeLogResult.value : [],
    warnings,
  };
}

function AccessDenied() {
  return (
    <main className="dashboard-page methodology-page">
      <section className="dashboard-hero glass-card methodology-hero">
        <div>
          <div className="badge badge-cyan">Methodology KB</div>
          <h1>No tenes permisos para esta consola.</h1>
          <p>La vista de metodologia queda reservada al admin interno y sigue siendo read-only.</p>
        </div>
        <Link href="/dashboard/admin" className="btn btn-secondary">
          <ArrowLeft size={16} />
          Volver al admin
        </Link>
      </section>
    </main>
  );
}

export default async function MethodologyAdminPage({ searchParams }: MethodologyAdminPageProps) {
  const { isAdmin } = await getCurrentAdminUserForConsole();

  if (!isAdmin) {
    return <AccessDenied />;
  }

  const [resolvedSearchParams, persistedData] = await Promise.all([
    resolveSearchParams(searchParams),
    loadPersistedMethodologyData(),
  ]);

  const queryError = decodeErrorMessage(resolvedSearchParams.error);
  const extractionPlan = listMethodologyBibleExtractionPlan();
  const snapshot = getMethodologyAdminSnapshot();
  const advisorBridgePreview = buildMethodologyAdvisorContext({
    question: "VMware backup restore, Proxmox capacity y rollback",
    assessmentSummary: "Escenario de foundation metodologica para consola admin.",
    missingEvidence: ["restore test fechado", "headroom de capacidad"],
    activeBlockers: ["ventana de cutover estrecha"],
    maxChunks: 4,
    maxRules: 6,
  });
  const reportBridgePreview = buildMethodologyReportContext({
    assessmentSummary: "Escenario de report bridge para PDF methodology notes.",
    missingEvidence: ["restore test fechado", "headroom de capacidad"],
    activeBlockers: ["ventana de cutover estrecha"],
    maxChunks: 4,
    maxRules: 6,
  });
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
      activeBlockingRules: advisorBridgePreview.relevantRules.filter((rule) => rule.severity === "blocking").slice(0, 3),
      missingEvidence: ["restore test fechado", "headroom de capacidad"],
      assessmentSummary: "Ejemplo de validacion para la consola admin.",
    },
  );
  const baseRuleCount = 16;
  const baseChunkCount = 11;
  const newRuleCount = Math.max(snapshot.ruleCount - baseRuleCount, 0);
  const newChunkCount = Math.max(snapshot.chunkCount - baseChunkCount, 0);
  const extractionCoverage = extractionPlan.filter((part) =>
    part.linkedRuleCodes.some((ruleCode) => snapshot.rules.some((rule) => rule.ruleCode === ruleCode)),
  ).length;
  const extractionPartRows = extractionPlan.map((part) => {
    const coveredRules = part.linkedRuleCodes.filter((ruleCode) => snapshot.rules.some((rule) => rule.ruleCode === ruleCode));
    return {
      ...part,
      coveredRules,
      coverage: part.linkedRuleCodes.length > 0 ? Math.round((coveredRules.length / part.linkedRuleCodes.length) * 100) : 0,
    };
  });
  const advisorBridgeEnabled = advisorBridgePreview.enabled;
  const reportBridgeEnabled = process.env.METHODOLOGY_REPORT_CONTEXT_ENABLED === "true";

  const navItems = [
    ["Expansion", "expansion"],
    ["Versiones", "versiones"],
    ["Dominios", "dominios"],
    ["Reglas", "reglas"],
    ["Conocimiento / RAG", "rag"],
    ["Notas internas", "notas"],
    ["Revision", "revision"],
    ["Changelog", "changelog"],
    ["Changelog persistido", "changelog-persistido"],
    ["Proximas mejoras", "roadmap"],
  ] as const;

  return (
    <main className="dashboard-page methodology-page">
      <section className="dashboard-hero glass-card methodology-hero">
        <div className="methodology-hero-copy">
          <div className="badge badge-cyan">Metodologia Shift Evidence</div>
          <div className="hero-route-line methodology-route-line">
            <span className="hero-route-brand hero-route-brand-vmware">
              <Database size={16} />
              KB
            </span>
            <span className="hero-route-separator">-&gt;</span>
            <span className="hero-route-brand hero-route-brand-proxmox">
              <Layers3 size={16} />
              Admin
            </span>
          </div>
          <h1>Knowledge Base versionada para Advisor, scoring y operación interna</h1>
          <p>
            Esta consola muestra el seed v2.1, la edicion auditable de notas internas, el workflow de revision
            y el changelog persistido sin tocar produccion, pagos, Wise ni datos reales.
          </p>
          <div className="methodology-hero-signals">
            <span>
              <ShieldCheck size={14} />
              Admin auth
            </span>
            <span>
              <BookOpen size={14} />
              Versionada
            </span>
            <span>
              <Sparkles size={14} />
              Lista para METHODOLOGY-3
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

      {queryError ? (
        <div className="dashboard-banner dashboard-banner-error methodology-banner" role="alert">
          <strong>Error de accion.</strong> {queryError}
        </div>
      ) : null}

      {persistedData.warnings.length > 0 ? (
        <div className="dashboard-banner dashboard-banner-warning methodology-banner" role="status">
          <strong>Persistencia parcial.</strong> {persistedData.warnings.join(" ")}
        </div>
      ) : null}

      <section className="assessment-summary-grid methodology-summary-grid">
        <MetricCard
          icon={<FileText size={22} />}
          label="Version activa"
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
          note="La base read-only sigue visible"
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
        <MetricCard
          icon={<ShieldCheck size={22} />}
          label="Notas persistidas"
          value={formatCount(persistedData.notes.length)}
          note="Tabla MethodologyAdminNote"
        />
        <MetricCard
          icon={<ClipboardList size={22} />}
          label="Items de revision"
          value={formatCount(persistedData.reviewItems.length)}
          note="Workflow auditable guardado"
        />
        <MetricCard
          icon={<Database size={22} />}
          label="Changelog auditable"
          value={formatCount(persistedData.changeLog.length)}
          note="MethodologyChangeLog"
        />
      </section>

      <section id="expansion" className="assessment-section glass-card methodology-panel">
        <SectionTitle
          id="methodology-expansion"
          icon={<Sparkles size={18} />}
          label="Expansion METHODOLOGY-3"
          title="Full Bible Extraction Expansion y bridges controlados"
          description="La ampliacion sube el catalogo de reglas y chunks sin cambiar scoring, Advisor ni PDF automaticamente."
        />
        <div className="assessment-summary-grid methodology-summary-grid">
          <MetricCard
            icon={<BookOpen size={22} />}
            label="Reglas activas"
            value={formatCount(snapshot.ruleCount)}
            note={`Base 16 + nuevas ${formatCount(newRuleCount)}`}
          />
          <MetricCard
            icon={<Layers3 size={22} />}
            label="Chunks activos"
            value={formatCount(snapshot.chunkCount)}
            note={`Base 11 + nuevos ${formatCount(newChunkCount)}`}
          />
          <MetricCard
            icon={<Database size={22} />}
            label="Partes de la Biblia"
            value={formatCount(extractionPlan.length)}
            note={`Cobertura observada ${formatCount(extractionCoverage)} partes`}
          />
          <MetricCard
            icon={<Activity size={22} />}
            label="Advisor bridge"
            value={advisorBridgeEnabled ? "Enabled" : "Feature flag"}
            note={advisorBridgePreview.recommendedTone}
          />
          <MetricCard
            icon={<Lock size={22} />}
            label="PDF bridge"
            value={reportBridgeEnabled ? "Enabled" : "Prepared"}
            note={reportBridgePreview.blockerLanguage}
          />
          <MetricCard
            icon={<ShieldCheck size={22} />}
            label="Claim validator v3"
            value="Ready"
            note={validationExample.findings.length > 0 ? "Safe wording suggestions available" : "Safe by default"}
          />
        </div>
        <div className="methodology-bridge-copy">
          <article className="glass-card report-history-card methodology-version-card">
            <div className="report-history-header">
              <div>
                <h3>Advisor bridge preview</h3>
                <p className="assessment-inline-note">Prepared helper, not automatic runtime wiring.</p>
              </div>
              <StatusPill status={advisorBridgeEnabled ? "active" : "draft"} label={advisorBridgeEnabled ? "Enabled" : "Feature flag"} />
            </div>
            <div className="methodology-bullet-list">
              {advisorBridgePreview.safetyCaveats.map((item) => (
                <div key={item} className="methodology-bullet">
                  <CheckCircle2 size={16} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="report-history-meta">
              <span>Relevant rules: {formatCount(advisorBridgePreview.relevantRules.length)}</span>
              <span>Relevant chunks: {formatCount(advisorBridgePreview.relevantChunks.length)}</span>
              <span>Tone: {advisorBridgePreview.recommendedTone}</span>
            </div>
          </article>

          <article className="glass-card report-history-card methodology-version-card">
            <div className="report-history-header">
              <div>
                <h3>PDF bridge preview</h3>
                <p className="assessment-inline-note">Contexto seguro para report methodology notes.</p>
              </div>
              <StatusPill status={reportBridgeEnabled ? "active" : "draft"} label={reportBridgeEnabled ? "Enabled" : "Prepared"} />
            </div>
            <div className="methodology-bullet-list">
              {reportBridgePreview.methodologyNotes.map((item) => (
                <div key={item} className="methodology-bullet">
                  <CheckCircle2 size={16} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="report-history-meta">
              <span>Safe claims: {reportBridgePreview.safeClaims.join(" · ")}</span>
              <span>Rule trace: {reportBridgePreview.ruleTraceExamples.join(" | ")}</span>
            </div>
          </article>
        </div>
        <div className="assessment-table-wrap methodology-table-wrap">
          <table className="assessment-table methodology-table">
            <thead>
              <tr>
                <th>Part</th>
                <th>Enfoque</th>
                <th>Dominios</th>
                <th>Rules cubiertas</th>
                <th>Coverage</th>
                <th>Deliverables</th>
              </tr>
            </thead>
            <tbody>
              {extractionPartRows.map((part) => (
                <tr key={part.part}>
                  <td>
                    <strong>{part.part}</strong>
                    <p className="assessment-inline-note">{part.title}</p>
                  </td>
                  <td>{part.focus}</td>
                  <td>{part.linkedDomains.join(", ")}</td>
                  <td>{part.coveredRules.length > 0 ? part.coveredRules.join(", ") : "Pendiente"}</td>
                  <td>{formatCount(part.coverage)}%</td>
                  <td>{part.deliverables.join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="dashboard-banner dashboard-banner-warning methodology-roadmap-banner" role="alert">
          <strong>Scope intentionally limited.</strong> La extraccion ampliada no cambia scoring, Advisor ni PDF
          automaticamente sin feature flag o integracion posterior.
        </div>
      </section>

      <nav className="tabs-container" aria-label="Navegacion de metodologia">
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
          title="Version activa y reglas de publicacion"
          description="La KB se mantiene como seed deterministico. No hay escritura automatica en esta etapa."
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
            <h3>Reglas de publicacion segura</h3>
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
          title="Once dominios metodologicos cubren la base v2.1"
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
          title="Catalogo de reglas activas"
          description="Se listan severidad, evidencia requerida y superficie de uso para reutilizar el mismo criterio en Advisor, scoring, PDF y admin."
        />
        <div className="assessment-table-wrap methodology-table-wrap">
          <table className="assessment-table methodology-table">
            <thead>
              <tr>
                <th>Codigo</th>
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
          title="Preview de contexto y preparacion de chunks"
          description="La busqueda es local y deterministica. Esto deja listo el terreno para embeddings o retrieval posterior sin exponer prompts reales."
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
            <h3>Ejemplo de validacion de claims</h3>
            <p className="assessment-inline-note">
              Afirmacion de ejemplo: "La migracion esta garantizada sin downtime. RVTools confirma el backup restore y
              el target esta listo para migrar."
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
          title="Edicion auditable y workflow de revision"
          description="La escritura queda protegida por admin auth, auditoria y changelog persistido. Nada impacta Advisor, scoring ni PDF automaticamente."
        />
        <div className="methodology-persistence-grid">
          <article className="glass-card report-history-card methodology-note-panel">
            <h3>Crear nota</h3>
            <p className="assessment-inline-note">
              Cada nota nueva se guarda en MethodologyAdminNote y genera un audit event.
            </p>
            <form action={createMethodologyAdminNoteAction} className="methodology-note-form">
              <label className="form-label">
                Version label
                <input className="form-input" name="versionLabel" defaultValue={snapshot.version.versionLabel} />
              </label>
              <label className="form-label">
                Titulo
                <input className="form-input" name="title" required placeholder="Ej: Revisar regla de backup restore" />
              </label>
              <label className="form-label">
                Contenido
                <textarea
                  className="form-input assessment-textarea"
                  name="content"
                  required
                  placeholder="Contexto, riesgo, decision o evidencia pendiente."
                />
              </label>
              <div className="methodology-form-grid">
                <label className="form-label">
                  Domain key
                  <input className="form-input" name="domainKey" placeholder="vmware" />
                </label>
                <label className="form-label">
                  Topic key
                  <input className="form-input" name="topicKey" placeholder="backup_restore" />
                </label>
                <label className="form-label">
                  Rule code
                  <input className="form-input" name="ruleCode" placeholder="SE-VMW-BKP-001" />
                </label>
                <label className="form-label">
                  Prioridad
                  <select className="form-input" name="priority" defaultValue="normal">
                    {METHODOLOGY_NOTE_PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priorityLabel(priority)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button type="submit" className="btn btn-secondary">
                Guardar nota
              </button>
            </form>
          </article>

          <article className="glass-card report-history-card methodology-note-panel">
            <div className="report-history-header">
              <div>
                <h3>Notas persistidas</h3>
                <p className="assessment-inline-note">Vista auditable con estados y prioridad.</p>
              </div>
              <span className="assessment-chip assessment-chip-neutral">{formatCount(persistedData.notes.length)}</span>
            </div>
            <div className="methodology-notes-list">
              {persistedData.notes.length > 0 ? (
                persistedData.notes.map((note) => {
                  const association = getMethodologyNoteAssociationLabel(note);
                  const ruleAssociation = getMethodologyRuleAssociation(note.ruleCode);

                  return (
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
                      <div className="methodology-inline-tags">
                        <span className="assessment-chip assessment-chip-neutral">{priorityLabel(note.priority)}</span>
                        {note.versionLabel ? (
                          <span className="assessment-chip assessment-chip-neutral">{note.versionLabel}</span>
                        ) : null}
                        {note.ruleCode ? (
                          <span className="assessment-chip assessment-chip-neutral">{ruleAssociation.label}</span>
                        ) : null}
                      </div>
                      <div className="report-history-meta">
                        <span>{association}</span>
                        <span>Created: {formatDate(note.createdAt)}</span>
                        <span>Updated: {formatDate(note.updatedAt)}</span>
                      </div>
                      <div className="assessment-inline-actions methodology-note-actions">
                        <form action={updateMethodologyAdminNoteStatusAction}>
                          <input type="hidden" name="noteId" value={note.id} />
                          <input type="hidden" name="status" value="incorporated" />
                          <button type="submit" className="btn btn-secondary btn-small">
                            Incorporar
                          </button>
                        </form>
                        <form action={updateMethodologyAdminNoteStatusAction}>
                          <input type="hidden" name="noteId" value={note.id} />
                          <input type="hidden" name="status" value="dismissed" />
                          <button type="submit" className="btn btn-secondary btn-small">
                            Descartar
                          </button>
                        </form>
                        <form action={archiveMethodologyAdminNoteAction}>
                          <input type="hidden" name="noteId" value={note.id} />
                          <button type="submit" className="btn btn-secondary btn-small">
                            Archivar
                          </button>
                        </form>
                        <form action={createReviewItemFromNoteAction}>
                          <input type="hidden" name="noteId" value={note.id} />
                          <button type="submit" className="btn btn-secondary btn-small">
                            Enviar a revision
                          </button>
                        </form>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="dashboard-banner dashboard-banner-warning" role="status">
                  No hay notas persistidas todavia.
                </div>
              )}
            </div>
          </article>

          <article className="glass-card report-history-card methodology-note-panel">
            <div className="report-history-header">
              <div>
                <h3>Seed de referencia</h3>
                <p className="assessment-inline-note">La base read-only sigue visible para comparar el estado nuevo con el seed v2.1.</p>
              </div>
              <span className="assessment-chip assessment-chip-neutral">{formatCount(snapshot.openNoteCount)}</span>
            </div>
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
                  <div className="methodology-inline-tags">
                    <span className="assessment-chip assessment-chip-neutral">{priorityLabel(note.priority)}</span>
                    <span className="assessment-chip assessment-chip-neutral">Version: {note.versionId}</span>
                    {note.domainId ? <span className="assessment-chip assessment-chip-neutral">Domain: {note.domainId}</span> : null}
                    {note.topicId ? <span className="assessment-chip assessment-chip-neutral">Topic: {note.topicId}</span> : null}
                  </div>
                  <div className="report-history-meta">
                    <span>Created: {formatDate(note.createdAt)}</span>
                    <span>Updated: {formatDate(note.updatedAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section id="revision" className="assessment-section glass-card methodology-panel">
        <SectionTitle
          id="methodology-revision"
          icon={<ClipboardList size={18} />}
          label="Revision"
          title="Items de revision metodologica"
          description="Las notas enviadas a revision quedan separadas del seed, con estados aprobados, rechazados, implementados o archivados."
        />
        <div className="methodology-review-grid">
          <article className="glass-card report-history-card methodology-review-panel">
            <div className="report-history-header">
              <div>
                <h3>Workflow de revision</h3>
                <p className="assessment-inline-note">Cada item guarda estado, decisionReason y timestamp de decision.</p>
              </div>
              <span className="assessment-chip assessment-chip-neutral">{formatCount(persistedData.reviewItems.length)}</span>
            </div>
            <div className="methodology-notes-list">
              {persistedData.reviewItems.length > 0 ? (
                persistedData.reviewItems.map((review) => {
                  const sourceNote = persistedData.notes.find((note) => note.id === review.sourceNoteId) ?? null;

                  return (
                    <article key={review.id} className="methodology-mini-note">
                      <div className="report-history-header">
                        <div>
                          <h4>{review.title}</h4>
                          <p className="assessment-inline-note">{review.description}</p>
                        </div>
                        <span className={`assessment-chip assessment-chip-${toneForStatus(review.status)}`}>
                          {statusLabel(review.status)}
                        </span>
                      </div>
                      <div className="methodology-inline-tags">
                        <span className="assessment-chip assessment-chip-neutral">{reviewTypeLabel(review.itemType)}</span>
                        <span className="assessment-chip assessment-chip-neutral">{priorityLabel(review.priority)}</span>
                        {review.itemKey ? <span className="assessment-chip assessment-chip-neutral">{review.itemKey}</span> : null}
                        {sourceNote ? <span className="assessment-chip assessment-chip-neutral">{sourceNote.title}</span> : null}
                      </div>
                      <div className="report-history-meta">
                        <span>Version: {review.versionLabel}</span>
                        <span>Created: {formatDate(review.createdAt)}</span>
                        <span>Updated: {formatDate(review.updatedAt)}</span>
                      </div>
                      {review.rationale ? <p className="assessment-inline-note">{review.rationale}</p> : null}
                      {review.decisionReason ? (
                        <p className="assessment-inline-note">Decision: {review.decisionReason}</p>
                      ) : null}
                      <form action={updateMethodologyReviewStatusAction} className="methodology-review-form">
                        <input type="hidden" name="reviewId" value={review.id} />
                        <label className="form-label">
                          Estado
                          <select className="form-input" name="status" defaultValue={review.status}>
                            {METHODOLOGY_REVIEW_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {statusLabel(status)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="form-label">
                          Decision reason
                          <input
                            className="form-input"
                            name="decisionReason"
                            defaultValue={review.decisionReason ?? ""}
                            placeholder="Contexto de aprobacion, rechazo o implementacion"
                          />
                        </label>
                        <button type="submit" className="btn btn-secondary">
                          Guardar decision
                        </button>
                      </form>
                    </article>
                  );
                })
              ) : (
                <div className="dashboard-banner dashboard-banner-warning" role="status">
                  No hay items de revision persistidos todavia.
                </div>
              )}
            </div>
          </article>

          <article className="glass-card report-history-card methodology-review-panel">
            <h3>Estados disponibles</h3>
            <div className="methodology-bullet-list">
              {METHODOLOGY_REVIEW_STATUSES.map((status) => (
                <div key={status} className="methodology-bullet">
                  <CheckCircle2 size={16} />
                  <span>{statusLabel(status)}</span>
                </div>
              ))}
            </div>
            <h3 className="methodology-review-subtitle">Source note summary</h3>
            <div className="methodology-bullet-list">
              {persistedData.notes.slice(0, 4).map((note) => (
                <div key={note.id} className="methodology-bullet">
                  <CheckCircle2 size={16} />
                  <span>{getMethodologyNoteAssociationLabel(note)}</span>
                </div>
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
          title="Historial de cambios del seed"
          description="Este bloque sigue mostrando la base read-only para comparar contra el registro auditable persistido."
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

      <section id="changelog-persistido" className="assessment-section glass-card methodology-panel">
        <SectionTitle
          id="methodology-changelog-persistido"
          icon={<ClipboardList size={18} />}
          label="Changelog persistido"
          title="Registro auditable persistido"
          description="Cada alta, cambio de estado o item de revision queda registrado en la tabla MethodologyChangeLog."
        />
        <div className="methodology-changelog-list">
          {persistedData.changeLog.length > 0 ? (
            persistedData.changeLog.map((entry) => (
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
                  <span>Entity ID: {entry.entityId ?? "No disponible"}</span>
                  <span>Key: {entry.entityKey ?? "No disponible"}</span>
                  <span>By: {entry.createdBy ?? "system"}</span>
                  <span>When: {formatDate(entry.createdAt)}</span>
                </div>
              </article>
            ))
          ) : (
            <div className="dashboard-banner dashboard-banner-warning" role="status">
              No hay entradas persistidas todavia.
            </div>
          )}
        </div>
      </section>

      <section id="roadmap" className="assessment-section glass-card methodology-panel">
        <SectionTitle
          id="methodology-roadmap"
          icon={<AlertTriangle size={18} />}
          label="Proximas mejoras"
          title="Camino seguro para METHODOLOGY-2"
          description="La idea es sumar escritura auditable, persistencia y embeddings, pero solo despues de que la base quede bien verificada."
        />
        <div className="methodology-roadmap-grid">
          {snapshot.featureNotes.map((note) => (
            <article key={note} className="glass-card report-history-card methodology-roadmap-card">
              <p>{note}</p>
            </article>
          ))}
        </div>
        <div className="dashboard-banner dashboard-banner-warning methodology-roadmap-banner" role="alert">
          <strong>Scope intentionally limited.</strong> Esta consola no toca produccion, pagos, Wise, DNS, Vercel
          cutover ni datos reales. El siguiente paso es persistencia segura, no cambios de arquitectura de riesgo.
        </div>
      </section>
    </main>
  );
}
