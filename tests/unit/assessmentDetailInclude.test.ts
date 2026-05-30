import { describe, expect, it } from "vitest";
import {
  assessmentCoreInclude,
  assessmentDetailInclude,
} from "../../src/server/assessments/assessmentService";

describe("assessment detail Prisma include", () => {
  it("keeps Storage/Ceph relations out of the core assessment query", () => {
    expect(assessmentDetailInclude).toBe(assessmentCoreInclude);
    expect("storageDestinationReadiness" in assessmentDetailInclude).toBe(false);
    expect("storageContext" in assessmentDetailInclude).toBe(false);
    expect("storageAnalysis" in assessmentDetailInclude).toBe(false);
    expect("storageEvidence" in assessmentDetailInclude).toBe(false);
  });

  it("uses workspace scalar owner id instead of the owner relation in core queries", () => {
    const workspaceSelect = assessmentDetailInclude.workspace.select;

    expect(workspaceSelect.ownerUserId).toBe(true);
    expect("ownerUser" in workspaceSelect).toBe(false);
  });
});
