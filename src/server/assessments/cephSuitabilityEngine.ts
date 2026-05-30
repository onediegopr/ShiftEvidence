import { AssessmentStorageAnalysisStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ensureAssessmentOwnership, type AssessmentDetail } from "./assessmentService";
import { extractCephEvidenceInput } from "./cephEvidenceService";
import {
  buildCephMissingEvidence,
  generateCephFindings,
  generateCephRemediations,
} from "./cephReadinessFindingsService";
import { calculateCephReadinessScores } from "./cephReadinessScoringService";
import {
  CEPH_READINESS_ENGINE_VERSION,
  type CephEvidenceInput,
  type CephRecommendedNextStep,
  type CephReadinessResult,
  type CephReadinessScores,
  type CephSuitabilityStatus,
} from "./cephReadinessTypes";

type ActorParams = {
  userId: string;
  assessmentId: string;
};

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function activeEvidenceCount(input: CephEvidenceInput) {
  return input.evidenceFiles.filter((file) => file.included).length;
}

function criticalMissingCount(input: CephEvidenceInput) {
  return [
    input.hasMinimumThreeNodes === null,
    input.hasDedicatedStorageNetwork === null && !input.hasNetworkEvidence,
    !input.hasCephEvidence,
    !input.hasHardwareEvidence && !input.hasTargetDesignEvidence,
    input.hasPbs === null && !input.hasBackupEvidence,
    input.hasCephExperience === null && input.hasVendorOrPartnerSupport === null,
  ].filter(Boolean).length;
}

function isExplicitNonCephTarget(targetPreference: string | null) {
  return ["zfs_local", "nfs", "san", "pbs"].includes(targetPreference ?? "");
}

function isSmallSimpleEnvironment(input: CephEvidenceInput) {
  const datastoreCount = input.rvtoolsDatastoreSummary.datastoreCount;
  const vmCount = input.rvtoolsDatastoreSummary.vmCount;

  return (
    input.needsHighAvailability !== true &&
    input.requiresSharedStorage !== true &&
    (datastoreCount === 0 || datastoreCount <= 2) &&
    (vmCount === 0 || vmCount <= 20)
  );
}

function determineCephStatus(
  input: CephEvidenceInput,
  scores: CephReadinessScores,
): CephSuitabilityStatus {
  if (!input.wantsCeph) {
    return isSmallSimpleEnvironment(input) ? "ceph_overkill" : "ceph_does_not_apply";
  }

  if (input.hasMinimumThreeNodes === false) {
    return "ceph_underdesigned";
  }

  if (input.hasDedicatedStorageNetwork === false && scores.cephSuitabilityScore < 55) {
    return "ceph_underdesigned";
  }

  if (criticalMissingCount(input) >= 3) {
    return "not_enough_evidence";
  }

  if (isSmallSimpleEnvironment(input) && scores.cephSuitabilityScore < 70) {
    return "ceph_overkill";
  }

  if (
    scores.cephSuitabilityScore >= 80 &&
    scores.cephEvidenceConfidenceScore >= 65 &&
    scores.networkReadinessScore >= 60 &&
    scores.cephOperationsReadinessScore >= 60 &&
    scores.backupReadinessScore >= 60 &&
    input.hasMinimumThreeNodes === true
  ) {
    return "ceph_applies";
  }

  if (scores.cephSuitabilityScore >= 55) {
    return "ceph_conditional";
  }

  if (scores.cephEvidenceConfidenceScore < 40 || criticalMissingCount(input) >= 2) {
    return "not_enough_evidence";
  }

  return isExplicitNonCephTarget(input.targetPreference)
    ? "ceph_does_not_apply"
    : "ceph_conditional";
}

function recommendedNextStepForStatus(
  status: CephSuitabilityStatus,
  scores: CephReadinessScores,
): CephRecommendedNextStep {
  switch (status) {
    case "ceph_applies":
      return "proceed_to_ceph_blueprint";
    case "ceph_conditional":
      return scores.cephEvidenceConfidenceScore >= 65 ? "run_pilot_first" : "remediate_before_ceph";
    case "ceph_overkill":
      return "use_zfs_or_existing_shared_storage";
    case "ceph_underdesigned":
      return "remediate_before_ceph";
    case "ceph_does_not_apply":
      return "avoid_ceph_for_this_case";
    case "not_enough_evidence":
      return "collect_more_evidence";
  }
}

