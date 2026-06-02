import { Download, FileText, Upload } from "lucide-react";
import { EvidenceModuleKey, EvidenceModuleStatus, EvidenceType } from "@prisma/client";
import type { EvidenceExpansionSummary } from "../../server/evidence/evidenceExpansionService";
import {
  skipEvidenceModuleAction,
  uploadEvidenceAction,
} from "../../app/dashboard/assessments/[id]/evidence/actions";
import evidenceArtifactManifest from "../../../public/evidence-artifacts/manifest.json";

type EvidenceArtifact = (typeof evidenceArtifactManifest.artifacts)[number];

function artifactsForModule(moduleKey: EvidenceModuleKey) {
  return evidenceArtifactManifest.artifacts.filter((artifact) => artifact.moduleKey === moduleKey);
}

function downloadArtifactsForModule(moduleKey: EvidenceModuleKey) {
  return artifactsForModule(moduleKey).filter((artifact) => artifact.type === "collector" || artifact.type === "template");
}

function readmeArtifactForModule(moduleKey: EvidenceModuleKey) {
  return artifactsForModule(moduleKey).find((artifact) => artifact.type === "readme");
}

function shortSha(value: string) {
  return `${value.slice(0, 12)}...${value.slice(-8)}`;
}

function artifactTypeLabel(type: EvidenceArtifact["type"]) {
  return type === "collector" ? "Collector" : type === "template" ? "Template" : "Instructions";
}

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

