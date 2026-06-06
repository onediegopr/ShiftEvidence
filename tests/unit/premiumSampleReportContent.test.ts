import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const generatorPath = path.join(repoRoot, "scripts/generate-public-sample-report.mjs");
const samplePagePath = path.join(repoRoot, "src/components/sample-report/SampleReportPage.tsx");
const samplePdfPath = path.join(repoRoot, "public/sample-reports/proxmox-migration-readiness-sample-report.pdf");
const versionedSamplePdfPath = path.join(repoRoot, "public/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf");

describe("public and premium sample reports", () => {
  it("keeps the sample generator aligned with differentiated public and premium sections", () => {
    const source = fs.readFileSync(generatorPath, "utf8");

    for (const requiredText of [
      "Public Synthetic Sample Report",
      "Full Premium Synthetic Sample Report",
      "PUBLIC SAMPLE MODULES",
      "Premium-only depth",
      "Storage Destination Readiness",
      "Licensing & Cost Exposure",
      "Business Continuity Risk",
      "Senior AI Advisor Q&A Highlights",
      "Project Memory / Decisions Captured",
      "VMware billable cores",
      "Proxmox annual cost",
      "EUR->USD",
      "no customer data",
    ]) {
      expect(source).toContain(requiredText);
    }

    expect(source).toContain("Datastores > 80%");
    expect(source).not.toContain("Datastores above 85%");
  });

  it("aligns the sample page CTA with the premium PDF", () => {
    const source = fs.readFileSync(samplePagePath, "utf8");

    expect(source).toContain("Full premium synthetic sample");
    expect(source).toContain("Download premium sample PDF");
    expect(source).toContain("/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf");
  });

  it("keeps the generated public PDF artifacts present", () => {
    const stats = fs.statSync(samplePdfPath);
    const versionedStats = fs.statSync(versionedSamplePdfPath);
    const sampleHash = crypto.createHash("sha256").update(fs.readFileSync(samplePdfPath)).digest("hex");
    const premiumHash = crypto.createHash("sha256").update(fs.readFileSync(versionedSamplePdfPath)).digest("hex");

    expect(stats.size).toBeGreaterThan(100_000);
    expect(versionedStats.size).toBeGreaterThan(100_000);
    expect(versionedStats.size).not.toBe(stats.size);
    expect(premiumHash).not.toBe(sampleHash);
  });
});
