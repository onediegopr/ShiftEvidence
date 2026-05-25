import { type Prisma, type PlanLevel, type RiskFindingCategory, type RiskFindingSource, type RiskSeverity } from "@prisma/client";
import type { AssessmentDetail } from "../assessments/assessmentService";
import { buildInventoryDrivenCostRiskContext } from "./riskContext";

export type RiskFindingDraft = {
  assessmentId: string;
  evidenceFileId: string | null;
  category: RiskFindingCategory;
  severity: RiskSeverity;
  entityType: string | null;
  entityName: string | null;
  title: string;
  description: string;
  recommendation: string | null;
  visibleInFree: boolean;
  requiresPlan: PlanLevel | null;
  source: RiskFindingSource;
  metadataJson: Prisma.InputJsonValue | null;
};

export type RiskFindingEngineSummary = {
  totalFindings: number;
  bySeverity: Record<RiskSeverity, number>;
  byCategory: Record<RiskFindingCategory, number>;
  source: string;
  mismatchWarnings: number;
  vmFindingCount: number;
  hostFindingCount: number;
  datastoreFindingCount: number;
  snapshotFindingCount: number;
  evidenceFindingCount: number;
  costFindingCount: number;
  readinessFindingCount: number;
};

type SeverityIssue = {
  severity: RiskSeverity;
  title: string;
  description: string;
  recommendation: string;
};

const severityRank: Record<RiskSeverity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function highestSeverity(current: RiskSeverity, next: RiskSeverity) {
  return severityRank[next] > severityRank[current] ? next : current;
}

function joinRecommendations(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].join(" ");
}

function joinDescriptions(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].join(" ");
}

function createFinding(params: {
  assessmentId: string;
  evidenceFileId?: string | null;
  category: RiskFindingCategory;
  severity: RiskSeverity;
  entityType?: string | null;
  entityName?: string | null;
  title: string;
  description: string;
  recommendation?: string | null;
  visibleInFree?: boolean;
  requiresPlan?: PlanLevel | null;
  source: RiskFindingSource;
  metadataJson?: Prisma.InputJsonValue | null;
}): RiskFindingDraft {
  return {
    assessmentId: params.assessmentId,
    evidenceFileId: params.evidenceFileId ?? null,
    category: params.category,
    severity: params.severity,
    entityType: params.entityType ?? null,
    entityName: params.entityName ?? null,
    title: params.title,
    description: params.description,
    recommendation: params.recommendation ?? null,
    visibleInFree: params.visibleInFree ?? true,
    requiresPlan: params.requiresPlan ?? null,
    source: params.source,
    metadataJson: params.metadataJson ?? null,
  };
}

function buildEntityFinding(params: {
  assessmentId: string;
  evidenceFileId?: string | null;
  category: RiskFindingCategory;
  entityType: string;
  entityName: string;
  source: RiskFindingSource;
  issues: SeverityIssue[];
  parserSeverity?: RiskSeverity | null;
  parserRecommendation?: string | null;
  metadataJson?: Prisma.InputJsonValue | null;
}) {
  const issues = [...params.issues].sort((left, right) => severityRank[right.severity] - severityRank[left.severity]);
  const bestIssue = issues[0] ?? null;
  const severity = issues.reduce<RiskSeverity>((current, issue) => highestSeverity(current, issue.severity), params.parserSeverity ?? "info");

  if (!bestIssue && !params.parserSeverity) {
    return null;
  }

  const title =
    bestIssue?.title ??
    (params.parserSeverity === "high"
      ? `High-risk ${params.category}: ${params.entityName}`
      : params.parserSeverity === "medium"
        ? `Review ${params.category}: ${params.entityName}`
        : `Inventory note: ${params.entityName}`);

  const description = joinDescriptions([
    ...issues.map((issue) => issue.description),
    params.parserSeverity ? "Parser-derived signal available for this entity." : "",
  ]);

  const recommendation = joinRecommendations([
    ...issues.map((issue) => issue.recommendation),
    params.parserRecommendation ?? "",
  ]);

  return createFinding({
    assessmentId: params.assessmentId,
    evidenceFileId: params.evidenceFileId,
    category: params.category,
    severity,
    entityType: params.entityType,
    entityName: params.entityName,
    title,
    description,
    recommendation: recommendation || null,
    source: params.source,
    metadataJson: {
      issues,
      parserSeverity: params.parserSeverity ?? null,
      parserRecommendation: params.parserRecommendation ?? null,
      entityType: params.entityType,
      entityName: params.entityName,
    },
  });
}

