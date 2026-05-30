import { describe, expect, it } from "vitest";
import { parseAndValidateStorageAiOutput } from "../../src/server/assessments/storageContextAiAnalysisService";

describe("storage context AI analysis service", () => {
  it("normalizes valid storage AI JSON output", () => {
    const parsed = parseAndValidateStorageAiOutput(
      JSON.stringify({
        interpretedStorageSummary: "The customer wants Ceph but network evidence is missing.",
        sourceStorageSummary: [
          {
            item: "vSAN source",
            evidence: "Customer-reported source storage.",
            confidence: "medium",
            source: "customer_reported",
          },
        ],
        targetStoragePreference: {
          preference: "ceph",
          rationale: "Customer selected Ceph as a target preference.",
          confidence: "medium",
          source: "structured_input",
        },
        destinationOptions: [
          {
            option: "ceph_candidate",
            suitability: "not_enough_evidence",
            rationale: "Ceph needs node and network evidence.",
            missingEvidence: ["dedicated storage network"],
          },
        ],
        storageConstraints: [],
        cephSignals: {
          customerInterested: true,
          signalSummary: "Ceph is a candidate only.",
          positiveSignals: [],
          riskSignals: ["network unknown"],
          missingEvidence: ["OSD layout"],
          finalDecisionDeferred: false,
        },
        operationalReadinessSignals: [],
        missingEvidence: [
          {
            item: "Dedicated storage network",
            whyItMatters: "Ceph requires validated storage networking.",
            priority: "high",
          },
        ],
        contradictions: [],
        nextQuestions: [],
        recommendationImpact: [],
        scores: {
          storageCompletenessScore: 55,
          storageEvidenceConfidence: 60,
          storageDestinationReadiness: 45,
          storageMigrationRisk: 70,
          preliminaryCephConfidence: 30,
        },
        confidenceLabels: {
          storageContextConfidence: "limited",
          storageEvidenceConfidenceLabel: "medium",
        },
        safetyFlags: [],
      }),
    );

    expect(parsed.interpretedStorageSummary).toContain("Ceph");
    expect(parsed.destinationOptions[0]?.option).toBe("ceph_candidate");
    expect(parsed.cephSignals.finalDecisionDeferred).toBe(true);
    expect(JSON.stringify(parsed)).not.toContain("ceph_applies");
  });

  it("handles invalid JSON with a safe fallback", () => {
    const parsed = parseAndValidateStorageAiOutput("not-json");

    expect(parsed.interpretedStorageSummary).toContain("not available");
    expect(parsed.safetyFlags.some((flag) => flag.flag === "invalid_ai_json")).toBe(true);
    expect(parsed.parseWarnings).toContain("invalid_json");
  });
});
