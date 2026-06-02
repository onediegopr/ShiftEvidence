import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { logger } from "../logging/logger";
import { ensureDefaultWorkspace } from "../workspace/workspaceService";
import { assertCanCreateAssessment } from "../admin/runtimeSettingsService";
import { INPUT_LIMITS, normalizeOptionalTextInput } from "../validation/inputLimits";
import { assertNotDemoMode } from "../demo/demoGuards";

export const assessmentCoreInclude = {
  workspace: {
    select: {
      id: true,
      name: true,
      ownerUserId: true,
      companyName: true,
      plan: true,
      billingStatus: true,
    },
  },
  modules: true,
  costRiskAssumptions: true,
  infrastructureInput: true,
  preliminaryResult: true,
  licensingAnalysis: true,
  storageReadinessInput: true,
  clientContext: true,
  clientContextAnalysis: true,
  entitlements: true,
  evidenceFiles: {
    orderBy: [
      {
        deletedAt: "asc",
      },
      {
        uploadedAt: "desc",
      },
    ],
  },
  evidenceModules: {
    include: {
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
    },
    orderBy: {
      moduleKey: "asc",
    },
  },
  additionalEvidence: {
    include: {
      evidenceFile: true,
    },
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
  },
  parsedVMs: {
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
  },
  parsedHosts: {
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
  },
  parsedDatastores: {
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
  },
  parsedSnapshots: {
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
  },
  parsedInventorySummaries: {
    orderBy: [
      {
        parsedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  },
  riskFindings: {
    orderBy: [
      {
        updatedAt: "desc",
      },
    ],
  },
  assessmentScore: true,
  auditEvents: true,
  upgradeEvents: true,
  reports: {
    orderBy: [
      {
        deletedAt: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  },
  unlockRequests: {
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
  },
} satisfies Prisma.AssessmentInclude;

const assessmentStorageInclude = {
  storageDestinationReadiness: true,
  storageContext: true,
  storageAnalysis: true,
  storageEvidence: {
    include: {
      evidenceFile: true,
    },
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
  },
} satisfies Prisma.AssessmentInclude;

export const assessmentDetailInclude = assessmentCoreInclude;

type AssessmentCoreDetail = Prisma.AssessmentGetPayload<{
  include: typeof assessmentCoreInclude;
}>;

type AssessmentStorageRelations = Pick<
  Prisma.AssessmentGetPayload<{
    include: typeof assessmentStorageInclude;
  }>,
  "storageDestinationReadiness" | "storageContext" | "storageAnalysis" | "storageEvidence"
>;

export type AssessmentDetail = AssessmentCoreDetail & AssessmentStorageRelations;

const emptyStorageRelations: AssessmentStorageRelations = {
  storageDestinationReadiness: null,
  storageContext: null,
  storageAnalysis: null,
  storageEvidence: [],
};

export type AssessmentListItem = Prisma.AssessmentGetPayload<{
  include: {
    modules: true;
    preliminaryResult: true;
    storageReadinessInput: true;
    infrastructureInput: true;
    costRiskAssumptions: true;
    assessmentScore: true;
    entitlements: true;
    reports: {
      orderBy: [
        {
          deletedAt: "asc";
        },
        {
          createdAt: "desc";
        },
      ];
    };
    evidenceFiles: {
      orderBy: [
        {
          deletedAt: "asc";
        },
        {
          uploadedAt: "desc";
        },
      ];
    };
  };
}>;

function parseAssessmentId(assessmentId: string) {
  const trimmed = assessmentId.trim();
  if (!trimmed) {
    throw new Error("Assessment ID is required.");
  }

  return trimmed;
}

async function loadOptionalStorageRelations(assessmentId: string): Promise<AssessmentStorageRelations> {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: {
        id: assessmentId,
      },
      include: assessmentStorageInclude,
    });

    if (!assessment) {
      return emptyStorageRelations;
    }

    return {
      storageDestinationReadiness: assessment.storageDestinationReadiness,
      storageContext: assessment.storageContext,
      storageAnalysis: assessment.storageAnalysis,
      storageEvidence: assessment.storageEvidence,
    };
  } catch (error) {
    logger.warn("assessment_detail_optional_storage_unavailable", {
      assessmentId,
      error,
    });

    return emptyStorageRelations;
  }
}

async function withOptionalStorageRelations<T extends AssessmentCoreDetail>(
  assessment: T,
): Promise<T & AssessmentStorageRelations> {
  const storageRelations = await loadOptionalStorageRelations(assessment.id);

  return {
    ...assessment,
    ...storageRelations,
  };
}

export async function listAssessmentsForCurrentWorkspace(params: {
  userId: string;
}) {
  const workspace = await ensureDefaultWorkspace({
    userId: params.userId,
  });

  return prisma.assessment.findMany({
    where: {
      workspaceId: workspace.id,
      archivedAt: null,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      include: {
        modules: true,
        preliminaryResult: true,
        storageReadinessInput: true,
        infrastructureInput: true,
        costRiskAssumptions: true,
        assessmentScore: true,
        entitlements: true,
        reports: {
          orderBy: [
            {
              deletedAt: "asc",
            },
            {
              createdAt: "desc",
            },
          ],
        },
        evidenceFiles: {
          orderBy: [
            {
              deletedAt: "asc",
            },
            {
              uploadedAt: "desc",
            },
          ],
        },
      },
    });
  }

export async function findAssessmentForUser(params: {
  userId: string;
  assessmentId: string;
}) {
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: parseAssessmentId(params.assessmentId),
      archivedAt: null,
      workspace: {
        members: {
          some: {
            userId: params.userId,
          },
        },
      },
    },
    include: assessmentDetailInclude,
  });

  if (!assessment) {
    return null;
  }

  return withOptionalStorageRelations(assessment);
}

