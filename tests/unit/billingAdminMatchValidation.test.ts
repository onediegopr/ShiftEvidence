import { describe, expect, it, vi } from "vitest";
import { getBillingAdminMatchCandidates } from "../../src/server/billing/admin/billingAdminMatchSearchService";
import { matchBillingOrder } from "../../src/server/billing/admin/billingManualMatchService";

const prismaMock = vi.hoisted(() => ({
  user: {
    findMany: vi.fn(),
  },
  workspace: {
    findMany: vi.fn(),
  },
  assessment: {
    findMany: vi.fn(),
  },
}));

vi.mock("../../src/lib/prisma", () => ({
  prisma: prismaMock,
}));

function makeValidationDb() {
  const order = {
    id: "billing_order_1",
    providerOrderId: "provider_order_1",
    planId: "starter_readiness",
    userId: null,
    workspaceId: null,
    assessmentId: null,
  };

  return {
    billingOrder: {
      findUnique: vi.fn().mockResolvedValue(order),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...order, ...data })),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: "user_1",
        email: "buyer@example.invalid",
      }),
    },
    workspace: {
      findUnique: vi.fn().mockResolvedValue({
        id: "workspace_1",
        name: "Customer workspace",
        ownerUserId: "user_1",
      }),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
    assessment: {
      findFirst: vi.fn().mockResolvedValue({
        id: "assessment_1",
        title: "Readiness assessment",
        workspaceId: "workspace_1",
      }),
    },
    auditEvent: {
      create: vi.fn().mockResolvedValue({ id: "audit_1" }),
    },
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback(null),
  };
}

function withTransaction(db: ReturnType<typeof makeValidationDb>) {
  db.$transaction = async (callback: (tx: unknown) => Promise<unknown>) => callback(db);
  return db;
}

describe("billing admin match validation", () => {
  it("allows assessment-only order match and infers workspace safely", async () => {
    const db = withTransaction(makeValidationDb());

    const result = await matchBillingOrder({
      db: db as never,
      billingOrderId: "billing_order_1",
      assessmentId: "assessment_1",
      adminUserId: "admin_1",
      adminEmail: "admin@example.invalid",
      note: "Assessment selected after manual review.",
    });

    expect(result.matchStatus).toBe("partial");
    expect(db.billingOrder.update).toHaveBeenCalledWith({
      where: { id: "billing_order_1" },
      data: {
        userId: null,
        workspaceId: "workspace_1",
        assessmentId: "assessment_1",
      },
    });
  });

  it("searches only safe admin candidate fields", async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([
      {
        id: "user_1",
        email: "buyer@example.invalid",
        name: "Buyer",
      },
    ]);
    prismaMock.workspace.findMany.mockResolvedValueOnce([
      {
        id: "workspace_1",
        name: "Customer workspace",
        companyName: "Example Co",
        ownerUser: {
          email: "owner@example.invalid",
        },
      },
    ]);
    prismaMock.assessment.findMany.mockResolvedValueOnce([
      {
        id: "assessment_1",
        title: "Readiness assessment",
        clientLabel: "Example",
        workspaceId: "workspace_1",
        workspace: {
          name: "Customer workspace",
        },
      },
    ]);

    const candidates = await getBillingAdminMatchCandidates({
      query: "example",
      customerEmail: "buyer@example.invalid",
    });

    expect(candidates.users[0]).toEqual({
      id: "user_1",
      email: "buyer@example.invalid",
      name: "Buyer",
    });
    expect(candidates.workspaces[0]).toEqual({
      id: "workspace_1",
      name: "Customer workspace",
      companyName: "Example Co",
      ownerEmail: "owner@example.invalid",
    });
    expect(candidates.assessments[0]).toEqual({
      id: "assessment_1",
      title: "Readiness assessment",
      clientLabel: "Example",
      workspaceId: "workspace_1",
      workspaceName: "Customer workspace",
    });
  });
});
