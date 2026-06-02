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
  BACKUP_EVIDENCE_PARSER_KEY,
  createBackupEvidenceParser,
  parseBackupEvidencePayload,
} from "../../src/server/evidence/parsers/backupEvidenceParser";

const prismaMock = vi.hoisted(() => ({
  parsedVM: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
}));

const readEvidenceFileMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("../../src/server/evidence/localStorageService", () => ({
  readEvidenceFile: readEvidenceFileMock,
}));

const fixtureDir = path.join(process.cwd(), "tests", "fixtures", "evidence", "backup-evidence");
const now = new Date("2026-06-01T12:00:00Z");

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

describe("backup evidence parser", () => {
  it("parses healthy fixture without claiming restore success", () => {
    const result = parseBackupEvidencePayload({
      payload: loadFixture("backup-evidence-healthy.json"),
      rvtoolsVms,
      now,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.parsed_with_warnings);
    expect(result.parserKey).toBe(BACKUP_EVIDENCE_PARSER_KEY);
    expect(result.summary.backupEvidenceSummary).toMatchObject({
      jobCount: 2,
      protectedObjectCount: 4,
      matchedVmCount: 4,
      unprotectedVmCount: 0,
    });
    expect(result.summary.readiness).toMatchObject({
      backupReadinessStatus: "backup_partially_ready",
    });
    expect(result.warnings.join(" ")).toContain("restore success");
  });

  it("parses partial coverage", () => {
    const result = parseBackupEvidencePayload({
      payload: loadFixture("backup-evidence-partial-coverage.json"),
      rvtoolsVms,
      now,
    });

    expect(result.summary.backupEvidenceSummary).toMatchObject({
      matchedVmCount: 2,
      unprotectedVmCount: 2,
    });
    expect(result.summary.readiness).toMatchObject({
      backupReadinessStatus: "backup_requires_remediation",
    });
  });

  it("detects no restore points", () => {
    const result = parseBackupEvidencePayload({
      payload: loadFixture("backup-evidence-no-restore-points.json"),
      rvtoolsVms,
      now,
    });

    expect(result.summary.readiness).toMatchObject({
      backupReadinessStatus: "backup_insufficient",
    });
    expect(JSON.stringify(result.summary.readiness)).toContain("restore points");
  });

  it("detects stale restore points", () => {
    const result = parseBackupEvidencePayload({
      payload: loadFixture("backup-evidence-stale-restore-points.json"),
      rvtoolsVms,
      now,
    });

    expect(result.summary.backupEvidenceSummary).toMatchObject({ staleBackupCount: 1 });
    expect(result.warnings.join(" ")).toContain("stale");
  });

  it("detects failed jobs", () => {
    const result = parseBackupEvidencePayload({
      payload: loadFixture("backup-evidence-failed-jobs.json"),
      rvtoolsVms,
      now,
    });

    expect(result.summary.backupEvidenceSummary).toMatchObject({ failedJobCount: 1 });
    expect(result.warnings.join(" ")).toContain("failed");
  });

  it("detects disabled jobs", () => {
    const result = parseBackupEvidencePayload({
      payload: loadFixture("backup-evidence-disabled-jobs.json"),
      rvtoolsVms,
      now,
    });

    expect(result.summary.backupEvidenceSummary).toMatchObject({ disabledJobCount: 1 });
    expect(result.warnings.join(" ")).toContain("disabled");
  });

  it("detects repository pressure", () => {
    const result = parseBackupEvidencePayload({
      payload: loadFixture("backup-evidence-repository-pressure.json"),
      rvtoolsVms,
      now,
    });

    expect(result.summary.backupEvidenceSummary).toMatchObject({ repositoryPressureCount: 1 });
    expect(result.warnings.join(" ")).toContain("repositories");
  });

  it("parses backup copy signals", () => {
    const result = parseBackupEvidencePayload({
      payload: loadFixture("backup-evidence-with-backup-copy.json"),
      rvtoolsVms,
      now,
    });

    expect(result.summary.backupEvidenceSummary).toMatchObject({ backupCopyJobCount: 1 });
  });

  it("reports unmatched VMs", () => {
    const result = parseBackupEvidencePayload({
      payload: loadFixture("backup-evidence-unmatched-vms.json"),
      rvtoolsVms,
      now,
    });

    expect(result.summary.backupEvidenceSummary).toMatchObject({
      matchedVmCount: 0,
      unmatchedProtectedObjectCount: 2,
    });
    expect(result.warnings.join(" ")).toContain("could not be matched");
  });

  it("fails missing schema", () => {
    const result = parseBackupEvidencePayload({
      payload: loadFixture("backup-evidence-missing-schema.json"),
      rvtoolsVms,
      now,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.failed);
    expect(result.errors[0]).toContain("Unsupported or missing schema");
  });

  it("fails malformed JSON through parser instance", async () => {
    readEvidenceFileMock.mockResolvedValueOnce(
      Buffer.from(readFileSync(path.join(fixtureDir, "backup-evidence-malformed.json"), "utf8")),
    );

    const result = await createBackupEvidenceParser().parse({
      assessmentId: "assessment_1",
      moduleKey: EvidenceModuleKey.backup_evidence,
      evidenceFileId: "file_1",
      filePath: "synthetic/backup-evidence.json",
      inputType: EvidenceModuleSourceType.json,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.failed);
    expect(result.errors[0]).toContain("valid JSON");
  });

  it("detects secret leak attempt without exposing secret value", () => {
    const result = parseBackupEvidencePayload({
      payload: loadFixture("backup-evidence-secret-leak-attempt.json"),
      rvtoolsVms,
      now,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.failed);
    expect(JSON.stringify(result)).not.toContain("should-not-be-here");
    expect(result.errors[0]).toContain("Potential secret-like content");
  });

  it("handles no RVTools inventory gracefully", () => {
    const result = parseBackupEvidencePayload({
      payload: loadFixture("backup-evidence-no-rvtools-yet.json"),
      rvtoolsVms: [],
      now,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.parsed_with_warnings);
    expect(result.summary.backupEvidenceSummary).toMatchObject({
      rvtoolsVmCount: 0,
    });
    expect(result.warnings.join(" ")).toContain("RVTools");
  });

  it("parser registry resolves Backup parser before metadata fallback", () => {
    const registry = createDefaultEvidenceParserRegistry();
    const parser = registry.resolve({
      assessmentId: "assessment_1",
      moduleKey: EvidenceModuleKey.backup_evidence,
      evidenceFileId: "file_1",
      filePath: "synthetic/backup-evidence.json",
      inputType: EvidenceModuleSourceType.json,
    });

    expect(parser?.parserKey).toBe(BACKUP_EVIDENCE_PARSER_KEY);
  });

  it("unsupported module still fails safely", () => {
    const parser = createBackupEvidenceParser();
    expect(parser.supportedModules).not.toContain(EvidenceModuleKey.proxmox_target);
  });
});
