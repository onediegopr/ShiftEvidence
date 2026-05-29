import type {
  ApprovedPricingItem,
  ApprovedPricingSnapshot,
  ContractTimingRisk,
  ExecutiveRecommendation,
  FinancialConfidenceInput,
  LicensingAnalysisInput,
  LicensingAnalysisResult,
  LicensingComparisonResult,
  LicensingCostScenario,
  LicensingTrap,
  MissingFinancialEvidence,
  PricingFreshnessStatus,
  SavingsQuality,
} from "./licensingCostExposureTypes";

function roundCurrency(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null;
  return Math.round(value * 100) / 100;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scenarioTotals(annualUsd: number | null, includeEscalation = false) {
  const factor3Y = includeEscalation ? 1 + 1.1 + 1.21 : 3;
  const factor5Y = includeEscalation ? 1 + 1.1 + 1.21 + 1.331 + 1.4641 : 5;
  return {
    annualUsd: roundCurrency(annualUsd),
    threeYearUsd: annualUsd === null ? null : roundCurrency(annualUsd * factor3Y),
    fiveYearUsd: annualUsd === null ? null : roundCurrency(annualUsd * factor5Y),
  };
}

function confidenceLabel(score: number) {
  if (score >= 80) return "High";
  if (score >= 60) return "Medium";
  if (score >= 40) return "Limited";
  return "Low";
}

export function calculateFinancialConfidence(input: FinancialConfidenceInput) {
  if (input.mode === "skipped") {
    return { score: null, label: null };
  }

  let score = 0;
  if (input.hasCustomerActualCost) score += 25;
  if (input.hasRenewalQuote) score += 20;
  if (input.hasContract) score += 5;
  if (input.hasApprovedVmwarePricingSnapshot) score += 15;
  if (input.hasApprovedProxmoxPricingSnapshot) score += 15;
  if (input.hasDetectedHostCount && (input.hasDetectedSocketCount || input.hasDetectedCoreCount)) score += 10;
  if (input.hasRenewalDate) score += 5;
  if (input.hasProxmoxTargetSizing) score += 5;
  if (input.hasMigrationInvestmentEstimate) score += 5;

  if (input.pricingFreshnessStatus === "stale") score -= 10;
  if (input.pricingFreshnessStatus === "missing") score -= 15;
  if (input.mode === "broad_scenarios") score -= 15;
  if (input.mode === "estimated_from_environment" && !input.hasApprovedVmwarePricingSnapshot) score -= 10;

  const normalized = clampScore(score);
  return {
    score: normalized,
    label: confidenceLabel(normalized),
  };
}

function annualizeItem(item: ApprovedPricingItem, counts: {
  hostCount: number | null;
  socketCount: number | null;
  coreCount: number | null;
}) {
  if (item.unitPriceUsd === null) return null;

  let units: number | null = null;
  if (item.metric === "core") units = counts.coreCount;
  if (item.metric === "socket") units = counts.socketCount;
  if (item.metric === "host" || item.metric === "node") units = counts.hostCount;
  if (item.metric === "year" || item.metric === "subscription" || item.metric === "manual" || item.metric === "rule") {
    units = item.minUnits ?? 1;
  }

  if (units === null || units <= 0) return null;
  const termMonths = item.termMonths && item.termMonths > 0 ? item.termMonths : 12;
  return roundCurrency(item.unitPriceUsd * units * (12 / termMonths));
}

function itemAssumptions(item: ApprovedPricingItem, annualUsd: number | null) {
  const assumptions = [
    `Pricing item: ${item.productName}${item.edition ? ` (${item.edition})` : ""}.`,
    `Metric: ${item.metric}.`,
  ];

  if (item.termMonths) {
    assumptions.push(`Term normalized from ${item.termMonths} months to annual USD.`);
  }

  if (annualUsd === null) {
    assumptions.push("The item could not be annualized from available assessment counts.");
  }

  return assumptions;
}

function scenarioFromAnnual(params: {
  label: string;
  annualUsd: number | null;
  source: LicensingCostScenario["source"];
  confidence: LicensingCostScenario["confidence"];
  assumptions: string[];
  warnings?: string[];
  includeEscalation?: boolean;
}): LicensingCostScenario {
  const assumptions = [...params.assumptions];
  if (params.includeEscalation && params.annualUsd !== null) {
    assumptions.push("VMware 3-Year and 5-Year estimates include 10% YoY Broadcom price escalation.");
  }
  return {
    label: params.label,
    source: params.source,
    confidence: params.confidence,
    ...scenarioTotals(params.annualUsd, params.includeEscalation),
    assumptions,
    warnings: params.warnings ?? [],
  };
}

function scenariosFromSnapshots(params: {
  snapshots: ApprovedPricingSnapshot[];
  labelPrefix: string;
  counts: { hostCount: number | null; socketCount: number | null; coreCount: number | null };
  includeEscalation?: boolean;
}) {
  const pricedItems = params.snapshots
    .flatMap((snapshot) =>
      snapshot.items.map((item) => ({
        item,
        snapshot,
        annualUsd: annualizeItem(item, params.counts),
      })),
    )
    .filter((entry) => entry.annualUsd !== null)
    .sort((a, b) => Number(a.annualUsd) - Number(b.annualUsd));

  if (pricedItems.length === 0) {
    return { low: null, mid: null, high: null };
  }

  const low = pricedItems[0];
  const high = pricedItems[pricedItems.length - 1];
  const mid = pricedItems[Math.floor((pricedItems.length - 1) / 2)];

  const build = (entry: typeof pricedItems[number], label: string) =>
    scenarioFromAnnual({
      label,
      annualUsd: entry.annualUsd,
      source: "approved_pricing_snapshot",
      confidence: "medium",
      assumptions: [
        ...itemAssumptions(entry.item, entry.annualUsd),
        `Snapshot source: ${entry.snapshot.sourceName}.`,
      ],
      warnings: entry.snapshot.lastCheckedAt ? [] : ["Approved snapshot has no last checked date."],
      includeEscalation: params.includeEscalation,
    });

  return {
    low: build(low, `${params.labelPrefix} low`),
    mid: build(mid, `${params.labelPrefix} mid`),
    high: build(high, `${params.labelPrefix} high`),
  };
}

function buildVmwareScenarios(input: LicensingAnalysisInput) {
  if (input.annualVmwareCostUsd !== null) {
    const customerScenario = scenarioFromAnnual({
      label: "VMware/Broadcom current or renewal cost",
      annualUsd: input.annualVmwareCostUsd,
      source: "customer_provided",
      confidence: input.hasRenewalQuote ? "high" : "medium",
      assumptions: [
        "Customer-provided annual VMware/Broadcom cost is used as the primary scenario.",
        "The engine does not replace customer contract data with benchmark pricing.",
      ],
      warnings: input.hasRenewalQuote ? [] : ["No renewal quote was marked as available."],
      includeEscalation: input.includeEscalation,
    });

    return {
      low: customerScenario,
      mid: customerScenario,
      high: customerScenario,
    };
  }

  const snapshotScenarios = scenariosFromSnapshots({
    snapshots: input.approvedVmwareSnapshots,
    labelPrefix: "VMware/Broadcom approved snapshot",
    counts: {
      hostCount: input.hostCount,
      socketCount: input.socketCount,
      coreCount: input.coreCount,
    },
    includeEscalation: input.includeEscalation,
  });

  if (snapshotScenarios.mid) return snapshotScenarios;

  return {
    low: null,
    mid: scenarioFromAnnual({
      label: "VMware/Broadcom scenario unavailable",
      annualUsd: null,
      source: "missing",
      confidence: "unknown",
      assumptions: [],
      warnings: ["No customer cost or usable approved VMware/Broadcom pricing snapshot is available."],
      includeEscalation: input.includeEscalation,
    }),
    high: null,
  };
}

function buildProxmoxScenarios(input: LicensingAnalysisInput) {
  const community = scenarioFromAnnual({
    label: "Proxmox community / no subscription",
    annualUsd: 0,
    source: "broad_scenario",
    confidence: "limited",
    assumptions: ["No Proxmox subscription cost is modeled for this community-only scenario."],
    warnings: ["Do not compare VMware enterprise support against Proxmox community-only as the primary decision basis."],
  });

  if (input.estimatedProxmoxCostUsd !== null) {
    const supported = scenarioFromAnnual({
      label: "Proxmox customer-provided subscription estimate",
      annualUsd: input.estimatedProxmoxCostUsd,
      source: "customer_provided",
      confidence: "medium",
      assumptions: ["Customer-provided Proxmox annual subscription estimate is used."],
      warnings: ["Final pricing must be validated with the vendor, reseller or procurement channel."],
    });
    return {
      community,
      supported,
      premium: null,
    };
  }

  const snapshotScenarios = scenariosFromSnapshots({
    snapshots: input.approvedProxmoxSnapshots,
    labelPrefix: "Proxmox approved snapshot",
    counts: {
      hostCount: input.hostCount,
      socketCount: input.socketCount,
      coreCount: input.coreCount,
    },
  });

  return {
    community,
    supported: snapshotScenarios.low ?? null,
    premium: snapshotScenarios.high && snapshotScenarios.high.annualUsd !== snapshotScenarios.low?.annualUsd ? snapshotScenarios.high : null,
  };
}

function bestScenarioValue(scenario: LicensingCostScenario | null) {
  return scenario?.annualUsd ?? null;
}

function buildComparison(params: {
  vmware: ReturnType<typeof buildVmwareScenarios>;
  proxmox: ReturnType<typeof buildProxmoxScenarios>;
  migrationInvestmentEstimateUsd: number | null;
}): LicensingComparisonResult {
  const vmwareAnnual = bestScenarioValue(params.vmware.mid);
  const proxmoxAnnual = bestScenarioValue(params.proxmox.supported) ?? bestScenarioValue(params.proxmox.premium);
  const netDeltaAnnual = vmwareAnnual !== null && proxmoxAnnual !== null ? roundCurrency(vmwareAnnual - proxmoxAnnual) : null;

  const vmware3Y = params.vmware.mid?.threeYearUsd ?? null;
  const proxmox3Y = params.proxmox.supported?.threeYearUsd ?? params.proxmox.premium?.threeYearUsd ?? null;
  const netDeltaThreeYear = vmware3Y !== null && proxmox3Y !== null ? roundCurrency(vmware3Y - proxmox3Y) : null;

  const vmware5Y = params.vmware.mid?.fiveYearUsd ?? null;
  const proxmox5Y = params.proxmox.supported?.fiveYearUsd ?? params.proxmox.premium?.fiveYearUsd ?? null;
  const netDeltaFiveYear = vmware5Y !== null && proxmox5Y !== null ? roundCurrency(vmware5Y - proxmox5Y) : null;
  const grossSavingsPercent =
    vmwareAnnual && vmwareAnnual > 0 && netDeltaAnnual !== null
      ? Math.round((netDeltaAnnual / vmwareAnnual) * 1000) / 10
      : null;
  const paybackMonths =
    params.migrationInvestmentEstimateUsd !== null && netDeltaAnnual !== null && netDeltaAnnual > 0
      ? Math.ceil((params.migrationInvestmentEstimateUsd / netDeltaAnnual) * 12)
      : null;

  const riskAdjustedNotes = [
    netDeltaAnnual === null ? "Savings cannot be quantified until both VMware and Proxmox annual scenarios are available." : null,
    params.proxmox.supported === null ? "Supported Proxmox scenario is missing; community-only comparison is not sufficient for enterprise decisions." : null,
    params.migrationInvestmentEstimateUsd === null ? "Migration investment is missing, so payback and net business case quality are limited." : null,
  ].filter((item): item is string => Boolean(item));

  return {
    vmwareLow: params.vmware.low,
    vmwareMid: params.vmware.mid,
    vmwareHigh: params.vmware.high,
    proxmoxCommunity: params.proxmox.community,
    proxmoxSupported: params.proxmox.supported,
    proxmoxPremium: params.proxmox.premium,
    netDeltaAnnual,
    netDeltaThreeYear,
    netDeltaFiveYear,
    paybackMonths,
    grossSavingsPercent,
    riskAdjustedNotes,
  };
}

function buildMissingEvidence(input: LicensingAnalysisInput): MissingFinancialEvidence[] {
  const missing: Array<MissingFinancialEvidence | null> = [
    !input.hasContract
      ? {
          key: "vmware_contract",
          label: "VMware/Broadcom contract",
          impact: "Contract terms, bundles and rights may be misunderstood.",
          recommendation: "Collect the active contract or entitlement summary.",
        }
      : null,
    !input.hasRenewalQuote
      ? {
          key: "renewal_quote",
          label: "Renewal quote",
          impact: "Renewal exposure may be directional instead of procurement-grade.",
          recommendation: "Request a current renewal quote before making a financial decision.",
        }
      : null,
    !input.renewalDate
      ? {
          key: "renewal_date",
          label: "Renewal date",
          impact: "Contract timing risk cannot be assessed precisely.",
          recommendation: "Capture the renewal or expiration date.",
        }
      : null,
    input.hostCount === null
      ? {
          key: "host_count",
          label: "Host count",
          impact: "Host or node-based subscription estimates cannot be validated.",
          recommendation: "Upload RVTools or enter host count in manual infrastructure intake.",
        }
      : null,
    input.socketCount === null
      ? {
          key: "socket_count",
          label: "Socket count",
          impact: "Socket-based VMware exposure cannot be estimated from environment.",
          recommendation: "Confirm socket count from inventory or contract data.",
        }
      : null,
    input.coreCount === null
      ? {
          key: "core_count",
          label: "Core count",
          impact: "Core-based VMware/Broadcom pricing scenarios cannot be annualized.",
          recommendation: "Confirm core count from RVTools or host inventory.",
        }
      : null,
    !input.selectedProxmoxSupportScenario || input.selectedProxmoxSupportScenario === "not_sure"
      ? {
          key: "proxmox_support_tier",
          label: "Proxmox support tier",
          impact: "Supported Proxmox comparison may be incomplete.",
          recommendation: "Select a support scenario or validate the target subscription tier.",
        }
      : null,
    input.migrationInvestmentEstimateUsd === null
      ? {
          key: "migration_investment",
          label: "Migration investment",
          impact: "Payback and net savings quality remain limited.",
          recommendation: "Estimate migration services, internal labor and contingency in USD.",
        }
      : null,
    input.approvedVmwareSnapshots.length === 0
      ? {
          key: "approved_vmware_pricing_snapshot",
          label: "Approved VMware/Broadcom pricing snapshot",
          impact: "Environment-based VMware estimates cannot use approved pricing data.",
          recommendation: "Approve a validated VMware/Broadcom pricing snapshot in admin.",
        }
      : null,
    input.approvedProxmoxSnapshots.length === 0
      ? {
          key: "approved_proxmox_pricing_snapshot",
          label: "Approved Proxmox pricing snapshot",
          impact: "Supported Proxmox scenarios cannot use approved pricing data.",
          recommendation: "Approve a validated Proxmox pricing snapshot in admin.",
        }
      : null,
  ];

  return missing.filter((item): item is MissingFinancialEvidence => Boolean(item));
}

function buildContractTimingRisk(input: LicensingAnalysisInput): ContractTimingRisk {
  if (!input.renewalDate) {
    return {
      label: "Unknown",
      daysToRenewal: null,
      severity: "unknown",
      recommendation: "Collect renewal date before using timing as a decision factor.",
    };
  }

  const now = new Date();
  const renewalDate = new Date(input.renewalDate);
  const daysToRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / 86_400_000);

  if (!Number.isFinite(daysToRenewal)) {
    return {
      label: "Unknown",
      daysToRenewal: null,
      severity: "unknown",
      recommendation: "Validate renewal date format.",
    };
  }

  if (daysToRenewal < 90) {
    return {
      label: "Critical",
      daysToRenewal,
      severity: "critical",
      recommendation: "Negotiate bridge renewal while running a controlled pilot.",
    };
  }

  if (daysToRenewal < 180) {
    return {
      label: "High",
      daysToRenewal,
      severity: "high",
      recommendation: "Collect renewal quote and validate a supported Proxmox scenario immediately.",
    };
  }

  if (daysToRenewal < 365) {
    return {
      label: "Medium",
      daysToRenewal,
      severity: "medium",
      recommendation: "Use the remaining window for pilot, sizing and procurement validation.",
    };
  }

  return {
    label: "Low",
    daysToRenewal,
    severity: "low",
    recommendation: "Use the available time to build a staged financial and technical roadmap.",
  };
}

