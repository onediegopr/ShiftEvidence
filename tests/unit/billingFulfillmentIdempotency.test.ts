import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { fulfillBillingOrderManually } from "../../src/server/billing/admin/billingManualFulfillmentService";

function makeDbWithExistingGrant() {
  const existingGrant = {
    id: "grant_existing",
    billingOrderId: "billing_order_1",
    entitlementKey: "full_report_unlocked",
    status: "granted",
  };

  return {
    billingOrder: {
      findUnique: vi.fn().mockResolvedValue({
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
      }),
    },
    billingEntitlementGrant: {
      findMany: vi.fn().mockResolvedValue([existingGrant]),
      findFirst: vi.fn().mockResolvedValue(existingGrant),
      create: vi.fn(),
    },
    assessmentEntitlement: {
      upsert: vi.fn().mockResolvedValue({
        id: "assessment_entitlement_1",
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

function withTransaction(db: ReturnType<typeof makeDbWithExistingGrant>) {
  db.$transaction = async (callback: (tx: unknown) => Promise<unknown>) => callback(db);
  return db;
}

describe("billing fulfillment idempotency and boundaries", () => {
  it("does not duplicate BillingEntitlementGrant on repeat fulfillment", async () => {
    const db = withTransaction(makeDbWithExistingGrant());

    const result = await fulfillBillingOrderManually({
      db: db as never,
      billingOrderId: "billing_order_1",
      adminUserId: "admin_1",
      adminEmail: "admin@example.invalid",
      confirmationAccepted: true,
    });

    expect(result.status).toBe("already_granted");
    expect(db.billingEntitlementGrant.create).not.toHaveBeenCalled();
    expect(db.assessmentEntitlement.upsert).not.toHaveBeenCalled();
  });

  it("does not wire fulfillment into webhooks, match or subscription flows", () => {
    const webhookPersistence = readFileSync("src/server/billing/webhooks/lemonWebhookPersistence.ts", "utf8");
    const webhookRoute = readFileSync("src/app/api/webhooks/lemon/route.ts", "utf8");
    const manualMatch = readFileSync("src/server/billing/admin/billingManualMatchService.ts", "utf8");
    const billingActions = readFileSync("src/app/dashboard/admin/billing/actions.ts", "utf8");

    expect(webhookPersistence).not.toContain("fulfillBillingOrderManually");
    expect(webhookRoute).not.toContain("fulfillBillingOrderManually");
    expect(manualMatch).not.toContain("fulfillBillingOrderManually");
    expect(manualMatch).not.toContain("billingEntitlementGrant.create");
    const fulfillmentAction = billingActions.slice(billingActions.indexOf("export async function fulfillBillingOrderAction"));
    expect(fulfillmentAction).not.toContain("billingSubscriptionId");
  });
});