export async function findAssessmentForAdmin(params: {
  assessmentId: string;
}) {
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: parseAssessmentId(params.assessmentId),
      archivedAt: null,
    },
    include: assessmentDetailInclude,
  });

  if (!assessment) {
    return null;
  }

  return withOptionalStorageRelations(assessment);
}

export async function ensureAssessmentOwnership(params: {
  userId: string;
  assessmentId: string;
}) {
  const assessment = await findAssessmentForUser(params);

  if (!assessment) {
    throw new Error("Assessment not found or access denied.");
  }

  return assessment;
}

export async function getAssessmentDetail(params: {
  userId: string;
  assessmentId: string;
}) {
  return ensureAssessmentOwnership(params);
}

export async function createAssessment(params: {
  userId: string;
  workspaceId?: string;
  title: string;
  clientLabel?: string | null;
  storageReadinessEnabled: boolean;
}) {
  const workspaceId = params.workspaceId ?? (await ensureDefaultWorkspace({ userId: params.userId })).id;
  const title = normalizeOptionalTextInput(params.title, "Assessment title", INPUT_LIMITS.assessmentTitle)
    ?? "VMware to Proxmox readiness assessment";
  const clientLabel = normalizeOptionalTextInput(params.clientLabel, "Client / company label", INPUT_LIMITS.companyName);

  await assertCanCreateAssessment({
    userId: params.userId,
    workspaceId,
  });

  const assessment = await prisma.$transaction(async (tx) => {
    const assessment = await tx.assessment.create({
      data: {
        workspaceId,
        title,
        clientLabel,
        assessmentType: "vmware_to_proxmox",
        sourcePlatform: "vmware",
        targetPlatform: "proxmox",
        status: "draft",
        planLevel: "free",
        storageReadinessEnabled: params.storageReadinessEnabled,
        storageReadinessStatus: params.storageReadinessEnabled ? "selected" : "not_selected",
        modules: {
          create: [
            {
              moduleKey: "cost_risk",
              status: "available",
              includedInPlan: true,
              isOptional: false,
              isPaidAddon: false,
            },
            {
              moduleKey: "storage_readiness",
              status: params.storageReadinessEnabled ? "selected" : "locked",
              includedInPlan: false,
              isOptional: true,
              isPaidAddon: true,
              priceCents: 29000,
            },
          ],
        },
        entitlements: {
          create: [
            {
              entitlementKey: "full_report_unlocked",
              status: "locked",
            },
            {
              entitlementKey: "storage_readiness_unlocked",
              status: params.storageReadinessEnabled ? "available" : "locked",
            },
            {
              entitlementKey: "pro_matrix_unlocked",
              status: "locked",
            },
            {
              entitlementKey: "review_call_unlocked",
              status: "locked",
            },
          ],
        },
        costRiskAssumptions: {
          create: {
            currency: "USD",
            years: 3,
          },
        },
        storageReadinessInput: params.storageReadinessEnabled
          ? {
              create: {},
            }
          : undefined,
      },
      include: assessmentDetailInclude,
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId,
        assessmentId: assessment.id,
        eventType: "assessment_created",
        message: "Created assessment draft.",
        metadataJson: {
          storageReadinessEnabled: params.storageReadinessEnabled,
        },
      },
    });

    return assessment;
  });

  return withOptionalStorageRelations(assessment);
}

