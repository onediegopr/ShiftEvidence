import { describe, expect, it, vi } from "vitest";
import { parseStripeWebhookEvent } from "../../src/server/billing/webhooks/stripeWebhookEvent";
import { persistStripeWebhookEvent } from "../../src/server/billing/webhooks/stripeWebhookPersistence";

function stripePayload(id = "evt_123") {
  return JSON.stringify({
    id,
    type: "checkout.session.completed",
    livemode: false,
    data: {
      object: {
        id: "cs_test_123",
        object: "checkout.session",
        status: "complete",
        payment_status: "paid",
        amount_total: 49000,
        currency: "usd",
        metadata: {
          plan_id: "starter_readiness",
        },
      },
    },
  });
}

describe("Stripe webhook event persistence", () => {
  it("parses a safe event payload without trusting raw body contents", () => {
    const event = parseStripeWebhookEvent(stripePayload());

    expect(event).toMatchObject({
      providerEventId: "evt_123",
      eventType: "checkout.session.completed",
    });
    expect(event.safePayloadJson).toMatchObject({
      provider: "stripe",
      providerEventId: "evt_123",
      eventType: "checkout.session.completed",
      liveMode: false,
      resourceId: "cs_test_123",
    });
  });

  it("rejects invalid JSON or missing provider event identity", () => {
    expect(() => parseStripeWebhookEvent("{")).toThrow("Invalid Stripe webhook JSON.");
    expect(() => parseStripeWebhookEvent(JSON.stringify({ type: "checkout.session.completed" }))).toThrow(
      "missing id",
    );
    expect(() => parseStripeWebhookEvent(JSON.stringify({ id: "evt_123" }))).toThrow("missing type");
  });

  it("persists BillingEvent and maps safe commercial ledger entities", async () => {
    const rawBody = stripePayload();
    const event = parseStripeWebhookEvent(rawBody);
    const create = vi.fn().mockResolvedValue({
      id: "be_123",
      provider: "stripe",
      providerEventId: "evt_123",
      eventType: "checkout.session.completed",
      status: "processed",
    });
    const db = {
      billingEvent: {
        create,
        update: vi.fn(),
      },
      billingOrder: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: "billing_order_123",
          providerOrderId: "cs_test_123",
          amountCents: 49000,
          currency: "USD",
        }),
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
      },
      assessmentEntitlement: {
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
    };

    const result = await persistStripeWebhookEvent({
      event,
      rawBody,
      db: db as never,
    });

    expect(result.outcome).toBe("created");
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: "stripe",
        providerEventId: "evt_123",
        eventType: "checkout.session.completed",
        status: "processed",
        idempotencyKey: "billing_event:stripe:evt_123",
      }),
    });
    expect(db.billingOrder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: "stripe",
        providerOrderId: "cs_test_123",
        planId: "starter_readiness",
      }),
    });
    expect(db.billingPayment.create).not.toHaveBeenCalled();
    expect(db.billingSubscription.create).not.toHaveBeenCalled();
    expect(db.billingEntitlementGrant.create).not.toHaveBeenCalled();
    expect(db.assessmentEntitlement.upsert).not.toHaveBeenCalled();
  });
});
