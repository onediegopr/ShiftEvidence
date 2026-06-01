import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  createLemonWebhookSignature,
  verifyLemonWebhookSignature,
} from "../../src/server/billing/webhooks/lemonWebhookSignature";
import { parseLemonWebhookEvent } from "../../src/server/billing/webhooks/lemonWebhookEvent";
import { persistLemonWebhookEvent } from "../../src/server/billing/webhooks/lemonWebhookPersistence";

function uniqueConstraintError() {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: {
      target: ["idempotencyKey"],
    },
  });
}

function makeInMemoryBillingDb() {
  const events: Array<Record<string, unknown>> = [];
  const orders: Array<Record<string, unknown>> = [];
  const payments: Array<Record<string, unknown>> = [];
  const subscriptions: Array<Record<string, unknown>> = [];
  const grants: Array<Record<string, unknown>> = [];
  const assessmentEntitlements: Array<Record<string, unknown>> = [];

  return {
    state: {
      events,
      orders,
      payments,
      subscriptions,
      grants,
      assessmentEntitlements,
    },
    billingEvent: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        if (events.some((event) => event.idempotencyKey === data.idempotencyKey)) {
          throw uniqueConstraintError();
        }

        const event = {
          id: `event_${events.length + 1}`,
          ...data,
        };
        events.push(event);
        return event;
      },
      update: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        const event = events.find((item) => (
          ("id" in where && item.id === where.id) ||
          ("idempotencyKey" in where && item.idempotencyKey === where.idempotencyKey)
        ));

        if (!event) throw new Error("event not found");
        Object.assign(event, data);
        return event;
      },
    },
    billingOrder: {
      findUnique: async ({ where }: { where: { provider_providerOrderId: { provider: string; providerOrderId: string } } }) => (
        orders.find((order) => (
          order.provider === where.provider_providerOrderId.provider &&
          order.providerOrderId === where.provider_providerOrderId.providerOrderId
        )) ?? null
      ),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const order = {
          id: `order_${orders.length + 1}`,
          ...data,
        };
        orders.push(order);
        return order;
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const order = orders.find((item) => item.id === where.id);
        if (!order) throw new Error("order not found");
        Object.assign(order, data);
        return order;
      },
    },
    billingPayment: {
      findUnique: async ({ where }: { where: { provider_providerPaymentId: { provider: string; providerPaymentId: string } } }) => (
        payments.find((payment) => (
          payment.provider === where.provider_providerPaymentId.provider &&
          payment.providerPaymentId === where.provider_providerPaymentId.providerPaymentId
        )) ?? null
      ),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const payment = {
          id: `payment_${payments.length + 1}`,
          ...data,
        };
        payments.push(payment);
        return payment;
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const payment = payments.find((item) => item.id === where.id);
        if (!payment) throw new Error("payment not found");
        Object.assign(payment, data);
        return payment;
      },
    },
    billingSubscription: {
      findUnique: async (
        { where }: { where: { provider_providerSubscriptionId: { provider: string; providerSubscriptionId: string } } },
      ) => (
        subscriptions.find((subscription) => (
          subscription.provider === where.provider_providerSubscriptionId.provider &&
          subscription.providerSubscriptionId === where.provider_providerSubscriptionId.providerSubscriptionId
        )) ?? null
      ),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const subscription = {
          id: `subscription_${subscriptions.length + 1}`,
          ...data,
        };
        subscriptions.push(subscription);
        return subscription;
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const subscription = subscriptions.find((item) => item.id === where.id);
        if (!subscription) throw new Error("subscription not found");
        Object.assign(subscription, data);
        return subscription;
      },
    },
    billingEntitlementGrant: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        grants.push(data);
        return data;
      },
    },
    assessmentEntitlement: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        assessmentEntitlements.push(data);
        return data;
      },
    },
  };
}

describe("Billing webhook business integration smoke", () => {
  it("accepts a signed order_created payload, ignores replay and creates zero grants", async () => {
    const secret = "local-smoke-secret";
    const rawBody = JSON.stringify({
      meta: {
        event_name: "order_created",
        custom_data: {
          plan_id: "starter_readiness",
        },
      },
      data: {
        id: "order_smoke_1",
        type: "orders",
        attributes: {
          total: 49000,
          currency: "USD",
          user_email: "buyer@example.com",
          payment_id: "payment_smoke_1",
          status: "paid",
          created_at: "2026-06-01T10:00:00.000Z",
        },
      },
    });
    const signature = createLemonWebhookSignature(rawBody, secret);
    const db = makeInMemoryBillingDb();

    expect(verifyLemonWebhookSignature({ rawBody, signature, secret })).toBe(true);

    const first = await persistLemonWebhookEvent({
      event: parseLemonWebhookEvent(rawBody, "order_created"),
      rawBody,
      db: db as never,
    });
    const replay = await persistLemonWebhookEvent({
      event: parseLemonWebhookEvent(rawBody, "order_created"),
      rawBody,
      db: db as never,
    });

    expect(first.outcome).toBe("created");
    expect(replay.outcome).toBe("duplicate_ignored");
    expect(db.state.events).toHaveLength(1);
    expect(db.state.orders).toHaveLength(1);
    expect(db.state.payments).toHaveLength(1);
    expect(db.state.subscriptions).toHaveLength(0);
    expect(db.state.grants).toHaveLength(0);
    expect(db.state.assessmentEntitlements).toHaveLength(0);
  });
});
