"use client";

import { useState } from "react";
import {
  Archive,
  Database,
  FileText,
  HardDrive,
  RefreshCcw,
  ShieldAlert,
  Upload,
} from "lucide-react";
import type { buildAssessmentStorageDestinationReadinessSummary } from "../../server/assessments/storageDestinationReadinessService";
import { formatStorageReadinessLimitLabel } from "../../server/assessments/storageReadinessPlanLimits";
import {
  saveStorageContextDraftAction,
  saveStorageReadinessDraftAction,
  skipStorageReadinessAction,
  submitStorageContextAction,
  submitStorageReadinessAction,
  uploadStorageEvidenceAction,
  classifyStorageEvidenceAction,
  setStorageEvidenceIncludedAction,
} from "../../app/dashboard/assessments/[id]/storage/actions";

type StorageDestinationReadinessSummary = Awaited<
  ReturnType<typeof buildAssessmentStorageDestinationReadinessSummary>
>;

const currentStorageOptions = [
  ["", "Select current storage"],
  ["vmfs", "VMFS"],
  ["vsan", "vSAN"],
  ["nfs", "NFS"],
  ["san", "SAN"],
  ["local_datastore", "Local datastore"],
  ["mixed", "Mixed"],
  ["unknown", "Unknown"],
] as const;

const targetPreferenceOptions = [
  ["", "Select target preference"],
  ["not_decided", "Not decided"],
  ["zfs_local", "ZFS local"],
  ["nfs", "Existing NFS"],
  ["san", "Existing SAN"],
  ["ceph", "Ceph"],
  ["pbs", "PBS / backup-led pattern"],
  ["unknown", "Unknown"],
] as const;

const downtimeToleranceOptions = [
  ["", "Select downtime tolerance"],
  ["unknown", "Unknown"],
  ["none", "No planned downtime"],
  ["minutes", "Minutes"],
  ["hours", "Hours"],
  ["weekend_window", "Weekend window"],
  ["flexible", "Flexible"],
] as const;

const yesNoUnknownOptions = [
  ["unknown", "Unknown"],
  ["true", "Yes"],
  ["false", "No"],
] as const;

const constraintOptions = [
  ["performance", "Performance"],
  ["capacity", "Capacity"],
  ["replication", "Replication"],
  ["backup", "Backup"],
  ["vendor_lock_in", "Vendor lock-in"],
  ["latency", "Latency"],
  ["operations", "Operations"],
  ["compliance", "Compliance"],
  ["growth", "Growth"],
  ["unknown", "Unknown"],
] as const;

const classificationOptions = [
  ["source_storage_export", "Source storage export"],
  ["target_storage_design", "Target storage design"],
  ["hardware_bom", "Hardware BOM"],
  ["network_diagram", "Network diagram"],
  ["ceph_status", "Ceph status"],
  ["ceph_osd_tree", "Ceph OSD tree"],
  ["ceph_df", "Ceph DF"],
  ["pbs_backup_info", "PBS backup info"],
  ["vsan_summary", "vSAN summary"],
  ["san_nas_export", "SAN/NAS export"],
  ["architecture_diagram", "Architecture diagram"],
  ["quote_or_bill_of_materials", "Quote or bill of materials"],
  ["unknown_needs_review", "Unknown / needs review"],
] as const;

