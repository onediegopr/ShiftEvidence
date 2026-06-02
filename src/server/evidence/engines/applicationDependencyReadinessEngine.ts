export type DependencyReadinessStatus =
  | "dependency_validated"
  | "dependency_partially_ready"
  | "dependency_requires_remediation"
  | "dependency_insufficient"
  | "dependency_not_validated";

export type DependencyReadinessConfidence = "low" | "medium" | "high";

export type ApplicationDependencySummaryForReadiness = {
  applicationCount: number;
  componentCount: number;
  vmRoleCount: number;
  dependencyCount: number;
  ownerCount: number;
  maintenanceWindowCount: number;
  migrationGroupCount: number;
  criticalVmCount: number;
  criticalApplicationCount: number;
  unmappedVmCount: number;
  unownedApplicationCount: number;
  criticalAppWithoutOwnerCount: number;
  criticalVmWithoutOwnerCount: number;
  missingMaintenanceWindowCount: number;
  circularDependencyCount: number;
  externalDependencyWithoutNotesCount: number;
  inconsistentMigrationGroupCount: number;
  lowConfidenceDependencyCount: number;
  inferredDependencyCount: number;
  functionalWaveCandidateCount: number;
  functionalWaveValidatedCount: number;
  technicalOnlyWaveCount: number;
  matchedVmCount: number;
  unmatchedVmCount: number;
  unmappedRvtoolsVmCount: number;
  rvtoolsVmCount: number;
  customerProvidedOnly: boolean;
  vmwareHintCount: number;
};

export type ApplicationDependencyReadinessInput = {
  summary: ApplicationDependencySummaryForReadiness;
  parserFailed?: boolean;
  collectorWarningCount?: number;
  collectorErrorCount?: number;
  rvtoolsVmAvailable?: boolean;
  vmwareEnrichmentAvailable?: boolean;
};

export type ApplicationDependencyReadinessResult = {
  dependencyReadinessStatus: DependencyReadinessStatus;
  confidence: DependencyReadinessConfidence;
  blockingIssues: string[];
  warnings: string[];
  recommendations: string[];
  wavePlanningMode: "technical_only" | "functional_candidate" | "functional_validated";
};