function buildSavingsQuality(input: LicensingAnalysisInput, comparison: LicensingComparisonResult): SavingsQuality {
  const reasons: string[] = [];
  const hasBothSupportedScenarios = Boolean(comparison.vmwareMid?.annualUsd !== null && comparison.proxmoxSupported?.annualUsd !== null);
  const hasStrongInputs =
    input.annualVmwareCostUsd !== null &&
    input.hasRenewalQuote &&
    input.approvedProxmoxSnapshots.length > 0 &&
    input.selectedProxmoxSupportScenario !== null &&
    input.selectedProxmoxSupportScenario !== "not_sure" &&
    input.migrationInvestmentEstimateUsd !== null;

  if (hasStrongInputs) {
    reasons.push("Customer cost or quote, approved pricing and migration investment are available.");
    return { value: "high", reasons };
  }

  if (hasBothSupportedScenarios && input.approvedProxmoxSnapshots.length > 0) {
    reasons.push("Supported annual scenarios are available, but some procurement or migration inputs are missing.");
    if (input.migrationInvestmentEstimateUsd === null) reasons.push("Migration investment is missing.");
    if (!input.hasRenewalQuote) reasons.push("Renewal quote is missing.");
    return { value: "medium", reasons };
  }

  if (input.mode === "broad_scenarios" || input.annualVmwareCostUsd === null || input.approvedProxmoxSnapshots.length === 0) {
    reasons.push("The analysis relies on broad scenarios or lacks approved pricing data.");
    return { value: "low", reasons };
  }

  reasons.push("Not enough financial evidence is available to assess savings quality.");
  return { value: "unknown", reasons };
}

