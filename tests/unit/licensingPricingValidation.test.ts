import { describe, expect, it } from "vitest";
import {
  assertNoThirdPartyLicensingText,
  assertSnapshotUsableForFinancialCalculations,
  assertStoragePricingNotImplemented,
  isSnapshotUsableForFinancialCalculations,
  normalizePricingVendor,
  normalizeUsdCurrency,
  validatePricingSnapshotInput,
  validateSnapshotCanBeApproved,
} from "../../src/server/pricing/licensingPricingValidation";

describe("licensing pricing validation", () => {
  it("allows only VMware/Broadcom and Proxmox vendors", () => {
    expect(normalizePricingVendor("vmware")).toBe("vmware");
    expect(normalizePricingVendor("proxmox")).toBe("proxmox");
    expect(() => normalizePricingVendor("microsoft")).toThrow(/vmware or proxmox/i);
  });

  it("normalizes all financial values to USD only", () => {
    expect(normalizeUsdCurrency(undefined)).toBe("USD");
    expect(normalizeUsdCurrency("usd")).toBe("USD");
    expect(() => normalizeUsdCurrency("EUR")).toThrow(/USD/);
  });

  it("rejects third-party licensing terms", () => {
    expect(() => assertNoThirdPartyLicensingText("VMware Cloud Foundation")).not.toThrow();
    expect(() => assertNoThirdPartyLicensingText("SQL Server per core")).toThrow(/third-party/i);
    expect(() => assertNoThirdPartyLicensingText("Veeam backup license")).toThrow(/third-party/i);
  });

  it("rejects negative USD pricing", () => {
    expect(() =>
      validatePricingSnapshotInput({
        vendor: "proxmox",
        currency: "USD",
        sourceName: "Manual admin source",
        sourceType: "manual_admin",
        items: [
          {
            vendor: "proxmox",
            productName: "Proxmox subscription",
            metric: "subscription",
            unitPriceUsd: -1,
          },
        ],
      }),
    ).toThrow(/cannot be negative/i);
  });

  it("keeps draft, pending and rejected snapshots unusable", () => {
    expect(isSnapshotUsableForFinancialCalculations("approved")).toBe(true);
    expect(isSnapshotUsableForFinancialCalculations("draft")).toBe(false);
    expect(isSnapshotUsableForFinancialCalculations("pending_review")).toBe(false);
    expect(isSnapshotUsableForFinancialCalculations("rejected")).toBe(false);
    expect(() => assertSnapshotUsableForFinancialCalculations("pending_review")).toThrow(/Only approved/);
  });

  it("does not allow placeholder snapshots to be approved", () => {
    expect(() =>
      validateSnapshotCanBeApproved({
        currency: "USD",
        sourceType: "placeholder",
        items: [{ productName: "VMware/Broadcom placeholder", unitPriceUsd: 100 }],
      }),
    ).toThrow(/Placeholder/);
  });

  it("requires at least one USD price before approval", () => {
    expect(() =>
      validateSnapshotCanBeApproved({
        currency: "USD",
        sourceType: "manual_admin",
        items: [{ productName: "Proxmox subscription", unitPriceUsd: null }],
      }),
    ).toThrow(/unit price/i);
  });

  it("keeps storage pricing explicitly out of COST-1A", () => {
    expect(() => assertStoragePricingNotImplemented()).toThrow(/Storage cost modeling is in development/i);
  });
});
