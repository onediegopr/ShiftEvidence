import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const collectorPath = path.join(
  process.cwd(),
  "public",
  "collectors",
  "vmware",
  "shift-vmware-evidence-collector.ps1",
);

describe("Shift Evidence VMware collector static safety", () => {
  const content = readFileSync(collectorPath, "utf8");

  it("exists with Shift Evidence ownership and read-only header", () => {
    expect(content).toContain("Shift Evidence VMware Enrichment Collector");
    expect(content).toContain("Copyright (c) Shift Evidence");
    expect(content).toContain("proprietary tooling");
    expect(content).toContain("read-only evidence collection");
    expect(content).toContain("does not modify infrastructure");
  });

  it("declares the expected collector schema and safety metadata", () => {
    expect(content).toContain("shift-evidence.vmware-enrichment.v1");
    expect(content).toContain("shift-vmware-evidence-collector");
    expect(content).toContain("persistentCredentialsStored = $false");
    expect(content).toContain("configurationChanged = $false");
    expect(content).toContain("rawSecretsIncluded = $false");
    expect(content).toContain("networkUploadPerformed = $false");
  });

  it("does not contain obvious infrastructure write commands", () => {
    const forbiddenCommands = [
      "Remove-VM",
      "Set-VM",
      "New-Snapshot",
      "Remove-Snapshot",
      "Set-TagAssignment",
      "New-VM",
      "Move-VM",
      "Set-VMHost",
      "New-Datastore",
      "Remove-Datastore",
      "Invoke-WebRequest",
      "Invoke-RestMethod",
    ];

    for (const command of forbiddenCommands) {
      expect(content).not.toMatch(new RegExp(`\\b${command}\\b`, "i"));
    }
  });
});
