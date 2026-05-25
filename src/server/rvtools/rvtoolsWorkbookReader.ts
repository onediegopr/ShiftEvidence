import * as XLSX from "xlsx";
import path from "path";
import type { SheetDetectionResult, WorkbookSheet } from "./rvtoolsParserTypes";
import { normalizeHeader } from "./rvtoolsColumnMapper";

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

  return {
    sheetName,
    role: best.score > 0 ? best.role : "unknown",
    score: best.score,
    headers,
    rowCount,
  };
}

function sheetToRows(sheet: XLSX.WorkSheet) {
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,
    blankrows: false,
  });
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
