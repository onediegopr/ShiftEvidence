import { EvidenceType } from "@prisma/client";
import { afterEach, describe, expect, it } from "vitest";
import { validateEvidenceUpload } from "../../src/server/evidence/uploadValidation";

const originalMaxUploadSizeMb = process.env.MAX_UPLOAD_SIZE_MB;

function fileFromText(name: string, type: string, text = "synthetic evidence") {
  return new File([text], name, { type });
}

afterEach(() => {
  process.env.MAX_UPLOAD_SIZE_MB = originalMaxUploadSizeMb;
});

describe("evidence upload validation", () => {
  it("rejects unsupported RVTools extensions before storage or parsing", () => {
    const file = fileFromText("synthetic-rvtools.exe", "application/octet-stream");

    expect(() =>
      validateEvidenceUpload({
        file,
        evidenceType: EvidenceType.rvtools,
      }),
    ).toThrow("Unsupported file type for the selected evidence category.");
  });

  it("rejects suspicious MIME and extension combinations", () => {
    const file = fileFromText("synthetic-rvtools.xlsx", "application/x-msdownload");

    expect(() =>
      validateEvidenceUpload({
        file,
        evidenceType: EvidenceType.rvtools,
      }),
    ).toThrow("Unsupported MIME type for the selected evidence category.");
  });

  it("enforces configured max upload size before workbook parsing", () => {
    process.env.MAX_UPLOAD_SIZE_MB = "0.000001";
    const file = fileFromText(
      "synthetic-rvtools.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "this intentionally exceeds the tiny test limit",
    );

    expect(() =>
      validateEvidenceUpload({
        file,
        evidenceType: EvidenceType.rvtools,
      }),
    ).toThrow("File is too large.");
  });
});
