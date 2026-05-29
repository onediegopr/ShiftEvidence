import {
  AssessmentAdditionalEvidenceAnalysisStatus,
  AssessmentAdditionalEvidenceClassification,
  AssessmentAdditionalEvidencePurpose,
  AssessmentClientContextAnalysisStatus,
  AssessmentClientContextStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { getEffectiveUserEntitlement } from "../admin/runtimeSettingsService";
import { ensureAssessmentOwnership, type AssessmentDetail } from "./assessmentService";
import {
  type ClientContextPlanLimits,
  resolveClientContextPlanLimits,
} from "./clientContextPlanLimits";
import {
  buildClientContextAuditMetadata,
  parseAdditionalEvidenceClassification,
  parseAdditionalEvidencePurpose,
  validateAdditionalEvidenceFileLimit,
  validateClientContextText,
} from "./clientContextValidation";

type ActorParams = {
  userId: string;
  assessmentId: string;
};

type AdditionalEvidenceLike = NonNullable<AssessmentDetail["additionalEvidence"]>[number];

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function activeAdditionalEvidenceCount(additionalEvidence: AdditionalEvidenceLike[]) {
  return additionalEvidence.filter(
    (item) =>
      item.evidenceFile.deletedAt === null &&
      item.evidenceFile.processingStatus !== "deleted" &&
      item.analysisStatus !== "excluded",
  ).length;
}

function statusAfterDraftSave(wordCount: number): AssessmentClientContextStatus {
  return wordCount > 0 ? AssessmentClientContextStatus.draft : AssessmentClientContextStatus.not_provided;
}

function analysisStatusAfterContextChange(params: {
  wordCount: number;
  existingStatus?: string | null;
  generatedAt?: Date | string | null;
}) {
  if (params.wordCount === 0) {
    return AssessmentClientContextAnalysisStatus.not_started;
  }

  if (params.generatedAt || params.existingStatus === AssessmentClientContextAnalysisStatus.completed) {
    return AssessmentClientContextAnalysisStatus.stale;
  }

  return AssessmentClientContextAnalysisStatus.not_started;
}

async function getLimitsForAssessment(params: {
  userId: string;
  assessment: Pick<AssessmentDetail, "planLevel" | "workspace">;
}): Promise<ClientContextPlanLimits> {
  const entitlement = await getEffectiveUserEntitlement(params.userId);

  return resolveClientContextPlanLimits({
    userEntitlementPlanKey: entitlement?.planKey,
    assessmentPlanLevel: params.assessment.planLevel,
    workspacePlan: params.assessment.workspace.plan,
  });
}

export async function buildAssessmentClientContextSummary(params: {
  userId: string;
  assessment: AssessmentDetail;
}) {
  const limits = await getLimitsForAssessment({
    userId: params.userId,
    assessment: params.assessment,
  });
  const context = params.assessment.clientContext ?? null;
  const additionalEvidence = params.assessment.additionalEvidence ?? [];
  const activeFiles = activeAdditionalEvidenceCount(additionalEvidence);

  return {
    context,
    analysis: params.assessment.clientContextAnalysis ?? null,
    additionalEvidence,
    limits,
    activeFiles,
    remainingFiles: Math.max(0, limits.maxFiles - activeFiles),
    status: context?.status ?? AssessmentClientContextStatus.not_provided,
    wordCount: context?.wordCount ?? 0,
    characterCount: context?.characterCount ?? 0,
  };
}

export async function getAssessmentClientContext(params: ActorParams) {
  const assessment = await ensureAssessmentOwnership(params);
  return buildAssessmentClientContextSummary({
    userId: params.userId,
    assessment,
  });
}

export async function upsertAssessmentClientContextDraft(params: ActorParams & {
  rawText: FormDataEntryValue | string | null | undefined;
}) {
  const assessment = await ensureAssessmentOwnership(params);
  const limits = await getLimitsForAssessment({
    userId: params.userId,
    assessment,
  });
  const validated = validateClientContextText({
    rawText: params.rawText,
    limits,
    allowEmpty: true,
  });
  const status = statusAfterDraftSave(validated.wordCount);
  const analysisStatus = analysisStatusAfterContextChange({
    wordCount: validated.wordCount,
    existingStatus: assessment.clientContextAnalysis?.status,
    generatedAt: assessment.clientContextAnalysis?.generatedAt,
  });
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const context = await tx.assessmentClientContext.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        rawText: validated.rawText || null,
        wordCount: validated.wordCount,
        characterCount: validated.characterCount,
        status,
        sourceType: "customer_free_text",
        planLimitWords: limits.maxWords,
        planLimitFiles: limits.maxFiles,
        truncated: validated.truncated,
        submittedByUserId: params.userId,
        lastEditedAt: now,
      },
      update: {
        rawText: validated.rawText || null,
        wordCount: validated.wordCount,
        characterCount: validated.characterCount,
        status,
        sourceType: "customer_free_text",
        planLimitWords: limits.maxWords,
        planLimitFiles: limits.maxFiles,
        truncated: validated.truncated,
        submittedByUserId: params.userId,
        lastEditedAt: now,
      },
    });

    await tx.assessmentClientContextAnalysis.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        status: analysisStatus,
        safetyFlagsJson: json({
          deepAnalysisImplemented: true,
          rawTextNotForReport: true,
        }),
      },
      update: {
        status: analysisStatus,
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: validated.wordCount > 0 ? "client_context_draft_saved" : "client_context_cleared",
        message:
          validated.wordCount > 0
            ? "Saved optional client context draft."
            : "Cleared optional client context draft.",
        metadataJson: buildClientContextAuditMetadata({
          wordCount: validated.wordCount,
          characterCount: validated.characterCount,
          status,
          planLimitWords: limits.maxWords,
          planLimitFiles: limits.maxFiles,
        }),
      },
    });

    return context;
  });
}

