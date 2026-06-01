import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { parseStripeWebhookEvent } from "../../src/server/billing/webhooks/stripeWebhookEvent";
import { persistStripeWebhookEvent } from "../../src/server/billing/webhooks/stripeWebhookPersistence";

function makePrismaUniqueError() {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: {
      target: ["idempotencyKey"],
    },
  });
}

function stripePayload(id = "evt_duplicate") {
  return JSON.stringify({
    id,
    type: "checkout.session.completed",
    livemode: false,
    data: {
      object: {
        id: "cs_test_duplicate",
        object: "checkout.session",
        metadata: {
          plan_id: "starter_readiness",
        },
      },
    },
  });
}

describe("Stripe webhook idempotency hardening", () => {
  it("returns duplicate_ignored without mutating the original processed event", async () => {
    const existingEvent = {
      id: "existing_event",
      status: "processed",
      processedAt: new Date("2026-06-01T10:00:00.000Z"),
      errorMessage: null,
    };
    const db = {
      billingEvent: {
        create: vi.fn().mockRejectedValueOnce(makePrismaUniqueError()),
        findUnique: vi.fn().mockResolvedValue(existingEvent),
        update: vi.fn(),
      },
    };

    const result = await persistStripeWebhookEvent({
      event: parseStripeWebhookEvent(stripePayload()),
      rawBody: stripePayload(),
      db: db as never,
    });

    expect(result.outcome).toBe("duplicate_ignored");
    expect(result.billingEvent).toBe(existingEvent);
    expect(db.billingEvent.create).toHaveBeenCalledTimes(1);
    expect(db.billingEvent.findUnique).toHaveBeenCalledWith({
      where: {
        idempotencyKey: "billing_event:stripe:evt_duplicate",
      },
    });
    expect(db.billingEvent.update).not.toHaveBeenCalled();
  });

  it("persists a failed BillingEvent when first capture fails for a non-unique reason", async () => {
    const db = {
      billingEvent: {
        create: vi
          .fn()
          .mockRejectedValueOnce(new Error("database temporarily unavailable"))
          .mockResolvedValueOnce({
            id: "failed_event",
            status: "failed",
          }),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    const result = await persistStripeWebhookEvent({
      event: parseStripeWebhookEvent(stripePayload()),
      rawBody: stripePayload(),
      db: db as never,
    });

    expect(result.outcome).toBe("failed_persisted");
    expect(db.billingEvent.create).toHaveBeenCalledTimes(2);
    expect(db.billingEvent.create).toHaveBeenLastCalledWith({
      data: expect.objectContaining({
        provider: "stripe",
        providerEventId: "evt_duplicate",
        eventType: "checkout.session.completed",
        status: "failed",
        errorMessage: "database temporarily unavailable",
      }),
    });
    expect(db.billingEvent.update).not.toHaveBeenCalled();
  });
});
