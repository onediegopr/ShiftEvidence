import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { deriveBillingGrantReviewStatus } from "../../src/server/billing/admin/billingRefundCancelReviewService";

describe("billing refund/cancel review boundary", () => {
  it("marks refunded and cancelled manual grants as requiring review", () => {
    expect(deriveBillingGrantReviewStatus({
      grantStatus: "granted",
      source: "manual_billing_fulfillment",
      orderStatus: "refunded",
    })).toMatchObject({
      reviewStatus: "requires_review",
      canRevoke: true,
    });

    expect(deriveBillingGrantReviewStatus({
      grantStatus: "granted",
      source: "manual_billing_fulfillment",
      orderStatus: "cancelled",
    })).toMatchObject({
      reviewStatus: "requires_review",
      canRevoke: true,
    });
  });

  it("does not make pending orders or non-manual sources revocable", () => {
    expect(deriveBillingGrantReviewStatus({
      grantStatus: "granted",
      source: "manual_billing_fulfillment",
      orderStatus: "pending",
    })).toMatchObject({
      reviewStatus: "granted",
      canRevoke: false,
    });

    expect(deriveBillingGrantReviewStatus({
      grantStatus: "granted",
      source: "manual_unlock",
      orderStatus: "refunded",
    })).toMatchObject({
      reviewStatus: "no_action",
      canRevoke: false,
    });
  });

  it("marks risky subscription states for review without enabling revocation", () => {
    for (const subscriptionStatus of ["cancelled", "payment_failed", "expired"] as const) {
      expect(deriveBillingGrantReviewStatus({
        grantStatus: "granted",
        source: "manual_billing_fulfillment",
        subscriptionStatus,
      })).toMatchObject({
        reviewStatus: "requires_review",
        canRevoke: false,
      });
    }
  });

  it("keeps refund and subscription webhook flows away from auto-revocation", () => {
    const webhookPersistence = readFileSync("src/server/billing/webhooks/lemonWebhookPersistence.ts", "utf8");
    const webhookRoute = readFileSync("src/app/api/webhooks/lemon/route.ts", "utf8");
    const businessLedger = readFileSync("src/server/billing/ledger/billingBusinessLedgerService.ts", "utf8");

    expect(webhookPersistence).not.toContain("revokeBillingGrantedEntitlement");
    expect(webhookRoute).not.toContain("revokeBillingGrantedEntitlement");
    expect(businessLedger).not.toContain("revokeBillingGrantedEntitlement");
    expect(businessLedger).not.toContain("revokeAssessmentEntitlement");
    expect(businessLedger).not.toContain("billingEntitlementGrant.update");
  });
});
