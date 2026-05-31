import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const generatorPath = path.join(repoRoot, "scripts/generate-public-sample-report.mjs");
const samplePagePath = path.join(repoRoot, "src/components/sample-report/SampleReportPage.tsx");
const samplePdfPath = path.join(repoRoot, "public/sample-reports/proxmox-migration-readiness-sample-report.pdf");
const versionedSamplePdfPath = path.join(repoRoot, "public/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf");

describe("premium public sample report", () => {
  it("keeps the public sample generator aligned with premium report sections", () => {
    const source = fs.readFileSync(generatorPath, "utf8");

    for (const requiredText of [
      "Full Premium Synthetic Sample Report",
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

    expect(source).toContain("Premium Sample Readiness Report");
    expect(source).toContain("Download full sample PDF");
    expect(source).toContain("/sample-reports/proxmox-migration-readiness-premium-sample-report-v2.pdf");
  });

  it("keeps the generated public PDF artifacts present", () => {
    const stats = fs.statSync(samplePdfPath);
    const versionedStats = fs.statSync(versionedSamplePdfPath);

    expect(stats.size).toBeGreaterThan(100_000);
    expect(versionedStats.size).toBe(stats.size);
  });
});
