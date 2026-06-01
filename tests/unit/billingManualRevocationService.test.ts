import { describe, expect, it, vi } from "vitest";
import { revokeBillingGrantedEntitlement } from "../../src/server/billing/admin/billingManualRevocationService";

function makeGrant(overrides?: Record<string, unknown>) {
  return {
    id: "grant_1",
    billingOrderId: "billing_order_1",
    billingSubscriptionId: null,
    entitlementKey: "full_report_unlocked",
    status: "granted",
    source: "manual_billing_fulfillment",
    userId: "user_1",
    workspaceId: "workspace_1",
    assessmentId: "assessment_1",
    billingOrder: {
      id: "billing_order_1",
      providerOrderId: "provider_order_1",
      status: "refunded",
    },
    billingSubscription: null,
    ...overrides,
  };
}

function makeDb(overrides?: {
  grant?: Record<string, unknown> | null;
  assessmentEntitlement?: Record<string, unknown> | null;
}) {
  const grant = overrides?.grant ?? makeGrant();
  const assessmentEntitlement = overrides?.assessmentEntitlement ?? {
    source: "billing_order:billing_order_1",
    status: "granted",
  };

  return {
    billingEntitlementGrant: {
      findUnique: vi.fn().mockResolvedValue(grant),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({
        ...(grant ?? {}),
        ...data,
      })),
    },
    assessmentEntitlement: {
      findUnique: vi.fn().mockResolvedValue(assessmentEntitlement),
      upsert: vi.fn().mockResolvedValue({
        entitlementKey: "full_report_unlocked",
        status: "locked",
      }),
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

const validParams = {
  billingEntitlementGrantId: "grant_1",
  adminUserId: "admin_1",
  adminEmail: "admin@example.invalid",
  confirmationAccepted: true,
  note: "Refund verified and access should be revoked.",
};

describe("billing manual revocation service", () => {
  it("revokes a valid manually fulfilled grant and creates an AuditEvent", async () => {
    const db = withTransaction(makeDb());

    const result = await revokeBillingGrantedEntitlement({
      ...validParams,
      db: db as never,
    });

    expect(result.status).toBe("revoked");
    expect(db.assessmentEntitlement.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({
        status: "locked",
        source: "billing_revoke:grant_1",
        purchasedAt: null,
      }),
    }));
    expect(db.billingEntitlementGrant.update).toHaveBeenCalledWith({
      where: { id: "grant_1" },
      data: expect.objectContaining({
        status: "revoked",
        reviewNotes: "Refund verified and access should be revoked.",
      }),
    });
    expect(db.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "admin_1",
        workspaceId: "workspace_1",
        assessmentId: "assessment_1",
        eventType: "billing_entitlement_revoked_from_billing",
        metadataJson: expect.objectContaining({
          billingEntitlementGrantId: "grant_1",
          billingOrderId: "billing_order_1",
          providerOrderId: "provider_order_1",
          result: "revoked",
        }),
      }),
    });
  });

  it("is idempotent when the grant is already revoked", async () => {
    const db = withTransaction(makeDb({
      grant: makeGrant({ status: "revoked" }),
    }));

    const result = await revokeBillingGrantedEntitlement({
      ...validParams,
      db: db as never,
    });

    expect(result.status).toBe("already_revoked");
    expect(db.assessmentEntitlement.upsert).not.toHaveBeenCalled();
    expect(db.billingEntitlementGrant.update).not.toHaveBeenCalled();
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });

  it("blocks revocation for grants not created by manual billing fulfillment", async () => {
    const db = withTransaction(makeDb({
      grant: makeGrant({ source: "manual_unlock" }),
    }));

    await expect(revokeBillingGrantedEntitlement({
      ...validParams,
      db: db as never,
    })).rejects.toThrow("Solo se pueden revocar grants creados por fulfillment billing manual.");
  });

  it("blocks revocation when another source may justify access", async () => {
    const db = withTransaction(makeDb({
      assessmentEntitlement: {
        source: "manual_unlock",
        status: "granted",
      },
    }));

    await expect(revokeBillingGrantedEntitlement({
      ...validParams,
      db: db as never,
    })).rejects.toThrow("Otra fuente puede justificar este acceso.");
  });

  it("requires explicit confirmation and sanitized mandatory notes", async () => {
    const db = withTransaction(makeDb());

    await expect(revokeBillingGrantedEntitlement({
      ...validParams,
      confirmationAccepted: false,
      db: db as never,
    })).rejects.toThrow("La confirmacion explicita es obligatoria");

    await expect(revokeBillingGrantedEntitlement({
      ...validParams,
      note: "",
      db: db as never,
    })).rejects.toThrow("La nota interna es obligatoria");

    await expect(revokeBillingGrantedEntitlement({
      ...validParams,
      note: "contains webhook secret token",
      db: db as never,
    })).rejects.toThrow("La nota interna parece contener credenciales");
  });

  it("does not delete billing, users, assessments or reports", async () => {
    const source = await import("node:fs").then((fs) =>
      fs.readFileSync("src/server/billing/admin/billingManualRevocationService.ts", "utf8"),
    );

    expect(source).not.toMatch(/\.delete\(/);
    expect(source).not.toMatch(/\.deleteMany\(/);
  });
});
