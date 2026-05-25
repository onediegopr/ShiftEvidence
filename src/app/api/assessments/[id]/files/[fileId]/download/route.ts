import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { EvidenceProcessingStatus } from "@prisma/client";
import { auth } from "../../../../../../../lib/auth";
import { prisma } from "../../../../../../../lib/prisma";
import { ensureAssessmentOwnership } from "../../../../../../../server/assessments/assessmentService";
import { getEvidenceFileForDownload } from "../../../../../../../server/evidence/evidenceFileService";
import { readEvidenceFile } from "../../../../../../../server/evidence/localStorageService";
import { sanitizeOriginalFilename } from "../../../../../../../server/evidence/uploadValidation";

export const runtime = "nodejs";

function buildContentDisposition(filename: string) {
  const safeFilename = sanitizeOriginalFilename(filename).replace(/["\r\n]/g, "_");
  const encodedFilename = encodeURIComponent(safeFilename);
  return `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`;
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      fileId: string;
    }>;
  },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const { id, fileId } = await params;

  const assessment = await ensureAssessmentOwnership({
    userId: session.user.id,
    assessmentId: id,
  });

  const evidenceFile = await getEvidenceFileForDownload({
    userId: session.user.id,
    assessmentId: id,
    fileId,
  });

  if (!evidenceFile || evidenceFile.processingStatus === EvidenceProcessingStatus.deleted) {
    return new Response("Not found", {
      status: 404,
    });
  }

  let fileBuffer: Buffer;
  try {
    fileBuffer = await readEvidenceFile(evidenceFile.relativePath);
  } catch {
    return new Response("Not found", {
      status: 404,
    });
  }

  await prisma.auditEvent.create({
    data: {
      userId: session.user.id,
      workspaceId: assessment.workspaceId,
      assessmentId: assessment.id,
      eventType: "evidence_downloaded",
      message: "Downloaded evidence file.",
      metadataJson: {
        evidenceFileId: evidenceFile.id,
        evidenceType: evidenceFile.evidenceType,
        sizeBytes: evidenceFile.sizeBytes,
        fileHash: evidenceFile.fileHash.slice(0, 12),
        originalFilename: evidenceFile.originalFilename,
      },
    },
  });

  const contentType = evidenceFile.mimeType ?? "application/octet-stream";
  const contentDisposition = buildContentDisposition(evidenceFile.originalFilename);

  return new Response(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition,
      "Content-Length": String(fileBuffer.byteLength),
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
