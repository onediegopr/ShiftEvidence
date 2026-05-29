import type { AssessmentLicensingAnalysis, Prisma } from "@prisma/client";

type JsonValue = Prisma.JsonValue | null | undefined;

export type NormalizedLicensingScenario = {
  label: string;
  source: string;
  confidence: string;
  annualUsd: number | null;
  threeYearUsd: number | null;
  fiveYearUsd: number | null;
  assumptions: string[];
  warnings: string[];
};

export type LicensingCostExposureReportSection = {
  included: boolean;
  status: string;
  mode: string | null;
  currency: "USD";
  financialConfidenceScore: number | null;
  financialConfidenceLabel: string | null;
  savingsQuality: string | null;
  pricingFreshnessStatus: string | null;
  executiveRecommendation: {
    title: string;
    description: string;
    code?: string;
  } | null;
  vmwareScenario: NormalizedLicensingScenario | null;
  proxmoxScenario: NormalizedLicensingScenario | null;
  comparison: {
    annualDeltaUsd: number | null;
    threeYearDeltaUsd: number | null;
    fiveYearDeltaUsd: number | null;
    grossSavingsPercent: number | null;
    paybackMonths: number | null;
    notes: string[];
  } | null;
  costOfStaying: {
    summary: string;
    annualUsd: number | null;
    threeYearUsd: number | null;
    fiveYearUsd: number | null;
    opportunityLossThreeYearUsd: number | null;
    risks: string[];
  } | null;
  contractTimingRisk: {
    label: string;
    severity: string;
    daysToRenewal: number | null;
    recommendation: string;
  } | null;
  licensingTraps: Array<{
    severity: string;
    title: string;
    description: string;
    recommendation?: string;
  }>;
  missingEvidence: Array<{
    label: string;
    impact: string;
    recommendation: string;
  }>;
  assumptions: string[];
  pricingSnapshotUsed: Array<{
    vendor: string;
    snapshotId?: string;
    sourceName?: string;
    lastCheckedAt?: string;
    status?: string;
    notes?: string;
  }>;
  disclaimers: string[];
  warnings: string[];
};

const BASE_DISCLAIMERS = [
  "This is not a vendor quote. Pricing estimates are based on customer-provided data, approved pricing snapshots and assessment evidence. Final pricing must be validated with the customer's vendor, reseller or procurement channel.",
  "Taxes, local fees, reseller discounts and third-party software licensing are not included unless explicitly provided.",
  "Storage cost modeling is still in development and is not included in this analysis.",
];

const BASE_ASSUMPTIONS = [
  "All values are modeled in USD.",
  "Customer-provided values override benchmark or snapshot-derived scenarios.",
  "Only approved pricing snapshots are considered usable for analysis.",
  "Third-party licensing is excluded unless explicitly provided in future scope.",
  "Storage cost modeling is not included.",
];

const severityRank: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
  unknown: 5,
};

function addUnique(list: string[], value: string | null | undefined) {
  const trimmed = value?.trim();
  if (trimmed && !list.includes(trimmed)) {
    list.push(trimmed);
  }
}

function parseJsonValue(value: JsonValue, label: string, warnings: string[]): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      return value;
    }

    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      warnings.push(`${label} could not be parsed and was omitted from the report section.`);
      return null;
    }
  }

  return value;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = "Not provided") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asStringArray(value: unknown, maxItems = 10) {
  return asArray(value)
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, maxItems);
}

function normalizeScenario(value: unknown): NormalizedLicensingScenario | null {
  const record = asRecord(value);
  if (Object.keys(record).length === 0) {
    return null;
  }

  const scenario: NormalizedLicensingScenario = {
    label: asString(record.label, "Scenario unavailable"),
    source: asString(record.source, "unknown"),
    confidence: asString(record.confidence, "unknown"),
    annualUsd: asNumber(record.annualUsd),
    threeYearUsd: asNumber(record.threeYearUsd),
    fiveYearUsd: asNumber(record.fiveYearUsd),
    assumptions: asStringArray(record.assumptions, 6),
    warnings: asStringArray(record.warnings, 6),
  };

  if (
    scenario.annualUsd === null &&
    scenario.threeYearUsd === null &&
    scenario.fiveYearUsd === null &&
    scenario.source === "unknown" &&
    scenario.assumptions.length === 0 &&
    scenario.warnings.length === 0
  ) {
    return null;
  }

  return scenario;
}

