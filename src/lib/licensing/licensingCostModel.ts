import {
  BROADCOM_ESCALATION_RATE,
  NORMALIZED_LICENSING_CURRENCY,
  VMWARE_MIN_CORES_PER_SOCKET,
  type CurrencyCode,
  type LicensingPriceItem,
  type MoneyAmount,
  type ProxmoxPricingTier,
  type VmwarePricingTier,
  getLicensingPriceItem,
  listLicensingPriceItems,
} from "./pricingSource";

export type LicensingCalculationInput = {
  hosts: number;
  socketsPerHost: number;
  coresPerSocket: number;
  vmwareTier: VmwarePricingTier;
  proxmoxTier: ProxmoxPricingTier;
  targetCurrency?: CurrencyCode;
  includeVmwareEscalation?: boolean;
  projectionYears?: number[];
  priceOverrides?: {
    vmwareUnitPriceUsd?: number;
    proxmoxUnitPriceUsd?: number;
  };
};

export type LicensingCalculationResult = {
  input: LicensingCalculationInput;
  currency: CurrencyCode;
  vmware: {
    tier: VmwarePricingTier;
    rawCores: number;
    sockets: number;
    minCoresPerSocket: number;
    minimumBillableCores: number;
    billableCores: number;
    annualCost: MoneyAmount;
    monthlyCost: MoneyAmount;
    unitPrice: MoneyAmount;
    breakdown: string[];
    warnings: string[];
  };
  proxmox: {
    selectedTier: ProxmoxPricingTier;
    sockets: number;
    annualCost: MoneyAmount;
    monthlyCost: MoneyAmount;
    unitPrice: MoneyAmount;
    availableTiers: Array<{
      tier: string;
      annualCost: MoneyAmount;
      unitPrice: MoneyAmount;
      originalUnitPrice: MoneyAmount;
    }>;
    breakdown: string[];
    warnings: string[];
  };
  comparison: {
    annualSavings: MoneyAmount;
    threeYearSavings: MoneyAmount;
    savingsPercent: number;
    projections: Array<{
      years: number;
      vmwareCost: MoneyAmount;
      proxmoxCost: MoneyAmount;
      savings: MoneyAmount;
    }>;
  };
  pricingMetadata: LicensingPriceItem[];
  currencyMetadata: {
    targetCurrency: CurrencyCode;
    conversions: NonNullable<LicensingPriceItem["conversion"]>[];
  };
  warnings: string[];
};

function assertPositiveInteger(value: number, fieldName: string) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function money(amount: number, currency: CurrencyCode = NORMALIZED_LICENSING_CURRENCY): MoneyAmount {
  return { amount: roundCurrency(amount), currency };
}

export function calculateVmwareBillableCores(params: {
  hosts: number;
  socketsPerHost: number;
  coresPerSocket: number;
}) {
  assertPositiveInteger(params.hosts, "hosts");
  assertPositiveInteger(params.socketsPerHost, "socketsPerHost");
  assertPositiveInteger(params.coresPerSocket, "coresPerSocket");

  const sockets = params.hosts * params.socketsPerHost;
  const rawCores = sockets * params.coresPerSocket;
  const minimumBillableCores = sockets * VMWARE_MIN_CORES_PER_SOCKET;
  const billableCores = Math.max(rawCores, minimumBillableCores);

  return {
    sockets,
    rawCores,
    minimumBillableCores,
    billableCores,
    minimumApplied: billableCores > rawCores,
  };
}

export function calculateVmwareBillableCoresFromTotals(params: {
  socketCount: number;
  coreCount: number;
}) {
  assertPositiveInteger(params.socketCount, "socketCount");
  assertPositiveInteger(params.coreCount, "coreCount");

  const minimumBillableCores = params.socketCount * VMWARE_MIN_CORES_PER_SOCKET;
  const billableCores = Math.max(params.coreCount, minimumBillableCores);

  return {
    sockets: params.socketCount,
    rawCores: params.coreCount,
    minimumBillableCores,
    billableCores,
    minimumApplied: billableCores > params.coreCount,
  };
}

function scenarioFactor(years: number, escalationRate: number) {
  return Array.from({ length: years }, (_, index) => (1 + escalationRate) ** index)
    .reduce((sum, factor) => sum + factor, 0);
}

