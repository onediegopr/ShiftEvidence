import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { parseLemonWebhookEvent } from "../../src/server/billing/webhooks/lemonWebhookEvent";
import { persistLemonWebhookEvent } from "../../src/server/billing/webhooks/lemonWebhookPersistence";

function makePrismaUniqueError() {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: {
      target: ["idempotencyKey"],
    },
  });
}

const rawBody = JSON.stringify({
  meta: {
    event_name: "order_created",
  },
  data: {
    id: "evt_duplicate",
    type: "orders",
    attributes: {},
  },
});

describe("Lemon webhook idempotency", () => {
  it("marks duplicate webhook events as ignored without creating another row", async () => {
    const db = {
      billingEvent: {
        create: vi.fn().mockRejectedValueOnce(makePrismaUniqueError()),
        update: vi.fn().mockResolvedValue({
          id: "existing_event",
          status: "ignored",
        }),
      },
    };

    const result = await persistLemonWebhookEvent({
      event: parseLemonWebhookEvent(rawBody, "order_created"),
      rawBody,
      db: db as never,
    });

    expect(result.outcome).toBe("duplicate_ignored");
    expect(db.billingEvent.create).toHaveBeenCalledTimes(1);
    expect(db.billingEvent.update).toHaveBeenCalledWith({
      where: {
        idempotencyKey: "billing_event:lemon_squeezy:evt_duplicate",
      },
      data: {
        status: "ignored",
        errorMessage: null,
        processedAt: expect.any(Date),
      },
    });
  });

  it("persists a failed BillingEvent when event capture fails after signature and parsing", async () => {
    const db = {
      billingEvent: {
        create: vi
          .fn()
          .mockRejectedValueOnce(new Error("database temporarily unavailable"))
          .mockResolvedValueOnce({
            id: "failed_event",
            status: "failed",
          }),
      },
    };

    const result = await persistLemonWebhookEvent({
      event: parseLemonWebhookEvent(rawBody, "order_created"),
      rawBody,
      db: db as never,
    });

    expect(result.outcome).toBe("failed_persisted");
    expect(db.billingEvent.create).toHaveBeenCalledTimes(2);
    expect(db.billingEvent.create).toHaveBeenLastCalledWith({
      data: expect.objectContaining({
        provider: "lemon_squeezy",
        providerEventId: "evt_duplicate",
        eventType: "order_created",
        status: "failed",
        errorMessage: "database temporarily unavailable",
      }),
    });
  });
});
