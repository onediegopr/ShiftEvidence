import {
  EvidenceModuleConfidenceLevel,
  EvidenceModuleKey,
  EvidenceModuleSourceType,
  EvidenceModuleStatus,
  EvidenceParseResultStatus,
  EvidenceUploadKind,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  completionForModuleStatus,
  confidenceForModuleStatus,
  getDefaultSourceTypeForFilename,
  getEvidenceModuleCatalog,
  getEvidenceModuleMetadata,
  warningForMissingModule,
} from "./evidenceModuleRegistry";
import { defaultEvidenceParserRegistry, type EvidenceParserRegistry } from "./evidenceParserRegistry";

const MODULE_INCLUDE = {
  lastUpload: {
    include: {
      evidenceFile: {
        select: {
          id: true,
          originalFilename: true,
          mimeType: true,
          sizeBytes: true,
          processingStatus: true,
          uploadedAt: true,
          deletedAt: true,
        },
      },
    },
  },
  lastParseResult: true,
  reviewedBy: {
    select: {
      id: true,
      email: true,
      name: true,
    },
  },
} satisfies Prisma.AssessmentEvidenceModuleInclude;

export type EvidenceExpansionModuleRecord = Prisma.AssessmentEvidenceModuleGetPayload<{
  include: typeof MODULE_INCLUDE;
}>;

export type EvidenceExpansionModuleSummary = {
  metadata: NonNullable<ReturnType<typeof getEvidenceModuleMetadata>>;
  record: EvidenceExpansionModuleRecord;
  reportWarning: string | null;
  requiresReview: boolean;
};

export type EvidenceExpansionSummary = {
  assessmentId: string;
  enabled: boolean;
  modules: EvidenceExpansionModuleSummary[];
  overallEvidenceConfidence: "limited" | "low" | "medium" | "high";
  completionPercent: number;
  missingEvidenceWarnings: string[];
};

function statusFromParseStatus(status: EvidenceParseResultStatus) {
  switch (status) {
    case EvidenceParseResultStatus.parsed:
      return EvidenceModuleStatus.parsed;
    case EvidenceParseResultStatus.parsed_with_warnings:
      return EvidenceModuleStatus.parsed_with_warnings;
    case EvidenceParseResultStatus.failed:
      return EvidenceModuleStatus.failed;
    case EvidenceParseResultStatus.unsupported:
      return EvidenceModuleStatus.uploaded;
    default:
      return EvidenceModuleStatus.uploaded;
  }
}

function sourceTypeToUploadKind(sourceType: EvidenceModuleSourceType) {
  return sourceType === EvidenceModuleSourceType.collector_output
    ? EvidenceUploadKind.collector_output
    : sourceType === EvidenceModuleSourceType.csv || sourceType === EvidenceModuleSourceType.xlsx
      ? EvidenceUploadKind.template
      : EvidenceUploadKind.manual;
}

function safeJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

function buildSummaryFromRecords(params: {
  assessmentId: string;
  records: EvidenceExpansionModuleRecord[];
  enabled?: boolean;
}): EvidenceExpansionSummary {
  const modules = getEvidenceModuleCatalog().map((metadata) => {
    const record = params.records.find((item) => item.moduleKey === metadata.key);
    if (!record) {
      throw new Error(`Evidence module record missing after initialization: ${metadata.key}`);
    }

    const reportWarning =
      record.status === EvidenceModuleStatus.not_provided || record.status === EvidenceModuleStatus.failed
        ? warningForMissingModule(metadata)
        : null;

    return {
      metadata,
      record,
      reportWarning,
      requiresReview:
        record.status === EvidenceModuleStatus.parsed_with_warnings ||
        record.status === EvidenceModuleStatus.failed,
    };
  });

  const completionValues = modules.map((module) => module.record.completionPercent);
  const completionPercent =
    completionValues.length === 0
      ? 0
      : Math.round(completionValues.reduce((total, value) => total + value, 0) / completionValues.length);

  const strongSignals = modules.filter(
    (module) =>
      module.record.status === EvidenceModuleStatus.parsed ||
      module.record.status === EvidenceModuleStatus.reviewed,
  ).length;
  const warningSignals = modules.filter(
    (module) =>
      module.record.status === EvidenceModuleStatus.parsed_with_warnings ||
      module.record.status === EvidenceModuleStatus.uploaded,
  ).length;

  const overallEvidenceConfidence =
    strongSignals >= 3
      ? "high"
      : strongSignals >= 1 || warningSignals >= 3
        ? "medium"
        : warningSignals >= 1
          ? "low"
          : "limited";

  return {
    assessmentId: params.assessmentId,
    enabled: params.enabled ?? true,
    modules,
    overallEvidenceConfidence,
    completionPercent,
    missingEvidenceWarnings: modules.flatMap((module) => (module.reportWarning ? [module.reportWarning] : [])),
  };
}

