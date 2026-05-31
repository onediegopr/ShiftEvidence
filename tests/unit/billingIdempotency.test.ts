import { describe, expect, it } from "vitest";
import {
  createBillingEventIdempotencyKey,
  createBillingManualIdempotencyKey,
  createBillingOrderEventIdempotencyKey,
  createBillingSubscriptionPeriodIdempotencyKey,
  hashBillingPayload,
} from "../../src/server/billing/ledger/billingIdempotency";
import {
  buildBillingEntitlementGrantCreateData,
  buildBillingEventCreateData,
  buildBillingOrderCreateData,
} from "../../src/server/billing/ledger/billingLedgerService";

describe("billing ledger idempotency", () => {
  it("creates stable keys for provider event replay", () => {
    expect(
      createBillingEventIdempotencyKey({
        provider: "lemon_squeezy",
        providerEventId: " EVT_123 ",
      }),
    ).toBe("billing_event:lemon_squeezy:evt_123");
  });

  it("creates scoped keys for order events and subscription periods", () => {
    expect(
      createBillingOrderEventIdempotencyKey({
        provider: "lemon_squeezy",
        providerOrderId: "ORDER_123",
        eventType: "order_created",
      }),
    ).toBe("billing_order_event:lemon_squeezy:order_123:order_created");

    expect(
      createBillingSubscriptionPeriodIdempotencyKey({
        provider: "lemon_squeezy",
        providerSubscriptionId: "SUB_123",
        eventType: "subscription_payment_success",
        periodStart: new Date("2026-05-01T00:00:00.000Z"),
        periodEnd: new Date("2026-06-01T00:00:00.000Z"),
      }),
    ).toBe(
      "billing_subscription_period:lemon_squeezy:sub_123:subscription_payment_success:2026-05-01T00:00:00.000Z:2026-06-01T00:00:00.000Z",
    );
  });

  it("supports manual provider scopes without provider API calls", () => {
    expect(
      createBillingManualIdempotencyKey({
        provider: "wise",
        scope: "invoice",
        externalId: "INV-100",
      }),
    ).toBe("billing_manual:wise:invoice:inv-100");
  });

  it("hashes raw payloads without storing the raw body", () => {
    expect(hashBillingPayload("{\"id\":\"evt_123\"}")).toHaveLength(64);
    expect(hashBillingPayload("{\"id\":\"evt_123\"}")).toBe(hashBillingPayload("{\"id\":\"evt_123\"}"));
  });

  it("builds pending ledger records with normalized safe metadata", () => {
    const event = buildBillingEventCreateData({
      provider: "lemon_squeezy",
      providerEventId: "evt_123",
      eventType: "order_created",
      rawPayload: "{\"id\":\"evt_123\"}",
      safePayloadJson: {
        event_name: "order_created",
      },
    });

    expect(event).toMatchObject({
      provider: "lemon_squeezy",
      providerEventId: "evt_123",
      eventType: "order_created",
      idempotencyKey: "billing_event:lemon_squeezy:evt_123",
      status: "pending",
    });
    expect(event.rawPayloadHash).toHaveLength(64);

    const order = buildBillingOrderCreateData({
      provider: "lemon_squeezy",
      providerOrderId: "order_123",
      planId: "starter_readiness",
      amountCents: 49_000,
      customerEmail: " Buyer@Example.COM ",
    });

    expect(order).toMatchObject({
      provider: "lemon_squeezy",
      providerOrderId: "order_123",
      planId: "starter_readiness",
      amountCents: 49_000,
      currency: "USD",
      status: "pending",
      customerEmail: "buyer@example.com",
    });
  });

  it("keeps entitlement grants in pending review and does not grant access", () => {
    expect(
      buildBillingEntitlementGrantCreateData({
        billingOrderId: "order_row_123",
        assessmentId: "assessment_123",
        entitlementKey: "full_report_unlocked",
      }),
    ).toMatchObject({
      billingOrderId: "order_row_123",
      assessmentId: "assessment_123",
      entitlementKey: "full_report_unlocked",
      status: "pending_review",
      source: "billing_ledger",
    });
  });

  it("rejects empty key parts and invalid amounts", () => {
    expect(() =>
      createBillingEventIdempotencyKey({
        provider: "lemon_squeezy",
        providerEventId: " ",
      }),
    ).toThrow("Billing idempotency values cannot be empty.");

    expect(() =>
      buildBillingOrderCreateData({
        provider: "lemon_squeezy",
        providerOrderId: "order_123",
        planId: "starter_readiness",
        amountCents: -1,
      }),
    ).toThrow("Billing ledger amounts must be non-negative integer cents.");
  });
});
