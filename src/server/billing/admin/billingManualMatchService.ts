import type { BillingOrder, BillingSubscription, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { INPUT_LIMITS, normalizeOptionalTextInput } from "../../validation/inputLimits";

type DbClient = PrismaClient | Prisma.TransactionClient;

export type BillingMatchStatus = "unmatched" | "partial" | "complete" | "needs_review";

type MatchAuditTarget = {
  userId: string | null;
  workspaceId: string | null;
  assessmentId?: string | null;
};

type MatchAuditParams = {
  tx: DbClient;
  actorUserId: string;
  actorEmail: string;
  entityType: "BillingOrder" | "BillingSubscription";
  entityId: string;
  providerId: string | null;
  planId: string;
  before: MatchAuditTarget;
  after: MatchAuditTarget;
  note: string | null;
};

export type BillingOrderMatchInput = {
  billingOrderId: string;
  userId?: string | null;
  workspaceId?: string | null;
  assessmentId?: string | null;
  adminUserId: string;
  adminEmail: string;
  note?: string | null;
};

export type BillingSubscriptionMatchInput = {
  billingSubscriptionId: string;
  userId?: string | null;
  workspaceId?: string | null;
  adminUserId: string;
  adminEmail: string;
  note?: string | null;
};

function normalizeId(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function sanitizeInternalNote(value: string | null | undefined) {
  const note = normalizeOptionalTextInput(value, "Internal note", INPUT_LIMITS.notes);
  if (!note) return null;

  const unsafe =
    /(?:lsk[_]|sk[_](?:live|test)|bearer\s+[a-z0-9._~+/=-]{20,}|eyj[a-z0-9_-]{20,}\.[a-z0-9_-]{20,}\.[a-z0-9_-]{20,}|database_url|api[_ -]?key|webhook[_ -]?secret|password|token|authorization|\b(?:\d[ -]?){13,19}\b)/i;

  if (unsafe.test(note)) {
    throw new Error("La nota interna parece contener credenciales o datos sensibles.");
  }

  return note;
}

function compactMetadata(value: Record<string, unknown>) {
  const output: Record<string, Prisma.InputJsonValue> = {};

  for (const [key, item] of Object.entries(value)) {
    if (item === undefined) continue;
    if (item === null) continue;
    if (typeof item === "string") {
      output[key] = item.slice(0, 300);
    } else if (typeof item === "number" || typeof item === "boolean") {
      output[key] = item;
    } else if (typeof item === "object" && !Array.isArray(item)) {
      output[key] = compactMetadata(item as Record<string, unknown>);
    }
  }

  return output;
}

export function getBillingOrderMatchStatus(order: Pick<BillingOrder, "userId" | "workspaceId" | "assessmentId">): BillingMatchStatus {
  const matchedCount = [order.userId, order.workspaceId, order.assessmentId].filter(Boolean).length;
  if (matchedCount === 0) return "unmatched";
  if (matchedCount === 3) return "complete";
  return "partial";
}

export function getBillingSubscriptionMatchStatus(
  subscription: Pick<BillingSubscription, "userId" | "workspaceId">,
): BillingMatchStatus {
  const matchedCount = [subscription.userId, subscription.workspaceId].filter(Boolean).length;
  if (matchedCount === 0) return "unmatched";
  if (matchedCount === 2) return "complete";
  return "partial";
}

async function loadUser(tx: DbClient, userId: string | null) {
  if (!userId) return null;
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!user) throw new Error("Usuario no encontrado.");
  return user;
}

async function loadWorkspace(tx: DbClient, workspaceId: string | null) {
  if (!workspaceId) return null;
  const workspace = await tx.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, name: true, ownerUserId: true },
  });
  if (!workspace) throw new Error("Workspace no encontrado.");
  return workspace;
}

async function loadAssessment(tx: DbClient, assessmentId: string | null) {
  if (!assessmentId) return null;
  const assessment = await tx.assessment.findFirst({
    where: {
      id: assessmentId,
      archivedAt: null,
    },
    select: { id: true, title: true, workspaceId: true },
  });
  if (!assessment) throw new Error("Assessment no encontrado.");
  return assessment;
}

async function assertUserBelongsToWorkspace(tx: DbClient, params: {
  userId: string;
  workspaceId: string;
  ownerUserId: string;
}) {
  if (params.ownerUserId === params.userId) return;

  const membership = await tx.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: params.workspaceId,
        userId: params.userId,
      },
    },
    select: { id: true },
  });

  if (!membership) {
    throw new Error("El usuario no pertenece al workspace seleccionado.");
  }
}

