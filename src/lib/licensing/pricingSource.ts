export type CurrencyCode = "USD" | "EUR";

export type LicensingVendor = "vmware" | "proxmox";

export type BillingMetric = "core" | "socket" | "host" | "node" | "cpu";

export type PricingSourceType =
  | "official_vendor"
  | "internal_assumption"
  | "market_reference"
  | "static_placeholder";

export type MoneyAmount = {
  amount: number;
  currency: CurrencyCode;
};

export type FxRateMetadata = {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  source: "internal_static_assumption";
  sourceName: string;
  sourceDate: string;
  effectiveDate: string;
  notes: string;
  roundingMode: "round_to_cents";
};

export type ConvertedMoneyAmount = {
  original: MoneyAmount;
  normalized: MoneyAmount;
  fxRate?: number;
  fxSource?: string;
  fxDate?: string;
  roundingMode: "round_to_cents";
};

export type PricingSourceMetadata = {
  sourceType: PricingSourceType;
  sourceName: string;
  sourceUrl?: string;
  sourceDate: string;
  effectiveDate: string;
  notes?: string;
};

export type LicensingPriceItem = {
  vendor: LicensingVendor;
  product: string;
  tier: string;
  billingMetric: BillingMetric;
  period: "annual";
  unitPrice: MoneyAmount;
  normalizedUnitPrice: MoneyAmount;
  minUnits?: number;
  metadata: PricingSourceMetadata;
  conversion?: ConvertedMoneyAmount;
};

export const NORMALIZED_LICENSING_CURRENCY: CurrencyCode = "USD";

export const VMWARE_MIN_CORES_PER_SOCKET = 16;

export const BROADCOM_ESCALATION_RATE = 0.1;

