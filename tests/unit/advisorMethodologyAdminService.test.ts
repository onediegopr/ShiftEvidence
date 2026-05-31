import { describe, expect, it } from "vitest";
import { METHODOLOGY_BLOCK_IDS } from "../../src/server/advisor/methodology";
import {
  buildAdvisorMethodologyUsageStatsFromEvents,
  getAdvisorMethodologyKbHealth,
  getAdvisorMethodologyRuntimeStatus,
} from "../../src/server/admin/advisorMethodologyAdminService";

describe("advisor methodology admin visibility", () => {
  it("keeps runtime activation disabled unless the env flag is exactly true", () => {
    expect(getAdvisorMethodologyRuntimeStatus({}).enabled).toBe(false);
    expect(getAdvisorMethodologyRuntimeStatus({ ADVISOR_METHODOLOGY_CONTEXT_ENABLED: "TRUE" }).enabled).toBe(false);
    expect(getAdvisorMethodologyRuntimeStatus({ ADVISOR_METHODOLOGY_CONTEXT_ENABLED: " false " }).enabled).toBe(false);
    expect(getAdvisorMethodologyRuntimeStatus({ ADVISOR_METHODOLOGY_CONTEXT_ENABLED: "true" })).toMatchObject({
      enabled: true,
      valueDescription: "enabled_explicit_true",
      defaultEnabled: false,
      activationMode: "env",
    });
  });

  it("does not expose raw env values in runtime status", () => {
    const status = getAdvisorMethodologyRuntimeStatus({
      ADVISOR_METHODOLOGY_CONTEXT_ENABLED: "super-secret-non-true-value",
    });
    const serialized = JSON.stringify(status);

    expect(status.rawValuePresent).toBe(true);
    expect(status.valueDescription).toBe("disabled_non_true_value");
    expect(serialized).not.toContain("super-secret-non-true-value");
  });

  it("summarizes methodology KB health without exposing block content", () => {
    const health = getAdvisorMethodologyKbHealth();
    const serialized = JSON.stringify(health);

    expect(health.ok).toBe(true);
    expect(health.activeBlocks).toBeGreaterThanOrEqual(12);
    expect(health.activeBlockIds.sort()).toEqual([...METHODOLOGY_BLOCK_IDS].sort());
    expect(health.blockSummaries[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
        version: expect.any(String),
        exposureLevel: expect.any(String),
      }),
    );
    expect(serialized).not.toContain('"content"');
    expect(serialized).not.toContain("Purpose:");
    expect(serialized).not.toContain("Core principles:");
  });

  it("aggregates methodology usage from sanitized metadata only", () => {
    const now = new Date("2026-05-31T12:00:00.000Z");
    const stats = buildAdvisorMethodologyUsageStatsFromEvents(
      [
        {
          createdAt: now,
          status: "success",
          metadataJson: {
            methodologyContextEnabled: true,
            methodologyContextStatus: "included",
            methodologyBlockCount: 2,
            methodologyBlockIds: ["evidence_confidence", "backup_readiness"],
            methodologyWarningsCount: 1,
            methodologyBlockedReasonsCount: 0,
            prompt: "do not expose this prompt",
            response: "do not expose this response",
            previewText: "do not expose preview text",
          },
        },
        {
          createdAt: new Date("2026-05-31T11:00:00.000Z"),
          status: "success",
          metadataJson: {
            methodologyContextEnabled: true,
            methodologyContextStatus: "skipped",
            methodologyBlockCount: 0,
            methodologyWarningsCount: 0,
            methodologyBlockedReasonsCount: 2,
          },
        },
        {
          createdAt: new Date("2026-05-31T10:00:00.000Z"),
          status: "error",
          metadataJson: {
            methodologyContextEnabled: true,
            methodologyContextStatus: "error",
            methodologyContextErrorCode: "preview_failed",
          },
        },
        {
          createdAt: new Date("2026-05-31T09:00:00.000Z"),
          status: "disabled",
          metadataJson: {
            methodologyContextEnabled: false,
            methodologyContextStatus: "disabled",
          },
        },
        {
          createdAt: new Date("2026-05-31T08:00:00.000Z"),
          status: "success",
          metadataJson: {
            unrelated: "event",
          },
        },
      ],
      30,
    );
    const serialized = JSON.stringify(stats);

    expect(stats.totalAdvisorEvents).toBe(5);
    expect(stats.methodologyTrackedEvents).toBe(4);
    expect(stats.methodologyEnabledEvents).toBe(3);
    expect(stats.includedCount).toBe(1);
    expect(stats.skippedCount).toBe(1);
    expect(stats.errorCount).toBe(1);
    expect(stats.disabledCount).toBe(1);
    expect(stats.averageBlockCount).toBe(2);
    expect(stats.totalWarnings).toBe(1);
    expect(stats.totalBlockedReasons).toBe(2);
    expect(stats.topBlockIds).toEqual([
      { id: "backup_readiness", count: 1 },
      { id: "evidence_confidence", count: 1 },
    ]);
    expect(serialized).not.toContain("do not expose this prompt");
    expect(serialized).not.toContain("do not expose this response");
    expect(serialized).not.toContain("do not expose preview text");
  });
});
