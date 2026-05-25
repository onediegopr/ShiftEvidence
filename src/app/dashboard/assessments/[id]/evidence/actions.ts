"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../../../../lib/auth";
import { ensureAssessmentOwnership } from "../../../../../server/assessments/assessmentService";
import { upsertUserProfileFromSession } from "../../../../../server/user/userProfileService";
import { createEvidenceFileRecord, softDeleteEvidenceFile } from "../../../../../server/evidence/evidenceFileService";
import { deletePhysicalFileIfExists, writeUploadedFile } from "../../../../../server/evidence/localStorageService";
import {
  inferEvidenceTypeFromForm,
  validateEvidenceUpload,
} from "../../../../../server/evidence/uploadValidation";
import { importRvtoolsEvidence } from "../../../../../server/rvtools/rvtoolsImportService";
import { safeRedirectError } from "../../../../../server/assessments/formUtils";

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

function getAssessmentRedirectPath(assessmentId: string, query?: string) {
  return query ? `/dashboard/assessments/${assessmentId}?${query}` : `/dashboard/assessments/${assessmentId}`;
}

export async function uploadEvidenceAction(assessmentId: string, formData: FormData) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1");

  try {
    const evidenceType = inferEvidenceTypeFromForm(formData.get("evidenceType"));
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

    try {
      await createEvidenceFileRecord({
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
    } catch (error) {
      await deletePhysicalFileIfExists(stored.relativePath);
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload evidence.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function deleteEvidenceAction(assessmentId: string, evidenceFileId: string) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1");

  try {
    const deleted = await softDeleteEvidenceFile({
      userId: session.user.id,
      assessmentId,
      fileId: evidenceFileId,
    });

    try {
      await deletePhysicalFileIfExists(deleted.relativePath);
    } catch (error) {
      console.warn("Failed to remove physical evidence file after soft delete.", error);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete evidence.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function parseRvtoolsEvidenceAction(assessmentId: string, evidenceFileId: string) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1");

  try {
    await importRvtoolsEvidence({
      userId: session.user.id,
      assessmentId,
      evidenceFileId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to parse RVTools evidence.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}
