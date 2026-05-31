import { describe, expect, it } from "vitest";
import {
  METHODOLOGY_BLOCKS,
  METHODOLOGY_BLOCK_IDS,
  assertMethodologyRegistryValid,
  getActiveMethodologyBlocks,
  getAllMethodologyBlocks,
  getMethodologyBlockById,
  getMethodologyBlocksByDomain,
  getMethodologyBlocksByExposure,
  getMethodologyBlocksByTags,
  validateMethodologyRegistry,
  type MethodologyBlock,
} from "../../src/server/advisor/methodology";
import { GLOBAL_FORBIDDEN_OVERCLAIM_PHRASES } from "../../src/server/advisor/methodology/evaluation";

describe("static methodology registry", () => {
  it("has the expected active catalog baseline", () => {
    const active = getActiveMethodologyBlocks();

    expect(active.length).toBeGreaterThanOrEqual(12);
    expect(active.map((block) => block.id).sort()).toEqual([...METHODOLOGY_BLOCK_IDS].sort());
  });

  it("keeps block ids unique and registry-valid", () => {
    const ids = METHODOLOGY_BLOCKS.map((block) => block.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(assertMethodologyRegistryValid()).toMatchObject({
      ok: true,
      blockCount: METHODOLOGY_BLOCKS.length,
      activeBlockCount: METHODOLOGY_BLOCKS.length,
    });
  });

  it("requires semver-like versions and content fields", () => {
    const result = validateMethodologyRegistry([
      {
        ...METHODOLOGY_BLOCKS[0],
        version: "v1",
        title: "",
        summary: "",
        content: "",
      },
    ]);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "Block evidence_confidence has invalid version v1.",
        "Block evidence_confidence is missing title.",
        "Block evidence_confidence is missing summary.",
        "Block evidence_confidence is missing content.",
      ]),
    );
  });

  it("requires tags, keywords and existing related block ids", () => {
    const result = validateMethodologyRegistry([
      {
        ...METHODOLOGY_BLOCKS[0],
        tags: [],
        keywords: [],
        relatedBlockIds: ["advisor_boundaries", "missing_block"] as MethodologyBlock["relatedBlockIds"],
      },
    ]);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "Block evidence_confidence must define at least one tag.",
        "Block evidence_confidence must define at least one keyword.",
        "Block evidence_confidence references missing related block missing_block.",
      ]),
    );
  });

  it("rejects banned secret-like content patterns", () => {
    const result = validateMethodologyRegistry([
      {
        ...METHODOLOGY_BLOCKS[0],
        content: "Do not store DATABASE_URL or password= values in methodology blocks.",
      },
    ]);

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("banned content pattern");
  });

  it("exposes access helpers without DB or runtime state", () => {
    expect(getAllMethodologyBlocks()).toHaveLength(METHODOLOGY_BLOCKS.length);
    expect(getMethodologyBlockById("ceph_suitability")?.title).toBe("Ceph Suitability");
    expect(getMethodologyBlocksByDomain("backup").map((block) => block.id)).toEqual([
      "backup_readiness",
    ]);
    expect(getMethodologyBlocksByTags(["ceph"]).map((block) => block.id)).toEqual([
      "ceph_suitability",
      "network_readiness",
    ]);
    expect(getMethodologyBlocksByExposure("restricted")).toEqual([]);
  });

  it("does not return restricted blocks from the active catalog by default", () => {
    expect(getActiveMethodologyBlocks().some((block) => block.exposureLevel === "restricted")).toBe(false);
  });

  it("requires curation hardening metadata on every active block", () => {
    for (const block of getActiveMethodologyBlocks()) {
      expect(block.version).toBe("1.1.0");
      expect(block.allowedUse.length).toBeGreaterThan(0);
      expect(block.notAllowedUse.length).toBeGreaterThan(0);
      expect(block.safeResponsePatterns?.length).toBeGreaterThan(0);
      expect(block.unsafeClaims?.length).toBeGreaterThan(0);
      expect(block.evidenceRequired?.length).toBeGreaterThan(0);
      expect(block.content.toLowerCase()).toContain("missing evidence handling");
    }
  });

  it("does not include global overclaiming phrases as actionable block guidance", () => {
    for (const block of getActiveMethodologyBlocks()) {
      const actionableText = [
        block.summary,
        block.content,
        block.safeResponsePatterns?.join("\n") ?? "",
        block.notAllowedUse.join("\n"),
      ].join("\n").toLowerCase();

      for (const phrase of GLOBAL_FORBIDDEN_OVERCLAIM_PHRASES) {
        expect(actionableText, `${block.id} contains forbidden phrase ${phrase}`).not.toContain(phrase.toLowerCase());
      }
    }
  });
});
