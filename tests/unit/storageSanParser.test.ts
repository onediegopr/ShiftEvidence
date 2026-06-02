import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import {
  EvidenceModuleKey,
  EvidenceModuleSourceType,
  EvidenceParseResultStatus,
} from "@prisma/client";
import { createDefaultEvidenceParserRegistry } from "../../src/server/evidence/evidenceParserRegistry";
import {
  STORAGE_SAN_PARSER_KEY,
  createStorageSanParser,
  parseStorageSanCsv,
  parseStorageSanPayload,
} from "../../src/server/evidence/parsers/storageSanParser";

const prismaMock = vi.hoisted(() => ({
  parsedDatastore: {
    findMany: vi.fn(),
  },
  evidenceParseResult: {
    findFirst: vi.fn(),
  },
}));

const readEvidenceFileMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("../../src/server/evidence/localStorageService", () => ({
  readEvidenceFile: readEvidenceFileMock,
}));

const fixtureDir = path.join(process.cwd(), "tests", "fixtures", "evidence", "storage-san");
const rvtoolsDatastores = [{ datastoreName: "DS-PROD-01" }];
const proxmoxSummary = { proxmoxTargetSummary: { storageCount: 1 } };

function loadJsonFixture(name: string) {
  return JSON.parse(readFileSync(path.join(fixtureDir, name), "utf8"));
}

function loadTextFixture(name: string) {
  return readFileSync(path.join(fixtureDir, name), "utf8");
}

