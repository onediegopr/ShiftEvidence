import type {
  BillingEntitlementGrant,
  BillingOrder,
  EntitlementKey,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { grantAssessmentEntitlement } from "../../unlocks/entitlementService";
import { INPUT_LIMITS, normalizeOptionalTextInput } from "../../validation/inputLimits";

type DbClient = PrismaClient | Prisma.TransactionClient;

export type BillingFulfillmentStatus = "eligible" | "ineligible" | "already_granted";

export type BillingFulfillmentPreview = {
  billingOrderId: string;
  status: BillingFulfillmentStatus;
  eligible: boolean;
  reasons: string[];
  planId: string;
  planLabel: string;
  entitlementKeys: EntitlementKey[];
  existingGrantKeys: EntitlementKey[];
  matchComplete: boolean;
};

type BillingOrderForFulfillment = BillingOrder & {
  user?: { id: string; email: string } | null;
  workspace?: { id: string; ownerUserId: string } | null;
  assessment?: { id: string; workspaceId: string } | null;
};

const billingPlanFulfillmentConfig: Record<string, { label: string; entitlementKeys: EntitlementKey[] }> = {
  starter_readiness: {
    label: "Starter Readiness",
    entitlementKeys: ["full_report_unlocked"],
  },
  professional_assessment: {
    label: "Professional Assessment",
    entitlementKeys: ["full_report_unlocked", "pro_matrix_unlocked"],
  },
};

const ineligiblePlanLabels: Record<string, string> = {
  migration_blueprint: "Migration Blueprint requiere fulfillment manual fuera de este flujo.",
  msp_partner: "MSP Partner requiere proceso partner separado.",
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
    if (item === undefined || item === null) continue;
    if (typeof item === "string") {
      output[key] = item.slice(0, 300);
    } else if (typeof item === "number" || typeof item === "boolean") {
      output[key] = item;
    } else if (Array.isArray(item)) {
      output[key] = item
        .filter((entry) => typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean")
        .map((entry) => (typeof entry === "string" ? entry.slice(0, 300) : entry)) as Prisma.InputJsonArray;
    } else if (typeof item === "object") {
      output[key] = compactMetadata(item as Record<string, unknown>);
    }
  }

  return output;
}

function isUniqueGrantConflict(error: unknown) {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002";
}

export function getBillingPlanEntitlementKeys(planId: string): EntitlementKey[] {
  return billingPlanFulfillmentConfig[planId]?.entitlementKeys ?? [];
}

export function getBillingPlanFulfillmentLabel(planId: string) {
  return billingPlanFulfillmentConfig[planId]?.label ?? planId;
}

function evaluateOrderEligibility(params: {
  order: Pick<BillingOrderForFulfillment, "id" | "planId" | "status" | "userId" | "workspaceId" | "assessmentId" | "refundedAt" | "cancelledAt">;
  existingGrantKeys: EntitlementKey[];
}) {
  const reasons: string[] = [];
  const entitlementKeys = getBillingPlanEntitlementKeys(params.order.planId);

  if (!params.order.userId || !params.order.workspaceId || !params.order.assessmentId) {
    reasons.push("La orden debe tener match completo con usuario, workspace y assessment.");
  }

  if (entitlementKeys.length === 0) {
    reasons.push(ineligiblePlanLabels[params.order.planId] ?? "Plan no soportado para fulfillment manual.");
  }

  if (params.order.status !== "paid") {
    reasons.push("La orden debe estar paid para conceder acceso real.");
  }

  if (params.order.status === "refunded" || params.order.refundedAt) {
    reasons.push("La orden esta refunded y no es elegible.");
  }

  if (params.order.status === "cancelled" || params.order.cancelledAt) {
    reasons.push("La orden esta cancelled y no es elegible.");
  }

  const allEntitlementsAlreadyGranted =
    entitlementKeys.length > 0 && entitlementKeys.every((key) => params.existingGrantKeys.includes(key));

  if (allEntitlementsAlreadyGranted) {
    reasons.push("Los entitlements esperados ya tienen grant de billing.");
  }

  return {
    entitlementKeys,
    reasons,
    status: allEntitlementsAlreadyGranted ? "already_granted" as const : reasons.length === 0 ? "eligible" as const : "ineligible" as const,
  };
}

export function buildBillingFulfillmentPreview(params: {
  order: Pick<BillingOrderForFulfillment, "id" | "planId" | "status" | "userId" | "workspaceId" | "assessmentId" | "refundedAt" | "cancelledAt">;
  existingGrantKeys?: EntitlementKey[];
}): BillingFulfillmentPreview {
  const existingGrantKeys = params.existingGrantKeys ?? [];
  const eligibility = evaluateOrderEligibility({
    order: params.order,
    existingGrantKeys,
  });

  return {
    billingOrderId: params.order.id,
    status: eligibility.status,
    eligible: eligibility.status === "eligible",
    reasons: eligibility.reasons,
    planId: params.order.planId,
    planLabel: getBillingPlanFulfillmentLabel(params.order.planId),
    entitlementKeys: eligibility.entitlementKeys,
    existingGrantKeys,
    matchComplete: Boolean(params.order.userId && params.order.workspaceId && params.order.assessmentId),
  };
}

async function loadOrderForFulfillment(tx: DbClient, billingOrderId: string) {
  return tx.billingOrder.findUnique({
    where: { id: billingOrderId },
    include: {
      user: {
        select: { id: true, email: true },
      },
      workspace: {
        select: { id: true, ownerUserId: true },
      },
      assessment: {
        select: { id: true, workspaceId: true },
      },
    },
  });
}

async function loadExistingGrantKeys(tx: DbClient, params: {
  billingOrderId: string;
  entitlementKeys: EntitlementKey[];
}) {
  if (params.entitlementKeys.length === 0) return [];

  const existing = await tx.billingEntitlementGrant.findMany({
    where: {
      billingOrderId: params.billingOrderId,
      entitlementKey: { in: params.entitlementKeys },
      status: { in: ["pending_review", "granted"] },
    },
    select: {
      entitlementKey: true,
    },
  });

  return existing.map((grant) => grant.entitlementKey);
}

async function assertOrderRelationships(tx: DbClient, order: BillingOrderForFulfillment) {
  if (!order.userId || !order.workspaceId || !order.assessmentId) {
    throw new Error("La orden debe tener match completo antes de fulfillment.");
  }

  if (!order.workspace || !order.assessment || !order.user) {
    throw new Error("No se pudieron cargar las entidades internas del match.");
  }

  if (order.assessment.workspaceId !== order.workspaceId) {
    throw new Error("El assessment no pertenece al workspace de la orden.");
  }

  if (order.workspace.ownerUserId === order.userId) return;

  const membership = await tx.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: order.workspaceId,
        userId: order.userId,
      },
    },
    select: { id: true },
  });

  if (!membership) {
    throw new Error("El usuario no pertenece al workspace seleccionado.");
  }
}

