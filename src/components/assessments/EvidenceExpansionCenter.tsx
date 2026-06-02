import { Download, FileText, Upload } from "lucide-react";
import { EvidenceModuleKey, EvidenceModuleStatus, EvidenceType } from "@prisma/client";
import type { EvidenceExpansionSummary } from "../../server/evidence/evidenceExpansionService";
import {
  skipEvidenceModuleAction,
  uploadEvidenceAction,
} from "../../app/dashboard/assessments/[id]/evidence/actions";

function statusLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusTone(status: EvidenceModuleStatus) {
  switch (status) {
    case EvidenceModuleStatus.parsed:
    case EvidenceModuleStatus.reviewed:
      return "good";
    case EvidenceModuleStatus.parsed_with_warnings:
    case EvidenceModuleStatus.uploaded:
    case EvidenceModuleStatus.queued:
    case EvidenceModuleStatus.parsing:
      return "warning";
    case EvidenceModuleStatus.failed:
      return "danger";
    default:
      return "neutral";
  }
}

function evidenceTypeForModule(moduleKey: EvidenceModuleKey) {
  switch (moduleKey) {
    case EvidenceModuleKey.proxmox_target:
      return EvidenceType.proxmox;
    case EvidenceModuleKey.backup_evidence:
      return EvidenceType.veeam;
    case EvidenceModuleKey.application_dependency:
      return EvidenceType.cmdb;
    case EvidenceModuleKey.storage_san:
      return EvidenceType.network;
    case EvidenceModuleKey.vmware_enrichment:
    case EvidenceModuleKey.migration_plan_readiness:
    default:
      return EvidenceType.other;
  }
}

function jsonStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function getVmwareSummary(value: unknown) {
  const summary = asRecord(value);
  const vmware = asRecord(summary?.vmwareEnrichmentSummary);
  if (!vmware) return null;

  const numberValue = (key: string) => {
    const value = vmware[key];
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  };

  return {
    vmCount: numberValue("vmCount"),
    matchedVmCount: numberValue("matchedVmCount"),
    unmatchedVmCount: numberValue("unmatchedVmCount"),
    oldSnapshotCount: numberValue("oldSnapshotCount"),
    taggedVmCount: numberValue("taggedVmCount"),
    resourcePoolCount: numberValue("resourcePoolCount"),
    drsRuleCount: numberValue("drsRuleCount"),
    networkBindingCount: numberValue("networkBindingCount"),
  };
}

function getProxmoxSummary(value: unknown) {
  const summary = asRecord(value);
  const proxmox = asRecord(summary?.proxmoxTargetSummary);
  const readiness = asRecord(summary?.readiness);
  if (!proxmox) return null;

  const numberValue = (key: string) => {
    const value = proxmox[key];
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  };

  const booleanValue = (key: string) => proxmox[key] === true;

  return {
    targetStatus: typeof readiness?.targetStatus === "string" ? readiness.targetStatus : "target_not_validated",
    confidence: typeof readiness?.confidence === "string" ? readiness.confidence : "low",
    recommendations: Array.isArray(readiness?.recommendations)
      ? readiness.recommendations.filter((item): item is string => typeof item === "string")
      : [],
    nodeCount: numberValue("nodeCount"),
    onlineNodeCount: numberValue("onlineNodeCount"),
    storageUsagePercent: numberValue("storageUsagePercent"),
    haConfigured: booleanValue("haConfigured"),
    pbsDetected: booleanValue("pbsDetected"),
    cephDetected: booleanValue("cephDetected"),
    cephHealth: typeof proxmox.cephHealth === "string" ? proxmox.cephHealth : "unknown",
    warningCount: jsonStringArray(summary?.warnings).length,
  };
}

function getBackupSummary(value: unknown) {
  const summary = asRecord(value);
  const backup = asRecord(summary?.backupEvidenceSummary);
  const readiness = asRecord(summary?.readiness);
  if (!backup) return null;

  const numberValue = (key: string) => {
    const value = backup[key];
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  };

  return {
    backupReadinessStatus:
      typeof readiness?.backupReadinessStatus === "string"
        ? readiness.backupReadinessStatus
        : "backup_not_validated",
    confidence: typeof readiness?.confidence === "string" ? readiness.confidence : "low",
    recommendations: Array.isArray(readiness?.recommendations)
      ? readiness.recommendations.filter((item): item is string => typeof item === "string")
      : [],
    jobCount: numberValue("jobCount"),
    protectedObjectCount: numberValue("protectedObjectCount"),
    matchedVmCount: numberValue("matchedVmCount"),
    unmatchedProtectedObjectCount: numberValue("unmatchedProtectedObjectCount"),
    unprotectedVmCount: numberValue("unprotectedVmCount"),
    staleBackupCount: numberValue("staleBackupCount"),
    failedJobCount: numberValue("failedJobCount"),
    repositoryPressureCount: numberValue("repositoryPressureCount"),
  };
}

