import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

describe("landing storage and licensing visibility", () => {
  it("shows conservative Storage/Ceph and Licensing value messaging", () => {
    const landing = readFileSync("src/views/LandingPage.tsx", "utf8");
    const shiftReadiness = readFileSync("src/views/ShiftReadinessPage.tsx", "utf8");

    expect(landing).toContain("Storage & Ceph Readiness");
    expect(landing).toContain("Ceph is never treated as the default recommendation");
    expect(landing).toContain("Licensing & Cost Exposure");
    expect(landing).toContain("Not a vendor quote");
    expect(shiftReadiness).toContain("Ceph Suitability & Operations Readiness when relevant");
    expect(shiftReadiness).toContain("Ceph as a default recommendation");
  });
});