export function getEvidenceCompletenessSummaryFromModuleRecords(params: {
  assessmentId: string;
  modules?: Array<{
    moduleKey: EvidenceModuleKey;
    status: EvidenceModuleStatus;
    confidenceLevel: EvidenceModuleConfidenceLevel;
    completionPercent: number;
  }> | null;
}) {
  const records = getEvidenceModuleCatalog().map((metadata) => {
    const existing = params.modules?.find((module) => module.moduleKey === metadata.key);
    const status = existing?.status ?? EvidenceModuleStatus.not_provided;
    return {
      moduleKey: metadata.key,
      displayName: metadata.displayName,
      status,
      confidenceLevel: existing?.confidenceLevel ?? confidenceForModuleStatus(status),
      completionPercent: existing?.completionPercent ?? completionForModuleStatus(status),
      confidenceImpact: metadata.confidenceImpact,
      reportWarning:
        status === EvidenceModuleStatus.not_provided || status === EvidenceModuleStatus.failed
          ? warningForMissingModule(metadata)
          : null,
    };
  });

  const completionPercent = Math.round(
    records.reduce((total, record) => total + record.completionPercent, 0) / Math.max(records.length, 1),
  );

  return {
    completionPercent,
    modules: records,
    missingEvidenceWarnings: records.flatMap((record) => (record.reportWarning ? [record.reportWarning] : [])),
  };
}

export async function initializeEvidenceModulesForAssessment(params: {
  assessmentId: string;
  userId?: string | null;
  workspaceId?: string | null;
}) {
  const existing = await prisma.assessmentEvidenceModule.findMany({
    where: { assessmentId: params.assessmentId },
    select: { moduleKey: true },
  });
  const existingKeys = new Set(existing.map((module) => module.moduleKey));
  const missing = getEvidenceModuleCatalog().filter((module) => !existingKeys.has(module.key));

  if (missing.length === 0) {
    return;
  }

  await prisma.assessmentEvidenceModule.createMany({
    data: missing.map((module) => ({
      assessmentId: params.assessmentId,
      moduleKey: module.key,
      status: module.defaultStatus,
      confidenceLevel: EvidenceModuleConfidenceLevel.limited,
      completionPercent: 0,
    })),
    skipDuplicates: true,
  });

  await prisma.auditEvent.create({
    data: {
      userId: params.userId ?? null,
      workspaceId: params.workspaceId ?? null,
      assessmentId: params.assessmentId,
      eventType: "evidence_module_initialized",
      message: "Initialized optional evidence modules.",
      metadataJson: {
        moduleKeys: missing.map((module) => module.key),
      },
    },
  });
}

export async function getEvidenceExpansionSummary(params: {
  assessmentId: string;
  userId?: string | null;
  workspaceId?: string | null;
  enabled?: boolean;
}) {
  await initializeEvidenceModulesForAssessment(params);
  const records = await prisma.assessmentEvidenceModule.findMany({
    where: { assessmentId: params.assessmentId },
    include: MODULE_INCLUDE,
    orderBy: { moduleKey: "asc" },
  });

  return buildSummaryFromRecords({
    assessmentId: params.assessmentId,
    records,
    enabled: params.enabled ?? true,
  });
}

export async function associateEvidenceFileWithModule(params: {
  userId: string;
  assessmentId: string;
  workspaceId: string;
  evidenceFileId: string;
  moduleKey: EvidenceModuleKey;
  originalFilename: string;
  schemaVersion?: string | null;
  collectorName?: string | null;
  collectorVersion?: string | null;
  sourcePlatform?: string | null;
}) {
  const metadata = getEvidenceModuleMetadata(params.moduleKey);
  if (!metadata) {
    throw new Error("Unsupported evidence module.");
  }

  await initializeEvidenceModulesForAssessment({
    assessmentId: params.assessmentId,
    userId: params.userId,
    workspaceId: params.workspaceId,
  });

  const sourceType = getDefaultSourceTypeForFilename(params.originalFilename);
  const upload = await prisma.evidenceUpload.create({
    data: {
      assessmentId: params.assessmentId,
      evidenceFileId: params.evidenceFileId,
      moduleKey: params.moduleKey,
      uploadKind: sourceTypeToUploadKind(sourceType),
      originalFilename: params.originalFilename,
      schemaVersion: params.schemaVersion ?? null,
      collectorName: params.collectorName ?? null,
      collectorVersion: params.collectorVersion ?? null,
      sourcePlatform: params.sourcePlatform ?? null,
      uploadedByUserId: params.userId,
    },
  });

  await prisma.assessmentEvidenceModule.update({
    where: {
      assessmentId_moduleKey: {
        assessmentId: params.assessmentId,
        moduleKey: params.moduleKey,
      },
    },
    data: {
      status: EvidenceModuleStatus.uploaded,
      sourceType,
      confidenceLevel: EvidenceModuleConfidenceLevel.low,
      completionPercent: completionForModuleStatus(EvidenceModuleStatus.uploaded),
      lastUploadId: upload.id,
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId: params.userId,
      workspaceId: params.workspaceId,
      assessmentId: params.assessmentId,
      eventType: "evidence_uploaded",
      message: "Uploaded optional evidence module artifact.",
      metadataJson: {
        moduleKey: params.moduleKey,
        evidenceFileId: params.evidenceFileId,
        evidenceUploadId: upload.id,
      },
    },
  });

  return upload;
}

