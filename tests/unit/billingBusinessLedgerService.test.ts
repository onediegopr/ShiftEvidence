import { describe, expect, it, vi } from "vitest";
import { processLemonBillingEvent } from "../../src/server/billing/ledger/billingBusinessLedgerService";

function billingEvent(overrides?: {
  id?: string;
  eventType?: string;
  status?: "pending" | "processed" | "failed" | "ignored";
}) {
  return {
    id: overrides?.id ?? "billing_event_1",
    provider: "lemon_squeezy",
    providerEventId: "provider_event_1",
    eventType: overrides?.eventType ?? "order_created",
    status: overrides?.status ?? "processed",
  };
}

function orderPayload(overrides?: {
  eventName?: string;
  attributes?: Record<string, unknown>;
  customData?: Record<string, unknown>;
}) {
  return JSON.stringify({
    meta: {
      event_name: overrides?.eventName ?? "order_created",
      custom_data: overrides?.customData ?? {
        plan_id: "starter_readiness",
      },
    },
    data: {
      id: "order_123",
      type: "orders",
      attributes: {
        total: 49000,
        currency: "USD",
        user_email: "buyer@example.com",
        status: "paid",
        created_at: "2026-06-01T10:00:00.000Z",
        ...overrides?.attributes,
      },
    },
  });
}

function subscriptionPayload(overrides?: {
  eventName?: string;
  attributes?: Record<string, unknown>;
}) {
  return JSON.stringify({
    meta: {
      event_name: overrides?.eventName ?? "subscription_created",
      custom_data: {
        plan_id: "msp_partner",
      },
    },
    data: {
      id: "sub_123",
      type: "subscriptions",
      attributes: {
        total: 39900,
        currency: "USD",
        user_email: "msp@example.com",
        status: "active",
        created_at: "2026-06-01T10:00:00.000Z",
        renews_at: "2026-07-01T10:00:00.000Z",
        ...overrides?.attributes,
      },
    },
  });
}