function getStorageSanSummary(value: unknown) {
  const summary = asRecord(value);
  const storage = asRecord(summary?.storageSanSummary);
  const readiness = asRecord(summary?.readiness);
  if (!storage) return null;

  const numberValue = (key: string) => {
    const value = storage[key];
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  };

  const booleanValue = (key: string) => storage[key] === true;

  return {
    storageReadinessStatus:
      typeof readiness?.storageReadinessStatus === "string"
        ? readiness.storageReadinessStatus
        : "storage_not_validated",
    confidence: typeof readiness?.confidence === "string" ? readiness.confidence : "low",
    recommendations: Array.isArray(readiness?.recommendations)
      ? readiness.recommendations.filter((item): item is string => typeof item === "string")
      : [],
    arrayCount: numberValue("arrayCount"),
    poolCount: numberValue("poolCount"),
    volumeCount: numberValue("volumeCount"),
    lunCount: numberValue("lunCount"),
    datastoreMappingCount: numberValue("datastoreMappingCount"),
    highUsagePoolCount: numberValue("highUsagePoolCount"),
    criticalUsagePoolCount: numberValue("criticalUsagePoolCount"),
    performanceEvidencePresent: booleanValue("performanceEvidencePresent"),
    replicationEvidencePresent: booleanValue("replicationEvidencePresent"),
    targetStorageCandidateCount: numberValue("targetStorageCandidateCount"),
  };
}

