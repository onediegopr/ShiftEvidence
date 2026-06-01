import type { BillingEventStatus } from "@prisma/client";
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

export type BillingAdminLedgerSnapshot = BillingProviderLedgerSummary & {
  eventTypeCounts: Array<{
    eventType: string;
    count: number;
  }>;
  recentEvents: BillingAdminLedgerEvent[];
  failedEvents: BillingAdminLedgerEvent[];
  ignoredEvents: BillingAdminLedgerEvent[];
  pendingEvents: BillingAdminLedgerEvent[];
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

export function getBillingLedgerFallback(): BillingAdminLedgerSnapshot {
  return {
    recentEventsCount: 0,
    failedEventsCount: 0,
    pendingEventsCount: 0,
    ignoredEventsCount: 0,
    lastEventAt: null,
    eventTypeCounts: [],
    recentEvents: [],
    failedEvents: [],
    ignoredEvents: [],
    pendingEvents: [],
  };
}

export async function getBillingAdminLedgerSnapshot(limit = 25): Promise<BillingAdminLedgerSnapshot> {
  const [statusGroups, eventTypeGroups, recentEvents, failedEvents, ignoredEvents, pendingEvents, latestEvent] =
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
    lastEventAt: latestEvent?.receivedAt ?? null,
    eventTypeCounts: eventTypeGroups.map((group) => ({
      eventType: group.eventType,
      count: group._count._all,
    })),
    recentEvents: recentEvents.map(mapBillingEvent),
    failedEvents: failedEvents.map(mapBillingEvent),
    ignoredEvents: ignoredEvents.map(mapBillingEvent),
    pendingEvents: pendingEvents.map(mapBillingEvent),
  };
}