function labelFromValue(value: string | null | undefined) {
  if (!value) return "Not provided";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
      return "warning";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
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

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function booleanDefault(value: boolean | null | undefined) {
  if (value === true) return "true";
  if (value === false) return "false";
  return "unknown";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function StorageDestinationReadinessPanel({
  assessmentId,
  summary,
}: {
  assessmentId: string;
  summary: StorageDestinationReadinessSummary;
}) {
  const rawText = summary.context?.rawText ?? "";
  const [text, setText] = useState(rawText);
  const currentWordCount = countWords(text);
  const currentCharacterCount = text.length;
  const maxWords = summary.limits.maxStorageContextWords;
  const isWordLimitExceeded = maxWords > 0 && currentWordCount > maxWords;
  const limitPercent =
    maxWords > 0 ? Math.min(100, Math.round((currentWordCount / maxWords) * 100)) : 0;
  const nearLimit = limitPercent >= 80;
  const selectedConstraints = asStringArray(summary.readiness?.storageConstraintsJson);
  const storageEvidence = summary.storageEvidence.filter(
    (item) =>
      item.evidenceFile.deletedAt === null && item.evidenceFile.processingStatus !== "deleted",
  );

  return (
    <section id="storage-destination-readiness" className="assessment-section glass-card">
      <div className="assessment-section-title">
        <div className="assessment-section-eyebrow">
          <Database size={18} />
          <span>Optional module</span>
        </div>
        <h2>Storage Destination Readiness</h2>
        <p>
          Evaluate whether your target Proxmox storage should be ZFS, existing NFS/SAN,
          Ceph or another pattern based on evidence, constraints and missing validations.
        </p>
      </div>

      <div className="assessment-status-row">
        <span className={`assessment-chip assessment-chip-${statusTone(summary.status)}`}>
          {labelFromValue(summary.status)}
        </span>
        <span className="assessment-chip assessment-chip-neutral">Optional</span>
        <span className="assessment-chip assessment-chip-warning">Does not block report generation</span>
        <span className="assessment-chip assessment-chip-neutral">
          {summary.parsedDatastoreCount} datastore signal{summary.parsedDatastoreCount === 1 ? "" : "s"}
        </span>
        <span className="assessment-chip assessment-chip-neutral">
          {summary.activeFiles} / {summary.limits.maxStorageEvidenceFiles} files
        </span>
      </div>

      <div className="assessment-optional-module-panel">
        <HardDrive size={24} />
        <div>
          <h3>Storage is evaluated conservatively.</h3>
          <p>
            Customer-provided storage context is advisory until validated with technical evidence.
            Ceph interest is captured here, but Ceph suitability is not calculated in STORAGE-1.
          </p>
        </div>
        <div className="assessment-optional-module-meta">
          <span>{formatStorageReadinessLimitLabel(summary.limits)}</span>
          <span>
            Ceph deep dive: {summary.limits.cephDeepDiveEnabled ? "future Blueprint-ready" : "future plan restricted"}
          </span>
          <span>Last context edit: {formatDate(summary.context?.lastEditedAt)}</span>
        </div>
      </div>

      <form
        action={saveStorageReadinessDraftAction.bind(null, assessmentId)}
        className="assessment-form-grid assessment-form-grid-wide"
      >
        <label className="form-label">
          Current storage type
          <select
            name="currentStorageType"
            className="form-input"
            defaultValue={summary.readiness?.currentStorageType ?? ""}
          >
            {currentStorageOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Target storage preference
          <select
            name="targetStoragePreference"
            className="form-input"
            defaultValue={summary.readiness?.targetStoragePreference ?? ""}
          >
            {targetPreferenceOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Needs high availability?
          <select
            name="needsHighAvailability"
            className="form-input"
            defaultValue={booleanDefault(summary.readiness?.needsHighAvailability)}
          >
            {yesNoUnknownOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Requires shared storage?
          <select
            name="requiresSharedStorage"
            className="form-input"
            defaultValue={booleanDefault(summary.readiness?.requiresSharedStorage)}
          >
            {yesNoUnknownOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Has Proxmox target?
          <select
            name="hasProxmoxTarget"
            className="form-input"
            defaultValue={booleanDefault(summary.readiness?.hasProxmoxTarget)}
          >
            {yesNoUnknownOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Has PBS / backup target?
          <select
            name="hasPbs"
            className="form-input"
            defaultValue={booleanDefault(summary.readiness?.hasPbs)}
          >
            {yesNoUnknownOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Expected growth in 3 years (%)
          <input
            name="estimatedGrowthPercent3y"
            className="form-input"
            type="number"
            min="0"
            max="1000"
            step="1"
            defaultValue={summary.readiness?.estimatedGrowthPercent3y ?? ""}
          />
        </label>
        <label className="form-label">
          Downtime tolerance
          <select
            name="downtimeTolerance"
            className="form-input"
            defaultValue={summary.readiness?.downtimeTolerance ?? ""}
          >
            {downtimeToleranceOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="form-label assessment-form-span-2">
          Storage constraints
          <div className="assessment-checkbox-grid assessment-checkbox-grid-compact">
            {constraintOptions.map(([value, label]) => (
              <label key={value} className="assessment-checkbox-row">
                <input
                  type="checkbox"
                  name="storageConstraints"
                  value={value}
                  defaultChecked={selectedConstraints.includes(value)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="form-label assessment-form-span-2">
          Source storage notes
          <textarea
            name="sourceNotes"
            className="form-input assessment-textarea"
            defaultValue={summary.readiness?.sourceNotes ?? ""}
            rows={4}
            placeholder="Describe current datastore layout, vSAN/SAN/NAS dependencies, known bottlenecks, replication, vendor lock-in or source storage risks."
          />
        </label>
        <label className="form-label assessment-form-span-2">
          RPO / RTO and backup notes
          <textarea
            name="rpoRtoNotes"
            className="form-input assessment-textarea"
            defaultValue={summary.readiness?.rpoRtoNotes ?? ""}
            rows={4}
            placeholder="Describe recovery objectives, backup strategy, PBS expectations, retention, replication or restore constraints."
          />
        </label>

        <div className="assessment-section-title assessment-section-title-compact assessment-form-span-2">
          <div className="assessment-section-eyebrow">
            <ShieldAlert size={18} />
            <span>Ceph interest capture</span>
          </div>
          <h3>Ceph is captured as an input, not a recommendation.</h3>
          <p>
            Ceph will be evaluated as a suitability decision later. STORAGE-1 does not calculate
            whether Ceph applies, does not apply, is overkill or is underdesigned.
          </p>
        </div>

        <label className="form-label">
          At least 3 nodes?
          <select
            name="hasMinimumThreeNodes"
            className="form-input"
            defaultValue={booleanDefault(summary.readiness?.hasMinimumThreeNodes)}
          >
            {yesNoUnknownOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Dedicated storage network?
          <select
            name="hasDedicatedStorageNetwork"
            className="form-input"
            defaultValue={booleanDefault(summary.readiness?.hasDedicatedStorageNetwork)}
          >
            {yesNoUnknownOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Ceph experience?
          <select
            name="hasCephExperience"
            className="form-input"
            defaultValue={booleanDefault(summary.readiness?.hasCephExperience)}
          >
            {yesNoUnknownOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Vendor or partner support?
          <select
            name="hasVendorOrPartnerSupport"
            className="form-input"
            defaultValue={booleanDefault(summary.readiness?.hasVendorOrPartnerSupport)}
          >
            {yesNoUnknownOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="assessment-inline-actions assessment-form-span-2">
          <button type="submit" className="btn btn-secondary">
            Save storage draft
            <RefreshCcw size={16} />
          </button>
          <button
            type="submit"
            formAction={submitStorageReadinessAction.bind(null, assessmentId)}
            className="btn btn-primary btn-glow"
          >
            Submit storage inputs
            <FileText size={16} />
          </button>
        </div>
      </form>

      <form action={skipStorageReadinessAction.bind(null, assessmentId)} className="assessment-inline-actions">
        <button type="submit" className="btn btn-secondary">
          Skip storage readiness for now
          <Archive size={16} />
        </button>
        <span className="assessment-inline-note">
          Skipping storage readiness does not change report eligibility or technical evidence confidence.
        </span>
      </form>

      <div className="assessment-section-title assessment-section-title-compact">
        <div className="assessment-section-eyebrow">
          <FileText size={18} />
          <span>Storage Free Context</span>
        </div>
        <h3>Add storage-specific context</h3>
        <p>
          Raw storage context is stored for this assessment, but report/PDF output must use only
          structured interpretation in later milestones.
        </p>
      </div>

      <form
        action={saveStorageContextDraftAction.bind(null, assessmentId)}
        className="assessment-form-grid assessment-form-grid-wide"
      >
        <label className="form-label assessment-form-span-2">
          Storage context
          <textarea
            name="rawText"
            className="form-input assessment-textarea"
            maxLength={summary.limits.maxStorageContextCharacters}
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={10}
            placeholder="Describe source storage, target architecture, Ceph expectations, hardware, network, growth, backup strategy, downtime tolerance, operational skills or constraints."
          />
          {isWordLimitExceeded ? (
            <p className="assessment-inline-note" style={{ color: "#ef4444", fontWeight: "bold" }}>
              Plan word limit of {maxWords.toLocaleString("en-US")} words exceeded. Please shorten
              storage context before submitting.
            </p>
          ) : null}
        </label>

        <div className="assessment-form-span-2 assessment-preview-columns">
          <article className="glass-card assessment-subcard">
            <h3>Plan limit</h3>
            <p>
              {currentWordCount.toLocaleString("en-US")} words and{" "}
              {currentCharacterCount.toLocaleString("en-US")} characters.
            </p>
            <p className={nearLimit ? "assessment-inline-note text-warning" : "assessment-inline-note"}>
              {limitPercent}% of the current word limit used. Higher plans allow longer storage context
              and more classified storage evidence.
            </p>
          </article>
          <article className="glass-card assessment-subcard">
            <h3>Security note</h3>
            <p>
              Do not paste passwords, SSH keys, SAN credentials, IPAM secrets or support portal tokens.
              Customer-provided storage context is advisory until validated.
            </p>
          </article>
        </div>

        <div className="assessment-inline-actions assessment-form-span-2">
          <button type="submit" className="btn btn-secondary">
            Save context draft
            <RefreshCcw size={16} />
          </button>
          <button
            type="submit"
            formAction={submitStorageContextAction.bind(null, assessmentId)}
            className="btn btn-primary btn-glow"
            disabled={isWordLimitExceeded}
          >
            Submit storage context
            <FileText size={16} />
          </button>
        </div>
      </form>

      <div className="assessment-section-title assessment-section-title-compact">
        <div className="assessment-section-eyebrow">
          <Upload size={18} />
          <span>Storage Additional Evidence</span>
        </div>
        <h3>Attach storage-specific files</h3>
        <p>
          Files are stored and classified as metadata only. No OCR, PDF/DOCX extraction, Ceph CLI
          ingestion or binary processing is implemented in STORAGE-1.
        </p>
      </div>

      <form
        action={uploadStorageEvidenceAction.bind(null, assessmentId)}
        className="assessment-form-grid assessment-form-grid-wide"
        encType="multipart/form-data"
      >
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
        <label className="form-label assessment-form-span-2">
          Evidence notes
          <textarea
            name="notes"
            className="form-input assessment-textarea"
            rows={3}
            placeholder="Optional notes about what this file proves or why it matters for storage destination readiness."
          />
        </label>
        <div className="assessment-inline-actions assessment-form-span-2">
          <button type="submit" className="btn btn-primary btn-glow" disabled={summary.remainingFiles <= 0}>
            Upload storage evidence
            <Upload size={16} />
          </button>
          <span className="assessment-inline-note">
            Remaining file slots: {summary.remainingFiles}. Uploaded files are received, not analyzed.
          </span>
        </div>
      </form>

      {storageEvidence.length === 0 ? (
        <p className="assessment-empty-note">
          Useful evidence includes SAN/NAS exports, vSAN summaries, hardware BOMs, network diagrams,
          Ceph status outputs, Ceph OSD trees, Ceph DF output, PBS details and target designs.
        </p>
      ) : (
        <div className="assessment-accordion-list">
          {storageEvidence.map((item) => (
            <article key={item.id} className="glass-card assessment-subcard">
              <div className="assessment-inventory-table-head">
                <div>
                  <h3>{item.evidenceFile.originalFilename}</h3>
                  <p className="assessment-inline-note">
                    {formatBytes(item.evidenceFile.sizeBytes)} - {labelFromValue(item.analysisStatus)}
                  </p>
                </div>
                <span className={`assessment-chip assessment-chip-${item.includedInStorageAnalysis ? "good" : "neutral"}`}>
                  {item.includedInStorageAnalysis ? "Included" : "Excluded"}
                </span>
              </div>

              <form
                action={classifyStorageEvidenceAction.bind(
                  null,
                  assessmentId,
                  item.evidenceFileId,
                )}
                className="assessment-form-grid"
              >
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
                <label className="form-label">
                  Notes
                  <input
                    name="notes"
                    className="form-input"
                    type="text"
                    defaultValue={item.notes ?? ""}
                    placeholder="Optional evidence note"
                  />
                </label>
                <div className="assessment-inline-actions assessment-form-span-2">
                  <button type="submit" className="btn btn-secondary">
                    Update classification
                    <RefreshCcw size={16} />
                  </button>
                </div>
              </form>

              <form
                action={setStorageEvidenceIncludedAction.bind(
                  null,
                  assessmentId,
                  item.id,
                  !item.includedInStorageAnalysis,
                )}
                className="assessment-inline-actions"
              >
                <button type="submit" className="btn btn-secondary">
                  {item.includedInStorageAnalysis
                    ? "Exclude from future storage analysis"
                    : "Include in future storage analysis"}
                </button>
                <span className="assessment-inline-note">
                  Classification: {labelFromValue(item.classification)}
                </span>
              </form>
            </article>
          ))}
        </div>
      )}

      <div className="assessment-preview-columns">
        <article className="glass-card assessment-subcard">
          <h3>Missing storage evidence helper</h3>
          <ul className="assessment-bullet-list">
            {summary.missingEvidenceHints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="glass-card assessment-subcard">
          <h3>STORAGE-1 boundaries</h3>
          <p>
            This foundation captures storage inputs and metadata only. AI analysis, Ceph suitability,
            report/PDF rendering, collector ingestion and storage cost modeling remain future work.
          </p>
        </article>
      </div>
    </section>
  );
}