async function runInTransaction<T>(db: DbClient, callback: (tx: DbClient) => Promise<T>) {
  if ("$transaction" in db && typeof db.$transaction === "function") {
    return db.$transaction((tx) => callback(tx as DbClient));
  }

  return callback(db);
}

export async function previewBillingOrderFulfillment(params: {
  billingOrderId: string;
  db?: DbClient;
}): Promise<BillingFulfillmentPreview> {
  const db = params.db ?? prisma;
  const billingOrderId = normalizeId(params.billingOrderId);
  if (!billingOrderId) throw new Error("Orden de billing requerida.");

  const order = await loadOrderForFulfillment(db, billingOrderId);
  if (!order) throw new Error("Orden de billing no encontrada.");

  const entitlementKeys = getBillingPlanEntitlementKeys(order.planId);
  const existingGrantKeys = await loadExistingGrantKeys(db, {
    billingOrderId: order.id,
    entitlementKeys,
  });

  return buildBillingFulfillmentPreview({ order, existingGrantKeys });
}

export async function previewBillingOrdersFulfillment(params: {
  billingOrderIds: string[];
  db?: DbClient;
}) {
  const db = params.db ?? prisma;
  const uniqueIds = Array.from(new Set(params.billingOrderIds.map(normalizeId).filter(Boolean))) as string[];
  const previews = await Promise.all(
    uniqueIds.map(async (billingOrderId) => previewBillingOrderFulfillment({ billingOrderId, db })),
  );

  return Object.fromEntries(previews.map((preview) => [preview.billingOrderId, preview]));
}

