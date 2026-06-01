import { describe, expect, it } from "vitest";
import {
  EvidenceModuleKey,
  EvidenceModuleSourceType,
  EvidenceParseResultStatus,
} from "@prisma/client";
import {
  EvidenceParserRegistry,
  createMetadataOnlyParser,
} from "../../src/server/evidence/evidenceParserRegistry";

const baseInput = {
  assessmentId: "assessment_1",
  moduleKey: EvidenceModuleKey.backup_evidence,
  evidenceFileId: "file_1",
  filePath: "private/evidence/file.json",
  mimeType: "application/json",
  originalFilename: "backup.json",
  inputType: EvidenceModuleSourceType.json,
};

describe("evidence parser registry", () => {
  it("resolves a supported parser", async () => {
    const registry = new EvidenceParserRegistry();
    registry.register(createMetadataOnlyParser());

    const parser = registry.resolve(baseInput);
    const result = await registry.parse(baseInput);

    expect(parser?.parserKey).toBe("evidence-metadata-only-v1");
    expect(result.status).toBe(EvidenceParseResultStatus.parsed_with_warnings);
    expect(result.warnings[0]).toContain("Metadata-only parser");
  });

  it("safely returns unsupported parser response", async () => {
    const registry = new EvidenceParserRegistry();

    const result = await registry.parse(baseInput);

    expect(result.status).toBe(EvidenceParseResultStatus.unsupported);
    expect(result.errors).toEqual([]);
    expect(result.warnings[0]).toContain("no technical parser");
  });

  it("converts parser exceptions into failed parse results", async () => {
    const registry = new EvidenceParserRegistry();
    registry.register({
      parserKey: "throws",
      parserVersion: "1.0.0",
      supportedModules: [EvidenceModuleKey.backup_evidence],
      supportedInputTypes: [EvidenceModuleSourceType.json],
      parse() {
        throw new Error("boom");
      },
    });

    const result = await registry.parse(baseInput);

    expect(result.status).toBe(EvidenceParseResultStatus.failed);
    expect(result.errors).toEqual(["boom"]);
  });
});
