import { describe, expect, it, vi } from "vitest";
import { fulfillBillingOrderManually } from "../../src/server/billing/admin/billingManualFulfillmentService";

function makeOrder(overrides?: Record<string, unknown>) {
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
    ...overrides,
  };
}

function makeDb(overrides?: {
  order?: Record<string, unknown> | null;
  existingGrants?: Array<Record<string, unknown>>;
  membership?: Record<string, unknown> | null;
}) {
  const order = overrides?.order ?? makeOrder();
  const existingGrants = overrides?.existingGrants ?? [];
  const createdGrants: Array<Record<string, unknown>> = [];

  return {
    createdGrants,
    billingOrder: {
      findUnique: vi.fn().mockResolvedValue(order),
    },
    billingEntitlementGrant: {
      findMany: vi.fn().mockResolvedValue(existingGrants),
      findFirst: vi.fn().mockImplementation(({ where }) => Promise.resolve(
        [...existingGrants, ...createdGrants].find((grant) =>
          grant.billingOrderId === where.billingOrderId &&
          grant.entitlementKey === where.entitlementKey &&
          ["pending_review", "granted"].includes(String(grant.status))
        ) ?? null,
      )),
      create: vi.fn().mockImplementation(({ data }) => {
        const grant = { id: `grant_${createdGrants.length + 1}`, ...data };
        createdGrants.push(grant);
        return Promise.resolve(grant);
      }),
    },
    assessmentEntitlement: {
      upsert: vi.fn().mockImplementation(({ create, update }) => Promise.resolve({
        id: `assessment_entitlement_${create.entitlementKey}`,
        ...create,
        ...update,
      })),
    },
    workspaceMember: {
      findUnique: vi.fn().mockResolvedValue(overrides?.membership ?? null),
    },
    auditEvent: {
      create: vi.fn().mockResolvedValue({ id: "audit_1" }),
    },
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback(null),
  };
}

function withTransaction(db: ReturnType<typeof makeDb>) {
  db.$transaction = async (callback: (tx: unknown) => Promise<unknown>) => callback(db);
  return db;
}

function fulfillmentParams(overrides?: Record<string, unknown>) {
  return {
    billingOrderId: "billing_order_1",
    adminUserId: "admin_1",
    adminEmail: "admin@example.invalid",
    confirmationAccepted: true,
    note: "Verified paid Lemon order.",
    ...overrides,
  };
}

describe("billing manual fulfillment service", () => {
  it("creates BillingEntitlementGrant and AssessmentEntitlement for a Starter paid matched order", async () => {
    const db = withTransaction(makeDb());

    const result = await fulfillBillingOrderManually({
      ...fulfillmentParams(),
      db: db as never,
    });

    expect(result.status).toBe("granted");
    expect(result.entitlementKeys).toEqual(["full_report_unlocked"]);
    expect(db.billingEntitlementGrant.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        billingOrderId: "billing_order_1",
        entitlementKey: "full_report_unlocked",
        status: "granted",
        source: "manual_billing_fulfillment",
      }),
    });
    expect(db.assessmentEntitlement.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        assessmentId: "assessment_1",
        entitlementKey: "full_report_unlocked",
        status: "granted",
      }),
    }));
  });

  it("creates two entitlements for a Professional paid matched order", async () => {
    const db = withTransaction(makeDb({
      order: makeOrder({
        planId: "professional_assessment",
        amountCents: 150000,
      }),
    }));

    const result = await fulfillBillingOrderManually({
      ...fulfillmentParams(),
      db: db as never,
    });

    expect(result.entitlementKeys).toEqual(["full_report_unlocked", "pro_matrix_unlocked"]);
    expect(db.billingEntitlementGrant.create).toHaveBeenCalledTimes(2);
    expect(db.assessmentEntitlement.upsert).toHaveBeenCalledTimes(2);
  });

  it("creates an audit event with billing and entitlement context", async () => {
    const db = withTransaction(makeDb());

    await fulfillBillingOrderManually({
      ...fulfillmentParams(),
      db: db as never,
    });

    expect(db.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "admin_1",
        workspaceId: "workspace_1",
        assessmentId: "assessment_1",
        eventType: "billing_order_fulfilled",
        metadataJson: expect.objectContaining({
          actorEmail: "admin@example.invalid",
          billingOrderId: "billing_order_1",
          providerOrderId: "provider_order_1",
          entitlementKeys: ["full_report_unlocked"],
        }),
      }),
    });
  });

  it("rejects assessment workspace mismatch", async () => {
    const db = withTransaction(makeDb({
      order: makeOrder({
        assessment: { id: "assessment_1", workspaceId: "other_workspace" },
      }),
    }));

    await expect(fulfillBillingOrderManually({
      ...fulfillmentParams(),
      db: db as never,
    })).rejects.toThrow("El assessment no pertenece al workspace de la orden.");
  });

  it("rejects users that do not belong to the workspace", async () => {
    const db = withTransaction(makeDb({
      order: makeOrder({
        workspace: { id: "workspace_1", ownerUserId: "owner_1" },
      }),
      membership: null,
    }));

    await expect(fulfillBillingOrderManually({
      ...fulfillmentParams(),
      db: db as never,
    })).rejects.toThrow("El usuario no pertenece al workspace seleccionado.");
  });

  it("rejects internal notes that look unsafe", async () => {
    const db = withTransaction(makeDb());

    await expect(fulfillBillingOrderManually({
      ...fulfillmentParams({
        note: "contains credential token",
      }),
      db: db as never,
    })).rejects.toThrow("La nota interna parece contener credenciales o datos sensibles.");
  });
});
