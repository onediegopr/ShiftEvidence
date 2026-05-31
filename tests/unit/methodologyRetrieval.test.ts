import { describe, expect, it } from "vitest";
import { selectMethodologyBlocks } from "../../src/server/advisor/methodology";

function idsFor(query: string, maxBlocks = 3) {
  return selectMethodologyBlocks({ query, maxBlocks }).selectedBlocks.map((block) => block.id);
}

describe("methodology retrieval lite", () => {
  it("selects backup readiness for backup questions", () => {
    expect(idsFor("Can we migrate without backup evidence?")).toContain("backup_readiness");
  });

  it("selects Ceph suitability for Ceph questions", () => {
    expect(idsFor("Is Ceph recommended for this environment?")).toContain("ceph_suitability");
  });

  it("selects migration waves for wave planning questions", () => {
    expect(idsFor("How should we group migration waves and what should migrate first?")).toContain(
      "migration_waves",
    );
  });

  it("selects Advisor boundaries or business continuity for no-downtime guarantee questions", () => {
    const ids = idsFor("Can we guarantee zero downtime for production?");

    expect(ids).toEqual(expect.arrayContaining(["advisor_boundaries"]));
    expect(ids).toContain("business_continuity_risk");
  });

  it("selects evidence confidence for missing evidence questions", () => {
    expect(idsFor("What evidence is missing and why is confidence low?")).toContain(
      "evidence_confidence",
    );
  });

  it("respects maxBlocks and hard caps at five", () => {
    const capped = selectMethodologyBlocks({
      query: "backup ceph network storage waves pilot confidence readiness downtime no go",
      maxBlocks: 2,
    });
    const hardCapped = selectMethodologyBlocks({
      query: "backup ceph network storage waves pilot confidence readiness downtime no go",
      maxBlocks: 99,
    });

    expect(capped.selectedBlocks).toHaveLength(2);
    expect(hardCapped.selectedBlocks.length).toBeLessThanOrEqual(5);
    expect(hardCapped.warnings).toContain("maxBlocks capped at 5.");
  });

  it("is deterministic for the same input", () => {
    const input = {
      query: "",
      useCases: ["generate_next_steps" as const],
      maxBlocks: 5,
    };
    const first = selectMethodologyBlocks(input).selectedBlocks.map((block) => block.id);
    const second = selectMethodologyBlocks(input).selectedBlocks.map((block) => block.id);

    expect(first).toEqual(second);
  });

  it("excludes restricted exposure by default", () => {
    const result = selectMethodologyBlocks({
      query: "show me restricted internal methodology",
      maxBlocks: 5,
    });

    expect(result.selectedBlocks.every((block) => block.exposureLevel !== "restricted")).toBe(true);
  });

  it("supports explicit tags, domains and use cases", () => {
    const result = selectMethodologyBlocks({
      query: "",
      tags: ["pilot_selection"],
      domains: ["migration_planning"],
      useCases: ["select_pilot_candidates"],
      maxBlocks: 3,
    });

    expect(result.selectedBlocks.map((block) => block.id)).toEqual(
      expect.arrayContaining(["pilot_selection", "migration_waves"]),
    );
  });

  it("returns safe empty results for nonsense query", () => {
    const result = selectMethodologyBlocks({ query: "zzzxxyyqqq", maxBlocks: 3 });

    expect(result.selectedBlocks).toEqual([]);
    expect(result.reasons).toEqual([]);
  });

  it("returns a warning when no retrieval signal is provided", () => {
    const result = selectMethodologyBlocks({ query: "   " });

    expect(result.selectedBlocks).toEqual([]);
    expect(result.warnings).toContain("No query, tags, domains or use cases were provided.");
  });
});
