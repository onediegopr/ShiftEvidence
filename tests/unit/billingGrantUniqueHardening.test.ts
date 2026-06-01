import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { fulfillBillingOrderManually } from "../../src/server/billing/admin/billingManualFulfillmentService";

function makePaidMatchedOrder() {
  return {
    id: "billing_order_1",
    provider: "lemon_squeezy",
    providerOrderId: "provider_order_1",
    planId: "starter_readiness",
    amountCents: 49000,
    currency: "USD",
    status: "paid",
    userId: "user_1",
    workspaceId: "workspace_1",
    assessmentId: "assessment_1",
    refundedAt: null,
    cancelledAt: null,
    user: { id: "user_1", email: "buyer@example.invalid" },
    workspace: { id: "workspace_1", ownerUserId: "user_1" },
    assessment: { id: "assessment_1", workspaceId: "workspace_1" },
  };
}

function makeConflictDb() {
  return {
    billingOrder: {
      findUnique: vi.fn().mockResolvedValue(makePaidMatchedOrder()),
    },
    billingEntitlementGrant: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockRejectedValue({ code: "P2002" }),
    },
    assessmentEntitlement: {
      upsert: vi.fn().mockResolvedValue({
        entitlementKey: "full_report_unlocked",
      }),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
    auditEvent: {
      create: vi.fn().mockResolvedValue({ id: "audit_1" }),
    },
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback(null),
  };
}

function withTransaction(db: ReturnType<typeof makeConflictDb>) {
  db.$transaction = async (callback: (tx: unknown) => Promise<unknown>) => callback(db);
  return db;
}

describe("BillingEntitlementGrant DB-level idempotency hardening", () => {
  it("documents the local unique constraint in Prisma schema and migration", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    const migration = readFileSync(
      "prisma/migrations/20260601111500_billing_3g_grant_unique_idempotency/migration.sql",
      "utf8",
    );

    expect(schema).toContain("@@unique([billingOrderId, entitlementKey])");
    expect(migration).toContain("CREATE UNIQUE INDEX");
    expect(migration).toContain('"BillingEntitlementGrant"("billingOrderId", "entitlementKey")');
    expect(migration).not.toMatch(/\b(DROP|DELETE|UPDATE|TRUNCATE|INSERT)\b/i);
  });

  it("handles a duplicate grant race as an idempotent replay", async () => {
    const db = withTransaction(makeConflictDb());

    const result = await fulfillBillingOrderManually({
      db: db as never,
      billingOrderId: "billing_order_1",
      adminUserId: "admin_1",
      adminEmail: "admin@example.invalid",
      confirmationAccepted: true,
      note: "Verified paid order.",
    });

    expect(result.status).toBe("already_granted");
    expect(db.billingEntitlementGrant.create).toHaveBeenCalledTimes(1);
    expect(db.assessmentEntitlement.upsert).toHaveBeenCalledTimes(1);
  });
});
