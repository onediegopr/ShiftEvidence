import { describe, expect, it, vi } from "vitest";
import { parseLemonWebhookEvent } from "../../src/server/billing/webhooks/lemonWebhookEvent";
import { persistLemonWebhookEvent } from "../../src/server/billing/webhooks/lemonWebhookPersistence";

function lemonPayload(overrides?: {
  id?: string;
  eventName?: string;
}) {
  return JSON.stringify({
    meta: {
      event_name: overrides?.eventName ?? "order_created",
      custom_data: {
        plan_id: "starter_readiness",
      },
    },
    data: {
      id: overrides?.id ?? "123",
      type: "orders",
      attributes: {
        test_mode: true,
      },
    },
  });
}

describe("Lemon webhook event persistence", () => {
  it("parses only safe event identity and redacted metadata", () => {
    const event = parseLemonWebhookEvent(lemonPayload(), "order_created");

    expect(event).toEqual({
      providerEventId: "123",
      eventType: "order_created",
      safePayloadJson: {
        provider: "lemon_squeezy",
        providerEventId: "123",
        eventType: "order_created",
        resourceType: "orders",
        testMode: true,
        customData: {
          plan_id: "starter_readiness",
        },
      },
    });
  });

  it("does not invent IDs when JSON or provider event id is invalid", () => {
    expect(() => parseLemonWebhookEvent("{bad-json", "order_created")).toThrow("Invalid Lemon webhook JSON.");
    expect(() =>
      parseLemonWebhookEvent(
        JSON.stringify({
          meta: {
            event_name: "order_created",
          },
          data: {},
        }),
        "order_created",
      ),
    ).toThrow("Lemon webhook payload is missing data.id.");
  });

  it("persists only BillingEvent as technically processed capture", async () => {
    const db = {
      billingEvent: {
        create: vi.fn().mockResolvedValue({
          id: "billing_event_123",
          status: "processed",
        }),
      },
      billingOrder: {
        create: vi.fn(),
      },
      billingPayment: {
        create: vi.fn(),
      },
      billingSubscription: {
        create: vi.fn(),
      },
      billingEntitlementGrant: {
        create: vi.fn(),
      },
    };

    const result = await persistLemonWebhookEvent({
      event: parseLemonWebhookEvent(lemonPayload(), "order_created"),
      rawBody: lemonPayload(),
      db: db as never,
    });

    expect(result.outcome).toBe("created");
    expect(db.billingEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: "lemon_squeezy",
        providerEventId: "123",
        eventType: "order_created",
        status: "processed",
        idempotencyKey: "billing_event:lemon_squeezy:123",
        processedAt: expect.any(Date),
      }),
    });
    expect(db.billingOrder.create).not.toHaveBeenCalled();
    expect(db.billingPayment.create).not.toHaveBeenCalled();
    expect(db.billingSubscription.create).not.toHaveBeenCalled();
    expect(db.billingEntitlementGrant.create).not.toHaveBeenCalled();
  });
});
