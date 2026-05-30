import { describe, expect, it } from "vitest";
import {
  chunkStorageContextText,
  summarizeStorageChunkMetadata,
} from "../../src/server/assessments/storageContextChunkingService";

describe("storage context chunking service", () => {
  it("chunks long storage context safely", () => {
    const text = Array.from({ length: 260 }, (_, index) => `word${index}`).join(" ");
    const chunks = chunkStorageContextText(text, { maxChunkWords: 100, overlapWords: 10 });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.wordCount <= 110)).toBe(true);

    const metadata = summarizeStorageChunkMetadata(chunks);
    expect(metadata.chunkCount).toBe(chunks.length);
    expect(metadata.totalWords).toBeGreaterThan(260);
  });

  it("preserves paragraph boundaries where possible", () => {
    const text = "source datastore details\n\nbackup strategy details\n\ntarget storage notes";
    const chunks = chunkStorageContextText(text, { maxChunkWords: 4, overlapWords: 0 });

    expect(chunks[0]?.text).toContain("source datastore details");
    expect(chunks.some((chunk) => chunk.text.includes("backup strategy details"))).toBe(true);
  });
});
