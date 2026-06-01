import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  EvidenceModuleConfidenceLevel,
  EvidenceModuleKey,
  EvidenceModuleSourceType,
  EvidenceModuleStatus,
  EvidenceParseResultStatus,
} from "@prisma/client";

const prismaMock = vi.hoisted(() => ({
  assessmentEvidenceModule: {
    findMany: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
  },
  evidenceUpload: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  evidenceParseResult: {
    create: vi.fn(),
  },
  auditEvent: {
    create: vi.fn(),
  },
}));

vi.mock("../../src/lib/prisma", () => ({
  prisma: prismaMock,
}));

import {
  associateEvidenceFileWithModule,
  getEvidenceCompletenessSummaryFromModuleRecords,
  initializeEvidenceModulesForAssessment,
  markEvidenceModuleSkipped,
  parseEvidenceUpload,
} from "../../src/server/evidence/evidenceExpansionService";

describe("evidence expansion service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.assessmentEvidenceModule.createMany.mockResolvedValue({ count: 0 });
    prismaMock.assessmentEvidenceModule.update.mockResolvedValue({});
    prismaMock.evidenceUpload.create.mockResolvedValue({
      id: "upload_1",
      assessmentId: "assessment_1",
      moduleKey: EvidenceModuleKey.backup_evidence,
    });
    prismaMock.evidenceParseResult.create.mockResolvedValue({ id: "parse_1" });
    prismaMock.auditEvent.create.mockResolvedValue({});
  });

  it("initializes missing evidence modules idempotently", async () => {
    prismaMock.assessmentEvidenceModule.findMany.mockResolvedValueOnce(
      Object.values(EvidenceModuleKey).map((moduleKey) => ({ moduleKey })),
    );

    await initializeEvidenceModulesForAssessment({
      assessmentId: "assessment_1",
      userId: "user_1",
      workspaceId: "workspace_1",
    });

    expect(prismaMock.assessmentEvidenceModule.createMany).not.toHaveBeenCalled();
    expect(prismaMock.auditEvent.create).not.toHaveBeenCalled();
  });

  it("creates missing module rows when an assessment has no module state yet", async () => {
    prismaMock.assessmentEvidenceModule.findMany.mockResolvedValueOnce([]);

    await initializeEvidenceModulesForAssessment({
      assessmentId: "assessment_1",
      userId: "user_1",
      workspaceId: "workspace_1",
    });

    expect(prismaMock.assessmentEvidenceModule.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            assessmentId: "assessment_1",
            moduleKey: EvidenceModuleKey.backup_evidence,
            status: EvidenceModuleStatus.not_provided,
          }),
        ]),
        skipDuplicates: true,
      }),
    );
    expect(prismaMock.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: "evidence_module_initialized",
        }),
      }),
    );
  });

  it("associates an evidence file to an optional module", async () => {
    prismaMock.assessmentEvidenceModule.findMany.mockResolvedValueOnce([]);

    const upload = await associateEvidenceFileWithModule({
      userId: "user_1",
      workspaceId: "workspace_1",
      assessmentId: "assessment_1",
      evidenceFileId: "file_1",
      moduleKey: EvidenceModuleKey.backup_evidence,
      originalFilename: "backup.csv",
    });

    expect(upload.id).toBe("upload_1");
    expect(prismaMock.evidenceUpload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          evidenceFileId: "file_1",
          moduleKey: EvidenceModuleKey.backup_evidence,
          uploadedByUserId: "user_1",
        }),
      }),
    );
    expect(prismaMock.assessmentEvidenceModule.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: EvidenceModuleStatus.uploaded,
          sourceType: EvidenceModuleSourceType.csv,
          lastUploadId: "upload_1",
        }),
      }),
    );
  });

  it("persists parser warnings and errors and updates failed module status", async () => {
    prismaMock.evidenceUpload.findUnique.mockResolvedValueOnce({
      id: "upload_1",
      assessmentId: "assessment_1",
      evidenceFileId: "file_1",
      moduleKey: EvidenceModuleKey.backup_evidence,
      originalFilename: "backup.json",
      schemaVersion: null,
      evidenceFile: {
        id: "file_1",
        relativePath: "private/file.json",
        mimeType: "application/json",
      },
    });
    prismaMock.evidenceParseResult.create.mockResolvedValueOnce({ id: "parse_1" });

    await parseEvidenceUpload({
      userId: "user_1",
      workspaceId: "workspace_1",
      evidenceUploadId: "upload_1",
      registry: {
        parse: vi.fn().mockResolvedValue({
          status: EvidenceParseResultStatus.failed,
          summary: { ok: false },
          warnings: ["warning"],
          errors: ["failed"],
          normalizedEntities: {},
          parserKey: "test-parser",
          parserVersion: "1.0.0",
        }),
      } as never,
    });

    expect(prismaMock.evidenceParseResult.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          warningsJson: ["warning"],
          errorsJson: ["failed"],
          status: EvidenceParseResultStatus.failed,
        }),
      }),
    );
    expect(prismaMock.assessmentEvidenceModule.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: EvidenceModuleStatus.failed,
          confidenceLevel: EvidenceModuleConfidenceLevel.none,
          lastParseResultId: "parse_1",
        }),
      }),
    );
  });

  it("marks an optional module as skipped without blocking base assessment", async () => {
    prismaMock.assessmentEvidenceModule.findMany.mockResolvedValueOnce(
      Object.values(EvidenceModuleKey).map((moduleKey) => ({ moduleKey })),
    );
    prismaMock.assessmentEvidenceModule.update.mockResolvedValueOnce({
      status: EvidenceModuleStatus.skipped,
    });

    await markEvidenceModuleSkipped({
      userId: "user_1",
      workspaceId: "workspace_1",
      assessmentId: "assessment_1",
      moduleKey: EvidenceModuleKey.backup_evidence,
    });

    expect(prismaMock.assessmentEvidenceModule.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: EvidenceModuleStatus.skipped,
          confidenceLevel: EvidenceModuleConfidenceLevel.none,
        }),
      }),
    );
  });

  it("builds missing evidence warnings without requiring DB records", () => {
    const summary = getEvidenceCompletenessSummaryFromModuleRecords({
      assessmentId: "assessment_1",
      modules: [],
    });

    expect(summary.completionPercent).toBe(0);
    expect(summary.missingEvidenceWarnings).toContain("Backup recoverability is not validated.");
  });
});
