import {
  AssessmentStorageAnalysisStatus,
  AssessmentStorageContextStatus,
  AssessmentStorageDestinationReadinessStatus,
  AssessmentStorageEvidenceAnalysisStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { getEffectiveUserEntitlement } from "../admin/runtimeSettingsService";
import { ensureAssessmentOwnership, type AssessmentDetail } from "./assessmentService";
import {
  type StorageReadinessPlanLimits,
  resolveStorageReadinessPlanLimits,
} from "./storageReadinessPlanLimits";
import {
  buildStorageReadinessAuditMetadata,
  parseStorageEvidenceClassification,
  validateStorageContextText,
  validateStorageReadinessFormData,
} from "./storageReadinessValidation";

type ActorParams = {
  userId: string;
  assessmentId: string;
};

type StorageEvidenceLike = NonNullable<AssessmentDetail["storageEvidence"]>[number];

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function activeStorageEvidenceCount(storageEvidence: StorageEvidenceLike[]) {
  return storageEvidence.filter(
    (item) =>
      item.evidenceFile.deletedAt === null &&
      item.evidenceFile.processingStatus !== "deleted" &&
      item.analysisStatus !== "excluded",
  ).length;
}

function hasStructuredStorageValues(input: ReturnType<typeof validateStorageReadinessFormData>) {
  return [
    input.currentStorageType,
    input.targetStoragePreference,
    input.needsHighAvailability,
    input.requiresSharedStorage,
    input.hasProxmoxTarget,
    input.hasPbs,
    input.hasMinimumThreeNodes,
    input.hasDedicatedStorageNetwork,
    input.hasCephExperience,
    input.hasVendorOrPartnerSupport,
    input.estimatedGrowthPercent3y,
    input.downtimeTolerance,
    input.rpoRtoNotes,
    input.sourceNotes,
    input.storageConstraints.length > 0 ? input.storageConstraints : null,
  ].some((value) => value !== null && value !== undefined && value !== "");
}

function readinessStatusAfterDraftSave(
  input: ReturnType<typeof validateStorageReadinessFormData>,
) {
  return hasStructuredStorageValues(input)
    ? AssessmentStorageDestinationReadinessStatus.draft
    : AssessmentStorageDestinationReadinessStatus.not_started;
}

function contextStatusAfterDraftSave(wordCount: number) {
  return wordCount > 0
    ? AssessmentStorageContextStatus.draft
    : AssessmentStorageContextStatus.not_provided;
}

function analysisStatusAfterStorageChange(params: {
  hasContent: boolean;
  existingGeneratedAt?: Date | string | null;
  existingStatus?: string | null;
}) {
  if (!params.hasContent) {
    return AssessmentStorageAnalysisStatus.not_started;
  }

  if (
    params.existingGeneratedAt ||
    params.existingStatus === AssessmentStorageAnalysisStatus.completed
  ) {
    return AssessmentStorageAnalysisStatus.stale;
  }

  return AssessmentStorageAnalysisStatus.not_started;
}

async function getLimitsForAssessment(params: {
  userId: string;
  assessment: Pick<AssessmentDetail, "planLevel" | "workspace">;
}): Promise<StorageReadinessPlanLimits> {
  const entitlement = await getEffectiveUserEntitlement(params.userId);

  return resolveStorageReadinessPlanLimits({
    userEntitlementPlanKey: entitlement?.planKey,
    assessmentPlanLevel: params.assessment.planLevel,
    workspacePlan: params.assessment.workspace.plan,
  });
}

export async function buildAssessmentStorageDestinationReadinessSummary(params: {
  userId: string;
  assessment: AssessmentDetail;
}) {
  const limits = await getLimitsForAssessment({
    userId: params.userId,
    assessment: params.assessment,
  });
  const readiness = params.assessment.storageDestinationReadiness ?? null;
  const context = params.assessment.storageContext ?? null;
  const storageEvidence = params.assessment.storageEvidence ?? [];
  const activeFiles = activeStorageEvidenceCount(storageEvidence);
  const parsedDatastoreCount =
    (params.assessment.parsedDatastores?.length ?? 0) +
    (params.assessment.parsedInventorySummaries ?? []).reduce(
      (total, summary) => total + (summary.datastoreCount ?? 0),
      0,
    );
  const status =
    readiness?.status ??
    (context?.status === AssessmentStorageContextStatus.skipped
      ? AssessmentStorageDestinationReadinessStatus.skipped
      : AssessmentStorageDestinationReadinessStatus.not_started);

  return {
    readiness,
    context,
    analysis: params.assessment.storageAnalysis ?? null,
    storageEvidence,
    limits,
    activeFiles,
    remainingFiles: Math.max(0, limits.maxStorageEvidenceFiles - activeFiles),
    status,
    contextStatus: context?.status ?? AssessmentStorageContextStatus.not_provided,
    wordCount: context?.wordCount ?? 0,
    characterCount: context?.characterCount ?? 0,
    parsedDatastoreCount,
    legacyStorageReadinessInput: params.assessment.storageReadinessInput ?? null,
    legacyStorageReadinessEnabled: params.assessment.storageReadinessEnabled,
    missingEvidenceHints: [
      "Target Proxmox node count",
      "Disk layout and media type",
      "Storage network speed and separation",
      "Failure domains",
      "Backup/PBS strategy",
      "Growth expectations",
      "Ceph skills and support model",
    ],
  };
}

export async function getAssessmentStorageDestinationReadiness(params: ActorParams) {
  const assessment = await ensureAssessmentOwnership(params);
  return buildAssessmentStorageDestinationReadinessSummary({
    userId: params.userId,
    assessment,
  });
}

export async function upsertStorageDestinationReadinessDraft(
  params: ActorParams & {
    formData: FormData;
  },
) {
  const assessment = await ensureAssessmentOwnership(params);
  const validated = validateStorageReadinessFormData(params.formData);
  const status = readinessStatusAfterDraftSave(validated);
  const analysisStatus = analysisStatusAfterStorageChange({
    hasContent: status !== AssessmentStorageDestinationReadinessStatus.not_started,
    existingGeneratedAt: assessment.storageAnalysis?.generatedAt,
    existingStatus: assessment.storageAnalysis?.status,
  });

  return prisma.$transaction(async (tx) => {
    const readiness = await tx.assessmentStorageDestinationReadiness.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        status,
        mode: validated.mode,
        currentStorageType: validated.currentStorageType,
        targetStoragePreference: validated.targetStoragePreference,
        needsHighAvailability: validated.needsHighAvailability,
        requiresSharedStorage: validated.requiresSharedStorage,
        hasProxmoxTarget: validated.hasProxmoxTarget,
        hasPbs: validated.hasPbs,
        hasMinimumThreeNodes: validated.hasMinimumThreeNodes,
        hasDedicatedStorageNetwork: validated.hasDedicatedStorageNetwork,
        hasCephExperience: validated.hasCephExperience,
        hasVendorOrPartnerSupport: validated.hasVendorOrPartnerSupport,
        estimatedGrowthPercent3y: validated.estimatedGrowthPercent3y,
        downtimeTolerance: validated.downtimeTolerance,
        rpoRtoNotes: validated.rpoRtoNotes,
        sourceNotes: validated.sourceNotes,
        storageConstraintsJson: json(validated.storageConstraints),
        assumptionsJson: json({
          cephIsCapturedOnly: true,
          noCephRecommendationInStorage1: true,
          rawContextNotForReport: true,
        }),
      },
      update: {
        status,
        mode: validated.mode,
        currentStorageType: validated.currentStorageType,
        targetStoragePreference: validated.targetStoragePreference,
        needsHighAvailability: validated.needsHighAvailability,
        requiresSharedStorage: validated.requiresSharedStorage,
        hasProxmoxTarget: validated.hasProxmoxTarget,
        hasPbs: validated.hasPbs,
        hasMinimumThreeNodes: validated.hasMinimumThreeNodes,
        hasDedicatedStorageNetwork: validated.hasDedicatedStorageNetwork,
        hasCephExperience: validated.hasCephExperience,
        hasVendorOrPartnerSupport: validated.hasVendorOrPartnerSupport,
        estimatedGrowthPercent3y: validated.estimatedGrowthPercent3y,
        downtimeTolerance: validated.downtimeTolerance,
        rpoRtoNotes: validated.rpoRtoNotes,
        sourceNotes: validated.sourceNotes,
        storageConstraintsJson: json(validated.storageConstraints),
      },
    });

    await tx.assessmentStorageAnalysis.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        status: analysisStatus,
        cephSuitabilityStatus: "not_evaluated_storage_1",
        missingEvidenceJson: json([]),
        recommendationsJson: json([]),
        analysisVersion: "storage-1-foundation",
      },
      update: {
        status: analysisStatus,
        cephSuitabilityStatus: "not_evaluated_storage_1",
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType:
          status === AssessmentStorageDestinationReadinessStatus.not_started
            ? "storage_destination_readiness_cleared"
            : "storage_destination_readiness_saved",
        message:
          status === AssessmentStorageDestinationReadinessStatus.not_started
            ? "Cleared optional storage destination readiness draft."
            : "Saved optional storage destination readiness draft.",
        metadataJson: buildStorageReadinessAuditMetadata({
          status,
          mode: validated.mode,
          currentStorageType: validated.currentStorageType,
          targetStoragePreference: validated.targetStoragePreference,
        }),
      },
    });

    return readiness;
  });
}

