export type LicensingAnalysisMode =
  | "actual_costs"
  | "estimated_from_environment"
  | "broad_scenarios"
  | "skipped";

export type AssessmentLicensingAnalysisStatus =
  | "not_included"
  | "needs_input"
  | "ready"
  | "completed"
  | "blocked"
  | "stale_pricing";

export type PricingFreshnessStatus = "fresh" | "stale" | "missing" | "unknown";

export type FinancialConfidenceInput = {
  hasCustomerActualCost: boolean;
  hasRenewalQuote: boolean;
  hasContract: boolean;
  hasApprovedVmwarePricingSnapshot: boolean;
  hasApprovedProxmoxPricingSnapshot: boolean;
  hasDetectedHostCount: boolean;
  hasDetectedSocketCount: boolean;
  hasDetectedCoreCount: boolean;
  hasRenewalDate: boolean;
  hasProxmoxTargetSizing: boolean;
  hasMigrationInvestmentEstimate: boolean;
  pricingFreshnessStatus: PricingFreshnessStatus;
  mode: LicensingAnalysisMode;
};

export type LicensingCostScenario = {
  label: string;
  source: "customer_provided" | "approved_pricing_snapshot" | "assessment_evidence" | "broad_scenario" | "missing";
  confidence: "high" | "medium" | "limited" | "low" | "unknown";
  annualUsd: number | null;
  threeYearUsd: number | null;
  fiveYearUsd: number | null;
  assumptions: string[];
  warnings: string[];
};

export type LicensingComparisonResult = {
  vmwareLow: LicensingCostScenario | null;
  vmwareMid: LicensingCostScenario | null;
  vmwareHigh: LicensingCostScenario | null;
  proxmoxCommunity: LicensingCostScenario | null;
  proxmoxSupported: LicensingCostScenario | null;
  proxmoxPremium: LicensingCostScenario | null;
  netDeltaAnnual: number | null;
  netDeltaThreeYear: number | null;
  netDeltaFiveYear: number | null;
  paybackMonths: number | null;
  grossSavingsPercent: number | null;
  riskAdjustedNotes: string[];
};

export type LicensingTrap = {
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  evidence: string[];
  recommendation: string;
};

export type MissingFinancialEvidence = {
  key: string;
  label: string;
  impact: string;
  recommendation: string;
};

export type ContractTimingRisk = {
  label: "Critical" | "High" | "Medium" | "Low" | "Unknown";
  daysToRenewal: number | null;
  severity: "critical" | "high" | "medium" | "low" | "unknown";
  recommendation: string;
};

export type SavingsQuality = {
  value: "high" | "medium" | "low" | "unknown";
  reasons: string[];
};

export type ExecutiveRecommendation = {
  code:
    | "collect_renewal_quote"
    | "run_pilot_first"
    | "negotiate_bridge_renewal"
    | "proceed_to_blueprint"
    | "do_not_use_savings_primary_driver"
    | "compare_supported_proxmox_scenario"
    | "ready_for_financial_review";
  title: string;
  description: string;
};

export type PricingSnapshotReference = {
  snapshotId: string;
  vendor: "vmware" | "proxmox";
  sourceName: string;
  sourceType: string;
  lastCheckedAt: string | null;
  approvedAt: string | null;
  itemCount: number;
};

export type ApprovedPricingItem = {
  id: string;
  snapshotId: string;
  vendor: "vmware" | "proxmox";
  productName: string;
  edition: string | null;
  metric: "core" | "socket" | "host" | "node" | "year" | "subscription" | "manual" | "rule";
  unitPriceUsd: number | null;
  minUnits: number | null;
  termMonths: number | null;
  sourceNote: string | null;
};

export type ApprovedPricingSnapshot = PricingSnapshotReference & {
  items: ApprovedPricingItem[];
};

export type LicensingAnalysisPreferences = {
  version: 1;
  mode: LicensingAnalysisMode;
  renewalDate: string | null;
  hasContract: boolean;
  hasRenewalQuote: boolean;
  migrationInvestmentEstimateUsd: number | null;
  selectedProxmoxSupportScenario: "community" | "supported" | "premium" | "not_sure" | null;
  notes: string | null;
  updatedAt: string | null;
};

export type LicensingAnalysisInput = {
  assessmentId: string;
  mode: LicensingAnalysisMode;
  currency: "USD";
  annualVmwareCostUsd: number | null;
  estimatedProxmoxCostUsd: number | null;
  years: number;
  hostCount: number | null;
  socketCount: number | null;
  coreCount: number | null;
  vmCount: number | null;
  hasParsedInventory: boolean;
  renewalDate: string | null;
  hasContract: boolean;
  hasRenewalQuote: boolean;
  migrationInvestmentEstimateUsd: number | null;
  selectedProxmoxSupportScenario: LicensingAnalysisPreferences["selectedProxmoxSupportScenario"];
  includeProxmoxEstimate: "yes" | "no" | "not_sure" | null;
  notes: string | null;
  approvedVmwareSnapshots: ApprovedPricingSnapshot[];
  approvedProxmoxSnapshots: ApprovedPricingSnapshot[];
  pricingFreshnessStatus: PricingFreshnessStatus;
};

export type LicensingAnalysisResult = {
  status: AssessmentLicensingAnalysisStatus;
  mode: LicensingAnalysisMode;
  currency: "USD";
  financialConfidenceScore: number | null;
  financialConfidenceLabel: string | null;
  savingsQuality: SavingsQuality;
  pricingFreshnessStatus: PricingFreshnessStatus;
  vmwareScenarios: {
    low: LicensingCostScenario | null;
    mid: LicensingCostScenario | null;
    high: LicensingCostScenario | null;
  };
  proxmoxScenarios: {
    community: LicensingCostScenario | null;
    supported: LicensingCostScenario | null;
    premium: LicensingCostScenario | null;
  };
  comparison: LicensingComparisonResult;
  costOfStaying: {
    annualRenewalUsd: number | null;
    threeYearRenewalUsd: number | null;
    fiveYearRenewalUsd: number | null;
    opportunityLossThreeYearUsd: number | null;
    notes: string[];
  };
  contractTimingRisk: ContractTimingRisk;
  licensingTraps: LicensingTrap[];
  missingEvidence: MissingFinancialEvidence[];
  assumptions: string[];
  pricingSnapshotRefs: PricingSnapshotReference[];
  executiveRecommendation: ExecutiveRecommendation;
  generatedAt: string | null;
};