export async function submitAssessmentClientContext(params: ActorParams & {
  rawText: FormDataEntryValue | string | null | undefined;
}) {
  const assessment = await ensureAssessmentOwnership(params);
  const limits = await getLimitsForAssessment({
    userId: params.userId,
    assessment,
  });
  const validated = validateClientContextText({
    rawText: params.rawText,
    limits,
  });
  const analysisStatus = analysisStatusAfterContextChange({
    wordCount: validated.wordCount,
    existingStatus: assessment.clientContextAnalysis?.status,
    generatedAt: assessment.clientContextAnalysis?.generatedAt,
  });
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const context = await tx.assessmentClientContext.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        rawText: validated.rawText,
        wordCount: validated.wordCount,
        characterCount: validated.characterCount,
        status: "ready_for_analysis",
        sourceType: "customer_free_text",
        planLimitWords: limits.maxWords,
        planLimitFiles: limits.maxFiles,
        truncated: validated.truncated,
        submittedByUserId: params.userId,
        submittedAt: now,
        lastEditedAt: now,
      },
      update: {
        rawText: validated.rawText,
        wordCount: validated.wordCount,
        characterCount: validated.characterCount,
        status: "ready_for_analysis",
        sourceType: "customer_free_text",
        planLimitWords: limits.maxWords,
        planLimitFiles: limits.maxFiles,
        truncated: validated.truncated,
        submittedByUserId: params.userId,
        submittedAt: now,
        lastEditedAt: now,
      },
    });

    await tx.assessmentClientContextAnalysis.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        status: analysisStatus,
        safetyFlagsJson: json({
          deepAnalysisImplemented: true,
          rawTextNotForReport: true,
        }),
      },
      update: {
        status: analysisStatus,
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "client_context_submitted",
        message: "Submitted optional client context for future structured analysis.",
        metadataJson: buildClientContextAuditMetadata({
          wordCount: validated.wordCount,
          characterCount: validated.characterCount,
          status: "ready_for_analysis",
          planLimitWords: limits.maxWords,
          planLimitFiles: limits.maxFiles,
        }),
      },
    });

    return context;
  });
}

export async function skipAssessmentClientContext(params: ActorParams) {
  const assessment = await ensureAssessmentOwnership(params);
  const limits = await getLimitsForAssessment({
    userId: params.userId,
    assessment,
  });

  return prisma.$transaction(async (tx) => {
    const context = await tx.assessmentClientContext.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        status: "skipped",
        sourceType: "customer_free_text",
        planLimitWords: limits.maxWords,
        planLimitFiles: limits.maxFiles,
        submittedByUserId: params.userId,
      },
      update: {
        status: "skipped",
        planLimitWords: limits.maxWords,
        planLimitFiles: limits.maxFiles,
        submittedByUserId: params.userId,
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "client_context_skipped",
        message: "Skipped optional client context module.",
        metadataJson: buildClientContextAuditMetadata({
          status: "skipped",
          planLimitWords: limits.maxWords,
          planLimitFiles: limits.maxFiles,
        }),
      },
    });

    return context;
  });
}