export async function submitStorageDestinationReadiness(
  params: ActorParams & {
    formData: FormData;
  },
) {
  const assessment = await ensureAssessmentOwnership(params);
  const validated = validateStorageReadinessFormData(params.formData);
  if (!hasStructuredStorageValues(validated)) {
    throw new Error("Add storage inputs before submitting, or skip this optional module.");
  }
  const analysisStatus = analysisStatusAfterStorageChange({
    hasContent: true,
    existingGeneratedAt: assessment.storageAnalysis?.generatedAt,
    existingStatus: assessment.storageAnalysis?.status,
  });

  return prisma.$transaction(async (tx) => {
    const readiness = await tx.assessmentStorageDestinationReadiness.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        status: AssessmentStorageDestinationReadinessStatus.submitted,
        mode: validated.mode,
        currentStorageType: validated.currentStorageType,
        targetStoragePreference: validated.targetStoragePreference,
        needsHighAvailability: validated.needsHighAvailability,
        requiresSharedStorage: validated.requiresSharedStorage,
        hasProxmoxTarget: validated.hasProxmoxTarget,
        hasPbs: validated.hasPbs,
        hasMinimumThreeNodes: validated.hasMinimumThreeNodes,
        hasDedicatedStorageNetwork: validated.hasDedicatedStorageNetwork,
        hasCephExperience: validated.hasCephExperience,
        hasVendorOrPartnerSupport: validated.hasVendorOrPartnerSupport,
        estimatedGrowthPercent3y: validated.estimatedGrowthPercent3y,
        downtimeTolerance: validated.downtimeTolerance,
        rpoRtoNotes: validated.rpoRtoNotes,
        sourceNotes: validated.sourceNotes,
        storageConstraintsJson: json(validated.storageConstraints),
        assumptionsJson: json({
          cephIsCapturedOnly: true,
          noCephRecommendationInStorage1: true,
          rawContextNotForReport: true,
        }),
      },
      update: {
        status: AssessmentStorageDestinationReadinessStatus.submitted,
        mode: validated.mode,
        currentStorageType: validated.currentStorageType,
        targetStoragePreference: validated.targetStoragePreference,
        needsHighAvailability: validated.needsHighAvailability,
        requiresSharedStorage: validated.requiresSharedStorage,
        hasProxmoxTarget: validated.hasProxmoxTarget,
        hasPbs: validated.hasPbs,
        hasMinimumThreeNodes: validated.hasMinimumThreeNodes,
        hasDedicatedStorageNetwork: validated.hasDedicatedStorageNetwork,
        hasCephExperience: validated.hasCephExperience,
        hasVendorOrPartnerSupport: validated.hasVendorOrPartnerSupport,
        estimatedGrowthPercent3y: validated.estimatedGrowthPercent3y,
        downtimeTolerance: validated.downtimeTolerance,
        rpoRtoNotes: validated.rpoRtoNotes,
        sourceNotes: validated.sourceNotes,
        storageConstraintsJson: json(validated.storageConstraints),
      },
    });

    await tx.assessmentStorageAnalysis.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        status: analysisStatus,
        cephSuitabilityStatus: "not_evaluated_storage_1",
        missingEvidenceJson: json([]),
        recommendationsJson: json([]),
        analysisVersion: "storage-1-foundation",
      },
      update: {
        status: analysisStatus,
        cephSuitabilityStatus: "not_evaluated_storage_1",
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "storage_destination_readiness_submitted",
        message: "Submitted optional storage destination readiness inputs.",
        metadataJson: buildStorageReadinessAuditMetadata({
          status: AssessmentStorageDestinationReadinessStatus.submitted,
          mode: validated.mode,
          currentStorageType: validated.currentStorageType,
          targetStoragePreference: validated.targetStoragePreference,
        }),
      },
    });

    return readiness;
  });
}

