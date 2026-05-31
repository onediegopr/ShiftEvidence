import {
  type AssessmentEntitlement,
  type Prisma,
  type UnlockRequestStatus,
  type UnlockRequestType,
} from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ensureAssessmentOwnership, type AssessmentDetail } from "../assessments/assessmentService";
import { INPUT_LIMITS, normalizeOptionalTextInput } from "../validation/inputLimits";
import { grantEntitlementsForUnlockType, mapUnlockTypeToEntitlements, type UnlockType } from "./entitlementService";

export type UnlockRequestAdminRecord = Prisma.UnlockRequestGetPayload<{
  include: typeof unlockRequestAdminInclude;
}>;

export type CommercialStatusTone = "neutral" | "good" | "warning" | "danger";

export type CommercialStatusChip = {
  key: string;
  label: string;
  tone: CommercialStatusTone;
  detail: string;
};

export type CommercialStatusModule = CommercialStatusChip & {
  unlocked: boolean;
  statusLabel: string;
};

export type CommercialStatusSummary = {
  primaryLabel: string;
  primaryTone: CommercialStatusTone;
  primaryDetail: string;
  chips: CommercialStatusModule[];
  activeRequests: Array<{
    id: string;
    requestedType: UnlockRequestType;
    status: UnlockRequestStatus;
    createdAt: Date;
    amountCents: number | null;
    currency: string;
    notes: string | null;
    adminNotes: string | null;
    contactEmail: string | null;
  }>;
  hasFullReportUnlocked: boolean;
  hasProUnlocked: boolean;
  hasStorageAddonUnlocked: boolean;
  hasTechnicalReviewUnlocked: boolean;
};

const unlockRequestAdminInclude = {
  assessment: {
    select: {
      id: true,
      title: true,
      clientLabel: true,
      workspaceId: true,
    },
  },
  workspace: {
    select: {
      id: true,
      name: true,
      companyName: true,
      plan: true,
    },
  },
  user: {
    select: {
      id: true,
      email: true,
      name: true,
    },
  },
} as const;

const unlockTypeConfig: Record<
  UnlockType,
  {
    title: string;
    entitlementKeys: string[];
    defaultAmountCents: number | null;
    defaultDetail: string;
  }
> = {
  readiness_report: {
    title: "Starter Readiness",
    entitlementKeys: ["full_report_unlocked"],
    defaultAmountCents: 49000,
    defaultDetail: "Manual review request for Starter Readiness access.",
  },
  readiness_report_pro: {
    title: "Professional Assessment",
    entitlementKeys: ["full_report_unlocked", "pro_matrix_unlocked"],
    defaultAmountCents: 150000,
    defaultDetail: "Manual review request for the Professional Assessment package.",
  },
  storage_addon: {
    title: "Storage Scope Review",
    entitlementKeys: ["storage_readiness_unlocked"],
    defaultAmountCents: null,
    defaultDetail: "Manual review request for storage scope and invoice routing.",
  },
  technical_review: {
    title: "Technical Review",
    entitlementKeys: ["review_call_unlocked"],
    defaultAmountCents: null,
    defaultDetail: "Manual review request for a scoped technical review path.",
  },
};

function getStatusTone(status: UnlockRequestStatus): CommercialStatusTone {
  switch (status) {
    case "fulfilled":
      return "good";
    case "approved":
    case "pending":
      return "warning";
    case "rejected":
      return "danger";
    default:
      return "neutral";
  }
}

function getStatusLabel(status: UnlockRequestStatus) {
  switch (status) {
    case "pending":
      return "Pending manual review";
    case "approved":
      return "Approved";
    case "fulfilled":
      return "Entitlement granted";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    default:
      return "Pending";
  }
}

export function getUnlockRequestTypeLabel(type: UnlockType | UnlockRequestType) {
  return unlockTypeConfig[type as UnlockType]?.title ?? "Unlock request";
}

export function getUnlockRequestStatusLabel(status: UnlockRequestStatus) {
  return getStatusLabel(status);
}

export function getUnlockRequestStatusTone(status: UnlockRequestStatus) {
  return getStatusTone(status);
}