function buildLicensingTraps(params: {
  input: LicensingAnalysisInput;
  comparison: LicensingComparisonResult;
  timingRisk: ContractTimingRisk;
  confidenceScore: number | null;
}) {
  const traps: LicensingTrap[] = [];

  if (!params.input.hasContract || !params.input.hasRenewalQuote) {
    traps.push({
      severity: "high",
      title: "Potential exposure: missing contract or renewal quote",
      description: "The analysis cannot confirm bundle terms, renewal uplift or discount structure.",
      evidence: [
        `Contract available: ${params.input.hasContract ? "yes" : "no"}`,
        `Renewal quote available: ${params.input.hasRenewalQuote ? "yes" : "no"}`,
      ],
      recommendation: "Collect the active contract and renewal quote before using savings as a primary decision driver.",
    });
  }

  if (params.input.approvedVmwareSnapshots.length === 0 || params.input.approvedProxmoxSnapshots.length === 0) {
    traps.push({
      severity: "medium",
      title: "Potential exposure: missing approved pricing snapshot",
      description: "One or both sides of the comparison lack approved pricing data.",
      evidence: [
        `Approved VMware/Broadcom snapshots: ${params.input.approvedVmwareSnapshots.length}`,
        `Approved Proxmox snapshots: ${params.input.approvedProxmoxSnapshots.length}`,
      ],
      recommendation: "Approve validated pricing snapshots in admin before presenting precise financial conclusions.",
    });
  }

  if (params.comparison.proxmoxSupported === null && params.comparison.proxmoxCommunity !== null) {
    traps.push({
      severity: "medium",
      title: "Potential exposure: community-only Proxmox comparison",
      description: "Comparing VMware enterprise support against Proxmox community-only can overstate savings.",
      evidence: ["Supported Proxmox scenario is missing."],
      recommendation: "Compare at least one supported Proxmox subscription scenario.",
    });
  }

  if (params.input.hostCount !== null && params.input.vmCount !== null && params.input.hostCount > 0 && params.input.vmCount / params.input.hostCount < 8) {
    traps.push({
      severity: "low",
      title: "Potential exposure: low VM density per host",
      description: "Low density may make host, socket or core-based licensing less favorable.",
      evidence: [`VMs per host: ${(params.input.vmCount / params.input.hostCount).toFixed(1)}`],
      recommendation: "Review consolidation, host sizing and target cluster design before finalizing savings.",
    });
  }

  if (params.timingRisk.severity === "critical" || params.timingRisk.severity === "high") {
    traps.push({
      severity: params.timingRisk.severity,
      title: "Potential exposure: renewal window is tight",
      description: "A short renewal window can force a rushed contract decision.",
      evidence: [`Days to renewal: ${params.timingRisk.daysToRenewal ?? "unknown"}`],
      recommendation: params.timingRisk.recommendation,
    });
  }

  if (params.input.migrationInvestmentEstimateUsd === null) {
    traps.push({
      severity: "medium",
      title: "Potential exposure: migration investment missing",
      description: "Gross savings can be misleading without migration services, internal labor and contingency.",
      evidence: ["Migration investment estimate is missing."],
      recommendation: "Add a USD migration investment estimate before calculating payback.",
    });
  }

  if (params.input.mode === "broad_scenarios" || (params.confidenceScore !== null && params.confidenceScore < 40)) {
    traps.push({
      severity: "medium",
      title: "Potential exposure: broad scenarios only",
      description: "The current result is directional and should not be treated as a procurement-grade business case.",
      evidence: [`Mode: ${params.input.mode}`, `Financial confidence: ${params.confidenceScore ?? "not calculated"}`],
      recommendation: "Collect missing financial evidence and rerun the analysis.",
    });
  }

  if (params.input.pricingFreshnessStatus === "stale") {
    traps.push({
      severity: "medium",
      title: "Potential exposure: stale pricing snapshot",
      description: "Approved pricing exists but may be outdated.",
      evidence: ["Pricing freshness status is stale."],
      recommendation: "Refresh and re-approve pricing snapshots before executive presentation.",
    });
  }

  return traps;
}