export async function skipStorageDestinationReadiness(params: ActorParams) {
  const assessment = await ensureAssessmentOwnership(params);

  return prisma.$transaction(async (tx) => {
    const readiness = await tx.assessmentStorageDestinationReadiness.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        status: AssessmentStorageDestinationReadinessStatus.skipped,
        mode: "agnostic",
      },
      update: {
        status: AssessmentStorageDestinationReadinessStatus.skipped,
      },
    });

    await tx.assessmentStorageContext.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        status: AssessmentStorageContextStatus.skipped,
        rawText: null,
        wordCount: 0,
        characterCount: 0,
      },
      update: {
        status: AssessmentStorageContextStatus.skipped,
      },
    });

    await tx.assessmentStorageAnalysis.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        status: AssessmentStorageAnalysisStatus.not_started,
        cephSuitabilityStatus: "not_evaluated_storage_1",
      },
      update: {
        status: AssessmentStorageAnalysisStatus.not_started,
        cephSuitabilityStatus: "not_evaluated_storage_1",
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "storage_destination_readiness_skipped",
        message: "Skipped optional storage destination readiness.",
        metadataJson: buildStorageReadinessAuditMetadata({
          status: AssessmentStorageDestinationReadinessStatus.skipped,
        }),
      },
    });

    return readiness;
  });
}

