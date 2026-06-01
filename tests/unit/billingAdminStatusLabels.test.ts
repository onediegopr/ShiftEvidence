import { describe, expect, it } from "vitest";
import {
  formatBillingRiskLevel,
  formatBooleanPresence,
  formatBooleanYesNo,
  getBillingEventStatusLabel,
  getBillingEventStatusTone,
  getBillingOrderStatusLabel,
  getBillingPaymentStatusLabel,
  getBillingSubscriptionStatusLabel,
} from "../../src/server/billing/admin/billingAdminLabels";

describe("billing admin status labels", () => {
  it("maps BillingEvent statuses to Spanish admin labels", () => {
    expect(getBillingEventStatusLabel("pending")).toBe("Pendiente");
    expect(getBillingEventStatusLabel("processed")).toBe("Capturado");
    expect(getBillingEventStatusLabel("failed")).toBe("Fallido");
    expect(getBillingEventStatusLabel("ignored")).toBe("Ignorado");
  });

  it("keeps processed distinct from payment processing semantics", () => {
    expect(getBillingEventStatusLabel("processed")).toBe("Capturado");
    expect(getBillingEventStatusLabel("processed")).not.toBe("Pagado");
    expect(getBillingEventStatusTone("processed")).toBe("good");
  });

  it("formats safe boolean and risk values in Spanish", () => {
    expect(formatBooleanPresence(true)).toBe("Presente");
    expect(formatBooleanPresence(false)).toBe("Ausente");
    expect(formatBooleanYesNo(true)).toBe("Si");
    expect(formatBooleanYesNo(false)).toBe("No");
    expect(formatBillingRiskLevel("bajo")).toBe("Bajo");
    expect(formatBillingRiskLevel("medio")).toBe("Medio");
    expect(formatBillingRiskLevel("alto")).toBe("Alto");
  });

  it("maps commercial ledger statuses to Spanish admin labels", () => {
    expect(getBillingOrderStatusLabel("paid")).toBe("Pagada");
    expect(getBillingOrderStatusLabel("refunded")).toBe("Reembolsada");
    expect(getBillingPaymentStatusLabel("paid")).toBe("Pagado");
    expect(getBillingPaymentStatusLabel("failed")).toBe("Fallido");
    expect(getBillingSubscriptionStatusLabel("active")).toBe("Activa");
    expect(getBillingSubscriptionStatusLabel("payment_failed")).toBe("Pago fallido");
  });
});
