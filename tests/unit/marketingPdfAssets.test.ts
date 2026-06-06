import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

const pdfAssets = [
  {
    label: "product brief v1",
    file: "public/marketing/shift-evidence-product-brief-v1.pdf",
    minBytes: 50_000,
    pageCount: 1,
  },
  {
    label: "product brochure v1",
    file: "public/marketing/shift-evidence-product-brochure-v1.pdf",
    minBytes: 100_000,
    pageCount: 10,
  },
  {
    label: "blueprint overview v1",
    file: "public/marketing/migration-blueprint-overview-v1.pdf",
    minBytes: 80_000,
    pageCount: 7,
  },
  {
    label: "product brief v2",
    file: "public/marketing/shift-evidence-product-brief-v2.pdf",
    minBytes: 50_000,
    pageCount: 1,
  },
  {
    label: "product brochure v2",
    file: "public/marketing/shift-evidence-product-brochure-v2.pdf",
    minBytes: 100_000,
    pageCount: 11,
  },
  {
    label: "blueprint overview v2",
    file: "public/marketing/migration-blueprint-overview-v2.pdf",
    minBytes: 80_000,
    pageCount: 8,
  },
] as const;

const linkSources = [
  "src/components/sample-report/SampleReportPage.tsx",
  "src/app/pricing/page.tsx",
  "src/app/vmware-to-proxmox-readiness/page.tsx",
  "src/components/demo/MigrationReadinessReplay.tsx",
] as const;

function read(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function readLatin1(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "latin1");
}

describe("marketing PDF assets", () => {
  it("keeps generated PDFs present, non-empty and page-count stable", () => {
    for (const asset of pdfAssets) {
      const absolutePath = path.join(repoRoot, asset.file);
      expect(fs.existsSync(absolutePath), `${asset.label} exists`).toBe(true);

      const stat = fs.statSync(absolutePath);
      expect(stat.size, `${asset.label} size`).toBeGreaterThan(asset.minBytes);

      const body = readLatin1(asset.file);
      expect(body.startsWith("%PDF"), `${asset.label} PDF header`).toBe(true);
      expect(body.match(/\/Type\s*\/Page\b/g)?.length ?? 0, `${asset.label} page count`).toBe(asset.pageCount);
    }
  });

  it("links the brochure system from relevant public pages", () => {
    const productBrochurePath = "/marketing/shift-evidence-product-brochure-v2.pdf";
    const blueprintOverviewPath = "/marketing/migration-blueprint-overview-v2.pdf";
    const legacyProductBrochurePath = "/marketing/shift-evidence-product-brochure-v1.pdf";
    const legacyBlueprintOverviewPath = "/marketing/migration-blueprint-overview-v1.pdf";

    const sources = Object.fromEntries(linkSources.map((source) => [source, read(source)]));

    expect(sources["src/components/sample-report/SampleReportPage.tsx"]).toContain(productBrochurePath);
    expect(sources["src/app/pricing/page.tsx"]).toContain(productBrochurePath);
    expect(sources["src/app/pricing/page.tsx"]).toContain(blueprintOverviewPath);
    expect(sources["src/app/vmware-to-proxmox-readiness/page.tsx"]).toContain(productBrochurePath);
    expect(sources["src/app/vmware-to-proxmox-readiness/page.tsx"]).toContain(blueprintOverviewPath);
    expect(sources["src/components/demo/MigrationReadinessReplay.tsx"]).toContain(productBrochurePath);

    for (const source of linkSources) {
      expect(sources[source]).not.toContain(legacyProductBrochurePath);
    }
    expect(sources["src/app/pricing/page.tsx"]).not.toContain(legacyBlueprintOverviewPath);
    expect(sources["src/app/vmware-to-proxmox-readiness/page.tsx"]).not.toContain(legacyBlueprintOverviewPath);
  });

  it("keeps pricing labels and safety claims aligned", () => {
    const generator = read("scripts/generate-marketing-pdfs.mjs");
    const docs = [
      read("docs/marketing-pdf-system.md"),
      read("docs/marketing-pdf-usage-snippets.md"),
      read("docs/marketing-pdf-hito-1.md"),
      read("docs/marketing-pdf-redesign-system-v2.md"),
      read("docs/marketing-pdf-redesign-hito-2.md"),
    ].join("\n");
    const combined = `${generator}\n${docs}`;

    expect(combined).toContain("USD 490");
    expect(combined).toContain("USD 1,500");
    expect(combined).toContain("From USD 3,500");
    expect(combined).toContain("From USD 799/month");

    const lower = combined.toLowerCase();
    expect(lower).toContain("no zero downtime");
    expect(lower).toContain("no automated migration execution");
    expect(lower).toContain("no production write");
    expect(lower).not.toMatch(/\bguarantees?\s+(a\s+)?migration/);
    expect(lower).not.toMatch(/\bautomatically\s+migrates?\b/);
    expect(lower).not.toMatch(/\bcomplete dependency discovery\b(?! (claim|without))/);
    expect(lower).not.toMatch(/\bverified backup posture\b(?! without)/);
  });
});
