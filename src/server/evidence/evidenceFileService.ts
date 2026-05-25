import { EvidenceProcessingStatus, EvidenceType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ensureAssessmentOwnership } from "../assessments/assessmentService";

export type EvidenceUploadStatus = "not_uploaded_yet" | "uploaded" | "parsed" | "deleted" | "failed";

export async function listEvidenceFilesForAssessment(params: {
  userId: string;
  assessmentId: string;
}) {
  const assessment = await ensureAssessmentOwnership(params);

  return prisma.evidenceFile.findMany({
    where: {
      assessmentId: assessment.id,
    },
    orderBy: [
      {
        deletedAt: "asc",
      },
      {
        uploadedAt: "desc",
      },
    ],
  });
}

export async function getEvidenceFileForDownload(params: {
  userId: string;
  assessmentId: string;
  fileId: string;
}) {
  const assessment = await ensureAssessmentOwnership(params);

  return prisma.evidenceFile.findFirst({
    where: {
      id: params.fileId,
      assessmentId: assessment.id,
      deletedAt: null,
      processingStatus: {
        not: EvidenceProcessingStatus.deleted,
      },
    },
  });
}

export async function createEvidenceFileRecord(params: {
  userId: string;
  assessmentId: string;
  evidenceType: EvidenceType;
  originalFilename: string;
  storedFilename: string;
  relativePath: string;
  fileHash: string;
  mimeType?: string | null;
  sizeBytes: number;
}) {
  const assessment = await ensureAssessmentOwnership(params);

  return prisma.$transaction(async (tx) => {
    const evidenceFile = await tx.evidenceFile.create({
      data: {
        assessmentId: assessment.id,
        workspaceId: assessment.workspaceId,
        uploadedByUserId: params.userId,
        evidenceType: params.evidenceType,
        originalFilename: params.originalFilename,
        storedFilename: params.storedFilename,
        relativePath: params.relativePath,
        fileHash: params.fileHash,
        mimeType: params.mimeType ?? null,
        sizeBytes: params.sizeBytes,
        processingStatus: EvidenceProcessingStatus.uploaded,
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: params.evidenceType === EvidenceType.rvtools ? "rvtools_uploaded" : "evidence_uploaded",
        message: "Uploaded evidence file.",
        metadataJson: {
          evidenceFileId: evidenceFile.id,
          evidenceType: params.evidenceType,
          sizeBytes: params.sizeBytes,
          fileHash: params.fileHash.slice(0, 12),
          originalFilename: params.originalFilename,
        },
      },
    });

    return evidenceFile;
  });
}

export async function softDeleteEvidenceFile(params: {
  userId: string;
  assessmentId: string;
  fileId: string;
}) {
  const assessment = await ensureAssessmentOwnership(params);
  const existing = await prisma.evidenceFile.findFirst({
    where: {
      id: params.fileId,
      assessmentId: assessment.id,
    },
  });

  if (!existing) {
    throw new Error("Evidence file not found.");
  }

  if (existing.deletedAt || existing.processingStatus === EvidenceProcessingStatus.deleted) {
    throw new Error("Evidence file is already deleted.");
  }

  return prisma.$transaction(async (tx) => {
    const deleted = await tx.evidenceFile.update({
      where: {
        id: existing.id,
      },
      data: {
        deletedAt: new Date(),
        processingStatus: EvidenceProcessingStatus.deleted,
        processingError: null,
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "evidence_deleted",
        message: "Deleted evidence file.",
        metadataJson: {
          evidenceFileId: existing.id,
          evidenceType: existing.evidenceType,
          originalFilename: existing.originalFilename,
        },
      },
    });

    return deleted;
  });
}

type EvidenceLikeAssessment = {
  evidenceFiles?: Array<{
    id: string;
    evidenceType: EvidenceType;
    deletedAt: Date | null;
    uploadedAt: Date;
    processingStatus: EvidenceProcessingStatus;
    originalFilename: string;
  }>;
};

function getLatestRvtoolsEvidenceFile(assessment: EvidenceLikeAssessment) {
  const rvtoolsEvidence = assessment.evidenceFiles?.filter((file) => file.evidenceType === EvidenceType.rvtools) ?? [];

  return [...rvtoolsEvidence].sort((left, right) => {
    const leftTime = left.uploadedAt?.getTime?.() ?? 0;
    const rightTime = right.uploadedAt?.getTime?.() ?? 0;

    return rightTime - leftTime;
  })[0] ?? null;
}

export function getEvidenceUploadStatus(assessment: EvidenceLikeAssessment): EvidenceUploadStatus {
  const latest = getLatestRvtoolsEvidenceFile(assessment);

  if (!latest) {
    return "not_uploaded_yet";
  }

  if (!latest || latest.deletedAt || latest.processingStatus === EvidenceProcessingStatus.deleted) {
    return "deleted";
  }

  if (latest.processingStatus === EvidenceProcessingStatus.failed) {
    return "failed";
  }

  if (latest.processingStatus === EvidenceProcessingStatus.parsed) {
    return "parsed";
  }

  return "uploaded";
}

export function getLatestRvtoolsEvidence(assessment: EvidenceLikeAssessment) {
  return getLatestRvtoolsEvidenceFile(assessment);
}

export function getEvidenceStatusLabel(status: EvidenceUploadStatus) {
  switch (status) {
    case "uploaded":
      return "Uploaded";
    case "deleted":
      return "Deleted";
    case "failed":
      return "Failed";
    case "parsed":
      return "Parsed";
    default:
      return "Not uploaded yet";
  }
}