function makeDb() {
  return {
    billingEvent: {
      update: vi.fn(),
    },
    billingOrder: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    billingPayment: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    billingSubscription: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    billingEntitlementGrant: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
    assessmentEntitlement: {
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
  };
}

describe("Billing business ledger service", () => {
  it("creates a BillingOrder for a stable order_created event", async () => {
    const db = makeDb();
    db.billingOrder.findUnique.mockResolvedValueOnce(null);
    db.billingOrder.create.mockResolvedValueOnce({
      id: "billing_order_1",
      providerOrderId: "order_123",
      amountCents: 49000,
    });

    const result = await processLemonBillingEvent({
      db: db as never,
      billingEvent: billingEvent() as never,
      rawBody: orderPayload(),
    });

    expect(result.order).toMatchObject({
      id: "billing_order_1",
      providerOrderId: "order_123",
    });
    expect(db.billingOrder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: "lemon_squeezy",
        providerOrderId: "order_123",
        planId: "starter_readiness",
        amountCents: 49000,
        status: "paid",
      }),
    });
    expect(db.billingEntitlementGrant.create).not.toHaveBeenCalled();
    expect(db.assessmentEntitlement.create).not.toHaveBeenCalled();
    expect(db.assessmentEntitlement.upsert).not.toHaveBeenCalled();
  });

  it("updates an existing order on replay-like processing instead of creating a duplicate", async () => {
    const db = makeDb();
    db.billingOrder.findUnique.mockResolvedValueOnce({
      id: "billing_order_1",
      providerOrderId: "order_123",
      providerCheckoutId: null,
      providerCustomerId: null,
      productId: null,
      variantId: null,
      planId: "starter_readiness",
      amountCents: 49000,
      currency: "USD",
      status: "paid",
      customerEmail: "buyer@example.com",
      paidAt: null,
      refundedAt: null,
      cancelledAt: null,
      providerCreatedAt: null,
    });
    db.billingOrder.update.mockResolvedValueOnce({
      id: "billing_order_1",
      providerOrderId: "order_123",
      amountCents: 49000,
    });

    await processLemonBillingEvent({
      db: db as never,
      billingEvent: billingEvent() as never,
      rawBody: orderPayload(),
    });

    expect(db.billingOrder.create).not.toHaveBeenCalled();
    expect(db.billingOrder.update).toHaveBeenCalledWith({
      where: {
        id: "billing_order_1",
      },
      data: expect.objectContaining({
        status: "paid",
      }),
    });
  });

  it("marks refunded orders without revoking access", async () => {
    const db = makeDb();
    db.billingOrder.findUnique.mockResolvedValueOnce({
      id: "billing_order_1",
      providerOrderId: "order_123",
      providerCheckoutId: null,
      providerCustomerId: null,
      productId: null,
      variantId: null,
      planId: "starter_readiness",
      amountCents: 49000,
      currency: "USD",
      status: "paid",
      customerEmail: "buyer@example.com",
      paidAt: null,
      refundedAt: null,
      cancelledAt: null,
      providerCreatedAt: null,
    });
    db.billingOrder.update.mockResolvedValueOnce({
      id: "billing_order_1",
      providerOrderId: "order_123",
      status: "refunded",
    });

    await processLemonBillingEvent({
      db: db as never,
      billingEvent: billingEvent({ eventType: "order_refunded" }) as never,
      rawBody: orderPayload({
        eventName: "order_refunded",
        attributes: {
          status: "refunded",
          refunded_at: "2026-06-02T10:00:00.000Z",
        },
      }),
    });

    expect(db.billingOrder.update).toHaveBeenCalledWith({
      where: {
        id: "billing_order_1",
      },
      data: expect.objectContaining({
        status: "refunded",
        refundedAt: expect.any(Date),
      }),
    });
    expect(db.billingEntitlementGrant.create).not.toHaveBeenCalled();
    expect(db.assessmentEntitlement.update).not.toHaveBeenCalled();
  });

  it("creates and updates subscriptions without granting partner access", async () => {
    const db = makeDb();
    db.billingSubscription.findUnique.mockResolvedValueOnce(null);
    db.billingSubscription.create.mockResolvedValueOnce({
      id: "billing_subscription_1",
      providerSubscriptionId: "sub_123",
      status: "active",
    });

    await processLemonBillingEvent({
      db: db as never,
      billingEvent: billingEvent({ eventType: "subscription_created" }) as never,
      rawBody: subscriptionPayload(),
    });

    expect(db.billingSubscription.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: "lemon_squeezy",
        providerSubscriptionId: "sub_123",
        planId: "msp_partner",
        status: "active",
      }),
    });
    expect(db.billingEntitlementGrant.create).not.toHaveBeenCalled();
    expect(db.assessmentEntitlement.create).not.toHaveBeenCalled();
  });

  it("marks subscription payment failures as commercial risk only", async () => {
    const db = makeDb();
    db.billingSubscription.findUnique.mockResolvedValueOnce({
      id: "billing_subscription_1",
      providerSubscriptionId: "sub_123",
      providerCustomerId: null,
      planId: "msp_partner",
      productId: null,
      variantId: null,
      status: "active",
      customerEmail: "msp@example.com",
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelledAt: null,
      expiredAt: null,
      paymentFailedAt: null,
      providerCreatedAt: null,
    });
    db.billingSubscription.update.mockResolvedValueOnce({
      id: "billing_subscription_1",
      providerSubscriptionId: "sub_123",
      status: "payment_failed",
    });

    await processLemonBillingEvent({
      db: db as never,
      billingEvent: billingEvent({ eventType: "subscription_payment_failed" }) as never,
      rawBody: subscriptionPayload({
        eventName: "subscription_payment_failed",
        attributes: {
          status: "past_due",
          failed_at: "2026-06-10T10:00:00.000Z",
        },
      }),
    });

    expect(db.billingSubscription.update).toHaveBeenCalledWith({
      where: {
        id: "billing_subscription_1",
      },
      data: expect.objectContaining({
        status: "payment_failed",
        paymentFailedAt: expect.any(Date),
      }),
    });
    expect(db.billingEntitlementGrant.create).not.toHaveBeenCalled();
    expect(db.assessmentEntitlement.update).not.toHaveBeenCalled();
  });

  it("creates BillingPayment only with a stable provider payment id and internal order", async () => {
    const db = makeDb();
    db.billingOrder.findUnique.mockResolvedValueOnce({
      id: "billing_order_1",
      providerOrderId: "order_123",
      providerCheckoutId: null,
      providerCustomerId: null,
      productId: null,
      variantId: null,
      planId: "starter_readiness",
      amountCents: 49000,
      currency: "USD",
      status: "paid",
      customerEmail: "buyer@example.com",
      paidAt: null,
      refundedAt: null,
      cancelledAt: null,
      providerCreatedAt: null,
    });
    db.billingOrder.update.mockResolvedValueOnce({
      id: "billing_order_1",
      providerOrderId: "order_123",
      amountCents: 49000,
    });
    db.billingPayment.findUnique.mockResolvedValueOnce(null);
    db.billingPayment.create.mockResolvedValueOnce({
      id: "billing_payment_1",
      providerPaymentId: "payment_123",
      orderId: "billing_order_1",
    });

    await processLemonBillingEvent({
      db: db as never,
      billingEvent: billingEvent() as never,
      rawBody: orderPayload({
        attributes: {
          payment_id: "payment_123",
        },
      }),
    });

    expect(db.billingPayment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: "lemon_squeezy",
        providerPaymentId: "payment_123",
        orderId: "billing_order_1",
        amountCents: 49000,
        status: "paid",
      }),
    });
  });

  it("skips ignored duplicate BillingEvents before touching commercial entities", async () => {
    const db = makeDb();

    const result = await processLemonBillingEvent({
      db: db as never,
      billingEvent: billingEvent({ status: "ignored" }) as never,
      rawBody: orderPayload(),
    });

    expect(result.skipped).toBe(true);
    expect(db.billingOrder.findUnique).not.toHaveBeenCalled();
    expect(db.billingPayment.findUnique).not.toHaveBeenCalled();
    expect(db.billingSubscription.findUnique).not.toHaveBeenCalled();
  });
});
