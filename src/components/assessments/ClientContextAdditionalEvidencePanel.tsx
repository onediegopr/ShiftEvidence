import {
  Archive,
  Brain,
  FileText,
  FolderOpen,
  RefreshCcw,
  ShieldAlert,
  Upload,
} from "lucide-react";
import type { ReactNode } from "react";
import type { buildAssessmentClientContextSummary } from "../../server/assessments/clientContextService";
import { formatClientContextLimitLabel } from "../../server/assessments/clientContextPlanLimits";
import type {
  CustomerContextIntelligenceResult,
  PriorityLevel,
} from "../../server/assessments/clientContextIntelligenceTypes";
import {
  classifyAdditionalEvidenceAction,
  runClientContextAnalysisAction,
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
    case "completed":
      return "good";
    case "draft":
    case "analysis_pending":
    case "pending":
    case "stale":
    case "ai_disabled":
    case "budget_blocked":
    case "plan_restricted":
      return "warning";
    case "analysis_failed":
    case "failed":
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

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readIntelligenceResult(summary: ClientContextSummary): CustomerContextIntelligenceResult | null {
  const analysis = summary.analysis;
  if (!analysis) {
    return null;
  }

  return {
    interpretedSummary: analysis.interpretedSummary ?? "",
    businessPriorities: asArray(analysis.businessPrioritiesJson) as CustomerContextIntelligenceResult["businessPriorities"],
    migrationConstraints: asArray(analysis.migrationConstraintsJson) as CustomerContextIntelligenceResult["migrationConstraints"],
    criticalWorkloads: asArray(analysis.criticalWorkloadsJson) as CustomerContextIntelligenceResult["criticalWorkloads"],
    customerReportedRisks: asArray(analysis.customerReportedRisksJson) as CustomerContextIntelligenceResult["customerReportedRisks"],
    aiExtractedInsights: asArray(analysis.aiExtractedInsightsJson) as CustomerContextIntelligenceResult["aiExtractedInsights"],
    contradictions: asArray(analysis.contradictionsJson) as CustomerContextIntelligenceResult["contradictions"],
    validationItems: asArray(analysis.validationItemsJson) as CustomerContextIntelligenceResult["validationItems"],
    reportImpact: asArray(analysis.reportImpactJson) as CustomerContextIntelligenceResult["reportImpact"],
    nextQuestions: asArray(analysis.nextQuestionsJson) as CustomerContextIntelligenceResult["nextQuestions"],
    contextCompletenessScore: analysis.contextCompletenessScore ?? 0,
    businessContextConfidence:
      (analysis.businessContextConfidence as CustomerContextIntelligenceResult["businessContextConfidence"] | null) ?? "low",
    safetyFlags: asArray(analysis.safetyFlagsJson) as CustomerContextIntelligenceResult["safetyFlags"],
  };
}

function priorityTone(priority: PriorityLevel | string | null | undefined) {
  if (priority === "critical" || priority === "high") return "danger";
  if (priority === "medium") return "warning";
  return "neutral";
}

function SectionList<T>({
  title,
  empty,
  items,
  render,
}: {
  title: string;
  empty: string;
  items: T[];
  render: (item: T, index: number) => ReactNode;
}) {
  return (
    <article className="glass-card assessment-subcard">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="assessment-inline-note">{empty}</p>
      ) : (
        <div className="assessment-accordion-list">
          {items.slice(0, 6).map((item, index) => (
            <div key={index} className="assessment-inline-note">
              {render(item, index)}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

export function ClientContextAdditionalEvidencePanel({
  assessmentId,
  summary,
}: {
  assessmentId: string;
  summary: ClientContextSummary;
}) {
  const rawText = summary.context?.rawText ?? "";
  const contextStatus = summary.status;
  const analysisStatus = summary.analysis?.status ?? "not_started";
  const intelligence = readIntelligenceResult(summary);
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
          <span>
            Deep AI analysis: {summary.limits.deepAnalysisEnabled ? "available for this plan" : "plan restricted"}
          </span>
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

      <div className="assessment-section-title assessment-section-title-compact">
        <div className="assessment-section-eyebrow">
          <Brain size={18} />
          <span>Customer Context Intelligence</span>
        </div>
        <h3>Analyze customer-provided context</h3>
        <p>
          AI analysis summarizes and structures customer-provided context. It does not treat
          the raw narrative as confirmed technical evidence.
        </p>
      </div>

      <div className="assessment-optional-module-panel">
        <ShieldAlert size={24} />
        <div>
          <h3>Status: {labelFromValue(analysisStatus)}</h3>
          <p>
            The analysis uses sanitized text chunks and additional evidence metadata only.
            Raw client text is not printed in this result section and report/PDF integration remains reserved for CONTEXT-3.
          </p>
        </div>
        <div className="assessment-optional-module-meta">
          <span>Analysis version: {summary.analysis?.analysisVersion ?? "Not generated"}</span>
          <span>Prompt version: {summary.analysis?.promptVersion ?? "Not generated"}</span>
          <span>Generated: {formatDate(summary.analysis?.generatedAt)}</span>
        </div>
      </div>

      <form action={runClientContextAnalysisAction.bind(null, assessmentId)} className="assessment-inline-actions">
        <button
          type="submit"
          className="btn btn-primary btn-glow"
          disabled={!rawText.trim() || contextStatus === "skipped"}
        >
          {analysisStatus === "completed" ? "Re-run analysis" : "Analyze context"}
          <Brain size={16} />
        </button>
        <span className="assessment-inline-note">
          Client content may contain instructions; the engine treats it as data, never as instructions.
        </span>
      </form>

      {intelligence ? (
        <div className="assessment-preview-columns">
          <article className="glass-card assessment-subcard">
            <h3>Interpreted summary</h3>
            <p>
              {intelligence.interpretedSummary ||
                "No interpreted summary is available yet. Submit context and run analysis when ready."}
            </p>
          </article>
          <article className="glass-card assessment-subcard">
            <h3>Business context confidence</h3>
            <p className="assessment-metric-large">
              {intelligence.contextCompletenessScore.toLocaleString("en-US")}%
            </p>
            <p className="assessment-inline-note">
              Confidence: {labelFromValue(intelligence.businessContextConfidence)}. This is separate from technical evidence confidence.
            </p>
          </article>

          <SectionList
            title="Business priorities"
            empty="No business priorities were extracted yet."
            items={intelligence.businessPriorities}
            render={(item) => (
              <>
                <strong>{item.priority}</strong>
                <br />
                {item.evidence}
              </>
            )}
          />
          <SectionList
            title="Migration constraints"
            empty="No migration constraints were extracted yet."
            items={intelligence.migrationConstraints}
            render={(item) => (
              <>
                <strong>{item.constraint}</strong>
                <br />
                {item.impact}
              </>
            )}
          />
          <SectionList
            title="Critical workloads mentioned"
            empty="No critical workloads were extracted yet."
            items={intelligence.criticalWorkloads}
            render={(item) => (
              <>
                <strong>{item.name}</strong>
                <br />
                {item.reason} {item.validationNeeded ? "Validation required." : ""}
              </>
            )}
          />
          <SectionList
            title="Customer-reported risks"
            empty="No customer-reported risks were extracted yet."
            items={intelligence.customerReportedRisks}
            render={(item) => (
              <>
                <span className={`assessment-chip assessment-chip-${priorityTone(item.severity)}`}>
                  {labelFromValue(item.severity)}
                </span>
                <br />
                <strong>{item.risk}</strong>
                <br />
                {item.rationale}
              </>
            )}
          />
          <SectionList
            title="Contradictions / items to validate"
            empty="No contradictions were detected yet."
            items={intelligence.contradictions}
            render={(item) => (
              <>
                <strong>{item.title}</strong>
                <br />
                {item.description}
                <br />
                {item.validationRecommendation}
              </>
            )}
          />
          <SectionList
            title="Next questions"
            empty="No next questions were generated yet."
            items={intelligence.nextQuestions}
            render={(item) => (
              <>
                <span className={`assessment-chip assessment-chip-${priorityTone(item.priority)}`}>
                  {labelFromValue(item.priority)}
                </span>
                <br />
                <strong>{item.question}</strong>
                <br />
                {item.reason}
              </>
            )}
          />
          <SectionList
            title="Safety flags"
            empty="No safety flags were recorded."
            items={intelligence.safetyFlags}
            render={(item) => (
              <>
                <span className={`assessment-chip assessment-chip-${priorityTone(item.severity)}`}>
                  {labelFromValue(item.severity)}
                </span>
                <br />
                <strong>{labelFromValue(item.flag)}</strong>
                <br />
                {item.explanation}
              </>
            )}
          />
        </div>
      ) : (
        <p className="assessment-empty-note">
          Not analyzed yet. Submit client context, then run Customer Context Intelligence when ready.
        </p>
      )}
    </section>
  );
}