export async function upsertStorageContextDraft(
  params: ActorParams & {
    rawText: FormDataEntryValue | string | null | undefined;
  },
) {
  const assessment = await ensureAssessmentOwnership(params);
  const limits = await getLimitsForAssessment({
    userId: params.userId,
    assessment,
  });
  const validated = validateStorageContextText({
    rawText: params.rawText,
    limits,
    allowEmpty: true,
  });
  const status = contextStatusAfterDraftSave(validated.wordCount);
  const analysisStatus = analysisStatusAfterStorageChange({
    hasContent: validated.wordCount > 0,
    existingGeneratedAt: assessment.storageAnalysis?.generatedAt,
    existingStatus: assessment.storageAnalysis?.status,
  });
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const context = await tx.assessmentStorageContext.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        rawText: validated.rawText || null,
        wordCount: validated.wordCount,
        characterCount: validated.characterCount,
        status,
        planLimitWords: limits.maxStorageContextWords,
        planLimitFiles: limits.maxStorageEvidenceFiles,
        truncated: validated.truncated,
        submittedByUserId: params.userId,
        lastEditedAt: now,
      },
      update: {
        rawText: validated.rawText || null,
        wordCount: validated.wordCount,
        characterCount: validated.characterCount,
        status,
        planLimitWords: limits.maxStorageContextWords,
        planLimitFiles: limits.maxStorageEvidenceFiles,
        truncated: validated.truncated,
        submittedByUserId: params.userId,
        lastEditedAt: now,
      },
    });

    await tx.assessmentStorageAnalysis.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        status: analysisStatus,
        cephSuitabilityStatus: "not_evaluated_storage_1",
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
        eventType:
          validated.wordCount > 0 ? "storage_context_saved" : "storage_context_cleared",
        message:
          validated.wordCount > 0
            ? "Saved optional storage context draft."
            : "Cleared optional storage context draft.",
        metadataJson: buildStorageReadinessAuditMetadata({
          status,
          wordCount: validated.wordCount,
          characterCount: validated.characterCount,
          planLimitWords: limits.maxStorageContextWords,
          planLimitFiles: limits.maxStorageEvidenceFiles,
        }),
      },
    });

    return context;
  });
}

export async function submitStorageContext(
  params: ActorParams & {
    rawText: FormDataEntryValue | string | null | undefined;
  },
) {
  const assessment = await ensureAssessmentOwnership(params);
  const limits = await getLimitsForAssessment({
    userId: params.userId,
    assessment,
  });
  const validated = validateStorageContextText({
    rawText: params.rawText,
    limits,
  });
  const analysisStatus = analysisStatusAfterStorageChange({
    hasContent: true,
    existingGeneratedAt: assessment.storageAnalysis?.generatedAt,
    existingStatus: assessment.storageAnalysis?.status,
  });
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const context = await tx.assessmentStorageContext.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        rawText: validated.rawText,
        wordCount: validated.wordCount,
        characterCount: validated.characterCount,
        status: AssessmentStorageContextStatus.submitted,
        planLimitWords: limits.maxStorageContextWords,
        planLimitFiles: limits.maxStorageEvidenceFiles,
        truncated: validated.truncated,
        submittedByUserId: params.userId,
        submittedAt: now,
        lastEditedAt: now,
      },
      update: {
        rawText: validated.rawText,
        wordCount: validated.wordCount,
        characterCount: validated.characterCount,
        status: AssessmentStorageContextStatus.submitted,
        planLimitWords: limits.maxStorageContextWords,
        planLimitFiles: limits.maxStorageEvidenceFiles,
        truncated: validated.truncated,
        submittedByUserId: params.userId,
        submittedAt: now,
        lastEditedAt: now,
      },
    });

    await tx.assessmentStorageAnalysis.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        status: analysisStatus,
        cephSuitabilityStatus: "not_evaluated_storage_1",
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
        eventType: "storage_context_submitted",
        message: "Submitted optional storage context.",
        metadataJson: buildStorageReadinessAuditMetadata({
          status: AssessmentStorageContextStatus.submitted,
          wordCount: validated.wordCount,
          characterCount: validated.characterCount,
          planLimitWords: limits.maxStorageContextWords,
          planLimitFiles: limits.maxStorageEvidenceFiles,
        }),
      },
    });

    return context;
  });
}

