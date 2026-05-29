import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ensureDefaultWorkspace } from "../workspace/workspaceService";
import { assertCanCreateAssessment } from "../admin/runtimeSettingsService";
import { INPUT_LIMITS, normalizeOptionalTextInput } from "../validation/inputLimits";

export const assessmentDetailInclude = {
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

export type AssessmentDetail = Prisma.AssessmentGetPayload<{
  include: typeof assessmentDetailInclude;
}>;

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
  return prisma.assessment.findFirst({
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

  return prisma.$transaction(async (tx) => {
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
}

export async function updateAssessmentBasics(params: {
  userId: string;
  assessmentId: string;
  title: string;
  clientLabel?: string | null;
}) {
  const assessment = await ensureAssessmentOwnership({
    userId: params.userId,
    assessmentId: params.assessmentId,
  });

  const title = normalizeOptionalTextInput(params.title, "Assessment title", INPUT_LIMITS.assessmentTitle) ?? assessment.title;
  const clientLabel = normalizeOptionalTextInput(params.clientLabel, "Client / company label", INPUT_LIMITS.companyName);

  return prisma.$transaction(async (tx) => {
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
}

export async function setStorageReadinessEnabled(params: {
  userId: string;
  assessmentId: string;
  enabled: boolean;
}) {
  const assessment = await ensureAssessmentOwnership({
    userId: params.userId,
    assessmentId: params.assessmentId,
  });

  return prisma.$transaction(async (tx) => {
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
}

export async function archiveAssessment(params: {
  userId: string;
  assessmentId: string;
}) {
  const assessment = await ensureAssessmentOwnership({
    userId: params.userId,
    assessmentId: params.assessmentId,
  });

  return prisma.$transaction(async (tx) => {
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
}
