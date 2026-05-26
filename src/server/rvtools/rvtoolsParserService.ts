import { EvidenceType } from "@prisma/client";
import {
  getRoleSpecificWarnings,
  inferRoleFromDetection,
  mapRowsByRole,
  mergeVmEnrichmentRows,
  normalizeEntityName,
} from "./rvtoolsColumnMapper";
import { readRvtoolsWorkbookFromBuffer } from "./rvtoolsWorkbookReader";
import type {
  ParsedDatastoreRow,
  ParsedHostRow,
  ParsedInventorySummaryData,
  ParsedSnapshotRow,
  ParsedVmRow,
  ParserError,
  ParserWarning,
  ParsedWorkbookResult,
  SheetDetectionResult,
  SheetRole,
  WorkbookSheet,
} from "./rvtoolsParserTypes";

function buildSummary(params: {
  assessmentId: string;
  evidenceFileId: string;
  parsedVMs: ParsedVmRow[];
  parsedHosts: ParsedHostRow[];
  parsedDatastores: ParsedDatastoreRow[];
  parsedSnapshots: ParsedSnapshotRow[];
  warnings: ParserWarning[];
}) {
  if (
    params.parsedVMs.length === 0 &&
    params.parsedHosts.length === 0 &&
    params.parsedDatastores.length === 0 &&
    params.parsedSnapshots.length === 0
  ) {
    return null;
  }

  const totalProvisionedGb = params.parsedVMs.reduce((sum, row) => sum + (row.provisionedGb ?? 0), 0);
  const totalUsedGb = params.parsedVMs.reduce((sum, row) => sum + (row.usedGb ?? 0), 0);
  const largestVmGb = params.parsedVMs.reduce((max, row) => Math.max(max, row.provisionedGb ?? row.usedGb ?? 0), 0);
  const oldestSnapshotDays = params.parsedSnapshots.reduce((max, row) => Math.max(max, row.ageDays ?? 0), 0);

  const poweredOnVmCount = params.parsedVMs.filter((row) => {
    const powerState = row.powerState?.toLowerCase() ?? "";
    return powerState.includes("on") || powerState.includes("running") || powerState.includes("poweredon");
  }).length;

  const poweredOffVmCount = params.parsedVMs.filter((row) => {
    const powerState = row.powerState?.toLowerCase() ?? "";
    return powerState.includes("off") || powerState.includes("stopped") || powerState.includes("poweredoff");
  }).length;

  return {
    assessmentId: params.assessmentId,
    evidenceFileId: params.evidenceFileId,
    vmCount: params.parsedVMs.length,
    hostCount: params.parsedHosts.length,
    datastoreCount: params.parsedDatastores.length,
    snapshotCount: params.parsedSnapshots.length,
    poweredOnVmCount,
    poweredOffVmCount,
    totalProvisionedGb: totalProvisionedGb > 0 ? totalProvisionedGb : null,
    totalUsedGb: totalUsedGb > 0 ? totalUsedGb : null,
    largestVmGb: largestVmGb > 0 ? largestVmGb : null,
    oldestSnapshotDays: oldestSnapshotDays > 0 ? oldestSnapshotDays : null,
    parsedAt: new Date(),
    parseWarningsJson: params.warnings,
  } satisfies ParsedInventorySummaryData;
}

function detectMissingExpectedSheets(detections: SheetDetectionResult[]) {
  const roles: SheetRole[] = ["vm", "host", "datastore", "snapshot"];
  return roles
    .filter((role) => !detections.some((detection) => detection.role === role))
    .map((role) => ({
      code: `missing_${role}_sheet`,
      message:
        role === "vm"
          ? "No vInfo-like sheet was detected."
          : role === "host"
            ? "No host sheet was detected."
            : role === "datastore"
              ? "No datastore sheet was detected."
              : "No snapshot sheet was detected.",
    })) satisfies ParserWarning[];
}

function buildDuplicateVmWarning(params: {
  vmName: string;
  sheetName: string;
  rowNumber: number;
}) {
  return {
    code: "duplicate_vm_in_vInfo",
    message: `Merged duplicate canonical VM row for "${params.vmName}".`,
    sheetName: params.sheetName,
    rowNumber: params.rowNumber,
  } satisfies ParserWarning;
}

function mergeDuplicateCanonicalVms(rows: ParsedVmRow[]) {
  const merged = new Map<string, ParsedVmRow>();
  const warnings: ParserWarning[] = [];

  for (const row of rows) {
    const key = normalizeEntityName(row.vmName);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, row);
      continue;
    }

    warnings.push(
      buildDuplicateVmWarning({
        vmName: row.vmName,
        sheetName: row.sourceSheetName,
        rowNumber: row.sourceRowNumber,
      }),
    );

    merged.set(key, {
      ...existing,
      powerState: existing.powerState ?? row.powerState,
      guestOs: existing.guestOs ?? row.guestOs,
      cpuCount: existing.cpuCount ?? row.cpuCount,
      memoryMb: existing.memoryMb ?? row.memoryMb,
      diskCount: existing.diskCount ?? row.diskCount,
      provisionedGb: existing.provisionedGb ?? row.provisionedGb,
      usedGb: existing.usedGb ?? row.usedGb,
      nicCount: existing.nicCount ?? row.nicCount,
      toolsStatus: existing.toolsStatus ?? row.toolsStatus,
      datastoreName: existing.datastoreName ?? row.datastoreName,
      clusterName: existing.clusterName ?? row.clusterName,
      hostName: existing.hostName ?? row.hostName,
      riskLevel: existing.riskLevel ?? row.riskLevel,
      recommendation: existing.recommendation ?? row.recommendation,
      rawJson: {
        ...existing.rawJson,
        __duplicateCanonicalRows: [
          ...((existing.rawJson.__duplicateCanonicalRows as Record<string, unknown>[] | undefined) ?? []),
          row.rawJson,
        ],
      },
    });
  }

  return {
    rows: [...merged.values()],
    warnings,
  };
}

