import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import {
  EvidenceModuleKey,
  EvidenceModuleSourceType,
  EvidenceParseResultStatus,
} from "@prisma/client";
import {
  createDefaultEvidenceParserRegistry,
} from "../../src/server/evidence/evidenceParserRegistry";
import {
  VMWARE_ENRICHMENT_PARSER_KEY,
  createVmwareEnrichmentParser,
  parseVmwareEnrichmentPayload,
} from "../../src/server/evidence/parsers/vmwareEnrichmentParser";

const prismaMock = vi.hoisted(() => ({
  parsedVM: {
    findMany: vi.fn(),
  },
}));

const readEvidenceFileMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("../../src/server/evidence/localStorageService", () => ({
  readEvidenceFile: readEvidenceFileMock,
}));

const fixtureDir = path.join(process.cwd(), "tests", "fixtures", "evidence", "vmware-enrichment");

function loadFixture(name: string) {
  return JSON.parse(readFileSync(path.join(fixtureDir, name), "utf8"));
}

const rvtoolsVms = [
  {
    vmName: "app-01",
    rawJson: {
      instanceUuid: "11111111-1111-1111-1111-111111111111",
      biosUuid: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    },
  },
  {
    vmName: "db-01",
    rawJson: {
      instanceUuid: "x-not-used",
      biosUuid: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    },
  },
  {
    vmName: "web-02",
    rawJson: {},
  },
  {
    vmName: "legacy-01",
    rawJson: {
      biosUuid: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    },
  },
];

describe("vmware enrichment parser", () => {
  it("parses valid small clean fixture", () => {
    const result = parseVmwareEnrichmentPayload({
      payload: loadFixture("vmware-enrichment-small-clean.json"),
      rvtoolsVms,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.parsed);
    expect(result.parserKey).toBe(VMWARE_ENRICHMENT_PARSER_KEY);
    expect(result.summary.vmwareEnrichmentSummary).toMatchObject({
      vmCount: 2,
      matchedVmCount: 2,
      unmatchedVmCount: 0,
      taggedVmCount: 2,
    });
  });

  it("parses medium mixed fixture with warnings", () => {
    const result = parseVmwareEnrichmentPayload({
      payload: loadFixture("vmware-enrichment-medium-mixed.json"),
      rvtoolsVms,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.parsed_with_warnings);
    expect(result.summary.matching).toMatchObject({
      matchedByInstanceUuid: 1,
      matchedByBiosUuid: 2,
      matchedByName: 1,
    });
  });

  it("detects snapshot-heavy risk signals", () => {
    const result = parseVmwareEnrichmentPayload({
      payload: loadFixture("vmware-enrichment-snapshot-heavy.json"),
      rvtoolsVms: [],
    });

    expect(result.summary.vmwareEnrichmentSummary).toMatchObject({
      oldSnapshotCount: 3,
      snapshotVmCount: 2,
    });
    expect(result.warnings).toContain("VMware enrichment uploaded before RVTools inventory; matching is deferred/limited.");
  });

  it("parses tags and resource pools", () => {
    const result = parseVmwareEnrichmentPayload({
      payload: loadFixture("vmware-enrichment-tags-resourcepools.json"),
      rvtoolsVms: [],
    });

    expect(result.summary.vmwareEnrichmentSummary).toMatchObject({
      taggedVmCount: 3,
      resourcePoolCount: 2,
      tagAssignmentCount: 5,
    });
  });

  it("handles DRS rules", () => {
    const result = parseVmwareEnrichmentPayload({
      payload: loadFixture("vmware-enrichment-drs-rules.json"),
      rvtoolsVms,
    });

    expect(result.summary.vmwareEnrichmentSummary).toMatchObject({
      drsRuleCount: 1,
    });
  });

  it("reports unmatched VMs", () => {
    const result = parseVmwareEnrichmentPayload({
      payload: loadFixture("vmware-enrichment-unmatched-vms.json"),
      rvtoolsVms,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.parsed_with_warnings);
    expect(result.summary.vmwareEnrichmentSummary).toMatchObject({
      matchedVmCount: 0,
      unmatchedVmCount: 2,
    });
  });

  it("fails missing schema", () => {
    const result = parseVmwareEnrichmentPayload({
      payload: loadFixture("vmware-enrichment-missing-schema.json"),
      rvtoolsVms,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.failed);
    expect(result.errors[0]).toContain("Unsupported or missing schema");
  });

  it("fails malformed JSON through parser instance", async () => {
    readEvidenceFileMock.mockResolvedValueOnce(
      Buffer.from(readFileSync(path.join(fixtureDir, "vmware-enrichment-malformed.json"), "utf8")),
    );

    const result = await createVmwareEnrichmentParser().parse({
      assessmentId: "assessment_1",
      moduleKey: EvidenceModuleKey.vmware_enrichment,
      evidenceFileId: "file_1",
      filePath: "synthetic/file.json",
      inputType: EvidenceModuleSourceType.json,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.failed);
    expect(result.errors[0]).toContain("valid JSON");
  });

  it("detects secret leak attempt without exposing secret value", () => {
    const result = parseVmwareEnrichmentPayload({
      payload: loadFixture("vmware-enrichment-secret-leak-attempt.json"),
      rvtoolsVms,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.failed);
    expect(JSON.stringify(result)).not.toContain("should-not-be-here");
    expect(result.errors[0]).toContain("Potential secret-like content");
  });

  it("handles no RVTools inventory gracefully", () => {
    const result = parseVmwareEnrichmentPayload({
      payload: loadFixture("vmware-enrichment-no-rvtools-yet.json"),
      rvtoolsVms: [],
    });

    expect(result.status).toBe(EvidenceParseResultStatus.parsed_with_warnings);
    expect(result.warnings[0]).toContain("matching is deferred");
  });

  it("uses matching priority instanceUuid, then biosUuid, then name", () => {
    const result = parseVmwareEnrichmentPayload({
      payload: loadFixture("vmware-enrichment-medium-mixed.json"),
      rvtoolsVms,
    });

    expect(result.summary.matching).toMatchObject({
      matchedByInstanceUuid: 1,
      matchedByBiosUuid: 2,
      matchedByName: 1,
    });
  });

  it("parser registry resolves VMware parser before metadata fallback", () => {
    const registry = createDefaultEvidenceParserRegistry();
    const parser = registry.resolve({
      assessmentId: "assessment_1",
      moduleKey: EvidenceModuleKey.vmware_enrichment,
      evidenceFileId: "file_1",
      filePath: "synthetic/file.json",
      inputType: EvidenceModuleSourceType.json,
    });

    expect(parser?.parserKey).toBe(VMWARE_ENRICHMENT_PARSER_KEY);
  });
});
