import { describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  billingEvent: {
    groupBy: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  billingOrder: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  billingPayment: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  billingSubscription: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  billingEntitlementGrant: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../../src/lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("billing admin ledger service", () => {
  it("reads BillingEvent summaries without touching orders, payments, subscriptions or grants", async () => {
    const { getBillingAdminLedgerSnapshot } = await import("../../src/server/billing/admin/billingAdminLedgerService");
    const event = {
      id: "event_1",
      provider: "lemon_squeezy",
      eventType: "order_created",
      status: "processed",
      providerEventId: "evt_1",
      receivedAt: new Date("2026-05-31T10:00:00.000Z"),
      processedAt: new Date("2026-05-31T10:00:01.000Z"),
      errorMessage: null,
      createdAt: new Date("2026-05-31T10:00:00.000Z"),
    };

    prismaMock.billingEvent.groupBy
      .mockResolvedValueOnce([
        {
          status: "processed",
          _count: {
            _all: 2,
          },
        },
        {
          status: "failed",
          _count: {
            _all: 1,
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          eventType: "order_created",
          _count: {
            _all: 3,
          },
        },
      ]);
    prismaMock.billingEvent.findMany
      .mockResolvedValueOnce([event])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    prismaMock.billingEvent.findFirst.mockResolvedValueOnce({
      receivedAt: event.receivedAt,
    });

    const snapshot = await getBillingAdminLedgerSnapshot();

    expect(snapshot).toMatchObject({
      recentEventsCount: 1,
      failedEventsCount: 1,
      pendingEventsCount: 0,
      ignoredEventsCount: 0,
      lastEventAt: event.receivedAt,
      eventTypeCounts: [
        {
          eventType: "order_created",
          count: 3,
        },
      ],
    });
    expect(snapshot.recentEvents[0]).toMatchObject({
      id: "event_1",
      provider: "lemon_squeezy",
      status: "processed",
    });
    expect(prismaMock.billingOrder.findMany).not.toHaveBeenCalled();
    expect(prismaMock.billingOrder.create).not.toHaveBeenCalled();
    expect(prismaMock.billingPayment.findMany).not.toHaveBeenCalled();
    expect(prismaMock.billingPayment.create).not.toHaveBeenCalled();
    expect(prismaMock.billingSubscription.findMany).not.toHaveBeenCalled();
    expect(prismaMock.billingSubscription.create).not.toHaveBeenCalled();
    expect(prismaMock.billingEntitlementGrant.findMany).not.toHaveBeenCalled();
    expect(prismaMock.billingEntitlementGrant.create).not.toHaveBeenCalled();
  });
});
