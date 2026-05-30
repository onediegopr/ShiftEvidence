import { describe, expect, it } from "vitest";
import {
  buildStorageReadinessAuditMetadata,
  parseStorageEvidenceClassification,
  validateStorageContextText,
  validateStorageEvidenceFileLimit,
  validateStorageReadinessFormData,
} from "../../src/server/assessments/storageReadinessValidation";
import { getStorageReadinessPlanLimits } from "../../src/server/assessments/storageReadinessPlanLimits";

describe("storage readiness validation", () => {
  it("validates allowed current storage type and target preference", () => {
    const formData = new FormData();
    formData.set("currentStorageType", "vsan");
    formData.set("targetStoragePreference", "ceph");
    formData.set("estimatedGrowthPercent3y", "35");
    formData.set("needsHighAvailability", "true");

    const validated = validateStorageReadinessFormData(formData);

    expect(validated.currentStorageType).toBe("vsan");
    expect(validated.targetStoragePreference).toBe("ceph");
    expect(validated.mode).toBe("ceph_candidate");
    expect(validated.estimatedGrowthPercent3y).toBe(35);
    expect(validated.needsHighAvailability).toBe(true);
  });

  it("rejects unsupported storage values", () => {
    const formData = new FormData();
    formData.set("currentStorageType", "iscsi-but-not-normalized");

    expect(() => validateStorageReadinessFormData(formData)).toThrow(
      "Unsupported current storage type.",
    );
  });

  it("rejects invalid growth percent", () => {
    const formData = new FormData();
    formData.set("estimatedGrowthPercent3y", "-1");

    expect(() => validateStorageReadinessFormData(formData)).toThrow(
      "Expected 3-year storage growth must be between 0 and 1,000 percent.",
    );
  });

  it("enforces storage free-text word limits", () => {
    const limits = {
      ...getStorageReadinessPlanLimits("starter"),
      maxStorageContextWords: 3,
      maxStorageContextCharacters: 100,
    };

    expect(() =>
      validateStorageContextText({
        rawText: "one two three four",
        limits,
      }),
    ).toThrow("Storage context is over the 3 word limit");
  });

  it("allows only approved storage evidence classifications", () => {
    expect(parseStorageEvidenceClassification("ceph_df")).toBe("ceph_df");
    expect(() => parseStorageEvidenceClassification("powershell_script")).toThrow(
      "Unsupported storage evidence classification.",
    );
  });

  it("enforces storage evidence file limits", () => {
    const limits = getStorageReadinessPlanLimits("starter");

    expect(() =>
      validateStorageEvidenceFileLimit({
        existingFileCount: 1,
        limits,
      }),
    ).toThrow("This plan allows up to 1 storage evidence file.");
  });

  it("does not include raw text in audit metadata", () => {
    const metadata = buildStorageReadinessAuditMetadata({
      status: "submitted",
      wordCount: 20,
      characterCount: 150,
      targetStoragePreference: "ceph",
    });

    expect(JSON.stringify(metadata)).not.toContain("password");
    expect(metadata).toEqual({
      status: "submitted",
      currentStorageType: null,
      targetStoragePreference: "ceph",
      mode: null,
      wordCount: 20,
      characterCount: 150,
      planLimitWords: null,
      planLimitFiles: null,
      classification: null,
      storageEvidenceId: null,
      evidenceFileId: null,
      includedInStorageAnalysis: null,
    });
  });
});
