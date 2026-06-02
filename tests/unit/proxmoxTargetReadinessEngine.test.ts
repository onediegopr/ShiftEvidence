import { describe, expect, it } from "vitest";
import {
  evaluateProxmoxTargetReadiness,
  type ProxmoxTargetSummaryForReadiness,
} from "../../src/server/evidence/engines/proxmoxTargetReadinessEngine";

const baseSummary: ProxmoxTargetSummaryForReadiness = {
  nodeCount: 3,
  onlineNodeCount: 3,
  offlineNodeCount: 0,
  totalCpuCores: 96,
  totalMemoryGb: 384,
  usedMemoryGb: 96,
  memoryUsagePercent: 25,
  storageCount: 3,
  sharedStorageCount: 2,
  totalStorageGb: 9000,
  freeStorageGb: 6000,
  storageUsagePercent: 33,
  vmCount: 0,
  containerCount: 0,
  haConfigured: true,
  haResourceCount: 2,
  pbsDetected: true,
  pbsStorageCount: 1,
  cephDetected: true,
  cephHealth: "health_ok",
  zfsDetected: false,
  bridgeCount: 2,
  vlanAwareBridgeCount: 2,
};

describe("Proxmox target readiness engine", () => {
  it("returns target_not_validated when parsing failed", () => {
    const result = evaluateProxmoxTargetReadiness({ summary: baseSummary, parserFailed: true });

    expect(result.targetStatus).toBe("target_not_validated");
    expect(result.confidence).toBe("low");
  });

  it("returns target_insufficient for offline/no-network target", () => {
    const result = evaluateProxmoxTargetReadiness({
      summary: {
        ...baseSummary,
        onlineNodeCount: 0,
        bridgeCount: 0,
        vlanAwareBridgeCount: 0,
      },
      rvtoolsComparisonAvailable: true,
    });

    expect(result.targetStatus).toBe("target_insufficient");
    expect(result.blockingIssues.length).toBeGreaterThan(0);
  });

  it("returns target_requires_remediation for constrained storage", () => {
    const result = evaluateProxmoxTargetReadiness({
      summary: {
        ...baseSummary,
        storageUsagePercent: 82,
      },
      rvtoolsComparisonAvailable: true,
    });

    expect(result.targetStatus).toBe("target_requires_remediation");
    expect(result.recommendations.join(" ")).toContain("storage");
  });

  it("prefers partially ready over validated when context is incomplete", () => {
    const result = evaluateProxmoxTargetReadiness({
      summary: {
        ...baseSummary,
        pbsDetected: false,
        pbsStorageCount: 0,
      },
      rvtoolsComparisonAvailable: true,
    });

    expect(result.targetStatus).toBe("target_partially_ready");
    expect(result.warnings.join(" ")).toContain("PBS");
  });

  it("returns target_validated only for strong evidence", () => {
    const result = evaluateProxmoxTargetReadiness({
      summary: baseSummary,
      rvtoolsComparisonAvailable: true,
    });

    expect(result.targetStatus).toBe("target_validated");
    expect(result.confidence).toBe("high");
  });

  it("does not require PBS as a hard blocker", () => {
    const result = evaluateProxmoxTargetReadiness({
      summary: {
        ...baseSummary,
        pbsDetected: false,
        pbsStorageCount: 0,
      },
      rvtoolsComparisonAvailable: true,
    });

    expect(result.targetStatus).not.toBe("target_insufficient");
  });

  it("does not overclaim Ceph readiness when health is unhealthy", () => {
    const result = evaluateProxmoxTargetReadiness({
      summary: {
        ...baseSummary,
        cephHealth: "health_warn",
      },
      rvtoolsComparisonAvailable: true,
    });

    expect(result.targetStatus).toBe("target_requires_remediation");
    expect(result.recommendations.join(" ")).toContain("Ceph");
  });
});
