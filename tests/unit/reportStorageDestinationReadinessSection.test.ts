import { describe, expect, it } from "vitest";
import { buildStorageDestinationReadinessReportSection } from "../../src/server/reports/reportStorageDestinationReadinessSection";
import type { AssessmentDetail } from "../../src/server/assessments/assessmentService";

function assessment(overrides: Partial<AssessmentDetail> = {}): AssessmentDetail {
  return {
    id: "assessment-storage-report-1",
    storageDestinationReadiness: null,
    storageContext: null,
    storageAnalysis: null,
    storageEvidence: [],
    parsedDatastores: [],
    ...overrides,
  } as unknown as AssessmentDetail;
}

function completedStorageAssessment(overrides: Partial<AssessmentDetail> = {}) {
  return assessment({
    storageDestinationReadiness: {
      status: "analyzed",
      currentStorageType: "vmfs",
      targetStoragePreference: "ceph",
      hasMinimumThreeNodes: true,
      hasDedicatedStorageNetwork: true,
      hasCephExperience: false,
      hasPbs: true,
    },
    storageContext: {
      rawText: "RAW_STORAGE_CONTEXT_SECRET should never appear",
      status: "submitted",
      truncated: false,
    },
    storageAnalysis: {
      status: "completed",
      storageReadinessScore: 76,
      storageEvidenceConfidence: 68,
      cephSuitabilityStatus: "ceph_conditional",
      interpretedSummary: "Storage destination context supports a conditional Ceph review.",
      missingEvidenceJson: [
        {
          item: "Failure domain map",
          whyItMatters: "Ceph needs failure-domain validation.",
          priority: "high",
        },
      ],
      recommendationsJson: {
        interpretedStorageSummary: "Storage destination context supports a conditional Ceph review.",
        sourceStorageSummary: [
          {
            item: "VMFS source datastores",
            evidence: "RVTools datastore export",
            confidence: "medium",
            source: "rvtools",
          },
        ],
        destinationOptions: [
          {
            option: "ceph_candidate",
            suitability: "risky",
            rationale: "Ceph is possible but needs remediation.",
            missingEvidence: ["Failure domain map"],
          },
        ],
        storageConstraints: [
          {
            constraint: "Strict downtime tolerance",
            type: "downtime",
            impact: "Migration waves need tighter validation.",
          },
        ],
        missingEvidence: [
          {
            item: "Storage network speed",
            whyItMatters: "Ceph performance depends on network evidence.",
            priority: "high",
          },
        ],
        contradictions: [
          {
            title: "Ceph preference with limited skills",
            description: "The customer prefers Ceph but reports no Ceph experience.",
            validationRecommendation: "Assign a Ceph owner or support model.",
          },
        ],
        nextQuestions: [
          {
            question: "What storage network speed is planned?",
            reason: "Ceph suitability depends on target network design.",
            priority: "high",
          },
        ],
        scores: {
          storageDestinationReadiness: 76,
          storageEvidenceConfidence: 68,
          storageMigrationRisk: 62,
        },
        cephReadiness: {
          status: "ceph_conditional",
          summary: "Ceph may apply conditionally after remediation.",
          cephSuitabilityScore: 66,
          cephOperationsReadinessScore: 48,
          cephEvidenceConfidenceScore: 61,
          capacityFitScore: 70,
          networkReadinessScore: 55,
          failureDomainReadinessScore: 40,
          backupReadinessScore: 72,
          operationalSkillsScore: 35,
          findings: [
            {
              severity: "high",
              category: "operations",
              title: "No Ceph owner confirmed",
              description: "Ceph operations ownership is not clear.",
              impact: "Operational risk remains elevated.",
              recommendation: "Confirm support before production.",
            },
          ],
          remediations: [
            {
              priority: "high",
              action: "Confirm storage network and Ceph owner.",
              reason: "These inputs are required before blueprint work.",
              requiredBeforeCeph: true,
            },
          ],
          missingEvidence: [
            {
              item: "OSD layout",
              whyItMatters: "Usable capacity and fault tolerance depend on disk layout.",
              priority: "high",
            },
          ],
          assumptions: ["Ceph result is deterministic and advisory."],
          recommendedNextStep: "remediate_before_ceph",
        },
      },
    },
    storageEvidence: [
      {
        classification: "network_diagram",
        analysisStatus: "received_not_analyzed",
        includedInStorageAnalysis: true,
        evidenceFile: {
          originalFilename: "C:\\private\\storage-network.png",
          relativePath: "secret/storage/raw/path",
        },
      },
    ],
    parsedDatastores: [
      {
        capacityGb: 1000,
        usedGb: 820,
        usagePercent: 82,
      },
    ],
    ...overrides,
  } as unknown as AssessmentDetail);
}

describe("report storage destination readiness section", () => {
  it("returns a safe not-included fallback when no storage module exists", () => {
    const section = buildStorageDestinationReadinessReportSection(assessment());

    expect(section.included).toBe(false);
    expect(section.status).toBe("not_available");
    expect(section.disclaimers.join(" ")).toContain("No Storage Destination Readiness analysis");
  });

  it("normalizes agnostic and Ceph persisted output for report/PDF consumption", () => {
    const section = buildStorageDestinationReadinessReportSection(completedStorageAssessment());

    expect(section.included).toBe(true);
    expect(section.storageDestinationReadiness).toBe(76);
    expect(section.storageEvidenceConfidence).toBe(68);
    expect(section.ceph.status).toBe("ceph_conditional");
    expect(section.ceph.recommendedNextStep).toBe("remediate_before_ceph");
    expect(section.destinationOptions[0]?.option).toBe("ceph_candidate");
  });

  it("does not expose raw storage text, file contents, or private paths", () => {
    const section = buildStorageDestinationReadinessReportSection(completedStorageAssessment());
    const serialized = JSON.stringify(section);

    expect(serialized).not.toContain("RAW_STORAGE_CONTEXT_SECRET");
    expect(serialized).not.toContain("secret/storage/raw/path");
    expect(serialized).not.toContain("C:\\private");
    expect(serialized).toContain("storage-network.png");
  });

  it("renders not enough evidence as useful Ceph output", () => {
    const section = buildStorageDestinationReadinessReportSection(
      completedStorageAssessment({
        storageAnalysis: {
          ...completedStorageAssessment().storageAnalysis,
          cephSuitabilityStatus: "not_enough_evidence",
          recommendationsJson: {
            cephReadiness: {
              status: "not_enough_evidence",
              summary: "Ceph cannot be assessed defensibly yet.",
              missingEvidence: [
                {
                  item: "Target node count",
                  whyItMatters: "Ceph needs target node evidence.",
                  priority: "high",
                },
              ],
              recommendedNextStep: "collect_more_evidence",
            },
          },
        } as never,
      }),
    );

    expect(section.ceph.status).toBe("not_enough_evidence");
    expect(section.ceph.missingEvidence[0]?.item).toBe("Target node count");
    expect(section.disclaimers.join(" ")).toContain("Ceph cannot be assessed defensibly");
  });

  it("tolerates malformed persisted JSON", () => {
    const section = buildStorageDestinationReadinessReportSection(
      completedStorageAssessment({
        storageAnalysis: {
          ...completedStorageAssessment().storageAnalysis,
          recommendationsJson: "{bad-json",
        } as never,
      }),
    );

    expect(section.included).toBe(true);
    expect(section.disclaimers.join(" ")).toContain("could not be parsed");
  });
});
