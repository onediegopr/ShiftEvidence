import type {
  BillingEventStatus,
  BillingOrderStatus,
  BillingPaymentStatus,
  BillingSubscriptionStatus,
} from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import type { BillingProviderLedgerSummary } from "./billingProviderStatusService";

const billingEventStatuses = ["pending", "processed", "failed", "ignored"] as const satisfies BillingEventStatus[];

export type BillingAdminLedgerEvent = {
  id: string;
  provider: string;
  eventType: string;
  status: BillingEventStatus;
  providerEventId: string;
  receivedAt: Date;
  processedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
};

export type BillingAdminLedgerOrder = {
  id: string;
  provider: string;
  providerOrderId: string | null;
  planId: string;
  amountCents: number;
  currency: string;
  status: BillingOrderStatus;
  customerEmail: string | null;
  userId: string | null;
  workspaceId: string | null;
  assessmentId: string | null;
  paidAt: Date | null;
  refundedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
};

export type BillingAdminLedgerPayment = {
  id: string;
  provider: string;
  providerPaymentId: string | null;
  providerOrderId: string | null;
  orderId: string;
  amountCents: number;
  currency: string;
  status: BillingPaymentStatus;
  paidAt: Date | null;
  refundedAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
};

export type BillingAdminLedgerSubscription = {
  id: string;
  provider: string;
  providerSubscriptionId: string | null;
  planId: string;
  customerEmail: string | null;
  userId: string | null;
  workspaceId: string | null;
  status: BillingSubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelledAt: Date | null;
  expiredAt: Date | null;
  paymentFailedAt: Date | null;
  createdAt: Date;
};

export type BillingAdminLedgerSnapshot = BillingProviderLedgerSummary & {
  recentOrdersCount: number;
  recentPaymentsCount: number;
  recentSubscriptionsCount: number;
  unmatchedOrdersCount: number;
  unmatchedSubscriptionsCount: number;
  eventTypeCounts: Array<{
    eventType: string;
    count: number;
  }>;
  recentEvents: BillingAdminLedgerEvent[];
  failedEvents: BillingAdminLedgerEvent[];
  ignoredEvents: BillingAdminLedgerEvent[];
  pendingEvents: BillingAdminLedgerEvent[];
  recentOrders: BillingAdminLedgerOrder[];
  recentPayments: BillingAdminLedgerPayment[];
  recentSubscriptions: BillingAdminLedgerSubscription[];
  unmatchedOrders: BillingAdminLedgerOrder[];
  unmatchedSubscriptions: BillingAdminLedgerSubscription[];
};

function emptyStatusCounts() {
  return Object.fromEntries(billingEventStatuses.map((status) => [status, 0])) as Record<BillingEventStatus, number>;
}

function sanitizeErrorMessage(value: string | null) {
  if (!value) return null;
  return value.slice(0, 180);
}

function mapBillingEvent(event: {
  id: string;
  provider: string;
  eventType: string;
  status: BillingEventStatus;
  providerEventId: string;
  receivedAt: Date;
  processedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}): BillingAdminLedgerEvent {
  return {
    id: event.id,
    provider: event.provider,
    eventType: event.eventType,
    status: event.status,
    providerEventId: event.providerEventId,
    receivedAt: event.receivedAt,
    processedAt: event.processedAt,
    errorMessage: sanitizeErrorMessage(event.errorMessage),
    createdAt: event.createdAt,
  };
}

function mapBillingOrder(order: {
  id: string;
  provider: string;
  providerOrderId: string | null;
  planId: string;
  amountCents: number;
  currency: string;
  status: BillingOrderStatus;
  customerEmail: string | null;
  userId: string | null;
  workspaceId: string | null;
  assessmentId: string | null;
  paidAt: Date | null;
  refundedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
}): BillingAdminLedgerOrder {
  return order;
}

function mapBillingPayment(payment: {
  id: string;
  provider: string;
  providerPaymentId: string | null;
  orderId: string;
  amountCents: number;
  currency: string;
  status: BillingPaymentStatus;
  paidAt: Date | null;
  refundedAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
  order: {
    providerOrderId: string | null;
  };
}): BillingAdminLedgerPayment {
  return {
    id: payment.id,
    provider: payment.provider,
    providerPaymentId: payment.providerPaymentId,
    providerOrderId: payment.order.providerOrderId,
    orderId: payment.orderId,
    amountCents: payment.amountCents,
    currency: payment.currency,
    status: payment.status,
    paidAt: payment.paidAt,
    refundedAt: payment.refundedAt,
    failedAt: payment.failedAt,
    createdAt: payment.createdAt,
  };
}

function mapBillingSubscription(subscription: {
  id: string;
  provider: string;
  providerSubscriptionId: string | null;
  planId: string;
  customerEmail: string | null;
  userId: string | null;
  workspaceId: string | null;
  status: BillingSubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelledAt: Date | null;
  expiredAt: Date | null;
  paymentFailedAt: Date | null;
  createdAt: Date;
}): BillingAdminLedgerSubscription {
  return subscription;
}

export function getBillingLedgerFallback(): BillingAdminLedgerSnapshot {
  return {
    recentEventsCount: 0,
    failedEventsCount: 0,
    pendingEventsCount: 0,
    ignoredEventsCount: 0,
    recentOrdersCount: 0,
    recentPaymentsCount: 0,
    recentSubscriptionsCount: 0,
    unmatchedOrdersCount: 0,
    unmatchedSubscriptionsCount: 0,
    lastEventAt: null,
    eventTypeCounts: [],
    recentEvents: [],
    failedEvents: [],
    ignoredEvents: [],
    pendingEvents: [],
    recentOrders: [],
    recentPayments: [],
    recentSubscriptions: [],
    unmatchedOrders: [],
    unmatchedSubscriptions: [],
  };
}

