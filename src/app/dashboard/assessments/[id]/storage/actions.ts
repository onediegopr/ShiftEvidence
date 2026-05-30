"use server";

import { EvidenceType } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../../../../lib/auth";
import { assertCanUploadEvidence } from "../../../../../server/assessments/assessmentUploadPrerequisites";
import { ensureAssessmentOwnership } from "../../../../../server/assessments/assessmentService";
import { safeRedirectError } from "../../../../../server/assessments/formUtils";
import { runStorageContextAnalysis } from "../../../../../server/assessments/storageContextAiAnalysisService";
import {
  classifyStorageEvidence,
  getAssessmentStorageDestinationReadiness,
  setStorageEvidenceIncluded,
  skipStorageDestinationReadiness,
  submitStorageContext,
  submitStorageDestinationReadiness,
  upsertStorageContextDraft,
  upsertStorageDestinationReadinessDraft,
} from "../../../../../server/assessments/storageDestinationReadinessService";
import {
  validateStorageEvidenceExtension,
  validateStorageEvidenceFileLimit,
} from "../../../../../server/assessments/storageReadinessValidation";
import { createEvidenceFileRecord, softDeleteEvidenceFile } from "../../../../../server/evidence/evidenceFileService";
import { deletePhysicalFileIfExists, writeUploadedFile } from "../../../../../server/evidence/localStorageService";
import { validateEvidenceUpload } from "../../../../../server/evidence/uploadValidation";
import { logger } from "../../../../../server/logging/logger";
import { assertRateLimit, getClientIpFromHeaders } from "../../../../../server/security/rateLimit";
import { upsertUserProfileFromSession } from "../../../../../server/user/userProfileService";

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
  const queryString = query ? `?${query}&tab=storage` : "?tab=storage";
  return `/dashboard/assessments/${assessmentId}${queryString}`;
}

export async function saveStorageReadinessDraftAction(
  assessmentId: string,
  formData: FormData,
) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1");

  try {
    await upsertStorageDestinationReadinessDraft({
      userId: session.user.id,
      assessmentId,
      formData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save storage readiness.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function submitStorageReadinessAction(
  assessmentId: string,
  formData: FormData,
) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1");

  try {
    await submitStorageDestinationReadiness({
      userId: session.user.id,
      assessmentId,
      formData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit storage readiness.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function skipStorageReadinessAction(assessmentId: string) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1");

  try {
    await skipStorageDestinationReadiness({
      userId: session.user.id,
      assessmentId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to skip storage readiness.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function saveStorageContextDraftAction(
  assessmentId: string,
  formData: FormData,
) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1");

  try {
    await upsertStorageContextDraft({
      userId: session.user.id,
      assessmentId,
      rawText: formData.get("rawText"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save storage context.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function submitStorageContextAction(assessmentId: string, formData: FormData) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1");

  try {
    await submitStorageContext({
      userId: session.user.id,
      assessmentId,
      rawText: formData.get("rawText"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit storage context.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function uploadStorageEvidenceAction(assessmentId: string, formData: FormData) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1");

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

    const assessment = await ensureAssessmentOwnership({
      userId: session.user.id,
      assessmentId,
    });
    assertCanUploadEvidence(assessment);

    const summary = await getAssessmentStorageDestinationReadiness({
      userId: session.user.id,
      assessmentId,
    });
    validateStorageEvidenceFileLimit({
      existingFileCount: summary.activeFiles,
      limits: summary.limits,
    });

    const fileEntry = formData.get("file");
    if (!(fileEntry instanceof File)) {
      throw new Error("Storage evidence file is required.");
    }

    const validation = validateEvidenceUpload({
      file: fileEntry,
      evidenceType: EvidenceType.other,
    });
    validateStorageEvidenceExtension(validation.extension);

    const buffer = Buffer.from(await fileEntry.arrayBuffer());
    const stored = await writeUploadedFile({
      userId: session.user.id,
      workspaceId: assessment.workspaceId,
      assessmentId: assessment.id,
      evidenceType: EvidenceType.other,
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
        evidenceType: EvidenceType.other,
        originalFilename: validation.originalFilename,
        storedFilename: stored.storedFilename,
        relativePath: stored.relativePath,
        fileHash: stored.fileHash,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
      });
      evidenceFileId = evidenceFile.id;

      await classifyStorageEvidence({
        userId: session.user.id,
        assessmentId: assessment.id,
        evidenceFileId: evidenceFile.id,
        classification: formData.get("classification"),
        notes: formData.get("notes"),
        includedInStorageAnalysis: true,
      });
    } catch (error) {
      await deletePhysicalFileIfExists(stored.relativePath);
      if (evidenceFileId) {
        try {
          await softDeleteEvidenceFile({
            userId: session.user.id,
            assessmentId: assessment.id,
            fileId: evidenceFileId,
          });
        } catch (cleanupError) {
          logger.warn("storage_evidence_cleanup_failed", {
            userId: session.user.id,
            assessmentId,
            evidenceFileId,
            error: cleanupError,
          });
        }
      }
      throw error;
    }
  } catch (error) {
    logger.warn("storage_evidence_upload_failed", {
      userId: session.user.id,
      assessmentId,
      error,
    });
    const message = error instanceof Error ? error.message : "Unable to upload storage evidence.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function classifyStorageEvidenceAction(
  assessmentId: string,
  evidenceFileId: string,
  formData: FormData,
) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1");

  try {
    await classifyStorageEvidence({
      userId: session.user.id,
      assessmentId,
      evidenceFileId,
      classification: formData.get("classification"),
      notes: formData.get("notes"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to classify storage evidence.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function setStorageEvidenceIncludedAction(
  assessmentId: string,
  storageEvidenceId: string,
  includedInStorageAnalysis: boolean,
) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1");

  try {
    await setStorageEvidenceIncluded({
      userId: session.user.id,
      assessmentId,
      storageEvidenceId,
      includedInStorageAnalysis,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update storage evidence.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function runStorageContextAnalysisAction(assessmentId: string) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1");

  try {
    await runStorageContextAnalysis({
      userId: session.user.id,
      assessmentId,
      force: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to run Storage Context Intelligence.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}