export function calculateLicensingComparison(input: LicensingCalculationInput): LicensingCalculationResult {
  const targetCurrency = input.targetCurrency ?? NORMALIZED_LICENSING_CURRENCY;
  if (targetCurrency !== NORMALIZED_LICENSING_CURRENCY) {
    throw new Error(`Only ${NORMALIZED_LICENSING_CURRENCY} calculations are currently supported.`);
  }

  const vmwarePrice = getLicensingPriceItem("vmware", input.vmwareTier);
  const proxmoxPrice = getLicensingPriceItem("proxmox", input.proxmoxTier);
  if (!vmwarePrice) throw new Error(`Unknown VMware tier: ${input.vmwareTier}.`);
  if (!proxmoxPrice) throw new Error(`Unknown Proxmox tier: ${input.proxmoxTier}.`);

  const vmwareUnits = calculateVmwareBillableCores(input);
  const proxmoxSockets = input.hosts * input.socketsPerHost;
  const vmwareUnitPrice = input.priceOverrides?.vmwareUnitPriceUsd ?? vmwarePrice.normalizedUnitPrice.amount;
  const proxmoxUnitPrice = input.priceOverrides?.proxmoxUnitPriceUsd ?? proxmoxPrice.normalizedUnitPrice.amount;
  const vmwareAnnual = vmwareUnits.billableCores * vmwareUnitPrice;
  const proxmoxAnnual = proxmoxSockets * proxmoxUnitPrice;
  const annualSavings = vmwareAnnual - proxmoxAnnual;
  const projectionYears = input.projectionYears ?? [3, 5];
  const vmwareEscalationRate = input.includeVmwareEscalation ? BROADCOM_ESCALATION_RATE : 0;

  const availableTiers = listLicensingPriceItems("proxmox").map((item) => ({
    tier: item.tier,
    annualCost: money(proxmoxSockets * item.normalizedUnitPrice.amount, targetCurrency),
    unitPrice: item.normalizedUnitPrice,
    originalUnitPrice: item.unitPrice,
  }));

  const projections = projectionYears.map((years) => {
    const vmwareCost = vmwareAnnual * scenarioFactor(years, vmwareEscalationRate);
    const proxmoxCost = proxmoxAnnual * years;
    return {
      years,
      vmwareCost: money(vmwareCost, targetCurrency),
      proxmoxCost: money(proxmoxCost, targetCurrency),
      savings: money(vmwareCost - proxmoxCost, targetCurrency),
    };
  });

  const warnings = [
    ...(vmwareUnits.minimumApplied ? ["VMware minimum 16 cores per socket applied."] : []),
    ...(input.priceOverrides?.vmwareUnitPriceUsd ? ["VMware unit price is a user override."] : []),
    ...(input.priceOverrides?.proxmoxUnitPriceUsd ? ["Proxmox unit price is a user override."] : []),
  ];

  return {
    input,
    currency: targetCurrency,
    vmware: {
      tier: input.vmwareTier,
      rawCores: vmwareUnits.rawCores,
      sockets: vmwareUnits.sockets,
      minCoresPerSocket: VMWARE_MIN_CORES_PER_SOCKET,
      minimumBillableCores: vmwareUnits.minimumBillableCores,
      billableCores: vmwareUnits.billableCores,
      annualCost: money(vmwareAnnual, targetCurrency),
      monthlyCost: money(vmwareAnnual / 12, targetCurrency),
      unitPrice: money(vmwareUnitPrice, targetCurrency),
      breakdown: [
        `${input.hosts} host(s) x ${input.socketsPerHost} socket(s) = ${vmwareUnits.sockets} sockets.`,
        `${vmwareUnits.sockets} socket(s) x ${input.coresPerSocket} core(s) = ${vmwareUnits.rawCores} raw cores.`,
        `Billable cores = max(${vmwareUnits.rawCores}, ${vmwareUnits.minimumBillableCores}) = ${vmwareUnits.billableCores}.`,
      ],
      warnings: vmwareUnits.minimumApplied ? ["VMware minimum 16 cores per socket applied."] : [],
    },
    proxmox: {
      selectedTier: input.proxmoxTier,
      sockets: proxmoxSockets,
      annualCost: money(proxmoxAnnual, targetCurrency),
      monthlyCost: money(proxmoxAnnual / 12, targetCurrency),
      unitPrice: money(proxmoxUnitPrice, targetCurrency),
      availableTiers,
      breakdown: [
        `${input.hosts} host(s) x ${input.socketsPerHost} socket(s) = ${proxmoxSockets} subscription sockets.`,
        `Annual cost = ${proxmoxSockets} socket(s) x ${roundCurrency(proxmoxUnitPrice)} ${targetCurrency}.`,
      ],
      warnings: [],
    },
    comparison: {
      annualSavings: money(annualSavings, targetCurrency),
      threeYearSavings: projections.find((item) => item.years === 3)?.savings ?? money(annualSavings * 3, targetCurrency),
      savingsPercent: vmwareAnnual > 0 ? roundCurrency((annualSavings / vmwareAnnual) * 100) : 0,
      projections,
    },
    pricingMetadata: [vmwarePrice, proxmoxPrice],
    currencyMetadata: {
      targetCurrency,
      conversions: [vmwarePrice.conversion, proxmoxPrice.conversion].filter(
        (item): item is NonNullable<LicensingPriceItem["conversion"]> => Boolean(item),
      ),
    },
    warnings,
  };
}
