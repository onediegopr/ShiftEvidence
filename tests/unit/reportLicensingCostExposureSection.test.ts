import { describe, expect, it } from "vitest";
import type { AssessmentLicensingAnalysis } from "@prisma/client";
import { buildLicensingCostExposureReportSection } from "../../src/server/reports/reportLicensingCostExposureSection";

function analysis(overrides: Partial<AssessmentLicensingAnalysis> = {}): AssessmentLicensingAnalysis {
  return {
    id: "licensing-analysis-1",
    assessmentId: "assessment-1",
    status: "completed",
    mode: "actual_costs",
    currency: "USD",
    financialConfidenceScore: 85,
    financialConfidenceLabel: "High",
    savingsQuality: "high",
    pricingFreshnessStatus: "fresh",
    vmwareScenarioJson: {
      mid: {
        label: "VMware/Broadcom renewal",
        source: "customer_provided",
        confidence: "high",
        annualUsd: 100000,
        threeYearUsd: 300000,
        fiveYearUsd: 500000,
        assumptions: ["Customer renewal quote was provided."],
        warnings: [],
      },
    },
    proxmoxScenarioJson: {
      supported: {
        label: "Proxmox supported",
        source: "approved_pricing_snapshot",
        confidence: "medium",
        annualUsd: 28000,
        threeYearUsd: 84000,
        fiveYearUsd: 140000,
        assumptions: ["Approved Proxmox snapshot was used."],
        warnings: ["Validate support tier with reseller."],
      },
    },
    comparisonJson: {
      netDeltaAnnual: 72000,
      netDeltaThreeYear: 216000,
      netDeltaFiveYear: 360000,
      grossSavingsPercent: 72,
      paybackMonths: 9,
      riskAdjustedNotes: ["Migration investment is included."],
    },
    costOfStayingJson: {
      annualRenewalUsd: 100000,
      threeYearRenewalUsd: 300000,
      fiveYearRenewalUsd: 500000,
      opportunityLossThreeYearUsd: 216000,
      notes: ["Cost of staying uses the selected VMware/Broadcom annual scenario."],
    },
    contractTimingRiskJson: {
      label: "High",
      severity: "high",
      daysToRenewal: 120,
      recommendation: "Collect renewal quote and validate a supported Proxmox scenario immediately.",
    },
    licensingTrapsJson: [
      {
        severity: "medium",
        title: "Potential exposure: community-only comparison",
        description: "Community-only comparison can overstate savings.",
        recommendation: "Compare a supported subscription scenario.",
      },
    ],
    missingEvidenceJson: [
      {
        key: "migration_investment",
        label: "Migration investment",
        impact: "Payback remains limited.",
        recommendation: "Estimate migration investment in USD.",
      },
    ],
    assumptionsJson: ["All financial values are modeled in USD."],
    pricingSnapshotRefsJson: [
      {
        snapshotId: "snap-vmware",
        vendor: "vmware",
        sourceName: "Manual VMware QA snapshot",
        sourceType: "manual_admin",
        lastCheckedAt: "2026-05-20T00:00:00.000Z",
        approvedAt: "2026-05-21T00:00:00.000Z",
        itemCount: 1,
      },
    ],
    executiveRecommendation: "Proceed to financial review: Evidence is strong enough for procurement validation.",
    generatedAt: new Date("2026-05-29T00:00:00.000Z"),
    createdAt: new Date("2026-05-29T00:00:00.000Z"),
    updatedAt: new Date("2026-05-29T00:00:00.000Z"),
    ...overrides,
  } as AssessmentLicensingAnalysis;
}

describe("report licensing cost exposure section", () => {
  it("handles null analysis without throwing", () => {
    const section = buildLicensingCostExposureReportSection(null);

    expect(section.included).toBe(false);
    expect(section.status).toBe("not_available");
    expect(section.currency).toBe("USD");
    expect(section.disclaimers.join(" ")).toContain("not generated");
  });

  it("handles skipped analysis as an optional non-blocking section", () => {
    const section = buildLicensingCostExposureReportSection(
      analysis({
        status: "not_included",
        mode: "skipped",
        financialConfidenceScore: null,
        financialConfidenceLabel: null,
        vmwareScenarioJson: null,
        proxmoxScenarioJson: null,
        comparisonJson: null,
      }),
    );

    expect(section.included).toBe(false);
    expect(section.mode).toBe("skipped");
    expect(section.disclaimers.join(" ")).toContain("skipped");
  });

  it("normalizes completed persisted analysis for report/PDF consumption", () => {
    const section = buildLicensingCostExposureReportSection(analysis());

    expect(section.included).toBe(true);
    expect(section.financialConfidenceScore).toBe(85);
    expect(section.vmwareScenario?.annualUsd).toBe(100000);
    expect(section.proxmoxScenario?.threeYearUsd).toBe(84000);
    expect(section.comparison?.grossSavingsPercent).toBe(72);
    expect(section.pricingSnapshotUsed[0]?.vendor).toBe("vmware");
    expect(section.executiveRecommendation?.title).toBe("Proceed to financial review");
  });

  it("does not throw on malformed JSON strings and records a disclaimer", () => {
    const section = buildLicensingCostExposureReportSection(
      analysis({
        vmwareScenarioJson: "{not-json",
        proxmoxScenarioJson: null,
      }),
    );

    expect(section.vmwareScenario).toBeNull();
    expect(section.disclaimers.join(" ")).toContain("could not be parsed");
  });

  it("adds required USD, third-party and storage disclaimers", () => {
    const section = buildLicensingCostExposureReportSection(
      analysis({
        pricingSnapshotRefsJson: [],
      }),
    );

    expect(section.currency).toBe("USD");
    expect(section.assumptions.join(" ")).toContain("USD");
    expect(section.disclaimers.join(" ")).toContain("third-party software licensing");
    expect(section.disclaimers.join(" ")).toContain("Storage cost modeling is still in development");
    expect(section.disclaimers.join(" ")).toContain("No approved pricing snapshot reference");
  });
});
