import { describe, expect, it } from "vitest";
import {
  buildBillingReconciliationSummary,
  type BillingReconciliationGrant,
} from "../../src/server/billing/admin/billingReconciliationService";

const now = new Date("2026-06-01T12:00:00.000Z");

function order(overrides = {}) {
  return {
    id: "order_1",
    provider: "stripe",
    providerOrderId: "cs_test_123",
    planId: "starter_readiness",
    amountCents: 49000,
    currency: "USD",
    status: "paid" as const,
    customerEmail: "buyer@example.invalid",
    userId: "user_1",
    workspaceId: "workspace_1",
    assessmentId: "assessment_1",
    paidAt: now,
    refundedAt: null,
    cancelledAt: null,
    createdAt: now,
    ...overrides,
  };
}

function payment(overrides = {}) {
  return {
    id: "payment_1",
    provider: "stripe",
    providerPaymentId: "pi_test_123",
    providerOrderId: "cs_test_123",
    orderId: "order_1",
    amountCents: 49000,
    currency: "USD",
    status: "paid" as const,
    paidAt: now,
    refundedAt: null,
    failedAt: null,
    createdAt: now,
    ...overrides,
  };
}

function grant(overrides = {}): BillingReconciliationGrant {
  return {
    id: "grant_1",
    billingOrderId: "order_1",
    billingSubscriptionId: null,
    entitlementKey: "full_report_unlocked",
    status: "granted",
    source: "manual_billing_fulfillment",
    ...overrides,
  };
}

describe("billing reconciliation service", () => {
  it("marks paid unmatched orders as critical action required", () => {
    const summary = buildBillingReconciliationSummary({
      orders: [order({ userId: null, workspaceId: null, assessmentId: null })],
      payments: [payment()],
      subscriptions: [],
      events: [],
      grants: [],
    });

    expect(summary.criticalCount).toBe(1);
    expect(summary.paidUnmatchedCount).toBe(1);
    expect(summary.items.some((item) => item.category === "paid_order_unmatched")).toBe(true);
  });

  it("marks matched paid orders without grants as pending fulfillment", () => {
    const summary = buildBillingReconciliationSummary({
      orders: [order()],
      payments: [payment()],
      subscriptions: [],
      events: [],
      grants: [],
    });

    expect(summary.matchedNotFulfilledCount).toBe(1);
    expect(summary.items[0]).toMatchObject({
      category: "matched_not_fulfilled",
      severity: "critical",
    });
  });

  it("marks fulfilled paid orders as OK", () => {
    const summary = buildBillingReconciliationSummary({
      orders: [order()],
      payments: [payment()],
      subscriptions: [],
      events: [],
      grants: [grant()],
    });

    expect(summary.fulfilledOrderCount).toBe(1);
    expect(summary.okCount).toBe(1);
    expect(summary.items[0]).toMatchObject({
      category: "fulfilled_order_ok",
      severity: "ok",
    });
  });

  it("warns on paid orders without a linked paid payment", () => {
    const summary = buildBillingReconciliationSummary({
      orders: [order()],
      payments: [],
      subscriptions: [],
      events: [],
      grants: [grant()],
    });

    expect(summary.warningCount).toBe(1);
    expect(summary.items.some((item) => item.category === "paid_order_without_payment")).toBe(true);
  });

  it("flags unknown plans and active grants without a paid order", () => {
    const summary = buildBillingReconciliationSummary({
      orders: [order({ status: "pending", planId: "unknown_plan" })],
      payments: [],
      subscriptions: [],
      events: [],
      grants: [grant()],
    });

    expect(summary.items.some((item) => item.category === "unknown_plan")).toBe(true);
    expect(summary.items.some((item) => item.category === "grant_without_paid_order")).toBe(true);
  });

  it("flags subscriptions and webhook events that require review", () => {
    const summary = buildBillingReconciliationSummary({
      orders: [],
      payments: [],
      subscriptions: [{
        id: "sub_1",
        provider: "stripe",
        providerSubscriptionId: "sub_test_123",
        planId: "msp_partner",
        customerEmail: "msp@example.invalid",
        userId: "user_1",
        workspaceId: "workspace_1",
        status: "payment_failed",
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelledAt: null,
        expiredAt: null,
        paymentFailedAt: now,
        createdAt: now,
      }],
      events: [{
        id: "event_1",
        provider: "stripe",
        eventType: "invoice.payment_failed",
        status: "failed",
        providerEventId: "evt_test_123",
        receivedAt: now,
        processedAt: null,
        errorMessage: "safe error",
        createdAt: now,
      }],
      grants: [],
    });

    expect(summary.items.some((item) => item.category === "subscription_requires_review")).toBe(true);
    expect(summary.items.some((item) => item.category === "event_requires_review")).toBe(true);
  });
});
