import {
  Archive,
  FileText,
  FolderOpen,
  RefreshCcw,
  ShieldAlert,
  Upload,
} from "lucide-react";
import type { buildAssessmentClientContextSummary } from "../../server/assessments/clientContextService";
import { formatClientContextLimitLabel } from "../../server/assessments/clientContextPlanLimits";
import {
  classifyAdditionalEvidenceAction,
  saveClientContextDraftAction,
  setAdditionalEvidenceIncludedAction,
  skipClientContextAction,
  submitClientContextAction,
  uploadAdditionalEvidenceAction,
} from "../../app/dashboard/assessments/[id]/client-context/actions";

type ClientContextSummary = Awaited<ReturnType<typeof buildAssessmentClientContextSummary>>;

function labelFromValue(value: string | null | undefined) {
  if (!value) return "Not provided";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Not provided";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatBytes(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "Unknown size";
  if (value < 1024) return `${value} B`;
  const kib = value / 1024;
  if (kib < 1024) return `${kib.toFixed(1)} KiB`;
  const mib = kib / 1024;
  if (mib < 1024) return `${mib.toFixed(1)} MiB`;
  return `${(mib / 1024).toFixed(1)} GiB`;
}

function statusTone(status: string | null | undefined) {
  switch (status) {
    case "submitted":
    case "ready_for_analysis":
    case "analyzed":
      return "good";
    case "draft":
    case "analysis_pending":
      return "warning";
    case "analysis_failed":
      return "danger";
    default:
      return "neutral";
  }
}

const classificationOptions = [
  ["business_context", "Business context"],
  ["technical_evidence", "Technical evidence"],
  ["financial_evidence", "Financial evidence"],
  ["architecture_diagram", "Architecture diagram"],
  ["contract_renewal_evidence", "Contract / renewal evidence"],
  ["unknown_needs_review", "Unknown / needs review"],
] as const;