function buildExecutiveRecommendation(params: {
  input: LicensingAnalysisInput;
  confidenceScore: number | null;
  comparison: LicensingComparisonResult;
  timingRisk: ContractTimingRisk;
  savingsQuality: SavingsQuality;
}): ExecutiveRecommendation {
  if (!params.input.hasRenewalQuote) {
    return {
      code: "collect_renewal_quote",
      title: "Collect the renewal quote first",
      description: "Do not use savings as the primary driver until the current VMware/Broadcom renewal exposure is validated.",
    };
  }

  if (params.timingRisk.severity === "critical" || params.timingRisk.severity === "high") {
    return {
      code: "negotiate_bridge_renewal",
      title: "Negotiate a bridge renewal while validating migration",
      description: "The renewal window is tight, so the safest path is parallel procurement validation and a controlled pilot.",
    };
  }

  if (params.comparison.proxmoxSupported === null) {
    return {
      code: "compare_supported_proxmox_scenario",
      title: "Compare against a supported Proxmox scenario",
      description: "Community-only comparisons are not enough for an enterprise financial decision.",
    };
  }

  if ((params.confidenceScore ?? 0) < 50 || params.savingsQuality.value === "low" || params.savingsQuality.value === "unknown") {
    return {
      code: "do_not_use_savings_primary_driver",
      title: "Do not use savings as the primary driver yet",
      description: "Financial evidence is still limited. Treat the analysis as directional until missing evidence is closed.",
    };
  }

  if (params.comparison.netDeltaThreeYear !== null && params.comparison.netDeltaThreeYear > 0) {
    return {
      code: "proceed_to_blueprint",
      title: "Proceed to a migration blueprint and financial review",
      description: "The evidence supports a structured blueprint phase with procurement validation and target sizing.",
    };
  }

  return {
    code: "run_pilot_first",
    title: "Run a controlled pilot first",
    description: "Validate operational fit and target support tier before making a broad financial commitment.",
  };
}

