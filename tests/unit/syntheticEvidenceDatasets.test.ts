import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PRINT_REPORT_THEME } from "../../src/server/reports/reportTheme";

const root = path.join(process.cwd(), "synthetic-data");
const indexPath = path.join(root, "index.json");
const requiredModules = [
  "rvtools/rvtools-like.csv",
  "vmware-enrichment/vmware-enrichment.json",
  "proxmox-target/proxmox-target.json",
  "backup-evidence/backup-evidence.json",
  "storage-san/storage-san.csv",
  "application-dependencies/application-dependencies.csv",
  "migration-plan/expected-gates.json",
  "expected-summaries/expected-summary.json",
];

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function listTextFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(dir, entry.name);
    return entry.isDirectory() ? listTextFiles(filePath) : [filePath];
  });
}

describe("synthetic evidence dataset library", () => {
  it("publishes an index and complete scenario evidence packs", () => {
    const index = readJson<{ scenarioCount: number; scenarios: Array<{ slug: string; planLevel: string; confidence: string }> }>(indexPath);

    expect(index.scenarioCount).toBeGreaterThanOrEqual(8);
    expect(index.scenarios).toHaveLength(index.scenarioCount);

    for (const scenario of index.scenarios) {
      const scenarioRoot = path.join(root, "scenarios", scenario.slug);
      expect(fs.existsSync(path.join(scenarioRoot, "manifest.json"))).toBe(true);
      expect(scenario.planLevel.length).toBeGreaterThan(0);
      expect(["low", "medium", "high"]).toContain(scenario.confidence);

      for (const modulePath of requiredModules) {
        expect(fs.existsSync(path.join(scenarioRoot, modulePath)), `${scenario.slug} missing ${modulePath}`).toBe(true);
      }
    }
  });

  it("keeps synthetic files free of obvious secrets and private-path markers", () => {
    const files = listTextFiles(root).filter((file) => /\.(csv|json|md)$/i.test(file));
    const forbidden = [
      /DATABASE_URL/i,
      /BETTER_AUTH_SECRET/i,
      /RESEND_API_KEY/i,
      /GEMINI_API_KEY/i,
      /OPENAI_API_KEY/i,
      /eyJ[a-zA-Z0-9_-]{20,}/,
      /C:\\Users\\/i,
      /\/home\/[^/\s]+/i,
      /storage\/uploads/i,
    ];

    for (const file of files) {
      const contents = fs.readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        expect(contents).not.toMatch(pattern);
      }
    }
  });

  it("uses a print-friendly global PDF theme", () => {
    expect(PRINT_REPORT_THEME.paper).toBe("#ffffff");
    expect(PRINT_REPORT_THEME.panel).toMatch(/^#f/i);
    expect(PRINT_REPORT_THEME.tableHeader).toMatch(/^#e/i);
    expect(Object.values(PRINT_REPORT_THEME)).not.toContain("#07111f");
    expect(Object.values(PRINT_REPORT_THEME)).not.toContain("#111827");
  });
});
