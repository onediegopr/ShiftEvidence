import { describe, expect, it } from "vitest";
import {
  calculateFinancialConfidence,
  runLicensingCostExposureAnalysis,
} from "../../src/server/assessments/licensingCostExposureEngine";
import type {
  ApprovedPricingSnapshot,
  LicensingAnalysisInput,
} from "../../src/server/assessments/licensingCostExposureTypes";

const freshDate = new Date().toISOString();

function snapshot(vendor: "vmware" | "proxmox", metric: "core" | "socket" | "host" | "subscription", unitPriceUsd: number): ApprovedPricingSnapshot {
  return {
    snapshotId: `${vendor}-approved`,
    vendor,
    sourceName: `${vendor} approved source`,
    sourceType: "manual_admin",
    lastCheckedAt: freshDate,
    approvedAt: freshDate,
    itemCount: 1,
    items: [
      {
        id: `${vendor}-item`,
        snapshotId: `${vendor}-approved`,
        vendor,
        productName: vendor === "vmware" ? "VMware/Broadcom subscription" : "Proxmox support subscription",
        edition: "Standard",
        metric,
        unitPriceUsd,
        minUnits: null,
        termMonths: 12,
        sourceNote: "Unit test snapshot.",
      },
    ],
  };
}

function baseInput(overrides: Partial<LicensingAnalysisInput> = {}): LicensingAnalysisInput {
  return {
    assessmentId: "assessment-1",
    mode: "actual_costs",
    currency: "USD",
    annualVmwareCostUsd: 120_000,
    estimatedProxmoxCostUsd: null,
    years: 3,
    hostCount: 4,
    socketCount: 8,
    coreCount: 128,
    vmCount: 80,
    hasParsedInventory: true,
    renewalDate: new Date(Date.now() + 220 * 86_400_000).toISOString().slice(0, 10),
    hasContract: true,
    hasRenewalQuote: true,
    includeEscalation: false,
    migrationInvestmentEstimateUsd: 45_000,
    selectedProxmoxSupportScenario: "supported",
    includeProxmoxEstimate: "yes",
    notes: "Amounts in USD.",
    approvedVmwareSnapshots: [snapshot("vmware", "core", 700)],
    approvedProxmoxSnapshots: [snapshot("proxmox", "host", 1_200)],
    pricingFreshnessStatus: "fresh",
    ...overrides,
  };
}

