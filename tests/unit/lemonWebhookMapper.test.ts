import { afterEach, describe, expect, it } from "vitest";
import {
  getSupportedLemonBusinessEvents,
  mapLemonWebhookPayloadToBusinessLedger,
} from "../../src/server/billing/webhooks/lemonWebhookMapper";

const originalStarterVariant = process.env.LEMON_STARTER_VARIANT_ID;
const originalMspVariant = process.env.LEMON_MSP_VARIANT_ID;

afterEach(() => {
  if (originalStarterVariant === undefined) {
    delete process.env.LEMON_STARTER_VARIANT_ID;
  } else {
    process.env.LEMON_STARTER_VARIANT_ID = originalStarterVariant;
  }

  if (originalMspVariant === undefined) {
    delete process.env.LEMON_MSP_VARIANT_ID;
  } else {
    process.env.LEMON_MSP_VARIANT_ID = originalMspVariant;
  }
});

function orderPayload(overrides?: {
  eventName?: string;
  id?: string;
  customData?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
}) {
  return JSON.stringify({
    meta: {
      event_name: overrides?.eventName ?? "order_created",
      custom_data: overrides?.customData ?? {
        plan_id: "starter_readiness",
        plan_slug: "starter",
      },
    },
    data: {
      id: overrides?.id ?? "order_123",
      type: "orders",
      attributes: {
        total: 49000,
        currency: "USD",
        user_email: "Buyer@Example.com",
        customer_id: "customer_1",
        checkout_id: "checkout_1",
        status: "paid",
        created_at: "2026-06-01T10:00:00.000Z",
        first_order_item: {
          product_id: 111,
          variant_id: 1729500,
          test_mode: true,
        },
        card_last_four: "4242",
        ...overrides?.attributes,
      },
    },
  });
}

function subscriptionPayload(overrides?: {
  eventName?: string;
  id?: string;
  customData?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
}) {
  return JSON.stringify({
    meta: {
      event_name: overrides?.eventName ?? "subscription_created",
      custom_data: overrides?.customData ?? {
        plan_id: "msp_partner",
      },
    },
    data: {
      id: overrides?.id ?? "sub_123",
      type: "subscriptions",
      attributes: {
        variant_id: "1729507",
        product_id: "222",
        customer_id: "customer_2",
        user_email: "msp@example.com",
        status: "active",
        created_at: "2026-06-01T10:00:00.000Z",
        renews_at: "2026-07-01T10:00:00.000Z",
        ...overrides?.attributes,
      },
    },
  });
}

describe("Lemon webhook business mapper", () => {
  it("declares the supported Lemon business events for Billing 3D", () => {
    expect(getSupportedLemonBusinessEvents()).toEqual([
      "order_created",
      "order_refunded",
      "subscription_created",
      "subscription_updated",
      "subscription_cancelled",
      "subscription_payment_success",
      "subscription_payment_failed",
    ]);
  });

  it("maps order_created with custom plan data and omits card data", () => {
    const mapped = mapLemonWebhookPayloadToBusinessLedger(orderPayload());

    expect(mapped.order).toMatchObject({
      providerOrderId: "order_123",
      providerCheckoutId: "checkout_1",
      providerCustomerId: "customer_1",
      productId: "111",
      variantId: "1729500",
      planId: "starter_readiness",
      amountCents: 49000,
      currency: "USD",
      status: "paid",
      customerEmail: "buyer@example.com",
    });
    expect(JSON.stringify(mapped)).not.toContain("4242");
  });

  it("resolves plan by trusted variant env when custom plan is absent", () => {
    process.env.LEMON_STARTER_VARIANT_ID = "1729500";

    const mapped = mapLemonWebhookPayloadToBusinessLedger(orderPayload({
      customData: {},
    }));

    expect(mapped.order?.planId).toBe("starter_readiness");
  });

  it("maps refunded orders without creating synthetic payment ids", () => {
    const mapped = mapLemonWebhookPayloadToBusinessLedger(orderPayload({
      eventName: "order_refunded",
      attributes: {
        status: "refunded",
        refunded_at: "2026-06-02T10:00:00.000Z",
      },
    }));

    expect(mapped.order?.status).toBe("refunded");
    expect(mapped.payment).toBeNull();
  });

  it("maps subscription lifecycle events", () => {
    const created = mapLemonWebhookPayloadToBusinessLedger(subscriptionPayload());
    const cancelled = mapLemonWebhookPayloadToBusinessLedger(subscriptionPayload({
      eventName: "subscription_cancelled",
      attributes: {
        status: "cancelled",
        cancelled_at: "2026-06-15T10:00:00.000Z",
      },
    }));
    const failed = mapLemonWebhookPayloadToBusinessLedger(subscriptionPayload({
      eventName: "subscription_payment_failed",
      attributes: {
        order_id: "order_sub_1",
        failed_at: "2026-06-15T10:00:00.000Z",
      },
    }));

    expect(created.subscription).toMatchObject({
      providerSubscriptionId: "sub_123",
      planId: "msp_partner",
      status: "active",
    });
    expect(cancelled.subscription?.status).toBe("cancelled");
    expect(failed.subscription?.status).toBe("payment_failed");
    expect(failed.warnings).toContain("payment_missing_provider_payment_id");
  });

  it("does not invent entity IDs when stable provider identities are missing", () => {
    const mapped = mapLemonWebhookPayloadToBusinessLedger(JSON.stringify({
      meta: {
        event_name: "subscription_payment_success",
        custom_data: {
          plan_id: "msp_partner",
        },
      },
      data: {
        id: "event_without_invoice_identity",
        type: "orders",
        attributes: {
          order_id: "order_1",
          total: 39900,
        },
      },
    }));

    expect(mapped.payment).toBeNull();
    expect(mapped.warnings).toContain("payment_missing_provider_payment_id");
  });
});
