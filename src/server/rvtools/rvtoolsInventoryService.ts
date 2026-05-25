import { getLatestRvtoolsEvidence } from "../evidence/evidenceFileService";
import type { AssessmentDetail } from "../assessments/assessmentService";
import type { ParsedRiskLevel } from "@prisma/client";
import type { ParserWarning } from "./rvtoolsParserTypes";

export type ParsedInventoryStatus = "not_available" | "parsed" | "partial" | "failed";
export type EvidenceConfidence = "limited" | "limited_with_warnings" | "moderate";

type ParsedInventorySummaryRecord = {
  id: string;
  assessmentId: string;
  evidenceFileId: string;
  createdAt: Date;
  updatedAt: Date;
  vmCount: number;
  hostCount: number;
  datastoreCount: number;
  snapshotCount: number;
  poweredOnVmCount: number;
  poweredOffVmCount: number;
  totalProvisionedGb: number | null;
  totalUsedGb: number | null;
  largestVmGb: number | null;
  oldestSnapshotDays: number | null;
  parsedAt: Date | null;
  parseWarningsJson: unknown;
};

type ParsedVmRecord = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  assessmentId: string;
  evidenceFileId: string;
  vmName: string;
  powerState: string | null;
  guestOs: string | null;
  cpuCount: number | null;
  memoryMb: number | null;
  diskCount: number | null;
  provisionedGb: number | null;
  usedGb: number | null;
  nicCount: number | null;
  toolsStatus: string | null;
  datastoreName: string | null;
  clusterName: string | null;
  hostName: string | null;
  riskLevel: ParsedRiskLevel | null;
  recommendation: string | null;
  rawJson: unknown;
};

type ParsedHostRecord = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  assessmentId: string;
  evidenceFileId: string;
  hostName: string;
  clusterName: string | null;
  cpuModel: string | null;
  cpuSockets: number | null;
  cpuCores: number | null;
  memoryGb: number | null;
  version: string | null;
  rawJson: unknown;
};

type ParsedDatastoreRecord = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  assessmentId: string;
  evidenceFileId: string;
  datastoreName: string;
  datastoreType: string | null;
  capacityGb: number | null;
  usedGb: number | null;
  freeGb: number | null;
  usagePercent: number | null;
  riskLevel: ParsedRiskLevel | null;
  rawJson: unknown;
};

type ParsedSnapshotRecord = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  assessmentId: string;
  evidenceFileId: string;
  vmName: string | null;
  snapshotName: string | null;
  createdAtSource: Date | null;
  ageDays: number | null;
  sizeGb: number | null;
  riskLevel: ParsedRiskLevel | null;
  rawJson: unknown;
};

export type ParsedInventorySnapshot = {
  latestEvidence: NonNullable<ReturnType<typeof getLatestRvtoolsEvidence>>;
  summary: ParsedInventorySummaryRecord | null;
  vms: ParsedVmRecord[];
  hosts: ParsedHostRecord[];
  datastores: ParsedDatastoreRecord[];
  snapshots: ParsedSnapshotRecord[];
  parseWarnings: ParserWarning[];
  inventoryStatus: ParsedInventoryStatus;
  evidenceConfidence: EvidenceConfidence;
};

function asWarnings(value: unknown): ParserWarning[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const warning = entry as Partial<ParserWarning>;
    if (typeof warning.code !== "string" || typeof warning.message !== "string") {
      return [];
    }

    return [
      {
        code: warning.code,
        message: warning.message,
        sheetName: typeof warning.sheetName === "string" ? warning.sheetName : undefined,
        rowNumber: typeof warning.rowNumber === "number" ? warning.rowNumber : undefined,
        field: typeof warning.field === "string" ? warning.field : undefined,
      },
    ];
  });
}

function countWarnings(value: unknown) {
  return asWarnings(value).length;
}

export function getParsedInventorySnapshot(assessment: AssessmentDetail): ParsedInventorySnapshot | null {
  const latestEvidence = getLatestRvtoolsEvidence(assessment);

  if (!latestEvidence || latestEvidence.processingStatus === "deleted") {
    return null;
  }

  const vms = (assessment.parsedVMs ?? []).filter((item) => item.evidenceFileId === latestEvidence.id) as ParsedVmRecord[];
  const hosts = (assessment.parsedHosts ?? []).filter((item) => item.evidenceFileId === latestEvidence.id) as ParsedHostRecord[];
  const datastores = (assessment.parsedDatastores ?? []).filter((item) => item.evidenceFileId === latestEvidence.id) as ParsedDatastoreRecord[];
  const snapshots = (assessment.parsedSnapshots ?? []).filter((item) => item.evidenceFileId === latestEvidence.id) as ParsedSnapshotRecord[];
  const summary =
    ((assessment.parsedInventorySummaries ?? []).find((item) => item.evidenceFileId === latestEvidence.id) as
      | ParsedInventorySummaryRecord
      | null) ?? null;

  if (latestEvidence.processingStatus === "failed") {
    return {
      latestEvidence,
      summary: null,
      vms: [],
      hosts: [],
      datastores: [],
      snapshots: [],
      parseWarnings: [],
      inventoryStatus: "failed",
      evidenceConfidence: "limited",
    };
  }

  const warnings = summary ? asWarnings(summary.parseWarningsJson) : [];

  if (!summary) {
    return {
      latestEvidence,
      summary: null,
      vms,
      hosts,
      datastores,
      snapshots,
      parseWarnings: warnings,
      inventoryStatus: latestEvidence.processingStatus === "processing" ? "not_available" : "failed",
      evidenceConfidence: "limited",
    };
  }

  const hasWarnings = countWarnings(summary.parseWarningsJson) > 0;
  const hasSupportSheets = hosts.length > 0 || datastores.length > 0;

  const evidenceConfidence: EvidenceConfidence = hasWarnings
    ? "limited_with_warnings"
    : hasSupportSheets
      ? "moderate"
      : "limited";

  const inventoryStatus: ParsedInventoryStatus = hasWarnings ? "partial" : "parsed";

  return {
    latestEvidence,
    summary,
    vms,
    hosts,
    datastores,
    snapshots,
    parseWarnings: warnings,
    inventoryStatus,
    evidenceConfidence,
  };
}

export function getInventoryStatusLabel(status: ParsedInventoryStatus) {
  switch (status) {
    case "parsed":
      return "Parsed";
    case "partial":
      return "Partial";
    case "failed":
      return "Failed";
    default:
      return "Not available";
  }
}

export function getEvidenceConfidenceLabel(confidence: EvidenceConfidence) {
  switch (confidence) {
    case "moderate":
      return "Moderate";
    case "limited_with_warnings":
      return "Limited with warnings";
    default:
      return "Limited";
  }
}

export function getInventorySummaryRows(snapshot: ParsedInventorySnapshot | null) {
  if (!snapshot || !snapshot.summary) {
    return [];
  }

  return [
    {
      label: "VMs",
      value: snapshot.summary.vmCount,
    },
    {
      label: "Hosts",
      value: snapshot.summary.hostCount,
    },
    {
      label: "Datastores",
      value: snapshot.summary.datastoreCount,
    },
    {
      label: "Snapshots",
      value: snapshot.summary.snapshotCount,
    },
  ];
}
