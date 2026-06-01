import { describe, expect, it, vi } from "vitest";
import {
  matchBillingOrder,
  matchBillingSubscription,
} from "../../src/server/billing/admin/billingManualMatchService";

function makeDb(overrides?: {
  order?: Record<string, unknown> | null;
  subscription?: Record<string, unknown> | null;
  user?: Record<string, unknown> | null;
  workspace?: Record<string, unknown> | null;
  assessment?: Record<string, unknown> | null;
  membership?: Record<string, unknown> | null;
}) {
  const order = overrides?.order ?? {
    id: "billing_order_1",
    providerOrderId: "provider_order_1",
    planId: "starter_readiness",
    userId: null,
    workspaceId: null,
    assessmentId: null,
  };
  const subscription = overrides?.subscription ?? {
    id: "billing_subscription_1",
    providerSubscriptionId: "provider_subscription_1",
    planId: "msp_partner",
    userId: null,
    workspaceId: null,
  };
  const user = overrides?.user ?? {
    id: "user_1",
    email: "buyer@example.invalid",
  };
  const workspace = overrides?.workspace ?? {
    id: "workspace_1",
    name: "Customer workspace",
    ownerUserId: "user_1",
  };
  const assessment = overrides?.assessment ?? {
    id: "assessment_1",
    title: "Readiness assessment",
    workspaceId: "workspace_1",
  };

  return {
    billingOrder: {
      findUnique: vi.fn().mockResolvedValue(order),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...order, ...data })),
    },
    billingSubscription: {
      findUnique: vi.fn().mockResolvedValue(subscription),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...subscription, ...data })),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(user),
    },
    workspace: {
      findUnique: vi.fn().mockResolvedValue(workspace),
    },
    workspaceMember: {
      findUnique: vi.fn().mockResolvedValue(overrides?.membership ?? null),
    },
    assessment: {
      findFirst: vi.fn().mockResolvedValue(assessment),
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

describe("billing manual match service", () => {
  it("matches a billing order to user, workspace and assessment with audit event", async () => {
    const db = withTransaction(makeDb());

    const result = await matchBillingOrder({
      db: db as never,
      billingOrderId: "billing_order_1",
      userId: "user_1",
      workspaceId: "workspace_1",
      assessmentId: "assessment_1",
      adminUserId: "admin_1",
      adminEmail: "admin@example.invalid",
      note: "Verified customer email and workspace owner.",
    });

    expect(result.matchStatus).toBe("complete");
    expect(db.billingOrder.update).toHaveBeenCalledWith({
      where: { id: "billing_order_1" },
      data: {
        userId: "user_1",
        workspaceId: "workspace_1",
        assessmentId: "assessment_1",
      },
    });
    expect(db.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "admin_1",
        workspaceId: "workspace_1",
        assessmentId: "assessment_1",
        eventType: "billing_order_matched",
        message: expect.stringContaining("Guardar match no otorga acceso"),
      }),
    });
  });

  it("matches a billing subscription to user and workspace only", async () => {
    const db = withTransaction(makeDb());

    const result = await matchBillingSubscription({
      db: db as never,
      billingSubscriptionId: "billing_subscription_1",
      userId: "user_1",
      workspaceId: "workspace_1",
      adminUserId: "admin_1",
      adminEmail: "admin@example.invalid",
      note: "Matched MSP owner.",
    });

    expect(result.matchStatus).toBe("complete");
    expect(db.billingSubscription.update).toHaveBeenCalledWith({
      where: { id: "billing_subscription_1" },
      data: {
        userId: "user_1",
        workspaceId: "workspace_1",
      },
    });
    expect(db.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: "billing_subscription_matched",
        message: expect.stringContaining("no activa acceso partner"),
      }),
    });
  });

  it("rejects assessment and workspace mismatches", async () => {
    const db = withTransaction(makeDb({
      assessment: {
        id: "assessment_1",
        title: "Other assessment",
        workspaceId: "other_workspace",
      },
    }));

    await expect(matchBillingOrder({
      db: db as never,
      billingOrderId: "billing_order_1",
      userId: "user_1",
      workspaceId: "workspace_1",
      assessmentId: "assessment_1",
      adminUserId: "admin_1",
      adminEmail: "admin@example.invalid",
    })).rejects.toThrow("El assessment no pertenece al workspace seleccionado.");
  });

  it("rejects users that do not belong to the selected workspace", async () => {
    const db = withTransaction(makeDb({
      workspace: {
        id: "workspace_1",
        name: "Customer workspace",
        ownerUserId: "owner_1",
      },
      membership: null,
    }));

    await expect(matchBillingSubscription({
      db: db as never,
      billingSubscriptionId: "billing_subscription_1",
      userId: "user_1",
      workspaceId: "workspace_1",
      adminUserId: "admin_1",
      adminEmail: "admin@example.invalid",
    })).rejects.toThrow("El usuario no pertenece al workspace seleccionado.");
  });

  it("rejects internal notes that look like credentials or card data", async () => {
    const db = withTransaction(makeDb());

    await expect(matchBillingOrder({
      db: db as never,
      billingOrderId: "billing_order_1",
      userId: "user_1",
      workspaceId: "workspace_1",
      assessmentId: "assessment_1",
      adminUserId: "admin_1",
      adminEmail: "admin@example.invalid",
      note: "temporary credential token should not be saved",
    })).rejects.toThrow("La nota interna parece contener credenciales o datos sensibles.");
  });
});
