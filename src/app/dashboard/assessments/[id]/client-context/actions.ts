"use server";

import { EvidenceType } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../../../../lib/auth";
import { assertCanUploadEvidence } from "../../../../../server/assessments/assessmentUploadPrerequisites";
import {
  createOrUpdateAdditionalEvidenceClassification,
  getAssessmentClientContext,
  setAdditionalEvidenceIncluded,
  skipAssessmentClientContext,
  submitAssessmentClientContext,
  upsertAssessmentClientContextDraft,
} from "../../../../../server/assessments/clientContextService";
import { safeRedirectError } from "../../../../../server/assessments/formUtils";
import { ensureAssessmentOwnership } from "../../../../../server/assessments/assessmentService";
import { runAssessmentClientContextAnalysis } from "../../../../../server/assessments/clientContextAiAnalysisService";
import {
  validateAdditionalEvidenceExtension,
  validateAdditionalEvidenceFileLimit,
} from "../../../../../server/assessments/clientContextValidation";
import { upsertUserProfileFromSession } from "../../../../../server/user/userProfileService";
import { createEvidenceFileRecord, softDeleteEvidenceFile } from "../../../../../server/evidence/evidenceFileService";
import { deletePhysicalFileIfExists, writeUploadedFile } from "../../../../../server/evidence/localStorageService";
import { validateEvidenceUpload } from "../../../../../server/evidence/uploadValidation";
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

function getAssessmentRedirectPath(assessmentId: string, query?: string) {
  const queryString = query ? `?${query}&tab=client-context` : "?tab=client-context";
  return `/dashboard/assessments/${assessmentId}${queryString}`;
}

export async function saveClientContextDraftAction(assessmentId: string, formData: FormData) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1");

  try {
    await upsertAssessmentClientContextDraft({
      userId: session.user.id,
      assessmentId,
      rawText: formData.get("rawText"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save client context.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function submitClientContextAction(assessmentId: string, formData: FormData) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1");

  try {
    await submitAssessmentClientContext({
      userId: session.user.id,
      assessmentId,
      rawText: formData.get("rawText"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit client context.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function skipClientContextAction(assessmentId: string) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1");

  try {
    await skipAssessmentClientContext({
      userId: session.user.id,
      assessmentId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to skip client context.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function runClientContextAnalysisAction(assessmentId: string) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1");

  try {
    await runAssessmentClientContextAnalysis({
      userId: session.user.id,
      assessmentId,
      force: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze client context.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function uploadAdditionalEvidenceAction(assessmentId: string, formData: FormData) {
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

    const summary = await getAssessmentClientContext({
      userId: session.user.id,
      assessmentId,
    });
    validateAdditionalEvidenceFileLimit({
      existingFileCount: summary.activeFiles,
      limits: summary.limits,
    });

    const fileEntry = formData.get("file");
    if (!(fileEntry instanceof File)) {
      throw new Error("Additional evidence file is required.");
    }

    const validation = validateEvidenceUpload({
      file: fileEntry,
      evidenceType: EvidenceType.other,
    });
    validateAdditionalEvidenceExtension(validation.extension);

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

      await createOrUpdateAdditionalEvidenceClassification({
        userId: session.user.id,
        assessmentId: assessment.id,
        evidenceFileId: evidenceFile.id,
        purpose: formData.get("purpose"),
        classification: formData.get("classification"),
        includedInContextAnalysis: true,
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
          logger.warn("additional_evidence_cleanup_failed", {
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
    logger.warn("additional_evidence_upload_failed", {
      userId: session.user.id,
      assessmentId,
      error,
    });
    const message = error instanceof Error ? error.message : "Unable to upload additional evidence.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function classifyAdditionalEvidenceAction(
  assessmentId: string,
  evidenceFileId: string,
  formData: FormData,
) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1");

  try {
    await createOrUpdateAdditionalEvidenceClassification({
      userId: session.user.id,
      assessmentId,
      evidenceFileId,
      purpose: formData.get("purpose"),
      classification: formData.get("classification"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to classify additional evidence.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}

export async function setAdditionalEvidenceIncludedAction(
  assessmentId: string,
  additionalEvidenceId: string,
  includedInContextAnalysis: boolean,
) {
  const session = await requireSession();
  let redirectTarget = getAssessmentRedirectPath(assessmentId, "saved=1");

  try {
    await setAdditionalEvidenceIncluded({
      userId: session.user.id,
      assessmentId,
      additionalEvidenceId,
      includedInContextAnalysis,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update additional evidence.";
    redirectTarget = getAssessmentRedirectPath(assessmentId, `error=${safeRedirectError(message)}`);
  }

  redirect(redirectTarget);
}