describe("licensing cost exposure engine", () => {
  it("does not calculate when the analysis is skipped", () => {
    const result = runLicensingCostExposureAnalysis(baseInput({ mode: "skipped" }));

    expect(result.status).toBe("not_included");
    expect(result.financialConfidenceScore).toBeNull();
    expect(result.comparison.netDeltaAnnual).toBeNull();
  });

  it("raises financial confidence when customer actual cost and quote are available", () => {
    const result = runLicensingCostExposureAnalysis(baseInput());

    expect(result.financialConfidenceScore).toBeGreaterThanOrEqual(80);
    expect(result.financialConfidenceLabel).toBe("High");
    expect(result.vmwareScenarios.mid?.source).toBe("customer_provided");
  });

  it("degrades safely when approved snapshots are missing", () => {
    const result = runLicensingCostExposureAnalysis(
      baseInput({
        mode: "estimated_from_environment",
        annualVmwareCostUsd: null,
        approvedVmwareSnapshots: [],
        approvedProxmoxSnapshots: [],
        pricingFreshnessStatus: "missing",
      }),
    );

    expect(result.status).toBe("needs_input");
    expect(result.financialConfidenceScore).toBeLessThan(60);
    expect(result.missingEvidence.some((item) => item.key === "approved_vmware_pricing_snapshot")).toBe(true);
    expect(result.missingEvidence.some((item) => item.key === "approved_proxmox_pricing_snapshot")).toBe(true);
  });

  it("keeps broad scenarios limited confidence", () => {
    const result = runLicensingCostExposureAnalysis(
      baseInput({
        mode: "broad_scenarios",
        hasContract: false,
        hasRenewalQuote: false,
        annualVmwareCostUsd: null,
      }),
    );

    expect(result.financialConfidenceScore).toBeLessThan(70);
    expect(result.licensingTraps.some((trap) => trap.title.includes("broad scenarios"))).toBe(true);
  });

  it("uses only approved snapshot inputs supplied to the engine", () => {
    const result = runLicensingCostExposureAnalysis(
      baseInput({
        mode: "estimated_from_environment",
        annualVmwareCostUsd: null,
        approvedVmwareSnapshots: [snapshot("vmware", "core", 500)],
        approvedProxmoxSnapshots: [],
      }),
    );

    expect(result.vmwareScenarios.mid?.annualUsd).toBe(64_000);
    expect(result.proxmoxScenarios.supported).toBeNull();
    expect(result.missingEvidence.some((item) => item.key === "approved_proxmox_pricing_snapshot")).toBe(true);
  });

  it("warns when Proxmox comparison is community-only", () => {
    const result = runLicensingCostExposureAnalysis(baseInput({ approvedProxmoxSnapshots: [], estimatedProxmoxCostUsd: null }));

    expect(result.proxmoxScenarios.community?.annualUsd).toBe(0);
    expect(result.licensingTraps.some((trap) => trap.title.includes("community-only"))).toBe(true);
  });

  it("lowers savings quality when migration investment is missing", () => {
    const result = runLicensingCostExposureAnalysis(baseInput({ migrationInvestmentEstimateUsd: null }));

    expect(result.savingsQuality.value).not.toBe("high");
    expect(result.missingEvidence.some((item) => item.key === "migration_investment")).toBe(true);
  });

  it("marks renewal dates inside 90 days as critical timing risk", () => {
    const result = runLicensingCostExposureAnalysis(
      baseInput({
        renewalDate: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
      }),
    );

    expect(result.contractTimingRisk.severity).toBe("critical");
    expect(result.licensingTraps.some((trap) => trap.title.includes("renewal window"))).toBe(true);
  });

  it("keeps all financial output in USD assumptions and does not calculate storage", () => {
    const result = runLicensingCostExposureAnalysis(baseInput());

    expect(result.currency).toBe("USD");
    expect(result.assumptions.some((item) => item.includes("All financial values are modeled in USD"))).toBe(true);
    expect(result.assumptions.some((item) => item.includes("Storage cost modeling is still in development"))).toBe(true);
  });

  it("scores low when broad scenarios lack real cost and pricing data", () => {
    const confidence = calculateFinancialConfidence({
      hasCustomerActualCost: false,
      hasRenewalQuote: false,
      hasContract: false,
      hasApprovedVmwarePricingSnapshot: false,
      hasApprovedProxmoxPricingSnapshot: false,
      hasDetectedHostCount: false,
      hasDetectedSocketCount: false,
      hasDetectedCoreCount: false,
      hasRenewalDate: false,
      hasProxmoxTargetSizing: false,
      hasMigrationInvestmentEstimate: false,
      pricingFreshnessStatus: "missing",
      mode: "broad_scenarios",
    });

    expect(confidence.score).toBe(0);
    expect(confidence.label).toBe("Low");
  });

  it("applies YoY escalation estimates to VMware scenario when enabled", () => {
    const result = runLicensingCostExposureAnalysis(baseInput({ includeEscalation: true }));

    const annualVmware = result.vmwareScenarios.mid?.annualUsd ?? 0;
    const threeYearVmware = result.vmwareScenarios.mid?.threeYearUsd ?? 0;
    const fiveYearVmware = result.vmwareScenarios.mid?.fiveYearUsd ?? 0;

    expect(threeYearVmware).toBeCloseTo(annualVmware * 3.31, 2);
    expect(fiveYearVmware).toBeCloseTo(annualVmware * 6.1051, 2);
    expect(result.assumptions.some((item) => item.includes("VMware 3-Year and 5-Year estimates include 10% YoY Broadcom price escalation"))).toBe(true);
  });
});
