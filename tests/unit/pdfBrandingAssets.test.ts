import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

const activePdfGenerators = [
  "src/server/reports/reportPdfRenderer.ts",
  "src/server/reports/migrationPlanPdfRenderer.ts",
  "src/app/demo/reports/[scenario]/route.ts",
  "scripts/generate-public-sample-report.mjs",
] as const;

const stableBrandAssets = [
  "public/brand/shift-evidence-icon-light-transparent.png",
  "public/brand/shift-evidence-icon-dark-transparent.png",
  "public/brand/shift-evidence-icon-outline-transparent.png",
] as const;

describe("PDF/report branding assets", () => {
  it("keeps stable Shift Evidence brand assets available for PDF generation", () => {
    for (const asset of stableBrandAssets) {
      const assetPath = path.join(repoRoot, asset);
      const stats = fs.statSync(assetPath);

      expect(stats.size, `${asset} should be a real PNG asset`).toBeGreaterThan(10_000);
    }
  });

  it("uses stable brand asset paths in active PDF generators", () => {
    for (const file of activePdfGenerators) {
      const source = fs.readFileSync(path.join(repoRoot, file), "utf8");

      expect(source, `${file} should use a stable brand asset`).toContain("public");
      expect(source, `${file} should use a stable Shift Evidence icon`).toContain(
        "shift-evidence-icon-light-transparent.png",
      );
      expect(source, `${file} must not reference incoming temporary assets`).not.toMatch(/_incoming|ChatGPT Image|Logo Favicon/i);
      expect(source, `${file} must not use favicon as PDF logo`).not.toMatch(/favicon/i);
    }
  });
});