export async function classifyStorageEvidence(
  params: ActorParams & {
    evidenceFileId: string;
    classification: FormDataEntryValue | string | null | undefined;
    notes?: FormDataEntryValue | string | null | undefined;
    includedInStorageAnalysis?: boolean;
  },
) {
  const assessment = await ensureAssessmentOwnership(params);
  const classification = parseStorageEvidenceClassification(params.classification);
  const notes = typeof params.notes === "string" ? params.notes.trim().slice(0, 8_000) : null;

  const evidenceFile = assessment.evidenceFiles.find(
    (file) =>
      file.id === params.evidenceFileId &&
      file.deletedAt === null &&
      file.processingStatus !== "deleted",
  );

  if (!evidenceFile) {
    throw new Error("Storage evidence file not found for this assessment.");
  }

  const includedInStorageAnalysis = params.includedInStorageAnalysis ?? true;

  return prisma.$transaction(async (tx) => {
    const storageEvidence = await tx.assessmentStorageEvidence.upsert({
      where: {
        assessmentId_evidenceFileId: {
          assessmentId: assessment.id,
          evidenceFileId: evidenceFile.id,
        },
      },
      create: {
        assessmentId: assessment.id,
        evidenceFileId: evidenceFile.id,
        classification,
        analysisStatus: AssessmentStorageEvidenceAnalysisStatus.received_not_analyzed,
        includedInStorageAnalysis,
        notes,
      },
      update: {
        classification,
        includedInStorageAnalysis,
        notes,
        analysisStatus: AssessmentStorageEvidenceAnalysisStatus.received_not_analyzed,
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "storage_evidence_classified",
        message: "Classified storage evidence metadata.",
        metadataJson: buildStorageReadinessAuditMetadata({
          storageEvidenceId: storageEvidence.id,
          evidenceFileId: evidenceFile.id,
          classification,
          includedInStorageAnalysis,
        }),
      },
    });

    return storageEvidence;
  });
}

export async function setStorageEvidenceIncluded(
  params: ActorParams & {
    storageEvidenceId: string;
    includedInStorageAnalysis: boolean;
  },
) {
  const assessment = await ensureAssessmentOwnership(params);

  const existing = assessment.storageEvidence.find((item) => item.id === params.storageEvidenceId);
  if (!existing) {
    throw new Error("Storage evidence metadata not found for this assessment.");
  }

  return prisma.$transaction(async (tx) => {
    const storageEvidence = await tx.assessmentStorageEvidence.update({
      where: { id: existing.id },
      data: {
        includedInStorageAnalysis: params.includedInStorageAnalysis,
        analysisStatus: params.includedInStorageAnalysis
          ? AssessmentStorageEvidenceAnalysisStatus.received_not_analyzed
          : AssessmentStorageEvidenceAnalysisStatus.excluded,
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: params.includedInStorageAnalysis
          ? "storage_evidence_included"
          : "storage_evidence_excluded",
        message: params.includedInStorageAnalysis
          ? "Included storage evidence in future storage analysis."
          : "Excluded storage evidence from future storage analysis.",
        metadataJson: buildStorageReadinessAuditMetadata({
          storageEvidenceId: storageEvidence.id,
          evidenceFileId: storageEvidence.evidenceFileId,
          classification: storageEvidence.classification,
          includedInStorageAnalysis: params.includedInStorageAnalysis,
        }),
      },
    });

    return storageEvidence;
  });
}

export async function getStorageReadinessSummaryForAssessment(params: {
  userId: string;
  assessment: AssessmentDetail;
}) {
  return buildAssessmentStorageDestinationReadinessSummary(params);
}