export function ClientContextAdditionalEvidencePanel({
  assessmentId,
  summary,
}: {
  assessmentId: string;
  summary: ClientContextSummary;
}) {
  const rawText = summary.context?.rawText ?? "";
  const contextStatus = summary.status;
  const limitPercent =
    summary.limits.maxWords > 0
      ? Math.min(100, Math.round((summary.wordCount / summary.limits.maxWords) * 100))
      : 0;
  const nearLimit = limitPercent >= 80;
  const additionalEvidence = summary.additionalEvidence.filter(
    (item) => item.evidenceFile.deletedAt === null && item.evidenceFile.processingStatus !== "deleted",
  );

  return (
    <section id="client-context-additional-evidence" className="assessment-section glass-card">
      <div className="assessment-section-title">
        <div className="assessment-section-eyebrow">
          <FolderOpen size={18} />
          <span>Optional module</span>
        </div>
        <h2>Client Context & Additional Evidence</h2>
        <p>
          Add business, technical or migration context that does not fit into structured questions.
          This is treated as customer-provided context, not confirmed technical evidence.
        </p>
      </div>

      <div className="assessment-status-row">
        <span className={`assessment-chip assessment-chip-${statusTone(contextStatus)}`}>
          {labelFromValue(contextStatus)}
        </span>
        <span className="assessment-chip assessment-chip-neutral">Optional</span>
        <span className="assessment-chip assessment-chip-warning">Does not block report generation</span>
        <span className="assessment-chip assessment-chip-neutral">
          {summary.wordCount.toLocaleString("en-US")} / {summary.limits.maxWords.toLocaleString("en-US")} words
        </span>
        <span className="assessment-chip assessment-chip-neutral">
          {summary.activeFiles} / {summary.limits.maxFiles} files
        </span>
      </div>

      <div className="assessment-optional-module-panel">
        <div>
          <h3>Context is advisory until validated.</h3>
          <p>
            Raw text is stored for this assessment, but it is not printed directly in reports or PDFs.
            A future Customer Context Intelligence engine will convert it into a structured summary,
            priorities, risks, contradictions and next questions.
          </p>
        </div>
        <div className="assessment-optional-module-meta">
          <span>{formatClientContextLimitLabel(summary.limits)}</span>
          <span>Deep AI analysis: coming next</span>
          <span>Last edited: {formatDate(summary.context?.lastEditedAt)}</span>
        </div>
      </div>

      <form
        action={saveClientContextDraftAction.bind(null, assessmentId)}
        className="assessment-form-grid assessment-form-grid-wide"
      >
        <label className="form-label assessment-form-span-2">
          Free-text context
          <textarea
            name="rawText"
            className="form-input assessment-textarea"
            maxLength={summary.limits.maxCharacters}
            defaultValue={rawText}
            placeholder="Describe anything else we should know about your migration: business priorities, risks, deadlines, renewal pressure, critical workloads, internal constraints, unknowns or concerns."
            rows={12}
          />
        </label>

        <div className="assessment-form-span-2 assessment-preview-columns">
          <article className="glass-card assessment-subcard">
            <h3>Plan limit</h3>
            <p>
              {summary.wordCount.toLocaleString("en-US")} words and{" "}
              {summary.characterCount.toLocaleString("en-US")} characters saved.
            </p>
            <p className={nearLimit ? "assessment-inline-note text-warning" : "assessment-inline-note"}>
              {limitPercent}% of the current word limit used. If you need longer context or more files,
              use a higher report plan.
            </p>
          </article>
          <article className="glass-card assessment-subcard">
            <h3>Safety note</h3>
            <p>
              Do not paste passwords, secrets or credentials. Customer-provided context is advisory
              and may require validation against RVTools inventory, pricing evidence and technical files.
            </p>
          </article>
        </div>

        <div className="assessment-inline-actions assessment-form-span-2">
          <button type="submit" className="btn btn-secondary">
            Save draft
            <RefreshCcw size={16} />
          </button>
          <button
            type="submit"
            formAction={submitClientContextAction.bind(null, assessmentId)}
            className="btn btn-primary btn-glow"
          >
            Submit context
            <FileText size={16} />
          </button>
        </div>
      </form>

      <form action={skipClientContextAction.bind(null, assessmentId)} className="assessment-inline-actions">
        <button type="submit" className="btn btn-secondary">
          Skip client context for now
          <Archive size={16} />
        </button>
        <span className="assessment-inline-note">
          Skipping this module does not change technical evidence confidence or report eligibility.
        </span>
      </form>

      <div className="assessment-section-title assessment-section-title-compact">
        <div className="assessment-section-eyebrow">
          <Upload size={18} />
          <span>Additional Evidence</span>
        </div>
        <h3>Attach supporting context files</h3>
        <p>
          Files are received and classified only. PDF/DOCX/images are not deeply parsed in CONTEXT-1.
        </p>
      </div>

      <form
        action={uploadAdditionalEvidenceAction.bind(null, assessmentId)}
        className="assessment-form-grid assessment-form-grid-wide"
        encType="multipart/form-data"
      >
        <input type="hidden" name="purpose" value="client_context" />
        <label className="form-label">
          Classification
          <select name="classification" className="form-input" defaultValue="unknown_needs_review">
            {classificationOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Upload file
          <input
            name="file"
            className="form-input"
            type="file"
            accept=".txt,.csv,.xlsx,.xls,.pdf,.docx,.png,.jpg,.jpeg"
          />
        </label>
        <div className="assessment-inline-actions assessment-form-span-2">
          <button type="submit" className="btn btn-primary btn-glow" disabled={summary.remainingFiles <= 0}>
            Upload additional evidence
            <Upload size={16} />
          </button>
          <span className="assessment-inline-note">
            Remaining file slots: {summary.remainingFiles}. Files are stored as evidence and marked
            received, not analyzed.
          </span>
        </div>
      </form>

      {additionalEvidence.length === 0 ? (
        <p className="assessment-empty-note">
          Optional, but useful: add internal notes, migration concerns, business deadlines,
          diagrams, renewal documents or application context that RVTools cannot show.
        </p>
      ) : (
        <div className="assessment-accordion-list">
          {additionalEvidence.map((item) => (
            <article key={item.id} className="glass-card assessment-subcard">
              <div className="assessment-inventory-table-head">
                <div>
                  <h3>{item.evidenceFile.originalFilename}</h3>
                  <p className="assessment-inline-note">
                    {formatBytes(item.evidenceFile.sizeBytes)} · {labelFromValue(item.analysisStatus)}
                  </p>
                </div>
                <span className={`assessment-chip assessment-chip-${item.includedInContextAnalysis ? "good" : "neutral"}`}>
                  {item.includedInContextAnalysis ? "Included" : "Excluded"}
                </span>
              </div>

              <form
                action={classifyAdditionalEvidenceAction.bind(
                  null,
                  assessmentId,
                  item.evidenceFileId,
                )}
                className="assessment-form-grid"
              >
                <input type="hidden" name="purpose" value={item.purpose} />
                <label className="form-label">
                  Classification
                  <select name="classification" className="form-input" defaultValue={item.classification}>
                    {classificationOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="assessment-inline-actions">
                  <button type="submit" className="btn btn-secondary">
                    Update classification
                    <RefreshCcw size={16} />
                  </button>
                </div>
              </form>

              <form
                action={setAdditionalEvidenceIncludedAction.bind(
                  null,
                  assessmentId,
                  item.id,
                  !item.includedInContextAnalysis,
                )}
                className="assessment-inline-actions"
              >
                <button type="submit" className="btn btn-secondary">
                  {item.includedInContextAnalysis ? "Exclude from future analysis" : "Include in future analysis"}
                </button>
                <span className="assessment-inline-note">
                  Classification: {labelFromValue(item.classification)}
                </span>
              </form>
            </article>
          ))}
        </div>
      )}

      <div className="assessment-optional-module-panel">
        <ShieldAlert size={24} />
        <div>
          <h3>Customer Context Intelligence is not running yet.</h3>
          <p>
            Deep AI analysis, chunking, prompt-injection hardening, contradictions and next
            questions are reserved for CONTEXT-2. Report and PDF integration are reserved for CONTEXT-3.
          </p>
        </div>
      </div>
    </section>
  );
}