export const STATIC_EUR_USD_RATE: FxRateMetadata = {
  from: "EUR",
  to: "USD",
  rate: 1.08,
  source: "internal_static_assumption",
  sourceName: "Shift Evidence static EUR to USD assumption",
  sourceDate: "2026-05-31",
  effectiveDate: "2026-05-31",
  notes: "Static assumption used until a dynamic FX source is implemented.",
  roundingMode: "round_to_cents",
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function convertMoney(amount: MoneyAmount, targetCurrency: CurrencyCode): ConvertedMoneyAmount {
  if (amount.currency === targetCurrency) {
    return {
      original: amount,
      normalized: { amount: roundCurrency(amount.amount), currency: targetCurrency },
      roundingMode: "round_to_cents",
    };
  }

  if (amount.currency === "EUR" && targetCurrency === "USD") {
    return {
      original: amount,
      normalized: {
        amount: roundCurrency(amount.amount * STATIC_EUR_USD_RATE.rate),
        currency: targetCurrency,
      },
      fxRate: STATIC_EUR_USD_RATE.rate,
      fxSource: STATIC_EUR_USD_RATE.sourceName,
      fxDate: STATIC_EUR_USD_RATE.effectiveDate,
      roundingMode: STATIC_EUR_USD_RATE.roundingMode,
    };
  }

  throw new Error(`No FX rate is configured for ${amount.currency} to ${targetCurrency}.`);
}

function normalizePrice(item: Omit<LicensingPriceItem, "normalizedUnitPrice" | "conversion">): LicensingPriceItem {
  const conversion = convertMoney(item.unitPrice, NORMALIZED_LICENSING_CURRENCY);
  return {
    ...item,
    normalizedUnitPrice: conversion.normalized,
    conversion: item.unitPrice.currency === NORMALIZED_LICENSING_CURRENCY ? undefined : conversion,
  };
}

const vmwareMetadata: PricingSourceMetadata = {
  sourceType: "market_reference",
  sourceName: "VMware/Broadcom Benchmark Estimates",
  sourceDate: "2026-05-31",
  effectiveDate: "2026-05-31",
  notes: "Market-reference estimates for directional assessment modeling. Not a vendor quote.",
};

const proxmoxMetadata: PricingSourceMetadata = {
  sourceType: "official_vendor",
  sourceName: "Proxmox VE official list pricing",
  sourceUrl: "https://www.proxmox.com/en/proxmox-virtual-environment/pricing",
  sourceDate: "2026-05-31",
  effectiveDate: "2026-05-31",
  notes: "EUR list pricing normalized to USD with the central static FX assumption.",
};

export const LICENSING_PRICING_ITEMS = [
  normalizePrice({
    vendor: "vmware",
    product: "VMware vSphere Standard",
    tier: "standard",
    billingMetric: "core",
    period: "annual",
    unitPrice: { amount: 50, currency: "USD" },
    minUnits: VMWARE_MIN_CORES_PER_SOCKET,
    metadata: vmwareMetadata,
  }),
  normalizePrice({
    vendor: "vmware",
    product: "VMware vSphere Foundation",
    tier: "vvf",
    billingMetric: "core",
    period: "annual",
    unitPrice: { amount: 135, currency: "USD" },
    minUnits: VMWARE_MIN_CORES_PER_SOCKET,
    metadata: vmwareMetadata,
  }),
  normalizePrice({
    vendor: "vmware",
    product: "VMware Cloud Foundation",
    tier: "vcf",
    billingMetric: "core",
    period: "annual",
    unitPrice: { amount: 350, currency: "USD" },
    minUnits: VMWARE_MIN_CORES_PER_SOCKET,
    metadata: vmwareMetadata,
  }),
  normalizePrice({
    vendor: "proxmox",
    product: "Proxmox VE Subscription",
    tier: "community",
    billingMetric: "socket",
    period: "annual",
    unitPrice: { amount: 120, currency: "EUR" },
    minUnits: 1,
    metadata: proxmoxMetadata,
  }),
  normalizePrice({
    vendor: "proxmox",
    product: "Proxmox VE Subscription",
    tier: "basic",
    billingMetric: "socket",
    period: "annual",
    unitPrice: { amount: 370, currency: "EUR" },
    minUnits: 1,
    metadata: proxmoxMetadata,
  }),
  normalizePrice({
    vendor: "proxmox",
    product: "Proxmox VE Subscription",
    tier: "standard",
    billingMetric: "socket",
    period: "annual",
    unitPrice: { amount: 550, currency: "EUR" },
    minUnits: 1,
    metadata: proxmoxMetadata,
  }),
  normalizePrice({
    vendor: "proxmox",
    product: "Proxmox VE Subscription",
    tier: "premium",
    billingMetric: "socket",
    period: "annual",
    unitPrice: { amount: 1100, currency: "EUR" },
    minUnits: 1,
    metadata: proxmoxMetadata,
  }),
] as const satisfies readonly LicensingPriceItem[];

export type VmwarePricingTier = "standard" | "vvf" | "vcf";

export type ProxmoxPricingTier = "community" | "basic" | "standard" | "premium";

export function getLicensingPriceItem(vendor: LicensingVendor, tier: string) {
  return LICENSING_PRICING_ITEMS.find((item) => item.vendor === vendor && item.tier === tier) ?? null;
}

export function listLicensingPriceItems(vendor?: LicensingVendor) {
  return vendor ? LICENSING_PRICING_ITEMS.filter((item) => item.vendor === vendor) : [...LICENSING_PRICING_ITEMS];
}

export function buildPricingSourceNote(item: LicensingPriceItem) {
  const parts = [
    `${item.metadata.sourceName}; original ${item.unitPrice.amount} ${item.unitPrice.currency}/${item.billingMetric}/year`,
  ];

  if (item.conversion) {
    parts.push(
      `normalized to ${item.normalizedUnitPrice.amount} ${item.normalizedUnitPrice.currency} with FX ${item.conversion.fxRate} (${item.conversion.fxSource}, ${item.conversion.fxDate})`,
    );
  }

  if (item.minUnits) {
    parts.push(`minUnits=${item.minUnits}`);
  }

  return `${parts.join("; ")}.`;
}