function hasUsefulRows(sheets: WorkbookSheet[]) {
  return sheets.some((sheet) => sheet.rowCount > 0);
}

export function parseRvtoolsWorkbook(params: {
  buffer: Buffer;
  originalFilename: string;
  assessmentId: string;
  evidenceFileId: string;
  evidenceType: EvidenceType;
}) {
  const { sheets } = readRvtoolsWorkbookFromBuffer({
    buffer: params.buffer,
    originalFilename: params.originalFilename,
  });

  const detections = sheets.map((sheet) => ({
    ...sheet.detection,
    role: inferRoleFromDetection(sheet.sheetName, sheet.headers, sheet.rowCount),
  })) satisfies SheetDetectionResult[];

  const warnings: ParserWarning[] = [];
  const errors: ParserError[] = [];

  if (sheets.length === 0) {
    throw new Error("No sheets were found in the uploaded file.");
  }

  const parsedVMs: ParsedVmRow[] = [];
  const vmEnrichmentSheets: WorkbookSheet[] = [];
  const parsedHosts: ParsedHostRow[] = [];
  const parsedDatastores: ParsedDatastoreRow[] = [];
  const parsedSnapshots: ParsedSnapshotRow[] = [];

  for (const sheet of sheets) {
    const role = inferRoleFromDetection(sheet.sheetName, sheet.headers, sheet.rowCount);
    warnings.push(...getRoleSpecificWarnings(role, sheet.sheetName));

    const parsed = mapRowsByRole({
      role,
      rows: sheet.rows,
      assessmentId: params.assessmentId,
      evidenceFileId: params.evidenceFileId,
      sheetName: sheet.sheetName,
    });

    warnings.push(...parsed.warnings);

    if (role === "vm") {
      parsedVMs.push(...(parsed.rows as ParsedVmRow[]));
    } else if (role === "vm_enrichment") {
      vmEnrichmentSheets.push(sheet);
    } else if (role === "host") {
      parsedHosts.push(...(parsed.rows as ParsedHostRow[]));
    } else if (role === "datastore") {
      parsedDatastores.push(...(parsed.rows as ParsedDatastoreRow[]));
    } else if (role === "snapshot") {
      parsedSnapshots.push(...(parsed.rows as ParsedSnapshotRow[]));
    }
  }

  const hasCanonicalVmSheet = detections.some((detection) => detection.role === "vm");
  if (!hasCanonicalVmSheet && vmEnrichmentSheets.length > 0) {
    warnings.push({
      code: "missing_canonical_vm_sheet",
      message: "No canonical vInfo sheet was detected; VM parsing used fallback sheet detection only.",
    });
  }

  const deduplicated = mergeDuplicateCanonicalVms(parsedVMs);
  parsedVMs.splice(0, parsedVMs.length, ...deduplicated.rows);
  warnings.push(...deduplicated.warnings);

  if (parsedVMs.length > 0) {
    for (const enrichmentSheet of vmEnrichmentSheets) {
      const merged = mergeVmEnrichmentRows({
        canonicalVms: parsedVMs,
        rows: enrichmentSheet.rows,
        sheetName: enrichmentSheet.sheetName,
      });
      warnings.push(...merged.warnings);
    }
  } else {
    for (const enrichmentSheet of vmEnrichmentSheets) {
      const parsed = mapRowsByRole({
        role: "vm",
        rows: enrichmentSheet.rows,
        assessmentId: params.assessmentId,
        evidenceFileId: params.evidenceFileId,
        sheetName: enrichmentSheet.sheetName,
      });
      warnings.push(...parsed.warnings);
      parsedVMs.push(...(parsed.rows as ParsedVmRow[]));
    }
  }

  warnings.push(...detectMissingExpectedSheets(detections));

  if (!hasUsefulRows(sheets)) {
    throw new Error("The uploaded file does not contain readable inventory data.");
  }

  if (parsedVMs.length === 0 && parsedHosts.length === 0 && parsedDatastores.length === 0 && parsedSnapshots.length === 0) {
    throw new Error("No recognizable RVTools inventory data was found.");
  }

  const summary = buildSummary({
    assessmentId: params.assessmentId,
    evidenceFileId: params.evidenceFileId,
    parsedVMs,
    parsedHosts,
    parsedDatastores,
    parsedSnapshots,
    warnings,
  });

  return {
    sourceFilename: params.originalFilename,
    sheetCount: sheets.length,
    detections,
    warnings,
    errors,
    parsedVMs,
    parsedHosts,
    parsedDatastores,
    parsedSnapshots,
    summary,
  } satisfies ParsedWorkbookResult;
}