export function evaluateApplicationDependencyReadiness(
  input: ApplicationDependencyReadinessInput,
): ApplicationDependencyReadinessResult {
  const { summary } = input;
  const blockingIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const collectorWarnings = input.collectorWarningCount ?? 0;
  const collectorErrors = input.collectorErrorCount ?? 0;
  const hasDependencyEvidence =
    summary.applicationCount > 0 ||
    summary.vmRoleCount > 0 ||
    summary.dependencyCount > 0 ||
    summary.migrationGroupCount > 0;

  if (input.parserFailed || !hasDependencyEvidence) {
    return {
      dependencyReadinessStatus: "dependency_not_validated",
      confidence: "low",
      blockingIssues: [
        input.parserFailed
          ? "Application Dependency evidence could not be parsed."
          : "Application Dependency evidence does not include applications, VM roles, dependencies or migration groups.",
      ],
      warnings: [],
      recommendations: [
        "Upload valid Shift Evidence Application Dependency CSV or JSON evidence before relying on functional wave planning.",
      ],
      wavePlanningMode: "technical_only",
    };
  }

  if (summary.applicationCount === 0) {
    blockingIssues.push("No application groups were provided.");
    recommendations.push("Map VMs to application groups before defining functional migration waves.");
  }

  if (summary.rvtoolsVmCount > 0 && summary.unmappedRvtoolsVmCount > Math.floor(summary.rvtoolsVmCount / 2)) {
    blockingIssues.push("Most RVTools VMs are not mapped to application dependency evidence.");
    recommendations.push("Classify critical VMs before defining production migration waves.");
  }

  if (summary.criticalVmWithoutOwnerCount > 0 || summary.criticalAppWithoutOwnerCount > 0) {
    blockingIssues.push("Critical applications or VMs are missing owner evidence.");
    recommendations.push("Assign application owners for critical workloads.");
  }

  if (summary.maintenanceWindowCount === 0 && (summary.criticalApplicationCount > 0 || summary.criticalVmCount > 0)) {
    blockingIssues.push("Critical workloads do not include maintenance-window evidence.");
    recommendations.push("Define maintenance windows before cutover planning.");
  }

  if (!input.rvtoolsVmAvailable) {
    warnings.push("Application Dependency evidence uploaded before RVTools inventory; VM matching is limited.");
  }

  if (!input.vmwareEnrichmentAvailable) {
    warnings.push("VMware Enrichment evidence is not available; tags and folders cannot improve dependency hints.");
  }

  if (summary.unmatchedVmCount > 0) {
    warnings.push("Some application dependency VMs could not be matched to parsed RVTools inventory.");
    recommendations.push("Review unmatched VM names and UUIDs before migration wave sequencing.");
  }

  if (summary.unmappedRvtoolsVmCount > 0) {
    warnings.push("Some RVTools VMs are not mapped to application groups.");
    recommendations.push("Do not treat technical grouping as functional wave validation.");
  }

  if (summary.unownedApplicationCount > 0) {
    warnings.push("Some applications are missing owner evidence.");
    recommendations.push("Assign application owners for critical workloads.");
  }

  if (summary.missingMaintenanceWindowCount > 0) {
    warnings.push("Some application groups are missing maintenance windows.");
    recommendations.push("Define maintenance windows before cutover planning.");
  }

  if (summary.circularDependencyCount > 0) {
    warnings.push("Circular or ambiguous dependencies were detected.");
    recommendations.push("Resolve circular or ambiguous dependencies before Migration Recommendation Plan.");
  }

  if (summary.externalDependencyWithoutNotesCount > 0) {
    warnings.push("External dependencies are missing notes or validation context.");
    recommendations.push("Document external dependencies and approval constraints before cutover planning.");
  }

  if (summary.inconsistentMigrationGroupCount > 0) {
    warnings.push("Migration group evidence includes inconsistent must-move/can-move-separately signals.");
    recommendations.push("Review must-move-together groups before sequencing.");
  }

  if (summary.lowConfidenceDependencyCount > 0 || summary.inferredDependencyCount > 0) {
    warnings.push("Some dependencies are low-confidence or inferred hints.");
    recommendations.push("Review inferred or low-confidence dependencies with application owners.");
  }

  if (collectorWarnings > 0) {
    warnings.push("Parser reported warnings; review dependency evidence completeness.");
  }

  if (collectorErrors > 0) {
    warnings.push("Parser reported non-fatal errors; dependency evidence may be partial.");
  }

  if (blockingIssues.length > 0) {
    return {
      dependencyReadinessStatus: "dependency_insufficient",
      confidence: "low",
      blockingIssues,
      warnings: [...new Set(warnings)],
      recommendations: [...new Set(recommendations)],
      wavePlanningMode: "technical_only",
    };
  }

  const remediationRequired =
    summary.circularDependencyCount > 0 ||
    summary.externalDependencyWithoutNotesCount > 0 ||
    summary.inconsistentMigrationGroupCount > 0 ||
    summary.unmatchedVmCount > 0 ||
    summary.lowConfidenceDependencyCount > 0 ||
    summary.inferredDependencyCount > 0 ||
    collectorErrors > 0;

  if (remediationRequired) {
    return {
      dependencyReadinessStatus: "dependency_requires_remediation",
      confidence: "medium",
      blockingIssues,
      warnings: [...new Set(warnings)],
      recommendations: [...new Set(recommendations)],
      wavePlanningMode: summary.functionalWaveCandidateCount > 0 ? "functional_candidate" : "technical_only",
    };
  }

  const functionalCandidate =
    summary.applicationCount > 0 &&
    summary.dependencyCount > 0 &&
    summary.ownerCount > 0 &&
    summary.maintenanceWindowCount > 0 &&
    summary.migrationGroupCount > 0;

  const strongCoverage =
    input.rvtoolsVmAvailable &&
    summary.rvtoolsVmCount > 0 &&
    summary.matchedVmCount >= Math.ceil(summary.rvtoolsVmCount * 0.8) &&
    summary.unmappedRvtoolsVmCount <= Math.floor(summary.rvtoolsVmCount * 0.2);

  const canValidateFunctional =
    functionalCandidate &&
    strongCoverage &&
    summary.functionalWaveValidatedCount > 0 &&
    !summary.customerProvidedOnly &&
    summary.missingMaintenanceWindowCount === 0 &&
    summary.unownedApplicationCount === 0 &&
    warnings.length === 0;

  if (canValidateFunctional) {
    return {
      dependencyReadinessStatus: "dependency_validated",
      confidence: "high",
      blockingIssues,
      warnings: [],
      recommendations: [
        "Application dependency evidence is strong enough for preliminary functional wave planning; validate final sequencing with owners before cutover.",
      ],
      wavePlanningMode: "functional_validated",
    };
  }

  if (functionalCandidate) {
    return {
      dependencyReadinessStatus: "dependency_partially_ready",
      confidence: "medium",
      blockingIssues,
      warnings: [...new Set([
        ...warnings,
        summary.customerProvidedOnly
          ? "Functional wave candidates require customer review before execution."
          : "Functional wave evidence is preliminary until final owner review.",
      ])],
      recommendations: [
        ...new Set([
          ...recommendations,
          "Treat functional waves as candidates until dependency evidence is reviewed by application owners.",
        ]),
      ],
      wavePlanningMode: "functional_candidate",
    };
  }

  return {
    dependencyReadinessStatus: "dependency_partially_ready",
    confidence: "medium",
    blockingIssues,
    warnings: [...new Set([
      ...warnings,
      "Migration waves are technical-only and should not be treated as validated functional waves.",
    ])],
    recommendations: [
      ...new Set([
        ...recommendations,
        "Add owners, dependencies and maintenance windows to move beyond technical-only migration grouping.",
      ]),
    ],
    wavePlanningMode: "technical_only",
  };
}