function buildCostOfStaying(params: {
  vmwareAnnual: number | null;
  comparison: LicensingComparisonResult;
}) {
  const threeYearRenewalUsd = params.comparison.vmwareMid?.threeYearUsd ?? (params.vmwareAnnual === null ? null : roundCurrency(params.vmwareAnnual * 3));
  const fiveYearRenewalUsd = params.comparison.vmwareMid?.fiveYearUsd ?? (params.vmwareAnnual === null ? null : roundCurrency(params.vmwareAnnual * 5));
  return {
    annualRenewalUsd: roundCurrency(params.vmwareAnnual),
    threeYearRenewalUsd,
    fiveYearRenewalUsd,
    opportunityLossThreeYearUsd:
      params.comparison.netDeltaThreeYear !== null && params.comparison.netDeltaThreeYear > 0
        ? params.comparison.netDeltaThreeYear
        : null,
    notes: [
      params.vmwareAnnual === null
        ? "Cost of staying cannot be quantified without customer cost, renewal quote or usable approved VMware pricing."
        : "Cost of staying uses the selected VMware/Broadcom annual scenario.",
      "This is not a vendor quote and must be validated with procurement.",
    ],
  };
}

function snapshotRefs(input: LicensingAnalysisInput) {
  return [...input.approvedVmwareSnapshots, ...input.approvedProxmoxSnapshots].map((snapshot) => ({
    snapshotId: snapshot.snapshotId,
    vendor: snapshot.vendor,
    sourceName: snapshot.sourceName,
    sourceType: snapshot.sourceType,
    lastCheckedAt: snapshot.lastCheckedAt,
    approvedAt: snapshot.approvedAt,
    itemCount: snapshot.itemCount,
  }));
}