function pickScenario(group: unknown, preferredKeys: string[]) {
  const record = asRecord(group);
  for (const key of preferredKeys) {
    const scenario = normalizeScenario(record[key]);
    if (scenario) {
      return scenario;
    }
  }

  return null;
}

function normalizeExecutiveRecommendation(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const [title, ...rest] = value.split(":");
  return {
    title: title.trim() || "Executive recommendation",
    description: rest.join(":").trim() || value.trim(),
  };
}

function normalizeLicensingTraps(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        severity: asString(record.severity, "unknown").toLowerCase(),
        title: asString(record.title, "Potential exposure"),
        description: asString(record.description, "No description was provided."),
        recommendation: asOptionalString(record.recommendation),
      };
    })
    .sort((left, right) => (severityRank[left.severity] ?? severityRank.unknown) - (severityRank[right.severity] ?? severityRank.unknown))
    .slice(0, 7);
}

function normalizeMissingEvidence(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        label: asString(record.label ?? record.key, "Missing financial evidence"),
        impact: asString(record.impact, "Financial confidence may be limited."),
        recommendation: asString(record.recommendation, "Collect this evidence before final financial review."),
      };
    })
    .slice(0, 8);
}

function normalizePricingSnapshotRefs(value: unknown) {
  return asArray(value)
    .map((item) => {
      const record = asRecord(item);
      return {
        vendor: asString(record.vendor, "unknown"),
        snapshotId: asOptionalString(record.snapshotId),
        sourceName: asOptionalString(record.sourceName),
        lastCheckedAt: asOptionalString(record.lastCheckedAt),
        status: "approved",
        notes: [
          asOptionalString(record.sourceType) ? `Source type: ${asOptionalString(record.sourceType)}` : null,
          typeof record.itemCount === "number" ? `Items: ${record.itemCount}` : null,
          asOptionalString(record.approvedAt) ? `Approved: ${asOptionalString(record.approvedAt)}` : null,
        ].filter((note): note is string => Boolean(note)).join(" | ") || undefined,
      };
    })
    .slice(0, 8);
}

function normalizeAssumptions(value: unknown) {
  const assumptions = [...BASE_ASSUMPTIONS];
  asStringArray(value, 12).forEach((item) => addUnique(assumptions, item));
  return assumptions;
}

