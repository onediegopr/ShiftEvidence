import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSupportedStripeBusinessEvents,
  mapStripeWebhookPayloadToBusinessLedger,
} from "../../src/server/billing/webhooks/stripeWebhookMapper";

function checkoutSessionPayload(overrides?: Record<string, unknown>) {
  return JSON.stringify({
    id: "evt_checkout_1",
    type: "checkout.session.completed",
    livemode: false,
    data: {
      object: {
        id: "cs_test_1",
        object: "checkout.session",
        mode: "payment",
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
          source: "shift_evidence_public_checkout",
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

describe("Stripe webhook mapper", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("lists supported Stripe business events", () => {
    expect(getSupportedStripeBusinessEvents()).toEqual([
      "checkout.session.completed",
      "invoice.paid",
      "invoice.payment_failed",
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
    ]);
  });

  it("maps checkout.session.completed to order and payment without card data", () => {
    const mapped = mapStripeWebhookPayloadToBusinessLedger(checkoutSessionPayload());

    expect(mapped).toMatchObject({
      providerEventId: "evt_checkout_1",
      eventType: "checkout.session.completed",
      liveMode: false,
      resourceType: "checkout.session",
    });
    expect(mapped.order).toMatchObject({
      providerOrderId: "cs_test_1",
      providerCheckoutId: "cs_test_1",
      providerCustomerId: "cus_test_1",
      planId: "starter_readiness",
      amountCents: 49000,
      currency: "USD",
      status: "paid",
      customerEmail: "buyer@example.invalid",
    });
    expect(mapped.payment).toMatchObject({
      providerPaymentId: "pi_test_1",
      providerOrderId: "cs_test_1",
      amountCents: 49000,
      currency: "USD",
      status: "paid",
    });
    expect(JSON.stringify(mapped)).not.toContain("4242424242424242");
  });

  it("resolves plan from Stripe Price ID when metadata is absent", () => {
    vi.stubEnv("STRIPE_STARTER_PRICE_ID", "price_starter_test");

    const mapped = mapStripeWebhookPayloadToBusinessLedger(checkoutSessionPayload({
      metadata: {},
      line_items: {
        data: [
          {
            price: {
              id: "price_starter_test",
              product: "prod_starter_test",
            },
          },
        ],
      },
    }));

    expect(mapped.order?.planId).toBe("starter_readiness");
    expect(mapped.order?.variantId).toBe("price_starter_test");
    expect(mapped.order?.productId).toBe("prod_starter_test");
  });

  it("keeps unknown price or plan as a warning without crashing", () => {
    const mapped = mapStripeWebhookPayloadToBusinessLedger(checkoutSessionPayload({
      metadata: {},
      line_items: {
        data: [
          {
            price: {
              id: "price_unknown_test",
            },
          },
        ],
      },
    }));

    expect(mapped.order?.planId).toBeNull();
    expect(mapped.warnings).toContain("order_missing_plan_id");
  });

  it("maps subscription created and payment failed boundaries without revoke semantics", () => {
    expect(mapStripeWebhookPayloadToBusinessLedger(subscriptionPayload()).subscription).toMatchObject({
      providerSubscriptionId: "sub_test_1",
      planId: "msp_partner",
      status: "active",
    });

    const failedInvoice = mapStripeWebhookPayloadToBusinessLedger(JSON.stringify({
      id: "evt_invoice_failed_1",
      type: "invoice.payment_failed",
      livemode: false,
      data: {
        object: {
          id: "in_test_1",
          object: "invoice",
          status: "open",
          subscription: "sub_test_1",
          customer: "cus_test_1",
          amount_due: 79900,
          currency: "usd",
          metadata: {
            plan_id: "msp_partner",
          },
        },
      },
    }));

    expect(failedInvoice.subscription).toMatchObject({
      providerSubscriptionId: "sub_test_1",
      status: "payment_failed",
      planId: "msp_partner",
    });
    expect(failedInvoice.warnings).toContain("payment_skipped_missing_provider_payment_id");
  });
});