function buildDecisionRationale(
  status: CephSuitabilityStatus,
  input: CephEvidenceInput,
  scores: CephReadinessScores,
) {
  const rationale = [
    `Ceph status is ${status} based on deterministic evidence rules, not AI preference.`,
    `Suitability score is ${scores.cephSuitabilityScore}/100 and evidence confidence is ${scores.cephEvidenceConfidenceScore}/100.`,
  ];

  if (!input.wantsCeph) {
    rationale.push("Ceph was not selected or strongly signaled as the target storage preference.");
  }

  if (input.hasMinimumThreeNodes === false) {
    rationale.push("The target does not meet the minimum three-node Ceph baseline.");
  } else if (input.hasMinimumThreeNodes === true) {
    rationale.push("The target reports at least three nodes, which is a baseline positive signal.");
  } else {
    rationale.push("Target node count is not confirmed.");
  }

  if (input.hasDedicatedStorageNetwork === true) {
    rationale.push("Dedicated storage networking is reported, but speed and topology should still be validated.");
  } else if (input.hasDedicatedStorageNetwork === false) {
    rationale.push("Dedicated storage networking is reported as unavailable.");
  } else {
    rationale.push("Storage network speed and separation are not confirmed.");
  }

  if (input.hasPbs === true || input.hasBackupEvidence) {
    rationale.push("Backup/PBS evidence is present as a positive recovery-readiness signal.");
  } else {
    rationale.push("Backup/PBS readiness remains incomplete.");
  }

  return rationale.slice(0, 8);
}

function buildSummary(status: CephSuitabilityStatus, input: CephEvidenceInput) {
  switch (status) {
    case "ceph_applies":
      return "Ceph appears defensible as a target storage candidate based on the available evidence, but it still requires blueprint-level validation before production.";
    case "ceph_conditional":
      return "Ceph may apply conditionally, but remediation or additional validation is required before treating it as the recommended storage destination.";
    case "ceph_overkill":
      return "Ceph appears unnecessary or excessive for the current evidence profile. ZFS local or existing shared storage should remain under consideration.";
    case "ceph_underdesigned":
      return "Ceph is underdesigned with the current target signals and should not be recommended until foundational requirements are remediated.";
    case "ceph_does_not_apply":
      return "Ceph does not currently apply because it is not selected or supported by the available target evidence.";
    case "not_enough_evidence":
      return input.wantsCeph
        ? "Ceph cannot be assessed defensibly yet because critical node, disk, network, backup or operations evidence is missing."
        : "Ceph is not selected and there is not enough evidence to evaluate it as a target option.";
  }
}

function buildAssumptions(input: CephEvidenceInput) {
  return [
    "This is a deterministic advisory evaluation and does not validate a live Ceph cluster.",
    "Customer-provided storage context and AI storage signals are advisory until confirmed by technical evidence.",
    "RVTools storage evidence describes the source environment, not the final Proxmox/Ceph target design.",
    "Ceph is not a backup system; backup/PBS readiness must be validated separately.",
    input.hasMinimumThreeNodes === true
      ? "The minimum three-node signal is treated as customer-provided structured input, not a confirmed target inventory."
      : "Exact target node count is not confirmed unless explicit evidence is attached.",
  ];
}

export function evaluateCephReadinessFromInput(input: CephEvidenceInput): CephReadinessResult {
  const scores = calculateCephReadinessScores(input);
  const findings = generateCephFindings(input, scores);
  const remediations = generateCephRemediations(input, scores, findings);
  const missingEvidence = buildCephMissingEvidence(input);
  const status = determineCephStatus(input, scores);

  return {
    status,
    summary: buildSummary(status, input),
    ...scores,
    decisionRationale: buildDecisionRationale(status, input, scores),
    findings,
    remediations,
    missingEvidence,
    assumptions: buildAssumptions(input),
    recommendedNextStep: recommendedNextStepForStatus(status, scores),
    engineVersion: CEPH_READINESS_ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
  };
}

