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
  PROXMOX_TARGET_PARSER_KEY,
  createProxmoxTargetParser,
  parseProxmoxTargetPayload,
} from "../../src/server/evidence/parsers/proxmoxTargetParser";

const prismaMock = vi.hoisted(() => ({
  parsedVM: {
    count: vi.fn(),
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

const fixtureDir = path.join(process.cwd(), "tests", "fixtures", "evidence", "proxmox-target");

function loadFixture(name: string) {
  return JSON.parse(readFileSync(path.join(fixtureDir, name), "utf8"));
}

describe("Proxmox target parser", () => {
  it("parses single-node basic fixture with limited readiness", () => {
    const result = parseProxmoxTargetPayload({
      payload: loadFixture("proxmox-target-single-node-basic.json"),
      rvtoolsVmCount: 0,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.parsed_with_warnings);
    expect(result.parserKey).toBe(PROXMOX_TARGET_PARSER_KEY);
    expect(result.summary.proxmoxTargetSummary).toMatchObject({
      nodeCount: 1,
      onlineNodeCount: 1,
      zfsDetected: true,
    });
    expect(result.summary.readiness).toMatchObject({
      targetStatus: "target_partially_ready",
    });
  });

  it("parses three-node healthy fixture as validated when RVTools exists", () => {
    const result = parseProxmoxTargetPayload({
      payload: loadFixture("proxmox-target-three-node-healthy.json"),
      rvtoolsVmCount: 4,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.parsed_with_warnings);
    expect(result.summary.proxmoxTargetSummary).toMatchObject({
      nodeCount: 3,
      onlineNodeCount: 3,
      pbsDetected: true,
      cephDetected: true,
    });
    expect(result.summary.readiness).toMatchObject({
      targetStatus: "target_validated",
      confidence: "high",
    });
  });

  it("detects storage constrained target", () => {
    const result = parseProxmoxTargetPayload({
      payload: loadFixture("proxmox-target-storage-constrained.json"),
      rvtoolsVmCount: 2,
    });

    expect(result.summary.readiness).toMatchObject({
      targetStatus: "target_insufficient",
    });
    expect(JSON.stringify(result.summary.readiness)).toContain("Storage");
  });

  it("detects no PBS warning", () => {
    const result = parseProxmoxTargetPayload({
      payload: loadFixture("proxmox-target-no-pbs.json"),
      rvtoolsVmCount: 2,
    });

    expect(result.summary.proxmoxTargetSummary).toMatchObject({ pbsDetected: false });
    expect(result.warnings.join(" ")).toContain("PBS");
  });

  it("detects HA disabled warning", () => {
    const result = parseProxmoxTargetPayload({
      payload: loadFixture("proxmox-target-ha-disabled.json"),
      rvtoolsVmCount: 2,
    });

    expect(result.summary.proxmoxTargetSummary).toMatchObject({ haConfigured: false });
    expect(result.warnings.join(" ")).toContain("HA");
  });

  it("parses Ceph healthy", () => {
    const result = parseProxmoxTargetPayload({
      payload: loadFixture("proxmox-target-ceph-healthy.json"),
      rvtoolsVmCount: 2,
    });

    expect(result.summary.proxmoxTargetSummary).toMatchObject({
      cephDetected: true,
      cephHealth: "health_ok",
    });
  });

  it("detects Ceph unhealthy remediation", () => {
    const result = parseProxmoxTargetPayload({
      payload: loadFixture("proxmox-target-ceph-unhealthy.json"),
      rvtoolsVmCount: 2,
    });

    expect(result.summary.readiness).toMatchObject({
      targetStatus: "target_requires_remediation",
    });
    expect(result.warnings.join(" ")).toContain("Ceph");
  });

  it("detects network limited warning", () => {
    const result = parseProxmoxTargetPayload({
      payload: loadFixture("proxmox-target-network-limited.json"),
      rvtoolsVmCount: 2,
    });

    expect(result.summary.readiness).toMatchObject({
      targetStatus: "target_insufficient",
    });
    expect(JSON.stringify(result.summary.readiness)).toContain("bridges");
  });

  it("fails missing schema", () => {
    const result = parseProxmoxTargetPayload({
      payload: loadFixture("proxmox-target-missing-schema.json"),
      rvtoolsVmCount: 2,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.failed);
    expect(result.errors[0]).toContain("Unsupported or missing schema");
  });

  it("fails malformed JSON through parser instance", async () => {
    readEvidenceFileMock.mockResolvedValueOnce(
      Buffer.from(readFileSync(path.join(fixtureDir, "proxmox-target-malformed.json"), "utf8")),
    );

    const result = await createProxmoxTargetParser().parse({
      assessmentId: "assessment_1",
      moduleKey: EvidenceModuleKey.proxmox_target,
      evidenceFileId: "file_1",
      filePath: "synthetic/proxmox-target.json",
      inputType: EvidenceModuleSourceType.json,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.failed);
    expect(result.errors[0]).toContain("valid JSON");
  });

  it("detects secret leak attempt without exposing secret value", () => {
    const result = parseProxmoxTargetPayload({
      payload: loadFixture("proxmox-target-secret-leak-attempt.json"),
      rvtoolsVmCount: 2,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.failed);
    expect(JSON.stringify(result)).not.toContain("should-not-be-here");
    expect(result.errors[0]).toContain("Potential secret-like content");
  });

  it("handles no RVTools inventory gracefully", () => {
    const result = parseProxmoxTargetPayload({
      payload: loadFixture("proxmox-target-no-rvtools-yet.json"),
      rvtoolsVmCount: 0,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.parsed_with_warnings);
    expect(result.summary.sizingComparison).toMatchObject({
      preliminary: true,
      rvtoolsVmCount: 0,
    });
    expect(result.warnings.join(" ")).toContain("RVTools");
  });

  it("parser registry resolves Proxmox parser before metadata fallback", () => {
    const registry = createDefaultEvidenceParserRegistry();
    const parser = registry.resolve({
      assessmentId: "assessment_1",
      moduleKey: EvidenceModuleKey.proxmox_target,
      evidenceFileId: "file_1",
      filePath: "synthetic/proxmox-target.json",
      inputType: EvidenceModuleSourceType.json,
    });

    expect(parser?.parserKey).toBe(PROXMOX_TARGET_PARSER_KEY);
  });

  it("unsupported module still fails safely", async () => {
    const parser = createProxmoxTargetParser();
    expect(parser.supportedModules).not.toContain(EvidenceModuleKey.backup_evidence);
  });
});