function buildCommercialModule(params: {
  key: string;
  title: string;
  tone: CommercialStatusTone;
  detail: string;
  unlocked: boolean;
  statusLabel: string;
}) {
  return {
    key: params.key,
    label: `${params.title}: ${params.statusLabel}`,
    tone: params.tone,
    detail: params.detail,
    unlocked: params.unlocked,
    statusLabel: params.statusLabel,
  } satisfies CommercialStatusModule;
}

function getLatestRequestByType(assessment: {
  unlockRequests?: Array<{
    id: string;
    requestedType: UnlockRequestType;
    status: UnlockRequestStatus;
    createdAt: Date;
    amountCents: number | null;
    currency: string;
    notes: string | null;
    adminNotes: string | null;
    contactEmail: string | null;
  }>;
}, requestedType: UnlockRequestType) {
  return (
    [...(assessment.unlockRequests ?? [])]
      .filter((request) => request.requestedType === requestedType)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0] ?? null
  );
}

function hasUnlockedEntitlement(
  assessment: {
    entitlements?: Array<Pick<AssessmentEntitlement, "entitlementKey" | "status">>;
  },
  unlockType: UnlockType,
) {
  return mapUnlockTypeToEntitlements(unlockType).every((entitlementKey) =>
    assessment.entitlements?.some(
      (entitlement) =>
        entitlement.entitlementKey === entitlementKey &&
        (entitlement.status === "granted" || entitlement.status === "purchased"),
    ),
  );
}

export async function listUnlockRequestsForAssessment(params: {
  userId: string;
  assessmentId: string;
}) {
  const assessment = await ensureAssessmentOwnership(params);

  return prisma.unlockRequest.findMany({
    where: {
      assessmentId: assessment.id,
    },
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
  });
}

export async function listPendingUnlockRequestsForAdmin() {
  return prisma.unlockRequest.findMany({
    where: {
      status: "pending",
    },
    orderBy: [
      {
        createdAt: "asc",
      },
    ],
    include: unlockRequestAdminInclude,
  });
}

export async function listRecentUnlockRequestsForAdmin(limit = 50) {
  return prisma.unlockRequest.findMany({
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
    take: limit,
    include: unlockRequestAdminInclude,
  });
}

export async function getUnlockRequestForAdmin(unlockRequestId: string) {
  return prisma.unlockRequest.findUnique({
    where: {
      id: unlockRequestId,
    },
    include: unlockRequestAdminInclude,
  });
}

