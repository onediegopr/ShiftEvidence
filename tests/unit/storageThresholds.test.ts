import { describe, expect, it } from "vitest";
import {
  STORAGE_HIGH_USAGE_THRESHOLD_PERCENT,
  isHighUsageDatastore,
} from "../../src/server/assessments/storageThresholds";

describe("storage threshold constants", () => {
  it("uses 80 percent as the single high-usage datastore threshold", () => {
    expect(STORAGE_HIGH_USAGE_THRESHOLD_PERCENT).toBe(80);
    expect(isHighUsageDatastore({ usagePercent: 79.9 })).toBe(false);
    expect(isHighUsageDatastore({ usagePercent: 80 })).toBe(true);
  });

  it("uses the matching free-capacity ratio when usage percent is missing", () => {
    expect(isHighUsageDatastore({ capacityGb: 100, freeGb: 21 })).toBe(false);
    expect(isHighUsageDatastore({ capacityGb: 100, freeGb: 20 })).toBe(true);
  });
});
