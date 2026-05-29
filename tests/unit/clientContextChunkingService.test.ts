import { describe, expect, it } from "vitest";
import {
  chunkClientContextText,
  countWords,
  summarizeChunkMetadata,
} from "../../src/server/assessments/clientContextChunkingService";

describe("client context chunking service", () => {
  it("returns no chunks for empty text", () => {
    expect(chunkClientContextText("   ")).toEqual([]);
  });

  it("preserves paragraph boundaries when possible", () => {
    const text = [
      Array.from({ length: 70 }, (_, index) => `renewal${index}`).join(" "),
      Array.from({ length: 70 }, (_, index) => `workload${index}`).join(" "),
      Array.from({ length: 70 }, (_, index) => `rollback${index}`).join(" "),
    ].join("\n\n");

    const chunks = chunkClientContextText(text, { maxChunkWords: 100, overlapWords: 0 });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].text).toContain("renewal0");
    expect(chunks[0].text).not.toContain("rollback0");
    expect(summarizeChunkMetadata(chunks).totalWords).toBeGreaterThanOrEqual(countWords(text));
  });

  it("splits oversized paragraphs safely", () => {
    const text = Array.from({ length: 260 }, (_, index) => `word${index}`).join(" ");
    const chunks = chunkClientContextText(text, { maxChunkWords: 100, overlapWords: 0 });

    expect(chunks).toHaveLength(3);
    expect(chunks.every((chunk) => chunk.wordCount <= 100)).toBe(true);
  });
});