export function buildLicensingCostExposureReportSection(
  analysis: AssessmentLicensingAnalysis | null | undefined,
): LicensingCostExposureReportSection {
  const warnings: string[] = [];

  if (!analysis) {
    return {
      included: false,
      status: "not_available",
      mode: null,
      currency: "USD",
      financialConfidenceScore: null,
      financialConfidenceLabel: null,
      savingsQuality: null,
      pricingFreshnessStatus: null,
      executiveRecommendation: null,
      vmwareScenario: null,
      proxmoxScenario: null,
      comparison: null,
      costOfStaying: null,
      contractTimingRisk: null,
      licensingTraps: [],
      missingEvidence: [],
      assumptions: BASE_ASSUMPTIONS,
      pricingSnapshotUsed: [],
      disclaimers: [
        ...BASE_DISCLAIMERS,
        "Licensing & Cost Exposure Analysis was not generated for this assessment.",
      ],
      warnings: [],
    };
  }

  const status = String(analysis.status ?? "not_included");
  const mode = analysis.mode ? String(analysis.mode) : null;
  const included = status !== "not_included" && mode !== "skipped";
  const vmwareScenarios = parseJsonValue(analysis.vmwareScenarioJson, "VMware scenario JSON", warnings);
  const proxmoxScenarios = parseJsonValue(analysis.proxmoxScenarioJson, "Proxmox scenario JSON", warnings);
  const comparisonJson = asRecord(parseJsonValue(analysis.comparisonJson, "Comparison JSON", warnings));
  const costOfStayingJson = asRecord(parseJsonValue(analysis.costOfStayingJson, "Cost of staying JSON", warnings));
  const timingJson = asRecord(parseJsonValue(analysis.contractTimingRiskJson, "Contract timing risk JSON", warnings));
  const trapsJson = parseJsonValue(analysis.licensingTrapsJson, "Licensing traps JSON", warnings);
  const missingEvidenceJson = parseJsonValue(analysis.missingEvidenceJson, "Missing evidence JSON", warnings);
  const assumptionsJson = parseJsonValue(analysis.assumptionsJson, "Assumptions JSON", warnings);
  const snapshotRefsJson = parseJsonValue(analysis.pricingSnapshotRefsJson, "Pricing snapshot refs JSON", warnings);
  const pricingSnapshotUsed = normalizePricingSnapshotRefs(snapshotRefsJson);
  const missingEvidence = normalizeMissingEvidence(missingEvidenceJson);
  const disclaimers = [...BASE_DISCLAIMERS];

  if (!included) {
    disclaimers.push("Licensing & Cost Exposure Analysis was skipped or not included for this assessment.");
  }

  if (pricingSnapshotUsed.length === 0) {
    disclaimers.push("No approved pricing snapshot reference was persisted with this analysis.");
  }

  if (status === "needs_input") {
    disclaimers.push("The analysis needs more financial input before it can support a reliable comparison.");
  }

  if (status === "stale_pricing" || analysis.pricingFreshnessStatus === "stale") {
    disclaimers.push("Pricing data was marked stale when this analysis was generated.");
  }

  warnings.forEach((warning) => disclaimers.push(warning));

  const annualDeltaUsd = asNumber(comparisonJson.netDeltaAnnual);
  const threeYearDeltaUsd = asNumber(comparisonJson.netDeltaThreeYear);
  const fiveYearDeltaUsd = asNumber(comparisonJson.netDeltaFiveYear);
  const comparison = {
    annualDeltaUsd,
    threeYearDeltaUsd,
    fiveYearDeltaUsd,
    grossSavingsPercent: asNumber(comparisonJson.grossSavingsPercent),
    paybackMonths: asNumber(comparisonJson.paybackMonths),
    notes: asStringArray(comparisonJson.riskAdjustedNotes, 6),
  };

  const costNotes = asStringArray(costOfStayingJson.notes, 6);
  const costOfStaying = {
    summary: costNotes[0] ?? "Cost of staying was not quantified from available evidence.",
    annualUsd: asNumber(costOfStayingJson.annualRenewalUsd),
    threeYearUsd: asNumber(costOfStayingJson.threeYearRenewalUsd),
    fiveYearUsd: asNumber(costOfStayingJson.fiveYearRenewalUsd),
    opportunityLossThreeYearUsd: asNumber(costOfStayingJson.opportunityLossThreeYearUsd),
    risks: costNotes,
  };

  return {
    included,
    status,
    mode,
    currency: "USD",
    financialConfidenceScore: asNumber(analysis.financialConfidenceScore),
    financialConfidenceLabel: analysis.financialConfidenceLabel ?? null,
    savingsQuality: analysis.savingsQuality ?? null,
    pricingFreshnessStatus: analysis.pricingFreshnessStatus ?? null,
    executiveRecommendation: normalizeExecutiveRecommendation(analysis.executiveRecommendation),
    vmwareScenario: pickScenario(vmwareScenarios, ["mid", "low", "high"]),
    proxmoxScenario: pickScenario(proxmoxScenarios, ["supported", "premium", "community"]),
    comparison,
    costOfStaying,
    contractTimingRisk: {
      label: asString(timingJson.label, "Unknown"),
      severity: asString(timingJson.severity, "unknown"),
      daysToRenewal: asNumber(timingJson.daysToRenewal),
      recommendation: asString(timingJson.recommendation, "Collect renewal date before using timing as a decision factor."),
    },
    licensingTraps: normalizeLicensingTraps(trapsJson),
    missingEvidence,
    assumptions: normalizeAssumptions(assumptionsJson),
    pricingSnapshotUsed,
    disclaimers,
    warnings,
  };
}
