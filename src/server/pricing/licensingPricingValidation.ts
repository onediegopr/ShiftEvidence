import { Prisma } from "@prisma/client";
import { INPUT_LIMITS, normalizeOptionalTextInput, normalizeRequiredTextInput } from "../validation/inputLimits";

export const LICENSING_PRICING_VENDORS = ["vmware", "proxmox"] as const;
export const LICENSING_PRICING_STATUSES = ["draft", "pending_review", "approved", "rejected", "archived"] as const;
export const LICENSING_PRICING_SOURCE_TYPES = ["official", "manual_admin", "market_estimate", "placeholder"] as const;
export const LICENSING_PRICING_METRICS = ["core", "socket", "host", "node", "year", "subscription", "manual", "rule"] as const;
export const LICENSING_PRICING_REFRESH_STATUSES = ["running", "completed", "completed_with_warnings", "failed", "no_changes"] as const;

export type LicensingPricingVendor = (typeof LICENSING_PRICING_VENDORS)[number];
export type LicensingPricingSnapshotStatus = (typeof LICENSING_PRICING_STATUSES)[number];
export type LicensingPricingSourceType = (typeof LICENSING_PRICING_SOURCE_TYPES)[number];
export type LicensingPricingMetric = (typeof LICENSING_PRICING_METRICS)[number];
export type LicensingPricingRefreshStatus = (typeof LICENSING_PRICING_REFRESH_STATUSES)[number];

export type LicensingPricingSnapshotItemInput = {
  vendor: unknown;
  productName: unknown;
  edition?: unknown;
  sku?: unknown;
  metric: unknown;
  unitPriceUsd?: unknown;
  minUnits?: unknown;
  termMonths?: unknown;
  assumptionsJson?: Prisma.InputJsonValue | null;
  sourceNote?: unknown;
};

export type LicensingPricingSnapshotInput = {
  vendor: unknown;
  status?: unknown;
  currency?: unknown;
  sourceName: unknown;
  sourceUrl?: unknown;
  sourceType?: unknown;
  lastCheckedAt?: Date | null;
  effectiveDate?: Date | null;
  notesInternal?: unknown;
  metadataJson?: Prisma.InputJsonValue | null;
  items?: LicensingPricingSnapshotItemInput[];
};

const THIRD_PARTY_TERMS = [
  "microsoft",
  "sql server",
  "veeam",
  "antivirus",
  "endpoint security",
  "monitoring",
  "commvault",
  "rubrik",
  "zerto",
  "oracle",
];