function mergeCephReadinessIntoRecommendations(
  existingRecommendations: unknown,
  result: CephReadinessResult,
) {
  const base = isRecord(existingRecommendations) ? existingRecommendations : {};

  return {
    ...base,
    cephReadiness: result,
    cephReadinessVersion: CEPH_READINESS_ENGINE_VERSION,
    cephEvaluatedAt: result.generatedAt,
  };
}

function ensureStorageModuleNotSkipped(assessment: AssessmentDetail) {
  if (
    assessment.storageDestinationReadiness?.status === "skipped" ||
    assessment.storageContext?.status === "skipped"
  ) {
    throw new Error("Storage Destination Readiness is skipped. Re-enable storage inputs before Ceph evaluation.");
  }
}

export async function runCephReadinessAnalysis(params: ActorParams) {
  const assessment = await ensureAssessmentOwnership(params);
  ensureStorageModuleNotSkipped(assessment);

  const evidenceInput = extractCephEvidenceInput(assessment);
  const result = evaluateCephReadinessFromInput(evidenceInput);
  const recommendationsJson = mergeCephReadinessIntoRecommendations(
    assessment.storageAnalysis?.recommendationsJson,
    result,
  );
  const now = new Date(result.generatedAt);

  return prisma.$transaction(async (tx) => {
    const analysis = await tx.assessmentStorageAnalysis.upsert({
      where: { assessmentId: assessment.id },
      create: {
        assessmentId: assessment.id,
        status: AssessmentStorageAnalysisStatus.completed,
        storageReadinessScore: assessment.storageAnalysis?.storageReadinessScore ?? result.cephSuitabilityScore,
        storageEvidenceConfidence:
          assessment.storageAnalysis?.storageEvidenceConfidence ?? result.cephEvidenceConfidenceScore,
        cephSuitabilityStatus: result.status,
        interpretedSummary: assessment.storageAnalysis?.interpretedSummary ?? result.summary,
        missingEvidenceJson: json(result.missingEvidence),
        recommendationsJson: json(recommendationsJson),
        analysisVersion: CEPH_READINESS_ENGINE_VERSION,
        generatedAt: now,
      },
      update: {
        status: AssessmentStorageAnalysisStatus.completed,
        storageReadinessScore: assessment.storageAnalysis?.storageReadinessScore ?? result.cephSuitabilityScore,
        storageEvidenceConfidence:
          assessment.storageAnalysis?.storageEvidenceConfidence ?? result.cephEvidenceConfidenceScore,
        cephSuitabilityStatus: result.status,
        interpretedSummary: assessment.storageAnalysis?.interpretedSummary ?? result.summary,
        missingEvidenceJson: json(result.missingEvidence),
        recommendationsJson: json(recommendationsJson),
        analysisVersion: assessment.storageAnalysis?.analysisVersion ?? CEPH_READINESS_ENGINE_VERSION,
        generatedAt: now,
      },
    });

    await tx.auditEvent.create({
      data: {
        userId: params.userId,
        workspaceId: assessment.workspaceId,
        assessmentId: assessment.id,
        eventType: "ceph_readiness_evaluated",
        message: "Evaluated Ceph suitability and operations readiness.",
        metadataJson: json({
          status: result.status,
          targetStoragePreference: evidenceInput.targetPreference,
          currentStorageType: evidenceInput.currentStorageType,
          wantsCeph: evidenceInput.wantsCeph,
          activeStorageEvidenceFiles: activeEvidenceCount(evidenceInput),
          missingEvidenceCount: result.missingEvidence.length,
          cephSuitabilityScore: result.cephSuitabilityScore,
          cephOperationsReadinessScore: result.cephOperationsReadinessScore,
          cephEvidenceConfidenceScore: result.cephEvidenceConfidenceScore,
          engineVersion: CEPH_READINESS_ENGINE_VERSION,
        }),
      },
    });

    return analysis;
  });
}
