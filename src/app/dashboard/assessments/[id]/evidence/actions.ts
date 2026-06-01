"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { EvidenceModuleKey } from "@prisma/client";
import { auth } from "../../../../../lib/auth";
import { ensureAssessmentOwnership } from "../../../../../server/assessments/assessmentService";
import { assertCanUploadEvidence } from "../../../../../server/assessments/assessmentUploadPrerequisites";
import { upsertUserProfileFromSession } from "../../../../../server/user/userProfileService";
import { createEvidenceFileRecord, softDeleteEvidenceFile } from "../../../../../server/evidence/evidenceFileService";
import { deletePhysicalFileIfExists, writeUploadedFile } from "../../../../../server/evidence/localStorageService";
import {
  inferEvidenceTypeFromForm,
  validateEvidenceUpload,
} from "../../../../../server/evidence/uploadValidation";
import { importRvtoolsEvidence } from "../../../../../server/rvtools/rvtoolsImportService";
import {
  associateEvidenceFileWithModule,
  markEvidenceModuleSkipped,
  parseEvidenceUpload,
} from "../../../../../server/evidence/evidenceExpansionService";
import { assertEvidenceModuleKey } from "../../../../../server/evidence/evidenceModuleRegistry";
import { safeRedirectError } from "../../../../../server/assessments/formUtils";
import { assertRateLimit, getClientIpFromHeaders } from "../../../../../server/security/rateLimit";
import { logger } from "../../../../../server/logging/logger";

async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  await upsertUserProfileFromSession({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    imageUrl: session.user.image ?? null,
    authProvider: "better-auth",
  });

  return session;
}

function getAssessmentRedirectPath(assessmentId: string, query?: string, tab?: string) {
  const params = [];
  if (query) params.push(query);
  if (tab) params.push(`tab=${tab}`);
  const queryString = params.length > 0 ? `?${params.join("&")}` : "";
  return `/dashboard/assessments/${assessmentId}${queryString}`;
}

export async function uploadEvidenceAction(assessmentId: string, formData: FormData) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1", "evidence");

  try {
    const requestHeaders = await headers();
    await assertRateLimit({
      limiter: "uploadEvidenceUser",
      keyParts: ["user", session.user.id],
    });
    await assertRateLimit({
      limiter: "uploadEvidenceIp",
      keyParts: ["ip", getClientIpFromHeaders(requestHeaders)],
    });

    const evidenceType = inferEvidenceTypeFromForm(formData.get("evidenceType"));
    const rawModuleKey = formData.get("moduleKey");
    const moduleKey =
      typeof rawModuleKey === "string" && rawModuleKey.trim()
        ? assertEvidenceModuleKey(rawModuleKey.trim())
        : null;
    const fileEntry = formData.get("file");

    if (!(fileEntry instanceof File)) {
      throw new Error("Evidence file is required.");
    }

    const validation = validateEvidenceUpload({
      file: fileEntry,
      evidenceType,
    });

    const assessment = await ensureAssessmentOwnership({
      userId: session.user.id,
      assessmentId,
    });
    assertCanUploadEvidence(assessment);

    const buffer = Buffer.from(await fileEntry.arrayBuffer());
    const stored = await writeUploadedFile({
      userId: session.user.id,
      workspaceId: assessment.workspaceId,
      assessmentId: assessment.id,
      evidenceType,
      originalFilename: validation.originalFilename,
      extension: validation.extension,
      mimeType: validation.mimeType,
      buffer,
    });

    let evidenceFileId: string | null = null;
    try {
      const evidenceFile = await createEvidenceFileRecord({
        userId: session.user.id,
        assessmentId: assessment.id,
        evidenceType,
        originalFilename: validation.originalFilename,
        storedFilename: stored.storedFilename,
        relativePath: stored.relativePath,
        fileHash: stored.fileHash,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
      });
      evidenceFileId = evidenceFile.id;

      if (moduleKey) {
        const upload = await associateEvidenceFileWithModule({
          userId: session.user.id,
          assessmentId: assessment.id,
          workspaceId: assessment.workspaceId,
          evidenceFileId: evidenceFile.id,
          moduleKey,
          originalFilename: validation.originalFilename,
        });

        await parseEvidenceUpload({
          userId: session.user.id,
          workspaceId: assessment.workspaceId,
          evidenceUploadId: upload.id,
        });
      }
    } catch (error) {
      if (evidenceFileId) {
        await softDeleteEvidenceFile({
          userId: session.user.id,
          assessmentId: assessment.id,
          fileId: evidenceFileId,
        });
      }
      await deletePhysicalFileIfExists(stored.relativePath);
      throw error;
    }
  } catch (error) {
    logger.warn("evidence_upload_failed", {
      userId: session.user.id,
      assessmentId,
      error,
    });
    const message = error instanceof Error ? error.message : "Unable to upload evidence.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`, "evidence");
  }

  redirect(redirectTarget);
}

export async function deleteEvidenceAction(assessmentId: string, evidenceFileId: string) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1", "evidence");

  try {
    const deleted = await softDeleteEvidenceFile({
      userId: session.user.id,
      assessmentId,
      fileId: evidenceFileId,
    });

    try {
      await deletePhysicalFileIfExists(deleted.relativePath);
    } catch (error) {
      logger.warn("evidence_file_cleanup_failed", {
        userId: session.user.id,
        assessmentId,
        evidenceFileId,
        error,
      });
    }
  } catch (error) {
    logger.warn("evidence_delete_failed", {
      userId: session.user.id,
      assessmentId,
      evidenceFileId,
      error,
    });
    const message = error instanceof Error ? error.message : "Unable to delete evidence.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`, "evidence");
  }

  redirect(redirectTarget);
}

export async function parseRvtoolsEvidenceAction(assessmentId: string, evidenceFileId: string) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1", "inventory");

  try {
    await importRvtoolsEvidence({
      userId: session.user.id,
      assessmentId,
      evidenceFileId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to parse RVTools evidence.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`, "inventory");
  }

  redirect(redirectTarget);
}

export async function skipEvidenceModuleAction(assessmentId: string, moduleKey: EvidenceModuleKey) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1", "evidence");

  try {
    const assessment = await ensureAssessmentOwnership({
      userId: session.user.id,
      assessmentId,
    });

    await markEvidenceModuleSkipped({
      userId: session.user.id,
      workspaceId: assessment.workspaceId,
      assessmentId: assessment.id,
      moduleKey,
    });
  } catch (error) {
    logger.warn("evidence_module_skip_failed", {
      userId: session.user.id,
      assessmentId,
      moduleKey,
      error,
    });
    const message = error instanceof Error ? error.message : "Unable to skip evidence module.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`, "evidence");
  }

  redirect(redirectTarget);
}
