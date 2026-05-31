import { describe, expect, it } from "vitest";
import {
  calculateLicensingComparison,
  calculateVmwareBillableCores,
} from "../../src/lib/licensing/licensingCostModel";
import {
  NORMALIZED_LICENSING_CURRENCY,
  STATIC_EUR_USD_RATE,
  convertMoney,
  getLicensingPriceItem,
  listLicensingPriceItems,
} from "../../src/lib/licensing/pricingSource";

describe("central licensing cost model", () => {
  it.each([
    [{ hosts: 1, socketsPerHost: 2, coresPerSocket: 8 }, 16, 32],
    [{ hosts: 1, socketsPerHost: 2, coresPerSocket: 16 }, 32, 32],
    [{ hosts: 1, socketsPerHost: 2, coresPerSocket: 24 }, 48, 48],
    [{ hosts: 3, socketsPerHost: 2, coresPerSocket: 12 }, 72, 96],
  ])("applies VMware 16-core minimum per socket for %o", (input, rawCores, billableCores) => {
    const result = calculateVmwareBillableCores(input);

    expect(result.rawCores).toBe(rawCores);
    expect(result.billableCores).toBe(billableCores);
  });

  it("keeps Proxmox Basic, Standard and Premium in the central pricing source", () => {
    const proxmoxTiers = listLicensingPriceItems("proxmox").map((item) => item.tier);

    expect(proxmoxTiers).toContain("basic");
    expect(proxmoxTiers).toContain("standard");
    expect(proxmoxTiers).toContain("premium");
  });

  it("normalizes Proxmox EUR pricing to USD with auditable FX metadata", () => {
    const premium = getLicensingPriceItem("proxmox", "premium");

    expect(premium?.unitPrice).toEqual({ amount: 1100, currency: "EUR" });
    expect(premium?.normalizedUnitPrice).toEqual({ amount: 1188, currency: "USD" });
    expect(premium?.conversion?.fxRate).toBe(STATIC_EUR_USD_RATE.rate);
    expect(premium?.conversion?.fxDate).toBe(STATIC_EUR_USD_RATE.effectiveDate);
  });

  it("does not convert currencies without a configured FX rate", () => {
    expect(() => convertMoney({ amount: 1, currency: "USD" }, "EUR")).toThrow(/No FX rate/);
  });

  it("returns comparable annual cost outputs for public UI and backend wrappers", () => {
    const result = calculateLicensingComparison({
      hosts: 8,
      socketsPerHost: 2,
      coresPerSocket: 24,
      vmwareTier: "vvf",
      proxmoxTier: "premium",
      includeVmwareEscalation: false,
    });

    expect(result.currency).toBe(NORMALIZED_LICENSING_CURRENCY);
    expect(result.vmware.billableCores).toBe(384);
    expect(result.vmware.annualCost).toEqual({ amount: 51_840, currency: "USD" });
    expect(result.proxmox.annualCost).toEqual({ amount: 19_008, currency: "USD" });
    expect(result.comparison.annualSavings).toEqual({ amount: 32_832, currency: "USD" });
    expect(result.currencyMetadata.conversions[0]?.fxRate).toBe(1.08);
  });
});
