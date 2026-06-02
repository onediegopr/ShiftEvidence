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
  APPLICATION_DEPENDENCY_PARSER_KEY,
  createApplicationDependencyParser,
  parseApplicationDependencyCsv,
  parseApplicationDependencyPayload,
} from "../../src/server/evidence/parsers/applicationDependencyParser";

const prismaMock = vi.hoisted(() => ({
  parsedVM: {
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

const fixtureDir = path.join(process.cwd(), "tests", "fixtures", "evidence", "application-dependencies");
const rvtoolsVms = [
  { vmName: "erp-web-01", rawJson: { instanceUuid: "11111111-1111-1111-1111-111111111111" } },
  { vmName: "erp-db-01", rawJson: { biosUuid: "22222222-2222-2222-2222-222222222222" } },
];
const vmwareSummary = { signals: { tagSignals: [{ vmName: "erp-web-01" }], resourcePoolSignals: [] } };

function loadJsonFixture(name: string) {
  return JSON.parse(readFileSync(path.join(fixtureDir, name), "utf8"));
}

function loadTextFixture(name: string) {
  return readFileSync(path.join(fixtureDir, name), "utf8");
}

describe("Application Dependency parser", () => {
  it("parses complete JSON as functional wave candidate without overclaiming validation", () => {
    const result = parseApplicationDependencyPayload({
      payload: loadJsonFixture("application-dependencies-complete.json"),
      rvtoolsVms,
      vmwareSummary,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.parsed_with_warnings);
    expect(result.parserKey).toBe(APPLICATION_DEPENDENCY_PARSER_KEY);
    expect(result.summary.applicationDependencySummary).toMatchObject({
      applicationCount: 1,
      dependencyCount: 1,
      matchedVmCount: 2,
      unmatchedVmCount: 0,
      functionalWaveCandidateCount: 2,
    });
    expect(result.summary.readiness).toMatchObject({
      dependencyReadinessStatus: "dependency_partially_ready",
      wavePlanningMode: "functional_candidate",
    });
    expect(result.warnings.join(" ")).toContain("customer review");
  });

  it("parses complete CSV", () => {
    const result = parseApplicationDependencyCsv({
      text: loadTextFixture("application-dependencies-complete.csv"),
      rvtoolsVms,
      vmwareSummary,
    });

    expect(result.summary.applicationDependencySummary).toMatchObject({
      applicationCount: 1,
      dependencyCount: 1,
      matchedVmCount: 2,
    });
  });

  it("parses partial mapping and technical-only limitation", () => {
    const partial = parseApplicationDependencyPayload({
      payload: loadJsonFixture("application-dependencies-partial.json"),
      rvtoolsVms: [{ vmName: "portal-web-01", rawJson: {} }],
      vmwareSummary,
    });
    const technical = parseApplicationDependencyPayload({
      payload: loadJsonFixture("application-dependencies-technical-only.json"),
      rvtoolsVms: [{ vmName: "misc-01", rawJson: {} }],
      vmwareSummary,
    });

    expect(partial.summary.readiness.dependencyReadinessStatus).toBe("dependency_partially_ready");
    expect(technical.summary.readiness.dependencyReadinessStatus).toBe("dependency_insufficient");
    expect(technical.summary.readiness.wavePlanningMode).toBe("technical_only");
  });

  it("detects critical apps without owner and missing maintenance windows", () => {
    const noOwner = parseApplicationDependencyPayload({
      payload: loadJsonFixture("application-dependencies-critical-no-owner.json"),
      rvtoolsVms: [{ vmName: "pay-db-01", rawJson: {} }],
      vmwareSummary,
    });
    const noWindow = parseApplicationDependencyPayload({
      payload: loadJsonFixture("application-dependencies-no-maintenance-window.json"),
      rvtoolsVms: [{ vmName: "crm-app-01", rawJson: {} }],
      vmwareSummary,
    });

    expect(noOwner.summary.readiness.dependencyReadinessStatus).toBe("dependency_insufficient");
    expect(noOwner.summary.applicationDependencySummary.criticalAppWithoutOwnerCount).toBe(1);
    expect(noWindow.summary.readiness.dependencyReadinessStatus).toBe("dependency_insufficient");
    expect(noWindow.summary.applicationDependencySummary.missingMaintenanceWindowCount).toBe(1);
  });

  it("detects circular dependencies and unmatched VMs", () => {
    const circular = parseApplicationDependencyPayload({
      payload: loadJsonFixture("application-dependencies-circular.json"),
      rvtoolsVms: [{ vmName: "bill-app-01", rawJson: {} }, { vmName: "bill-mq-01", rawJson: {} }],
      vmwareSummary,
    });
    const unmatched = parseApplicationDependencyPayload({
      payload: loadJsonFixture("application-dependencies-unmatched-vms.json"),
      rvtoolsVms,
      vmwareSummary,
    });

    expect(circular.summary.applicationDependencySummary.circularDependencyCount).toBe(1);
    expect(circular.summary.readiness.dependencyReadinessStatus).toBe("dependency_requires_remediation");
    expect(unmatched.summary.applicationDependencySummary.unmatchedVmCount).toBe(1);
    expect(unmatched.warnings.join(" ")).toContain("could not be matched");
  });

  it("handles no RVTools inventory gracefully", () => {
    const result = parseApplicationDependencyPayload({
      payload: loadJsonFixture("application-dependencies-no-rvtools-yet.json"),
      rvtoolsVms: [],
      vmwareSummary,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.parsed_with_warnings);
    expect(result.warnings.join(" ")).toContain("before RVTools inventory");
  });

  it("fails missing schema, malformed JSON and invalid CSV columns safely", async () => {
    const missingSchema = parseApplicationDependencyPayload({
      payload: loadJsonFixture("application-dependencies-missing-schema.json"),
      rvtoolsVms,
      vmwareSummary,
    });
    const invalidColumns = parseApplicationDependencyCsv({
      text: loadTextFixture("application-dependencies-invalid-columns.csv"),
      rvtoolsVms,
      vmwareSummary,
    });
    readEvidenceFileMock.mockResolvedValueOnce(
      Buffer.from(loadTextFixture("application-dependencies-malformed.json"), "utf8"),
    );
    const malformed = await createApplicationDependencyParser().parse({
      assessmentId: "assessment_1",
      moduleKey: EvidenceModuleKey.application_dependency,
      evidenceFileId: "file_1",
      filePath: "synthetic/application-dependencies.json",
      inputType: EvidenceModuleSourceType.json,
    });

    expect(missingSchema.status).toBe(EvidenceParseResultStatus.failed);
    expect(missingSchema.errors[0]).toContain("Unsupported or missing schema");
    expect(invalidColumns.status).toBe(EvidenceParseResultStatus.failed);
    expect(invalidColumns.errors[0]).toContain("missing required column");
    expect(malformed.status).toBe(EvidenceParseResultStatus.failed);
    expect(malformed.errors[0]).toContain("valid JSON or CSV");
  });

  it("detects secret leak attempts without exposing values", () => {
    const result = parseApplicationDependencyPayload({
      payload: loadJsonFixture("application-dependencies-secret-leak-attempt.json"),
      rvtoolsVms,
      vmwareSummary,
    });

    expect(result.status).toBe(EvidenceParseResultStatus.failed);
    expect(JSON.stringify(result)).not.toContain("should-not-be-here");
    expect(result.errors[0]).toContain("Potential secret-like content");
  });

  it("uses parser registry before metadata fallback", () => {
    const registry = createDefaultEvidenceParserRegistry();
    const parser = registry.resolve({
      assessmentId: "assessment_1",
      moduleKey: EvidenceModuleKey.application_dependency,
      evidenceFileId: "file_1",
      filePath: "synthetic/application-dependencies.csv",
      inputType: EvidenceModuleSourceType.csv,
    });

    expect(parser?.parserKey).toBe(APPLICATION_DEPENDENCY_PARSER_KEY);
  });

  it("loads RVTools and VMware Enrichment summaries from Prisma in parser instance", async () => {
    prismaMock.parsedVM.findMany.mockResolvedValueOnce(rvtoolsVms);
    prismaMock.evidenceParseResult.findFirst.mockResolvedValueOnce({
      summaryJson: vmwareSummary,
    });
    readEvidenceFileMock.mockResolvedValueOnce(
      Buffer.from(loadTextFixture("application-dependencies-complete.csv"), "utf8"),
    );

    const result = await createApplicationDependencyParser().parse({
      assessmentId: "assessment_1",
      moduleKey: EvidenceModuleKey.application_dependency,
      evidenceFileId: "file_1",
      filePath: "synthetic/application-dependencies.csv",
      inputType: EvidenceModuleSourceType.csv,
      originalFilename: "application-dependencies.csv",
    });

    expect(prismaMock.parsedVM.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { assessmentId: "assessment_1" },
      }),
    );
    expect(result.summary.applicationDependencySummary).toMatchObject({
      matchedVmCount: 2,
    });
  });
});