export async function updateAssessmentBasics(params: {
  userId: string;
  assessmentId: string;
  title: string;
  clientLabel?: string | null;
}) {
  assertNotDemoMode({
    assessmentId: params.assessmentId,
    kind: "edit_assessment",
  });

  const assessment = await ensureAssessmentOwnership({
    userId: params.userId,
    assessmentId: params.assessmentId,
  });

  const title = normalizeOptionalTextInput(params.title, "Assessment title", INPUT_LIMITS.assessmentTitle) ?? assessment.title;
  const clientLabel = normalizeOptionalTextInput(params.clientLabel, "Client / company label", INPUT_LIMITS.companyName);

  const updatedAssessment = await prisma.$transaction(async (tx) => {
    const updatedAssessment = await tx.assessment.update({
      where: {
        id: assessment.id,
      },
      data: {
        title,
        clientLabel,
      },
      include: assessmentDetailInclude,
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "assessment_updated",
        message: "Updated assessment basics.",
        metadataJson: {
          title,
          clientLabel,
        },
      },
    });

    return updatedAssessment;
  });

  return withOptionalStorageRelations(updatedAssessment);
}

export async function setStorageReadinessEnabled(params: {
  userId: string;
  assessmentId: string;
  enabled: boolean;
}) {
  assertNotDemoMode({
    assessmentId: params.assessmentId,
    kind: "edit_assessment",
  });

  const assessment = await ensureAssessmentOwnership({
    userId: params.userId,
    assessmentId: params.assessmentId,
  });

  const updatedAssessment = await prisma.$transaction(async (tx) => {
    const updatedAssessment = await tx.assessment.update({
      where: {
        id: assessment.id,
      },
      data: {
        storageReadinessEnabled: params.enabled,
        storageReadinessStatus: params.enabled ? "selected" : "not_selected",
        modules: {
          update: {
            where: {
              assessmentId_moduleKey: {
                assessmentId: assessment.id,
                moduleKey: "storage_readiness",
              },
            },
            data: {
              status: params.enabled ? "selected" : "locked",
            },
          },
        },
        entitlements: {
          update: {
            where: {
              assessmentId_entitlementKey: {
                assessmentId: assessment.id,
                entitlementKey: "storage_readiness_unlocked",
              },
            },
            data: {
              status: params.enabled ? "available" : "locked",
            },
          },
        },
        storageReadinessInput: params.enabled
          ? {
              upsert: {
                create: {},
                update: {},
              },
            }
          : undefined,
      },
      include: assessmentDetailInclude,
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: params.enabled ? "storage_readiness_selected" : "storage_readiness_skipped_or_disabled",
        message: params.enabled
          ? "Enabled Storage Destination Readiness."
          : "Skipped or disabled Storage Destination Readiness.",
        metadataJson: {
          enabled: params.enabled,
        },
      },
    });

    return updatedAssessment;
  });

  return withOptionalStorageRelations(updatedAssessment);
}

export async function archiveAssessment(params: {
  userId: string;
  assessmentId: string;
}) {
  assertNotDemoMode({
    assessmentId: params.assessmentId,
    kind: "edit_assessment",
  });

  const assessment = await ensureAssessmentOwnership({
    userId: params.userId,
    assessmentId: params.assessmentId,
  });

  const archivedAssessment = await prisma.$transaction(async (tx) => {
    const archived = await tx.assessment.update({
      where: {
        id: assessment.id,
      },
      data: {
        status: "archived",
        archivedAt: new Date(),
      },
      include: assessmentDetailInclude,
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "assessment_archived",
        message: "Archived readiness assessment.",
      },
    });

    return archived;
  });

  return withOptionalStorageRelations(archivedAssessment);
}