export async function createUnlockRequest(params: {
  userId: string;
  assessmentId: string;
  requestedType: UnlockType;
  contactEmail?: string | null;
  notes?: string | null;
}) {
  const contactEmail = normalizeOptionalTextInput(params.contactEmail, "Contact email", INPUT_LIMITS.email);
  const notes = normalizeOptionalTextInput(params.notes, "Unlock request notes", INPUT_LIMITS.notes);
  const assessment = await ensureAssessmentOwnership({
    userId: params.userId,
    assessmentId: params.assessmentId,
  });

  if (hasUnlockedEntitlement(assessment, params.requestedType)) {
    const existing = await prisma.unlockRequest.findFirst({
      where: {
        assessmentId: assessment.id,
        requestedType: params.requestedType,
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });

    return {
      unlockRequest: existing,
      outcome: "already_unlocked" as const,
      created: false,
    };
  }

  const pending = await prisma.unlockRequest.findFirst({
    where: {
      assessmentId: assessment.id,
      requestedType: params.requestedType,
      status: "pending",
    },
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
  });

  if (pending) {
    return {
      unlockRequest: pending,
      outcome: "reused_pending" as const,
      created: false,
    };
  }

  const config = unlockTypeConfig[params.requestedType];
  const createdAt = new Date();

  const unlockRequest = await prisma.$transaction(async (tx) => {
    const created = await tx.unlockRequest.create({
      data: {
        assessmentId: assessment.id,
        workspaceId: assessment.workspaceId,
        userId: params.userId,
        requestedType: params.requestedType,
        status: "pending",
        amountCents: config.defaultAmountCents,
        currency: "USD",
        contactEmail,
        notes,
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "unlock_request_created",
        message: `Created unlock request for ${config.title}.`,
        metadataJson: {
          unlockRequestId: created.id,
          requestedType: params.requestedType,
          status: created.status,
          amountCents: created.amountCents,
          currency: created.currency,
          createdAt: createdAt.toISOString(),
        },
      },
    });

    return created;
  });

  return {
    unlockRequest,
    outcome: "created" as const,
    created: true,
  };
}

async function updateUnlockRequestStatus(params: {
  adminUserId: string;
  unlockRequestId: string;
  status: UnlockRequestStatus;
  adminNotes?: string | null;
}) {
  const adminNotes = normalizeOptionalTextInput(params.adminNotes, "Admin notes", INPUT_LIMITS.notes);
  const current = await getUnlockRequestForAdmin(params.unlockRequestId);

  if (!current) {
    throw new Error("Unlock request not found.");
  }

  if (current.status === params.status) {
    return current;
  }

  if (current.status === "rejected" || current.status === "cancelled") {
    throw new Error("This unlock request is already closed.");
  }

  if (current.status === "fulfilled" && params.status !== "fulfilled") {
    throw new Error("This unlock request is already fulfilled.");
  }

  if (params.status === "rejected" && current.status !== "pending" && current.status !== "approved") {
    throw new Error("Only pending or approved unlock requests can be rejected.");
  }

  return prisma.unlockRequest.update({
    where: {
      id: current.id,
    },
    data: {
      status: params.status,
      adminNotes: adminNotes ?? current.adminNotes,
      approvedAt:
        params.status === "approved"
          ? current.approvedAt ?? new Date()
          : current.approvedAt,
      rejectedAt: params.status === "rejected" ? new Date() : current.rejectedAt,
      cancelledAt: params.status === "cancelled" ? new Date() : current.cancelledAt,
      fulfilledAt: params.status === "fulfilled" ? current.fulfilledAt ?? new Date() : current.fulfilledAt,
    },
  });
}

export async function approveUnlockRequest(params: {
  adminUserId: string;
  unlockRequestId: string;
  adminNotes?: string | null;
}) {
  const updated = await updateUnlockRequestStatus({
    adminUserId: params.adminUserId,
    unlockRequestId: params.unlockRequestId,
    status: "approved",
    adminNotes: params.adminNotes ?? null,
  });

  const request = await getUnlockRequestForAdmin(updated.id);
  if (!request) {
    throw new Error("Unlock request not found.");
  }

  await prisma.auditEvent.create({
    data: {
      userId: params.adminUserId,
      workspaceId: request.workspaceId,
      assessmentId: request.assessmentId,
      eventType: "unlock_request_approved",
      message: `Approved unlock request for ${getUnlockRequestTypeLabel(request.requestedType)}`,
      metadataJson: {
        unlockRequestId: request.id,
        requestedType: request.requestedType,
        status: request.status,
      },
    },
  });

  return request;
}

export async function rejectUnlockRequest(params: {
  adminUserId: string;
  unlockRequestId: string;
  adminNotes?: string | null;
}) {
  const updated = await updateUnlockRequestStatus({
    adminUserId: params.adminUserId,
    unlockRequestId: params.unlockRequestId,
    status: "rejected",
    adminNotes: params.adminNotes ?? null,
  });

  const request = await getUnlockRequestForAdmin(updated.id);
  if (!request) {
    throw new Error("Unlock request not found.");
  }

  await prisma.auditEvent.create({
    data: {
      userId: params.adminUserId,
      workspaceId: request.workspaceId,
      assessmentId: request.assessmentId,
      eventType: "unlock_request_rejected",
      message: `Rejected unlock request for ${getUnlockRequestTypeLabel(request.requestedType)}`,
      metadataJson: {
        unlockRequestId: request.id,
        requestedType: request.requestedType,
        status: request.status,
      },
    },
  });

  return request;
}

export async function cancelUnlockRequest(params: {
  adminUserId: string;
  unlockRequestId: string;
  adminNotes?: string | null;
}) {
  const updated = await updateUnlockRequestStatus({
    adminUserId: params.adminUserId,
    unlockRequestId: params.unlockRequestId,
    status: "cancelled",
    adminNotes: params.adminNotes ?? null,
  });

  const request = await getUnlockRequestForAdmin(updated.id);
  if (!request) {
    throw new Error("Unlock request not found.");
  }

  await prisma.auditEvent.create({
    data: {
      userId: params.adminUserId,
      workspaceId: request.workspaceId,
      assessmentId: request.assessmentId,
      eventType: "unlock_request_cancelled",
      message: `Cancelled unlock request for ${getUnlockRequestTypeLabel(request.requestedType)}`,
      metadataJson: {
        unlockRequestId: request.id,
        requestedType: request.requestedType,
        status: request.status,
      },
    },
  });

  return request;
}

export async function fulfillUnlockRequest(params: {
  adminUserId: string;
  unlockRequestId: string;
  adminNotes?: string | null;
}) {
  const request = await getUnlockRequestForAdmin(params.unlockRequestId);

  if (!request) {
    throw new Error("Unlock request not found.");
  }

  if (request.status === "rejected" || request.status === "cancelled") {
    throw new Error("This unlock request is already closed.");
  }

  if (request.status === "fulfilled") {
    return request;
  }

  const fulfilledAt = new Date();
  const source = `manual_unlock:${request.requestedType}`;

  const updated = await prisma.$transaction(async (tx) => {
    const entitlementGrant = await grantEntitlementsForUnlockType({
      assessmentId: request.assessmentId,
      unlockType: request.requestedType,
      source,
      tx,
    });

    const nextStatus: UnlockRequestStatus = "fulfilled";
    const updatedRequest = await tx.unlockRequest.update({
      where: {
        id: request.id,
      },
      data: {
        status: nextStatus,
        adminNotes: params.adminNotes ?? request.adminNotes,
        approvedAt: request.approvedAt ?? fulfilledAt,
        fulfilledAt,
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.adminUserId,
        workspaceId: request.workspaceId,
        assessmentId: request.assessmentId,
        eventType: "unlock_request_fulfilled",
        message: `Fulfilled unlock request for ${getUnlockRequestTypeLabel(request.requestedType)}`,
        metadataJson: {
          unlockRequestId: request.id,
          requestedType: request.requestedType,
          status: nextStatus,
          grantedEntitlements: entitlementGrant.map((item) => item.entitlementKey),
          fulfilledAt: fulfilledAt.toISOString(),
        },
      },
    });

    if (entitlementGrant.length > 0) {
      await tx.auditEvent.create({
        data: {
          userId: params.adminUserId,
          workspaceId: request.workspaceId,
          assessmentId: request.assessmentId,
          eventType: "entitlement_granted",
          message: `Granted entitlements for ${getUnlockRequestTypeLabel(request.requestedType)}.`,
          metadataJson: {
            unlockRequestId: request.id,
            requestedType: request.requestedType,
            entitlementKeys: entitlementGrant.map((item) => item.entitlementKey),
          },
        },
      });
    }

    return updatedRequest;
  });

  return updated;
}

export function getCommercialStatusForAssessment(assessment: AssessmentDetail): CommercialStatusSummary {
  const getEntitlementStatus = (entitlementKey: string) =>
    assessment.entitlements?.find((entitlement) => entitlement.entitlementKey === entitlementKey)?.status ?? "locked";

  const hasFinalEntitlement = (entitlementKey: string) => {
    const status = getEntitlementStatus(entitlementKey);
    return status === "granted" || status === "purchased";
  };

  const latestRequests = {
    readiness_report: getLatestRequestByType(assessment, "readiness_report"),
    readiness_report_pro: getLatestRequestByType(assessment, "readiness_report_pro"),
    storage_addon: getLatestRequestByType(assessment, "storage_addon"),
    technical_review: getLatestRequestByType(assessment, "technical_review"),
  } satisfies Record<UnlockType, ReturnType<typeof getLatestRequestByType>>;

  const storageEntitlementStatus = getEntitlementStatus("storage_readiness_unlocked");
  const hasFullReportUnlocked = hasFinalEntitlement("full_report_unlocked");
  const hasProUnlocked = hasFinalEntitlement("pro_matrix_unlocked");
  const hasStorageAddonUnlocked = hasFinalEntitlement("storage_readiness_unlocked");
  const hasTechnicalReviewUnlocked = hasFinalEntitlement("review_call_unlocked");
  const hasStorageAddonAvailable = storageEntitlementStatus === "available";

  const modules: CommercialStatusModule[] = [
    buildCommercialModule({
      key: "free_preview",
      title: "Free Preview",
      unlocked: true,
      statusLabel: "Available",
      tone: "good",
      detail: "Preliminary preview is available without an unlock.",
    }),
    buildCommercialModule({
      key: "readiness_report",
      title: "Starter Readiness",
      unlocked: hasFullReportUnlocked,
      statusLabel: hasFullReportUnlocked
        ? "Unlocked"
        : latestRequests.readiness_report?.status === "pending"
          ? "Pending manual review"
          : latestRequests.readiness_report?.status === "approved"
            ? "Approved"
            : latestRequests.readiness_report?.status === "rejected"
              ? "Rejected"
              : latestRequests.readiness_report?.status === "cancelled"
                ? "Cancelled"
                : "Locked",
      tone: hasFullReportUnlocked
        ? "good"
        : latestRequests.readiness_report?.status === "pending" || latestRequests.readiness_report?.status === "approved"
          ? "warning"
          : latestRequests.readiness_report?.status === "rejected"
            ? "danger"
            : "neutral",
      detail: hasFullReportUnlocked
        ? "Entitlement granted. Full report sections are available."
        : latestRequests.readiness_report?.status === "pending"
          ? "Request received. We'll contact you to confirm payment options and access."
          : latestRequests.readiness_report?.status === "approved"
            ? "Approved manually. Waiting for fulfillment."
            : latestRequests.readiness_report?.status === "rejected"
              ? "The request was rejected."
              : latestRequests.readiness_report?.status === "cancelled"
                ? "The request was cancelled."
                : "Request Starter Readiness access to open the assessment baseline.",
    }),
    buildCommercialModule({
      key: "readiness_report_pro",
      title: "Professional Assessment",
      unlocked: hasFullReportUnlocked && hasProUnlocked,
      statusLabel:
        hasFullReportUnlocked && hasProUnlocked
          ? "Unlocked"
          : latestRequests.readiness_report_pro?.status === "pending"
            ? "Pending manual review"
            : latestRequests.readiness_report_pro?.status === "approved"
              ? "Approved"
              : latestRequests.readiness_report_pro?.status === "rejected"
                ? "Rejected"
                : latestRequests.readiness_report_pro?.status === "cancelled"
                  ? "Cancelled"
                  : "Locked",
      tone:
        hasFullReportUnlocked && hasProUnlocked
          ? "good"
          : latestRequests.readiness_report_pro?.status === "pending" || latestRequests.readiness_report_pro?.status === "approved"
            ? "warning"
            : latestRequests.readiness_report_pro?.status === "rejected"
              ? "danger"
              : "neutral",
      detail:
        hasFullReportUnlocked && hasProUnlocked
          ? "Entitlement granted. Pro matrix and advanced sections are available."
          : latestRequests.readiness_report_pro?.status === "pending"
            ? "Request received. Manual review is pending."
            : latestRequests.readiness_report_pro?.status === "approved"
              ? "Approved manually. Waiting for fulfillment."
              : latestRequests.readiness_report_pro?.status === "rejected"
                ? "The request was rejected."
                : latestRequests.readiness_report_pro?.status === "cancelled"
                  ? "The request was cancelled."
                  : "Request Professional Assessment access for advanced sections.",
    }),
    buildCommercialModule({
      key: "storage_addon",
      title: "Storage Scope Review",
      unlocked: hasStorageAddonUnlocked,
      statusLabel: hasStorageAddonUnlocked
        ? "Unlocked"
        : hasStorageAddonAvailable
          ? "Selected"
        : latestRequests.storage_addon?.status === "pending"
          ? "Pending manual review"
          : latestRequests.storage_addon?.status === "approved"
            ? "Approved"
            : latestRequests.storage_addon?.status === "rejected"
              ? "Rejected"
              : latestRequests.storage_addon?.status === "cancelled"
                ? "Cancelled"
                : "Locked",
      tone: hasStorageAddonUnlocked
        ? "good"
        : hasStorageAddonAvailable
          ? "warning"
        : latestRequests.storage_addon?.status === "pending" || latestRequests.storage_addon?.status === "approved"
          ? "warning"
          : latestRequests.storage_addon?.status === "rejected"
            ? "danger"
            : "neutral",
      detail: hasStorageAddonUnlocked
        ? "Storage scope entitlement granted."
        : hasStorageAddonAvailable
          ? "Storage scope is selected but not manually unlocked yet."
        : latestRequests.storage_addon?.status === "pending"
          ? "Request received. We'll contact you to discuss scope and invoice routing."
          : latestRequests.storage_addon?.status === "approved"
            ? "Approved manually. Waiting for fulfillment."
            : latestRequests.storage_addon?.status === "rejected"
              ? "The request was rejected."
              : latestRequests.storage_addon?.status === "cancelled"
                ? "The request was cancelled."
                : "Request storage scope review.",
    }),
    buildCommercialModule({
      key: "technical_review",
      title: "Technical Review",
      unlocked: hasTechnicalReviewUnlocked,
      statusLabel: hasTechnicalReviewUnlocked
        ? "Unlocked"
        : latestRequests.technical_review?.status === "pending"
          ? "Pending manual review"
          : latestRequests.technical_review?.status === "approved"
            ? "Approved"
            : latestRequests.technical_review?.status === "rejected"
              ? "Rejected"
              : latestRequests.technical_review?.status === "cancelled"
                ? "Cancelled"
                : "Locked",
      tone: hasTechnicalReviewUnlocked
        ? "good"
        : latestRequests.technical_review?.status === "pending" || latestRequests.technical_review?.status === "approved"
          ? "warning"
          : latestRequests.technical_review?.status === "rejected"
            ? "danger"
            : "neutral",
      detail: hasTechnicalReviewUnlocked
        ? "Technical review entitlement granted."
        : latestRequests.technical_review?.status === "pending"
          ? "Request received. We'll contact you to confirm scope and payment options."
          : latestRequests.technical_review?.status === "approved"
            ? "Approved manually. Waiting for fulfillment."
            : latestRequests.technical_review?.status === "rejected"
              ? "The request was rejected."
              : latestRequests.technical_review?.status === "cancelled"
                ? "The request was cancelled."
                : "Request unlock to book the technical review path.",
    }),
  ];

  const primaryModule =
    modules.find((module) => module.key === "readiness_report_pro" && module.unlocked) ??
    modules.find((module) => module.key === "readiness_report" && module.unlocked) ??
    modules.find((module) => module.key === "storage_addon" && module.unlocked) ??
    modules.find((module) => module.key === "technical_review" && module.unlocked) ??
    modules.find((module) => module.key === "readiness_report_pro" && module.statusLabel === "Pending manual review") ??
    modules.find((module) => module.key === "readiness_report" && module.statusLabel === "Pending manual review") ??
    modules.find((module) => module.key === "storage_addon" && module.statusLabel === "Pending manual review") ??
    modules.find((module) => module.key === "technical_review" && module.statusLabel === "Pending manual review") ??
    modules[0];

  const primaryLabel = hasProUnlocked
    ? "Professional Assessment unlocked"
    : hasFullReportUnlocked
      ? "Starter Readiness unlocked"
      : hasStorageAddonUnlocked
        ? "Storage Scope Review unlocked"
        : hasStorageAddonAvailable
          ? "Storage Scope Review selected"
        : hasTechnicalReviewUnlocked
          ? "Technical Review unlocked"
          : primaryModule.statusLabel === "Pending manual review"
            ? "Pending manual review"
            : "Free Preview";

  const primaryTone: CommercialStatusTone = hasProUnlocked || hasFullReportUnlocked || hasStorageAddonUnlocked || hasTechnicalReviewUnlocked
    ? "good"
    : hasStorageAddonAvailable
      ? "warning"
      : primaryModule.tone;

  const primaryDetail = hasProUnlocked
    ? "The Professional Assessment path is unlocked."
    : hasFullReportUnlocked
      ? "The Starter Readiness path is unlocked."
    : hasStorageAddonUnlocked
        ? "The storage scope review is unlocked."
        : hasStorageAddonAvailable
          ? "Storage scope review is selected in this assessment."
        : hasTechnicalReviewUnlocked
          ? "The technical review path is unlocked."
          : primaryModule.detail;

  return {
    primaryLabel,
    primaryTone,
    primaryDetail,
    chips: modules,
    activeRequests: [...(assessment.unlockRequests ?? [])]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, 8),
    hasFullReportUnlocked,
    hasProUnlocked,
    hasStorageAddonUnlocked,
    hasTechnicalReviewUnlocked,
  };
}