function getApplicationDependencySummary(value: unknown) {
  const summary = asRecord(value);
  const dependencies = asRecord(summary?.applicationDependencySummary);
  const readiness = asRecord(summary?.readiness);
  if (!dependencies) return null;

  const numberValue = (key: string) => {
    const value = dependencies[key];
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  };

  return {
    dependencyReadinessStatus:
      typeof readiness?.dependencyReadinessStatus === "string"
        ? readiness.dependencyReadinessStatus
        : "dependency_not_validated",
    confidence: typeof readiness?.confidence === "string" ? readiness.confidence : "low",
    wavePlanningMode: typeof readiness?.wavePlanningMode === "string" ? readiness.wavePlanningMode : "technical_only",
    recommendations: Array.isArray(readiness?.recommendations)
      ? readiness.recommendations.filter((item): item is string => typeof item === "string")
      : [],
    applicationCount: numberValue("applicationCount"),
    dependencyCount: numberValue("dependencyCount"),
    criticalApplicationCount: numberValue("criticalApplicationCount"),
    criticalVmCount: numberValue("criticalVmCount"),
    ownerCount: numberValue("ownerCount"),
    unownedApplicationCount: numberValue("unownedApplicationCount"),
    maintenanceWindowCount: numberValue("maintenanceWindowCount"),
    missingMaintenanceWindowCount: numberValue("missingMaintenanceWindowCount"),
    migrationGroupCount: numberValue("migrationGroupCount"),
    functionalWaveCandidateCount: numberValue("functionalWaveCandidateCount"),
    technicalOnlyWaveCount: numberValue("technicalOnlyWaveCount"),
    matchedVmCount: numberValue("matchedVmCount"),
    unmatchedVmCount: numberValue("unmatchedVmCount"),
    unmappedRvtoolsVmCount: numberValue("unmappedRvtoolsVmCount"),
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
          const isApplicationDependency = module.metadata.key === EvidenceModuleKey.application_dependency;
          const vmwareSummary = getVmwareSummary(module.record.lastParseResult?.summaryJson);
          const proxmoxSummary = getProxmoxSummary(module.record.lastParseResult?.summaryJson);
          const backupSummary = getBackupSummary(module.record.lastParseResult?.summaryJson);
          const storageSanSummary = getStorageSanSummary(module.record.lastParseResult?.summaryJson);
          const applicationDependencySummary = getApplicationDependencySummary(
            module.record.lastParseResult?.summaryJson,
          );
          const downloadArtifacts = downloadArtifactsForModule(module.metadata.key);
          const readmeArtifact = readmeArtifactForModule(module.metadata.key);

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
                  {isApplicationDependency ? (
                    <span>
                      Download the Shift Evidence Application Dependency template, map applications, owners,
                      criticality, maintenance windows and VM dependencies, review it locally, and upload it
                      here to improve migration wave planning.
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

              {downloadArtifacts.length > 0 ? (
                <div className="assessment-warning-box" style={{ marginTop: "0.75rem" }}>
                  <strong>Download package integrity</strong>
                  <p className="assessment-storage-note">
                    Review output locally before upload. Do not include secrets, credentials, tokens, private paths or
                    sensitive comments. Missing evidence remains visible as a confidence limitation.
                  </p>
                  <div className="assessment-summary-mini-grid" style={{ marginTop: "0.75rem" }}>
                    {downloadArtifacts.map((artifact) => (
                      <article key={artifact.key} className="assessment-preview-card">
                        <span className="assessment-preview-label">{artifactTypeLabel(artifact.type)}</span>
                        <strong>{artifact.displayName}</strong>
                        <span className="assessment-storage-note">
                          v{artifact.version} / {artifact.status.replace("_", " ")}
                        </span>
                        <span className="assessment-storage-note">Schema: {artifact.outputSchema}</span>
                        <span className="assessment-storage-note">SHA-256: {shortSha(artifact.sha256)}</span>
                        <span className="assessment-storage-note">Requirement: {artifact.requirement}</span>
                        <div className="assessment-inline-actions" style={{ marginTop: "0.55rem" }}>
                          <a href={artifact.path} className="btn btn-secondary btn-sm" download>
                            <Download size={14} />
                            Download
                          </a>
                          <a href={artifact.sha256Path} className="assessment-inline-note">
                            checksum
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                  {readmeArtifact ? (
                    <p className="assessment-inline-note" style={{ marginTop: "0.75rem" }}>
                      Instructions: <a href={readmeArtifact.path}>open README</a>. Last reviewed:{" "}
                      {downloadArtifacts[0]?.lastReviewedAt ?? readmeArtifact.lastReviewedAt}. Accepted formats:{" "}
                      {module.metadata.acceptedInputTypes.join(", ")}.
                    </p>
                  ) : null}
                </div>
              ) : null}

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

              {isApplicationDependency ? (
                <div className="assessment-warning-box" style={{ marginTop: "0.75rem" }}>
                  <strong>Customer-provided dependency safety</strong>
                  <p className="assessment-storage-note">
                    Do not include passwords, tokens, secrets or credentials. This module uses
                    customer-provided dependency evidence and does not perform network discovery in this version.
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

              {applicationDependencySummary ? (
                <>
                  <div className="assessment-status-row" style={{ marginTop: "0.75rem" }}>
                    <span className="assessment-chip assessment-chip-neutral">
                      Dependencies: {statusLabel(applicationDependencySummary.dependencyReadinessStatus)}
                    </span>
                    <span className="assessment-chip assessment-chip-neutral">
                      Confidence: {applicationDependencySummary.confidence}
                    </span>
                    <span className="assessment-chip assessment-chip-neutral">
                      Wave mode: {statusLabel(applicationDependencySummary.wavePlanningMode)}
                    </span>
                  </div>
                  <div className="assessment-summary-mini-grid" style={{ marginTop: "0.75rem" }}>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Apps</span>
                      <strong>{applicationDependencySummary.applicationCount}</strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Dependencies</span>
                      <strong>{applicationDependencySummary.dependencyCount}</strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Critical apps/VMs</span>
                      <strong>
                        {applicationDependencySummary.criticalApplicationCount}/
                        {applicationDependencySummary.criticalVmCount}
                      </strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Owners missing</span>
                      <strong>{applicationDependencySummary.unownedApplicationCount}</strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Windows missing</span>
                      <strong>{applicationDependencySummary.missingMaintenanceWindowCount}</strong>
                    </article>
                    <article className="assessment-preview-card">
                      <span className="assessment-preview-label">Matched/unmatched</span>
                      <strong>
                        {applicationDependencySummary.matchedVmCount}/
                        {applicationDependencySummary.unmatchedVmCount}
                      </strong>
                    </article>
                  </div>
                  <div className="assessment-status-row" style={{ marginTop: "0.75rem" }}>
                    <span className="assessment-chip assessment-chip-neutral">
                      Migration groups: {applicationDependencySummary.migrationGroupCount}
                    </span>
                    <span className="assessment-chip assessment-chip-neutral">
                      Functional candidates: {applicationDependencySummary.functionalWaveCandidateCount}
                    </span>
                    <span className="assessment-chip assessment-chip-neutral">
                      Technical-only: {applicationDependencySummary.technicalOnlyWaveCount}
                    </span>
                  </div>
                  {applicationDependencySummary.recommendations.length > 0 ? (
                    <div className="assessment-warning-box" style={{ marginTop: "0.75rem" }}>
                      <strong>Dependency recommendations</strong>
                      <ul className="assessment-bullet-list">
                        {applicationDependencySummary.recommendations.slice(0, 3).map((recommendation) => (
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

              <div className="assessment-warning-box" style={{ marginTop: "0.75rem" }}>
                <strong>Upload guidance</strong>
                <ul className="assessment-bullet-list">
                  <li>Review the collector output or template locally before upload.</li>
                  <li>Remove secrets, credentials, tokens, private paths and sensitive comments.</li>
                  <li>This module improves confidence but remains optional.</li>
                  <li>After parsing, review warnings/errors and matched/unmatched counts where available.</li>
                </ul>
              </div>

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

                {downloadArtifacts.length > 0 ? (
                  downloadArtifacts.map((artifact) => (
                    <a key={artifact.key} href={artifact.path} className="btn btn-secondary btn-sm" download>
                      <Download size={14} />
                      {artifact.language === "CSV"
                        ? "Download CSV"
                        : artifact.language === "JSON"
                          ? "Download JSON"
                          : "Download collector"}
                    </a>
                  ))
                ) : (
                  <button type="button" className="btn btn-secondary btn-sm" disabled>
                    <Download size={14} />
                    Template soon
                  </button>
                )}

                {readmeArtifact ? (
                  <a href={readmeArtifact.path} className="assessment-inline-note">
                    {isStorageSan || isApplicationDependency ? "Template instructions" : "Collector instructions"}
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
