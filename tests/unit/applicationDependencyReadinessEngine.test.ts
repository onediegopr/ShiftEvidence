import { describe, expect, it } from "vitest";
import {
  evaluateApplicationDependencyReadiness,
  type ApplicationDependencySummaryForReadiness,
} from "../../src/server/evidence/engines/applicationDependencyReadinessEngine";

const strongSummary: ApplicationDependencySummaryForReadiness = {
  applicationCount: 1,
  componentCount: 2,
  vmRoleCount: 2,
  dependencyCount: 1,
  ownerCount: 1,
  maintenanceWindowCount: 1,
  migrationGroupCount: 1,
  criticalVmCount: 1,
  criticalApplicationCount: 1,
  unmappedVmCount: 0,
  unownedApplicationCount: 0,
  criticalAppWithoutOwnerCount: 0,
  criticalVmWithoutOwnerCount: 0,
  missingMaintenanceWindowCount: 0,
  circularDependencyCount: 0,
  externalDependencyWithoutNotesCount: 0,
  inconsistentMigrationGroupCount: 0,
  lowConfidenceDependencyCount: 0,
  inferredDependencyCount: 0,
  functionalWaveCandidateCount: 1,
  functionalWaveValidatedCount: 0,
  technicalOnlyWaveCount: 0,
  matchedVmCount: 2,
  unmatchedVmCount: 0,
  unmappedRvtoolsVmCount: 0,
  rvtoolsVmCount: 2,
  customerProvidedOnly: true,
  vmwareHintCount: 2,
};

describe("Application Dependency readiness engine", () => {
  it("does not validate empty dependency evidence", () => {
    const result = evaluateApplicationDependencyReadiness({
      parserFailed: true,
      summary: { ...strongSummary, applicationCount: 0, vmRoleCount: 0, dependencyCount: 0, migrationGroupCount: 0 },
    });

    expect(result.dependencyReadinessStatus).toBe("dependency_not_validated");
    expect(result.wavePlanningMode).toBe("technical_only");
  });

  it("marks missing application groups as insufficient", () => {
    const result = evaluateApplicationDependencyReadiness({
      summary: { ...strongSummary, applicationCount: 0, dependencyCount: 0 },
      rvtoolsVmAvailable: true,
      vmwareEnrichmentAvailable: true,
    });

    expect(result.dependencyReadinessStatus).toBe("dependency_insufficient");
    expect(result.blockingIssues.join(" ")).toContain("No application groups");
  });

  it("flags missing critical owners and maintenance windows", () => {
    const result = evaluateApplicationDependencyReadiness({
      summary: {
        ...strongSummary,
        ownerCount: 0,
        maintenanceWindowCount: 0,
        criticalAppWithoutOwnerCount: 1,
        criticalVmWithoutOwnerCount: 1,
      },
      rvtoolsVmAvailable: true,
      vmwareEnrichmentAvailable: true,
    });

    expect(result.dependencyReadinessStatus).toBe("dependency_insufficient");
    expect(result.recommendations.join(" ")).toContain("owners");
    expect(result.recommendations.join(" ")).toContain("maintenance windows");
  });

  it("requires remediation for circular or low-confidence dependencies", () => {
    const result = evaluateApplicationDependencyReadiness({
      summary: { ...strongSummary, circularDependencyCount: 1, lowConfidenceDependencyCount: 1 },
      rvtoolsVmAvailable: true,
      vmwareEnrichmentAvailable: true,
    });

    expect(result.dependencyReadinessStatus).toBe("dependency_requires_remediation");
    expect(result.warnings.join(" ")).toContain("Circular");
  });

  it("prefers functional candidates over validation for customer-provided-only evidence", () => {
    const result = evaluateApplicationDependencyReadiness({
      summary: strongSummary,
      rvtoolsVmAvailable: true,
      vmwareEnrichmentAvailable: true,
    });

    expect(result.dependencyReadinessStatus).toBe("dependency_partially_ready");
    expect(result.wavePlanningMode).toBe("functional_candidate");
    expect(result.warnings.join(" ")).toContain("customer review");
  });

  it("validates only when strong evidence is not customer-provided-only", () => {
    const result = evaluateApplicationDependencyReadiness({
      summary: { ...strongSummary, customerProvidedOnly: false, functionalWaveValidatedCount: 1 },
      rvtoolsVmAvailable: true,
      vmwareEnrichmentAvailable: true,
    });

    expect(result.dependencyReadinessStatus).toBe("dependency_validated");
    expect(result.wavePlanningMode).toBe("functional_validated");
  });
});