export async function parseEvidenceUpload(params: {
  userId: string;
  workspaceId: string;
  evidenceUploadId: string;
  registry?: EvidenceParserRegistry;
}) {
  const registry = params.registry ?? defaultEvidenceParserRegistry;
  const upload = await prisma.evidenceUpload.findUnique({
    where: { id: params.evidenceUploadId },
    include: { evidenceFile: true },
  });

  if (!upload) {
    throw new Error("Evidence upload not found.");
  }

  const startedAt = new Date();
  await prisma.assessmentEvidenceModule.update({
    where: {
      assessmentId_moduleKey: {
        assessmentId: upload.assessmentId,
        moduleKey: upload.moduleKey,
      },
    },
    data: {
      status: EvidenceModuleStatus.parsing,
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId: params.userId,
      workspaceId: params.workspaceId,
      assessmentId: upload.assessmentId,
      eventType: "evidence_parse_started",
      message: "Started optional evidence parsing.",
      metadataJson: {
        moduleKey: upload.moduleKey,
        evidenceUploadId: upload.id,
        evidenceFileId: upload.evidenceFileId,
      },
    },
  });

  const parserResult = await registry.parse({
    assessmentId: upload.assessmentId,
    moduleKey: upload.moduleKey,
    evidenceFileId: upload.evidenceFileId,
    evidenceUploadId: upload.id,
    filePath: upload.evidenceFile.relativePath,
    mimeType: upload.evidenceFile.mimeType,
    originalFilename: upload.originalFilename,
    inputType: getDefaultSourceTypeForFilename(upload.originalFilename),
    schemaVersion: upload.schemaVersion,
  });
  const finishedAt = new Date();
  const moduleStatus = statusFromParseStatus(parserResult.status);

  const parseResult = await prisma.evidenceParseResult.create({
    data: {
      assessmentId: upload.assessmentId,
      evidenceUploadId: upload.id,
      moduleKey: upload.moduleKey,
      parserKey: parserResult.parserKey,
      parserVersion: parserResult.parserVersion,
      status: parserResult.status,
      summaryJson: safeJson(parserResult.summary),
      warningsJson: safeJson(parserResult.warnings),
      errorsJson: safeJson(parserResult.errors),
      normalizedEntitiesJson: safeJson(parserResult.normalizedEntities ?? {}),
      startedAt,
      finishedAt,
    },
  });

  await prisma.assessmentEvidenceModule.update({
    where: {
      assessmentId_moduleKey: {
        assessmentId: upload.assessmentId,
        moduleKey: upload.moduleKey,
      },
    },
    data: {
      status: moduleStatus,
      confidenceLevel: confidenceForModuleStatus(moduleStatus),
      completionPercent: completionForModuleStatus(moduleStatus),
      lastUploadId: upload.id,
      lastParseResultId: parseResult.id,
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId: params.userId,
      workspaceId: params.workspaceId,
      assessmentId: upload.assessmentId,
      eventType:
        parserResult.status === EvidenceParseResultStatus.failed
          ? "evidence_parse_failed"
          : "evidence_parse_completed",
      message:
        parserResult.status === EvidenceParseResultStatus.failed
          ? "Optional evidence parsing failed."
          : "Optional evidence parsing completed.",
      metadataJson: {
        moduleKey: upload.moduleKey,
        evidenceUploadId: upload.id,
        parseResultId: parseResult.id,
        status: parserResult.status,
        warningsCount: parserResult.warnings.length,
        errorsCount: parserResult.errors.length,
      },
    },
  });

  return parseResult;
}

export async function markEvidenceModuleSkipped(params: {
  userId: string;
  workspaceId: string;
  assessmentId: string;
  moduleKey: EvidenceModuleKey;
}) {
  const metadata = getEvidenceModuleMetadata(params.moduleKey);
  if (!metadata) {
    throw new Error("Unsupported evidence module.");
  }

  await initializeEvidenceModulesForAssessment(params);
  const updated = await prisma.assessmentEvidenceModule.update({
    where: {
      assessmentId_moduleKey: {
        assessmentId: params.assessmentId,
        moduleKey: params.moduleKey,
      },
    },
    data: {
      status: EvidenceModuleStatus.skipped,
      confidenceLevel: EvidenceModuleConfidenceLevel.none,
      completionPercent: 0,
      skippedAt: new Date(),
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId: params.userId,
      workspaceId: params.workspaceId,
      assessmentId: params.assessmentId,
      eventType: "evidence_module_skipped",
      message: "Optional evidence module skipped by user.",
      metadataJson: {
        moduleKey: params.moduleKey,
      },
    },
  });

  return updated;
}