describe("Storage/SAN parser", () => {
  it("parses healthy JSON as validated when RVTools and Proxmox target storage are available", () => {
    const result = parseStorageSanPayload({
      payload: loadJsonFixture("storage-san-healthy.json"),
      rvtoolsDatastores,
      proxmoxSummary,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.parsed);
    expect(result.parserKey).toBe(STORAGE_SAN_PARSER_KEY);
    expect(result.summary.storageSanSummary).toMatchObject({
      arrayCount: 1,
      poolCount: 1,
      matchedDatastoreCount: 1,
      unmatchedDatastoreCount: 0,
    });
    expect(result.summary.readiness).toMatchObject({
      storageReadinessStatus: "storage_validated",
      confidence: "high",
    });
  });

  it("detects capacity warning as remediation required without making a destructive claim", () => {
    const result = parseStorageSanPayload({
      payload: loadJsonFixture("storage-san-capacity-warning.json"),
      rvtoolsDatastores,
      proxmoxSummary,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.parsed_with_warnings);
    expect(result.summary.readiness).toMatchObject({
      storageReadinessStatus: "storage_requires_remediation",
    });
    expect(result.warnings.join(" ")).toContain("warning utilization");
  });

  it("detects critical usage as insufficient", () => {
    const result = parseStorageSanPayload({
      payload: loadJsonFixture("storage-san-critical-usage.json"),
      rvtoolsDatastores,
      proxmoxSummary,
    });

    expect(result.summary.storageSanSummary).toMatchObject({
      criticalUsagePoolCount: 1,
    });
    expect(result.summary.readiness).toMatchObject({
      storageReadinessStatus: "storage_insufficient",
    });
  });

  it("detects latency, missing sample windows, replication failure and thin provisioning risk", () => {
    const latency = parseStorageSanPayload({
      payload: loadJsonFixture("storage-san-performance-latency.json"),
      rvtoolsDatastores,
      proxmoxSummary,
    });
    const noWindow = parseStorageSanPayload({
      payload: loadJsonFixture("storage-san-no-performance-window.json"),
      rvtoolsDatastores,
      proxmoxSummary,
    });
    const replicationFailed = parseStorageSanPayload({
      payload: loadJsonFixture("storage-san-replication-failed.json"),
      rvtoolsDatastores,
      proxmoxSummary,
    });
    const thinRisk = parseStorageSanPayload({
      payload: loadJsonFixture("storage-san-thin-provisioning-risk.json"),
      rvtoolsDatastores,
      proxmoxSummary,
    });

    expect(latency.summary.readiness.storageReadinessStatus).toBe("storage_requires_remediation");
    expect(noWindow.summary.readiness.storageReadinessStatus).toBe("storage_partially_ready");
    expect(replicationFailed.summary.readiness.storageReadinessStatus).toBe("storage_requires_remediation");
    expect(thinRisk.summary.readiness.storageReadinessStatus).toBe("storage_requires_remediation");
  });

  it("reports unmatched datastore mappings against parsed RVTools datastores", () => {
    const result = parseStorageSanPayload({
      payload: loadJsonFixture("storage-san-unmapped-datastores.json"),
      rvtoolsDatastores,
      proxmoxSummary,
    });

    expect(result.summary.storageSanSummary).toMatchObject({
      unmatchedDatastoreCount: 1,
    });
    expect(result.warnings.join(" ")).toContain("could not be matched");
  });

  it("keeps Storage/SAN optional when RVTools inventory is not available yet", () => {
    const result = parseStorageSanPayload({
      payload: loadJsonFixture("storage-san-no-rvtools-yet.json"),
      rvtoolsDatastores: [],
      proxmoxSummary,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.parsed_with_warnings);
    expect(result.warnings.join(" ")).toContain("before RVTools inventory");
  });

  it("fails missing schema and malformed JSON safely", async () => {
    const missingSchema = parseStorageSanPayload({
      payload: loadJsonFixture("storage-san-missing-schema.json"),
      rvtoolsDatastores,
      proxmoxSummary,
    });
    readEvidenceFileMock.mockResolvedValueOnce(
      Buffer.from(loadTextFixture("storage-san-malformed.json"), "utf8"),
    );

    const malformed = await createStorageSanParser().parse({
      assessmentId: "assessment_1",
      moduleKey: EvidenceModuleKey.storage_san,
      evidenceFileId: "file_1",
      filePath: "synthetic/storage-san.json",
      inputType: EvidenceModuleSourceType.json,
    });

    expect(missingSchema.status).toBe(EvidenceParseResultStatus.failed);
    expect(missingSchema.errors[0]).toContain("Unsupported or missing schema");
    expect(malformed.status).toBe(EvidenceParseResultStatus.failed);
    expect(malformed.errors[0]).toContain("valid JSON or CSV");
  });

  it("detects secret-like payloads without storing the raw value", () => {
    const result = parseStorageSanPayload({
      payload: loadJsonFixture("storage-san-secret-leak-attempt.json"),
      rvtoolsDatastores,
      proxmoxSummary,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.failed);
    expect(JSON.stringify(result)).not.toContain("should-not-be-here");
    expect(result.errors[0]).toContain("Potential secret-like content");
  });

  it("parses CSV templates and rejects invalid CSV columns", () => {
    const healthy = parseStorageSanCsv({
      text: loadTextFixture("storage-san-healthy.csv"),
      rvtoolsDatastores,
      proxmoxSummary,
    });
    const invalidColumns = parseStorageSanCsv({
      text: loadTextFixture("storage-san-invalid-columns.csv"),
      rvtoolsDatastores,
      proxmoxSummary,
    });

    expect(healthy.status).toBe(EvidenceParseResultStatus.parsed);
    expect(healthy.summary.storageSanSummary).toMatchObject({
      arrayCount: 1,
      matchedDatastoreCount: 1,
    });
    expect(invalidColumns.status).toBe(EvidenceParseResultStatus.failed);
    expect(invalidColumns.errors[0]).toContain("missing required column");
  });

  it("uses the parser registry before metadata fallback", async () => {
    const registry = createDefaultEvidenceParserRegistry();
    const parser = registry.resolve({
      assessmentId: "assessment_1",
      moduleKey: EvidenceModuleKey.storage_san,
      evidenceFileId: "file_1",
      filePath: "synthetic/storage-san.csv",
      inputType: EvidenceModuleSourceType.csv,
    });

    expect(parser?.parserKey).toBe(STORAGE_SAN_PARSER_KEY);
  });

  it("loads RVTools datastore and Proxmox target summaries from Prisma in parser instance", async () => {
    prismaMock.parsedDatastore.findMany.mockResolvedValueOnce(rvtoolsDatastores);
    prismaMock.evidenceParseResult.findFirst.mockResolvedValueOnce({
      summaryJson: proxmoxSummary,
    });
    readEvidenceFileMock.mockResolvedValueOnce(Buffer.from(loadTextFixture("storage-san-healthy.csv"), "utf8"));

    const result = await createStorageSanParser().parse({
      assessmentId: "assessment_1",
      moduleKey: EvidenceModuleKey.storage_san,
      evidenceFileId: "file_1",
      filePath: "synthetic/storage-san.csv",
      inputType: EvidenceModuleSourceType.csv,
      originalFilename: "storage-san.csv",
    });

    expect(prismaMock.parsedDatastore.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { assessmentId: "assessment_1" },
      }),
    );
    expect(result.summary.readiness).toMatchObject({
      storageReadinessStatus: "storage_validated",
    });
  });
});
