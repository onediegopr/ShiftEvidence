import { EvidenceProcessingStatus, Prisma, type EvidenceType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ensureAssessmentOwnership } from "../assessments/assessmentService";
import { readEvidenceFile } from "../evidence/localStorageService";
import { getEvidenceFileForDownload } from "../evidence/evidenceFileService";
import { parseRvtoolsWorkbook } from "./rvtoolsParserService";

function asSafeMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return "Unable to parse RVTools evidence.";
}

async function setProcessingStatus(params: {
  evidenceFileId: string;
  status: EvidenceProcessingStatus;
  processingError?: string | null;
}) {
  await prisma.evidenceFile.update({
    where: {
      id: params.evidenceFileId,
    },
    data: {
      processingStatus: params.status,
      processingError: params.processingError ?? null,
    },
  });
}

export async function importRvtoolsEvidence(params: {
  userId: string;
  assessmentId: string;
  evidenceFileId: string;
}) {
  const assessment = await ensureAssessmentOwnership({
    userId: params.userId,
    assessmentId: params.assessmentId,
  });

  const evidenceFile = await getEvidenceFileForDownload({
    userId: params.userId,
    assessmentId: assessment.id,
    fileId: params.evidenceFileId,
  });

  if (!evidenceFile) {
    throw new Error("RVTools evidence file not found or inaccessible.");
  }

  if (evidenceFile.evidenceType !== "rvtools") {
    throw new Error("Only RVTools evidence can be parsed by this workflow.");
  }

  const startedAt = Date.now();

  await setProcessingStatus({
    evidenceFileId: evidenceFile.id,
    status: EvidenceProcessingStatus.processing,
    processingError: null,
  });

  await prisma.auditEvent.create({
    data: {
      userId: params.userId,
      workspaceId: assessment.workspaceId,
      assessmentId: assessment.id,
      eventType: "rvtools_parse_started",
      message: "Started RVTools parsing.",
      metadataJson: {
        evidenceFileId: evidenceFile.id,
        evidenceType: evidenceFile.evidenceType,
      },
    },
  });

  try {
    const fileBuffer = await readEvidenceFile(evidenceFile.relativePath);
    const parsed = parseRvtoolsWorkbook({
      buffer: fileBuffer,
      originalFilename: evidenceFile.originalFilename,
      assessmentId: assessment.id,
      evidenceFileId: evidenceFile.id,
      evidenceType: evidenceFile.evidenceType as EvidenceType,
    });

    const summary = parsed.summary;
    if (!summary) {
      throw new Error("No recognizable RVTools inventory data was found.");
    }

    await prisma.$transaction(async (tx) => {
      const vmCount = await tx.parsedVM.deleteMany({
        where: {
          assessmentId: assessment.id,
          evidenceFileId: evidenceFile.id,
        },
      });
      const hostCount = await tx.parsedHost.deleteMany({
        where: {
          assessmentId: assessment.id,
          evidenceFileId: evidenceFile.id,
        },
      });
      const datastoreCount = await tx.parsedDatastore.deleteMany({
        where: {
          assessmentId: assessment.id,
          evidenceFileId: evidenceFile.id,
        },
      });
      const snapshotCount = await tx.parsedSnapshot.deleteMany({
        where: {
          assessmentId: assessment.id,
          evidenceFileId: evidenceFile.id,
        },
      });
      const summaryCount = await tx.parsedInventorySummary.deleteMany({
        where: {
          assessmentId: assessment.id,
          evidenceFileId: evidenceFile.id,
        },
      });

      if (
        vmCount.count +
          hostCount.count +
          datastoreCount.count +
          snapshotCount.count +
          summaryCount.count >
        0
      ) {
        await tx.auditEvent.create({
          data: {
            userId: params.userId,
            workspaceId: assessment.workspaceId,
            assessmentId: assessment.id,
            eventType: "parsed_inventory_replaced",
            message: "Replaced existing parsed inventory.",
            metadataJson: {
              evidenceFileId: evidenceFile.id,
              removedVMs: vmCount.count,
              removedHosts: hostCount.count,
              removedDatastores: datastoreCount.count,
              removedSnapshots: snapshotCount.count,
              removedSummaries: summaryCount.count,
            },
          },
        });
      }

      if (parsed.parsedVMs.length > 0) {
        await tx.parsedVM.createMany({
          data: parsed.parsedVMs.map((row) => ({
            assessmentId: row.assessmentId,
            evidenceFileId: row.evidenceFileId,
            vmName: row.vmName,
            powerState: row.powerState,
            guestOs: row.guestOs,
            cpuCount: row.cpuCount,
            memoryMb: row.memoryMb,
            diskCount: row.diskCount,
            provisionedGb: row.provisionedGb,
            usedGb: row.usedGb,
            nicCount: row.nicCount,
            toolsStatus: row.toolsStatus,
            datastoreName: row.datastoreName,
            clusterName: row.clusterName,
            hostName: row.hostName,
            riskLevel: row.riskLevel,
            recommendation: row.recommendation,
            rawJson: row.rawJson as Prisma.InputJsonValue,
          })),
        });
      }

      if (parsed.parsedHosts.length > 0) {
        await tx.parsedHost.createMany({
          data: parsed.parsedHosts.map((row) => ({
            assessmentId: row.assessmentId,
            evidenceFileId: row.evidenceFileId,
            hostName: row.hostName,
            clusterName: row.clusterName,
            cpuModel: row.cpuModel,
            cpuSockets: row.cpuSockets,
            cpuCores: row.cpuCores,
            memoryGb: row.memoryGb,
            version: row.version,
            rawJson: row.rawJson as Prisma.InputJsonValue,
          })),
        });
      }

      if (parsed.parsedDatastores.length > 0) {
        await tx.parsedDatastore.createMany({
          data: parsed.parsedDatastores.map((row) => ({
            assessmentId: row.assessmentId,
            evidenceFileId: row.evidenceFileId,
            datastoreName: row.datastoreName,
            datastoreType: row.datastoreType,
            capacityGb: row.capacityGb,
            usedGb: row.usedGb,
            freeGb: row.freeGb,
            usagePercent: row.usagePercent,
            riskLevel: row.riskLevel,
            rawJson: row.rawJson as Prisma.InputJsonValue,
          })),
        });
      }

      if (parsed.parsedSnapshots.length > 0) {
        await tx.parsedSnapshot.createMany({
          data: parsed.parsedSnapshots.map((row) => ({
            assessmentId: row.assessmentId,
            evidenceFileId: row.evidenceFileId,
            vmName: row.vmName,
            snapshotName: row.snapshotName,
            createdAtSource: row.createdAtSource,
            ageDays: row.ageDays,
            sizeGb: row.sizeGb,
            riskLevel: row.riskLevel,
            rawJson: row.rawJson as Prisma.InputJsonValue,
          })),
        });
      }

      await tx.parsedInventorySummary.upsert({
        where: {
          evidenceFileId: evidenceFile.id,
        },
        create: {
          assessmentId: assessment.id,
          evidenceFileId: evidenceFile.id,
          vmCount: summary.vmCount,
          hostCount: summary.hostCount,
          datastoreCount: summary.datastoreCount,
          snapshotCount: summary.snapshotCount,
          poweredOnVmCount: summary.poweredOnVmCount,
          poweredOffVmCount: summary.poweredOffVmCount,
          totalProvisionedGb: summary.totalProvisionedGb,
          totalUsedGb: summary.totalUsedGb,
          largestVmGb: summary.largestVmGb,
          oldestSnapshotDays: summary.oldestSnapshotDays,
          parsedAt: summary.parsedAt,
          parseWarningsJson: summary.parseWarningsJson,
        },
        update: {
          assessmentId: assessment.id,
          vmCount: summary.vmCount,
          hostCount: summary.hostCount,
          datastoreCount: summary.datastoreCount,
          snapshotCount: summary.snapshotCount,
          poweredOnVmCount: summary.poweredOnVmCount,
          poweredOffVmCount: summary.poweredOffVmCount,
          totalProvisionedGb: summary.totalProvisionedGb,
          totalUsedGb: summary.totalUsedGb,
          largestVmGb: summary.largestVmGb,
          oldestSnapshotDays: summary.oldestSnapshotDays,
          parsedAt: summary.parsedAt,
          parseWarningsJson: summary.parseWarningsJson,
        },
      });

      await tx.evidenceFile.update({
        where: {
          id: evidenceFile.id,
        },
        data: {
          processingStatus: EvidenceProcessingStatus.parsed,
          processingError: null,
        },
      });

      await tx.auditEvent.create({
        data: {
          userId: params.userId,
          workspaceId: assessment.workspaceId,
          assessmentId: assessment.id,
          eventType: "inventory_summary_created",
          message: "Created preliminary parsed inventory summary.",
          metadataJson: {
            evidenceFileId: evidenceFile.id,
            vmCount: summary.vmCount,
            hostCount: summary.hostCount,
            datastoreCount: summary.datastoreCount,
            snapshotCount: summary.snapshotCount,
            warningsCount: parsed.warnings.length,
          },
        },
      });

      await tx.auditEvent.create({
        data: {
          userId: params.userId,
          workspaceId: assessment.workspaceId,
          assessmentId: assessment.id,
          eventType: "rvtools_parsed",
          message: "Parsed RVTools evidence into preliminary inventory.",
          metadataJson: {
            evidenceFileId: evidenceFile.id,
            vmCount: summary.vmCount,
            hostCount: summary.hostCount,
            datastoreCount: summary.datastoreCount,
            snapshotCount: summary.snapshotCount,
            warningsCount: parsed.warnings.length,
            durationMs: Date.now() - startedAt,
          },
        },
      });
    });

    return {
      status: "parsed" as const,
      parsed,
      evidenceFileId: evidenceFile.id,
    };
  } catch (error) {
    const message = asSafeMessage(error);

    await setProcessingStatus({
      evidenceFileId: evidenceFile.id,
      status: EvidenceProcessingStatus.failed,
      processingError: message,
    });

    await prisma.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "rvtools_parse_failed",
        message: "RVTools parsing failed.",
        metadataJson: {
          evidenceFileId: evidenceFile.id,
          error: message,
          durationMs: Date.now() - startedAt,
        },
      },
    });

    throw new Error(message, { cause: error });
  }
}
