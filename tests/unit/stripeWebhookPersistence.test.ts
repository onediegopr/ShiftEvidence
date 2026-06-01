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

  it("persists only BillingEvent and marks captured events as processed", async () => {
    const rawBody = stripePayload();
    const event = parseStripeWebhookEvent(rawBody);
    const create = vi.fn().mockResolvedValue({ id: "be_123", status: "processed" });
    const db = {
      billingEvent: {
        create,
        update: vi.fn(),
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
    expect("billingOrder" in db).toBe(false);
    expect("billingPayment" in db).toBe(false);
    expect("billingSubscription" in db).toBe(false);
    expect("billingEntitlementGrant" in db).toBe(false);
  });
});
