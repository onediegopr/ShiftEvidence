import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  readRvtoolsWorkbookFromBuffer,
  RVTOOLS_WORKBOOK_LIMITS,
  sanitizeWorkbookHeader,
} from "../../src/server/rvtools/rvtoolsWorkbookReader";

function workbookBufferFromRows(rows: Record<string, unknown>[], sheetName = "vInfo") {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return Buffer.from(XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }));
}

describe("RVTools workbook safety guardrails", () => {
  it("sanitizes dangerous worksheet headers before mapping rows", () => {
    expect(sanitizeWorkbookHeader("__proto__", 0)).toBe("ignored_column_1");
    expect(sanitizeWorkbookHeader("constructor", 1)).toBe("ignored_column_2");
    expect(sanitizeWorkbookHeader("prototype", 2)).toBe("ignored_column_3");
  });

  it("parses synthetic workbooks without preserving prototype-pollution headers", () => {
    const buffer = workbookBufferFromRows([
      {
        VM: "synthetic-vm-01",
        Powerstate: "poweredOn",
        __proto__: "polluted",
        constructor: "unsafe",
        prototype: "unsafe",
      },
    ]);

    const parsed = readRvtoolsWorkbookFromBuffer({
      buffer,
      originalFilename: "synthetic-rvtools.xlsx",
    });

    expect(parsed.sheets).toHaveLength(1);
    expect(parsed.sheets[0]?.headers).toContain("VM");
    expect(parsed.sheets[0]?.headers).not.toContain("__proto__");
    expect(parsed.sheets[0]?.headers).not.toContain("constructor");
    expect(parsed.sheets[0]?.headers).not.toContain("prototype");
    expect(Object.prototype).not.toHaveProperty("polluted");
  });

  it("fails safely when a workbook exceeds the supported sheet limit", () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet([{ VM: "synthetic-vm-01" }]);

    for (let index = 0; index <= RVTOOLS_WORKBOOK_LIMITS.maxSheets; index += 1) {
      XLSX.utils.book_append_sheet(workbook, worksheet, `sheet-${index}`);
    }

    const buffer = Buffer.from(XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }));

    expect(() =>
      readRvtoolsWorkbookFromBuffer({
        buffer,
        originalFilename: "too-many-sheets.xlsx",
      }),
    ).toThrow(`Workbook exceeds the supported sheet limit of ${RVTOOLS_WORKBOOK_LIMITS.maxSheets}.`);
  });

  it("truncates very large string cells before downstream mapping", () => {
    const longValue = "x".repeat(RVTOOLS_WORKBOOK_LIMITS.maxCellTextLength + 50);
    const buffer = workbookBufferFromRows([{ VM: "synthetic-vm-01", Notes: longValue }]);

    const parsed = readRvtoolsWorkbookFromBuffer({
      buffer,
      originalFilename: "large-cell.xlsx",
    });

    const row = parsed.sheets[0]?.rows[0];
    expect(String(row?.Notes)).toHaveLength(RVTOOLS_WORKBOOK_LIMITS.maxCellTextLength);
  });
});