export async function getBillingAdminLedgerSnapshot(limit = 25): Promise<BillingAdminLedgerSnapshot> {
  const [
    statusGroups,
    eventTypeGroups,
    recentEvents,
    failedEvents,
    ignoredEvents,
    pendingEvents,
    latestEvent,
    recentOrders,
    recentPayments,
    recentSubscriptions,
    unmatchedOrders,
    unmatchedSubscriptions,
  ] =
    await Promise.all([
      prisma.billingEvent.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),
      prisma.billingEvent.groupBy({
        by: ["eventType"],
        _count: {
          _all: true,
        },
        orderBy: {
          _count: {
            eventType: "desc",
          },
        },
        take: 8,
      }),
      prisma.billingEvent.findMany({
        orderBy: {
          receivedAt: "desc",
        },
        take: limit,
        select: {
          id: true,
          provider: true,
          eventType: true,
          status: true,
          providerEventId: true,
          receivedAt: true,
          processedAt: true,
          errorMessage: true,
          createdAt: true,
        },
      }),
      prisma.billingEvent.findMany({
        where: {
          status: "failed",
        },
        orderBy: {
          receivedAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          provider: true,
          eventType: true,
          status: true,
          providerEventId: true,
          receivedAt: true,
          processedAt: true,
          errorMessage: true,
          createdAt: true,
        },
      }),
      prisma.billingEvent.findMany({
        where: {
          status: "ignored",
        },
        orderBy: {
          receivedAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          provider: true,
          eventType: true,
          status: true,
          providerEventId: true,
          receivedAt: true,
          processedAt: true,
          errorMessage: true,
          createdAt: true,
        },
      }),
      prisma.billingEvent.findMany({
        where: {
          status: "pending",
        },
        orderBy: {
          receivedAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          provider: true,
          eventType: true,
          status: true,
          providerEventId: true,
          receivedAt: true,
          processedAt: true,
          errorMessage: true,
          createdAt: true,
        },
      }),
      prisma.billingEvent.findFirst({
        orderBy: {
          receivedAt: "desc",
        },
        select: {
          receivedAt: true,
        },
      }),
      prisma.billingOrder.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        select: {
          id: true,
          provider: true,
          providerOrderId: true,
          planId: true,
          amountCents: true,
          currency: true,
          status: true,
          customerEmail: true,
          userId: true,
          workspaceId: true,
          assessmentId: true,
          paidAt: true,
          refundedAt: true,
          cancelledAt: true,
          createdAt: true,
        },
      }),
      prisma.billingPayment.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        select: {
          id: true,
          provider: true,
          providerPaymentId: true,
          orderId: true,
          amountCents: true,
          currency: true,
          status: true,
          paidAt: true,
          refundedAt: true,
          failedAt: true,
          createdAt: true,
          order: {
            select: {
              providerOrderId: true,
            },
          },
        },
      }),
      prisma.billingSubscription.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        select: {
          id: true,
          provider: true,
          providerSubscriptionId: true,
          planId: true,
          customerEmail: true,
          userId: true,
          workspaceId: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          cancelledAt: true,
          expiredAt: true,
          paymentFailedAt: true,
          createdAt: true,
        },
      }),
      prisma.billingOrder.findMany({
        where: {
          OR: [
            { userId: null },
            { workspaceId: null },
            { assessmentId: null },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          provider: true,
          providerOrderId: true,
          planId: true,
          amountCents: true,
          currency: true,
          status: true,
          customerEmail: true,
          userId: true,
          workspaceId: true,
          assessmentId: true,
          paidAt: true,
          refundedAt: true,
          cancelledAt: true,
          createdAt: true,
        },
      }),
      prisma.billingSubscription.findMany({
        where: {
          OR: [
            { userId: null },
            { workspaceId: null },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          provider: true,
          providerSubscriptionId: true,
          planId: true,
          customerEmail: true,
          userId: true,
          workspaceId: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          cancelledAt: true,
          expiredAt: true,
          paymentFailedAt: true,
          createdAt: true,
        },
      }),
    ]);
  const counts = emptyStatusCounts();

  statusGroups.forEach((group) => {
    counts[group.status] = group._count._all;
  });

  return {
    recentEventsCount: recentEvents.length,
    failedEventsCount: counts.failed,
    pendingEventsCount: counts.pending,
    ignoredEventsCount: counts.ignored,
    recentOrdersCount: recentOrders.length,
    recentPaymentsCount: recentPayments.length,
    recentSubscriptionsCount: recentSubscriptions.length,
    unmatchedOrdersCount: unmatchedOrders.length,
    unmatchedSubscriptionsCount: unmatchedSubscriptions.length,
    lastEventAt: latestEvent?.receivedAt ?? null,
    eventTypeCounts: eventTypeGroups.map((group) => ({
      eventType: group.eventType,
      count: group._count._all,
    })),
    recentEvents: recentEvents.map(mapBillingEvent),
    failedEvents: failedEvents.map(mapBillingEvent),
    ignoredEvents: ignoredEvents.map(mapBillingEvent),
    pendingEvents: pendingEvents.map(mapBillingEvent),
    recentOrders: recentOrders.map(mapBillingOrder),
    recentPayments: recentPayments.map(mapBillingPayment),
    recentSubscriptions: recentSubscriptions.map(mapBillingSubscription),
    unmatchedOrders: unmatchedOrders.map(mapBillingOrder),
    unmatchedSubscriptions: unmatchedSubscriptions.map(mapBillingSubscription),
  };
}