function getLatestRvtoolsEvidence(assessment: AssessmentDetail) {
  const latest = [...(assessment.evidenceFiles ?? [])]
    .filter((file) => file.evidenceType === "rvtools")
    .sort((left, right) => {
      const leftTime = left.uploadedAt?.getTime?.() ?? 0;
      const rightTime = right.uploadedAt?.getTime?.() ?? 0;
      return rightTime - leftTime;
    })[0];

  return latest ?? null;
}

function normalizeToolStatus(value: string | null | undefined) {
  return value?.toLowerCase().replace(/\s+/g, " ") ?? "";
}

function splitEvidenceWarnings(warnings: { code: string; message: string }[]) {
  const missingSheetWarnings = warnings.filter((warning) => warning.code.startsWith("missing_"));
  const parserWarnings = warnings.filter((warning) => !warning.code.startsWith("missing_"));

  return {
    missingSheetWarnings,
    parserWarnings,
  };
}

export function generateRiskFindingsForAssessment(assessment: AssessmentDetail) {
  const context = buildInventoryDrivenCostRiskContext(assessment);
  const parsedInventory = context.parsedInventory;
  const latestEvidence = getLatestRvtoolsEvidence(assessment);

  const findings: RiskFindingDraft[] = [];
  const vmCount = new Map<string, RiskFindingDraft>();
  const hostCount = new Map<string, RiskFindingDraft>();
  const datastoreCount = new Map<string, RiskFindingDraft>();
  const snapshotCount = new Map<string, RiskFindingDraft>();

  const parsedEvidenceId = latestEvidence?.id ?? null;
  const parsedWarnings = parsedInventory?.parseWarnings ?? [];
  const { missingSheetWarnings, parserWarnings } = splitEvidenceWarnings(parsedWarnings);

  if (latestEvidence && latestEvidence.processingStatus === "failed") {
    findings.push(
      createFinding({
        assessmentId: assessment.id,
        evidenceFileId: latestEvidence.id,
        category: "evidence",
        severity: "high",
        entityType: "evidence",
        entityName: latestEvidence.originalFilename,
        title: "RVTools evidence parse failed",
        description: "The uploaded RVTools evidence could not be parsed successfully.",
        recommendation: "Fix the file issue and re-run the parser before trusting inventory-based insights.",
        source: "parser",
        metadataJson: {
          evidenceStatus: latestEvidence.processingStatus,
        },
      }),
    );
  }

  if (parsedInventory?.inventoryStatus === "partial" || parsedWarnings.length > 0) {
    const severity: RiskSeverity =
      missingSheetWarnings.some((warning) => warning.code === "missing_vm_sheet")
        ? "high"
        : missingSheetWarnings.some((warning) => warning.code === "missing_host_sheet" || warning.code === "missing_datastore_sheet")
          ? "medium"
          : "low";

    findings.push(
      createFinding({
        assessmentId: assessment.id,
        evidenceFileId: parsedEvidenceId,
        category: "evidence",
        severity,
        entityType: "evidence",
        entityName: latestEvidence?.originalFilename ?? "RVTools export",
        title:
          severity === "high"
            ? "RVTools inventory is missing a key sheet"
            : "RVTools inventory contains parser warnings",
        description: [
          parsedInventory?.inventoryStatus === "partial"
            ? "The parsed inventory is partial and requires validation."
            : "The parser returned warnings while extracting the inventory.",
          ...missingSheetWarnings.map((warning) => warning.message),
          ...parserWarnings.map((warning) => warning.message),
        ]
          .filter(Boolean)
          .join(" "),
        recommendation:
          "Review parser warnings and re-export RVTools if important sheets or columns are missing.",
        source: "parser",
        metadataJson: {
          inventoryStatus: parsedInventory?.inventoryStatus ?? "not_available",
          warningsCount: parsedWarnings.length,
          missingSheetWarnings: missingSheetWarnings.map((warning) => warning.code),
          parserWarnings: parserWarnings.map((warning) => warning.code),
        },
      }),
    );
  }

  if (!parsedInventory && latestEvidence && latestEvidence.processingStatus === "uploaded") {
    findings.push(
      createFinding({
        assessmentId: assessment.id,
        evidenceFileId: latestEvidence.id,
        category: "evidence",
        severity: "medium",
        entityType: "evidence",
        entityName: latestEvidence.originalFilename,
        title: "RVTools evidence uploaded but not parsed yet",
        description: "The uploaded evidence is attached to the assessment but has not been parsed into inventory yet.",
        recommendation: "Run the parser to create the preliminary inventory before reading risk signals.",
        source: "system",
        metadataJson: {
          processingStatus: latestEvidence.processingStatus,
        },
      }),
    );
  }

  const parsedVms = parsedInventory?.vms ?? [];
  for (const row of parsedVms) {
    const issues: SeverityIssue[] = [];
    const normalizedTools = normalizeToolStatus(row.toolsStatus);
    const normalizedPower = normalizeToolStatus(row.powerState);
    const sourceRecommendation = row.recommendation?.trim() ?? null;

    if (typeof row.provisionedGb === "number") {
      if (row.provisionedGb > 2048) {
        issues.push({
          severity: "high",
          title: `Very large VM: ${row.vmName}`,
          description: `Provisioned size is ${Math.round(row.provisionedGb)} GB.`,
          recommendation: "Review migration window and storage impact before moving this VM.",
        });
      } else if (row.provisionedGb > 512) {
        issues.push({
          severity: "medium",
          title: `Large VM: ${row.vmName}`,
          description: `Provisioned size is ${Math.round(row.provisionedGb)} GB.`,
          recommendation: "Review migration window and storage impact before moving this VM.",
        });
      }
    }

    if (normalizedPower.includes("off") || normalizedPower.includes("stopped") || normalizedPower.includes("powered off")) {
      issues.push({
        severity: "low",
        title: `Powered-off VM: ${row.vmName}`,
        description: "The VM is not currently powered on.",
        recommendation: "Confirm whether this VM should be migrated or archived first.",
      });
    }

    if (
      normalizedTools.includes("unknown") ||
      normalizedTools.includes("outdated") ||
      normalizedTools.includes("not running") ||
      normalizedTools.includes("old")
    ) {
      issues.push({
        severity: "medium",
        title: `VMware Tools need review: ${row.vmName}`,
        description: `Tools status is ${row.toolsStatus ?? "unknown"}.`,
        recommendation: "Validate guest readiness before migration.",
      });
    }

    if (!row.guestOs) {
      issues.push({
        severity: "low",
        title: `Guest OS missing: ${row.vmName}`,
        description: "The export did not include a guest operating system value.",
        recommendation: "Confirm OS compatibility before migration.",
      });
    }

    if (!row.hostName || !row.datastoreName) {
      issues.push({
        severity: "medium",
        title: `Placement data incomplete: ${row.vmName}`,
        description: "Host or datastore placement data is missing from the parsed inventory.",
        recommendation: "Verify inventory completeness before planning migration waves.",
      });
    }

    if (row.riskLevel) {
      issues.push({
        severity: row.riskLevel,
        title:
          row.riskLevel === "high"
            ? `Parser flagged high risk VM: ${row.vmName}`
            : row.riskLevel === "medium"
              ? `Parser flagged VM for review: ${row.vmName}`
              : `Parser note for VM: ${row.vmName}`,
        description: row.recommendation
          ? `Parser-derived risk signal was attached to this VM. ${row.recommendation}`
          : "Parser-derived risk signal was attached to this VM.",
        recommendation: sourceRecommendation ?? "Review the parser signal before migrating.",
      });
    }

    const finding = buildEntityFinding({
      assessmentId: assessment.id,
      evidenceFileId: parsedEvidenceId,
      category: "vm",
      entityType: "vm",
      entityName: row.vmName,
      source: "parser",
      issues,
      parserSeverity: row.riskLevel ?? null,
      parserRecommendation: sourceRecommendation,
      metadataJson: {
        powerState: row.powerState,
        guestOs: row.guestOs,
        cpuCount: row.cpuCount,
        memoryMb: row.memoryMb,
        provisionedGb: row.provisionedGb,
        usedGb: row.usedGb,
        datastoreName: row.datastoreName,
        hostName: row.hostName,
        toolsStatus: row.toolsStatus,
        parserRiskLevel: row.riskLevel ?? null,
      },
    });

    if (finding) {
      vmCount.set(row.vmName, finding);
    }
  }

  const parsedHosts = parsedInventory?.hosts ?? [];
  for (const row of parsedHosts) {
    const issues: SeverityIssue[] = [];

    if (!row.clusterName) {
      issues.push({
        severity: "low",
        title: `Host not grouped in a cluster: ${row.hostName}`,
        description: "The parsed host record does not include a cluster name.",
        recommendation: "Verify host grouping and target placement before migration.",
      });
    }

    if (!row.version || row.version.toLowerCase().includes("unknown")) {
      issues.push({
        severity: "low",
        title: `Host version needs review: ${row.hostName}`,
        description: "The ESXi version value is missing or unknown.",
        recommendation: "Complete host version evidence before migration planning.",
      });
    }

    if (row.cpuSockets === null || row.cpuCores === null || row.memoryGb === null) {
      issues.push({
        severity: "medium",
        title: `Host capacity data incomplete: ${row.hostName}`,
        description: "CPU socket, core or memory details are missing from the parsed host record.",
        recommendation: "Complete host capacity evidence before migration planning.",
      });
    }

    const finding = buildEntityFinding({
      assessmentId: assessment.id,
      evidenceFileId: parsedEvidenceId,
      category: "host",
      entityType: "host",
      entityName: row.hostName,
      source: "parser",
      issues,
      metadataJson: {
        clusterName: row.clusterName,
        cpuModel: row.cpuModel,
        cpuSockets: row.cpuSockets,
        cpuCores: row.cpuCores,
        memoryGb: row.memoryGb,
        version: row.version,
      },
    });

    if (finding) {
      hostCount.set(row.hostName, finding);
    }
  }

  const parsedDatastores = parsedInventory?.datastores ?? [];
  for (const row of parsedDatastores) {
    const issues: SeverityIssue[] = [];

    if (row.usagePercent !== null && row.usagePercent !== undefined) {
      if (row.usagePercent >= 90) {
        issues.push({
          severity: "high",
          title: `Datastore nearly full: ${row.datastoreName}`,
          description: `Usage is ${Math.round(row.usagePercent)}%.`,
          recommendation: "Validate free capacity and clean up storage before migration.",
        });
      } else if (row.usagePercent >= 80) {
        issues.push({
          severity: "medium",
          title: `Datastore usage is elevated: ${row.datastoreName}`,
          description: `Usage is ${Math.round(row.usagePercent)}%.`,
          recommendation: "Validate free capacity before migration.",
        });
      }
    }

    if (row.capacityGb === null || row.freeGb === null || row.usedGb === null) {
      issues.push({
        severity: "low",
        title: `Datastore capacity evidence incomplete: ${row.datastoreName}`,
        description: "Capacity, used or free storage values are missing from the parsed record.",
        recommendation: "Complete datastore capacity evidence before migration.",
      });
    }

    if (row.capacityGb !== null && row.capacityGb > 10240) {
      issues.push({
        severity: "medium",
        title: `Very large datastore: ${row.datastoreName}`,
        description: `Capacity is ${Math.round(row.capacityGb)} GB.`,
        recommendation: "Review storage migration strategy for very large datastores.",
      });
    }

    const finding = buildEntityFinding({
      assessmentId: assessment.id,
      evidenceFileId: parsedEvidenceId,
      category: "datastore",
      entityType: "datastore",
      entityName: row.datastoreName,
      source: "parser",
      issues,
      parserSeverity: row.riskLevel ?? null,
      metadataJson: {
        datastoreType: row.datastoreType,
        capacityGb: row.capacityGb,
        usedGb: row.usedGb,
        freeGb: row.freeGb,
        usagePercent: row.usagePercent,
        parserRiskLevel: row.riskLevel ?? null,
      },
    });

    if (finding) {
      datastoreCount.set(row.datastoreName, finding);
    }
  }

  const parsedSnapshots = parsedInventory?.snapshots ?? [];
  for (const row of parsedSnapshots) {
    const issues: SeverityIssue[] = [];

    if (row.ageDays !== null && row.ageDays !== undefined) {
      if (row.ageDays >= 30) {
        issues.push({
          severity: "high",
          title: `Snapshot older than 30 days: ${row.vmName ?? row.snapshotName}`,
          description: `Snapshot age is ${row.ageDays} days.`,
          recommendation: "Prioritize snapshot cleanup before migration planning.",
        });
      } else if (row.ageDays >= 7) {
        issues.push({
          severity: "medium",
          title: `Snapshot older than 7 days: ${row.vmName ?? row.snapshotName}`,
          description: `Snapshot age is ${row.ageDays} days.`,
          recommendation: "Review or remove old snapshots before migration.",
        });
      }
    } else {
      issues.push({
        severity: "low",
        title: `Snapshot age missing: ${row.vmName ?? row.snapshotName ?? "Unknown VM"}`,
        description: "The snapshot export did not include an age value.",
        recommendation: "Confirm snapshot age manually before migration.",
      });
    }

    if (row.sizeGb !== null && row.sizeGb !== undefined && row.sizeGb > 100) {
      issues.push({
        severity: "high",
        title: `Large snapshot: ${row.vmName ?? row.snapshotName}`,
        description: `Snapshot size is ${Math.round(row.sizeGb)} GB.`,
        recommendation: "Validate snapshot size and consolidation risk before migration.",
      });
    }

    const finding = buildEntityFinding({
      assessmentId: assessment.id,
      evidenceFileId: parsedEvidenceId,
      category: "snapshot",
      entityType: "snapshot",
      entityName: row.vmName ?? row.snapshotName ?? "Unknown snapshot",
      source: "parser",
      issues,
      parserSeverity: row.riskLevel ?? null,
      metadataJson: {
        vmName: row.vmName,
        snapshotName: row.snapshotName,
        createdAtSource: row.createdAtSource,
        ageDays: row.ageDays,
        sizeGb: row.sizeGb,
        parserRiskLevel: row.riskLevel ?? null,
      },
    });

    if (finding) {
      snapshotCount.set(row.vmName ?? row.snapshotName ?? String(snapshotCount.size), finding);
    }
  }

  if (context.mismatchWarnings.length > 0) {
    findings.push(
      createFinding({
        assessmentId: assessment.id,
        category: "cost",
        severity: "medium",
        entityType: "assessment",
        entityName: assessment.title,
        title: "Manual assumptions differ from parsed RVTools inventory",
        description: context.mismatchWarnings.join(" "),
        recommendation: "Reconcile manual assumptions against the parsed inventory before trusting the preview.",
        source: "cost_risk",
        metadataJson: {
          source: context.source,
          mismatchWarnings: context.mismatchWarnings,
          referenceCounts: context.referenceCounts,
          manualCounts: context.manualCounts,
          parsedCounts: context.parsedCounts,
        },
      }),
    );
  }

  if (!assessment.costRiskAssumptions?.annualVmwareCost || !assessment.costRiskAssumptions?.estimatedProxmoxCost) {
    findings.push(
      createFinding({
        assessmentId: assessment.id,
        category: "cost",
        severity: "medium",
        entityType: "assessment",
        entityName: assessment.title,
        title: "Cost assumptions are incomplete",
        description: "The preliminary Cost / Risk preview cannot estimate subscription delta without both annual cost values.",
        recommendation: "Complete Cost / Risk assumptions to estimate subscription delta.",
        source: "manual_input",
        metadataJson: {
          hasAnnualVmwareCost: Boolean(assessment.costRiskAssumptions?.annualVmwareCost),
          hasEstimatedProxmoxCost: Boolean(assessment.costRiskAssumptions?.estimatedProxmoxCost),
        },
      }),
    );
  }

  if (
    !assessment.storageReadinessEnabled &&
    context.referenceCounts.storageFootprintTb !== null &&
    context.referenceCounts.storageFootprintTb > 50
  ) {
    findings.push(
      createFinding({
        assessmentId: assessment.id,
        category: "storage",
        severity: "medium",
        entityType: "assessment",
        entityName: assessment.title,
        title: "Storage Destination Readiness may be needed",
        description: "The current storage footprint looks large enough that target storage validation may add value.",
        recommendation: "Consider adding Storage Destination Readiness for a deeper target architecture view.",
        source: "system",
        metadataJson: {
          storageFootprintTb: context.referenceCounts.storageFootprintTb,
          storageReadinessEnabled: assessment.storageReadinessEnabled,
        },
      }),
    );
  }

  const vmFindings = [...vmCount.values()];
  const hostFindings = [...hostCount.values()];
  const datastoreFindings = [...datastoreCount.values()];
  const snapshotFindings = [...snapshotCount.values()];

  findings.push(...vmFindings, ...hostFindings, ...datastoreFindings, ...snapshotFindings);

  const bySeverity: Record<RiskSeverity, number> = {
    info: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  const byCategory: Record<RiskFindingCategory, number> = {
    vm: 0,
    host: 0,
    datastore: 0,
    snapshot: 0,
    evidence: 0,
    storage: 0,
    cost: 0,
    readiness: 0,
  };

  for (const finding of findings) {
    bySeverity[finding.severity] += 1;
    byCategory[finding.category] += 1;
  }

  return {
    findings,
    summary: {
      totalFindings: findings.length,
      bySeverity,
      byCategory,
      source: context.source,
      mismatchWarnings: context.mismatchWarnings.length,
      vmFindingCount: vmFindings.length,
      hostFindingCount: hostFindings.length,
      datastoreFindingCount: datastoreFindings.length,
      snapshotFindingCount: snapshotFindings.length,
      evidenceFindingCount: byCategory.evidence,
      costFindingCount: byCategory.cost,
      readinessFindingCount: byCategory.readiness,
    } satisfies RiskFindingEngineSummary,
    context,
  };
}
