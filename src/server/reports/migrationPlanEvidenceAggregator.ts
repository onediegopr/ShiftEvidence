import { EvidenceModuleKey, EvidenceParseResultStatus } from "@prisma/client";
import type { AssessmentDetail } from "../assessments/assessmentService";
import type { MigrationPlanEvidenceSummary } from "./migrationPlanTypes";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function latestParsedSummary(assessment: AssessmentDetail, moduleKey: EvidenceModuleKey) {
  const evidenceModule = assessment.evidenceModules.find((item) => item.moduleKey === moduleKey);
  if (!evidenceModule?.lastParseResult) return null;
  if (
    evidenceModule.lastParseResult.status !== EvidenceParseResultStatus.parsed &&
    evidenceModule.lastParseResult.status !== EvidenceParseResultStatus.parsed_with_warnings
  ) {
    return null;
  }
  return asRecord(evidenceModule.lastParseResult.summaryJson);
}

function nestedSummary(summary: Record<string, unknown> | null, key: string) {
  return asRecord(summary?.[key]);
}

function readinessValue(summary: Record<string, unknown> | null, key: string, fallback: string) {
  const readiness = asRecord(summary?.readiness);
  const value = readiness?.[key];
  return typeof value === "string" ? value : fallback;
}

function hasClientContext(assessment: AssessmentDetail) {
  return Boolean(
    assessment.clientLabel ||
    assessment.additionalEvidence?.length > 0 ||
    assessment.storageContext ||
    assessment.storageAnalysis,
  );
}

export function buildMigrationPlanEvidenceSummary(assessment: AssessmentDetail): MigrationPlanEvidenceSummary {
  const inventory = assessment.parsedInventorySummaries[0] ?? null;
  const vmware = latestParsedSummary(assessment, EvidenceModuleKey.vmware_enrichment);
  const proxmox = latestParsedSummary(assessment, EvidenceModuleKey.proxmox_target);
  const backup = latestParsedSummary(assessment, EvidenceModuleKey.backup_evidence);
  const storage = latestParsedSummary(assessment, EvidenceModuleKey.storage_san);
  const dependencies = latestParsedSummary(assessment, EvidenceModuleKey.application_dependency);
  const proxmoxSummary = nestedSummary(proxmox, "proxmoxTargetSummary");
  const backupSummary = nestedSummary(backup, "backupEvidenceSummary");
  const storageSummary = nestedSummary(storage, "storageSanSummary");
  const dependencySummary = nestedSummary(dependencies, "applicationDependencySummary");
  const blockers: string[] = [];
  const remediationItems: string[] = [];

  const backupReadiness = readinessValue(backup, "backupReadinessStatus", "backup_not_validated");
  const targetReadiness = readinessValue(proxmox, "targetStatus", "target_not_validated");
  const storageReadiness = readinessValue(storage, "storageReadinessStatus", "storage_not_validated");
  const dependencyReadiness = readinessValue(dependencies, "dependencyReadinessStatus", "dependency_not_validated");
  const dependencyMode = readinessValue(dependencies, "wavePlanningMode", "technical_only") as "technical_only" | "functional_candidate" | "functional_validated";

  if (!inventory) blockers.push("Base RVTools inventory has not been parsed.");
  if (!backupSummary) remediationItems.push("Upload Backup Evidence before production migration planning.");
  if (!proxmoxSummary) remediationItems.push("Upload Proxmox Target evidence before target readiness claims.");
  if (!storageSummary) remediationItems.push("Upload Storage/SAN evidence before strong storage or performance claims.");
  if (!dependencySummary) remediationItems.push("Upload Application Dependency Mapping before functional wave planning.");
  if (backupReadiness.includes("insufficient") || backupReadiness.includes("requires_remediation")) {
    remediationItems.push("Resolve backup readiness warnings before early production waves.");
  }
  if (targetReadiness.includes("insufficient")) {
    blockers.push("Proxmox target evidence indicates insufficient target readiness.");
  }
  if (storageReadiness.includes("insufficient")) {
    remediationItems.push("Resolve critical Storage/SAN capacity or mapping issues.");
  }
  if (dependencyReadiness.includes("requires_remediation") || dependencyReadiness.includes("insufficient")) {
    remediationItems.push("Resolve dependency mapping owners, windows or circular dependency issues.");
  }

  const evidenceCoverage = {
    baseInventory: Boolean(inventory),
    vmwareEnrichment: Boolean(vmware),
    proxmoxTarget: Boolean(proxmoxSummary),
    backupEvidence: Boolean(backupSummary),
    storageSanEvidence: Boolean(storageSummary),
    applicationDependencies: Boolean(dependencySummary),
    licensing: Boolean(assessment.licensingAnalysis),
    clientContext: hasClientContext(assessment),
    aiAdvisory: false,
  };
  const coverageCount = Object.values(evidenceCoverage).filter(Boolean).length;

  return {
    assessmentId: assessment.id,
    assessmentTitle: assessment.title,
    clientLabel: assessment.clientLabel ?? null,
    workspaceName: assessment.workspace.name,
    evidenceCoverage,
    inventory: {
      vmCount: numberValue(inventory?.vmCount),
      hostCount: numberValue(inventory?.hostCount),
      datastoreCount: numberValue(inventory?.datastoreCount),
      snapshotCount: assessment.parsedSnapshots.length,
      parsed: Boolean(inventory),
    },
    readiness: {
      infrastructure: inventory ? "complete" : "missing",
      target: targetReadiness,
      backup: backupReadiness,
      storage: storageReadiness,
      dependencies: dependencyReadiness,
      businessContinuity: backupSummary ? "backup_evidence_available" : "backup_evidence_missing",
      licensing: assessment.licensingAnalysis ? "licensing_available" : "licensing_missing",
    },
    summaries: {
      vmwareEnrichment: nestedSummary(vmware, "vmwareEnrichmentSummary"),
      proxmoxTarget: proxmoxSummary,
      backupEvidence: backupSummary,
      storageSan: storageSummary,
      applicationDependencies: dependencySummary,
    },
    blockers,
    remediationItems,
    waveInputs: [
      {
        mode: dependencyMode,
        label: dependencyMode === "functional_validated"
          ? "Functional waves validated"
          : dependencyMode === "functional_candidate"
            ? "Functional wave candidates"
            : "Technical-only wave candidates",
        explanation: dependencyMode === "functional_validated"
          ? "Dependency evidence is strong enough for reviewed functional wave planning."
          : dependencyMode === "functional_candidate"
            ? "Application groups exist, but customer review is required before execution."
            : "Dependency evidence is missing or weak; waves must remain technical-only/preliminary.",
      },
    ],
    confidence: coverageCount >= 7 ? "high" : coverageCount >= 4 ? "medium" : "low",
  };
}
