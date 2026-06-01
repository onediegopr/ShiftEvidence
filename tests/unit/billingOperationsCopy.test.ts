import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("billing operations public and admin copy", () => {
  it("does not promise instant access on checkout success boundary", () => {
    const checkoutPage = readFileSync("src/app/billing/checkout/[plan]/page.tsx", "utf8");

    expect(checkoutPage).toContain("Entitlements are still handled manually");
    expect(checkoutPage).toContain("No entitlement is granted automatically");
    expect(checkoutPage).not.toMatch(/instant access/i);
  });

  it("keeps support billing copy focused on manual invoice and refunds without provider automation", () => {
    const supportPage = readFileSync("src/app/support/page.tsx", "utf8");

    expect(supportPage).toContain("Billing questions");
    expect(supportPage).toContain("Support can help with paid-but-no-access, wrong email, invoice requests, duplicate payment checks, refund requests, failed payment follow-up, and MSP subscription questions.");
    expect(supportPage).toContain("Refunds and access adjustments are reviewed manually");
    expect(supportPage).not.toContain("Lemon checkout");
  });

  it("keeps admin billing provider ids masked in UI tables", () => {
    const adminPage = readFileSync("src/app/dashboard/admin/billing/page.tsx", "utf8");

    expect(adminPage).toContain("maskBillingProviderId");
    expect(adminPage).toContain("Acciones requeridas");
    expect(adminPage).toContain("Exportar CSV");
  });
});