export async function fulfillBillingOrderManually(params: {
  billingOrderId: string;
  adminUserId: string;
  adminEmail: string;
  confirmationAccepted: boolean;
  note?: string | null;
  db?: DbClient;
}) {
  const note = sanitizeInternalNote(params.note);
  const billingOrderId = normalizeId(params.billingOrderId);
  const db = params.db ?? prisma;

  if (!billingOrderId) throw new Error("Orden de billing requerida.");
  if (!params.confirmationAccepted) {
    throw new Error("La confirmacion explicita es obligatoria para conceder acceso.");
  }

  return runInTransaction(db, async (tx) => {
    const order = await loadOrderForFulfillment(tx, billingOrderId);
    if (!order) throw new Error("Orden de billing no encontrada.");

    await assertOrderRelationships(tx, order);

    const entitlementKeys = getBillingPlanEntitlementKeys(order.planId);
    const existingGrantKeys = await loadExistingGrantKeys(tx, {
      billingOrderId: order.id,
      entitlementKeys,
    });
    const preview = buildBillingFulfillmentPreview({ order, existingGrantKeys });

    if (!preview.eligible && preview.status !== "already_granted") {
      throw new Error(preview.reasons[0] ?? "La orden no es elegible para fulfillment manual.");
    }

    const createdGrants: BillingEntitlementGrant[] = [];
    const assessmentEntitlements: Array<{ entitlementKey: EntitlementKey }> = [];
    const grantedAt = new Date();

    for (const entitlementKey of entitlementKeys) {
      const existingGrant = await tx.billingEntitlementGrant.findFirst({
        where: {
          billingOrderId: order.id,
          entitlementKey,
          status: { in: ["pending_review", "granted"] },
        },
      });

      if (!existingGrant) {
        try {
          const createdGrant = await tx.billingEntitlementGrant.create({
            data: {
              billingOrderId: order.id,
              userId: order.userId,
              workspaceId: order.workspaceId,
              assessmentId: order.assessmentId,
              entitlementKey,
              status: "granted",
              source: "manual_billing_fulfillment",
              reviewNotes: note,
              grantedAt,
            },
          });
          createdGrants.push(createdGrant);
        } catch (error) {
          if (!isUniqueGrantConflict(error)) {
            throw error;
          }
        }
      }

      const assessmentEntitlement = await grantAssessmentEntitlement({
        assessmentId: order.assessmentId!,
        entitlementKey,
        source: `billing_order:${order.id}`,
        grantedAt,
        tx,
      });
      assessmentEntitlements.push({ entitlementKey: assessmentEntitlement.entitlementKey });
    }

    await tx.auditEvent.create({
      data: {
        userId: params.adminUserId,
        workspaceId: order.workspaceId,
        assessmentId: order.assessmentId,
        eventType: "billing_order_fulfilled",
        message: createdGrants.length > 0
          ? "Billing order fulfilled manually. This granted assessment access."
          : "Billing order fulfillment replayed idempotently. No duplicate access was created.",
        metadataJson: compactMetadata({
          actorEmail: params.adminEmail,
          billingOrderId: order.id,
          providerOrderId: order.providerOrderId,
          planId: order.planId,
          userId: order.userId,
          workspaceId: order.workspaceId,
          assessmentId: order.assessmentId,
          entitlementKeys,
          billingEntitlementGrantIds: createdGrants.map((grant) => grant.id),
          assessmentEntitlements: assessmentEntitlements.map((item) => item.entitlementKey),
          result: createdGrants.length > 0 ? "granted" : "already_granted",
          note,
        }),
      },
    });

    return {
      status: createdGrants.length > 0 ? "granted" as const : "already_granted" as const,
      entitlementKeys,
      createdBillingEntitlementGrantIds: createdGrants.map((grant) => grant.id),
      assessmentEntitlementKeys: assessmentEntitlements.map((item) => item.entitlementKey),
    };
  });
}