function statusFromResult(params: {
  input: LicensingAnalysisInput;
  confidenceScore: number | null;
  missingEvidence: MissingFinancialEvidence[];
}) {
  if (params.input.mode === "skipped") return "not_included" as const;
  if (params.input.pricingFreshnessStatus === "stale") return "stale_pricing" as const;
  if (params.confidenceScore === null) return "needs_input" as const;
  if (params.confidenceScore < 40 || params.missingEvidence.some((item) => item.key.includes("pricing_snapshot"))) {
    return "needs_input" as const;
  }
  return "completed" as const;
}

export function runLicensingCostExposureAnalysis(input: LicensingAnalysisInput): LicensingAnalysisResult {
  if (input.mode === "skipped") {
    const skippedRecommendation: ExecutiveRecommendation = {
      code: "do_not_use_savings_primary_driver",
      title: "Licensing analysis was skipped",
      description: "No financial analysis was generated because the module was intentionally skipped.",
    };

    return {
      status: "not_included",
      mode: "skipped",
      currency: "USD",
      financialConfidenceScore: null,
      financialConfidenceLabel: null,
      savingsQuality: { value: "unknown", reasons: ["The licensing module was skipped."] },
      pricingFreshnessStatus: input.pricingFreshnessStatus,
      vmwareScenarios: { low: null, mid: null, high: null },
      proxmoxScenarios: { community: null, supported: null, premium: null },
      comparison: {
        vmwareLow: null,
        vmwareMid: null,
        vmwareHigh: null,
        proxmoxCommunity: null,
        proxmoxSupported: null,
        proxmoxPremium: null,
        netDeltaAnnual: null,
        netDeltaThreeYear: null,
        netDeltaFiveYear: null,
        paybackMonths: null,
        grossSavingsPercent: null,
        riskAdjustedNotes: ["Licensing analysis was skipped."],
      },
      costOfStaying: {
        annualRenewalUsd: null,
        threeYearRenewalUsd: null,
        fiveYearRenewalUsd: null,
        opportunityLossThreeYearUsd: null,
        notes: ["Licensing analysis was skipped."],
      },
      contractTimingRisk: {
        label: "Unknown",
        daysToRenewal: null,
        severity: "unknown",
        recommendation: "No timing risk was calculated because the module was skipped.",
      },
      licensingTraps: [],
      missingEvidence: [],
      assumptions: ["Licensing analysis was skipped by the user."],
      pricingSnapshotRefs: [],
      executiveRecommendation: skippedRecommendation,
      generatedAt: null,
    };
  }

  const vmwareScenarios = buildVmwareScenarios(input);
  const proxmoxScenarios = buildProxmoxScenarios(input);
  const comparison = buildComparison({
    vmware: vmwareScenarios,
    proxmox: proxmoxScenarios,
    migrationInvestmentEstimateUsd: input.migrationInvestmentEstimateUsd,
  });
  const missingEvidence = buildMissingEvidence(input);
  const confidence = calculateFinancialConfidence({
    hasCustomerActualCost: input.annualVmwareCostUsd !== null,
    hasRenewalQuote: input.hasRenewalQuote,
    hasContract: input.hasContract,
    hasApprovedVmwarePricingSnapshot: input.approvedVmwareSnapshots.length > 0,
    hasApprovedProxmoxPricingSnapshot: input.approvedProxmoxSnapshots.length > 0,
    hasDetectedHostCount: input.hostCount !== null,
    hasDetectedSocketCount: input.socketCount !== null,
    hasDetectedCoreCount: input.coreCount !== null,
    hasRenewalDate: Boolean(input.renewalDate),
    hasProxmoxTargetSizing: Boolean(input.selectedProxmoxSupportScenario && input.selectedProxmoxSupportScenario !== "not_sure"),
    hasMigrationInvestmentEstimate: input.migrationInvestmentEstimateUsd !== null,
    pricingFreshnessStatus: input.pricingFreshnessStatus,
    mode: input.mode,
  });
  const savingsQuality = buildSavingsQuality(input, comparison);
  const timingRisk = buildContractTimingRisk(input);
  const licensingTraps = buildLicensingTraps({
    input,
    comparison,
    timingRisk,
    confidenceScore: confidence.score,
  });
  const executiveRecommendation = buildExecutiveRecommendation({
    input,
    confidenceScore: confidence.score,
    comparison,
    timingRisk,
    savingsQuality,
  });
  const status = statusFromResult({
    input,
    confidenceScore: confidence.score,
    missingEvidence,
  });
  const vmwareAnnual = comparison.vmwareMid?.annualUsd ?? null;

  return {
    status,
    mode: input.mode,
    currency: "USD",
    financialConfidenceScore: confidence.score,
    financialConfidenceLabel: confidence.label,
    savingsQuality,
    pricingFreshnessStatus: input.pricingFreshnessStatus,
    vmwareScenarios,
    proxmoxScenarios,
    comparison,
    costOfStaying: buildCostOfStaying({ vmwareAnnual, comparison }),
    contractTimingRisk: timingRisk,
    licensingTraps,
    missingEvidence,
    assumptions: [
      "All financial values are modeled in USD.",
      "Only approved pricing snapshots are considered.",
      "This analysis is not a vendor quote.",
      input.mode === "actual_costs" ? "Customer-provided cost takes precedence over benchmark pricing." : null,
      input.mode === "broad_scenarios" ? "Broad scenarios are directional and low-confidence by design." : null,
      input.includeEscalation ? "VMware 3-Year and 5-Year estimates include 10% YoY Broadcom price escalation." : null,
      "Storage cost modeling is still in development and is not included.",
    ].filter((item): item is string => Boolean(item)),
    pricingSnapshotRefs: snapshotRefs(input),
    executiveRecommendation,
    generatedAt: new Date().toISOString(),
  };
}

export function summarizePricingFreshness(params: {
  vmwareSnapshots: ApprovedPricingSnapshot[];
  proxmoxSnapshots: ApprovedPricingSnapshot[];
  now?: Date;
  staleAfterDays?: number;
}): PricingFreshnessStatus {
  const snapshots = [...params.vmwareSnapshots, ...params.proxmoxSnapshots];
  if (snapshots.length === 0) return "missing";
  if (snapshots.some((snapshot) => !snapshot.lastCheckedAt)) return "unknown";

  const now = params.now ?? new Date();
  const staleAfterMs = (params.staleAfterDays ?? 90) * 86_400_000;
  return snapshots.some((snapshot) => {
    const checked = new Date(snapshot.lastCheckedAt as string).getTime();
    return !Number.isFinite(checked) || now.getTime() - checked > staleAfterMs;
  })
    ? "stale"
    : "fresh";
}
