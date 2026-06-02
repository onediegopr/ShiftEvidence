import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

function readIcoSizes(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  const count = buffer.readUInt16LE(4);
  const sizes: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const offset = 6 + index * 16;
    const width = buffer.readUInt8(offset) || 256;
    const height = buffer.readUInt8(offset + 1) || 256;
    sizes.push(`${width}x${height}`);
  }

  return sizes;
}

describe("favicon and app icon assets", () => {
  it("keeps generated app icons at the expected dimensions", async () => {
    const expected = [
      ["public/brand/shift-evidence-icon-badge.png", 1024, 1024],
      ["public/icon.png", 512, 512],
      ["public/apple-icon.png", 180, 180],
    ] as const;

    for (const [assetPath, width, height] of expected) {
      const fullPath = path.join(repoRoot, assetPath);
      const stats = fs.statSync(fullPath);
      const metadata = await sharp(fullPath).metadata();

      expect(stats.size, `${assetPath} should not be empty`).toBeGreaterThan(1000);
      expect(metadata.width).toBe(width);
      expect(metadata.height).toBe(height);
      expect(metadata.format).toBe("png");
    }
  });

  it("stores small favicon entries in the ICO file", () => {
    const sizes = readIcoSizes(path.join(repoRoot, "public/favicon.ico"));

    expect(sizes).toContain("16x16");
    expect(sizes).toContain("32x32");
    expect(sizes).toContain("48x48");
  });

  it("points metadata at public favicon and app icon assets", () => {
    const layoutSource = fs.readFileSync(path.join(repoRoot, "src/app/layout.tsx"), "utf8");

    expect(layoutSource).toContain("/favicon.ico");
    expect(layoutSource).toContain("/icon.png");
    expect(layoutSource).toContain("/apple-icon.png");
    expect(layoutSource).not.toContain("/favicon.svg");
  });
});