export async function createOrUpdateAdditionalEvidenceClassification(params: ActorParams & {
  evidenceFileId: string;
  purpose?: FormDataEntryValue | string | null;
  classification?: FormDataEntryValue | string | null;
  includedInContextAnalysis?: boolean;
}) {
  const assessment = await ensureAssessmentOwnership(params);
  const limits = await getLimitsForAssessment({
    userId: params.userId,
    assessment,
  });
  const purpose = parseAdditionalEvidencePurpose(params.purpose);
  const classification = parseAdditionalEvidenceClassification(params.classification);
  const evidenceFile = assessment.evidenceFiles.find((file) => file.id === params.evidenceFileId);

  if (!evidenceFile || evidenceFile.deletedAt || evidenceFile.processingStatus === "deleted") {
    throw new Error("Additional evidence file was not found for this assessment.");
  }

  const existing = assessment.additionalEvidence.find(
    (item) => item.evidenceFileId === params.evidenceFileId,
  );

  if (!existing) {
    validateAdditionalEvidenceFileLimit({
      existingFileCount: activeAdditionalEvidenceCount(assessment.additionalEvidence),
      limits,
    });
  }

  const included = params.includedInContextAnalysis ?? existing?.includedInContextAnalysis ?? true;
  const analysisStatus = included
    ? AssessmentAdditionalEvidenceAnalysisStatus.received_not_analyzed
    : AssessmentAdditionalEvidenceAnalysisStatus.excluded;

  return prisma.$transaction(async (tx) => {
    const additionalEvidence = await tx.assessmentAdditionalEvidence.upsert({
      where: {
        assessmentId_evidenceFileId: {
          assessmentId: assessment.id,
          evidenceFileId: evidenceFile.id,
        },
      },
      create: {
        assessmentId: assessment.id,
        evidenceFileId: evidenceFile.id,
        purpose: purpose as AssessmentAdditionalEvidencePurpose,
        classification: classification as AssessmentAdditionalEvidenceClassification,
        analysisStatus,
        includedInContextAnalysis: included,
        planRestricted: false,
      },
      update: {
        purpose: purpose as AssessmentAdditionalEvidencePurpose,
        classification: classification as AssessmentAdditionalEvidenceClassification,
        analysisStatus,
        includedInContextAnalysis: included,
        planRestricted: false,
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: existing ? "additional_evidence_classified" : "additional_evidence_uploaded",
        message: existing
          ? "Updated additional evidence classification."
          : "Linked additional evidence to client context.",
        metadataJson: buildClientContextAuditMetadata({
          status: additionalEvidence.analysisStatus,
          planLimitFiles: limits.maxFiles,
          additionalEvidenceId: additionalEvidence.id,
          evidenceFileId: evidenceFile.id,
          classification: additionalEvidence.classification,
          includedInContextAnalysis: additionalEvidence.includedInContextAnalysis,
        }),
      },
    });

    return additionalEvidence;
  });
}

export async function setAdditionalEvidenceIncluded(params: ActorParams & {
  additionalEvidenceId: string;
  includedInContextAnalysis: boolean;
}) {
  const assessment = await ensureAssessmentOwnership(params);
  const existing = assessment.additionalEvidence.find(
    (item) => item.id === params.additionalEvidenceId,
  );

  if (!existing || existing.evidenceFile.deletedAt || existing.evidenceFile.processingStatus === "deleted") {
    throw new Error("Additional evidence file was not found for this assessment.");
  }

  const analysisStatus = params.includedInContextAnalysis
    ? AssessmentAdditionalEvidenceAnalysisStatus.received_not_analyzed
    : AssessmentAdditionalEvidenceAnalysisStatus.excluded;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.assessmentAdditionalEvidence.update({
      where: { id: existing.id },
      data: {
        includedInContextAnalysis: params.includedInContextAnalysis,
        analysisStatus,
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: params.includedInContextAnalysis
          ? "additional_evidence_classified"
          : "additional_evidence_excluded",
        message: params.includedInContextAnalysis
          ? "Included additional evidence in future context analysis."
          : "Excluded additional evidence from future context analysis.",
        metadataJson: buildClientContextAuditMetadata({
          status: updated.analysisStatus,
          additionalEvidenceId: updated.id,
          evidenceFileId: updated.evidenceFileId,
          classification: updated.classification,
          includedInContextAnalysis: updated.includedInContextAnalysis,
        }),
      },
    });

    return updated;
  });
}
