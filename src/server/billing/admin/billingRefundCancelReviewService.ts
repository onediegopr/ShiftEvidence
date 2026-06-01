import type { BillingGrantStatus, BillingOrderStatus, BillingSubscriptionStatus, EntitlementKey } from "@prisma/client";
import { prisma } from "../../../lib/prisma";

export type BillingGrantReviewStatus =
  | "granted"
  | "requires_review"
  | "revoked"
  | "no_action";

export type BillingGrantReviewItem = {
  id: string;
  billingOrderId: string | null;
  providerOrderId: string | null;
  orderStatus: BillingOrderStatus | null;
  billingSubscriptionId: string | null;
  providerSubscriptionId: string | null;
  subscriptionStatus: BillingSubscriptionStatus | null;
  entitlementKey: EntitlementKey;
  grantStatus: BillingGrantStatus;
  source: string;
  userId: string | null;
  workspaceId: string | null;
  assessmentId: string | null;
  grantedAt: Date | null;
  revokedAt: Date | null;
  reviewStatus: BillingGrantReviewStatus;
  recommendedAction: string;
  canRevoke: boolean;
};

function getOrderRiskStatus(status: BillingOrderStatus | null) {
  return status === "refunded" || status === "cancelled";
}

function getSubscriptionRiskStatus(status: BillingSubscriptionStatus | null) {
  return status === "cancelled" || status === "payment_failed" || status === "expired";
}

export function deriveBillingGrantReviewStatus(params: {
  grantStatus: BillingGrantStatus;
  source: string;
  orderStatus?: BillingOrderStatus | null;
  subscriptionStatus?: BillingSubscriptionStatus | null;
}) {
  if (params.grantStatus === "revoked") {
    return {
      reviewStatus: "revoked" as const,
      canRevoke: false,
      recommendedAction: "Acceso revocado. Mantener evidencia y auditoria.",
    };
  }

  if (params.source !== "manual_billing_fulfillment") {
    return {
      reviewStatus: "no_action" as const,
      canRevoke: false,
      recommendedAction: "Fuente no administrada por fulfillment billing manual.",
    };
  }

  if (getOrderRiskStatus(params.orderStatus ?? null)) {
    return {
      reviewStatus: "requires_review" as const,
      canRevoke: params.grantStatus === "granted",
      recommendedAction: "Revisar refund/cancel y decidir revocacion manual. No borrar datos.",
    };
  }

  if (getSubscriptionRiskStatus(params.subscriptionStatus ?? null)) {
    return {
      reviewStatus: "requires_review" as const,
      canRevoke: false,
      recommendedAction: "Requiere revision partner futura. No revocar automaticamente.",
    };
  }

  return {
    reviewStatus: "granted" as const,
    canRevoke: false,
    recommendedAction: "Sin accion requerida.",
  };
}

export async function getBillingRefundCancelReviewItems(limit = 25): Promise<BillingGrantReviewItem[]> {
  const grants = await prisma.billingEntitlementGrant.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      billingOrderId: true,
      billingSubscriptionId: true,
      entitlementKey: true,
      status: true,
      source: true,
      userId: true,
      workspaceId: true,
      assessmentId: true,
      grantedAt: true,
      revokedAt: true,
      billingOrder: {
        select: {
          providerOrderId: true,
          status: true,
        },
      },
      billingSubscription: {
        select: {
          providerSubscriptionId: true,
          status: true,
        },
      },
    },
  });

  return grants.map((grant) => {
    const derived = deriveBillingGrantReviewStatus({
      grantStatus: grant.status,
      source: grant.source,
      orderStatus: grant.billingOrder?.status ?? null,
      subscriptionStatus: grant.billingSubscription?.status ?? null,
    });

    return {
      id: grant.id,
      billingOrderId: grant.billingOrderId,
      providerOrderId: grant.billingOrder?.providerOrderId ?? null,
      orderStatus: grant.billingOrder?.status ?? null,
      billingSubscriptionId: grant.billingSubscriptionId,
      providerSubscriptionId: grant.billingSubscription?.providerSubscriptionId ?? null,
      subscriptionStatus: grant.billingSubscription?.status ?? null,
      entitlementKey: grant.entitlementKey,
      grantStatus: grant.status,
      source: grant.source,
      userId: grant.userId,
      workspaceId: grant.workspaceId,
      assessmentId: grant.assessmentId,
      grantedAt: grant.grantedAt,
      revokedAt: grant.revokedAt,
      reviewStatus: derived.reviewStatus,
      recommendedAction: derived.recommendedAction,
      canRevoke: derived.canRevoke,
    };
  });
}
