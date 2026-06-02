import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const collectorPath = path.join(
  process.cwd(),
  "public",
  "collectors",
  "backup",
  "shift-veeam-backup-collector.ps1",
);

describe("Shift Evidence Veeam backup collector static safety", () => {
  const content = readFileSync(collectorPath, "utf8");
  const lower = content.toLowerCase();

  it("exists with Shift Evidence ownership and read-only header", () => {
    expect(content).toContain("Shift Evidence Veeam Backup Evidence Collector");
    expect(content).toContain("Copyright (c) Shift Evidence");
    expect(content).toContain("proprietary tooling");
    expect(content).toContain("read-only evidence collection");
    expect(content).toContain("does not modify backup jobs");
  });

  it("declares the expected collector schema and safety metadata", () => {
    expect(content).toContain("shift-evidence.backup-evidence.v1");
    expect(content).toContain("shift-veeam-backup-collector");
    expect(content).toContain("persistentCredentialsStored = $false");
    expect(content).toContain("configurationChanged = $false");
    expect(content).toContain("rawSecretsIncluded = $false");
    expect(content).toContain("networkUploadPerformed = $false");
    expect(content).toContain("jobsStarted = $false");
    expect(content).toContain("jobsStopped = $false");
    expect(content).toContain("restorePerformed = $false");
    expect(content).toContain("restorePointsDeleted = $false");
  });

  it("does not attempt external upload", () => {
    expect(lower).not.toContain("invoke-webrequest");
    expect(lower).not.toContain("invoke-restmethod");
    expect(lower).not.toContain("curl ");
    expect(lower).not.toContain("wget ");
  });

  it("does not contain obvious Veeam write commands", () => {
    const forbiddenCommands = [
      "Start-VBRJob",
      "Stop-VBRJob",
      "Remove-VBRJob",
      "Set-VBRJob",
      "Add-VBRJob",
      "Remove-VBRRestorePoint",
      "Start-VBRRestore",
      "Start-VBRInstantRecovery",
      "Remove-VBRBackup",
      "Set-VBRBackupRepository",
      "Remove-VBRBackupRepository",
      "Add-VBRBackupRepository",
      "Set-VBRCredentials",
      "Remove-VBRCredentials",
    ];

    for (const command of forbiddenCommands) {
      expect(content).not.toMatch(new RegExp(`\\b${command}\\b`, "i"));
    }
  });
});
