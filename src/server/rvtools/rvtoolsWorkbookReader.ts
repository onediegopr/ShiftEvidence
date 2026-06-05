import * as XLSX from "xlsx";
import path from "path";
import type { SheetDetectionResult, WorkbookSheet } from "./rvtoolsParserTypes";
import { inferRoleFromDetection, normalizeHeader } from "./rvtoolsColumnMapper";

export const RVTOOLS_WORKBOOK_LIMITS = {
  maxSheets: 40,
  maxRowsPerSheet: 20000,
  maxHeaderLength: 160,
  maxCellTextLength: 5000,
} as const;

const DANGEROUS_HEADER_NAMES = new Set(["__proto__", "constructor", "prototype"]);

function safeWorkbookError(message: string) {
  return new Error(message);
}

export function sanitizeWorkbookHeader(header: string, index: number) {
  const sanitized = Array.from(header)
    .map((char) => {
      const code = char.charCodeAt(0);
      return code < 32 || code === 127 ? " " : char;
    })
    .join("")
    .trim()
    .slice(0, RVTOOLS_WORKBOOK_LIMITS.maxHeaderLength);
  const normalized = sanitized.toLowerCase();

  if (!sanitized || DANGEROUS_HEADER_NAMES.has(normalized)) {
    return `ignored_column_${index + 1}`;
  }

  return sanitized;
}

function sanitizeWorkbookValue(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  if (value.length <= RVTOOLS_WORKBOOK_LIMITS.maxCellTextLength) {
    return value;
  }

  return value.slice(0, RVTOOLS_WORKBOOK_LIMITS.maxCellTextLength);
}

function sanitizeWorkbookRow(row: Record<string, unknown>) {
  const safeRow: Record<string, unknown> = Object.create(null);

  for (const [header, value] of Object.entries(row)) {
    const safeHeader = sanitizeWorkbookHeader(header, Object.keys(safeRow).length);
    safeRow[safeHeader] = sanitizeWorkbookValue(value);
  }

  return safeRow;
}

function detectRoleFromSheet(sheetName: string, headers: string[], rowCount: number) {
  const normalizedSheetName = normalizeHeader(sheetName);
  const normalizedHeaders = headers.map(normalizeHeader);

  const scoreMatches = (aliases: string[]) => {
    let score = 0;

    for (const alias of aliases) {
      const normalizedAlias = normalizeHeader(alias);
      if (!normalizedAlias) {
        continue;
      }

      if (normalizedSheetName.includes(normalizedAlias)) {
        score += 4;
      }

      if (normalizedHeaders.some((header) => header === normalizedAlias || header.includes(normalizedAlias))) {
        score += 2;
      }
    }

    return score;
  };

  const vmScore = scoreMatches([
    "vInfo",
    "vm",
    "virtual machine",
    "vMachine",
    "powerstate",
    "guest os",
    "cpu",
    "memory",
  ]);
  const hostScore = scoreMatches([
    "vHost",
    "host",
    "esx host",
    "cpu model",
    "cpu sockets",
    "memory gb",
    "version",
  ]);
  const datastoreScore = scoreMatches([
    "vDatastore",
    "datastore",
    "capacity",
    "free",
    "used",
    "usage",
  ]);
  const snapshotScore = scoreMatches([
    "vSnapshot",
    "snapshot",
    "snapshot name",
    "created",
    "size",
  ]);

  const scores: Array<{ role: SheetDetectionResult["role"]; score: number }> = [
    { role: "vm", score: vmScore },
    { role: "host", score: hostScore },
    { role: "datastore", score: datastoreScore },
    { role: "snapshot", score: snapshotScore },
  ];

  const best = scores.reduce((current, candidate) => (candidate.score > current.score ? candidate : current), {
    role: "unknown" as const,
    score: 0,
  });

  const explicitRole = inferRoleFromDetection(sheetName, headers, rowCount);

  return {
    sheetName,
    role: explicitRole !== "unknown" ? explicitRole : best.score > 0 ? best.role : "unknown",
    score: best.score,
    headers,
    rowCount,
  };
}

function sheetToRows(sheet: XLSX.WorkSheet) {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,
    blankrows: false,
  });

  if (rows.length > RVTOOLS_WORKBOOK_LIMITS.maxRowsPerSheet) {
    throw safeWorkbookError(
      `Workbook sheet exceeds the supported row limit of ${RVTOOLS_WORKBOOK_LIMITS.maxRowsPerSheet}.`,
    );
  }

  return rows.map(sanitizeWorkbookRow);
}

export function readRvtoolsWorkbookFromBuffer(params: {
  buffer: Buffer;
  originalFilename: string;
}) {
  const extension = path.extname(params.originalFilename).toLowerCase();
  const isCsv = extension === ".csv";

  const workbook = isCsv
    ? XLSX.read(params.buffer.toString("utf8"), {
        type: "string",
        cellDates: true,
      })
    : XLSX.read(params.buffer, {
        type: "buffer",
        cellDates: true,
      });

  if (workbook.SheetNames.length > RVTOOLS_WORKBOOK_LIMITS.maxSheets) {
    throw safeWorkbookError(
      `Workbook exceeds the supported sheet limit of ${RVTOOLS_WORKBOOK_LIMITS.maxSheets}.`,
    );
  }

  const sheets = workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rows = sheetToRows(worksheet);
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    const detection = detectRoleFromSheet(sheetName, headers, rows.length);

    return {
      sheetName,
      rows,
      headers,
      rowCount: rows.length,
      detection,
    } satisfies WorkbookSheet;
  });

  return {
    workbook,
    sheets,
  };
}
