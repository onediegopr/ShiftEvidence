import {
  countStorageContextCharacters,
  countStorageContextWords,
} from "./storageReadinessValidation";

export type StorageContextChunk = {
  index: number;
  text: string;
  wordCount: number;
  characterCount: number;
  startCharacter: number;
  endCharacter: number;
};

export type StorageContextChunkingOptions = {
  maxChunkWords?: number;
  overlapWords?: number;
};

const DEFAULT_MAX_CHUNK_WORDS = 1_800;
const DEFAULT_OVERLAP_WORDS = 80;

export function countWords(text: string) {
  return countStorageContextWords(text);
}

export function countCharacters(text: string) {
  return countStorageContextCharacters(text);
}

function splitParagraphs(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function takeOverlap(text: string, overlapWords: number) {
  if (overlapWords <= 0) {
    return "";
  }

  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.slice(-overlapWords).join(" ");
}

function splitOversizedParagraph(paragraph: string, maxChunkWords: number) {
  const words = paragraph.trim().split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let index = 0; index < words.length; index += maxChunkWords) {
    chunks.push(words.slice(index, index + maxChunkWords).join(" "));
  }

  return chunks;
}

export function chunkStorageContextText(
  text: string,
  options: StorageContextChunkingOptions = {},
): StorageContextChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  const maxChunkWords = Math.max(100, options.maxChunkWords ?? DEFAULT_MAX_CHUNK_WORDS);
  const overlapWords = Math.max(
    0,
    Math.min(options.overlapWords ?? DEFAULT_OVERLAP_WORDS, Math.floor(maxChunkWords / 4)),
  );
  const paragraphs = splitParagraphs(normalized).flatMap((paragraph) =>
    countWords(paragraph) > maxChunkWords
      ? splitOversizedParagraph(paragraph, maxChunkWords)
      : [paragraph],
  );

  const chunkTexts: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (countWords(candidate) <= maxChunkWords) {
      current = candidate;
      continue;
    }

    if (current) {
      chunkTexts.push(current);
      const overlap = takeOverlap(current, overlapWords);
      current = overlap ? `${overlap}\n\n${paragraph}` : paragraph;
    } else {
      chunkTexts.push(paragraph);
      current = "";
    }
  }

  if (current) {
    chunkTexts.push(current);
  }

  let searchFrom = 0;
  return chunkTexts.map((chunk, index) => {
    const firstLine = chunk.split(/\n/).find(Boolean) ?? chunk;
    const startCharacter = Math.max(0, normalized.indexOf(firstLine, searchFrom));
    const endCharacter = Math.min(normalized.length, startCharacter + chunk.length);
    searchFrom = endCharacter;

    return {
      index,
      text: chunk,
      wordCount: countWords(chunk),
      characterCount: countCharacters(chunk),
      startCharacter,
      endCharacter,
    };
  });
}

export function summarizeStorageChunkMetadata(chunks: StorageContextChunk[]) {
  return {
    chunkCount: chunks.length,
    totalWords: chunks.reduce((total, chunk) => total + chunk.wordCount, 0),
    totalCharacters: chunks.reduce((total, chunk) => total + chunk.characterCount, 0),
    maxChunkWords: chunks.reduce((max, chunk) => Math.max(max, chunk.wordCount), 0),
    maxChunkCharacters: chunks.reduce((max, chunk) => Math.max(max, chunk.characterCount), 0),
  };
}
