import { describe, expect, it, vi } from "vitest";
import { processStripeBillingEvent } from "../../src/server/billing/ledger/stripeBusinessLedgerService";

function billingEvent(overrides?: {
  id?: string;
  eventType?: string;
  status?: "pending" | "processed" | "failed" | "ignored";
}) {
  return {
    id: overrides?.id ?? "billing_event_1",
    provider: "stripe",
    providerEventId: "evt_checkout_1",
    eventType: overrides?.eventType ?? "checkout.session.completed",
    status: overrides?.status ?? "processed",
  };
}

function checkoutPayload(overrides?: Record<string, unknown>) {
  return JSON.stringify({
    id: "evt_checkout_1",
    type: "checkout.session.completed",
    livemode: false,
    data: {
      object: {
        id: "cs_test_1",
        object: "checkout.session",
        status: "complete",
        payment_status: "paid",
        payment_intent: "pi_test_1",
        customer: "cus_test_1",
        customer_details: {
          email: "buyer@example.invalid",
        },
        amount_total: 49000,
        currency: "usd",
        created: 1780300000,
        metadata: {
          plan_id: "starter_readiness",
        },
        ...overrides,
      },
    },
  });
}

function subscriptionPayload(eventType = "customer.subscription.created", overrides?: Record<string, unknown>) {
  return JSON.stringify({
    id: "evt_subscription_1",
    type: eventType,
    livemode: false,
    data: {
      object: {
        id: "sub_test_1",
        object: "subscription",
        status: "active",
        customer: "cus_test_1",
        current_period_start: 1780300000,
        current_period_end: 1782892000,
        metadata: {
          plan_id: "msp_partner",
        },
        ...overrides,
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

describe("Stripe business ledger service", () => {
  it("creates a Stripe BillingOrder and BillingPayment for paid one-time checkout", async () => {
    const db = makeDb();
    db.billingOrder.findUnique.mockResolvedValueOnce(null);
    db.billingOrder.create.mockResolvedValueOnce({
      id: "billing_order_1",
      provider: "stripe",
      providerOrderId: "cs_test_1",
      amountCents: 49000,
      currency: "USD",
    });
    db.billingPayment.findUnique.mockResolvedValueOnce(null);
    db.billingPayment.create.mockResolvedValueOnce({
      id: "billing_payment_1",
      providerPaymentId: "pi_test_1",
      orderId: "billing_order_1",
    });

    const result = await processStripeBillingEvent({
      db: db as never,
      billingEvent: billingEvent() as never,
      rawBody: checkoutPayload(),
    });

    expect(result.order).toMatchObject({
      id: "billing_order_1",
      providerOrderId: "cs_test_1",
    });
    expect(result.payment).toMatchObject({
      id: "billing_payment_1",
      providerPaymentId: "pi_test_1",
    });
    expect(db.billingOrder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: "stripe",
        providerOrderId: "cs_test_1",
        providerCheckoutId: "cs_test_1",
        planId: "starter_readiness",
        amountCents: 49000,
        status: "paid",
        customerEmail: "buyer@example.invalid",
      }),
    });
    expect(db.billingPayment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: "stripe",
        providerPaymentId: "pi_test_1",
        orderId: "billing_order_1",
        amountCents: 49000,
        status: "paid",
      }),
    });
    expect(db.billingEntitlementGrant.create).not.toHaveBeenCalled();
    expect(db.assessmentEntitlement.upsert).not.toHaveBeenCalled();
  });

  it("updates existing order and payment instead of duplicating them", async () => {
    const db = makeDb();
    db.billingOrder.findUnique.mockResolvedValueOnce({
      id: "billing_order_1",
      providerOrderId: "cs_test_1",
      providerCheckoutId: "cs_test_1",
      providerCustomerId: null,
      productId: null,
      variantId: null,
      planId: "starter_readiness",
      amountCents: 49000,
      currency: "USD",
      status: "paid",
      customerEmail: "buyer@example.invalid",
      paidAt: null,
      refundedAt: null,
      cancelledAt: null,
      providerCreatedAt: null,
    });
    db.billingOrder.update.mockResolvedValueOnce({
      id: "billing_order_1",
      providerOrderId: "cs_test_1",
    });
    db.billingPayment.findUnique.mockResolvedValueOnce({
      id: "billing_payment_1",
      providerPaymentId: "pi_test_1",
      orderId: "billing_order_1",
      amountCents: 49000,
      currency: "USD",
      status: "paid",
      paidAt: null,
      refundedAt: null,
      failedAt: null,
    });
    db.billingPayment.update.mockResolvedValueOnce({
      id: "billing_payment_1",
      providerPaymentId: "pi_test_1",
    });

    await processStripeBillingEvent({
      db: db as never,
      billingEvent: billingEvent() as never,
      rawBody: checkoutPayload(),
    });

    expect(db.billingOrder.create).not.toHaveBeenCalled();
    expect(db.billingPayment.create).not.toHaveBeenCalled();
    expect(db.billingOrder.update).toHaveBeenCalledWith({
      where: { id: "billing_order_1" },
      data: expect.objectContaining({ status: "paid" }),
    });
    expect(db.billingPayment.update).toHaveBeenCalledWith({
      where: { id: "billing_payment_1" },
      data: expect.objectContaining({ status: "paid" }),
    });
  });

  it("keeps unknown plan visible for manual review without crashing", async () => {
    const db = makeDb();
    db.billingOrder.findUnique.mockResolvedValueOnce(null);
    db.billingOrder.create.mockResolvedValueOnce({
      id: "billing_order_unknown",
      providerOrderId: "cs_test_1",
      planId: "stripe_unknown_plan",
    });
    db.billingPayment.findUnique.mockResolvedValueOnce(null);
    db.billingPayment.create.mockResolvedValueOnce({
      id: "billing_payment_1",
      providerPaymentId: "pi_test_1",
    });

    const result = await processStripeBillingEvent({
      db: db as never,
      billingEvent: billingEvent() as never,
      rawBody: checkoutPayload({ metadata: {} }),
    });

    expect(result.warnings).toContain("order_missing_plan_id");
    expect(db.billingOrder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        planId: "stripe_unknown_plan",
      }),
    });
  });

  it("creates and updates MSP subscriptions without granting access", async () => {
    const db = makeDb();
    db.billingSubscription.findUnique.mockResolvedValueOnce(null);
    db.billingSubscription.create.mockResolvedValueOnce({
      id: "billing_subscription_1",
      providerSubscriptionId: "sub_test_1",
      status: "active",
    });

    await processStripeBillingEvent({
      db: db as never,
      billingEvent: billingEvent({ eventType: "customer.subscription.created" }) as never,
      rawBody: subscriptionPayload(),
    });

    expect(db.billingSubscription.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: "stripe",
        providerSubscriptionId: "sub_test_1",
        planId: "msp_partner",
        status: "active",
      }),
    });
    expect(db.billingEntitlementGrant.create).not.toHaveBeenCalled();
    expect(db.assessmentEntitlement.update).not.toHaveBeenCalled();
  });

  it("marks invoice payment failures as subscription review only", async () => {
    const db = makeDb();
    db.billingSubscription.findUnique.mockResolvedValueOnce({
      id: "billing_subscription_1",
      providerSubscriptionId: "sub_test_1",
      providerCustomerId: null,
      planId: "msp_partner",
      productId: null,
      variantId: null,
      status: "active",
      customerEmail: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelledAt: null,
      expiredAt: null,
      paymentFailedAt: null,
      providerCreatedAt: null,
    });
    db.billingSubscription.update.mockResolvedValueOnce({
      id: "billing_subscription_1",
      status: "payment_failed",
    });

    await processStripeBillingEvent({
      db: db as never,
      billingEvent: billingEvent({ eventType: "invoice.payment_failed" }) as never,
      rawBody: JSON.stringify({
        id: "evt_invoice_failed_1",
        type: "invoice.payment_failed",
        livemode: false,
        data: {
          object: {
            id: "in_test_1",
            object: "invoice",
            subscription: "sub_test_1",
            customer: "cus_test_1",
            amount_due: 39900,
            currency: "usd",
            created: 1780300000,
            metadata: {
              plan_id: "msp_partner",
            },
          },
        },
      }),
    });

    expect(db.billingSubscription.update).toHaveBeenCalledWith({
      where: { id: "billing_subscription_1" },
      data: expect.objectContaining({
        status: "payment_failed",
        paymentFailedAt: expect.any(Date),
      }),
    });
    expect(db.billingPayment.create).not.toHaveBeenCalled();
    expect(db.assessmentEntitlement.update).not.toHaveBeenCalled();
  });

  it("skips live Stripe events until a separate go-live hito approves them", async () => {
    const db = makeDb();

    const result = await processStripeBillingEvent({
      db: db as never,
      billingEvent: billingEvent() as never,
      rawBody: checkoutPayload({ livemode: true }).replace('"livemode":false', '"livemode":true'),
    });

    expect(result.skipped).toBe(true);
    expect(result.warnings).toContain("live_event_skipped_not_approved");
    expect(db.billingOrder.create).not.toHaveBeenCalled();
    expect(db.billingPayment.create).not.toHaveBeenCalled();
  });
});