function isAllowedValue<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === "string" && allowed.includes(value);
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function integerOrNull(value: unknown, fieldName: string) {
  const parsed = numberOrNull(value);
  if (parsed === null) return null;
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative integer.`);
  }
  return parsed;
}

export function assertNoThirdPartyLicensingText(value: unknown, fieldName = "Pricing text") {
  if (typeof value !== "string" || !value.trim()) return;
  const normalized = value.toLowerCase();
  const matched = THIRD_PARTY_TERMS.find((term) => normalized.includes(term));
  if (matched) {
    throw new Error(`${fieldName} includes third-party licensing (${matched}), which is outside scope.`);
  }
}

export function normalizePricingVendor(value: unknown): LicensingPricingVendor {
  if (!isAllowedValue(value, LICENSING_PRICING_VENDORS)) {
    throw new Error("Pricing vendor must be vmware or proxmox.");
  }
  return value;
}

export function normalizePricingStatus(value: unknown, fallback: LicensingPricingSnapshotStatus = "draft"): LicensingPricingSnapshotStatus {
  if (value === null || value === undefined || value === "") return fallback;
  if (!isAllowedValue(value, LICENSING_PRICING_STATUSES)) {
    throw new Error("Pricing snapshot status is invalid.");
  }
  return value;
}

export function normalizePricingSourceType(value: unknown, fallback: LicensingPricingSourceType = "placeholder"): LicensingPricingSourceType {
  if (value === null || value === undefined || value === "") return fallback;
  if (!isAllowedValue(value, LICENSING_PRICING_SOURCE_TYPES)) {
    throw new Error("Pricing source type is invalid.");
  }
  return value;
}

export function normalizePricingMetric(value: unknown): LicensingPricingMetric {
  if (!isAllowedValue(value, LICENSING_PRICING_METRICS)) {
    throw new Error("Pricing metric is invalid.");
  }
  return value;
}

export function normalizeRefreshStatus(value: unknown, fallback: LicensingPricingRefreshStatus = "running"): LicensingPricingRefreshStatus {
  if (value === null || value === undefined || value === "") return fallback;
  if (!isAllowedValue(value, LICENSING_PRICING_REFRESH_STATUSES)) {
    throw new Error("Pricing refresh status is invalid.");
  }
  return value;
}

export function normalizeUsdCurrency(value: unknown) {
  const currency = typeof value === "string" && value.trim() ? value.trim().toUpperCase() : "USD";
  if (currency !== "USD") {
    throw new Error("Pricing Intelligence only accepts USD.");
  }
  return currency;
}

export function normalizeUsdPrice(value: unknown) {
  const parsed = numberOrNull(value);
  if (parsed === null) return null;
  if (parsed < 0) {
    throw new Error("Unit price in USD cannot be negative.");
  }
  return new Prisma.Decimal(parsed);
}

export function isSnapshotUsableForFinancialCalculations(status: unknown) {
  return status === "approved";
}

export function assertSnapshotUsableForFinancialCalculations(status: unknown) {
  if (!isSnapshotUsableForFinancialCalculations(status)) {
    throw new Error("Only approved pricing snapshots are usable for future financial calculations.");
  }
}

export function assertStoragePricingNotImplemented() {
  throw new Error("Storage cost modeling is in development and must not calculate or affect assessments in COST-1A.");
}

export function validatePricingSnapshotItemInput(input: LicensingPricingSnapshotItemInput, expectedVendor?: LicensingPricingVendor) {
  const vendor = normalizePricingVendor(input.vendor);
  if (expectedVendor && vendor !== expectedVendor) {
    throw new Error("Snapshot item vendor must match the parent snapshot vendor.");
  }

  const productName = normalizeRequiredTextInput(input.productName, "Product name", INPUT_LIMITS.shortText);
  const edition = normalizeOptionalTextInput(input.edition, "Edition", INPUT_LIMITS.shortText);
  const sku = normalizeOptionalTextInput(input.sku, "SKU", INPUT_LIMITS.shortText);
  const metric = normalizePricingMetric(input.metric);
  const unitPriceUsd = normalizeUsdPrice(input.unitPriceUsd);
  const minUnits = integerOrNull(input.minUnits, "Minimum units");
  const termMonths = integerOrNull(input.termMonths, "Term months");
  const sourceNote = normalizeOptionalTextInput(input.sourceNote, "Source note", INPUT_LIMITS.description);

  [productName, edition, sku, sourceNote].forEach((value) => assertNoThirdPartyLicensingText(value));

  return {
    vendor,
    productName,
    edition,
    sku,
    metric,
    unitPriceUsd,
    minUnits,
    termMonths,
    assumptionsJson: input.assumptionsJson ?? Prisma.JsonNull,
    sourceNote,
  };
}

export function validatePricingSnapshotInput(input: LicensingPricingSnapshotInput) {
  const vendor = normalizePricingVendor(input.vendor);
  const status = normalizePricingStatus(input.status);
  const currency = normalizeUsdCurrency(input.currency);
  const sourceName = normalizeRequiredTextInput(input.sourceName, "Source name", INPUT_LIMITS.shortText);
  const sourceUrl = normalizeOptionalTextInput(input.sourceUrl, "Source URL", INPUT_LIMITS.url);
  const sourceType = normalizePricingSourceType(input.sourceType);
  const notesInternal = normalizeOptionalTextInput(input.notesInternal, "Internal notes", INPUT_LIMITS.notes);
  const items = (input.items ?? []).map((item) => validatePricingSnapshotItemInput(item, vendor));

  [sourceName, sourceUrl, notesInternal].forEach((value) => assertNoThirdPartyLicensingText(value));

  return {
    vendor,
    status,
    currency,
    sourceName,
    sourceUrl,
    sourceType,
    lastCheckedAt: input.lastCheckedAt ?? null,
    effectiveDate: input.effectiveDate ?? null,
    notesInternal,
    metadataJson: input.metadataJson ?? Prisma.JsonNull,
    items,
  };
}

export function validateSnapshotCanBeApproved(snapshot: {
  currency: string;
  sourceType: string;
  items: Array<{ unitPriceUsd: unknown; productName: string }>;
}) {
  normalizeUsdCurrency(snapshot.currency);

  if (snapshot.sourceType === "placeholder") {
    throw new Error("Placeholder snapshots cannot be approved. Validate a real manual or official source first.");
  }

  if (snapshot.items.length === 0) {
    throw new Error("At least one pricing item is required before approval.");
  }

  if (!snapshot.items.some((item) => item.unitPriceUsd !== null && item.unitPriceUsd !== undefined)) {
    throw new Error("At least one item must include a USD unit price before approval.");
  }

  snapshot.items.forEach((item) => assertNoThirdPartyLicensingText(item.productName, "Product name"));
}
