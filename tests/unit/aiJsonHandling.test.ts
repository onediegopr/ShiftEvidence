import { describe, expect, it } from "vitest";
import {
  buildSafeJsonInput,
  parseJsonText,
} from "../../src/server/ai/aiAdvisoryClient";
import type { AiAdvisoryContextPayload } from "../../src/server/ai/aiAdvisoryTypes";

function buildPayload(itemCount: number): AiAdvisoryContextPayload {
  const longText = "This is a deliberately long advisory field used for payload reduction tests. ".repeat(12);

  return {
    assessment: {
      safeReference: "assessment-test",
      type: "vmware_to_proxmox",
      sourcePlatform: "VMware",
      targetPlatform: "Proxmox",
      status: "draft",
      storageReadinessEnabled: true,
    },
    rvtoolsSummary: {
      vmCount: 126,
      hostCount: 6,
      datastoreCount: 14,
      snapshotCount: 19,
      poweredOnVmCount: 92,
      poweredOffVmCount: 34,
      totalProvisionedGb: 70_000,
      totalUsedGb: 42_000,
    },
    scores: {
      readinessScore: 64,
      confidenceScore: 58,
      inventoryScore: 72,
      costRiskScore: 61,
      riskLevel: "medium",
    },
    riskFindings: Array.from({ length: itemCount }, (_, index) => ({
      category: "backup",
      severity: index % 2 === 0 ? "high" : "medium",
      entityType: "vm",
      entityName: `vm-${index}`,
      title: `Risk finding ${index}`,
      description: longText,
      recommendation: longText,
      source: "synthetic-test",
    })),
    manualMigrationContext: {
      coverage: {
        overallPercent: 55,
        status: "limited",
        missingKeyContext: Array.from({ length: itemCount }, (_, index) => `Missing context ${index}`),
        sections: Array.from({ length: itemCount }, (_, index) => ({
          id: `section-${index}`,
          title: `Section ${index}`,
          percent: 50,
          status: "partial",
          missing: [`Missing ${index}`, `Dependency ${index}`],
        })),
      },
      statusCounts: {
        answered: 5,
        unknown: 3,
        not_applicable: 1,
        skipped: 2,
      },
      importantContext: Array.from({ length: itemCount }, (_, index) => `${longText} Important ${index}`),
      missingContext: Array.from({ length: itemCount }, (_, index) => `${longText} Missing ${index}`),
      answers: Array.from({ length: itemCount }, (_, index) => ({
        question: `Question ${index}`,
        status: "answered",
        source: "manual",
        value: `${longText} Answer ${index}`,
      })),
    },
    assumptions: {
      costRisk: {
        annualSubscriptionDelta: 100_000,
        threeYearSubscriptionDelta: 300_000,
        savingsPercent: 60,
        riskLevel: "medium",
        readinessLabel: "Medium readiness",
        dataSourceLabel: "Synthetic",
      },
      mismatchWarnings: Array.from({ length: itemCount }, (_, index) => `Mismatch ${index}`),
      referenceCounts: {
        vmCount: 126,
        hostCount: 6,
      },
    },
    evidenceReceived: Array.from({ length: itemCount }, (_, index) => ({
      evidenceType: "rvtools",
      safeFilenameLabel: `evidence-${index}.xlsx`,
      processingStatus: "processed",
      sizeBytes: 1024,
      uploadedAt: "2026-05-29T00:00:00.000Z",
    })),
    evidenceMissing: Array.from({ length: itemCount }, (_, index) => `Evidence gap ${index}`),
    excluded: ["raw files", "secrets", "storage paths"],
  };
}

describe("AI JSON handling helpers", () => {
  it("parses plain JSON and fenced JSON", () => {
    expect(parseJsonText('{"ok":true}')).toEqual({ ok: true });
    expect(parseJsonText("```json\n{\"ok\":true}\n```")).toEqual({ ok: true });
  });

  it("returns null for malformed JSON", () => {
    expect(parseJsonText("not json")).toBeNull();
  });

  it("builds parseable JSON for small payloads", () => {
    const json = buildSafeJsonInput(buildPayload(1), 100_000);
    const parsed = JSON.parse(json) as AiAdvisoryContextPayload;

    expect(parsed.assessment.safeReference).toBe("assessment-test");
  });

  it("builds parseable JSON for large payloads without blind string truncation", () => {
    const json = buildSafeJsonInput(buildPayload(80), 6_000);

    expect(() => JSON.parse(json)).not.toThrow();
    expect(json).not.toContain("[TRUNCATED]");
  });
});
