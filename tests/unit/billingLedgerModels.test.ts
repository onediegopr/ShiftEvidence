import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  billingEventStatuses,
  billingGrantStatuses,
  billingLedgerProviders,
  billingOrderStatuses,
  billingPaymentStatuses,
  billingSubscriptionStatuses,
} from "../../src/server/billing/ledger/billingLedgerTypes";
import {
  canTransitionBillingEventStatus,
  canTransitionBillingGrantStatus,
  canTransitionBillingOrderStatus,
  canTransitionBillingPaymentStatus,
  canTransitionBillingSubscriptionStatus,
} from "../../src/server/billing/ledger/billingLedgerStatus";

const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
const migration = readFileSync(
  join(process.cwd(), "prisma/migrations/20260531170000_billing_3a_ledger_foundation/migration.sql"),
  "utf8",
);

describe("billing ledger models", () => {
  it("tracks the provider and status enum coverage for Billing 3A", () => {
    expect([...billingLedgerProviders]).toEqual(["wise", "stripe"]);
    expect([...billingEventStatuses]).toEqual(["pending", "processed", "failed", "ignored"]);
    expect([...billingOrderStatuses]).toEqual(["pending", "paid", "refunded", "cancelled"]);
    expect([...billingPaymentStatuses]).toEqual(["pending", "paid", "refunded", "failed"]);
    expect([...billingSubscriptionStatuses]).toEqual(["active", "cancelled", "expired", "payment_failed"]);
    expect([...billingGrantStatuses]).toEqual(["pending_review", "granted", "revoked", "rejected"]);
  });

  it("defines additive ledger tables without modifying AssessmentEntitlement", () => {
    expect(schema).toContain("model BillingEvent");
    expect(schema).toContain("model BillingOrder");
    expect(schema).toContain("model BillingPayment");
    expect(schema).toContain("model BillingSubscription");
    expect(schema).toContain("model BillingEntitlementGrant");
    expect(schema).not.toContain("billingEntitlementGrants AssessmentEntitlement");
  });

  it("keeps the required uniqueness and lookup assumptions in schema and migration", () => {
    expect(schema).toContain("@@unique([provider, providerEventId])");
    expect(schema).toContain("@unique");
    expect(schema).toContain("@@unique([provider, providerOrderId])");
    expect(schema).toContain("@@unique([provider, providerPaymentId])");
    expect(schema).toContain("@@unique([provider, providerSubscriptionId])");
    expect(schema).toContain("@@index([customerEmail])");
    expect(schema).toContain("@@index([workspaceId])");
    expect(schema).toContain("@@index([assessmentId])");

    expect(migration).toContain('CREATE TABLE "BillingEvent"');
    expect(migration).toContain('CREATE UNIQUE INDEX "BillingEvent_provider_providerEventId_key"');
    expect(migration).toContain('CREATE UNIQUE INDEX "BillingEvent_idempotencyKey_key"');
    expect(migration).not.toMatch(/\bDROP\b|\bALTER TABLE "AssessmentEntitlement"/);
  });

  it("allows conservative status transitions only", () => {
    expect(canTransitionBillingEventStatus("pending", "processed")).toBe(true);
    expect(canTransitionBillingEventStatus("processed", "failed")).toBe(false);

    expect(canTransitionBillingOrderStatus("pending", "paid")).toBe(true);
    expect(canTransitionBillingOrderStatus("refunded", "paid")).toBe(false);

    expect(canTransitionBillingPaymentStatus("pending", "failed")).toBe(true);
    expect(canTransitionBillingPaymentStatus("failed", "paid")).toBe(false);

    expect(canTransitionBillingSubscriptionStatus("payment_failed", "active")).toBe(true);
    expect(canTransitionBillingSubscriptionStatus("expired", "active")).toBe(false);

    expect(canTransitionBillingGrantStatus("pending_review", "granted")).toBe(true);
    expect(canTransitionBillingGrantStatus("rejected", "granted")).toBe(false);
  });
});
