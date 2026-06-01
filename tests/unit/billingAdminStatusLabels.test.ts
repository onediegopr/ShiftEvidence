import { describe, expect, it } from "vitest";
import {
  formatBillingRiskLevel,
  formatBooleanPresence,
  formatBooleanYesNo,
  getBillingEventStatusLabel,
  getBillingEventStatusTone,
  getBillingGrantReviewStatusLabel,
  getBillingGrantReviewStatusTone,
  getBillingGrantStatusLabel,
  getBillingGrantStatusTone,
  getBillingOrderStatusLabel,
  getBillingPaymentStatusLabel,
  getBillingSubscriptionStatusLabel,
  maskBillingProviderId,
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

  it("masks long provider ids for admin display without losing provider prefix", () => {
    expect(maskBillingProviderId("cs_test_b1JiehZZVzCnrN1Swz6XfPpmusQditrjbEvNHUx1cPTG9YaqJ37bjWM5ZK"))
      .toBe("cs_test_...jWM5ZK");
    expect(maskBillingProviderId("pi_short")).toBe("pi_short");
    expect(maskBillingProviderId(null)).toBe("-");
  });

  it("maps commercial ledger statuses to Spanish admin labels", () => {
    expect(getBillingOrderStatusLabel("paid")).toBe("Pagada");
    expect(getBillingOrderStatusLabel("refunded")).toBe("Reembolsada");
    expect(getBillingPaymentStatusLabel("paid")).toBe("Pagado");
    expect(getBillingPaymentStatusLabel("failed")).toBe("Fallido");
    expect(getBillingSubscriptionStatusLabel("active")).toBe("Activa");
    expect(getBillingSubscriptionStatusLabel("payment_failed")).toBe("Pago fallido");
  });

  it("maps billing grant and refund review statuses to Spanish admin labels", () => {
    expect(getBillingGrantStatusLabel("granted")).toBe("Concedido");
    expect(getBillingGrantStatusLabel("revoked")).toBe("Revocado");
    expect(getBillingGrantStatusTone("pending_review")).toBe("warning");
    expect(getBillingGrantReviewStatusLabel("requires_review")).toBe("Requiere revision");
    expect(getBillingGrantReviewStatusLabel("no_action")).toBe("Sin accion");
    expect(getBillingGrantReviewStatusTone("requires_review")).toBe("warning");
  });
});