async function validateMatchTarget(tx: DbClient, params: {
  userId: string | null;
  workspaceId: string | null;
  assessmentId?: string | null;
}) {
  const user = await loadUser(tx, params.userId);
  const assessment = await loadAssessment(tx, params.assessmentId ?? null);
  const resolvedWorkspaceId = assessment?.workspaceId ?? params.workspaceId;
  const workspace = await loadWorkspace(tx, resolvedWorkspaceId ?? null);

  if (assessment && params.workspaceId && assessment.workspaceId !== params.workspaceId) {
    throw new Error("El assessment no pertenece al workspace seleccionado.");
  }

  if (user && workspace) {
    await assertUserBelongsToWorkspace(tx, {
      userId: user.id,
      workspaceId: workspace.id,
      ownerUserId: workspace.ownerUserId,
    });
  }

  return {
    userId: user?.id ?? null,
    workspaceId: workspace?.id ?? null,
    assessmentId: assessment?.id ?? null,
  };
}

async function recordBillingMatchAudit(params: MatchAuditParams) {
  await params.tx.auditEvent.create({
    data: {
      userId: params.actorUserId,
      workspaceId: params.after.workspaceId ?? undefined,
      assessmentId: params.after.assessmentId ?? undefined,
      eventType: params.entityType === "BillingOrder" ? "billing_order_matched" : "billing_subscription_matched",
      message: params.entityType === "BillingOrder"
        ? "Registro de billing asociado manualmente a entidades internas. Guardar match no otorga acceso."
        : "Suscripcion de billing asociada manualmente a entidades internas. Guardar match no activa acceso partner.",
      metadataJson: compactMetadata({
        actorEmail: params.actorEmail,
        entityType: params.entityType,
        entityId: params.entityId,
        providerId: params.providerId,
        planId: params.planId,
        before: params.before,
        after: params.after,
        note: params.note,
      }),
    },
  });
}

async function runInTransaction<T>(db: DbClient, callback: (tx: DbClient) => Promise<T>) {
  if ("$transaction" in db && typeof db.$transaction === "function") {
    return db.$transaction((tx) => callback(tx as DbClient));
  }

  return callback(db);
}

export async function matchBillingOrder(params: BillingOrderMatchInput & { db?: DbClient }) {
  const note = sanitizeInternalNote(params.note);
  const requested = {
    userId: normalizeId(params.userId),
    workspaceId: normalizeId(params.workspaceId),
    assessmentId: normalizeId(params.assessmentId),
  };
  const db = params.db ?? prisma;

  return runInTransaction(db, async (tx) => {
    const order = await tx.billingOrder.findUnique({
      where: { id: params.billingOrderId },
    });

    if (!order) {
      throw new Error("Orden de billing no encontrada.");
    }

    const target = await validateMatchTarget(tx, requested);
    const updated = await tx.billingOrder.update({
      where: { id: order.id },
      data: target,
    });

    await recordBillingMatchAudit({
      tx,
      actorUserId: params.adminUserId,
      actorEmail: params.adminEmail,
      entityType: "BillingOrder",
      entityId: order.id,
      providerId: order.providerOrderId,
      planId: order.planId,
      before: {
        userId: order.userId,
        workspaceId: order.workspaceId,
        assessmentId: order.assessmentId,
      },
      after: target,
      note,
    });

    return {
      record: updated,
      matchStatus: getBillingOrderMatchStatus(updated),
    };
  });
}

export async function matchBillingSubscription(params: BillingSubscriptionMatchInput & { db?: DbClient }) {
  const note = sanitizeInternalNote(params.note);
  const requested = {
    userId: normalizeId(params.userId),
    workspaceId: normalizeId(params.workspaceId),
  };
  const db = params.db ?? prisma;

  return runInTransaction(db, async (tx) => {
    const subscription = await tx.billingSubscription.findUnique({
      where: { id: params.billingSubscriptionId },
    });

    if (!subscription) {
      throw new Error("Suscripcion de billing no encontrada.");
    }

    const target = await validateMatchTarget(tx, requested);
    const updated = await tx.billingSubscription.update({
      where: { id: subscription.id },
      data: {
        userId: target.userId,
        workspaceId: target.workspaceId,
      },
    });

    await recordBillingMatchAudit({
      tx,
      actorUserId: params.adminUserId,
      actorEmail: params.adminEmail,
      entityType: "BillingSubscription",
      entityId: subscription.id,
      providerId: subscription.providerSubscriptionId,
      planId: subscription.planId,
      before: {
        userId: subscription.userId,
        workspaceId: subscription.workspaceId,
      },
      after: {
        userId: target.userId,
        workspaceId: target.workspaceId,
      },
      note,
    });

    return {
      record: updated,
      matchStatus: getBillingSubscriptionMatchStatus(updated),
    };
  });
}
