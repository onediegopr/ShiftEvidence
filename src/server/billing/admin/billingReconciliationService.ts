import type { BillingGrantStatus, EntitlementKey } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import type {
  BillingAdminLedgerEvent,
  BillingAdminLedgerOrder,
  BillingAdminLedgerPayment,
  BillingAdminLedgerSnapshot,
  BillingAdminLedgerSubscription,
} from "./billingAdminLedgerService";
import { getBillingOrderMatchStatus } from "./billingManualMatchService";

export type BillingReconciliationSeverity = "ok" | "review" | "warning" | "critical";

export type BillingReconciliationCategory =
  | "paid_order_without_payment"
  | "payment_without_matched_order"
  | "paid_order_unmatched"
  | "matched_not_fulfilled"
  | "fulfilled_order_ok"
  | "grant_without_paid_order"
  | "subscription_requires_review"
  | "event_requires_review"
  | "event_ignored"
  | "unknown_plan";

export type BillingReconciliationItem = {
  id: string;
  category: BillingReconciliationCategory;
  severity: BillingReconciliationSeverity;
  title: string;
  detail: string;
  action: string;
  provider: string;
  planId?: string | null;
  customerEmail?: string | null;
  billingOrderId?: string | null;
  billingPaymentId?: string | null;
  billingSubscriptionId?: string | null;
  billingEventId?: string | null;
  entitlementKey?: EntitlementKey | null;
};

export type BillingReconciliationGrant = {
  id: string;
  billingOrderId: string | null;
  billingSubscriptionId: string | null;
  entitlementKey: EntitlementKey;
  status: BillingGrantStatus;
  source: string;
};

export type BillingReconciliationSummary = {
  items: BillingReconciliationItem[];
  actionRequiredCount: number;
  criticalCount: number;
  warningCount: number;
  reviewCount: number;
  okCount: number;
  paidUnmatchedCount: number;
  matchedNotFulfilledCount: number;
  fulfilledOrderCount: number;
};

const supportedAssessmentFulfillmentPlans = new Set([
  "starter_readiness",
  "professional_assessment",
]);

const knownBillingPlans = new Set([
  "starter_readiness",
  "professional_assessment",
  "migration_blueprint",
  "msp_partner",
]);

function hasCompleteOrderMatch(order: Pick<BillingAdminLedgerOrder, "userId" | "workspaceId" | "assessmentId">) {
  return getBillingOrderMatchStatus(order) === "complete";
}

function isActiveGrant(grant: BillingReconciliationGrant) {
  return grant.status === "granted" || grant.status === "pending_review";
}

function makeItem(params: BillingReconciliationItem): BillingReconciliationItem {
  return params;
}

