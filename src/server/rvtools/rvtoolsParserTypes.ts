import type { ParsedRiskLevel } from "@prisma/client";

export type SheetRole = "vm" | "host" | "datastore" | "snapshot" | "unknown";

export type ParserWarning = {
  code: string;
  message: string;
  sheetName?: string;
  rowNumber?: number;
  field?: string;
};

export type ParserError = {
  code: string;
  message: string;
  sheetName?: string;
  rowNumber?: number;
  field?: string;
};

export type SheetDetectionResult = {
  sheetName: string;
  role: SheetRole;
  score: number;
  headers: string[];
  rowCount: number;
};

export type WorkbookSheet = {
  sheetName: string;
  rows: Record<string, unknown>[];
  headers: string[];
  rowCount: number;
  detection: SheetDetectionResult;
};

export type ParsedVmRow = {
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
  rawJson: Record<string, unknown>;
  sourceSheetName: string;
  sourceRowNumber: number;
};

export type ParsedHostRow = {
  assessmentId: string;
  evidenceFileId: string;
  hostName: string;
  clusterName: string | null;
  cpuModel: string | null;
  cpuSockets: number | null;
  cpuCores: number | null;
  memoryGb: number | null;
  version: string | null;
  rawJson: Record<string, unknown>;
  sourceSheetName: string;
  sourceRowNumber: number;
};

export type ParsedDatastoreRow = {
  assessmentId: string;
  evidenceFileId: string;
  datastoreName: string;
  datastoreType: string | null;
  capacityGb: number | null;
  usedGb: number | null;
  freeGb: number | null;
  usagePercent: number | null;
  riskLevel: ParsedRiskLevel | null;
  rawJson: Record<string, unknown>;
  sourceSheetName: string;
  sourceRowNumber: number;
};

export type ParsedSnapshotRow = {
  assessmentId: string;
  evidenceFileId: string;
  vmName: string | null;
  snapshotName: string | null;
  createdAtSource: Date | null;
  ageDays: number | null;
  sizeGb: number | null;
  riskLevel: ParsedRiskLevel | null;
  rawJson: Record<string, unknown>;
  sourceSheetName: string;
  sourceRowNumber: number;
};

export type ParsedInventorySummaryData = {
  assessmentId: string;
  evidenceFileId: string;
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
  parseWarningsJson: ParserWarning[];
};

export type ParsedWorkbookResult = {
  sourceFilename: string;
  sheetCount: number;
  detections: SheetDetectionResult[];
  warnings: ParserWarning[];
  errors: ParserError[];
  parsedVMs: ParsedVmRow[];
  parsedHosts: ParsedHostRow[];
  parsedDatastores: ParsedDatastoreRow[];
  parsedSnapshots: ParsedSnapshotRow[];
  summary: ParsedInventorySummaryData | null;
};
