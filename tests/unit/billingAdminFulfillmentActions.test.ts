import { describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
);

const requireAdminSessionMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    user: {
      id: "admin_1",
      email: "admin@example.invalid",
    },
  }),
);

const fulfillBillingOrderManuallyMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    status: "granted",
  }),
);

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("../../src/server/admin/adminAuth", () => ({
  requireAdminSession: requireAdminSessionMock,
}));

vi.mock("../../src/server/billing/admin/billingManualFulfillmentService", () => ({
  fulfillBillingOrderManually: fulfillBillingOrderManuallyMock,
}));

vi.mock("../../src/server/billing/admin/billingManualMatchService", () => ({
  matchBillingOrder: vi.fn(),
  matchBillingSubscription: vi.fn(),
}));

describe("billing admin fulfillment actions", () => {
  it("requires admin session and derives fulfillment server-side", async () => {
    const { fulfillBillingOrderAction } = await import("../../src/app/dashboard/admin/billing/actions");
    const formData = new FormData();
    formData.set("billingOrderId", "billing_order_1");
    formData.set("confirmFulfillment", "confirmed");
    formData.set("entitlementKeys", "pro_matrix_unlocked");
    formData.set("note", "Verified paid order.");

    await expect(fulfillBillingOrderAction(formData)).rejects.toThrow("REDIRECT:/dashboard/admin/billing?saved=fulfillment");

    expect(requireAdminSessionMock).toHaveBeenCalled();
    expect(fulfillBillingOrderManuallyMock).toHaveBeenCalledWith({
      adminUserId: "admin_1",
      adminEmail: "admin@example.invalid",
      billingOrderId: "billing_order_1",
      confirmationAccepted: true,
      note: "Verified paid order.",
    });
  });

  it("redirects with a safe error when confirmation is missing", async () => {
    fulfillBillingOrderManuallyMock.mockRejectedValueOnce(new Error("La confirmacion explicita es obligatoria."));
    const { fulfillBillingOrderAction } = await import("../../src/app/dashboard/admin/billing/actions");
    const formData = new FormData();
    formData.set("billingOrderId", "billing_order_1");

    await expect(fulfillBillingOrderAction(formData)).rejects.toThrow("/dashboard/admin/billing?error=");
  });
});