export function EvidenceExpansionCenter({
  assessmentId,
  summary,
  uploadUnlocked,
  maxUploadSizeMb,
}: {
  assessmentId: string;
  summary: EvidenceExpansionSummary;
  uploadUnlocked: boolean;
  maxUploadSizeMb: number;
}) {
  return (
    <section id="evidence-expansion-center" className="assessment-section glass-card">
      <div className="assessment-section-title">
        <div className="assessment-section-eyebrow">
          <FileText size={18} />
          <span>Optional evidence</span>
        </div>
        <h2>Evidence Expansion Center</h2>
        <p>
          Optional evidence modules can improve report precision and reduce assumptions. You can continue
          with the base assessment using RVTools, or provide additional evidence to unlock stronger future
          recommendations.
        </p>
      </div>

      <div className="assessment-status-row">
        <span className="assessment-chip assessment-chip-neutral">
          Overall advanced evidence: {summary.overallEvidenceConfidence}
        </span>
        <span className="assessment-chip assessment-chip-neutral">
          Completion: {summary.completionPercent}%
        </span>
        <span className="assessment-chip assessment-chip-neutral">
          Optional modules: {summary.modules.length}
        </span>
      </div>

      <div className="assessment-summary-mini-grid" style={{ marginTop: "1rem" }}>
        {summary.modules.map((module) => {
          const status = module.record.status;
          const warnings = jsonStringArray(module.record.lastParseResult?.warningsJson);
          const errors = jsonStringArray(module.record.lastParseResult?.errorsJson);
          const evidenceType = evidenceTypeForModule(module.metadata.key);
          const isVmwareEnrichment = module.metadata.key === EvidenceModuleKey.vmware_enrichment;
          const isProxmoxTarget = module.metadata.key === EvidenceModuleKey.proxmox_target;
          const isBackupEvidence = module.metadata.key === EvidenceModuleKey.backup_evidence;
          const isStorageSan = module.metadata.key === EvidenceModuleKey.storage_san;
          const vmwareSummary = getVmwareSummary(module.record.lastParseResult?.summaryJson);
          const proxmoxSummary = getProxmoxSummary(module.record.lastParseResult?.summaryJson);
          const backupSummary = getBackupSummary(module.record.lastParseResult?.summaryJson);
          const storageSanSummary = getStorageSanSummary(module.record.lastParseResult?.summaryJson);

          return (
            <article key={module.metadata.key} className="glass-card assessment-subcard">
              <div className="assessment-evidence-main" style={{ alignItems: "flex-start" }}>
                <div className="assessment-evidence-icon">
                  <FileText size={18} />
                </div>
                <div className="assessment-evidence-meta">
                  <strong>{module.metadata.displayName}</strong>
                  <span>{module.metadata.description}</span>
                  <span>{module.metadata.preparedMessage}</span>
                  {isVmwareEnrichment ? (
                    <span>
                      Read-only collector available. Run it locally against vCenter, review the JSON output,
                      and upload it here.
                    </span>
                  ) : null}
                  {isProxmoxTarget ? (
                    <span>
                      Download the Shift Evidence Proxmox Target Collector, run it locally on a Proxmox VE
                      node, review the generated JSON output, and upload it here to validate whether your
                      target environment is ready for migration.
                    </span>
                  ) : null}
                  {isBackupEvidence ? (
                    <span>
                      Download the Shift Evidence Veeam Backup Evidence Collector, run it locally in your
                      Veeam environment, review the generated JSON output, and upload it here to validate
                      backup readiness before migration.
                    </span>
                  ) : null}
                  {isStorageSan ? (
                    <span>
                      Download the Shift Evidence Storage/SAN template, fill it with capacity, datastore
                      mapping, performance and replication evidence, review it locally, and upload it here
                      to improve storage readiness confidence.
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="assessment-evidence-stats" style={{ marginTop: "0.75rem" }}>
                <span className={`assessment-chip assessment-chip-${statusTone(status)}`}>
                  {statusLabel(status)}
                </span>
                <span className="assessment-chip assessment-chip-neutral">
                  {module.record.completionPercent}% complete
                </span>
                <span className="assessment-chip assessment-chip-neutral">
                  Impact: {module.metadata.confidenceImpact}
                </span>
              </div>

              <p className="assessment-storage-note" style={{ marginTop: "0.75rem" }}>
                Report impact: {module.metadata.reportImpact.join(", ")}.
              </p>

              {module.record.lastUpload?.evidenceFile ? (
                <p className="assessment-inline-note">
                  Last upload: {module.record.lastUpload.evidenceFile.originalFilename}
                </p>
              ) : null}

              {isVmwareEnrichment ? (
                <div className="assessment-warning-box" style={{ marginTop: "0.75rem" }}>
                  <strong>Read-only collector safety</strong>
                  <p className="assessment-storage-note">
                    The collector does not change vCenter configuration, create or delete snapshots,
                    modify VMs, store credentials, or upload data externally.
                  </p>
                </div>
              ) : null}

              {isProxmoxTarget ? (
                <div className="assessment-warning-box" style={{ marginTop: "0.75rem" }}>
                  <strong>Read-only collector safety</strong>
                  <p className="assessment-storage-note">
                    The collector is read-only. It does not change Proxmox configuration, create or delete VMs,
                    modify storage, restart services, install packages, persist credentials, or upload data externally.
                  </p>
                </div>
              ) : null}

              {isBackupEvidence ? (
                <div className="assessment-warning-box" style={{ marginTop: "0.75rem" }}>
                  <strong>Read-only collector safety</strong>
                  <p className="assessment-storage-note">
                    The collector is read-only. It does not start or stop jobs, delete restore points,
                    perform restores, modify repositories, change Veeam configuration, or persist credentials.
                  </p>
                </div>
              ) : null}

              {isStorageSan ? (
                <div className="assessment-warning-box" style={{ marginTop: "0.75rem" }}>
                  <strong>Customer-provided evidence safety</strong>
                  <p className="assessment-storage-note">
                    Do not include storage credentials, API tokens, passwords or raw configuration secrets.
                    This module uses customer-provided evidence files only in this version.
                  </p>
                </div>
              ) : null}

              {vmwareSummary ? (
                <div className="assessment-summary-mini-grid" style={{ marginTop: "0.75rem" }}>
                  <article className="assessment-preview-card">
                    <span className="assessment-preview-label">VMs</span>
                    <strong>{vmwareSummary.vmCount}</strong>
                  </article>
                  <article className="assessment-preview-card">
                    <span className="assessment-preview-label">Matched</span>
                    <strong>{vmwareSummary.matchedVmCount}</strong>
                  </article>
                  <article className="assessment-preview-card">
                    <span className="assessment-preview-label">Unmatched</span>
                    <strong>{vmwareSummary.unmatchedVmCount}</strong>
                  </article>
                  <article className="assessment-preview-card">
                    <span className="assessment-preview-label">Old snapshots</span>
                    <strong>{vmwareSummary.oldSnapshotCount}</strong>
                  </article>
                  <article className="assessment-preview-card">
                    <span className="assessment-preview-label">Tagged VMs</span>
                    <strong>{vmwareSummary.taggedVmCount}</strong>
                  </article>
                  <article className="assessment-preview-card">
                    <span className="assessment-preview-label">DRS rules</span>
                    <strong>{vmwareSummary.drsRuleCount}</strong>
                  </article>
                </div>
              ) : null}

              {proxmoxSummary ? (
                <>
                  <div className="assessment-status-row" style={{ marginTop: "0.75rem" }}>
                    <span className="assessment-chip assessment-chip-neutral">
                      Target: {statusLabel(proxmoxSummary.targetStatus)}
                    </span>
                    <span className="assessment-chip assessment-chip-neutral">
                      Confidence: {proxmoxSummary.confidence}
                    </span>
                  </div>
                  <div className="assessment-summary-mini-grid" style={{ marginTop: "0.75rem" }}>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Nodes</span>
                      <strong>{proxmoxSummary.nodeCount}</strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Online</span>
                      <strong>{proxmoxSummary.onlineNodeCount}</strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Storage used</span>
                      <strong>{proxmoxSummary.storageUsagePercent}%</strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">HA</span>
                      <strong>{proxmoxSummary.haConfigured ? "Yes" : "No"}</strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">PBS</span>
                      <strong>{proxmoxSummary.pbsDetected ? "Yes" : "No"}</strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Ceph</span>
                      <strong>{proxmoxSummary.cephDetected ? proxmoxSummary.cephHealth : "No"}</strong>
                    </article>
                  </div>
                  {proxmoxSummary.recommendations.length > 0 ? (
                    <div className="assessment-warning-box" style={{ marginTop: "0.75rem" }}>
                      <strong>Target recommendations</strong>
                      <ul className="assessment-bullet-list">
                        {proxmoxSummary.recommendations.slice(0, 3).map((recommendation) => (
                          <li key={recommendation}>{recommendation}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : null}

              {backupSummary ? (
                <>
                  <div className="assessment-status-row" style={{ marginTop: "0.75rem" }}>
                    <span className="assessment-chip assessment-chip-neutral">
                      Backup: {statusLabel(backupSummary.backupReadinessStatus)}
                    </span>
                    <span className="assessment-chip assessment-chip-neutral">
                      Confidence: {backupSummary.confidence}
                    </span>
                  </div>
                  <div className="assessment-summary-mini-grid" style={{ marginTop: "0.75rem" }}>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Jobs</span>
                      <strong>{backupSummary.jobCount}</strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Protected</span>
                      <strong>{backupSummary.protectedObjectCount}</strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Matched</span>
                      <strong>{backupSummary.matchedVmCount}</strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Unprotected</span>
                      <strong>{backupSummary.unprotectedVmCount}</strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Stale</span>
                      <strong>{backupSummary.staleBackupCount}</strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Failed jobs</span>
                      <strong>{backupSummary.failedJobCount}</strong>
                    </article>
                  </div>
                  {backupSummary.recommendations.length > 0 ? (
                    <div className="assessment-warning-box" style={{ marginTop: "0.75rem" }}>
                      <strong>Backup recommendations</strong>
                      <ul className="assessment-bullet-list">
                        {backupSummary.recommendations.slice(0, 3).map((recommendation) => (
                          <li key={recommendation}>{recommendation}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : null}

              {storageSanSummary ? (
                <>
                  <div className="assessment-status-row" style={{ marginTop: "0.75rem" }}>
                    <span className="assessment-chip assessment-chip-neutral">
                      Storage: {statusLabel(storageSanSummary.storageReadinessStatus)}
                    </span>
                    <span className="assessment-chip assessment-chip-neutral">
                      Confidence: {storageSanSummary.confidence}
                    </span>
                  </div>
                  <div className="assessment-summary-mini-grid" style={{ marginTop: "0.75rem" }}>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Arrays</span>
                      <strong>{storageSanSummary.arrayCount}</strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Pools</span>
                      <strong>{storageSanSummary.poolCount}</strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Volumes/LUNs</span>
                      <strong>{storageSanSummary.volumeCount + storageSanSummary.lunCount}</strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Mappings</span>
                      <strong>{storageSanSummary.datastoreMappingCount}</strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">High/Critical</span>
                      <strong>
                        {storageSanSummary.highUsagePoolCount}/{storageSanSummary.criticalUsagePoolCount}
                      </strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Target candidates</span>
                      <strong>{storageSanSummary.targetStorageCandidateCount}</strong>
                    </article>
                  </div>
                  <div className="assessment-status-row" style={{ marginTop: "0.75rem" }}>
                    <span className="assessment-chip assessment-chip-neutral">
                      Performance: {storageSanSummary.performanceEvidencePresent ? "present" : "missing"}
                    </span>
                    <span className="assessment-chip assessment-chip-neutral">
                      Replication: {storageSanSummary.replicationEvidencePresent ? "present" : "missing"}
                    </span>
                  </div>
                  {storageSanSummary.recommendations.length > 0 ? (
                    <div className="assessment-warning-box" style={{ marginTop: "0.75rem" }}>
                      <strong>Storage recommendations</strong>
                      <ul className="assessment-bullet-list">
                        {storageSanSummary.recommendations.slice(0, 3).map((recommendation) => (
                          <li key={recommendation}>{recommendation}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : null}

              {module.reportWarning ? (
                <p className="assessment-inline-note">{module.reportWarning}</p>
              ) : null}

              {warnings.length > 0 ? (
                <div className="assessment-warning-box" style={{ marginTop: "0.75rem" }}>
                  <strong>Parser warnings</strong>
                  <ul className="assessment-bullet-list">
                    {warnings.slice(0, 3).map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {errors.length > 0 ? (
                <div className="assessment-warning-box" style={{ marginTop: "0.75rem" }}>
                  <strong>Parser errors</strong>
                  <ul className="assessment-bullet-list">
                    {errors.slice(0, 3).map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="assessment-inline-actions" style={{ marginTop: "0.9rem" }}>
                {uploadUnlocked ? (
                  <form
                    action={uploadEvidenceAction.bind(null, assessmentId)}
                    encType="multipart/form-data"
                    className="assessment-inline-actions"
                  >
                    <input type="hidden" name="currentTab" value="evidence" />
                    <input type="hidden" name="moduleKey" value={module.metadata.key} />
                    <input type="hidden" name="evidenceType" value={evidenceType} />
                    <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
                      <Upload size={14} />
                      Upload evidence
                      <input
                        name="file"
                        type="file"
                        accept=".xlsx,.xls,.csv,.json,.txt,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/plain"
                        style={{ display: "none" }}
                      />
                    </label>
                    <button type="submit" className="btn btn-primary btn-glow btn-sm">
                      Attach
                    </button>
                  </form>
                ) : (
                  <span className="assessment-inline-note">Upload gate must be ready before attaching evidence.</span>
                )}

                {isVmwareEnrichment || isProxmoxTarget || isBackupEvidence || isStorageSan ? (
                  <a
                    href={
                      isProxmoxTarget
                        ? "/collectors/proxmox/shift-proxmox-target-collector.sh"
                        : isBackupEvidence
                          ? "/collectors/backup/shift-veeam-backup-collector.ps1"
                          : isStorageSan
                            ? "/templates/storage/shift-storage-san-template.csv"
                            : "/collectors/vmware/shift-vmware-evidence-collector.ps1"
                    }
                    className="btn btn-secondary btn-sm"
                    download
                  >
                    <Download size={14} />
                    {isStorageSan ? "Download CSV" : "Download collector"}
                  </a>
                ) : (
                  <button type="button" className="btn btn-secondary btn-sm" disabled>
                    <Download size={14} />
                    Template soon
                  </button>
                )}

                {isStorageSan ? (
                  <a
                    href="/templates/storage/shift-storage-san-template.json"
                    className="btn btn-secondary btn-sm"
                    download
                  >
                    <Download size={14} />
                    Download JSON
                  </a>
                ) : null}

                {isVmwareEnrichment || isProxmoxTarget || isBackupEvidence || isStorageSan ? (
                  <a
                    href={
                      isProxmoxTarget
                        ? "/collectors/proxmox/README.md"
                        : isBackupEvidence
                          ? "/collectors/backup/README.md"
                          : isStorageSan
                            ? "/templates/storage/README.md"
                            : "/collectors/vmware/README.md"
                    }
                    className="assessment-inline-note"
                  >
                    {isStorageSan ? "Template instructions" : "Collector instructions"}
                  </a>
                ) : (
                  <span className="assessment-inline-note">Collector coming soon</span>
                )}

                {status !== EvidenceModuleStatus.skipped ? (
                  <form action={skipEvidenceModuleAction.bind(null, assessmentId, module.metadata.key)}>
                    <button type="submit" className="btn btn-secondary btn-sm">
                      Mark as skipped
                    </button>
                  </form>
                ) : null}
              </div>

              <p className="assessment-storage-note">
                This module is optional. Skipping it limits advanced confidence but does not block the
                base readiness report. Max upload size: {maxUploadSizeMb} MB.
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
