import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const publicCopyFiles = [
  "src/components/demo/MigrationReadinessReplay.tsx",
  "src/components/sample-report/SampleReportPage.tsx",
  "src/views/LandingPage.tsx",
  "src/app/vmware-to-proxmox-readiness/page.tsx",
];

function readPublicCopy() {
  return publicCopyFiles.map((file) => fs.readFileSync(path.join(process.cwd(), file), "utf8")).join("\n");
}

describe("EVIDENCE-8 public copy safety", () => {
  it("adds evidence expansion and migration plan messaging", () => {
    const copy = readPublicCopy();

    expect(copy).toContain("Evidence Expansion");
    expect(copy).toContain("Migration Recommendation Plan");
    expect(copy).toContain("Print-friendly PDFs");
  });

  it("does not introduce unsafe migration promises", () => {
    const copy = readPublicCopy().toLowerCase();
    const forbiddenPhrases = [
      "automatic migration",
      "automated migration tool",
      "guaranteed migration success",
      "guaranteed success",
      "validated cutover",
      "full public launch",
      "move vms automatically",
    ];

    for (const phrase of forbiddenPhrases) {
      expect(copy).not.toContain(phrase);
    }
  });
});
