import type { EntitlementKey, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { revokeAssessmentEntitlement } from "../../unlocks/entitlementService";
import { INPUT_LIMITS, normalizeOptionalTextInput } from "../../validation/inputLimits";
import { deriveBillingGrantReviewStatus } from "./billingRefundCancelReviewService";

type DbClient = PrismaClient | Prisma.TransactionClient;

function sanitizeRequiredNote(value: string | null | undefined) {
  const note = normalizeOptionalTextInput(value, "Revocation note", INPUT_LIMITS.notes);
  if (!note) {
    throw new Error("La nota interna es obligatoria para revocar acceso.");
  }

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
    if (item === undefined || item === null) continue;
    if (typeof item === "string") output[key] = item.slice(0, 300);
    else if (typeof item === "number" || typeof item === "boolean") output[key] = item;
    else if (Array.isArray(item)) output[key] = item.filter((entry) => typeof entry === "string") as Prisma.InputJsonArray;
    else if (typeof item === "object") output[key] = compactMetadata(item as Record<string, unknown>);
  }

  return output;
}

async function runInTransaction<T>(db: DbClient, callback: (tx: DbClient) => Promise<T>) {
  if ("$transaction" in db && typeof db.$transaction === "function") {
    return db.$transaction((tx) => callback(tx as DbClient));
  }

  return callback(db);
}

export async function revokeBillingGrantedEntitlement(params: {
  billingEntitlementGrantId: string;
  adminUserId: string;
  adminEmail: string;
  confirmationAccepted: boolean;
  note?: string | null;
  db?: DbClient;
}) {
  if (!params.confirmationAccepted) {
    throw new Error("La confirmacion explicita es obligatoria para revocar acceso.");
  }

  const note = sanitizeRequiredNote(params.note);
  const db = params.db ?? prisma;

  return runInTransaction(db, async (tx) => {
    const grant = await tx.billingEntitlementGrant.findUnique({
      where: { id: params.billingEntitlementGrantId },
      include: {
        billingOrder: {
          select: {
            id: true,
            providerOrderId: true,
            status: true,
          },
        },
        billingSubscription: {
          select: {
            id: true,
            providerSubscriptionId: true,
            status: true,
          },
        },
      },
    });

    if (!grant) {
      throw new Error("Billing grant no encontrado.");
    }

    if (grant.status === "revoked") {
      return {
        status: "already_revoked" as const,
        entitlementKey: grant.entitlementKey,
      };
    }

    if (grant.source !== "manual_billing_fulfillment") {
      throw new Error("Solo se pueden revocar grants creados por fulfillment billing manual.");
    }

    if (!grant.assessmentId || !grant.workspaceId || !grant.userId || !grant.billingOrderId) {
      throw new Error("Grant incompleto. Requiere revision manual.");
    }

    const review = deriveBillingGrantReviewStatus({
      grantStatus: grant.status,
      source: grant.source,
      orderStatus: grant.billingOrder?.status ?? null,
      subscriptionStatus: grant.billingSubscription?.status ?? null,
    });

    if (!review.canRevoke) {
      throw new Error("El grant no esta en estado elegible para revocacion manual.");
    }

    const assessmentEntitlement = await tx.assessmentEntitlement.findUnique({
      where: {
        assessmentId_entitlementKey: {
          assessmentId: grant.assessmentId,
          entitlementKey: grant.entitlementKey,
        },
      },
      select: {
        source: true,
        status: true,
      },
    });

    if (!assessmentEntitlement || assessmentEntitlement.status === "locked") {
      throw new Error("No hay acceso activo que revocar para este assessment.");
    }

    if (assessmentEntitlement.source !== `billing_order:${grant.billingOrderId}`) {
      throw new Error("Otra fuente puede justificar este acceso. Requiere revision manual antes de revocar.");
    }

    const revokedAt = new Date();
    await revokeAssessmentEntitlement({
      assessmentId: grant.assessmentId,
      entitlementKey: grant.entitlementKey as EntitlementKey,
      source: `billing_revoke:${grant.id}`,
      tx,
    });

    const updatedGrant = await tx.billingEntitlementGrant.update({
      where: { id: grant.id },
      data: {
        status: "revoked",
        revokedAt,
        reviewNotes: note,
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.adminUserId,
        workspaceId: grant.workspaceId,
        assessmentId: grant.assessmentId,
        eventType: "billing_entitlement_revoked_from_billing",
        message: "Billing-granted entitlement revoked manually after refund/cancel review. No data was deleted.",
        metadataJson: compactMetadata({
          actorEmail: params.adminEmail,
          billingEntitlementGrantId: grant.id,
          billingOrderId: grant.billingOrderId,
          providerOrderId: grant.billingOrder?.providerOrderId,
          entitlementKey: grant.entitlementKey,
          userId: grant.userId,
          workspaceId: grant.workspaceId,
          assessmentId: grant.assessmentId,
          orderStatus: grant.billingOrder?.status,
          note,
          result: "revoked",
        }),
      },
    });

    return {
      status: "revoked" as const,
      entitlementKey: updatedGrant.entitlementKey,
    };
  });
}
