import { describe, expect, it } from "vitest";
import {
  evaluateBackupReadiness,
  type BackupEvidenceSummaryForReadiness,
} from "../../src/server/evidence/engines/backupReadinessEngine";

const baseSummary: BackupEvidenceSummaryForReadiness = {
  jobCount: 2,
  enabledJobCount: 2,
  disabledJobCount: 0,
  protectedObjectCount: 4,
  matchedVmCount: 4,
  unmatchedProtectedObjectCount: 0,
  unprotectedVmCount: 0,
  restorePointObjectCount: 4,
  staleBackupCount: 0,
  missingRestorePointCount: 0,
  failedJobCount: 0,
  warningJobCount: 0,
  repositoryCount: 1,
  repositoryPressureCount: 0,
  backupCopyJobCount: 1,
  restoreTestingEvidenceCount: 1,
  rvtoolsVmCount: 4,
};

describe("backup readiness engine", () => {
  it("returns backup_not_validated when parsing failed", () => {
    const result = evaluateBackupReadiness({ summary: baseSummary, parserFailed: true });

    expect(result.backupReadinessStatus).toBe("backup_not_validated");
    expect(result.confidence).toBe("low");
  });

  it("returns backup_insufficient when no protected objects are detected", () => {
    const result = evaluateBackupReadiness({
      summary: {
        ...baseSummary,
        protectedObjectCount: 0,
        matchedVmCount: 0,
        restorePointObjectCount: 0,
      },
      rvtoolsInventoryAvailable: true,
    });

    expect(result.backupReadinessStatus).toBe("backup_insufficient");
    expect(result.blockingIssues.join(" ")).toContain("No protected");
  });

  it("flags unprotected VMs", () => {
    const result = evaluateBackupReadiness({
      summary: {
        ...baseSummary,
        matchedVmCount: 2,
        unprotectedVmCount: 2,
      },
      rvtoolsInventoryAvailable: true,
    });

    expect(result.backupReadinessStatus).toBe("backup_requires_remediation");
    expect(result.recommendations.join(" ")).toContain("unprotected");
  });

  it("flags stale backups", () => {
    const result = evaluateBackupReadiness({
      summary: {
        ...baseSummary,
        staleBackupCount: 1,
      },
      rvtoolsInventoryAvailable: true,
    });

    expect(result.backupReadinessStatus).toBe("backup_requires_remediation");
    expect(result.warnings.join(" ")).toContain("stale");
  });

  it("flags failed jobs", () => {
    const result = evaluateBackupReadiness({
      summary: {
        ...baseSummary,
        failedJobCount: 1,
      },
      rvtoolsInventoryAvailable: true,
    });

    expect(result.backupReadinessStatus).toBe("backup_requires_remediation");
    expect(result.recommendations.join(" ")).toContain("failed backup jobs");
  });

  it("flags repository pressure", () => {
    const result = evaluateBackupReadiness({
      summary: {
        ...baseSummary,
        repositoryPressureCount: 1,
      },
      rvtoolsInventoryAvailable: true,
    });

    expect(result.backupReadinessStatus).toBe("backup_requires_remediation");
    expect(result.recommendations.join(" ")).toContain("repository free space");
  });

  it("prefers partially ready over validated when no restore testing evidence exists", () => {
    const result = evaluateBackupReadiness({
      summary: {
        ...baseSummary,
        restoreTestingEvidenceCount: 0,
      },
      rvtoolsInventoryAvailable: true,
    });

    expect(result.backupReadinessStatus).toBe("backup_partially_ready");
    expect(result.warnings.join(" ")).toContain("restore success");
  });

  it("returns backup_validated only for strong evidence with restore testing", () => {
    const result = evaluateBackupReadiness({
      summary: baseSummary,
      rvtoolsInventoryAvailable: true,
    });

    expect(result.backupReadinessStatus).toBe("backup_validated");
    expect(result.confidence).toBe("high");
  });
});