export function buildBillingReconciliationSummary(params: {
  orders: BillingAdminLedgerOrder[];
  payments: BillingAdminLedgerPayment[];
  subscriptions: BillingAdminLedgerSubscription[];
  events: BillingAdminLedgerEvent[];
  grants: BillingReconciliationGrant[];
}): BillingReconciliationSummary {
  const items: BillingReconciliationItem[] = [];
  const ordersById = new Map(params.orders.map((order) => [order.id, order]));
  const paidPaymentOrderIds = new Set(
    params.payments
      .filter((payment) => payment.status === "paid")
      .map((payment) => payment.orderId),
  );
  const activeGrantOrderIds = new Set(
    params.grants
      .filter((grant) => grant.billingOrderId && isActiveGrant(grant))
      .map((grant) => grant.billingOrderId as string),
  );

  for (const order of params.orders) {
    const matchComplete = hasCompleteOrderMatch(order);
    const hasPayment = paidPaymentOrderIds.has(order.id);
    const hasGrant = activeGrantOrderIds.has(order.id);
    const planSupportedForAssessment = supportedAssessmentFulfillmentPlans.has(order.planId);

    if (!knownBillingPlans.has(order.planId)) {
      items.push(makeItem({
        id: `unknown-plan:${order.id}`,
        category: "unknown_plan",
        severity: "critical",
        title: "Plan desconocido",
        detail: "La orden usa un plan no reconocido por la consola billing.",
        action: "Revisar manualmente antes de match o fulfillment.",
        provider: order.provider,
        planId: order.planId,
        customerEmail: order.customerEmail,
        billingOrderId: order.id,
      }));
    }

    if (order.status === "paid" && !hasPayment) {
      items.push(makeItem({
        id: `paid-without-payment:${order.id}`,
        category: "paid_order_without_payment",
        severity: "warning",
        title: "Orden pagada sin pago asociado",
        detail: "La orden esta paid, pero no hay BillingPayment paid vinculado.",
        action: "Revisar evento Stripe y provider payment id antes de fulfillment.",
        provider: order.provider,
        planId: order.planId,
        customerEmail: order.customerEmail,
        billingOrderId: order.id,
      }));
    }

    if (order.status === "paid" && !matchComplete) {
      items.push(makeItem({
        id: `paid-unmatched:${order.id}`,
        category: "paid_order_unmatched",
        severity: "critical",
        title: "Orden pagada sin match completo",
        detail: "La orden requiere user, workspace y assessment antes de conceder acceso.",
        action: "Hacer match manual desde la consola admin.",
        provider: order.provider,
        planId: order.planId,
        customerEmail: order.customerEmail,
        billingOrderId: order.id,
      }));
    }

    if (
      order.status === "paid" &&
      matchComplete &&
      planSupportedForAssessment &&
      !hasGrant
    ) {
      items.push(makeItem({
        id: `matched-not-fulfilled:${order.id}`,
        category: "matched_not_fulfilled",
        severity: "critical",
        title: "Orden pagada matcheada sin fulfillment",
        detail: "La orden esta lista para fulfillment manual, pero todavia no tiene grant activo.",
        action: "Ejecutar fulfillment manual solo si el pago y el match fueron verificados.",
        provider: order.provider,
        planId: order.planId,
        customerEmail: order.customerEmail,
        billingOrderId: order.id,
      }));
    }

    if (
      order.status === "paid" &&
      matchComplete &&
      planSupportedForAssessment &&
      hasGrant
    ) {
      items.push(makeItem({
        id: `fulfilled-ok:${order.id}`,
        category: "fulfilled_order_ok",
        severity: "ok",
        title: "Orden paid/matched/fulfilled",
        detail: "La orden tiene match completo y grant activo de billing.",
        action: "Sin accion.",
        provider: order.provider,
        planId: order.planId,
        customerEmail: order.customerEmail,
        billingOrderId: order.id,
      }));
    }
  }

  for (const payment of params.payments) {
    const order = ordersById.get(payment.orderId);
    if (payment.status === "paid" && order && !hasCompleteOrderMatch(order)) {
      items.push(makeItem({
        id: `payment-unmatched-order:${payment.id}`,
        category: "payment_without_matched_order",
        severity: "review",
        title: "Pago vinculado a orden sin match completo",
        detail: "El pago existe, pero la orden todavia no esta lista para fulfillment.",
        action: "Completar match manual antes de conceder acceso.",
        provider: payment.provider,
        planId: order.planId,
        customerEmail: order.customerEmail,
        billingOrderId: order.id,
        billingPaymentId: payment.id,
      }));
    }
  }

  for (const grant of params.grants) {
    const order = grant.billingOrderId ? ordersById.get(grant.billingOrderId) : null;
    if (grant.billingOrderId && (!order || order.status !== "paid") && isActiveGrant(grant)) {
      items.push(makeItem({
        id: `grant-without-paid-order:${grant.id}`,
        category: "grant_without_paid_order",
        severity: "critical",
        title: "Grant activo sin orden paid",
        detail: "Hay un grant activo que no tiene una orden paid visible en el snapshot.",
        action: "Revisar refund/cancel boundary antes de tocar acceso.",
        provider: order?.provider ?? "unknown",
        planId: order?.planId,
        customerEmail: order?.customerEmail,
        billingOrderId: grant.billingOrderId,
        entitlementKey: grant.entitlementKey,
      }));
    }
  }

  for (const subscription of params.subscriptions) {
    if (
      subscription.status === "payment_failed" ||
      subscription.status === "cancelled" ||
      subscription.cancelledAt ||
      subscription.paymentFailedAt
    ) {
      items.push(makeItem({
        id: `subscription-review:${subscription.id}`,
        category: "subscription_requires_review",
        severity: "review",
        title: "Suscripcion requiere revision",
        detail: "La suscripcion esta cancelada o con pago fallido. No hay auto-revoke.",
        action: "Revisar manualmente antes de cualquier cambio de acceso.",
        provider: subscription.provider,
        planId: subscription.planId,
        customerEmail: subscription.customerEmail,
        billingSubscriptionId: subscription.id,
      }));
    }
  }

  for (const event of params.events) {
    if (event.status === "failed") {
      items.push(makeItem({
        id: `event-failed:${event.id}`,
        category: "event_requires_review",
        severity: "critical",
        title: "Webhook fallido",
        detail: "Un evento de provider fallo durante captura/procesamiento tecnico.",
        action: "Revisar error seguro y no conceder acceso hasta resolver.",
        provider: event.provider,
        billingEventId: event.id,
      }));
    } else if (event.status === "ignored") {
      items.push(makeItem({
        id: `event-ignored:${event.id}`,
        category: "event_ignored",
        severity: "review",
        title: "Webhook ignorado",
        detail: "Normalmente es replay/duplicado; revisar si no coincide con una prueba esperada.",
        action: "Confirmar que no falta ledger comercial asociado.",
        provider: event.provider,
        billingEventId: event.id,
      }));
    }
  }

  return {
    items,
    actionRequiredCount: items.filter((item) => item.severity === "critical" || item.severity === "warning").length,
    criticalCount: items.filter((item) => item.severity === "critical").length,
    warningCount: items.filter((item) => item.severity === "warning").length,
    reviewCount: items.filter((item) => item.severity === "review").length,
    okCount: items.filter((item) => item.severity === "ok").length,
    paidUnmatchedCount: items.filter((item) => item.category === "paid_order_unmatched").length,
    matchedNotFulfilledCount: items.filter((item) => item.category === "matched_not_fulfilled").length,
    fulfilledOrderCount: items.filter((item) => item.category === "fulfilled_order_ok").length,
  };
}

export async function getBillingReconciliationSnapshot(
  ledger: BillingAdminLedgerSnapshot,
): Promise<BillingReconciliationSummary> {
  const billingOrderIds = ledger.recentOrders.map((order) => order.id);
  const billingSubscriptionIds = ledger.recentSubscriptions.map((subscription) => subscription.id);
  const grantFilters = [
    billingOrderIds.length > 0 ? { billingOrderId: { in: billingOrderIds } } : undefined,
    billingSubscriptionIds.length > 0 ? { billingSubscriptionId: { in: billingSubscriptionIds } } : undefined,
  ].filter(Boolean) as Array<{ billingOrderId?: { in: string[] }; billingSubscriptionId?: { in: string[] } }>;
  const grants = grantFilters.length > 0
    ? await prisma.billingEntitlementGrant.findMany({
      where: {
        OR: grantFilters,
      },
      select: {
        id: true,
        billingOrderId: true,
        billingSubscriptionId: true,
        entitlementKey: true,
        status: true,
        source: true,
      },
    })
    : [];

  return buildBillingReconciliationSummary({
    orders: ledger.recentOrders,
    payments: ledger.recentPayments,
    subscriptions: ledger.recentSubscriptions,
    events: ledger.recentEvents,
    grants,
  });
}
