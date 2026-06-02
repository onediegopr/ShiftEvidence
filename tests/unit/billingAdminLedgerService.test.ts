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
  it("reads BillingEvent and commercial ledger summaries without mutating billing records", async () => {
    const { getBillingAdminLedgerSnapshot } = await import("../../src/server/billing/admin/billingAdminLedgerService");
    const event = {
      id: "event_1",
      provider: "stripe",
      eventType: "order_created",
      status: "processed",
      providerEventId: "evt_1",
      receivedAt: new Date("2026-05-31T10:00:00.000Z"),
      processedAt: new Date("2026-05-31T10:00:01.000Z"),
      errorMessage: null,
      createdAt: new Date("2026-05-31T10:00:00.000Z"),
    };
    const order = {
      id: "order_1",
      provider: "stripe",
      providerOrderId: "provider_order_1",
      planId: "starter_readiness",
      amountCents: 49000,
      currency: "USD",
      status: "paid",
      customerEmail: "buyer@example.com",
      userId: null,
      workspaceId: null,
      assessmentId: null,
      paidAt: new Date("2026-05-31T10:00:00.000Z"),
      refundedAt: null,
      cancelledAt: null,
      createdAt: new Date("2026-05-31T10:00:00.000Z"),
    };
    const payment = {
      id: "payment_1",
      provider: "stripe",
      providerPaymentId: "provider_payment_1",
      orderId: "order_1",
      amountCents: 49000,
      currency: "USD",
      status: "paid",
      paidAt: new Date("2026-05-31T10:00:00.000Z"),
      refundedAt: null,
      failedAt: null,
      createdAt: new Date("2026-05-31T10:00:00.000Z"),
      order: {
        providerOrderId: "provider_order_1",
      },
    };
    const subscription = {
      id: "subscription_1",
      provider: "stripe",
      providerSubscriptionId: "provider_subscription_1",
      planId: "msp_partner",
      customerEmail: "msp@example.com",
      userId: null,
      workspaceId: null,
      status: "active",
      currentPeriodStart: new Date("2026-05-31T10:00:00.000Z"),
      currentPeriodEnd: new Date("2026-06-30T10:00:00.000Z"),
      cancelledAt: null,
      expiredAt: null,
      paymentFailedAt: null,
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
    prismaMock.billingOrder.findMany
      .mockResolvedValueOnce([order])
      .mockResolvedValueOnce([order]);
    prismaMock.billingPayment.findMany.mockResolvedValueOnce([payment]);
    prismaMock.billingSubscription.findMany
      .mockResolvedValueOnce([subscription])
      .mockResolvedValueOnce([subscription]);

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
      recentOrdersCount: 1,
      recentPaymentsCount: 1,
      recentSubscriptionsCount: 1,
      unmatchedOrdersCount: 1,
      unmatchedSubscriptionsCount: 1,
    });
    expect(snapshot.recentEvents[0]).toMatchObject({
      id: "event_1",
      provider: "stripe",
      status: "processed",
    });
    expect(snapshot.recentOrders[0]).toMatchObject({
      id: "order_1",
      providerOrderId: "provider_order_1",
      status: "paid",
    });
    expect(snapshot.recentPayments[0]).toMatchObject({
      id: "payment_1",
      providerPaymentId: "provider_payment_1",
      providerOrderId: "provider_order_1",
    });
    expect(snapshot.recentSubscriptions[0]).toMatchObject({
      id: "subscription_1",
      providerSubscriptionId: "provider_subscription_1",
      status: "active",
    });
    expect(prismaMock.billingOrder.create).not.toHaveBeenCalled();
    expect(prismaMock.billingPayment.create).not.toHaveBeenCalled();
    expect(prismaMock.billingSubscription.create).not.toHaveBeenCalled();
    expect(prismaMock.billingEntitlementGrant.findMany).not.toHaveBeenCalled();
    expect(prismaMock.billingEntitlementGrant.create).not.toHaveBeenCalled();
  });
});
